fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'advanced-logistics-creator'
author 'Advanced Logistics Creator'
description 'Admin UI to create and manage logistics jobs, orders, routes, vehicles and payouts'
version '1.0.0'

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
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'bridge/server.lua',
    'server/database.lua',
    'server/creator.lua',
    'server/commands.lua',
    'server/main.lua',
}

ui_page 'ui/index.html'

files {
    'ui/index.html',
    'ui/css/style.css',
    'ui/js/app.js',
    'locales/*.json',
}

dependencies {
    'ox_lib',
    'oxmysql',
}
