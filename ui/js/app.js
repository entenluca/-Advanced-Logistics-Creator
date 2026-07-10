const state = {
    jobs: [],
    orders: [],
    routes: [],
    vehicleSpawns: [],
    config: {},
    editing: { job: null, order: null, route: null, vehicle: null },
    waypoints: [],
    placementTarget: null,
};

const ORDER_TYPE_ICONS = {
    pallet: 'box',
    container: 'container',
    tanker: 'droplet',
    construction: 'hammer',
    food: 'apple',
    hazmat: 'biohazard',
    special: 'star',
    custom: 'edit',
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function nui(event, data = {}) {
    return fetch(`https://${GetParentResourceName()}/${event}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then((r) => r.json());
}

function notify(message, type = 'inform') {
    nui('notify', { message, type });
}

function setBtn(el, iconName, label) {
    if (!el) return;
    el.innerHTML = iconBtn(iconName, label);
}

function setTitle(el, iconName, label) {
    if (!el) return;
    el.innerHTML = `${icon(iconName)} ${label}`;
}

function emptyState(iconName, text) {
    return `<div class="empty-state">${icon(iconName, 'icon-xl')}<p>${text}</p></div>`;
}

function actionBtn(iconName, label, onclick, extraClass = 'btn-secondary') {
    return `<button class="btn btn-sm ${extraClass}" onclick="${onclick}">${iconBtn(iconName, label)}</button>`;
}

function badge(active) {
    const cls = active ? 'badge-active' : 'badge-inactive';
    const label = active ? 'Aktiv' : 'Inaktiv';
    const ic = active ? 'check' : 'x';
    return `<span class="badge ${cls}">${icon(ic)} ${label}</span>`;
}

function jobIcon(name) {
    return ICONS[name] ? name : 'truck';
}

// --- Static UI init ---

function initStaticUI() {
    $('#headerLogo').innerHTML = icon('truck');
    $('#btnClose').innerHTML = icon('x');

    $$('.tab').forEach((tab) => {
        const ic = tab.dataset.icon;
        const label = tab.querySelector('span')?.textContent || '';
        tab.innerHTML = `${icon(ic)}<span>${label}</span>`;
    });

    setTitle($('#toolbarJobs'), 'clipboard', 'Job-Verwaltung');
    setTitle($('#toolbarOrders'), 'package', 'Auftrags-System');
    setTitle($('#toolbarRoutes'), 'map', 'Routen-System');
    setTitle($('#toolbarVehicles'), 'truck', 'Fahrzeug-Management');
    setTitle($('#toolbarPayout'), 'dollar', 'Gehalts- und Belohnungssystem');
    setTitle($('#waypointsTitle'), 'route', 'Zwischenstopps');

    setBtn($('#btnNewJob'), 'plus', 'Neuer Job');
    setBtn($('#btnNewOrder'), 'plus', 'Neuer Auftrag');
    setBtn($('#btnNewRoute'), 'plus', 'Neue Route');
    setBtn($('#btnNewVehicle'), 'plus', 'Fahrzeugspawn');
    setBtn($('#btnAddWaypoint'), 'plus', 'Wegpunkt');

    setBtn($('#btnPlaceOrderStart'), 'mapPin', 'Setzen');
    setBtn($('#btnPlaceOrderEnd'), 'mapPin', 'Setzen');
    setBtn($('#btnPlaceRouteStart'), 'mapPin', 'Setzen');
    setBtn($('#btnPlaceRouteEnd'), 'mapPin', 'Setzen');
    setBtn($('#btnPlaceVehicle'), 'mapPin', 'Setzen');

    setBtn($('#btnCancelJob'), 'x', 'Abbrechen');
    setBtn($('#btnSaveJob'), 'check', 'Speichern');
    setBtn($('#btnCancelOrder'), 'x', 'Abbrechen');
    setBtn($('#btnSaveOrder'), 'check', 'Speichern');
    setBtn($('#btnPreviewRoute'), 'eye', 'Vorschau');
    setBtn($('#btnCancelRoute'), 'x', 'Abbrechen');
    setBtn($('#btnSaveRoute'), 'check', 'Speichern');
    setBtn($('#btnCancelVehicle'), 'x', 'Abbrechen');
    setBtn($('#btnSaveVehicle'), 'check', 'Speichern');
    setBtn($('#btnSavePayout'), 'check', 'Gehalt speichern');

    $('#payoutHint').innerHTML = `${icon('layers')} Wähle einen Job aus, um das Gehaltssystem zu konfigurieren.`;
    setTitle($('#payoutPreviewTitle'), 'dollar', 'Beispielberechnung');
}

document.addEventListener('DOMContentLoaded', initStaticUI);

// --- Init ---

window.addEventListener('message', (e) => {
    const { action, coords, type } = e.data;
    if (action === 'open') {
        $('#app').classList.remove('hidden');
        loadData();
    } else if (action === 'placementResult') {
        applyPlacement(coords, type);
    } else if (action === 'placementCancelled') {
        state.placementTarget = null;
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeUI();
});

$('#btnClose').addEventListener('click', closeUI);

function closeUI() {
    $('#app').classList.add('hidden');
    nui('close');
    nui('clearPreview');
}

async function loadData() {
    const data = await nui('getData');
    if (!data) return;
    state.jobs = data.jobs || [];
    state.orders = data.orders || [];
    state.routes = data.routes || [];
    state.vehicleSpawns = data.vehicleSpawns || [];
    state.config = data.config || {};
    populateSelects();
    renderAll();
}

// --- Tabs ---

$$('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
        $$('.tab').forEach((t) => t.classList.remove('active'));
        $$('.tab-content').forEach((c) => c.classList.remove('active'));
        tab.classList.add('active');
        $(`#tab-${tab.dataset.tab}`).classList.add('active');
    });
});

