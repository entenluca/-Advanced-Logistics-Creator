lib.addCommand('logisticcreator', {
    help = 'Öffnet den Advanced Logistics Creator',
    restricted = false,
}, function(source)
    if source == 0 then
        print('[ALC] Dieser Befehl kann nur ingame verwendet werden.')
        return
    end

    if not Database.IsAdmin(source) then
        Bridge.Notify(source, 'Keine Berechtigung für den Logistics Creator.', 'error')
        return
    end

    TriggerClientEvent('alc:client:openCreator', source)
end)

RegisterCommand('logisticcreator', function(source)
    if source == 0 then return end
    if not Database.IsAdmin(source) then return end
    TriggerClientEvent('alc:client:openCreator', source)
end, false)
