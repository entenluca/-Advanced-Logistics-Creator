Bridge = {}

local function detectFramework()
    if Config.Framework ~= 'auto' then return Config.Framework end
    if GetResourceState('es_extended') == 'started' then return 'esx' end
    if GetResourceState('qb-core') == 'started' then return 'qb' end
    if GetResourceState('qbx_core') == 'started' then return 'qb' end
    return 'standalone'
end

Bridge.Framework = detectFramework()

function Bridge.GetIdentifier(source)
    if Bridge.Framework == 'esx' then
        local ESX = exports['es_extended']:getSharedObject()
        local xPlayer = ESX.GetPlayerFromId(source)
        return xPlayer and xPlayer.identifier or nil
    elseif Bridge.Framework == 'qb' then
        local QBCore = exports['qb-core']:GetCoreObject()
        local Player = QBCore.Functions.GetPlayer(source)
        return Player and Player.PlayerData.citizenid or nil
    end
    for _, id in ipairs(GetPlayerIdentifiers(source)) do
        if id:find('license:') then return id end
    end
    return nil
end

function Bridge.GetPlayerName(source)
    if Bridge.Framework == 'esx' then
        local ESX = exports['es_extended']:getSharedObject()
        local xPlayer = ESX.GetPlayerFromId(source)
        return xPlayer and xPlayer.getName() or GetPlayerName(source)
    elseif Bridge.Framework == 'qb' then
        local QBCore = exports['qb-core']:GetCoreObject()
        local Player = QBCore.Functions.GetPlayer(source)
        if Player then
            local c = Player.PlayerData.charinfo
            return ('%s %s'):format(c.firstname, c.lastname)
        end
    end
    return GetPlayerName(source)
end

function Bridge.AddMoney(source, amount, reason)
    if amount <= 0 then return end
    if Bridge.Framework == 'esx' then
        local ESX = exports['es_extended']:getSharedObject()
        local xPlayer = ESX.GetPlayerFromId(source)
        if xPlayer then xPlayer.addMoney(amount, reason or 'logistics') end
    elseif Bridge.Framework == 'qb' then
        local QBCore = exports['qb-core']:GetCoreObject()
        local Player = QBCore.Functions.GetPlayer(source)
        if Player then Player.Functions.AddMoney('cash', amount, reason or 'logistics') end
    end
end

function Bridge.Notify(source, message, nType)
    TriggerClientEvent('ox_lib:notify', source, {
        title = 'Logistik Creator',
        description = message,
        type = nType or 'inform',
    })
end
