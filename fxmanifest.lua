fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'advanced-logistics-creator'
author 'Advanced Logistics Creator'
description 'Admin UI to create and manage logistics jobs, orders, routes, vehicles, depots, employees and statistics'
version '2.0.0'

shared_scripts {
    '@ox_lib/init.lua',
    'shared/config.lua',
}

client_scripts {
    'bridge/client.lua',
    'client/main.lua',
    'client/creator.lua',
    'client/placement.lua',
    'client/gps.lua',
    'client/depots.lua',
    'client/notifications.lua',
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'bridge/server.lua',
    'server/statistics.lua',
    'server/employees.lua',
    'server/notifications.lua',
    'server/database.lua',
    'server/creator.lua',
    'server/commands.lua',
    'server/main.lua',
}

ui_page 'ui/index.html'

files {
    'ui/index.html',
    'ui/css/style.css',
    'ui/js/icons.js',
    'ui/js/i18n.js',
    'ui/js/dnd.js',
    'ui/js/app.js',
    'locales/*.json',
    'sql/migrate_v2.sql',
}

dependencies {
    'ox_lib',
    'oxmysql',
}