// --- Populate selects ---

function populateSelects() {
    const jobOpts = state.jobs.map((j) => `<option value="${j.id}">${esc(j.name)}</option>`).join('');
    ['orderJobFilter', 'orderJobId', 'vehicleJobFilter', 'vehicleJobId', 'payoutJobSelect'].forEach((id) => {
        const el = $(`#${id}`);
        const isFilter = id.includes('Filter') || id === 'payoutJobSelect';
        el.innerHTML = (isFilter ? '<option value="">' + (id === 'payoutJobSelect' ? 'Job auswählen...' : 'Alle Jobs') + '</option>' : '') + jobOpts;
    });

    const orderOpts = state.orders.map((o) => {
        const job = state.jobs.find((j) => j.id === o.job_id);
        return `<option value="${o.id}">${esc(o.title)} (${esc(job?.name || '?')})</option>`;
    }).join('');
    ['routeOrderFilter', 'routeOrderId'].forEach((id) => {
        const el = $(`#${id}`);
        el.innerHTML = (id.includes('Filter') ? '<option value="">Alle Aufträge</option>' : '') + orderOpts;
    });

    if (state.config.icons) {
        $('#jobIcon').innerHTML = state.config.icons.map((i) => `<option value="${i}">${i}</option>`).join('');
    }
    if (state.config.orderTypes) {
        $('#orderType').innerHTML = state.config.orderTypes.map((t) => `<option value="${t.id}">${esc(t.label)}</option>`).join('');
    }
    if (state.config.difficulties) {
        $('#routeDifficulty').innerHTML = state.config.difficulties.map((d) => `<option value="${d.id}">${esc(d.label)}</option>`).join('');
    }
}

function renderAll() {
    renderJobs();
    renderOrders();
    renderRoutes();
    renderVehicles();
}

// --- Jobs ---

