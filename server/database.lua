Database = {}

local function decodeJson(val, fallback)
    if not val or val == '' then return fallback end
    if type(val) == 'table' then return val end
    local ok, decoded = pcall(json.decode, val)
    return ok and decoded or fallback
end

local function encodeJson(val)
    return json.encode(val or {})
end

function Database.Init()
    local sql = LoadResourceFile(GetCurrentResourceName(), 'sql/install.sql')
    if not sql then return end
    for statement in sql:gmatch('[^;]+') do
        local trimmed = statement:match('^%s*(.-)%s*$')
        if trimmed and trimmed ~= '' then
            MySQL.query.await(trimmed)
        end
    end
end

function Database.IsAdmin(source)
    return IsPlayerAceAllowed(source, Config.AdminAce)
end

-- Jobs

function Database.GetJobs()
    local rows = MySQL.query.await('SELECT * FROM alc_jobs ORDER BY id ASC') or {}
    for _, row in ipairs(rows) do
        row.payout = decodeJson(row.payout, Config.DefaultPayout)
        row.faction_bound = row.faction_bound == 1
        row.active = row.active == 1
    end
    return rows
end

function Database.GetJob(id)
    local row = MySQL.single.await('SELECT * FROM alc_jobs WHERE id = ?', { id })
    if not row then return nil end
    row.payout = decodeJson(row.payout, Config.DefaultPayout)
    row.faction_bound = row.faction_bound == 1
    row.active = row.active == 1
    return row
end

