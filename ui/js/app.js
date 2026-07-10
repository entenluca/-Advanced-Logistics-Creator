const state = {
    jobs: [],
    orders: [],
    routes: [],
    vehicleSpawns: [],
    depots: [],
    employees: [],
    statistics: {},
    config: {},
    editing: {
        job: null,
        order: null,
        route: null,
        vehicle: null,
        depot: null,
        employee: null,
    },
    waypoints: [],
    placementTarget: null,
    searchQuery: '',
    jobCategoryFilter: 'all',
    selectedEmployee: null,
    vehicleTypeFilter: '',
    statsJobFilter: '',
    onlinePlayers: [],
};

let placementScrollTop = 0;

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

const TAB_LABEL_KEYS = {
    jobs: 'tabs.jobs',
    orders: 'tabs.orders',
    routes: 'tabs.routes',
    vehicles: 'tabs.vehicles',
    depots: 'tabs.depots',
    employees: 'tabs.employees',
    payout: 'tabs.payout',
    stats: 'tabs.stats',
};

const TOAST_ICON_FALLBACK = {
    success: 'check',
    error: 'x',
    inform: 'clipboard',
    new_order: 'package',
    order_complete: 'check',
    bonus: 'dollar',
    vehicle_ready: 'truck',
    salary: 'dollar',
    announcement: 'clipboard',
};

const RESOURCE_NAME = typeof GetParentResourceName === 'function'
    ? GetParentResourceName()
    : 'advanced-logistics-creator';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function esc(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
}

