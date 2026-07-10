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
    local res = GetCurrentResourceName()
    for _, file in ipairs({ 'sql/install.sql', 'sql/migrate_v2.sql' }) do
        local sql = LoadResourceFile(res, file)
        if sql then
            for statement in sql:gmatch('[^;]+') do
                local trimmed = statement:match('^%s*(.-)%s*$')
                if trimmed and trimmed ~= '' then
                    pcall(function() MySQL.query.await(trimmed) end)
                end
            end
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

local function decodeVehicleSpawn(row)
    row.coords = decodeJson(row.coords, {})
    row.active = row.active == 1
    row.is_rental = row.is_rental == 1
    row.fuel_level = row.fuel_level or 100
    row.vehicle_health = row.vehicle_health or 1000
    row.max_speed = row.max_speed or 0
    row.vehicle_type = row.vehicle_type or 'transporter'
    return row
end

function Database.GetVehicleSpawns(jobId)
    local rows
    if jobId then
        rows = MySQL.query.await('SELECT * FROM alc_vehicle_spawns WHERE job_id = ? ORDER BY id ASC', { jobId }) or {}
    else
        rows = MySQL.query.await('SELECT * FROM alc_vehicle_spawns ORDER BY id ASC') or {}
    end
    for i, row in ipairs(rows) do rows[i] = decodeVehicleSpawn(row) end
    return rows
end

