-- GPS navigation for logistics routes (runtime helper)

local activeRoute = nil
local routeBlips = {}

local function clearRouteBlips()
    for _, blip in ipairs(routeBlips) do
        if DoesBlipExist(blip) then RemoveBlip(blip) end
    end
    routeBlips = {}
end

function StartRouteNavigation(route)
    clearRouteBlips()
    activeRoute = route
    if not route or not route.gps_enabled then return end

    local start = route.start_point
    local startBlip = AddBlipForCoord(start.x, start.y, start.z)
    SetBlipSprite(startBlip, 1)
    SetBlipColour(startBlip, 2)
    SetBlipRoute(startBlip, true)
    BeginTextCommandSetBlipName('STRING')
    AddTextComponentString('Start')
    EndTextCommandSetBlipName(startBlip)
    routeBlips[#routeBlips + 1] = startBlip

    if route.show_waypoints and route.waypoints then
        for i, wp in ipairs(route.waypoints) do
            local blip = AddBlipForCoord(wp.x, wp.y, wp.z)
            SetBlipSprite(blip, 1)
            SetBlipColour(blip, 5)
            SetBlipScale(blip, 0.7)
            BeginTextCommandSetBlipName('STRING')
            AddTextComponentString(('Wegpunkt %d'):format(i))
            EndTextCommandSetBlipName(blip)
            routeBlips[#routeBlips + 1] = blip
        end
    end

    local endPt = route.end_point
    local endBlip = AddBlipForCoord(endPt.x, endPt.y, endPt.z)
    SetBlipSprite(endBlip, 1)
    SetBlipColour(endBlip, 3)
    BeginTextCommandSetBlipName('STRING')
    AddTextComponentString('Ziel')
    EndTextCommandSetBlipName(endBlip)
    routeBlips[#routeBlips + 1] = endBlip
end

function StopRouteNavigation()
    clearRouteBlips()
    activeRoute = nil
end

exports('StartRouteNavigation', StartRouteNavigation)
exports('StopRouteNavigation', StopRouteNavigation)
exports('GetActiveRoute', function() return activeRoute end)

RegisterNetEvent('alc:client:startNavigation', function(route)
    StartRouteNavigation(route)
end)

RegisterNetEvent('alc:client:stopNavigation', function()
    StopRouteNavigation()
end)
