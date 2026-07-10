-- Creator-specific client helpers (preview blips, etc.)

local previewBlips = {}

RegisterNUICallback('previewRoute', function(payload, cb)
    for _, blip in ipairs(previewBlips) do
        if DoesBlipExist(blip) then RemoveBlip(blip) end
    end
    previewBlips = {}

    local route = payload.route
    if not route then cb('ok') return end

    local function addPreviewBlip(coords, color, label)
        local blip = AddBlipForCoord(coords.x, coords.y, coords.z)
        SetBlipSprite(blip, 1)
        SetBlipColour(blip, color)
        SetBlipScale(blip, 0.8)
        BeginTextCommandSetBlipName('STRING')
        AddTextComponentString(label)
        EndTextCommandSetBlipName(blip)
        previewBlips[#previewBlips + 1] = blip
    end

    if route.start_point then addPreviewBlip(route.start_point, 2, 'Start (Vorschau)') end
    if route.waypoints then
        for i, wp in ipairs(route.waypoints) do
            addPreviewBlip(wp, 5, ('WP %d'):format(i))
        end
    end
    if route.end_point then addPreviewBlip(route.end_point, 3, 'Ziel (Vorschau)') end

    Bridge.Notify('Routen-Vorschau auf der Karte angezeigt', 'success')
    cb('ok')
end)

RegisterNUICallback('clearPreview', function(_, cb)
    for _, blip in ipairs(previewBlips) do
        if DoesBlipExist(blip) then RemoveBlip(blip) end
    end
    previewBlips = {}
    cb('ok')
end)