function Database.CreateJob(data, createdBy)
    local count = MySQL.scalar.await('SELECT COUNT(*) FROM alc_jobs') or 0
    if count >= Config.Limits.maxJobs then return nil, 'max_jobs' end

    local id = MySQL.insert.await([[
        INSERT INTO alc_jobs (name, description, icon, min_level, faction_bound, faction_name, active, payout, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ]], {
        data.name,
        data.description or '',
        data.icon or 'truck',
        data.min_level or 0,
        data.faction_bound and 1 or 0,
        data.faction_name,
        data.active ~= false and 1 or 0,
        encodeJson(data.payout or Config.DefaultPayout),
        createdBy,
    })
    return id
end

function Database.UpdateJob(id, data)
    MySQL.update.await([[
        UPDATE alc_jobs SET
            name = ?, description = ?, icon = ?, min_level = ?,
            faction_bound = ?, faction_name = ?, active = ?, payout = ?
        WHERE id = ?
    ]], {
        data.name,
        data.description or '',
        data.icon or 'truck',
        data.min_level or 0,
        data.faction_bound and 1 or 0,
        data.faction_name,
        data.active ~= false and 1 or 0,
        encodeJson(data.payout or Config.DefaultPayout),
        id,
    })
    return true
end

function Database.DeleteJob(id)
    MySQL.update.await('DELETE FROM alc_jobs WHERE id = ?', { id })
    return true
end

-- Orders

function Database.GetOrders(jobId)
    local rows
    if jobId then
        rows = MySQL.query.await('SELECT * FROM alc_orders WHERE job_id = ? ORDER BY id ASC', { jobId }) or {}
    else
        rows = MySQL.query.await('SELECT * FROM alc_orders ORDER BY id ASC') or {}
    end
    for _, row in ipairs(rows) do
        row.start_point = decodeJson(row.start_point, {})
        row.end_point = decodeJson(row.end_point, {})
        row.active = row.active == 1
    end
    return rows
end

function Database.GetOrder(id)
    local row = MySQL.single.await('SELECT * FROM alc_orders WHERE id = ?', { id })
    if not row then return nil end
    row.start_point = decodeJson(row.start_point, {})
    row.end_point = decodeJson(row.end_point, {})
    row.active = row.active == 1
    return row
end

function Database.CreateOrder(data)
    local count = MySQL.scalar.await('SELECT COUNT(*) FROM alc_orders WHERE job_id = ?', { data.job_id }) or 0
    if count >= Config.Limits.maxOrdersPerJob then return nil, 'max_orders' end

    local id = MySQL.insert.await([[
        INSERT INTO alc_orders (job_id, title, description, order_type, start_point, end_point,
            time_limit, reward, bonus_payment, penalty, cooldown, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ]], {
        data.job_id,
        data.title,
        data.description or '',
        data.order_type or 'custom',
        encodeJson(data.start_point),
        encodeJson(data.end_point),
        data.time_limit or 0,
        data.reward or 0,
        data.bonus_payment or 0,
        data.penalty or 0,
        data.cooldown or 0,
        data.active ~= false and 1 or 0,
    })
    return id
end

function Database.UpdateOrder(id, data)
    MySQL.update.await([[
        UPDATE alc_orders SET
            title = ?, description = ?, order_type = ?, start_point = ?, end_point = ?,
            time_limit = ?, reward = ?, bonus_payment = ?, penalty = ?, cooldown = ?, active = ?
        WHERE id = ?
    ]], {
        data.title,
        data.description or '',
        data.order_type or 'custom',
        encodeJson(data.start_point),
        encodeJson(data.end_point),
        data.time_limit or 0,
        data.reward or 0,
        data.bonus_payment or 0,
        data.penalty or 0,
        data.cooldown or 0,
        data.active ~= false and 1 or 0,
        id,
    })
    return true
end

function Database.DeleteOrder(id)
    MySQL.update.await('DELETE FROM alc_orders WHERE id = ?', { id })
    return true
end

-- Routes

function Database.GetRoutes(orderId)
    local rows
    if orderId then
        rows = MySQL.query.await('SELECT * FROM alc_routes WHERE order_id = ? ORDER BY id ASC', { orderId }) or {}
    else
        rows = MySQL.query.await('SELECT * FROM alc_routes ORDER BY id ASC') or {}
    end
    for _, row in ipairs(rows) do
        row.start_point = decodeJson(row.start_point, {})
        row.end_point = decodeJson(row.end_point, {})
        row.waypoints = decodeJson(row.waypoints, {})
        row.vehicle_restrictions = decodeJson(row.vehicle_restrictions, {})
        row.gps_enabled = row.gps_enabled == 1
        row.random_select = row.random_select == 1
        row.show_waypoints = row.show_waypoints == 1
        row.active = row.active == 1
    end
    return rows
end

function Database.GetRoute(id)
    local row = MySQL.single.await('SELECT * FROM alc_routes WHERE id = ?', { id })
    if not row then return nil end
    row.start_point = decodeJson(row.start_point, {})
    row.end_point = decodeJson(row.end_point, {})
    row.waypoints = decodeJson(row.waypoints, {})
    row.vehicle_restrictions = decodeJson(row.vehicle_restrictions, {})
    row.gps_enabled = row.gps_enabled == 1
    row.random_select = row.random_select == 1
    row.show_waypoints = row.show_waypoints == 1
    row.active = row.active == 1
    return row
end

function Database.CreateRoute(data)
    local count = MySQL.scalar.await('SELECT COUNT(*) FROM alc_routes WHERE order_id = ?', { data.order_id }) or 0
    if count >= Config.Limits.maxRoutesPerOrder then return nil, 'max_routes' end

    local waypoints = data.waypoints or {}
    if #waypoints > Config.Limits.maxWaypointsPerRoute then return nil, 'max_waypoints' end

    local id = MySQL.insert.await([[
        INSERT INTO alc_routes (order_id, name, start_point, end_point, waypoints, gps_enabled,
            random_select, show_waypoints, distance, estimated_time, difficulty, vehicle_restrictions, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ]], {
        data.order_id,
        data.name,
        encodeJson(data.start_point),
        encodeJson(data.end_point),
        encodeJson(waypoints),
        data.gps_enabled ~= false and 1 or 0,
        data.random_select and 1 or 0,
        data.show_waypoints ~= false and 1 or 0,
        data.distance or 0,
        data.estimated_time or 0,
        data.difficulty or 'medium',
        encodeJson(data.vehicle_restrictions or {}),
        data.active ~= false and 1 or 0,
    })
    return id
end

function Database.UpdateRoute(id, data)
    MySQL.update.await([[
        UPDATE alc_routes SET
            name = ?, start_point = ?, end_point = ?, waypoints = ?, gps_enabled = ?,
            random_select = ?, show_waypoints = ?, distance = ?, estimated_time = ?,
            difficulty = ?, vehicle_restrictions = ?, active = ?
        WHERE id = ?
    ]], {
        data.name,
        encodeJson(data.start_point),
        encodeJson(data.end_point),
        encodeJson(data.waypoints or {}),
        data.gps_enabled ~= false and 1 or 0,
        data.random_select and 1 or 0,
        data.show_waypoints ~= false and 1 or 0,
        data.distance or 0,
        data.estimated_time or 0,
        data.difficulty or 'medium',
        encodeJson(data.vehicle_restrictions or {}),
        data.active ~= false and 1 or 0,
        id,
    })
    return true
end

function Database.DeleteRoute(id)
    MySQL.update.await('DELETE FROM alc_routes WHERE id = ?', { id })
    return true
end

-- Vehicle spawns

function Database.GetVehicleSpawns(jobId)
    local rows = MySQL.query.await('SELECT * FROM alc_vehicle_spawns WHERE job_id = ? ORDER BY id ASC', { jobId }) or {}
    for _, row in ipairs(rows) do
        row.coords = decodeJson(row.coords, {})
        row.active = row.active == 1
    end
    return rows
end

function Database.CreateVehicleSpawn(data)
    local count = MySQL.scalar.await('SELECT COUNT(*) FROM alc_vehicle_spawns WHERE job_id = ?', { data.job_id }) or 0
    if count >= Config.Limits.maxVehicleSpawnsPerJob then return nil, 'max_spawns' end

    local id = MySQL.insert.await([[
        INSERT INTO alc_vehicle_spawns (job_id, model, label, coords, heading, livery, active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ]], {
        data.job_id,
        data.model,
        data.label or data.model,
        encodeJson(data.coords),
        data.heading or 0,
        data.livery or -1,
        data.active ~= false and 1 or 0,
    })
    return id
end

function Database.UpdateVehicleSpawn(id, data)
    MySQL.update.await([[
        UPDATE alc_vehicle_spawns SET model = ?, label = ?, coords = ?, heading = ?, livery = ?, active = ?
        WHERE id = ?
    ]], {
        data.model,
        data.label or data.model,
        encodeJson(data.coords),
        data.heading or 0,
        data.livery or -1,
        data.active ~= false and 1 or 0,
        id,
    })
    return true
end

function Database.DeleteVehicleSpawn(id)
    MySQL.update.await('DELETE FROM alc_vehicle_spawns WHERE id = ?', { id })
    return true
end

-- Full export for NUI

function Database.GetFullData()
    local jobs = Database.GetJobs()
    local orders = Database.GetOrders()
    local routes = Database.GetRoutes()
    local spawns = MySQL.query.await('SELECT * FROM alc_vehicle_spawns ORDER BY id ASC') or {}

    for _, s in ipairs(spawns) do
        s.coords = decodeJson(s.coords, {})
        s.active = s.active == 1
    end

    return {
        jobs = jobs,
        orders = orders,
        routes = routes,
        vehicleSpawns = spawns,
        config = {
            orderTypes = Config.OrderTypes,
            difficulties = Config.RouteDifficulties,
            icons = Config.JobIcons,
            defaultPayout = Config.DefaultPayout,
            limits = Config.Limits,
        },
    }
end
