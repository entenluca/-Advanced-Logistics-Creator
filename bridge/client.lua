Bridge = {}

local function detectFramework()
    if Config.Framework ~= 'auto' then return Config.Framework end
    if GetResourceState('es_extended') == 'started' then return 'esx' end
    if GetResourceState('qb-core') == 'started' then return 'qb' end
    if GetResourceState('qbx_core') == 'started' then return 'qb' end
    return 'standalone'
end

Bridge.Framework = detectFramework()

function Bridge.Notify(message, nType)
    if lib and lib.notify then
        lib.notify({ title = 'Logistik Creator', description = message, type = nType or 'inform' })
        return
    end
    BeginTextCommandThefeedPost('STRING')
    AddTextComponentSubstringPlayerName(message)
    EndTextCommandThefeedPostTicker(false, true)
end

function Bridge.GetPlayerJob()
    if Bridge.Framework == 'esx' then
        local ESX = exports['es_extended']:getSharedObject()
        local data = ESX.GetPlayerData()
        return data and data.job and data.job.name or nil
    elseif Bridge.Framework == 'qb' then
        local QBCore = exports['qb-core']:GetCoreObject()
        local data = QBCore.Functions.GetPlayerData()
        return data and data.job and data.job.name or nil
    end
    return nil
end
