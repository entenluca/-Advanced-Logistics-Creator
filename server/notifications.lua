Notifications = {}

function Notifications.Send(source, nType, message, data)
    TriggerClientEvent('alc:client:notify', source, {
        type = nType,
        message = message,
        data = data or {},
        timestamp = os.time(),
    })
end

function Notifications.BroadcastJob(jobId, nType, message)
    local employees = MySQL.query.await(
        'SELECT identifier FROM alc_employees WHERE job_id = ? AND active = 1',
        { jobId }
    ) or {}

    local employeeIds = {}
    for _, e in ipairs(employees) do
        employeeIds[e.identifier] = true
    end

    for _, playerId in ipairs(GetPlayers()) do
        local src = tonumber(playerId)
        local identifier = Bridge.GetIdentifier(src)
        if identifier and (employeeIds[identifier] or Database.IsAdmin(src)) then
            Notifications.Send(src, nType, message)
        end
    end
end

function Notifications.BroadcastAll(nType, message)
    TriggerClientEvent('alc:client:notify', -1, {
        type = nType,
        message = message,
        timestamp = os.time(),
    })
end

-- Runtime notification helpers
exports('NotifyPlayer', function(source, nType, message)
    Notifications.Send(source, nType, message)
end)

exports('NotifyNewOrder', function(jobId, orderTitle)
    Notifications.BroadcastJob(jobId, 'new_order', ('Neuer Auftrag: %s'):format(orderTitle or 'Unbekannt'))
end)

exports('NotifyOrderComplete', function(source, earnings)
    Notifications.Send(source, 'order_complete', ('Auftrag abgeschlossen! +%s$'):format(earnings or 0))
end)

exports('NotifyBonus', function(source, amount)
    Notifications.Send(source, 'bonus', ('Bonus erhalten: +%s$'):format(amount or 0))
end)

exports('NotifyVehicleReady', function(source, model)
    Notifications.Send(source, 'vehicle_ready', ('Fahrzeug bereit: %s'):format(model or ''))
end)

exports('NotifySalary', function(source, amount)
    Notifications.Send(source, 'salary', ('Gehalt ausgezahlt: %s$'):format(amount or 0))
end)

exports('NotifyAnnouncement', function(jobId, message)
    Notifications.BroadcastJob(jobId, 'announcement', message)
end)

lib.callback.register('alc:server:sendAnnouncement', function(source, jobId, message)
    if not Database.IsAdmin(source) then return { success = false } end
    if not message or message == '' then return { success = false } end
    Notifications.BroadcastJob(jobId, 'announcement', message)
    return { success = true }
end)