function renderJobs() {
    const list = $('#jobList');
    if (!state.jobs.length) {
        list.innerHTML = emptyState('clipboard', 'Noch keine Jobs erstellt. Klicke auf „Neuer Job".');
        return;
    }
    list.innerHTML = state.jobs.map((j) => `
        <div class="list-item" data-id="${j.id}">
            <div class="list-item-icon">${icon(jobIcon(j.icon))}</div>
            <div class="list-item-body">
                <div class="list-item-info">
                    <h4>${esc(j.name)} ${badge(j.active)}</h4>
                    <p>
                        <span class="meta-chip">${icon('layers')} Level ${j.min_level}</span>
                        <span class="meta-chip">${icon(j.faction_bound ? 'users' : 'check')} ${j.faction_bound ? 'Fraktion: ' + esc(j.faction_name || '?') : 'Öffentlich'}</span>
                    </p>
                    <p>${esc(j.description || 'Keine Beschreibung')}</p>
                </div>
            </div>
            <div class="list-item-actions">
                ${actionBtn('pencil', 'Bearbeiten', `editJob(${j.id})`)}
                ${actionBtn('trash', 'Löschen', `deleteJob(${j.id})`, 'btn-danger')}
            </div>
        </div>
    `).join('');
}

$('#btnNewJob').addEventListener('click', () => {
    state.editing.job = null;
    setTitle($('#jobFormTitle'), 'plus', 'Neuer Logistik-Job');
    $('#jobName').value = '';
    $('#jobDescription').value = '';
    $('#jobMinLevel').value = '0';
    $('#jobFactionBound').checked = false;
    $('#jobFaction').value = '';
    $('#jobActive').checked = true;
    $('#factionField').classList.add('hidden');
    $('#jobForm').classList.remove('hidden');
});

$('#jobFactionBound').addEventListener('change', (e) => {
    $('#factionField').classList.toggle('hidden', !e.target.checked);
});

$('#btnCancelJob').addEventListener('click', () => $('#jobForm').classList.add('hidden'));

$('#btnSaveJob').addEventListener('click', async () => {
    const data = {
        name: $('#jobName').value.trim(),
        description: $('#jobDescription').value.trim(),
        icon: $('#jobIcon').value,
        min_level: parseInt($('#jobMinLevel').value) || 0,
        faction_bound: $('#jobFactionBound').checked,
        faction_name: $('#jobFactionBound').checked ? $('#jobFaction').value.trim() : null,
        active: $('#jobActive').checked,
        payout: state.editing.job?.payout || state.config.defaultPayout,
    };
    if (!data.name) return notify('Bitte Jobname eingeben.', 'error');
    const res = await nui('saveJob', { data, id: state.editing.job?.id });
    if (res.success) {
        notify('Job gespeichert.', 'success');
        $('#jobForm').classList.add('hidden');
        loadData();
    } else {
        notify('Fehler beim Speichern: ' + (res.error || 'Unbekannt'), 'error');
    }
});

window.editJob = (id) => {
    const job = state.jobs.find((j) => j.id === id);
    if (!job) return;
    state.editing.job = job;
    setTitle($('#jobFormTitle'), 'pencil', 'Job bearbeiten');
    $('#jobName').value = job.name;
    $('#jobDescription').value = job.description || '';
    $('#jobIcon').value = job.icon || 'truck';
    $('#jobMinLevel').value = job.min_level;
    $('#jobFactionBound').checked = job.faction_bound;
    $('#jobFaction').value = job.faction_name || '';
    $('#jobActive').checked = job.active;
    $('#factionField').classList.toggle('hidden', !job.faction_bound);
    $('#jobForm').classList.remove('hidden');
};

window.deleteJob = async (id) => {
    const res = await nui('deleteJob', { id });
    if (res.success) { notify('Job gelöscht.', 'success'); loadData(); }
};

// --- Orders ---

