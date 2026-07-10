-- Placement mode: admin sets coordinates in-world while NUI is minimized

local placementActive = false
local placementCallback = nil

RegisterNUICallback('startPlacement', function(payload, cb)
    placementActive = true
    placementCallback = payload.placementType or 'point'
    SendNUIMessage({ action = 'placementStart' })
    SetNuiFocus(false, false)
    Bridge.Notify('Position mit [E] bestätigen, [BACKSPACE] abbrechen', 'inform')
    cb('ok')
end)

CreateThread(function()
    while true do
        if placementActive then
            local ped = PlayerPedId()
            local coords = GetEntityCoords(ped)
            local heading = GetEntityHeading(ped)

            DrawMarker(1, coords.x, coords.y, coords.z - 1.0, 0, 0, 0, 0, 0, 0,
                2.0, 2.0, 1.0, 59, 130, 246, 120, false, false, 2, false, nil, nil, false)

            SetTextComponentFormat('STRING')
            AddTextComponentString('~b~[E]~w~ Position setzen  ~r~[BACKSPACE]~w~ Abbrechen')
            DisplayHelpTextFromStringLabel(0, false, true, -1)

            if IsControlJustPressed(0, 38) then -- E
                placementActive = false
                SetNuiFocus(true, true)
                SendNUIMessage({
                    action = 'placementEnd',
                    subAction = 'placementResult',
                    coords = {
                        x = math.floor(coords.x * 100) / 100,
                        y = math.floor(coords.y * 100) / 100,
                        z = math.floor(coords.z * 100) / 100,
                        heading = math.floor(heading * 100) / 100,
                    },
                    type = placementCallback,
                })
                placementCallback = nil
            elseif IsControlJustPressed(0, 177) then -- BACKSPACE
                placementActive = false
                SetNuiFocus(true, true)
                SendNUIMessage({ action = 'placementEnd', subAction = 'placementCancelled' })
                placementCallback = nil
            end
            Wait(0)
        else
            Wait(500)
        end
    end
end)
