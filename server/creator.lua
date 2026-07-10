Creator = {}

local function clamp(val, min, max)
    val = tonumber(val) or 0
    if val < min then return min end
    if val > max then return max end
    return val
end

local function validateCoords(coords)
    if type(coords) ~= 'table' then return false end
    local x, y, z = tonumber(coords.x), tonumber(coords.y), tonumber(coords.z)
    if not x or not y or not z then return false end
    if math.abs(x) > 10000 or math.abs(y) > 10000 or z < -500 or z > 2000 then return false end
    return true, { x = x, y = y, z = z }
end

local function validatePayout(payout)
    payout = payout or {}
    return {
        baseSalary = clamp(payout.baseSalary, 0, Config.Limits.maxPayout),
        perKm = clamp(payout.perKm, 0, Config.Limits.maxPayout),
        perDelivery = clamp(payout.perDelivery, 0, Config.Limits.maxPayout),
        timeBonus = clamp(payout.timeBonus, 0, Config.Limits.maxPayout),
        flawlessBonus = clamp(payout.flawlessBonus, 0, Config.Limits.maxPayout),
        difficultyBonus = clamp(payout.difficultyBonus, 0, Config.Limits.maxPayout),
        xpReward = clamp(payout.xpReward, 0, Config.Limits.maxXp),
    }
end

local function requireAdmin(source)
    if not Database.IsAdmin(source) then
        return false
    end
    return true
end

function Creator.ValidateJob(data)
    if not data.name or data.name == '' or #data.name > 64 then return false, 'invalid_name' end
    data.min_level = clamp(data.min_level, 0, 999)
    data.payout = validatePayout(data.payout)
    return true, data
end

function Creator.ValidateOrder(data)
    if not data.job_id or not data.title or data.title == '' then return false, 'invalid_order' end
    local okStart, startPt = validateCoords(data.start_point)
    local okEnd, endPt = validateCoords(data.end_point)
    if not okStart or not okEnd then return false, 'invalid_coords' end
    data.start_point = startPt
    data.end_point = endPt
    data.time_limit = clamp(data.time_limit, 0, Config.Limits.maxTimeLimit)
    data.reward = clamp(data.reward, 0, Config.Limits.maxPayout)
    data.bonus_payment = clamp(data.bonus_payment, 0, Config.Limits.maxPayout)
    data.penalty = clamp(data.penalty, 0, Config.Limits.maxPayout)
    data.cooldown = clamp(data.cooldown, 0, Config.Limits.maxCooldown)
    return true, data
end

function Creator.ValidateRoute(data)
    if not data.order_id or not data.name or data.name == '' then return false, 'invalid_route' end
    local okStart, startPt = validateCoords(data.start_point)
    local okEnd, endPt = validateCoords(data.end_point)
    if not okStart or not okEnd then return false, 'invalid_coords' end
    data.start_point = startPt
    data.end_point = endPt
    data.waypoints = data.waypoints or {}
    if #data.waypoints > Config.Limits.maxWaypointsPerRoute then return false, 'max_waypoints' end
    local validWaypoints = {}
    for _, wp in ipairs(data.waypoints) do
        local ok, pt = validateCoords(wp)
        if ok then validWaypoints[#validWaypoints + 1] = pt end
    end
    data.waypoints = validWaypoints
    return true, data
end

function Creator.ValidateVehicleSpawn(data)
    if not data.job_id or not data.model or data.model == '' then return false, 'invalid_spawn' end
    local ok, coords = validateCoords(data.coords)
    if not ok then return false, 'invalid_coords' end
    data.coords = coords
    data.heading = clamp(data.heading, 0, 360)
    return true, data
end

-- Callbacks

lib.callback.register('alc:server:getData', function(source)
    if not requireAdmin(source) then return nil end
    return Database.GetFullData()
end)

lib.callback.register('alc:server:saveJob', function(source, data, jobId)
    if not requireAdmin(source) then return { success = false, error = 'no_permission' } end
    local ok, validated = Creator.ValidateJob(data)
    if not ok then return { success = false, error = validated } end

    if jobId then
        Database.UpdateJob(jobId, validated)
        return { success = true, id = jobId }
    end

    local id, err = Database.CreateJob(validated, Bridge.GetIdentifier(source))
    if not id then return { success = false, error = err } end
    return { success = true, id = id }
end)

lib.callback.register('alc:server:deleteJob', function(source, jobId)
    if not requireAdmin(source) then return { success = false } end
    Database.DeleteJob(jobId)
    return { success = true }
end)

lib.callback.register('alc:server:saveOrder', function(source, data, orderId)
    if not requireAdmin(source) then return { success = false, error = 'no_permission' } end
    local ok, validated = Creator.ValidateOrder(data)
    if not ok then return { success = false, error = validated } end

    if orderId then
        Database.UpdateOrder(orderId, validated)
        return { success = true, id = orderId }
    end

    local id, err = Database.CreateOrder(validated)
    if not id then return { success = false, error = err } end
    return { success = true, id = id }
end)

lib.callback.register('alc:server:deleteOrder', function(source, orderId)
    if not requireAdmin(source) then return { success = false } end
    Database.DeleteOrder(orderId)
    return { success = true }
end)

lib.callback.register('alc:server:saveRoute', function(source, data, routeId)
    if not requireAdmin(source) then return { success = false, error = 'no_permission' } end
    local ok, validated = Creator.ValidateRoute(data)
    if not ok then return { success = false, error = validated } end

    if routeId then
        Database.UpdateRoute(routeId, validated)
        return { success = true, id = routeId }
    end

    local id, err = Database.CreateRoute(validated)
    if not id then return { success = false, error = err } end
    return { success = true, id = id }
end)

lib.callback.register('alc:server:deleteRoute', function(source, routeId)
    if not requireAdmin(source) then return { success = false } end
    Database.DeleteRoute(routeId)
    return { success = true }
end)

lib.callback.register('alc:server:saveVehicleSpawn', function(source, data, spawnId)
    if not requireAdmin(source) then return { success = false, error = 'no_permission' } end
    local ok, validated = Creator.ValidateVehicleSpawn(data)
    if not ok then return { success = false, error = validated } end

    if spawnId then
        Database.UpdateVehicleSpawn(spawnId, validated)
        return { success = true, id = spawnId }
    end

    local id, err = Database.CreateVehicleSpawn(validated)
    if not id then return { success = false, error = err } end
    return { success = true, id = id }
end)

lib.callback.register('alc:server:deleteVehicleSpawn', function(source, spawnId)
    if not requireAdmin(source) then return { success = false } end
    Database.DeleteVehicleSpawn(spawnId)
    return { success = true }
end)

-- Exports for other resources

exports('GetJobs', function() return Database.GetJobs() end)
exports('GetActiveJobs', function()
    local jobs = Database.GetJobs()
    local active = {}
    for _, j in ipairs(jobs) do
        if j.active then active[#active + 1] = j end
    end
    return active
end)
exports('GetOrders', function(jobId) return Database.GetOrders(jobId) end)
exports('GetRoutes', function(orderId) return Database.GetRoutes(orderId) end)
exports('GetVehicleSpawns', function(jobId) return Database.GetVehicleSpawns(jobId) end)