function renderOrders() {
    const filter = $('#orderJobFilter').value;
    const orders = filter ? state.orders.filter((o) => o.job_id == filter) : state.orders;
    const list = $('#orderList');
    if (!orders.length) {
        list.innerHTML = emptyState('package', 'Noch keine Aufträge erstellt.');
        return;
    }
    const typeMap = {};
    (state.config.orderTypes || []).forEach((t) => { typeMap[t.id] = t.label; });
    list.innerHTML = orders.map((o) => {
        const job = state.jobs.find((j) => j.id === o.job_id);
        const typeIcon = ORDER_TYPE_ICONS[o.order_type] || 'box';
        return `
        <div class="list-item">
            <div class="list-item-icon">${icon(typeIcon)}</div>
            <div class="list-item-body">
                <div class="list-item-info">
                    <h4>${esc(o.title)} ${badge(o.active)}</h4>
                    <p>
                        <span class="meta-chip">${icon(typeIcon)} ${esc(typeMap[o.order_type] || o.order_type)}</span>
                        <span class="meta-chip">${icon('clipboard')} ${esc(job?.name || '?')}</span>
                        <span class="meta-chip">${icon('dollar')} ${o.reward}$</span>
                    </p>
                </div>
            </div>
            <div class="list-item-actions">
                ${actionBtn('pencil', 'Bearbeiten', `editOrder(${o.id})`)}
                ${actionBtn('trash', 'Löschen', `deleteOrder(${o.id})`, 'btn-danger')}
            </div>
        </div>`;
    }).join('');
}

$('#orderJobFilter').addEventListener('change', renderOrders);

$('#btnNewOrder').addEventListener('click', () => {
    state.editing.order = null;
    setTitle($('#orderFormTitle'), 'plus', 'Neuer Auftrag');
    ['orderTitle', 'orderDescription', 'orderStartX', 'orderStartY', 'orderStartZ', 'orderEndX', 'orderEndY', 'orderEndZ'].forEach((id) => { $(`#${id}`).value = ''; });
    $('#orderTimeLimit').value = '0';
    $('#orderReward').value = '0';
    $('#orderBonus').value = '0';
    $('#orderPenalty').value = '0';
    $('#orderCooldown').value = '0';
    $('#orderActive').checked = true;
    $('#orderForm').classList.remove('hidden');
});

$('#btnCancelOrder').addEventListener('click', () => $('#orderForm').classList.add('hidden'));

$('#btnSaveOrder').addEventListener('click', async () => {
    const data = {
        job_id: parseInt($('#orderJobId').value),
        title: $('#orderTitle').value.trim(),
        description: $('#orderDescription').value.trim(),
        order_type: $('#orderType').value,
        start_point: { x: parseFloat($('#orderStartX').value), y: parseFloat($('#orderStartY').value), z: parseFloat($('#orderStartZ').value) },
        end_point: { x: parseFloat($('#orderEndX').value), y: parseFloat($('#orderEndY').value), z: parseFloat($('#orderEndZ').value) },
        time_limit: parseInt($('#orderTimeLimit').value) || 0,
        reward: parseInt($('#orderReward').value) || 0,
        bonus_payment: parseInt($('#orderBonus').value) || 0,
        penalty: parseInt($('#orderPenalty').value) || 0,
        cooldown: parseInt($('#orderCooldown').value) || 0,
        active: $('#orderActive').checked,
    };
    if (!data.job_id || !data.title) return notify('Job und Titel sind erforderlich.', 'error');
    const res = await nui('saveOrder', { data, id: state.editing.order?.id });
    if (res.success) { notify('Auftrag gespeichert.', 'success'); $('#orderForm').classList.add('hidden'); loadData(); }
    else notify('Fehler: ' + (res.error || 'Unbekannt'), 'error');
});

window.editOrder = (id) => {
    const o = state.orders.find((x) => x.id === id);
    if (!o) return;
    state.editing.order = o;
    setTitle($('#orderFormTitle'), 'pencil', 'Auftrag bearbeiten');
    $('#orderJobId').value = o.job_id;
    $('#orderType').value = o.order_type;
    $('#orderTitle').value = o.title;
    $('#orderDescription').value = o.description || '';
    $('#orderStartX').value = o.start_point?.x || '';
    $('#orderStartY').value = o.start_point?.y || '';
    $('#orderStartZ').value = o.start_point?.z || '';
    $('#orderEndX').value = o.end_point?.x || '';
    $('#orderEndY').value = o.end_point?.y || '';
    $('#orderEndZ').value = o.end_point?.z || '';
    $('#orderTimeLimit').value = o.time_limit;
    $('#orderReward').value = o.reward;
    $('#orderBonus').value = o.bonus_payment;
    $('#orderPenalty').value = o.penalty;
    $('#orderCooldown').value = o.cooldown;
    $('#orderActive').checked = o.active;
    $('#orderForm').classList.remove('hidden');
};

