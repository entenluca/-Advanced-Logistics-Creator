local toastQueue = {}

RegisterNetEvent('alc:client:notify', function(payload)
    SendNUIMessage({
        action = 'toast',
        type = payload.type or 'announcement',
        message = payload.message or '',
        timestamp = payload.timestamp or os.time(),
    })

    if Bridge and Bridge.Notify then
        Bridge.Notify(payload.message, payload.type == 'order_complete' and 'success' or 'inform')
    end
end)

RegisterNUICallback('getNotifications', function(_, cb)
    cb(Config.NotificationTypes or {})
end)

exports('SendToast', function(nType, message)
    SendNUIMessage({ action = 'toast', type = nType, message = message })
end)
