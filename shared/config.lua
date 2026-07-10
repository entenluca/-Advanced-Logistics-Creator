Config = {}

-- 'auto' | 'esx' | 'qb' | 'standalone'
Config.Framework = 'auto'

-- ACE permission required for /logisticcreator
Config.AdminAce = 'logisticcreator.admin'

-- Max values (server-side validation)
Config.Limits = {
    maxJobs = 100,
    maxOrdersPerJob = 50,
    maxRoutesPerOrder = 10,
    maxWaypointsPerRoute = 25,
    maxVehicleSpawnsPerJob = 20,
    maxPayout = 1000000,
    maxXp = 10000,
    maxCooldown = 86400,
    maxTimeLimit = 7200,
}

-- Default payout template for new jobs
Config.DefaultPayout = {
    baseSalary = 500,
    perKm = 25,
    perDelivery = 100,
    timeBonus = 100,
    flawlessBonus = 50,
    difficultyBonus = 75,
    xpReward = 50,
}

-- Order types available in the creator
Config.OrderTypes = {
    { id = 'pallet', label = 'Palettenlieferung', icon = 'box' },
    { id = 'container', label = 'Containertransport', icon = 'container' },
    { id = 'tanker', label = 'Tanker-Aufträge', icon = 'droplet' },
    { id = 'construction', label = 'Baustofflieferung', icon = 'hammer' },
    { id = 'food', label = 'Lebensmitteltransporte', icon = 'apple' },
    { id = 'hazmat', label = 'Gefahrguttransporte', icon = 'biohazard' },
    { id = 'special', label = 'Sondertransporte', icon = 'star' },
    { id = 'custom', label = 'Individuelle Aufträge', icon = 'edit' },
}

-- Route difficulty presets
Config.RouteDifficulties = {
    { id = 'easy', label = 'Einfach', multiplier = 1.0 },
    { id = 'medium', label = 'Mittel', multiplier = 1.25 },
    { id = 'hard', label = 'Schwer', multiplier = 1.5 },
    { id = 'expert', label = 'Experte', multiplier = 2.0 },
}

-- Company logo/icon presets
Config.JobIcons = {
    'truck', 'package', 'warehouse', 'shipping', 'cargo', 'delivery', 'logistics', 'freight',
}
