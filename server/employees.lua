Employees = {}

function Employees.GetByJob(jobId)
    local rows = MySQL.query.await(
        'SELECT * FROM alc_employees WHERE job_id = ? ORDER BY rank_id DESC, hired_at ASC',
        { jobId }
    ) or {}
    for _, row in ipairs(rows) do
        row.active = row.active == 1
        local rank = Config.EmployeeRanks[row.rank_id] or Config.EmployeeRanks[2]
        row.rank_label = rank.label
        row.rank_level = rank.level
    end
    return rows
end

function Employees.GetAll()
    local rows = MySQL.query.await('SELECT * FROM alc_employees ORDER BY job_id ASC, rank_id DESC') or {}
    for _, row in ipairs(rows) do
        row.active = row.active == 1
        local rank = Config.EmployeeRanks[row.rank_id] or Config.EmployeeRanks[2]
        row.rank_label = rank.label
    end
    return rows
end

function Employees.Hire(jobId, identifier, playerName, rankId)
    local count = MySQL.scalar.await('SELECT COUNT(*) FROM alc_employees WHERE job_id = ?', { jobId }) or 0
    if count >= Config.Limits.maxEmployeesPerJob then return nil, 'max_employees' end

    local existing = MySQL.single.await(
        'SELECT id FROM alc_employees WHERE job_id = ? AND identifier = ?',
        { jobId, identifier }
    )
    if existing then return nil, 'already_hired' end

    local id = MySQL.insert.await([[
        INSERT INTO alc_employees (job_id, identifier, player_name, rank_id, driver_level, active)
        VALUES (?, ?, ?, ?, 1, 1)
    ]], { jobId, identifier, playerName or 'Unbekannt', rankId or 2 })

    MySQL.insert.await([[
        INSERT INTO alc_driver_stats (job_id, identifier, player_name)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE player_name = ?
    ]], { jobId, identifier, playerName or 'Unbekannt', playerName or 'Unbekannt' })

    return id
end

function Employees.Fire(employeeId)
    MySQL.update.await('UPDATE alc_employees SET active = 0 WHERE id = ?', { employeeId })
    return true
end

function Employees.Delete(employeeId)
    MySQL.update.await('DELETE FROM alc_employees WHERE id = ?', { employeeId })
    return true
end

function Employees.UpdateRank(employeeId, rankId, driverLevel)
    MySQL.update.await(
        'UPDATE alc_employees SET rank_id = ?, driver_level = ? WHERE id = ?',
        { rankId, driverLevel or 1, employeeId }
    )
    return true
end

function Employees.GetDriverHistory(identifier, jobId)
    return MySQL.query.await([[
        SELECT * FROM alc_order_history
        WHERE identifier = ? AND job_id = ?
        ORDER BY completed_at DESC LIMIT 50
    ]], { identifier, jobId }) or {}
end

lib.callback.register('alc:server:hireEmployee', function(source, data)
    if not Database.IsAdmin(source) then return { success = false } end
    if not data.job_id or not data.identifier then return { success = false, error = 'invalid' } end
    local id, err = Employees.Hire(data.job_id, data.identifier, data.player_name, data.rank_id)
    if not id then return { success = false, error = err } end
    Notifications.BroadcastJob(data.job_id, 'announcement', ('%s wurde eingestellt.'):format(data.player_name or 'Mitarbeiter'))
    return { success = true, id = id }
end)

lib.callback.register('alc:server:fireEmployee', function(source, employeeId)
    if not Database.IsAdmin(source) then return { success = false } end
    Employees.Fire(employeeId)
    return { success = true }
end)

lib.callback.register('alc:server:deleteEmployee', function(source, employeeId)
    if not Database.IsAdmin(source) then return { success = false } end
    Employees.Delete(employeeId)
    return { success = true }
end)

lib.callback.register('alc:server:updateEmployee', function(source, employeeId, data)
    if not Database.IsAdmin(source) then return { success = false } end
    Employees.UpdateRank(employeeId, data.rank_id, data.driver_level)
    return { success = true }
end)

lib.callback.register('alc:server:getEmployeeHistory', function(source, identifier, jobId)
    if not Database.IsAdmin(source) then return {} end
    return Employees.GetDriverHistory(identifier, jobId)
end)

lib.callback.register('alc:server:getOnlinePlayers', function(source)
    if not Database.IsAdmin(source) then return {} end
    local players = {}
    for _, playerId in ipairs(GetPlayers()) do
        local id = tonumber(playerId)
        players[#players + 1] = {
            source = id,
            name = Bridge.GetPlayerName(id),
            identifier = Bridge.GetIdentifier(id),
        }
    end
    return players
end)