window.deleteOrder = async (id) => {
    const res = await nui('deleteOrder', { id });
    if (res.success) { notify('Auftrag gelöscht.', 'success'); loadData(); }
};

// --- Routes ---

function renderRoutes() {
    const filter = $('#routeOrderFilter').value;
    const routes = filter ? state.routes.filter((r) => r.order_id == filter) : state.routes;
    const list = $('#routeList');
    if (!routes.length) {
        list.innerHTML = emptyState('map', 'Noch keine Routen erstellt.');
        return;
    }
    list.innerHTML = routes.map((r) => {
        const order = state.orders.find((o) => o.id === r.order_id);
        return `
        <div class="list-item">
            <div class="list-item-icon">${icon('route')}</div>
            <div class="list-item-body">
                <div class="list-item-info">
                    <h4>${esc(r.name)} ${badge(r.active)}</h4>
                    <p>
                        <span class="meta-chip">${icon('package')} ${esc(order?.title || '?')}</span>
                        <span class="meta-chip">${icon('map')} ${r.distance} km</span>
                        <span class="meta-chip">${icon('layers')} ${r.difficulty}</span>
                        ${r.gps_enabled ? `<span class="meta-chip">${icon('mapPin')} GPS</span>` : ''}
                    </p>
                </div>
            </div>
            <div class="list-item-actions">
                ${actionBtn('pencil', 'Bearbeiten', `editRoute(${r.id})`)}
                ${actionBtn('trash', 'Löschen', `deleteRoute(${r.id})`, 'btn-danger')}
            </div>
        </div>`;
    }).join('');
}

$('#routeOrderFilter').addEventListener('change', renderRoutes);

$('#btnNewRoute').addEventListener('click', () => {
    state.editing.route = null;
    state.waypoints = [];
    setTitle($('#routeFormTitle'), 'plus', 'Neue Route');
    $('#routeName').value = '';
    ['routeStartX', 'routeStartY', 'routeStartZ', 'routeEndX', 'routeEndY', 'routeEndZ'].forEach((id) => { $(`#${id}`).value = ''; });
    $('#routeDistance').value = '0';
    $('#routeEstTime').value = '0';
    $('#routeGps').checked = true;
    $('#routeRandom').checked = false;
    $('#routeShowWp').checked = true;
    $('#routeActive').checked = true;
    renderWaypoints();
    $('#routeForm').classList.remove('hidden');
});

$('#btnCancelRoute').addEventListener('click', () => { $('#routeForm').classList.add('hidden'); nui('clearPreview'); });

$('#btnSaveRoute').addEventListener('click', async () => {
    const data = {
        order_id: parseInt($('#routeOrderId').value),
        name: $('#routeName').value.trim(),
        start_point: { x: parseFloat($('#routeStartX').value), y: parseFloat($('#routeStartY').value), z: parseFloat($('#routeStartZ').value) },
        end_point: { x: parseFloat($('#routeEndX').value), y: parseFloat($('#routeEndY').value), z: parseFloat($('#routeEndZ').value) },
        waypoints: state.waypoints,
        gps_enabled: $('#routeGps').checked,
        random_select: $('#routeRandom').checked,
        show_waypoints: $('#routeShowWp').checked,
        distance: parseFloat($('#routeDistance').value) || 0,
        estimated_time: parseInt($('#routeEstTime').value) || 0,
        difficulty: $('#routeDifficulty').value,
        active: $('#routeActive').checked,
    };
    if (!data.order_id || !data.name) return notify('Auftrag und Routenname erforderlich.', 'error');
    const res = await nui('saveRoute', { data, id: state.editing.route?.id });
    if (res.success) { notify('Route gespeichert.', 'success'); $('#routeForm').classList.add('hidden'); loadData(); }
    else notify('Fehler: ' + (res.error || 'Unbekannt'), 'error');
});

