const I18N = {
    de: {
        title: 'Advanced Logistics Creator',
        subtitle: 'Logistik-Jobs verwalten',
        search: 'Suchen...',
        all: 'Alle',
        active: 'Aktiv',
        inactive: 'Inaktiv',
        save: 'Speichern',
        cancel: 'Abbrechen',
        delete: 'Löschen',
        edit: 'Bearbeiten',
        preview: 'Vorschau',
        setPosition: 'Setzen',
        new: 'Neu',
        noData: 'Keine Einträge vorhanden.',
        tabs: { jobs: 'Jobs', orders: 'Aufträge', routes: 'Routen', vehicles: 'Fahrzeuge', depots: 'Depots', employees: 'Mitarbeiter', payout: 'Gehalt', stats: 'Statistik' },
        jobs: { title: 'Job-Verwaltung', new: 'Neuer Job', edit: 'Job bearbeiten', public: 'Öffentlich', faction: 'Fraktion' },
        orders: { title: 'Auftrags-System', new: 'Neuer Auftrag' },
        routes: { title: 'Routen-System', new: 'Neue Route', waypoints: 'Zwischenstopps' },
        vehicles: {
            title: 'Fahrzeug-Management', new: 'Fahrzeugspawn', type: 'Fahrzeugtyp',
            plate: 'Kennzeichen', fuel: 'Tankfüllstand (%)', health: 'Fahrzeugzustand',
            maxSpeed: 'Maximalgeschwindigkeit', rental: 'Mietfahrzeug', owned: 'Eigentumsfahrzeug',
        },
        depots: {
            title: 'Depot- & Firmen-System', new: 'Neues Depot', marker: 'Marker', blip: 'Blip',
            npc: 'NPC', teleport: 'Teleport', blipSprite: 'Blip-Sprite', blipColor: 'Blip-Farbe',
        },
        employees: {
            title: 'Mitarbeiter-System', hire: 'Spieler einstellen', fire: 'Entlassen',
            rank: 'Rang', level: 'Fahrer-Level', history: 'Auftragsverlauf', earnings: 'Verdienste',
            selectPlayer: 'Spieler auswählen',
        },
        payout: { title: 'Gehalts- und Belohnungssystem', hint: 'Wähle einen Job aus.', example: 'Beispielberechnung', total: 'Gesamt (Beispiel)' },
        stats: {
            title: 'Statistik-System', completed: 'Abgeschlossene Aufträge', km: 'Gefahrene Kilometer',
            earned: 'Verdientes Geld', today: 'Lieferungen heute', success: 'Erfolgsquote',
            revenue: 'Firmenumsatz', topDrivers: 'Top-Fahrer Ranking',
        },
        settings: { theme: 'Design', language: 'Sprache', dark: 'Dark Mode', light: 'Light Mode' },
        toast: { new_order: 'Neuer Auftrag', order_complete: 'Auftrag abgeschlossen', bonus: 'Bonus', vehicle_ready: 'Fahrzeug bereit', salary: 'Gehalt', announcement: 'Ankündigung' },
    },
    en: {
        title: 'Advanced Logistics Creator',
        subtitle: 'Manage logistics jobs',
        search: 'Search...',
        all: 'All',
        active: 'Active',
        inactive: 'Inactive',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        preview: 'Preview',
        setPosition: 'Set',
        new: 'New',
        noData: 'No entries yet.',
        tabs: { jobs: 'Jobs', orders: 'Orders', routes: 'Routes', vehicles: 'Vehicles', depots: 'Depots', employees: 'Employees', payout: 'Payout', stats: 'Statistics' },
        jobs: { title: 'Job Management', new: 'New Job', edit: 'Edit Job', public: 'Public', faction: 'Faction' },
        orders: { title: 'Order System', new: 'New Order' },
        routes: { title: 'Route System', new: 'New Route', waypoints: 'Waypoints' },
        vehicles: {
            title: 'Vehicle Management', new: 'Vehicle Spawn', type: 'Vehicle Type',
            plate: 'License Plate', fuel: 'Fuel Level (%)', health: 'Vehicle Health',
            maxSpeed: 'Max Speed', rental: 'Rental Vehicle', owned: 'Owned Vehicle',
        },
        depots: {
            title: 'Depot & Company System', new: 'New Depot', marker: 'Marker', blip: 'Blip',
            npc: 'NPC', teleport: 'Teleport', blipSprite: 'Blip Sprite', blipColor: 'Blip Color',
        },
        employees: {
            title: 'Employee System', hire: 'Hire Player', fire: 'Fire',
            rank: 'Rank', level: 'Driver Level', history: 'Order History', earnings: 'Earnings',
            selectPlayer: 'Select Player',
        },
        payout: { title: 'Salary & Reward System', hint: 'Select a job.', example: 'Example Calculation', total: 'Total (Example)' },
        stats: {
            title: 'Statistics', completed: 'Completed Orders', km: 'Kilometers Driven',
            earned: 'Money Earned', today: 'Deliveries Today', success: 'Success Rate',
            revenue: 'Company Revenue', topDrivers: 'Top Driver Ranking',
        },
        settings: { theme: 'Theme', language: 'Language', dark: 'Dark Mode', light: 'Light Mode' },
        toast: { new_order: 'New Order', order_complete: 'Order Complete', bonus: 'Bonus', vehicle_ready: 'Vehicle Ready', salary: 'Salary', announcement: 'Announcement' },
    },
};

let currentLocale = localStorage.getItem('alc_locale') || 'de';

function t(path) {
    const keys = path.split('.');
    let val = I18N[currentLocale];
    for (const k of keys) {
        val = val?.[k];
        if (!val) break;
    }
    if (val) return val;
    val = I18N.de;
    for (const k of keys) val = val?.[k];
    return val || path;
}

function setLocale(locale) {
    currentLocale = locale;
    localStorage.setItem('alc_locale', locale);
    document.documentElement.lang = locale;
}

function getLocale() { return currentLocale; }
