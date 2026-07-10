local isOpen = false

RegisterNetEvent('alc:client:openCreator', function()
    if isOpen then return end
    isOpen = true
    SetNuiFocus(true, true)
    SendNUIMessage({ action = 'open' })
end)

RegisterNUICallback('close', function(_, cb)
    isOpen = false
    SetNuiFocus(false, false)
    cb('ok')
end)

RegisterNUICallback('getData', function(_, cb)
    local data = lib.callback.await('alc:server:getData', false)
    cb(data or {})
end)

RegisterNUICallback('saveJob', function(payload, cb)
    local result = lib.callback.await('alc:server:saveJob', false, payload.data, payload.id)
    cb(result or { success = false })
end)

RegisterNUICallback('deleteJob', function(payload, cb)
    local result = lib.callback.await('alc:server:deleteJob', false, payload.id)
    cb(result or { success = false })
end)

RegisterNUICallback('saveOrder', function(payload, cb)
    local result = lib.callback.await('alc:server:saveOrder', false, payload.data, payload.id)
    cb(result or { success = false })
end)

RegisterNUICallback('deleteOrder', function(payload, cb)
    local result = lib.callback.await('alc:server:deleteOrder', false, payload.id)
    cb(result or { success = false })
end)

RegisterNUICallback('saveRoute', function(payload, cb)
    local result = lib.callback.await('alc:server:saveRoute', false, payload.data, payload.id)
    cb(result or { success = false })
end)

RegisterNUICallback('deleteRoute', function(payload, cb)
    local result = lib.callback.await('alc:server:deleteRoute', false, payload.id)
    cb(result or { success = false })
end)

RegisterNUICallback('saveVehicleSpawn', function(payload, cb)
    local result = lib.callback.await('alc:server:saveVehicleSpawn', false, payload.data, payload.id)
    cb(result or { success = false })
end)

RegisterNUICallback('deleteVehicleSpawn', function(payload, cb)
    local result = lib.callback.await('alc:server:deleteVehicleSpawn', false, payload.id)
    cb(result or { success = false })
end)

RegisterNUICallback('saveDepot', function(payload, cb)
    local result = lib.callback.await('alc:server:saveDepot', false, payload.data, payload.id)
    cb(result or { success = false })
end)

RegisterNUICallback('deleteDepot', function(payload, cb)
    local result = lib.callback.await('alc:server:deleteDepot', false, payload.id)
    cb(result or { success = false })
end)

RegisterNUICallback('hireEmployee', function(payload, cb)
    local result = lib.callback.await('alc:server:hireEmployee', false, payload.data)
    cb(result or { success = false })
end)

RegisterNUICallback('fireEmployee', function(payload, cb)
    local result = lib.callback.await('alc:server:fireEmployee', false, payload.id)
    cb(result or { success = false })
end)

RegisterNUICallback('deleteEmployee', function(payload, cb)
    local result = lib.callback.await('alc:server:deleteEmployee', false, payload.id)
    cb(result or { success = false })
end)

RegisterNUICallback('updateEmployee', function(payload, cb)
    local result = lib.callback.await('alc:server:updateEmployee', false, payload.id, payload.data)
    cb(result or { success = false })
end)

RegisterNUICallback('getEmployeeHistory', function(payload, cb)
    local result = lib.callback.await('alc:server:getEmployeeHistory', false, payload.identifier, payload.jobId)
    cb(result or {})
end)

RegisterNUICallback('getOnlinePlayers', function(_, cb)
    local result = lib.callback.await('alc:server:getOnlinePlayers', false)
    cb(result or {})
end)

RegisterNUICallback('getStatistics', function(_, cb)
    local result = lib.callback.await('alc:server:getStatistics', false)
    cb(result or {})
end)

RegisterNUICallback('sendAnnouncement', function(payload, cb)
    local result = lib.callback.await('alc:server:sendAnnouncement', false, payload.jobId, payload.message)
    cb(result or { success = false })
end)

RegisterNUICallback('getPlayerCoords', function(_, cb)
    local ped = PlayerPedId()
    local coords = GetEntityCoords(ped)
    local heading = GetEntityHeading(ped)
    cb({
        x = math.floor(coords.x * 100) / 100,
        y = math.floor(coords.y * 100) / 100,
        z = math.floor(coords.z * 100) / 100,
        heading = math.floor(heading * 100) / 100,
    })
end)

RegisterNUICallback('notify', function(payload, cb)
    Bridge.Notify(payload.message, payload.type or 'inform')
    cb('ok')
end)