$('#btnPreviewRoute').addEventListener('click', () => {
    nui('previewRoute', {
        route: {
            start_point: { x: parseFloat($('#routeStartX').value), y: parseFloat($('#routeStartY').value), z: parseFloat($('#routeStartZ').value) },
            end_point: { x: parseFloat($('#routeEndX').value), y: parseFloat($('#routeEndY').value), z: parseFloat($('#routeEndZ').value) },
            waypoints: state.waypoints,
        },
    });
});

window.editRoute = (id) => {
    const r = state.routes.find((x) => x.id === id);
    if (!r) return;
    state.editing.route = r;
    state.waypoints = r.waypoints || [];
    setTitle($('#routeFormTitle'), 'pencil', 'Route bearbeiten');
    $('#routeOrderId').value = r.order_id;
    $('#routeName').value = r.name;
    $('#routeStartX').value = r.start_point?.x || '';
    $('#routeStartY').value = r.start_point?.y || '';
    $('#routeStartZ').value = r.start_point?.z || '';
    $('#routeEndX').value = r.end_point?.x || '';
    $('#routeEndY').value = r.end_point?.y || '';
    $('#routeEndZ').value = r.end_point?.z || '';
    $('#routeDistance').value = r.distance;
    $('#routeEstTime').value = r.estimated_time;
    $('#routeDifficulty').value = r.difficulty;
    $('#routeGps').checked = r.gps_enabled;
    $('#routeRandom').checked = r.random_select;
    $('#routeShowWp').checked = r.show_waypoints;
    $('#routeActive').checked = r.active;
    renderWaypoints();
    $('#routeForm').classList.remove('hidden');
};

window.deleteRoute = async (id) => {
    const res = await nui('deleteRoute', { id });
    if (res.success) { notify('Route gelöscht.', 'success'); loadData(); }
};

// Waypoints

function renderWaypoints() {
    $('#waypointList').innerHTML = state.waypoints.map((wp, i) => `
        <div class="waypoint-item">
            <span class="wp-num">${i + 1}</span>
            <input type="number" value="${wp.x}" placeholder="X" step="0.01" onchange="updateWp(${i},'x',this.value)">
            <input type="number" value="${wp.y}" placeholder="Y" step="0.01" onchange="updateWp(${i},'y',this.value)">
            <input type="number" value="${wp.z}" placeholder="Z" step="0.01" onchange="updateWp(${i},'z',this.value)">
            <button class="btn btn-sm btn-ghost" onclick="placeWp(${i})">${iconBtn('mapPin', '')}</button>
            <button class="btn btn-sm btn-danger" onclick="removeWp(${i})">${icon('x')}</button>
        </div>
    `).join('');
}

window.updateWp = (i, axis, val) => { state.waypoints[i][axis] = parseFloat(val); };
window.removeWp = (i) => { state.waypoints.splice(i, 1); renderWaypoints(); };
window.placeWp = (i) => { state.placementTarget = `waypoint_${i}`; nui('startPlacement', { placementType: `waypoint_${i}` }); };

$('#btnAddWaypoint').addEventListener('click', async () => {
    const coords = await nui('getPlayerCoords');
    state.waypoints.push({ x: coords.x, y: coords.y, z: coords.z });
    renderWaypoints();
});

// --- Vehicles ---

function renderVehicles() {
    const filter = $('#vehicleJobFilter').value;
    const spawns = filter ? state.vehicleSpawns.filter((v) => v.job_id == filter) : state.vehicleSpawns;
    const list = $('#vehicleList');
    if (!spawns.length) {
        list.innerHTML = emptyState('truck', 'Noch keine Fahrzeugspawns erstellt.');
        return;
    }
    list.innerHTML = spawns.map((v) => {
        const job = state.jobs.find((j) => j.id === v.job_id);
        return `
        <div class="list-item">
            <div class="list-item-icon">${icon('car')}</div>
            <div class="list-item-body">
                <div class="list-item-info">
                    <h4>${esc(v.label || v.model)} ${badge(v.active)}</h4>
                    <p>
                        <span class="meta-chip">${icon('truck')} ${esc(v.model)}</span>
                        <span class="meta-chip">${icon('clipboard')} ${esc(job?.name || '?')}</span>
                    </p>
                </div>
            </div>
            <div class="list-item-actions">
                ${actionBtn('pencil', 'Bearbeiten', `editVehicle(${v.id})`)}
                ${actionBtn('trash', 'Löschen', `deleteVehicle(${v.id})`, 'btn-danger')}
            </div>
        </div>`;
    }).join('');
}