function Database.CreateVehicleSpawn(data)
    local count = MySQL.scalar.await('SELECT COUNT(*) FROM alc_vehicle_spawns WHERE job_id = ?', { data.job_id }) or 0
    if count >= Config.Limits.maxVehicleSpawnsPerJob then return nil, 'max_spawns' end

    local id = MySQL.insert.await([[
        INSERT INTO alc_vehicle_spawns (job_id, model, label, vehicle_type, coords, heading, livery,
            plate, fuel_level, vehicle_health, max_speed, is_rental, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ]], {
        data.job_id,
        data.model,
        data.label or data.model,
        data.vehicle_type or 'transporter',
        encodeJson(data.coords),
        data.heading or 0,
        data.livery or -1,
        data.plate,
        data.fuel_level or 100,
        data.vehicle_health or 1000,
        data.max_speed or 0,
        data.is_rental and 1 or 0,
        data.active ~= false and 1 or 0,
    })
    return id
end

function Database.UpdateVehicleSpawn(id, data)
    MySQL.update.await([[
        UPDATE alc_vehicle_spawns SET model = ?, label = ?, vehicle_type = ?, coords = ?, heading = ?,
            livery = ?, plate = ?, fuel_level = ?, vehicle_health = ?, max_speed = ?, is_rental = ?, active = ?
        WHERE id = ?
    ]], {
        data.model,
        data.label or data.model,
        data.vehicle_type or 'transporter',
        encodeJson(data.coords),
        data.heading or 0,
        data.livery or -1,
        data.plate,
        data.fuel_level or 100,
        data.vehicle_health or 1000,
        data.max_speed or 0,
        data.is_rental and 1 or 0,
        data.active ~= false and 1 or 0,
        id,
    })
    return true
end

function Database.DeleteVehicleSpawn(id)
    MySQL.update.await('DELETE FROM alc_vehicle_spawns WHERE id = ?', { id })
    return true
end

-- Depots

local function decodeDepot(row)
    row.coords = decodeJson(row.coords, {})
    row.npc_coords = decodeJson(row.npc_coords, nil)
    row.teleport_coords = decodeJson(row.teleport_coords, nil)
    row.blip_enabled = row.blip_enabled == 1
    row.marker_enabled = row.marker_enabled == 1
    row.npc_enabled = row.npc_enabled == 1
    row.teleport_enabled = row.teleport_enabled == 1
    row.active = row.active == 1
    return row
end

function Database.GetDepots(jobId)
    local rows
    if jobId then
        rows = MySQL.query.await('SELECT * FROM alc_depots WHERE job_id = ? ORDER BY id ASC', { jobId }) or {}
    else
        rows = MySQL.query.await('SELECT * FROM alc_depots ORDER BY id ASC') or {}
    end
    for i, row in ipairs(rows) do rows[i] = decodeDepot(row) end
    return rows
end

function Database.CreateDepot(data)
    local count = MySQL.scalar.await('SELECT COUNT(*) FROM alc_depots WHERE job_id = ?', { data.job_id }) or 0
    if count >= Config.Limits.maxDepotsPerJob then return nil, 'max_depots' end

    local id = MySQL.insert.await([[
        INSERT INTO alc_depots (job_id, name, depot_type, coords, heading, blip_enabled, blip_sprite,
            blip_color, blip_label, marker_enabled, marker_type, marker_size, npc_enabled, npc_model,
            npc_coords, teleport_enabled, teleport_coords, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ]], {
        data.job_id, data.name, data.depot_type or 'logistics_center',
        encodeJson(data.coords), data.heading or 0,
        data.blip_enabled ~= false and 1 or 0, data.blip_sprite or 473, data.blip_color or 3,
        data.blip_label or data.name, data.marker_enabled ~= false and 1 or 0,
        data.marker_type or 1, data.marker_size or 1.5,
        data.npc_enabled and 1 or 0, data.npc_model or 's_m_m_trucker_01',
        data.npc_coords and encodeJson(data.npc_coords) or nil,
        data.teleport_enabled and 1 or 0,
        data.teleport_coords and encodeJson(data.teleport_coords) or nil,
        data.active ~= false and 1 or 0,
    })
    TriggerClientEvent('alc:client:refreshDepots', -1)
    return id
end

function Database.UpdateDepot(id, data)
    MySQL.update.await([[
        UPDATE alc_depots SET job_id = ?, name = ?, depot_type = ?, coords = ?, heading = ?,
            blip_enabled = ?, blip_sprite = ?, blip_color = ?, blip_label = ?,
            marker_enabled = ?, marker_type = ?, marker_size = ?,
            npc_enabled = ?, npc_model = ?, npc_coords = ?,
            teleport_enabled = ?, teleport_coords = ?, active = ?
        WHERE id = ?
    ]], {
        data.job_id, data.name, data.depot_type or 'logistics_center',
        encodeJson(data.coords), data.heading or 0,
        data.blip_enabled ~= false and 1 or 0, data.blip_sprite or 473, data.blip_color or 3,
        data.blip_label or data.name, data.marker_enabled ~= false and 1 or 0,
        data.marker_type or 1, data.marker_size or 1.5,
        data.npc_enabled and 1 or 0, data.npc_model or 's_m_m_trucker_01',
        data.npc_coords and encodeJson(data.npc_coords) or nil,
        data.teleport_enabled and 1 or 0,
        data.teleport_coords and encodeJson(data.teleport_coords) or nil,
        data.active ~= false and 1 or 0, id,
    })
    TriggerClientEvent('alc:client:refreshDepots', -1)
    return true
end

function Database.DeleteDepot(id)
    MySQL.update.await('DELETE FROM alc_depots WHERE id = ?', { id })
    TriggerClientEvent('alc:client:refreshDepots', -1)
    return true
end

-- Full export for NUI

function Database.GetFullData()
    return {
        jobs = Database.GetJobs(),
        orders = Database.GetOrders(),
        routes = Database.GetRoutes(),
        vehicleSpawns = Database.GetVehicleSpawns(),
        depots = Database.GetDepots(),
        employees = Employees.GetAll(),
        statistics = Statistics.GetGlobalStats(),
        config = {
            orderTypes = Config.OrderTypes,
            difficulties = Config.RouteDifficulties,
            icons = Config.JobIcons,
            vehicleTypes = Config.VehicleTypes,
            depotTypes = Config.DepotTypes,
            employeeRanks = Config.EmployeeRanks,
            notificationTypes = Config.NotificationTypes,
            defaultPayout = Config.DefaultPayout,
            limits = Config.Limits,
            defaultLocale = Config.DefaultLocale,
        },
    }
end
