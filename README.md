# Advanced Logistics Creator

Der **Advanced Logistics Creator** ermöglicht Administratoren, direkt im Spiel über eine benutzerfreundliche UI komplette Logistik-Jobs zu erstellen, zu verwalten und anzupassen – ganz ohne manuelle Konfigurationsdateien.

## Features

- **Job-Verwaltung** – Transportfirmen mit Name, Beschreibung, Icon, Mindestlevel, Fraktionsbindung
- **Auftrags-System** – 8 Auftragstypen (Paletten, Container, Tanker, Baustoff, Lebensmittel, Gefahrgut, Sonder, Individuell)
- **Routen-System** – Start/Ziel, Zwischenstopps, GPS-Navigation, Schwierigkeit, Distanz
- **Gehalts-System** – Grundgehalt, KM-Bonus, Lieferbonus, Zeitbonus, XP
- **Fahrzeug-Management** – Spawns mit Modell, Position, Heading, Livery

## Installation

1. Resource in den `resources`-Ordner kopieren
2. SQL ausführen: `sql/install.sql` (wird auch automatisch beim Start ausgeführt)
3. In `server.cfg` eintragen:

```cfg
ensure ox_lib
ensure oxmysql
ensure advanced-logistics-creator

# Admin-Berechtigung
add_ace group.admin logisticcreator.admin allow
add_ace group.admin command.logisticcreator allow
```

## Befehl

```
/logisticcreator
```

Öffnet das vollständige Logistik-Management-Menü (nur für Admins).

## Abhängigkeiten

| Resource | Erforderlich |
|----------|-------------|
| [ox_lib](https://github.com/overextended/ox_lib) | Ja |
| [oxmysql](https://github.com/overextended/oxmysql) | Ja |
| ESX / QBCore | Optional (Auto-Detection) |

## Konfiguration

`shared/config.lua`:

- `Config.Framework` – `'auto'`, `'esx'`, `'qb'` oder `'standalone'`
- `Config.AdminAce` – ACE-Permission (Standard: `logisticcreator.admin`)
- `Config.Limits` – Serverseitige Limits für Jobs, Aufträge, Routen, Auszahlungen
- `Config.DefaultPayout` – Standard-Gehaltsvorlage für neue Jobs

## Exports

```lua
-- Jobs & Daten abrufen
exports['advanced-logistics-creator']:GetJobs()
exports['advanced-logistics-creator']:GetActiveJobs()
exports['advanced-logistics-creator']:GetOrders(jobId)
exports['advanced-logistics-creator']:GetRoutes(orderId)
exports['advanced-logistics-creator']:GetVehicleSpawns(jobId)

-- Gehaltsberechnung
local payout, xp = exports['advanced-logistics-creator']:CalculatePayout(jobPayout, distanceKm, {
    onTime = true,
    flawless = true,
    difficult = false,
})

-- GPS-Navigation (Client)
exports['advanced-logistics-creator']:StartRouteNavigation(route)
exports['advanced-logistics-creator']:StopRouteNavigation()

-- Spieler-Fortschritt
exports['advanced-logistics-creator']:GetPlayerProgress(identifier)
exports['advanced-logistics-creator']:AddPlayerXp(identifier, 50)
```

## Ingame-UI

Die UI bietet fünf Tabs:

1. **Jobs** – Erstellen, bearbeiten, deaktivieren, löschen
2. **Aufträge** – Warentransporte mit Start/Ziel, Zeitlimit, Belohnung, Cooldown
3. **Routen** – Wegpunkte, GPS, Schwierigkeit, Vorschau auf der Karte
4. **Fahrzeuge** – Spawns pro Job konfigurieren
5. **Gehalt** – Payout-System pro Job mit Live-Vorschau

Koordinaten können per **📍 Setzen**-Button ingame platziert werden (Position mit `E` bestätigen).

## Lizenz

MIT