async function nui(event, data = {}) {
    try {
        const response = await fetch(`https://${RESOURCE_NAME}/${event}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return await response.json();
    } catch (error) {
        console.error(`[NUI] ${event} failed`, error);
        return { success: false, error: 'nui_error' };
    }
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
    el.innerHTML = `${icon(iconName)}<span>${esc(label)}</span>`;
}

function setLabelText(labelId, text) {
    const label = $(`#${labelId}`);
    if (!label) return;
    const textNode = Array.from(label.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
    if (textNode) {
        textNode.textContent = `${text}`;
    } else {
        label.prepend(document.createTextNode(text));
    }
}

function emptyState(iconName, text) {
    return `<div class="empty-state">${icon(iconName, 'icon-xl')}<p>${esc(text)}</p></div>`;
}

function actionBtn(iconName, label, onclick, extraClass = 'btn-secondary') {
    return `<button type="button" class="btn btn-sm ${extraClass}" onclick="${onclick}">${iconBtn(iconName, label)}</button>`;
}

function badge(active) {
    const isActive = !!active;
    const cls = isActive ? 'badge-active' : 'badge-inactive';
    const label = isActive ? t('active') : t('inactive');
    const ic = isActive ? 'check' : 'x';
    return `<span class="badge ${cls}">${icon(ic)}${esc(label)}</span>`;
}

function showToast(type, message) {
    const container = $('#toastContainer');
    if (!container) return;

    const cfgType = (state.config.notificationTypes || []).find((x) => x.id === type);
    const iconName = cfgType?.icon || TOAST_ICON_FALLBACK[type] || 'clipboard';
    const titleKey = `toast.${type}`;
    const title = t(titleKey) === titleKey ? (cfgType?.label || t('toast.announcement')) : t(titleKey);
    const msg = message || title;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        ${icon(iconName)}
        <div class="toast-body">
            <div class="toast-title">${esc(title)}</div>
            <div class="toast-msg">${esc(msg)}</div>
        </div>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function applyTheme(theme) {
    const nextTheme = theme === 'light' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', nextTheme);
    localStorage.setItem('alc_theme', nextTheme);

    const btnTheme = $('#btnTheme');
    if (btnTheme) {
        btnTheme.innerHTML = icon(nextTheme === 'dark' ? 'sun' : 'moon');
    }
}

function applyLocale() {
    $('#uiTitle').textContent = t('title');
    $('#uiSubtitle').textContent = t('subtitle');
    $('#globalSearch').placeholder = t('search');
    $('#langSelect').title = t('settings.language');
    $('#btnTheme').title = t('settings.theme');

    $$('.tab').forEach((tab) => {
        const tabId = tab.dataset.tab;
        tab.innerHTML = `${icon(tab.dataset.icon)}<span>${esc(t(TAB_LABEL_KEYS[tabId] || tabId))}</span>`;
    });

    setTitle($('#toolbarJobs'), 'clipboard', t('jobs.title'));
    setTitle($('#toolbarOrders'), 'package', t('orders.title'));
    setTitle($('#toolbarRoutes'), 'map', t('routes.title'));
    setTitle($('#toolbarVehicles'), 'truck', t('vehicles.title'));
    setTitle($('#toolbarDepots'), 'warehouse', t('depots.title'));
    setTitle($('#toolbarEmployees'), 'users', t('employees.title'));
    setTitle($('#toolbarPayout'), 'dollar', t('payout.title'));
    setTitle($('#toolbarStats'), 'layers', t('stats.title'));
    setTitle($('#waypointsTitle'), 'route', t('routes.waypoints'));
    setTitle($('#topDriversTitle'), 'users', t('stats.topDrivers'));
    setTitle($('#companyStatsTitle'), 'warehouse', t('stats.revenue'));
    setTitle($('#announceTitle'), 'clipboard', t('toast.announcement'));

    setBtn($('#btnNewJob'), 'plus', t('jobs.new'));
    setBtn($('#btnNewOrder'), 'plus', t('orders.new'));
    setBtn($('#btnNewRoute'), 'plus', t('routes.new'));
    setBtn($('#btnNewVehicle'), 'plus', t('vehicles.new'));
    setBtn($('#btnNewDepot'), 'plus', t('depots.new'));
    setBtn($('#btnHireEmployee'), 'plus', t('employees.hire'));
    setBtn($('#btnAddWaypoint'), 'plus', t('new'));

    setBtn($('#btnCancelJob'), 'x', t('cancel'));
    setBtn($('#btnSaveJob'), 'check', t('save'));
    setBtn($('#btnCancelOrder'), 'x', t('cancel'));
    setBtn($('#btnSaveOrder'), 'check', t('save'));
    setBtn($('#btnPreviewRoute'), 'eye', t('preview'));
    setBtn($('#btnCancelRoute'), 'x', t('cancel'));
    setBtn($('#btnSaveRoute'), 'check', t('save'));
    setBtn($('#btnCancelVehicle'), 'x', t('cancel'));
    setBtn($('#btnSaveVehicle'), 'check', t('save'));
    setBtn($('#btnPreviewDepot'), 'eye', t('preview'));
    setBtn($('#btnCancelDepot'), 'x', t('cancel'));
    setBtn($('#btnSaveDepot'), 'check', t('save'));
    setBtn($('#btnCancelHire'), 'x', t('cancel'));
    setBtn($('#btnConfirmHire'), 'check', t('employees.hire'));
    setBtn($('#btnSaveEmployee'), 'check', t('save'));
    setBtn($('#btnFireEmployee'), 'x', t('employees.fire'));
    setBtn($('#btnCloseEmployee'), 'x', t('cancel'));
    setBtn($('#btnSendAnnounce'), 'clipboard', t('toast.announcement'));
    setBtn($('#btnSavePayout'), 'check', t('save'));

    $$('.coords-row [data-placement]').forEach((btn) => {
        setBtn(btn, 'mapPin', t('setPosition'));
    });

    setLabelText('lblVehicleType', `${t('vehicles.type')} `);
    setLabelText('lblPlate', `${t('vehicles.plate')} `);
    setLabelText('lblFuel', `${t('vehicles.fuel')} `);
    setLabelText('lblHealth', `${t('vehicles.health')} `);
    setLabelText('lblMaxSpeed', `${t('vehicles.maxSpeed')} `);

    $('#payoutHint').innerHTML = `${icon('layers')} ${esc(t('payout.hint'))}`;
    setTitle($('#payoutPreviewTitle'), 'dollar', t('payout.example'));

    setTitle($('#jobFormTitle'), state.editing.job ? 'pencil' : 'plus', state.editing.job ? t('jobs.edit') : t('jobs.new'));
    setTitle($('#orderFormTitle'), state.editing.order ? 'pencil' : 'plus', state.editing.order ? t('edit') : t('orders.new'));
    setTitle($('#routeFormTitle'), state.editing.route ? 'pencil' : 'plus', state.editing.route ? t('edit') : t('routes.new'));
    setTitle($('#vehicleFormTitle'), state.editing.vehicle ? 'pencil' : 'plus', state.editing.vehicle ? t('edit') : t('vehicles.new'));
    setTitle($('#depotFormTitle'), state.editing.depot ? 'pencil' : 'plus', state.editing.depot ? t('edit') : t('depots.new'));
    setTitle($('#hireFormTitle'), 'users', t('employees.hire'));
    setTitle($('#employeeDetailTitle'), 'users', t('employees.title'));
    setTitle($('#empHistoryTitle'), 'clock', t('employees.history'));

    $('#langSelect').value = getLocale();
    populateSelects();
    renderJobCategoryChips();
    renderAll();
}

function getValueByPath(obj, path) {
    if (typeof path === 'function') return path(obj);
    if (!path.includes('.')) return obj?.[path];
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

function filterSearch(items, fields) {
    const q = state.searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => fields.some((field) => {
        const value = getValueByPath(item, field);
        if (value == null) return false;
        return String(value).toLowerCase().includes(q);
    }));
}

function toNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function formatNumber(num) {
    return new Intl.NumberFormat(getLocale() === 'de' ? 'de-DE' : 'en-US').format(toNumber(num, 0));
}

function getJobById(jobId) {
    return state.jobs.find((j) => Number(j.id) === Number(jobId));
}

function getOrderById(orderId) {
    return state.orders.find((o) => Number(o.id) === Number(orderId));
}

function getDepotTypeById(typeId) {
    return (state.config.depotTypes || []).find((d) => d.id === typeId);
}

function jobIcon(name) {
    return ICONS[name] ? name : 'truck';
}

function notificationIcon(typeId) {
    const cfg = (state.config.notificationTypes || []).find((n) => n.id === typeId);
    return cfg?.icon || TOAST_ICON_FALLBACK[typeId] || 'clipboard';
}

function selectOptions(el, options, keepValue = '') {
    if (!el) return;
    el.innerHTML = options.map((opt) => `<option value="${esc(opt.value)}">${esc(opt.label)}</option>`).join('');
    if (keepValue !== '' && options.some((opt) => String(opt.value) === String(keepValue))) {
        el.value = String(keepValue);
    }
}

function renderJobCategoryChips() {
    const chips = [
        { id: 'all', label: t('all') },
        { id: 'active', label: t('active') },
        { id: 'inactive', label: t('inactive') },
    ];
    $('#jobCategories').innerHTML = chips
        .map((chip) => `<button type="button" class="chip ${state.jobCategoryFilter === chip.id ? 'active' : ''}" data-category="${chip.id}">${esc(chip.label)}</button>`)
        .join('');
}

function hideUIForPlacement() {
    const content = $('.content');
    placementScrollTop = content ? content.scrollTop : 0;
    $('#app').classList.add('hidden');
}

function showUIAfterPlacement() {
    $('#app').classList.remove('hidden');
    const content = $('.content');
    if (content) content.scrollTop = placementScrollTop;
}

function setActiveTab(tabId) {
    $$('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === tabId));
    $$('.tab-content').forEach((content) => content.classList.toggle('active', content.id === `tab-${tabId}`));
}

function closeUI() {
    $('#app').classList.add('hidden');
    state.placementTarget = null;
    nui('clearPreview');
    nui('close');
}

function initStaticUI() {
    $('#headerLogo').innerHTML = icon('truck');
    $('#searchIcon').innerHTML = icon('search');
    $('#btnClose').innerHTML = icon('x');
    $('#btnClose').title = 'Schließen';
}

async function refreshStatistics() {
    const stats = await nui('getStatistics');
    if (stats && typeof stats === 'object') {
        state.statistics = stats;
    }
}

async function loadData() {
    const data = await nui('getData');
    if (!data || data.success === false) {
        notify('Daten konnten nicht geladen werden.', 'error');
        return;
    }

    state.jobs = data.jobs || [];
    state.orders = data.orders || [];
    state.routes = data.routes || [];
    state.vehicleSpawns = data.vehicleSpawns || [];
    state.depots = data.depots || [];
    state.employees = data.employees || [];
    state.statistics = data.statistics || {};
    state.config = data.config || {};

    if (!localStorage.getItem('alc_locale') && state.config.defaultLocale) {
        setLocale(state.config.defaultLocale);
    }

    await refreshStatistics();
    populateSelects();
    renderAll();
    applyLocale();
}

function populateSelects() {
    const jobBase = state.jobs.map((job) => ({ value: job.id, label: job.name }));
    const allJobsLabel = `${t('all')} ${t('tabs.jobs')}`;
    const allOrdersLabel = `${t('all')} ${t('tabs.orders')}`;

    selectOptions($('#orderJobFilter'), [{ value: '', label: allJobsLabel }, ...jobBase], $('#orderJobFilter')?.value || '');
    selectOptions($('#orderJobId'), jobBase, $('#orderJobId')?.value || '');
    selectOptions($('#vehicleJobFilter'), [{ value: '', label: allJobsLabel }, ...jobBase], $('#vehicleJobFilter')?.value || '');
    selectOptions($('#vehicleJobId'), jobBase, $('#vehicleJobId')?.value || '');
    selectOptions($('#depotJobFilter'), [{ value: '', label: allJobsLabel }, ...jobBase], $('#depotJobFilter')?.value || '');
    selectOptions($('#depotJobId'), jobBase, $('#depotJobId')?.value || '');
    selectOptions($('#employeeJobFilter'), [{ value: '', label: allJobsLabel }, ...jobBase], $('#employeeJobFilter')?.value || '');
    selectOptions($('#hireJobId'), jobBase, $('#hireJobId')?.value || '');
    selectOptions($('#announceJobId'), jobBase, $('#announceJobId')?.value || '');
    selectOptions($('#payoutJobSelect'), [{ value: '', label: 'Job auswählen...' }, ...jobBase], $('#payoutJobSelect')?.value || '');
    selectOptions($('#statsJobFilter'), [{ value: '', label: 'Global' }, ...jobBase], state.statsJobFilter || '');

    const orderOptions = state.orders.map((order) => {
        const job = getJobById(order.job_id);
        return { value: order.id, label: `${order.title} (${job?.name || '?'})` };
    });
    selectOptions($('#routeOrderFilter'), [{ value: '', label: allOrdersLabel }, ...orderOptions], $('#routeOrderFilter')?.value || '');
    selectOptions($('#routeOrderId'), orderOptions, $('#routeOrderId')?.value || '');

    const iconOptions = (state.config.icons || Object.keys(ICONS)).map((name) => ({ value: name, label: name }));
    selectOptions($('#jobIcon'), iconOptions, $('#jobIcon')?.value || 'truck');

    const orderTypeOptions = (state.config.orderTypes || []).map((ot) => ({ value: ot.id, label: ot.label }));
    selectOptions($('#orderType'), orderTypeOptions, $('#orderType')?.value || orderTypeOptions[0]?.value || '');

    const difficultyOptions = (state.config.difficulties || []).map((d) => ({ value: d.id, label: d.label }));
    selectOptions($('#routeDifficulty'), difficultyOptions, $('#routeDifficulty')?.value || difficultyOptions[0]?.value || '');

    const vehicleTypeOptions = (state.config.vehicleTypes || []).map((vt) => ({ value: vt.id, label: vt.label }));
    selectOptions($('#vehicleType'), vehicleTypeOptions, $('#vehicleType')?.value || vehicleTypeOptions[0]?.value || '');
    selectOptions($('#vehicleTypeFilter'), [{ value: '', label: `${t('all')} ${t('vehicles.type')}` }, ...vehicleTypeOptions], state.vehicleTypeFilter);

    const depotTypeOptions = (state.config.depotTypes || []).map((dt) => ({ value: dt.id, label: dt.label }));
    selectOptions($('#depotType'), depotTypeOptions, $('#depotType')?.value || depotTypeOptions[0]?.value || '');
    selectOptions($('#depotTypeFilter'), [{ value: '', label: `${t('all')} Typen` }, ...depotTypeOptions], $('#depotTypeFilter')?.value || '');

    const rankOptions = (state.config.employeeRanks || []).map((rank) => ({ value: rank.id, label: rank.label }));
    selectOptions($('#hireRankId'), rankOptions, $('#hireRankId')?.value || '');
    selectOptions($('#empRankId'), rankOptions, $('#empRankId')?.value || '');
}

function renderAll() {
    renderJobs();
    renderOrders();
    renderRoutes();
    renderVehicles();
    renderDepots();
    renderEmployees();
    renderPayout();
    renderStats();
}

function renderJobs() {
    let jobs = [...state.jobs];

    if (state.jobCategoryFilter === 'active') jobs = jobs.filter((job) => job.active);
    if (state.jobCategoryFilter === 'inactive') jobs = jobs.filter((job) => !job.active);

    jobs = filterSearch(jobs, ['name', 'description', 'faction_name']);

    const list = $('#jobList');
    if (!jobs.length) {
        list.innerHTML = emptyState('clipboard', t('noData'));
        return;
    }

    list.innerHTML = jobs.map((job) => `
        <div class="list-item">
            <div class="list-item-icon">${icon(jobIcon(job.icon))}</div>
            <div class="list-item-body">
                <div class="list-item-info">
                    <h4>${esc(job.name)} ${badge(job.active)}</h4>
                    <p>
                        <span class="meta-chip">${icon('layers')}Level ${toNumber(job.min_level, 0)}</span>
                        <span class="meta-chip">${icon(job.faction_bound ? 'users' : 'check')}${job.faction_bound ? `${esc(t('jobs.faction'))}: ${esc(job.faction_name || '-')}` : esc(t('jobs.public'))}</span>
                    </p>
                    <p>${esc(job.description || '-')}</p>
                </div>
            </div>
            <div class="list-item-actions">
                ${actionBtn('pencil', t('edit'), `editJob(${job.id})`)}
                ${actionBtn('trash', t('delete'), `deleteJob(${job.id})`, 'btn-danger')}
            </div>
        </div>
    `).join('');
}

function openJobForm(job = null) {
    state.editing.job = job;
    setTitle($('#jobFormTitle'), job ? 'pencil' : 'plus', job ? t('jobs.edit') : t('jobs.new'));
    $('#jobName').value = job?.name || '';
    $('#jobDescription').value = job?.description || '';
    $('#jobIcon').value = job?.icon || 'truck';
    $('#jobMinLevel').value = toNumber(job?.min_level, 0);
    $('#jobFactionBound').checked = !!job?.faction_bound;
    $('#jobFaction').value = job?.faction_name || '';
    $('#jobActive').checked = job ? !!job.active : true;
    $('#factionField').classList.toggle('hidden', !$('#jobFactionBound').checked);
    $('#jobForm').classList.remove('hidden');
}

async function saveJob() {
    const data = {
        name: $('#jobName').value.trim(),
        description: $('#jobDescription').value.trim(),
        icon: $('#jobIcon').value || 'truck',
        min_level: toNumber($('#jobMinLevel').value, 0),
        faction_bound: $('#jobFactionBound').checked,
        faction_name: $('#jobFactionBound').checked ? $('#jobFaction').value.trim() : null,
        active: $('#jobActive').checked,
        payout: state.editing.job?.payout || state.config.defaultPayout || {},
    };

    if (!data.name) {
        notify('Bitte Jobname eingeben.', 'error');
        return;
    }

    const result = await nui('saveJob', { id: state.editing.job?.id, data });
    if (!result?.success) {
        notify(`Fehler beim Speichern: ${result?.error || 'unknown'}`, 'error');
        return;
    }

    notify('Job gespeichert.', 'success');
    $('#jobForm').classList.add('hidden');
    await loadData();
}

async function removeJob(id) {
    const result = await nui('deleteJob', { id });
    if (!result?.success) {
        notify(`Löschen fehlgeschlagen: ${result?.error || 'unknown'}`, 'error');
        return;
    }
    notify('Job gelöscht.', 'success');
    await loadData();
}

function renderOrders() {
    const filterJobId = $('#orderJobFilter').value;
    let orders = filterJobId ? state.orders.filter((order) => Number(order.job_id) === Number(filterJobId)) : [...state.orders];
    orders = filterSearch(orders, ['title', 'description', 'order_type']);

    const list = $('#orderList');
    if (!orders.length) {
        list.innerHTML = emptyState('package', t('noData'));
        return;
    }

    const orderTypeMap = {};
    (state.config.orderTypes || []).forEach((type) => {
        orderTypeMap[type.id] = type.label;
    });

    list.innerHTML = orders.map((order) => {
        const job = getJobById(order.job_id);
        const iconName = ORDER_TYPE_ICONS[order.order_type] || 'box';
        return `
            <div class="list-item">
                <div class="list-item-icon">${icon(iconName)}</div>
                <div class="list-item-body">
                    <div class="list-item-info">
                        <h4>${esc(order.title)} ${badge(order.active)}</h4>
                        <p>
                            <span class="meta-chip">${icon(iconName)}${esc(orderTypeMap[order.order_type] || order.order_type || 'custom')}</span>
                            <span class="meta-chip">${icon('clipboard')}${esc(job?.name || '?')}</span>
                            <span class="meta-chip">${icon('dollar')}${formatNumber(order.reward)}$</span>
                        </p>
                        <p>${esc(order.description || '-')}</p>
                    </div>
                </div>
                <div class="list-item-actions">
                    ${actionBtn('pencil', t('edit'), `editOrder(${order.id})`)}
                    ${actionBtn('trash', t('delete'), `deleteOrder(${order.id})`, 'btn-danger')}
                </div>
            </div>
        `;
    }).join('');
}

function openOrderForm(order = null) {
    state.editing.order = order;
    setTitle($('#orderFormTitle'), order ? 'pencil' : 'plus', order ? t('edit') : t('orders.new'));
    $('#orderJobId').value = order?.job_id || $('#orderJobFilter').value || state.jobs[0]?.id || '';
    $('#orderType').value = order?.order_type || $('#orderType').value;
    $('#orderTitle').value = order?.title || '';
    $('#orderDescription').value = order?.description || '';
    $('#orderStartX').value = order?.start_point?.x ?? '';
    $('#orderStartY').value = order?.start_point?.y ?? '';
    $('#orderStartZ').value = order?.start_point?.z ?? '';
    $('#orderEndX').value = order?.end_point?.x ?? '';
    $('#orderEndY').value = order?.end_point?.y ?? '';
    $('#orderEndZ').value = order?.end_point?.z ?? '';
    $('#orderTimeLimit').value = toNumber(order?.time_limit, 0);
    $('#orderReward').value = toNumber(order?.reward, 0);
    $('#orderBonus').value = toNumber(order?.bonus_payment, 0);
    $('#orderPenalty').value = toNumber(order?.penalty, 0);
    $('#orderCooldown').value = toNumber(order?.cooldown, 0);
    $('#orderActive').checked = order ? !!order.active : true;
    $('#orderForm').classList.remove('hidden');
}

async function saveOrder() {
    const data = {
        job_id: toNumber($('#orderJobId').value, 0),
        title: $('#orderTitle').value.trim(),
        description: $('#orderDescription').value.trim(),
        order_type: $('#orderType').value || 'custom',
        start_point: {
            x: toNumber($('#orderStartX').value, NaN),
            y: toNumber($('#orderStartY').value, NaN),
            z: toNumber($('#orderStartZ').value, NaN),
        },
        end_point: {
            x: toNumber($('#orderEndX').value, NaN),
            y: toNumber($('#orderEndY').value, NaN),
            z: toNumber($('#orderEndZ').value, NaN),
        },
        time_limit: toNumber($('#orderTimeLimit').value, 0),
        reward: toNumber($('#orderReward').value, 0),
        bonus_payment: toNumber($('#orderBonus').value, 0),
        penalty: toNumber($('#orderPenalty').value, 0),
        cooldown: toNumber($('#orderCooldown').value, 0),
        active: $('#orderActive').checked,
    };

    if (!data.job_id || !data.title) {
        notify('Job und Titel sind erforderlich.', 'error');
        return;
    }
    if (!Number.isFinite(data.start_point.x) || !Number.isFinite(data.end_point.x)) {
        notify('Start- und Zielkoordinaten sind erforderlich.', 'error');
        return;
    }

    const result = await nui('saveOrder', { id: state.editing.order?.id, data });
    if (!result?.success) {
        notify(`Fehler beim Speichern: ${result?.error || 'unknown'}`, 'error');
        return;
    }

    notify('Auftrag gespeichert.', 'success');
    $('#orderForm').classList.add('hidden');
    await loadData();
}

async function removeOrder(id) {
    const result = await nui('deleteOrder', { id });
    if (!result?.success) {
        notify(`Löschen fehlgeschlagen: ${result?.error || 'unknown'}`, 'error');
        return;
    }
    notify('Auftrag gelöscht.', 'success');
    await loadData();
}

function renderRoutes() {
    const filterOrderId = $('#routeOrderFilter').value;
    let routes = filterOrderId ? state.routes.filter((route) => Number(route.order_id) === Number(filterOrderId)) : [...state.routes];
    routes = filterSearch(routes, ['name', 'difficulty']);

    const list = $('#routeList');
    if (!routes.length) {
        list.innerHTML = emptyState('map', t('noData'));
        return;
    }

    const diffMap = {};
    (state.config.difficulties || []).forEach((d) => {
        diffMap[d.id] = d.label;
    });

    list.innerHTML = routes.map((route) => {
        const order = getOrderById(route.order_id);
        return `
            <div class="list-item">
                <div class="list-item-icon">${icon('route')}</div>
                <div class="list-item-body">
                    <div class="list-item-info">
                        <h4>${esc(route.name)} ${badge(route.active)}</h4>
                        <p>
                            <span class="meta-chip">${icon('package')}${esc(order?.title || '?')}</span>
                            <span class="meta-chip">${icon('map')}${toNumber(route.distance, 0)} km</span>
                            <span class="meta-chip">${icon('layers')}${esc(diffMap[route.difficulty] || route.difficulty || 'medium')}</span>
                            <span class="meta-chip">${icon('clock')}${toNumber(route.estimated_time, 0)} min</span>
                        </p>
                    </div>
                </div>
                <div class="list-item-actions">
                    ${actionBtn('eye', t('preview'), `previewExistingRoute(${route.id})`)}
                    ${actionBtn('pencil', t('edit'), `editRoute(${route.id})`)}
                    ${actionBtn('trash', t('delete'), `deleteRoute(${route.id})`, 'btn-danger')}
                </div>
            </div>
        `;
    }).join('');
}

function renderWaypoints() {
    const list = $('#waypointList');
    if (!list) return;

    if (!state.waypoints.length) {
        list.innerHTML = emptyState('route', t('noData'));
        return;
    }

    list.innerHTML = state.waypoints.map((wp, index) => `
        <div class="dnd-item" data-index="${index}">
            <div class="waypoint-item">
                <span class="dnd-handle">${icon('grip')}</span>
                <span class="wp-num">${index + 1}</span>
                <input type="number" value="${toNumber(wp.x, 0)}" step="0.01" placeholder="X" onchange="updateWp(${index}, 'x', this.value)">
                <input type="number" value="${toNumber(wp.y, 0)}" step="0.01" placeholder="Y" onchange="updateWp(${index}, 'y', this.value)">
                <input type="number" value="${toNumber(wp.z, 0)}" step="0.01" placeholder="Z" onchange="updateWp(${index}, 'z', this.value)">
                <button type="button" class="btn btn-sm btn-ghost" onclick="placeWp(${index})">${icon('mapPin')}</button>
                <button type="button" class="btn btn-sm btn-danger" onclick="removeWp(${index})">${icon('x')}</button>
            </div>
        </div>
    `).join('');

    initDragDrop(list, state.waypoints, (items) => {
        state.waypoints = [...items];
        renderWaypoints();
    });
}

function openRouteForm(route = null) {
    state.editing.route = route;
    state.waypoints = route?.waypoints ? [...route.waypoints] : [];
    setTitle($('#routeFormTitle'), route ? 'pencil' : 'plus', route ? t('edit') : t('routes.new'));
    $('#routeOrderId').value = route?.order_id || $('#routeOrderFilter').value || state.orders[0]?.id || '';
    $('#routeName').value = route?.name || '';
    $('#routeStartX').value = route?.start_point?.x ?? '';
    $('#routeStartY').value = route?.start_point?.y ?? '';
    $('#routeStartZ').value = route?.start_point?.z ?? '';
    $('#routeEndX').value = route?.end_point?.x ?? '';
    $('#routeEndY').value = route?.end_point?.y ?? '';
    $('#routeEndZ').value = route?.end_point?.z ?? '';
    $('#routeDifficulty').value = route?.difficulty || $('#routeDifficulty').value;
    $('#routeDistance').value = toNumber(route?.distance, 0);
    $('#routeEstTime').value = toNumber(route?.estimated_time, 0);
    $('#routeGps').checked = route ? !!route.gps_enabled : true;
    $('#routeRandom').checked = route ? !!route.random_select : false;
    $('#routeShowWp').checked = route ? !!route.show_waypoints : true;
    $('#routeActive').checked = route ? !!route.active : true;
    $('#routeForm').classList.remove('hidden');
    renderWaypoints();
}

async function saveRoute() {
    const data = {
        order_id: toNumber($('#routeOrderId').value, 0),
        name: $('#routeName').value.trim(),
        start_point: {
            x: toNumber($('#routeStartX').value, NaN),
            y: toNumber($('#routeStartY').value, NaN),
            z: toNumber($('#routeStartZ').value, NaN),
        },
        end_point: {
            x: toNumber($('#routeEndX').value, NaN),
            y: toNumber($('#routeEndY').value, NaN),
            z: toNumber($('#routeEndZ').value, NaN),
        },
        waypoints: state.waypoints.map((wp) => ({
            x: toNumber(wp.x, 0),
            y: toNumber(wp.y, 0),
            z: toNumber(wp.z, 0),
        })),
        gps_enabled: $('#routeGps').checked,
        random_select: $('#routeRandom').checked,
        show_waypoints: $('#routeShowWp').checked,
        distance: toNumber($('#routeDistance').value, 0),
        estimated_time: toNumber($('#routeEstTime').value, 0),
        difficulty: $('#routeDifficulty').value || 'medium',
        active: $('#routeActive').checked,
    };

    if (!data.order_id || !data.name) {
        notify('Auftrag und Routenname sind erforderlich.', 'error');
        return;
    }
    if (!Number.isFinite(data.start_point.x) || !Number.isFinite(data.end_point.x)) {
        notify('Start- und Zielkoordinaten sind erforderlich.', 'error');
        return;
    }

    const result = await nui('saveRoute', { id: state.editing.route?.id, data });
    if (!result?.success) {
        notify(`Fehler beim Speichern: ${result?.error || 'unknown'}`, 'error');
        return;
    }

    notify('Route gespeichert.', 'success');
    $('#routeForm').classList.add('hidden');
    nui('clearPreview');
    await loadData();
}

async function removeRoute(id) {
    const result = await nui('deleteRoute', { id });
    if (!result?.success) {
        notify(`Löschen fehlgeschlagen: ${result?.error || 'unknown'}`, 'error');
        return;
    }
    notify('Route gelöscht.', 'success');
    await loadData();
}

async function previewRouteFromForm() {
    const payload = {
        route: {
            start_point: {
                x: toNumber($('#routeStartX').value, NaN),
                y: toNumber($('#routeStartY').value, NaN),
                z: toNumber($('#routeStartZ').value, NaN),
            },
            end_point: {
                x: toNumber($('#routeEndX').value, NaN),
                y: toNumber($('#routeEndY').value, NaN),
                z: toNumber($('#routeEndZ').value, NaN),
            },
            waypoints: state.waypoints.map((wp) => ({ x: toNumber(wp.x, 0), y: toNumber(wp.y, 0), z: toNumber(wp.z, 0) })),
        },
    };
    await nui('previewRoute', payload);
}

function renderVehicles() {
    const filterJobId = $('#vehicleJobFilter').value;
    const filterType = $('#vehicleTypeFilter').value || state.vehicleTypeFilter;

    let vehicles = [...state.vehicleSpawns];
    if (filterJobId) vehicles = vehicles.filter((spawn) => Number(spawn.job_id) === Number(filterJobId));
    if (filterType) vehicles = vehicles.filter((spawn) => spawn.vehicle_type === filterType);

    vehicles = filterSearch(vehicles, ['model', 'label', 'plate', 'vehicle_type']);

    const list = $('#vehicleList');
    if (!vehicles.length) {
        list.innerHTML = emptyState('truck', t('noData'));
        return;
    }

    const typeMap = {};
    (state.config.vehicleTypes || []).forEach((type) => {
        typeMap[type.id] = type.label;
    });

    list.innerHTML = vehicles.map((spawn) => {
        const job = getJobById(spawn.job_id);
        return `
            <div class="list-item">
                <div class="list-item-icon">${icon('car')}</div>
                <div class="list-item-body">
                    <div class="list-item-info">
                        <h4>${esc(spawn.label || spawn.model)} ${badge(spawn.active)}</h4>
                        <p>
                            <span class="meta-chip">${icon('truck')}${esc(spawn.model)}</span>
                            <span class="meta-chip">${icon('layers')}${esc(typeMap[spawn.vehicle_type] || spawn.vehicle_type || '-')}</span>
                            <span class="meta-chip">${icon('clipboard')}${esc(job?.name || '?')}</span>
                        </p>
                        <p>
                            <span class="meta-chip">${icon('dollar')}${spawn.is_rental ? esc(t('vehicles.rental')) : esc(t('vehicles.owned'))}</span>
                            <span class="meta-chip">${icon('droplet')}${toNumber(spawn.fuel_level, 100)}%</span>
                            <span class="meta-chip">${icon('hammer')}${toNumber(spawn.vehicle_health, 1000)}</span>
                            <span class="meta-chip">${icon('clock')}${toNumber(spawn.max_speed, 0)}</span>
                        </p>
                    </div>
                </div>
                <div class="list-item-actions">
                    ${actionBtn('pencil', t('edit'), `editVehicle(${spawn.id})`)}
                    ${actionBtn('trash', t('delete'), `deleteVehicle(${spawn.id})`, 'btn-danger')}
                </div>
            </div>
        `;
    }).join('');
}

function openVehicleForm(vehicle = null) {
    state.editing.vehicle = vehicle;
    setTitle($('#vehicleFormTitle'), vehicle ? 'pencil' : 'plus', vehicle ? t('edit') : t('vehicles.new'));
    $('#vehicleJobId').value = vehicle?.job_id || $('#vehicleJobFilter').value || state.jobs[0]?.id || '';
    $('#vehicleType').value = vehicle?.vehicle_type || $('#vehicleType').value;
    $('#vehicleModel').value = vehicle?.model || '';
    $('#vehicleLabel').value = vehicle?.label || '';
    $('#vehiclePlate').value = vehicle?.plate || '';
    $('#vehicleFuel').value = toNumber(vehicle?.fuel_level, 100);
    $('#vehicleHealth').value = toNumber(vehicle?.vehicle_health, 1000);
    $('#vehicleMaxSpeed').value = toNumber(vehicle?.max_speed, 0);
    $('#vehicleRental').checked = !!vehicle?.is_rental;
    $('#vehicleX').value = vehicle?.coords?.x ?? '';
    $('#vehicleY').value = vehicle?.coords?.y ?? '';
    $('#vehicleZ').value = vehicle?.coords?.z ?? '';
    $('#vehicleHeading').value = toNumber(vehicle?.heading, 0);
    $('#vehicleLivery').value = vehicle?.livery ?? -1;
    $('#vehicleActive').checked = vehicle ? !!vehicle.active : true;
    $('#vehicleForm').classList.remove('hidden');
}

async function saveVehicle() {
    const data = {
        job_id: toNumber($('#vehicleJobId').value, 0),
        model: $('#vehicleModel').value.trim(),
        label: $('#vehicleLabel').value.trim(),
        vehicle_type: $('#vehicleType').value || 'transporter',
        plate: $('#vehiclePlate').value.trim() || null,
        fuel_level: toNumber($('#vehicleFuel').value, 100),
        vehicle_health: toNumber($('#vehicleHealth').value, 1000),
        max_speed: toNumber($('#vehicleMaxSpeed').value, 0),
        is_rental: $('#vehicleRental').checked,
        coords: {
            x: toNumber($('#vehicleX').value, NaN),
            y: toNumber($('#vehicleY').value, NaN),
            z: toNumber($('#vehicleZ').value, NaN),
        },
        heading: toNumber($('#vehicleHeading').value, 0),
        livery: toNumber($('#vehicleLivery').value, -1),
        active: $('#vehicleActive').checked,
    };

    if (!data.job_id || !data.model) {
        notify('Job und Modell sind erforderlich.', 'error');
        return;
    }
    if (!Number.isFinite(data.coords.x)) {
        notify('Spawn-Koordinaten sind erforderlich.', 'error');
        return;
    }

    const result = await nui('saveVehicleSpawn', { id: state.editing.vehicle?.id, data });
    if (!result?.success) {
        notify(`Fehler beim Speichern: ${result?.error || 'unknown'}`, 'error');
        return;
    }

    notify('Fahrzeug gespeichert.', 'success');
    $('#vehicleForm').classList.add('hidden');
    await loadData();
}

async function removeVehicle(id) {
    const result = await nui('deleteVehicleSpawn', { id });
    if (!result?.success) {
        notify(`Löschen fehlgeschlagen: ${result?.error || 'unknown'}`, 'error');
        return;
    }
    notify('Fahrzeug gelöscht.', 'success');
    await loadData();
}

function renderDepots() {
    const filterJobId = $('#depotJobFilter').value;
    const filterType = $('#depotTypeFilter').value;

    let depots = [...state.depots];
    if (filterJobId) depots = depots.filter((depot) => Number(depot.job_id) === Number(filterJobId));
    if (filterType) depots = depots.filter((depot) => depot.depot_type === filterType);
    depots = filterSearch(depots, ['name', 'depot_type', 'blip_label']);

    const list = $('#depotList');
    if (!depots.length) {
        list.innerHTML = emptyState('warehouse', t('noData'));
        return;
    }

    const depotTypeMap = {};
    (state.config.depotTypes || []).forEach((type) => {
        depotTypeMap[type.id] = type;
    });

    list.innerHTML = depots.map((depot) => {
        const job = getJobById(depot.job_id);
        const depotType = depotTypeMap[depot.depot_type];
        const depotIcon = depotType?.icon || 'warehouse';
        return `
            <div class="list-item">
                <div class="list-item-icon">${icon(depotIcon)}</div>
                <div class="list-item-body">
                    <div class="list-item-info">
                        <h4>${esc(depot.name)} ${badge(depot.active)}</h4>
                        <p>
                            <span class="meta-chip">${icon('clipboard')}${esc(job?.name || '?')}</span>
                            <span class="meta-chip">${icon(depotIcon)}${esc(depotType?.label || depot.depot_type || '-')}</span>
                            ${depot.blip_enabled ? `<span class="meta-chip">${icon('mapPin')}${esc(t('depots.blip'))}</span>` : ''}
                            ${depot.marker_enabled ? `<span class="meta-chip">${icon('map')}${esc(t('depots.marker'))}</span>` : ''}
                            ${depot.npc_enabled ? `<span class="meta-chip">${icon('users')}${esc(t('depots.npc'))}</span>` : ''}
                            ${depot.teleport_enabled ? `<span class="meta-chip">${icon('route')}${esc(t('depots.teleport'))}</span>` : ''}
                        </p>
                    </div>
                </div>
                <div class="list-item-actions">
                    ${actionBtn('pencil', t('edit'), `editDepot(${depot.id})`)}
                    ${actionBtn('trash', t('delete'), `deleteDepot(${depot.id})`, 'btn-danger')}
                </div>
            </div>
        `;
    }).join('');
}

function openDepotForm(depot = null) {
    state.editing.depot = depot;
    setTitle($('#depotFormTitle'), depot ? 'pencil' : 'plus', depot ? t('edit') : t('depots.new'));
    $('#depotJobId').value = depot?.job_id || $('#depotJobFilter').value || state.jobs[0]?.id || '';
    $('#depotType').value = depot?.depot_type || $('#depotType').value;
    $('#depotName').value = depot?.name || '';
    $('#depotX').value = depot?.coords?.x ?? '';
    $('#depotY').value = depot?.coords?.y ?? '';
    $('#depotZ').value = depot?.coords?.z ?? '';
    $('#depotHeading').value = toNumber(depot?.heading, 0);
    $('#depotBlipEnabled').checked = depot ? !!depot.blip_enabled : true;
    $('#depotBlipSprite').value = toNumber(depot?.blip_sprite, 473);
    $('#depotBlipColor').value = toNumber(depot?.blip_color, 3);
    $('#depotMarkerEnabled').checked = depot ? !!depot.marker_enabled : true;
    $('#depotMarkerSize').value = toNumber(depot?.marker_size, 1.5);
    $('#depotNpcEnabled').checked = !!depot?.npc_enabled;
    $('#depotNpcModel').value = depot?.npc_model || 's_m_m_trucker_01';
    $('#depotTeleportEnabled').checked = !!depot?.teleport_enabled;
    $('#depotTpX').value = depot?.teleport_coords?.x ?? '';
    $('#depotTpY').value = depot?.teleport_coords?.y ?? '';
    $('#depotTpZ').value = depot?.teleport_coords?.z ?? '';
    $('#depotActive').checked = depot ? !!depot.active : true;
    $('#depotForm').classList.remove('hidden');
}

async function saveDepot() {
    const coords = {
        x: toNumber($('#depotX').value, NaN),
        y: toNumber($('#depotY').value, NaN),
        z: toNumber($('#depotZ').value, NaN),
    };
    const npcEnabled = $('#depotNpcEnabled').checked;
    const tpEnabled = $('#depotTeleportEnabled').checked;
    const teleportCoords = tpEnabled
        ? {
            x: toNumber($('#depotTpX').value, NaN),
            y: toNumber($('#depotTpY').value, NaN),
            z: toNumber($('#depotTpZ').value, NaN),
        }
        : null;

    const data = {
        job_id: toNumber($('#depotJobId').value, 0),
        depot_type: $('#depotType').value || 'logistics_center',
        name: $('#depotName').value.trim(),
        coords,
        heading: toNumber($('#depotHeading').value, 0),
        blip_enabled: $('#depotBlipEnabled').checked,
        blip_sprite: toNumber($('#depotBlipSprite').value, 473),
        blip_color: toNumber($('#depotBlipColor').value, 3),
        blip_label: $('#depotName').value.trim() || null,
        marker_enabled: $('#depotMarkerEnabled').checked,
        marker_type: 1,
        marker_size: toNumber($('#depotMarkerSize').value, 1.5),
        npc_enabled: npcEnabled,
        npc_model: $('#depotNpcModel').value.trim() || 's_m_m_trucker_01',
        npc_coords: npcEnabled ? { x: coords.x, y: coords.y, z: coords.z } : null,
        teleport_enabled: tpEnabled,
        teleport_coords: tpEnabled ? teleportCoords : null,
        active: $('#depotActive').checked,
    };

    if (!data.job_id || !data.name) {
        notify('Job und Depotname sind erforderlich.', 'error');
        return;
    }
    if (!Number.isFinite(data.coords.x)) {
        notify('Depot-Koordinaten sind erforderlich.', 'error');
        return;
    }
    if (tpEnabled && !Number.isFinite(teleportCoords.x)) {
        notify('Teleport-Koordinaten sind unvollständig.', 'error');
        return;
    }

    const result = await nui('saveDepot', { id: state.editing.depot?.id, data });
    if (!result?.success) {
        notify(`Fehler beim Speichern: ${result?.error || 'unknown'}`, 'error');
        return;
    }

    notify('Depot gespeichert.', 'success');
    $('#depotForm').classList.add('hidden');
    await loadData();
}

async function removeDepot(id) {
    const result = await nui('deleteDepot', { id });
    if (!result?.success) {
        notify(`Löschen fehlgeschlagen: ${result?.error || 'unknown'}`, 'error');
        return;
    }
    notify('Depot gelöscht.', 'success');
    await loadData();
}

async function renderEmployeeHistory(employee) {
    const history = await nui('getEmployeeHistory', {
        identifier: employee.identifier,
        jobId: employee.job_id,
    });
    const list = $('#employeeHistory');
    if (!Array.isArray(history) || !history.length) {
        list.innerHTML = emptyState('clock', t('noData'));
        return;
    }

    list.innerHTML = history.map((entry) => `
        <div class="list-item">
            <div class="list-item-icon">${icon(entry.status === 'completed' ? 'check' : 'x')}</div>
            <div class="list-item-body">
                <div class="list-item-info">
                    <h4>${esc(entry.player_name || employee.player_name || '-')}</h4>
                    <p>
                        <span class="meta-chip">${icon('clipboard')}#${toNumber(entry.order_id, 0)}</span>
                        <span class="meta-chip">${icon('dollar')}${formatNumber(entry.earnings)}$</span>
                        <span class="meta-chip">${icon('map')}${toNumber(entry.distance_km, 0)} km</span>
                        <span class="meta-chip">${icon('clock')}${esc(entry.completed_at || '')}</span>
                    </p>
                </div>
            </div>
        </div>
    `).join('');
}

function getEmployeeDriverStats(employee) {
    const top = state.statistics.top_drivers || [];
    return top.find((item) => item.identifier === employee.identifier && Number(item.job_id) === Number(employee.job_id)) || {};
}

function renderEmployeeStats(employee) {
    const stats = getEmployeeDriverStats(employee);
    const statCards = [
        { icon: 'layers', value: employee.rank_label || '-', label: t('employees.rank') },
        { icon: 'star', value: toNumber(employee.driver_level, 1), label: t('employees.level') },
        { icon: 'package', value: formatNumber(stats.completed_orders), label: t('stats.completed') },
        { icon: 'map', value: `${toNumber(stats.km_driven, 0)} km`, label: t('stats.km') },
        { icon: 'dollar', value: `${formatNumber(stats.total_earnings)}$`, label: t('employees.earnings') },
        { icon: 'check', value: `${toNumber(stats.success_count, 0)}`, label: t('stats.success') },
    ];

    $('#employeeStats').innerHTML = statCards.map((card) => `
        <div class="stat-card">
            ${icon(card.icon)}
            <div class="stat-value">${esc(card.value)}</div>
            <div class="stat-label">${esc(card.label)}</div>
        </div>
    `).join('');
}

async function openEmployeeDetail(employeeId) {
    const employee = state.employees.find((emp) => Number(emp.id) === Number(employeeId));
    if (!employee) return;

    state.selectedEmployee = employee.id;
    state.editing.employee = employee;

    $('#employeeDetail').classList.remove('hidden');
    $('#hireForm').classList.add('hidden');
    $('#empRankId').value = employee.rank_id;
    $('#empDriverLevel').value = toNumber(employee.driver_level, 1);

    renderEmployeeStats(employee);
    await renderEmployeeHistory(employee);
}

async function loadOnlinePlayers() {
    const players = await nui('getOnlinePlayers');
    state.onlinePlayers = Array.isArray(players) ? players : [];
    const options = state.onlinePlayers.map((player) => ({
        value: player.identifier,
        label: `${player.name} [${player.source}]`,
    }));
    selectOptions($('#hirePlayerId'), [{ value: '', label: t('employees.selectPlayer') }, ...options], $('#hirePlayerId')?.value || '');
}

function renderEmployees() {
    const filterJobId = $('#employeeJobFilter').value;
    let employees = filterJobId ? state.employees.filter((emp) => Number(emp.job_id) === Number(filterJobId)) : [...state.employees];
    employees = filterSearch(employees, ['player_name', 'identifier', 'rank_label']);

    const list = $('#employeeList');
    if (!employees.length) {
        list.innerHTML = emptyState('users', t('noData'));
        return;
    }

    list.innerHTML = employees.map((employee) => {
        const job = getJobById(employee.job_id);
        return `
            <div class="list-item">
                <div class="list-item-icon">${icon('users')}</div>
                <div class="list-item-body">
                    <div class="list-item-info">
                        <h4>${esc(employee.player_name || employee.identifier)} ${badge(employee.active)}</h4>
                        <p>
                            <span class="meta-chip">${icon('clipboard')}${esc(job?.name || '?')}</span>
                            <span class="meta-chip">${icon('layers')}${esc(employee.rank_label || '-')}</span>
                            <span class="meta-chip">${icon('star')}Lvl ${toNumber(employee.driver_level, 1)}</span>
                        </p>
                    </div>
                </div>
                <div class="list-item-actions">
                    ${actionBtn('eye', t('preview'), `viewEmployee(${employee.id})`)}
                    ${actionBtn('x', t('employees.fire'), `fireEmployee(${employee.id})`, 'btn-danger')}
                    ${actionBtn('trash', t('delete'), `deleteEmployee(${employee.id})`, 'btn-danger')}
                </div>
            </div>
        `;
    }).join('');
}

async function hireEmployee() {
    const jobId = toNumber($('#hireJobId').value, 0);
    const identifier = $('#hirePlayerId').value;
    const rankId = toNumber($('#hireRankId').value, 2);
    const player = state.onlinePlayers.find((p) => p.identifier === identifier);

    if (!jobId || !identifier) {
        notify('Job und Spieler sind erforderlich.', 'error');
        return;
    }

    const result = await nui('hireEmployee', {
        data: {
            job_id: jobId,
            identifier,
            player_name: player?.name || 'Unbekannt',
            rank_id: rankId,
        },
    });

    if (!result?.success) {
        notify(`Einstellen fehlgeschlagen: ${result?.error || 'unknown'}`, 'error');
        return;
    }

    notify('Mitarbeiter eingestellt.', 'success');
    $('#hireForm').classList.add('hidden');
    await loadData();
}

async function updateEmployee() {
    if (!state.selectedEmployee) return;
    const data = {
        rank_id: toNumber($('#empRankId').value, 2),
        driver_level: toNumber($('#empDriverLevel').value, 1),
    };

    const result = await nui('updateEmployee', {
        id: state.selectedEmployee,
        data,
    });

    if (!result?.success) {
        notify(`Update fehlgeschlagen: ${result?.error || 'unknown'}`, 'error');
        return;
    }

    notify('Mitarbeiter aktualisiert.', 'success');
    await loadData();
    await openEmployeeDetail(state.selectedEmployee);
}

async function fireEmployeeById(employeeId) {
    const result = await nui('fireEmployee', { id: employeeId });
    if (!result?.success) {
        notify(`Entlassen fehlgeschlagen: ${result?.error || 'unknown'}`, 'error');
        return;
    }
    notify('Mitarbeiter entlassen.', 'success');
    if (Number(state.selectedEmployee) === Number(employeeId)) {
        $('#employeeDetail').classList.add('hidden');
        state.selectedEmployee = null;
    }
    await loadData();
}

async function deleteEmployeeById(employeeId) {
    const result = await nui('deleteEmployee', { id: employeeId });
    if (!result?.success) {
        notify(`Löschen fehlgeschlagen: ${result?.error || 'unknown'}`, 'error');
        return;
    }
    notify('Mitarbeiter gelöscht.', 'success');
    if (Number(state.selectedEmployee) === Number(employeeId)) {
        $('#employeeDetail').classList.add('hidden');
        state.selectedEmployee = null;
    }
    await loadData();
}

async function sendAnnouncement() {
    const jobId = toNumber($('#announceJobId').value, 0);
    const message = $('#announceMessage').value.trim();

    if (!jobId || !message) {
        notify('Job und Nachricht sind erforderlich.', 'error');
        return;
    }

    const result = await nui('sendAnnouncement', { jobId, message });
    if (!result?.success) {
        notify(`Senden fehlgeschlagen: ${result?.error || 'unknown'}`, 'error');
        return;
    }

    $('#announceMessage').value = '';
    notify('Ankündigung gesendet.', 'success');
}

function calcLine(iconName, text) {
    return `<div class="calc-line">${icon(iconName)}${esc(text)}</div>`;
}

function updatePayoutPreview() {
    const base = toNumber($('#payBase').value, 0);
    const perKm = toNumber($('#payPerKm').value, 0);
    const perDelivery = toNumber($('#payPerDelivery').value, 0);
    const timeBonus = toNumber($('#payTimeBonus').value, 0);
    const flawless = toNumber($('#payFlawless').value, 0);
    const xp = toNumber($('#payXp').value, 0);
    const exampleKm = 10;
    const total = base + perKm * exampleKm + perDelivery + timeBonus + flawless;

    $('#payoutCalc').innerHTML = `
        ${calcLine('dollar', `${t('stats.earned')}: ${formatNumber(base)}$`)}
        ${calcLine('map', `+ ${formatNumber(perKm)}$ × ${exampleKm} km = ${formatNumber(perKm * exampleKm)}$`)}
        ${calcLine('package', `+ ${formatNumber(perDelivery)}$`) }
        ${calcLine('clock', `+ ${formatNumber(timeBonus)}$`) }
        ${calcLine('check', `+ ${formatNumber(flawless)}$`) }
        ${calcLine('star', `+ ${formatNumber(xp)} XP`) }
        <div class="total">${icon('dollar')}${esc(`${t('payout.total')}: ${formatNumber(total)}$ + ${formatNumber(xp)} XP`)}</div>
    `;
}

function renderPayout() {
    const selectedJobId = toNumber($('#payoutJobSelect').value, 0);
    if (!selectedJobId) {
        $('#payoutHint').classList.remove('hidden');
        $('#payoutForm').classList.add('hidden');
        $('#payoutPreview').classList.add('hidden');
        $('#payoutActions').classList.add('hidden');
        return;
    }

    const job = getJobById(selectedJobId);
    const payout = job?.payout || state.config.defaultPayout || {};
    $('#payBase').value = toNumber(payout.baseSalary, 0);
    $('#payPerKm').value = toNumber(payout.perKm, 0);
    $('#payPerDelivery').value = toNumber(payout.perDelivery, 0);
    $('#payTimeBonus').value = toNumber(payout.timeBonus, 0);
    $('#payFlawless').value = toNumber(payout.flawlessBonus, 0);
    $('#payDifficulty').value = toNumber(payout.difficultyBonus, 0);
    $('#payXp').value = toNumber(payout.xpReward, 0);
    $('#payoutHint').classList.add('hidden');
    $('#payoutForm').classList.remove('hidden');
    $('#payoutPreview').classList.remove('hidden');
    $('#payoutActions').classList.remove('hidden');
    updatePayoutPreview();
}

async function savePayout() {
    const selectedJobId = toNumber($('#payoutJobSelect').value, 0);
    const job = getJobById(selectedJobId);
    if (!job) return;

    const data = {
        name: job.name,
        description: job.description || '',
        icon: job.icon || 'truck',
        min_level: toNumber(job.min_level, 0),
        faction_bound: !!job.faction_bound,
        faction_name: job.faction_name || null,
        active: !!job.active,
        payout: {
            baseSalary: toNumber($('#payBase').value, 0),
            perKm: toNumber($('#payPerKm').value, 0),
            perDelivery: toNumber($('#payPerDelivery').value, 0),
            timeBonus: toNumber($('#payTimeBonus').value, 0),
            flawlessBonus: toNumber($('#payFlawless').value, 0),
            difficultyBonus: toNumber($('#payDifficulty').value, 0),
            xpReward: toNumber($('#payXp').value, 0),
        },
    };

    const result = await nui('saveJob', { id: job.id, data });
    if (!result?.success) {
        notify(`Speichern fehlgeschlagen: ${result?.error || 'unknown'}`, 'error');
        return;
    }

    notify('Gehaltssystem gespeichert.', 'success');
    await loadData();
}

function renderStats() {
    const selectedJobId = toNumber(state.statsJobFilter || $('#statsJobFilter').value, 0);
    const stats = state.statistics || {};
    const topDrivers = Array.isArray(stats.top_drivers) ? stats.top_drivers : [];
    const companyStats = Array.isArray(stats.company_stats) ? stats.company_stats : [];
    const filteredTopDrivers = selectedJobId ? topDrivers.filter((d) => Number(d.job_id) === selectedJobId) : topDrivers;
    const filteredCompany = selectedJobId ? companyStats.filter((s) => Number(s.job_id) === selectedJobId) : companyStats;
    const selectedCompany = selectedJobId ? filteredCompany[0] : null;

    const overview = [
        {
            icon: 'package',
            label: t('stats.completed'),
            value: selectedCompany ? toNumber(selectedCompany.total_orders, 0) : toNumber(stats.completed_orders, 0),
        },
        {
            icon: 'map',
            label: t('stats.km'),
            value: selectedCompany ? `${toNumber(selectedCompany.total_km, 0)} km` : `${toNumber(stats.km_driven, 0)} km`,
        },
        {
            icon: 'dollar',
            label: t('stats.earned'),
            value: `${formatNumber(selectedCompany ? selectedCompany.total_revenue : stats.total_earnings)}$`,
        },
        {
            icon: 'clock',
            label: t('stats.today'),
            value: toNumber(selectedCompany ? filteredTopDrivers.reduce((sum, row) => sum + toNumber(row.deliveries_today, 0), 0) : stats.deliveries_today, 0),
        },
        {
            icon: 'check',
            label: t('stats.success'),
            value: `${toNumber(selectedCompany ? selectedCompany.success_rate : stats.success_rate, 100).toFixed(1)}%`,
        },
        {
            icon: 'warehouse',
            label: t('stats.revenue'),
            value: `${formatNumber(selectedCompany ? selectedCompany.total_revenue : stats.company_revenue)}$`,
        },
    ];

    $('#statsOverview').innerHTML = overview.map((item) => `
        <div class="stat-card">
            ${icon(item.icon)}
            <div class="stat-value">${esc(item.value)}</div>
            <div class="stat-label">${esc(item.label)}</div>
        </div>
    `).join('');

    const topDriversList = $('#topDriversList');
    if (!filteredTopDrivers.length) {
        topDriversList.innerHTML = emptyState('users', t('noData'));
    } else {
        topDriversList.innerHTML = filteredTopDrivers.map((driver, idx) => `
            <div class="list-item">
                <div class="list-item-icon">${icon(idx === 0 ? 'star' : 'users')}</div>
                <div class="list-item-body">
                    <div class="list-item-info">
                        <h4>${esc(driver.player_name || driver.identifier || '-')}</h4>
                        <p>
                            <span class="meta-chip">${icon('package')}${toNumber(driver.completed_orders, 0)}</span>
                            <span class="meta-chip">${icon('map')}${toNumber(driver.km_driven, 0)} km</span>
                            <span class="meta-chip">${icon('dollar')}${formatNumber(driver.total_earnings)}$</span>
                            <span class="meta-chip">${icon('clock')}${toNumber(driver.deliveries_today, 0)}</span>
                        </p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    const companyList = $('#companyStatsList');
    if (!filteredCompany.length) {
        companyList.innerHTML = emptyState('warehouse', t('noData'));
    } else {
        companyList.innerHTML = filteredCompany.map((company) => `
            <div class="list-item">
                <div class="list-item-icon">${icon('warehouse')}</div>
                <div class="list-item-body">
                    <div class="list-item-info">
                        <h4>${esc(company.job_name || getJobById(company.job_id)?.name || `#${company.job_id}`)}</h4>
                        <p>
                            <span class="meta-chip">${icon('dollar')}${formatNumber(company.total_revenue)}$</span>
                            <span class="meta-chip">${icon('package')}${toNumber(company.total_orders, 0)}</span>
                            <span class="meta-chip">${icon('map')}${toNumber(company.total_km, 0)} km</span>
                            <span class="meta-chip">${icon('check')}${toNumber(company.success_rate, 100).toFixed(1)}%</span>
                        </p>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

function applyPlacement(coords, type) {
    if (!coords) return;
    const target = type || state.placementTarget;

    const placementMap = {
        orderStart: ['orderStartX', 'orderStartY', 'orderStartZ'],
        orderEnd: ['orderEndX', 'orderEndY', 'orderEndZ'],
        routeStart: ['routeStartX', 'routeStartY', 'routeStartZ'],
        routeEnd: ['routeEndX', 'routeEndY', 'routeEndZ'],
        vehicle: ['vehicleX', 'vehicleY', 'vehicleZ'],
        depot: ['depotX', 'depotY', 'depotZ'],
        depotTeleport: ['depotTpX', 'depotTpY', 'depotTpZ'],
    };

    if (target && target.startsWith('waypoint_')) {
        const index = toNumber(target.split('_')[1], -1);
        if (index >= 0 && state.waypoints[index]) {
            state.waypoints[index] = {
                x: toNumber(coords.x, 0),
                y: toNumber(coords.y, 0),
                z: toNumber(coords.z, 0),
            };
            renderWaypoints();
        }
        state.placementTarget = null;
        return;
    }

    const fields = placementMap[target];
    if (fields) {
        $(`#${fields[0]}`).value = toNumber(coords.x, 0);
        $(`#${fields[1]}`).value = toNumber(coords.y, 0);
        $(`#${fields[2]}`).value = toNumber(coords.z, 0);
        if (target === 'vehicle') $('#vehicleHeading').value = toNumber(coords.heading, 0);
        if (target === 'depot') $('#depotHeading').value = toNumber(coords.heading, 0);
    }

    state.placementTarget = null;
}

function bindEvents() {
    $$('.tab').forEach((tab) => {
        tab.addEventListener('click', async () => {
            const tabId = tab.dataset.tab;
            setActiveTab(tabId);
            if (tabId === 'stats') {
                await refreshStatistics();
                renderStats();
            }
        });
    });

    $('#btnClose').addEventListener('click', closeUI);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeUI();
    });

    $('#jobCategories').addEventListener('click', (e) => {
        const btn = e.target.closest('.chip');
        if (!btn) return;
        state.jobCategoryFilter = btn.dataset.category || 'all';
        renderJobCategoryChips();
        renderJobs();
    });

    $('#btnNewJob').addEventListener('click', () => openJobForm(null));
    $('#btnCancelJob').addEventListener('click', () => $('#jobForm').classList.add('hidden'));
    $('#btnSaveJob').addEventListener('click', saveJob);
    $('#jobFactionBound').addEventListener('change', (e) => {
        $('#factionField').classList.toggle('hidden', !e.target.checked);
    });

    $('#orderJobFilter').addEventListener('change', renderOrders);
    $('#btnNewOrder').addEventListener('click', () => openOrderForm(null));
    $('#btnCancelOrder').addEventListener('click', () => $('#orderForm').classList.add('hidden'));
    $('#btnSaveOrder').addEventListener('click', saveOrder);

    $('#routeOrderFilter').addEventListener('change', renderRoutes);
    $('#btnNewRoute').addEventListener('click', () => openRouteForm(null));
    $('#btnCancelRoute').addEventListener('click', () => {
        $('#routeForm').classList.add('hidden');
        nui('clearPreview');
    });
    $('#btnSaveRoute').addEventListener('click', saveRoute);
    $('#btnPreviewRoute').addEventListener('click', previewRouteFromForm);
    $('#btnAddWaypoint').addEventListener('click', async () => {
        const coords = await nui('getPlayerCoords');
        state.waypoints.push({
            x: toNumber(coords?.x, 0),
            y: toNumber(coords?.y, 0),
            z: toNumber(coords?.z, 0),
        });
        renderWaypoints();
    });

    $('#vehicleJobFilter').addEventListener('change', renderVehicles);
    $('#vehicleTypeFilter').addEventListener('change', (e) => {
        state.vehicleTypeFilter = e.target.value;
        renderVehicles();
    });
    $('#btnNewVehicle').addEventListener('click', () => openVehicleForm(null));
    $('#btnCancelVehicle').addEventListener('click', () => $('#vehicleForm').classList.add('hidden'));
    $('#btnSaveVehicle').addEventListener('click', saveVehicle);

    $('#depotJobFilter').addEventListener('change', renderDepots);
    $('#depotTypeFilter').addEventListener('change', renderDepots);
    $('#btnNewDepot').addEventListener('click', () => openDepotForm(null));
    $('#btnCancelDepot').addEventListener('click', () => $('#depotForm').classList.add('hidden'));
    $('#btnSaveDepot').addEventListener('click', saveDepot);
    $('#btnPreviewDepot').addEventListener('click', async () => {
        const coords = await nui('getPlayerCoords');
        applyPlacement(coords, 'depot');
        notify('Depotposition aktualisiert.', 'inform');
    });
    $('#depotType').addEventListener('change', () => {
        if (state.editing.depot) return;
        const selected = getDepotTypeById($('#depotType').value);
        if (!selected) return;
        $('#depotBlipSprite').value = toNumber(selected.blipSprite, 473);
        $('#depotBlipColor').value = toNumber(selected.blipColor, 3);
    });

    $('#employeeJobFilter').addEventListener('change', renderEmployees);
    $('#btnHireEmployee').addEventListener('click', async () => {
        $('#hireForm').classList.remove('hidden');
        $('#employeeDetail').classList.add('hidden');
        await loadOnlinePlayers();
    });
    $('#btnCancelHire').addEventListener('click', () => $('#hireForm').classList.add('hidden'));
    $('#btnConfirmHire').addEventListener('click', hireEmployee);
    $('#btnSaveEmployee').addEventListener('click', updateEmployee);
    $('#btnFireEmployee').addEventListener('click', () => {
        if (!state.selectedEmployee) return;
        fireEmployeeById(state.selectedEmployee);
    });
    $('#btnCloseEmployee').addEventListener('click', () => {
        $('#employeeDetail').classList.add('hidden');
        state.selectedEmployee = null;
    });
    $('#btnSendAnnounce').addEventListener('click', sendAnnouncement);

    $('#payoutJobSelect').addEventListener('change', renderPayout);
    $('#btnSavePayout').addEventListener('click', savePayout);
    ['payBase', 'payPerKm', 'payPerDelivery', 'payTimeBonus', 'payFlawless', 'payDifficulty', 'payXp']
        .forEach((id) => $(`#${id}`).addEventListener('input', updatePayoutPreview));

    $('#statsJobFilter').addEventListener('change', (e) => {
        state.statsJobFilter = e.target.value;
        renderStats();
    });

    $$('.coords-row [data-placement]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.placement;
            state.placementTarget = target;
            nui('startPlacement', { placementType: target });
        });
    });

    $('#langSelect').addEventListener('change', (e) => {
        setLocale(e.target.value || 'de');
        applyLocale();
    });

    $('#btnTheme').addEventListener('click', () => {
        const current = document.body.getAttribute('data-theme') || 'dark';
        applyTheme(current === 'dark' ? 'light' : 'dark');
    });

    $('#globalSearch').addEventListener('input', (e) => {
        state.searchQuery = e.target.value || '';
        renderAll();
    });
}

window.addEventListener('message', async (event) => {
    const payload = event.data || {};
    switch (payload.action) {
        case 'open':
            $('#app').classList.remove('hidden');
            await loadData();
            break;
        case 'placementStart':
            hideUIForPlacement();
            break;
        case 'placementEnd':
            showUIAfterPlacement();
            if (payload.subAction === 'placementResult') {
                applyPlacement(payload.coords, payload.type);
            } else {
                state.placementTarget = null;
            }
            break;
        case 'placementResult':
            showUIAfterPlacement();
            applyPlacement(payload.coords, payload.type);
            break;
        case 'placementCancelled':
            showUIAfterPlacement();
            state.placementTarget = null;
            break;
        case 'toast':
            showToast(payload.type || 'announcement', payload.message || '');
            break;
        default:
            break;
    }
});

window.editJob = (id) => openJobForm(state.jobs.find((job) => Number(job.id) === Number(id)) || null);
window.deleteJob = removeJob;
window.editOrder = (id) => openOrderForm(state.orders.find((order) => Number(order.id) === Number(id)) || null);
window.deleteOrder = removeOrder;
window.editRoute = (id) => openRouteForm(state.routes.find((route) => Number(route.id) === Number(id)) || null);
window.deleteRoute = removeRoute;
window.previewExistingRoute = async (id) => {
    const route = state.routes.find((entry) => Number(entry.id) === Number(id));
    if (!route) return;
    await nui('previewRoute', {
        route: {
            start_point: route.start_point,
            end_point: route.end_point,
            waypoints: route.waypoints || [],
        },
    });
};
window.editVehicle = (id) => openVehicleForm(state.vehicleSpawns.find((spawn) => Number(spawn.id) === Number(id)) || null);
window.deleteVehicle = removeVehicle;
window.editDepot = (id) => openDepotForm(state.depots.find((depot) => Number(depot.id) === Number(id)) || null);
window.deleteDepot = removeDepot;
window.viewEmployee = openEmployeeDetail;
window.fireEmployee = fireEmployeeById;
window.deleteEmployee = deleteEmployeeById;
window.updateWp = (index, axis, value) => {
    if (!state.waypoints[index]) return;
    state.waypoints[index][axis] = toNumber(value, 0);
};
window.removeWp = (index) => {
    state.waypoints.splice(index, 1);
    renderWaypoints();
};
window.placeWp = (index) => {
    state.placementTarget = `waypoint_${index}`;
    nui('startPlacement', { placementType: `waypoint_${index}` });
};

document.addEventListener('DOMContentLoaded', () => {
    initStaticUI();
    applyTheme(localStorage.getItem('alc_theme') || 'dark');
    setLocale(getLocale() || 'de');
    bindEvents();
    applyLocale();
    setActiveTab('jobs');
});