$('#vehicleJobFilter').addEventListener('change', renderVehicles);

$('#btnNewVehicle').addEventListener('click', () => {
    state.editing.vehicle = null;
    setTitle($('#vehicleFormTitle'), 'plus', 'Neuer Fahrzeugspawn');
    $('#vehicleModel').value = '';
    $('#vehicleLabel').value = '';
    ['vehicleX', 'vehicleY', 'vehicleZ', 'vehicleHeading'].forEach((id) => { $(`#${id}`).value = ''; });
    $('#vehicleLivery').value = '-1';
    $('#vehicleActive').checked = true;
    $('#vehicleForm').classList.remove('hidden');
});

$('#btnCancelVehicle').addEventListener('click', () => $('#vehicleForm').classList.add('hidden'));

$('#btnSaveVehicle').addEventListener('click', async () => {
    const data = {
        job_id: parseInt($('#vehicleJobId').value),
        model: $('#vehicleModel').value.trim(),
        label: $('#vehicleLabel').value.trim(),
        coords: { x: parseFloat($('#vehicleX').value), y: parseFloat($('#vehicleY').value), z: parseFloat($('#vehicleZ').value) },
        heading: parseFloat($('#vehicleHeading').value) || 0,
        livery: parseInt($('#vehicleLivery').value),
        active: $('#vehicleActive').checked,
    };
    if (!data.job_id || !data.model) return notify('Job und Modell erforderlich.', 'error');
    const res = await nui('saveVehicleSpawn', { data, id: state.editing.vehicle?.id });
    if (res.success) { notify('Fahrzeugspawn gespeichert.', 'success'); $('#vehicleForm').classList.add('hidden'); loadData(); }
    else notify('Fehler: ' + (res.error || 'Unbekannt'), 'error');
});

window.editVehicle = (id) => {
    const v = state.vehicleSpawns.find((x) => x.id === id);
    if (!v) return;
    state.editing.vehicle = v;
    setTitle($('#vehicleFormTitle'), 'pencil', 'Fahrzeugspawn bearbeiten');
    $('#vehicleJobId').value = v.job_id;
    $('#vehicleModel').value = v.model;
    $('#vehicleLabel').value = v.label || '';
    $('#vehicleX').value = v.coords?.x || '';
    $('#vehicleY').value = v.coords?.y || '';
    $('#vehicleZ').value = v.coords?.z || '';
    $('#vehicleHeading').value = v.heading || 0;
    $('#vehicleLivery').value = v.livery ?? -1;
    $('#vehicleActive').checked = v.active;
    $('#vehicleForm').classList.remove('hidden');
};

window.deleteVehicle = async (id) => {
    const res = await nui('deleteVehicleSpawn', { id });
    if (res.success) { notify('Fahrzeugspawn gelöscht.', 'success'); loadData(); }
};

// --- Payout ---

$('#payoutJobSelect').addEventListener('change', () => {
    const id = parseInt($('#payoutJobSelect').value);
    if (!id) {
        $('#payoutForm').classList.add('hidden');
        $('#payoutPreview').classList.add('hidden');
        $('#payoutActions').classList.add('hidden');
        $('#payoutHint').classList.remove('hidden');
        return;
    }
    $('#payoutHint').classList.add('hidden');
    const job = state.jobs.find((j) => j.id === id);
    const p = job?.payout || state.config.defaultPayout || {};
    $('#payBase').value = p.baseSalary || 0;
    $('#payPerKm').value = p.perKm || 0;
    $('#payPerDelivery').value = p.perDelivery || 0;
    $('#payTimeBonus').value = p.timeBonus || 0;
    $('#payFlawless').value = p.flawlessBonus || 0;
    $('#payDifficulty').value = p.difficultyBonus || 0;
    $('#payXp').value = p.xpReward || 0;
    $('#payoutForm').classList.remove('hidden');
    $('#payoutPreview').classList.remove('hidden');
    $('#payoutActions').classList.remove('hidden');
    updatePayoutPreview();
});

