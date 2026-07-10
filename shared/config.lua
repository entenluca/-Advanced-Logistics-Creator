Config = {}

Config.Framework = 'auto'
Config.AdminAce = 'logisticcreator.admin'
Config.DefaultLocale = 'de'

Config.Limits = {
    maxJobs = 100,
    maxOrdersPerJob = 50,
    maxRoutesPerOrder = 10,
    maxWaypointsPerRoute = 25,
    maxVehicleSpawnsPerJob = 30,
    maxDepotsPerJob = 25,
    maxEmployeesPerJob = 100,
    maxPayout = 1000000,
    maxXp = 10000,
    maxCooldown = 86400,
    maxTimeLimit = 7200,
    maxPlateLength = 8,
}

Config.DefaultPayout = {
    baseSalary = 500,
    perKm = 25,
    perDelivery = 100,
    timeBonus = 100,
    flawlessBonus = 50,
    difficultyBonus = 75,
    xpReward = 50,
}

-- Supported vehicle types
Config.VehicleTypes = {
    { id = 'transporter', label = 'Transporter', icon = 'delivery' },
    { id = 'lkw', label = 'LKW', icon = 'truck' },
    { id = 'semitruck', label = 'Sattelzugmaschinen', icon = 'freight' },
    { id = 'tanker', label = 'Tankwagen', icon = 'droplet' },
    { id = 'refrigerated', label = 'Kühltransporter', icon = 'package' },
    { id = 'container', label = 'Container-LKW', icon = 'container' },
    { id = 'special', label = 'Spezialfahrzeuge', icon = 'star' },
}

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

Config.RouteDifficulties = {
    { id = 'easy', label = 'Einfach', multiplier = 1.0 },
    { id = 'medium', label = 'Mittel', multiplier = 1.25 },
    { id = 'hard', label = 'Schwer', multiplier = 1.5 },
    { id = 'expert', label = 'Experte', multiplier = 2.0 },
}

Config.JobIcons = {
    'truck', 'package', 'warehouse', 'shipping', 'cargo', 'delivery', 'logistics', 'freight',
}

-- Depot & company location types
Config.DepotTypes = {
    { id = 'logistics_center', label = 'Logistikzentrum', icon = 'warehouse', blipSprite = 473, blipColor = 3 },
    { id = 'warehouse', label = 'Lagerhaus', icon = 'package', blipSprite = 473, blipColor = 5 },
    { id = 'company_site', label = 'Firmenstandort', icon = 'clipboard', blipSprite = 408, blipColor = 2 },
    { id = 'vehicle_depot', label = 'Fahrzeugdepot', icon = 'truck', blipSprite = 477, blipColor = 4 },
    { id = 'gas_station', label = 'Tankstelle', icon = 'droplet', blipSprite = 361, blipColor = 1 },
    { id = 'repair_point', label = 'Reparaturpunkt', icon = 'hammer', blipSprite = 402, blipColor = 47 },
}

-- Employee rank system
Config.EmployeeRanks = {
    { id = 1, label = 'Praktikant', level = 1, permissions = { 'drive' } },
    { id = 2, label = 'Fahrer', level = 2, permissions = { 'drive', 'orders' } },
    { id = 3, label = 'Senior-Fahrer', level = 3, permissions = { 'drive', 'orders', 'vehicles' } },
    { id = 4, label = 'Dispatcher', level = 4, permissions = { 'drive', 'orders', 'vehicles', 'assign' } },
    { id = 5, label = 'Manager', level = 5, permissions = { 'drive', 'orders', 'vehicles', 'assign', 'hire' } },
}

-- Notification types for UI
Config.NotificationTypes = {
    { id = 'new_order', label = 'Neue Aufträge', icon = 'package' },
    { id = 'order_complete', label = 'Auftrag abgeschlossen', icon = 'check' },
    { id = 'bonus', label = 'Bonus erhalten', icon = 'dollar' },
    { id = 'vehicle_ready', label = 'Fahrzeug bereit', icon = 'truck' },
    { id = 'salary', label = 'Gehalt ausgezahlt', icon = 'dollar' },
    { id = 'announcement', label = 'Firmenankündigung', icon = 'clipboard' },
}
