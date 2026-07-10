local depotBlips = {}
local depotNpcs = {}
local depotData = {}

local function clearDepots()
    for _, blip in ipairs(depotBlips) do
        if DoesBlipExist(blip) then RemoveBlip(blip) end
    end
    for _, ped in ipairs(depotNpcs) do
        if DoesEntityExist(ped) then DeleteEntity(ped) end
    end
    depotBlips = {}
    depotNpcs = {}
    depotData = {}
end

local function spawnDepotNpc(depot)
    if not depot.npc_enabled or not depot.npc_coords then return end
    local model = joaat(depot.npc_model or 's_m_m_trucker_01')
    lib.requestModel(model)
    local c = depot.npc_coords
    local ped = CreatePed(4, model, c.x, c.y, c.z - 1.0, depot.heading or 0.0, false, true)
    SetEntityInvincible(ped, true)
    SetBlockingOfNonTemporaryEvents(ped, true)
    FreezeEntityPosition(ped, true)
    depotNpcs[#depotNpcs + 1] = ped
    SetModelAsNoLongerNeeded(model)
end

local function createDepotBlip(depot)
    if not depot.blip_enabled then return end
    local c = depot.coords
    local blip = AddBlipForCoord(c.x, c.y, c.z)
    SetBlipSprite(blip, depot.blip_sprite or 473)
    SetBlipColour(blip, depot.blip_color or 3)
    SetBlipScale(blip, 0.85)
    SetBlipAsShortRange(blip, true)
    BeginTextCommandSetBlipName('STRING')
    AddTextComponentString(depot.blip_label or depot.name or 'Depot')
    EndTextCommandSetBlipName(blip)
    depotBlips[#depotBlips + 1] = blip
end

function RefreshDepots()
    clearDepots()
    local depots = lib.callback.await('alc:server:getDepotsPublic', false)
    if not depots then return end

    for _, depot in ipairs(depots) do
        if depot.active then
            depotData[#depotData + 1] = depot
            createDepotBlip(depot)
            spawnDepotNpc(depot)
        end
    end
end

CreateThread(function()
    Wait(2000)
    RefreshDepots()
end)

RegisterNetEvent('alc:client:refreshDepots', function()
    RefreshDepots()
end)

CreateThread(function()
    while true do
        local sleep = 1000
        local ped = PlayerPedId()
        local pos = GetEntityCoords(ped)

        for _, depot in ipairs(depotData) do
            if depot.marker_enabled and depot.coords then
                local c = depot.coords
                local dist = #(pos - vector3(c.x, c.y, c.z))
                if dist < 50.0 then
                    sleep = 0
                    DrawMarker(
                        depot.marker_type or 1,
                        c.x, c.y, c.z - 1.0,
                        0, 0, 0, 0, 0, 0,
                        depot.marker_size or 1.5, depot.marker_size or 1.5, 1.0,
                        59, 130, 246, 120,
                        false, false, 2, false, nil, nil, false
                    )
                    if dist < 2.0 and depot.teleport_enabled and depot.teleport_coords then
                        local tc = depot.teleport_coords
                        SetTextComponentFormat('STRING')
                        AddTextComponentString('~b~[E]~w~ Teleport')
                        DisplayHelpTextFromStringLabel(0, false, true, -1)
                        if IsControlJustPressed(0, 38) then
                            SetEntityCoords(ped, tc.x, tc.y, tc.z, false, false, false, false)
                        end
                    end
                end
            end
        end
        Wait(sleep)
    end
end)

exports('RefreshDepots', RefreshDepots)