['payBase', 'payPerKm', 'payPerDelivery', 'payTimeBonus', 'payFlawless', 'payDifficulty', 'payXp'].forEach((id) => {
    $(`#${id}`).addEventListener('input', updatePayoutPreview);
});

function calcLine(iconName, text) {
    return `<div class="calc-line">${icon(iconName)} ${text}</div>`;
}

function updatePayoutPreview() {
    const base = parseInt($('#payBase').value) || 0;
    const km = parseInt($('#payPerKm').value) || 0;
    const delivery = parseInt($('#payPerDelivery').value) || 0;
    const time = parseInt($('#payTimeBonus').value) || 0;
    const flawless = parseInt($('#payFlawless').value) || 0;
    const xp = parseInt($('#payXp').value) || 0;
    const exampleKm = 10;
    const total = base + (km * exampleKm) + delivery + time + flawless;
    $('#payoutCalc').innerHTML = `
        ${calcLine('dollar', `Grundgehalt: ${base}$`)}
        ${calcLine('map', `+ ${km}$ × ${exampleKm} km = ${km * exampleKm}$`)}
        ${calcLine('package', `+ ${delivery}$ pro Lieferung`)}
        ${calcLine('clock', `+ ${time}$ Zeitbonus`)}
        ${calcLine('check', `+ ${flawless}$ Fehlerfrei-Bonus`)}
        ${calcLine('star', `+ ${xp} XP`)}
        <div class="total">${icon('dollar')} Gesamt (Beispiel): ${total}$ + ${xp} XP</div>
    `;
}

$('#btnSavePayout').addEventListener('click', async () => {
    const id = parseInt($('#payoutJobSelect').value);
    if (!id) return;
    const job = state.jobs.find((j) => j.id === id);
    if (!job) return;
    const data = {
        ...job,
        payout: {
            baseSalary: parseInt($('#payBase').value) || 0,
            perKm: parseInt($('#payPerKm').value) || 0,
            perDelivery: parseInt($('#payPerDelivery').value) || 0,
            timeBonus: parseInt($('#payTimeBonus').value) || 0,
            flawlessBonus: parseInt($('#payFlawless').value) || 0,
            difficultyBonus: parseInt($('#payDifficulty').value) || 0,
            xpReward: parseInt($('#payXp').value) || 0,
        },
    };
    const res = await nui('saveJob', { data, id });
    if (res.success) { notify('Gehaltssystem gespeichert.', 'success'); loadData(); }
    else notify('Fehler beim Speichern.', 'error');
});

// --- Placement ---

$$('[data-placement]').forEach((btn) => {
    btn.addEventListener('click', () => {
        state.placementTarget = btn.dataset.placement;
        nui('startPlacement', { placementType: btn.dataset.placement });
    });
});

function applyPlacement(coords, type) {
    const map = {
        orderStart: ['orderStartX', 'orderStartY', 'orderStartZ'],
        orderEnd: ['orderEndX', 'orderEndY', 'orderEndZ'],
        routeStart: ['routeStartX', 'routeStartY', 'routeStartZ'],
        routeEnd: ['routeEndX', 'routeEndY', 'routeEndZ'],
        vehicle: ['vehicleX', 'vehicleY', 'vehicleZ'],
    };
    if (type?.startsWith('waypoint_')) {
        const i = parseInt(type.split('_')[1]);
        if (state.waypoints[i]) {
            state.waypoints[i] = { x: coords.x, y: coords.y, z: coords.z };
            renderWaypoints();
        }
    } else if (map[type]) {
        $(`#${map[type][0]}`).value = coords.x;
        $(`#${map[type][1]}`).value = coords.y;
        $(`#${map[type][2]}`).value = coords.z;
        if (type === 'vehicle') $('#vehicleHeading').value = coords.heading || 0;
    }
    state.placementTarget = null;
}

function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}
