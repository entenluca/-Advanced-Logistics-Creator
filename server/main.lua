AddEventHandler('onResourceStart', function(resource)
    if resource ~= GetCurrentResourceName() then return end
    Database.Init()
    print('^2[Advanced Logistics Creator]^0 Resource gestartet – /logisticcreator')
end)

-- Runtime: payout calculation helper for delivery resources
exports('CalculatePayout', function(jobPayout, distanceKm, options)
    options = options or {}
    local payout = jobPayout or Config.DefaultPayout
    local total = payout.baseSalary or 0
    total = total + (payout.perKm or 0) * (distanceKm or 0)
    total = total + (payout.perDelivery or 0)
    if options.onTime then total = total + (payout.timeBonus or 0) end
    if options.flawless then total = total + (payout.flawlessBonus or 0) end
    if options.difficult then total = total + (payout.difficultyBonus or 0) end
    return math.floor(total), payout.xpReward or 0
end)

exports('GetPlayerProgress', function(identifier)
    local row = MySQL.single.await('SELECT * FROM alc_player_progress WHERE identifier = ?', { identifier })
    return row or { xp = 0, level = 1, completed_deliveries = 0, total_earnings = 0 }
end)

exports('AddPlayerXp', function(identifier, xp)
    local progress = exports[GetCurrentResourceName()]:GetPlayerProgress(identifier)
    local newXp = (progress.xp or 0) + xp
    local newLevel = math.floor(newXp / 100) + 1
    MySQL.update.await([[
        INSERT INTO alc_player_progress (identifier, xp, level, completed_deliveries, total_earnings)
        VALUES (?, ?, ?, 0, 0)
        ON DUPLICATE KEY UPDATE xp = ?, level = ?
    ]], { identifier, newXp, newLevel, newXp, newLevel })
    return newXp, newLevel
end)
