'use strict';

const DB_NAME = 'EcoRouteLogisticAI_Completo_DB';
const DB_VERSION = 1;
const STORES = {
  dispatches: 'dispatches',
  users: 'users',
  vehicles: 'vehicles',
  routes: 'routes',
  weather: 'weather',
  notifications: 'notifications'
};

const STATUS = ['Pendiente', 'En ruta', 'Retrasado', 'Entregado'];
const USER_STATUS = ['Activo', 'En ruta', 'Disponible', 'Inactivo'];
const VEHICLE_STATUS = ['Disponible', 'En ruta', 'Mantención'];
const WEATHER_LEVELS = ['Informativa', 'Precaución', 'Crítica'];

let db = null;
let state = {
  dispatches: [],
  users: [],
  vehicles: [],
  routes: [],
  weather: [],
  notifications: []
};

const demoData = {
  users: [
    { id: id(), name: 'Pedro Ramírez', role: 'Conductor', phone: '+56 9 8123 4567', email: 'pedro.ramirez@sur-austral.cl', status: 'En ruta' },
    { id: id(), name: 'María Soto', role: 'Conductor', phone: '+56 9 7345 4567', email: 'maria.soto@sur-austral.cl', status: 'Disponible' },
    { id: id(), name: 'Carlos Díaz', role: 'Conductor', phone: '+56 9 6789 1111', email: 'carlos.diaz@sur-austral.cl', status: 'Disponible' },
    { id: id(), name: 'Empresa Norte S.A.', role: 'Cliente', phone: '+56 2 2233 4455', email: 'contacto@empresanorte.cl', status: 'Activo' },
    { id: id(), name: 'Retail Austral', role: 'Cliente', phone: '+56 2 9988 7766', email: 'logistica@retailaustral.cl', status: 'Activo' },
    { id: id(), name: 'Ana Valdivia', role: 'Gerencia', phone: '+56 9 1122 3344', email: 'ana.valdivia@sur-austral.cl', status: 'Activo' }
  ],

  vehicles: [
    { id: id(), plate: 'FJKL-23', type: 'Refrigerado', capacity: '20 toneladas', km: 245000, sensor: 'GPS + Temperatura', status: 'En ruta' },
    { id: id(), plate: 'BGHJ-45', type: 'Carga general', capacity: '15 toneladas', km: 183000, sensor: 'GPS + Temperatura', status: 'Disponible' },
    { id: id(), plate: 'MKPL-89', type: 'Carga general', capacity: '12 toneladas', km: 98000, sensor: 'GPS + Temperatura', status: 'Disponible' },
    { id: id(), plate: 'CDRT-67', type: 'Tolva', capacity: '25 toneladas', km: 312000, sensor: 'Sin sensor', status: 'Mantención' }
  ],
  
  routes: [
    { id: id(), name: 'Ruta Santiago - Punta Arenas', origin: 'Santiago', destination: 'Punta Arenas', distance: 3000, time: '48 horas', risk: 'Alto' },
    { id: id(), name: 'Ruta Santiago - Puerto Montt', origin: 'Santiago', destination: 'Puerto Montt', distance: 1030, time: '14 horas', risk: 'Medio' },
    { id: id(), name: 'Ruta Temuco - Coyhaique', origin: 'Temuco', destination: 'Coyhaique', distance: 980, time: '20 horas', risk: 'Medio' },
    { id: id(), name: 'Ruta Santiago - Osorno', origin: 'Santiago', destination: 'Osorno', distance: 940, time: '12 horas', risk: 'Bajo' }
  ],
  weather: [
    { id: id(), zone: 'Ruta 9 - Punta Arenas', level: 'Crítica', description: 'Escarcha y fuertes rachas de viento', recommendation: 'Conducir con precaución y monitorear ubicación del camión' },
    { id: id(), zone: 'Región de Aysén', level: 'Precaución', description: 'Lluvia intensa y baja visibilidad', recommendation: 'Reducir velocidad y evitar adelantamientos' },
    { id: id(), zone: 'Transbordador zona austral', level: 'Informativa', description: 'Tiempo de espera operacional', recommendation: 'Revisar horario de cruce antes de salir' }
  ]
};

const elements = {};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  cacheElements();
  bindEvents();

  try {
    db = await openDb();
    setDbStatus(true, 'Base local conectada');
    await seedIfEmpty();
    await refreshAll();
    toast('Sistema iniciado', 'La plataforma quedó lista para registrar y consultar datos.', 'success');
  } catch (error) {
    console.error(error);
    setDbStatus(false, 'Error al iniciar base local');
    toast('Error', 'No se pudo iniciar la base de datos del navegador.', 'error');
  }
}

function cacheElements() {
  document.querySelectorAll('[id]').forEach((el) => {
    elements[el.id] = el;
  });
  elements.navLinks = document.querySelectorAll('.nav-link');
  elements.pages = document.querySelectorAll('.page');
}

function bindEvents() {
  elements.mobileMenuBtn.addEventListener('click', () => elements.mainNav.classList.toggle('open'));

  elements.navLinks.forEach((btn) => {
    btn.addEventListener('click', () => showPage(btn.dataset.page));
  });

  elements.goNewDispatchBtn.addEventListener('click', () => {
    showPage('dispatchPage');
    resetDispatchForm();
    scrollToElement(elements.dispatchForm);
  });
  elements.goDispatchListBtn.addEventListener('click', () => showPage('dispatchPage'));
  elements.goWeatherBtn.addEventListener('click', () => showPage('weatherPage'));
  elements.goVehiclesBtn.addEventListener('click', () => showPage('vehiclesPage'));
  elements.refreshDashboardBtn.addEventListener('click', refreshAll);
  elements.clearNotificationsBtn.addEventListener('click', clearNotifications);

  elements.dispatchForm.addEventListener('submit', saveDispatch);
  elements.resetDispatchFormBtn.addEventListener('click', resetDispatchForm);
  elements.cancelDispatchEditBtn.addEventListener('click', resetDispatchForm);
  elements.loadDemoDispatchBtn.addEventListener('click', loadDemoDispatches);
  elements.closeDispatchDetailBtn.addEventListener('click', () => {
    elements.dispatchDetailBox.innerHTML = '<p>Selecciona un despacho de la tabla para ver su detalle, ubicación simulada y ruta asignada.</p>';
  });
  elements.dispatchSearch.addEventListener('input', renderDispatches);
  elements.dispatchStatusFilter.addEventListener('change', renderDispatches);

  elements.searchTrackingBtn.addEventListener('click', searchTracking);
  elements.clearTrackingBtn.addEventListener('click', clearTracking);
  elements.trackingGuide.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') searchTracking();
  });

  elements.userForm.addEventListener('submit', saveUser);
  elements.newUserBtn.addEventListener('click', () => {
    showPage('usersPage');
    resetUserForm();
    scrollToElement(elements.userForm);
  });
  elements.cancelUserEditBtn.addEventListener('click', resetUserForm);
  elements.loadDemoUsersBtn.addEventListener('click', loadDemoUsers);
  elements.userSearch.addEventListener('input', renderUsers);

  elements.vehicleForm.addEventListener('submit', saveVehicle);
  elements.newVehicleBtn.addEventListener('click', () => {
    showPage('vehiclesPage');
    resetVehicleForm();
    scrollToElement(elements.vehicleForm);
  });
  elements.cancelVehicleEditBtn.addEventListener('click', resetVehicleForm);
  elements.loadDemoVehiclesBtn.addEventListener('click', loadDemoVehicles);
  elements.vehicleSearch.addEventListener('input', renderVehicles);

  elements.routeForm.addEventListener('submit', saveRoute);
  elements.newRouteBtn.addEventListener('click', () => {
    showPage('routesPage');
    resetRouteForm();
    scrollToElement(elements.routeForm);
  });
  elements.cancelRouteEditBtn.addEventListener('click', resetRouteForm);
  elements.loadDemoRoutesBtn.addEventListener('click', loadDemoRoutes);
  elements.routeSearch.addEventListener('input', renderRoutes);
  elements.calculateRouteBtn.addEventListener('click', calculateSuggestedRoute);
  elements.clearPlannerBtn.addEventListener('click', clearPlanner);

  elements.weatherForm.addEventListener('submit', saveWeather);
  elements.newWeatherBtn.addEventListener('click', () => {
    showPage('weatherPage');
    resetWeatherForm();
    scrollToElement(elements.weatherForm);
  });
  elements.cancelWeatherEditBtn.addEventListener('click', resetWeatherForm);
  elements.loadDemoWeatherBtn.addEventListener('click', loadDemoWeather);
  elements.randomWeatherBtn.addEventListener('click', generateRandomWeather);
  elements.weatherSearch.addEventListener('input', renderWeather);

  elements.refreshDatabaseBtn.addEventListener('click', refreshAll);
  elements.exportDatabaseBtn.addEventListener('click', exportDatabase);
  elements.importDatabaseInput.addEventListener('change', importDatabase);
  elements.resetDatabaseBtn.addEventListener('click', resetDatabase);
  elements.copyDatabaseBtn.addEventListener('click', copyDatabaseSummary);

  addLiveValidation('dispatch', ['dispatchGuide', 'dispatchClient', 'dispatchOrigin', 'dispatchDestination', 'dispatchDriver', 'dispatchVehicle', 'dispatchStatus']);
  addLiveValidation('user', ['userName', 'userRole', 'userPhone', 'userEmail']);
  addLiveValidation('vehicle', ['vehiclePlate', 'vehicleType', 'vehicleCapacity', 'vehicleKm']);
  addLiveValidation('route', ['routeName', 'routeOrigin', 'routeDestination', 'routeDistance', 'routeTime']);
  addLiveValidation('weather', ['weatherZone', 'weatherDescription', 'weatherRecommendation']);
}

function showPage(pageId) {
  elements.pages.forEach((page) => page.classList.toggle('active-page', page.id === pageId));
  elements.navLinks.forEach((btn) => btn.classList.toggle('active', btn.dataset.page === pageId));
  elements.mainNav.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ===================== Base local ===================== */

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      Object.values(STORES).forEach((storeName) => {
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function store(storeName, mode = 'readonly') {
  return db.transaction(storeName, mode).objectStore(storeName);
}

function getAll(storeName) {
  return new Promise((resolve, reject) => {
    const request = store(storeName).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

function put(storeName, record) {
  return new Promise((resolve, reject) => {
    const request = store(storeName, 'readwrite').put(record);
    request.onsuccess = () => resolve(record);
    request.onerror = () => reject(request.error);
  });
}

function remove(storeName, recordId) {
  return new Promise((resolve, reject) => {
    const request = store(storeName, 'readwrite').delete(recordId);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

function clear(storeName) {
  return new Promise((resolve, reject) => {
    const request = store(storeName, 'readwrite').clear();
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

async function seedIfEmpty() {
  const [users, vehicles, routes, weather] = await Promise.all([
    getAll(STORES.users),
    getAll(STORES.vehicles),
    getAll(STORES.routes),
    getAll(STORES.weather)
  ]);

  if (users.length === 0) await insertMany(STORES.users, demoData.users);
  if (vehicles.length === 0) await insertMany(STORES.vehicles, demoData.vehicles);
  if (routes.length === 0) await insertMany(STORES.routes, demoData.routes);
  if (weather.length === 0) await insertMany(STORES.weather, demoData.weather);

  const dispatches = await getAll(STORES.dispatches);
  if (dispatches.length === 0) await loadDemoDispatches(false);

  const notifications = await getAll(STORES.notifications);
  if (notifications.length === 0) {
    await addNotification('Base inicial cargada', 'Se cargaron usuarios, vehículos, rutas, clima y despachos de ejemplo.', 'success', false);
  }
}

async function insertMany(storeName, records) {
  for (const record of records) {
    await put(storeName, { ...record, createdAt: record.createdAt || now(), updatedAt: now() });
  }
}

async function refreshAll() {
  state.dispatches = await getAll(STORES.dispatches);
  state.users = await getAll(STORES.users);
  state.vehicles = await getAll(STORES.vehicles);
  state.routes = await getAll(STORES.routes);
  state.weather = await getAll(STORES.weather);
  state.notifications = await getAll(STORES.notifications);

  state.dispatches.sort(sortUpdated);
  state.users.sort(sortUpdated);
  state.vehicles.sort(sortUpdated);
  state.routes.sort(sortUpdated);
  state.weather.sort(sortUpdated);
  state.notifications.sort(sortCreated);

  renderAll();
}

function setDbStatus(ok, text) {
  elements.dbLight.classList.toggle('ok', ok);
  elements.dbText.textContent = text;
}

/* ===================== Render general ===================== */

function renderAll() {
  renderStats();
  renderDatalistsAndSelects();
  renderDashboard();
  renderDispatches();
  renderUsers();
  renderVehicles();
  renderRoutes();
  renderWeather();
  renderDatabasePreview();
}

function renderStats() {
  elements.kpiDispatches.textContent = state.dispatches.length;
  elements.kpiInRoute.textContent = state.dispatches.filter((d) => d.status === 'En ruta').length;
  elements.kpiUsers.textContent = state.users.length;
  elements.kpiWeather.textContent = state.weather.length;
}

function renderDashboard() {
  const recentDispatches = state.dispatches.slice(0, 5);
  elements.dashboardDispatchBody.innerHTML = recentDispatches.length
    ? recentDispatches.map((d) => `
      <tr>
        <td><strong>${escapeHtml(d.guide)}</strong></td>
        <td>${escapeHtml(d.client)}</td>
        <td>${escapeHtml(d.destination)}</td>
        <td><span class="status-badge ${statusClass(d.status)}">${escapeHtml(d.status)}</span></td>
        <td><button class="icon-btn view" type="button" data-view-dispatch="${d.id}">Ver</button></td>
      </tr>
    `).join('')
    : '<tr><td colspan="5" class="empty-cell">No hay despachos registrados.</td></tr>';

  elements.dashboardDispatchBody.querySelectorAll('[data-view-dispatch]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showPage('dispatchPage');
      showDispatchDetail(btn.dataset.viewDispatch);
    });
  });

  elements.dashboardWeatherList.innerHTML = state.weather.slice(0, 4).map((w) => `
    <div class="mini-item">
      <h4>${escapeHtml(w.zone)} <span class="level-badge ${weatherClass(w.level)}">${escapeHtml(w.level)}</span></h4>
      <p>${escapeHtml(w.description)}</p>
    </div>
  `).join('') || '<div class="mini-item"><p>No hay alertas climáticas registradas.</p></div>';

  elements.dashboardVehiclesList.innerHTML = state.vehicles
    .filter((v) => v.status === 'Disponible')
    .slice(0, 5)
    .map((v) => `
      <div class="mini-item">
        <h4>${escapeHtml(v.plate)} · ${escapeHtml(v.type)}</h4>
        <p>${escapeHtml(v.capacity)} · ${escapeHtml(v.sensor)}</p>
      </div>
    `).join('') || '<div class="mini-item"><p>No hay vehículos disponibles.</p></div>';

  elements.dashboardNotifications.innerHTML = state.notifications.slice(0, 6).map(notificationTemplate).join('') || '<div class="notification-item"><p>No hay notificaciones aún.</p></div>';
}

function renderDatalistsAndSelects() {
  const clients = state.users.filter((u) => u.role === 'Cliente');
  elements.clientDatalist.innerHTML = clients.map((c) => `<option value="${escapeHtml(c.name)}"></option>`).join('');

  const drivers = state.users.filter((u) => u.role === 'Conductor' && u.status !== 'Inactivo');
  elements.dispatchDriver.innerHTML = '<option value="">Seleccionar conductor</option>' + drivers.map((u) => `<option value="${escapeHtml(u.name)}">${escapeHtml(u.name)} · ${escapeHtml(u.status)}</option>`).join('');

  const vehicles = state.vehicles.filter((v) => v.status !== 'Mantención');
  elements.dispatchVehicle.innerHTML = '<option value="">Seleccionar vehículo</option>' + vehicles.map((v) => `<option value="${escapeHtml(v.plate)}">${escapeHtml(v.plate)} · ${escapeHtml(v.type)} · ${escapeHtml(v.status)}</option>`).join('');
}

/* ===================== Despachos ===================== */

async function loadDemoDispatches(show = true) {
  const users = await getAll(STORES.users);
  const vehicles = await getAll(STORES.vehicles);
  const routes = await getAll(STORES.routes);
  const driver1 = users.find((u) => u.name === 'Pedro Ramírez')?.name || 'Pedro Ramírez';
  const driver2 = users.find((u) => u.name === 'María Soto')?.name || 'María Soto';
  const vehicle1 = vehicles.find((v) => v.plate === 'FJKL-23')?.plate || 'FJKL-23';
  const vehicle2 = vehicles.find((v) => v.plate === 'BGHJ-45')?.plate || 'BGHJ-45';
  const route1 = routes.find((r) => normalize(r.destination).includes('punta arenas'));
  const route2 = routes.find((r) => normalize(r.destination).includes('puerto montt'));

  const demoDispatches = [
    { id: id(), guide: uniqueGuide('GU-2001'), client: 'Empresa Norte S.A.', origin: 'Santiago', destination: 'Punta Arenas', driver: driver1, vehicle: vehicle1, status: 'En ruta', routeId: route1?.id || '', createdAt: now(), updatedAt: now() },
    { id: id(), guide: uniqueGuide('GU-2002'), client: 'Retail Austral', origin: 'Santiago', destination: 'Puerto Montt', driver: driver2, vehicle: vehicle2, status: 'Pendiente', routeId: route2?.id || '', createdAt: now(), updatedAt: now() }
  ];

  await insertMany(STORES.dispatches, demoDispatches);
  await addNotification('Despachos de ejemplo cargados', 'Se agregaron nuevos despachos para probar el listado, seguimiento y GPS.', 'success', false);
  await refreshAll();
  if (show) toast('Ejemplos cargados', 'Se agregaron despachos de prueba correctamente.', 'success');
}

async function saveDispatch(event) {
  event.preventDefault();
  const data = {
    guide: elements.dispatchGuide.value.trim().toUpperCase(),
    client: elements.dispatchClient.value.trim(),
    origin: elements.dispatchOrigin.value.trim(),
    destination: elements.dispatchDestination.value.trim(),
    driver: elements.dispatchDriver.value.trim(),
    vehicle: elements.dispatchVehicle.value.trim(),
    status: elements.dispatchStatus.value.trim(),
    routeId: ''
  };

  if (!validateRequired(data, ['guide', 'client', 'origin', 'destination', 'driver', 'vehicle', 'status'], 'dispatch')) {
    inlineMessage(elements.dispatchFormMessage, 'error', 'Completa todos los campos antes de guardar el despacho.');
    toast('Faltan datos', 'El despacho no se guardó porque existen campos vacíos.', 'error');
    return;
  }

  const editId = elements.dispatchId.value;
  const duplicated = state.dispatches.find((d) => normalize(d.guide) === normalize(data.guide) && d.id !== editId);
  if (duplicated) {
    setInvalid('dispatchGuide', 'Ese número de guía ya existe.');
    inlineMessage(elements.dispatchFormMessage, 'error', 'El número de guía ya existe en la base local.');
    toast('Guía duplicada', 'Usa un número de guía diferente.', 'error');
    return;
  }

  const existing = state.dispatches.find((d) => d.id === editId);
  const record = {
    id: editId || id(),
    ...data,
    routeId: existing?.routeId || findBestRouteId(data.origin, data.destination),
    createdAt: existing?.createdAt || now(),
    updatedAt: now()
  };

  await put(STORES.dispatches, record);
  await syncDriverAndVehicleStatus(record);
  await addNotification(editId ? 'Despacho modificado' : 'Despacho registrado', `La guía ${record.guide} quedó guardada con estado ${record.status}.`, 'success', false);
  await refreshAll();
  resetDispatchForm();
  inlineMessage(elements.dispatchFormMessage, 'success', `Despacho ${record.guide} guardado correctamente.`);
  toast('Despacho guardado', `La guía ${record.guide} se guardó y apareció en el listado.`, 'success');
}

function renderDispatches() {
  const search = normalize(elements.dispatchSearch.value);
  const statusFilter = elements.dispatchStatusFilter.value;
  const list = state.dispatches.filter((d) => {
    const matchStatus = !statusFilter || d.status === statusFilter;
    const text = normalize(`${d.guide} ${d.client} ${d.origin} ${d.destination} ${d.driver} ${d.vehicle} ${d.status}`);
    return matchStatus && text.includes(search);
  });

  elements.dispatchTableBody.innerHTML = list.length ? list.map((d) => {
    const route = state.routes.find((r) => r.id === d.routeId);
    return `
      <tr>
        <td><strong>${escapeHtml(d.guide)}</strong></td>
        <td>${escapeHtml(d.client)}</td>
        <td>${escapeHtml(d.origin)} → ${escapeHtml(d.destination)}</td>
        <td>${escapeHtml(d.driver)}</td>
        <td>${escapeHtml(d.vehicle)}</td>
        <td>
          <select class="status-select" data-dispatch-status="${d.id}">
            ${STATUS.map((s) => `<option value="${s}" ${s === d.status ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
        <td><span class="route-badge ${route ? 'level-info' : 'level-warning'}">${route ? escapeHtml(route.name) : 'Sin ruta'}</span></td>
        <td>
          <div class="row-actions">
            <button class="icon-btn view" data-dispatch-view="${d.id}" type="button">Ver</button>
            <button class="icon-btn assign" data-dispatch-route="${d.id}" type="button">Ruta</button>
            <button class="icon-btn edit" data-dispatch-edit="${d.id}" type="button">Editar</button>
            <button class="icon-btn delete" data-dispatch-delete="${d.id}" type="button">Eliminar</button>
          </div>
        </td>
      </tr>
    `;
  }).join('') : '<tr><td colspan="8" class="empty-cell">No hay despachos para mostrar.</td></tr>';

  elements.dispatchTableBody.querySelectorAll('[data-dispatch-status]').forEach((select) => {
    select.addEventListener('change', () => changeDispatchStatus(select.dataset.dispatchStatus, select.value));
  });
  elements.dispatchTableBody.querySelectorAll('[data-dispatch-view]').forEach((btn) => btn.addEventListener('click', () => showDispatchDetail(btn.dataset.dispatchView)));
  elements.dispatchTableBody.querySelectorAll('[data-dispatch-route]').forEach((btn) => btn.addEventListener('click', () => assignBestRoute(btn.dataset.dispatchRoute)));
  elements.dispatchTableBody.querySelectorAll('[data-dispatch-edit]').forEach((btn) => btn.addEventListener('click', () => editDispatch(btn.dataset.dispatchEdit)));
  elements.dispatchTableBody.querySelectorAll('[data-dispatch-delete]').forEach((btn) => btn.addEventListener('click', () => deleteDispatch(btn.dataset.dispatchDelete)));
}

async function changeDispatchStatus(dispatchId, newStatus) {
  const dispatch = state.dispatches.find((d) => d.id === dispatchId);
  if (!dispatch) return;
  const old = dispatch.status;
  const updated = { ...dispatch, status: newStatus, updatedAt: now() };
  await put(STORES.dispatches, updated);
  await syncDriverAndVehicleStatus(updated);
  await addNotification('Estado actualizado', `La guía ${updated.guide} cambió de ${old} a ${newStatus}.`, newStatus === 'Retrasado' ? 'warning' : 'info', false);
  await refreshAll();
  showDispatchDetail(dispatchId);
  toast('Estado cambiado', `El despacho ${updated.guide} ahora está en estado ${newStatus}.`, newStatus === 'Retrasado' ? 'warning' : 'info');
}

function showDispatchDetail(dispatchId) {
  const d = state.dispatches.find((item) => item.id === dispatchId);
  if (!d) return;
  const route = state.routes.find((r) => r.id === d.routeId);
  elements.dispatchDetailBox.innerHTML = `
    <div class="detail-panel">
      <h3>${escapeHtml(d.guide)} · ${escapeHtml(d.client)}</h3>
      <span class="status-badge ${statusClass(d.status)}">${escapeHtml(d.status)}</span>
      <div class="detail-grid">
        <div class="data-item"><span>Origen</span><strong>${escapeHtml(d.origin)}</strong></div>
        <div class="data-item"><span>Destino</span><strong>${escapeHtml(d.destination)}</strong></div>
        <div class="data-item"><span>Conductor</span><strong>${escapeHtml(d.driver)}</strong></div>
        <div class="data-item"><span>Vehículo</span><strong>${escapeHtml(d.vehicle)}</strong></div>
        <div class="data-item"><span>Ruta asignada</span><strong>${route ? escapeHtml(route.name) : 'Sin ruta asignada'}</strong></div>
        <div class="data-item"><span>Última actualización</span><strong>${formatDate(d.updatedAt)}</strong></div>
      </div>
      ${gpsBlock(d)}
      <div class="action-row form-actions">
        <button class="secondary-btn" type="button" onclick="document.getElementById('trackingGuide').value='${escapeAttr(d.guide)}'; showPage('trackingPage'); searchTracking();">Ver seguimiento cliente</button>
        <button class="secondary-btn" type="button" onclick="assignBestRoute('${d.id}')">Asignar ruta sugerida</button>
      </div>
    </div>
  `;
}

function gpsBlock(dispatch) {
  const progress = progressByStatus(dispatch.status);
  return `
    <div class="gps-box">
      <strong>Ubicación simulada:</strong> ${escapeHtml(gpsLocation(dispatch))}
      <div class="route-map">
        <div class="route-line"></div>
        <div class="route-progress" style="width:${progress * 0.86}%"></div>
        <div class="truck-marker" style="left:${7 + progress * 0.86}%">🚚</div>
        <div class="map-labels"><span>${escapeHtml(dispatch.origin)}</span><span>${escapeHtml(dispatch.destination)}</span></div>
      </div>
    </div>
  `;
}

function editDispatch(dispatchId) {
  const d = state.dispatches.find((item) => item.id === dispatchId);
  if (!d) return;
  elements.dispatchId.value = d.id;
  elements.dispatchGuide.value = d.guide;
  elements.dispatchClient.value = d.client;
  elements.dispatchOrigin.value = d.origin;
  elements.dispatchDestination.value = d.destination;
  elements.dispatchDriver.value = d.driver;
  elements.dispatchVehicle.value = d.vehicle;
  elements.dispatchStatus.value = d.status;
  elements.dispatchFormTitle.textContent = `Editando ${d.guide}`;
  elements.saveDispatchBtn.textContent = 'Guardar cambios';
  elements.cancelDispatchEditBtn.classList.remove('hidden');
  clearValidation('dispatch');
  inlineMessage(elements.dispatchFormMessage, 'success', 'Modo edición activo. Cambia los datos y guarda.');
  scrollToElement(elements.dispatchForm);
}

async function deleteDispatch(dispatchId) {
  const d = state.dispatches.find((item) => item.id === dispatchId);
  if (!d) return;
  if (!confirm(`¿Eliminar el despacho ${d.guide}?`)) return;
  await remove(STORES.dispatches, dispatchId);
  await addNotification('Despacho eliminado', `Se eliminó la guía ${d.guide} de la base local.`, 'warning', false);
  await refreshAll();
  elements.dispatchDetailBox.innerHTML = '<p>Selecciona un despacho de la tabla para ver su detalle, ubicación simulada y ruta asignada.</p>';
  toast('Despacho eliminado', `La guía ${d.guide} fue eliminada.`, 'warning');
}

async function assignBestRoute(dispatchId) {
  const d = state.dispatches.find((item) => item.id === dispatchId);
  if (!d) return;
  const routeId = findBestRouteId(d.origin, d.destination);
  if (!routeId) {
    toast('Sin ruta compatible', 'No existe una ruta guardada para ese origen y destino.', 'warning');
    return;
  }
  const route = state.routes.find((r) => r.id === routeId);
  await put(STORES.dispatches, { ...d, routeId, updatedAt: now() });
  await addNotification('Ruta asignada', `Se asignó ${route.name} a la guía ${d.guide}.`, 'success', false);
  await refreshAll();
  showDispatchDetail(dispatchId);
  toast('Ruta asignada', `La guía ${d.guide} ahora tiene la ruta ${route.name}.`, 'success');
}

function resetDispatchForm() {
  elements.dispatchForm.reset();
  elements.dispatchId.value = '';
  elements.dispatchFormTitle.textContent = 'Registrar despacho';
  elements.saveDispatchBtn.textContent = 'Guardar despacho';
  elements.cancelDispatchEditBtn.classList.add('hidden');
  inlineMessage(elements.dispatchFormMessage, '', '');
  clearValidation('dispatch');
}

/* ===================== Seguimiento ===================== */

function searchTracking() {
  const guide = elements.trackingGuide.value.trim();
  if (!guide) {
    elements.trackingResult.innerHTML = '<div class="detail-panel" style="border-color:#fecaca;background:#fef2f2;color:#991b1b;font-weight:900;">Error: ingresa un número de guía para buscar.</div>';
    toast('Búsqueda incompleta', 'Debes escribir un número de guía.', 'error');
    return;
  }
  const dispatch = state.dispatches.find((d) => normalize(d.guide) === normalize(guide));
  if (!dispatch) {
    elements.trackingResult.innerHTML = '<div class="detail-panel" style="border-color:#fecaca;background:#fef2f2;color:#991b1b;font-weight:900;">Error: El número de guía no existe en el sistema.</div>';
    toast('No encontrado', 'No existe una guía con ese número.', 'error');
    return;
  }
  const route = state.routes.find((r) => r.id === dispatch.routeId);
  elements.trackingResult.innerHTML = `
    <div class="result-panel">
      <h3>Resultado para guía ${escapeHtml(dispatch.guide)}</h3>
      <div class="result-grid">
        <div class="data-item"><span>Cliente</span><strong>${escapeHtml(dispatch.client)}</strong></div>
        <div class="data-item"><span>Estado</span><strong><span class="status-badge ${statusClass(dispatch.status)}">${escapeHtml(dispatch.status)}</span></strong></div>
        <div class="data-item"><span>Conductor</span><strong>${escapeHtml(dispatch.driver)}</strong></div>
        <div class="data-item"><span>Vehículo</span><strong>${escapeHtml(dispatch.vehicle)}</strong></div>
        <div class="data-item"><span>Trayecto</span><strong>${escapeHtml(dispatch.origin)} → ${escapeHtml(dispatch.destination)}</strong></div>
        <div class="data-item"><span>Ruta</span><strong>${route ? escapeHtml(route.name) : 'Sin ruta asignada'}</strong></div>
      </div>
      ${gpsBlock(dispatch)}
    </div>
  `;
  toast('Envío encontrado', `Se encontró información para la guía ${dispatch.guide}.`, 'success');
}

function clearTracking() {
  elements.trackingGuide.value = '';
  elements.trackingResult.innerHTML = '';
  toast('Consulta limpiada', 'El panel de seguimiento quedó vacío.', 'info');
}

/* ===================== Usuarios ===================== */

async function loadDemoUsers() {
  await insertMany(STORES.users, demoData.users.map((u) => ({ ...u, id: id(), email: uniqueEmail(u.email) })));
  await addNotification('Usuarios de ejemplo cargados', 'Se agregaron trabajadores y clientes demostrativos.', 'success', false);
  await refreshAll();
  toast('Usuarios cargados', 'Se agregaron usuarios de ejemplo.', 'success');
}

async function saveUser(event) {
  event.preventDefault();
  const data = {
    name: elements.userName.value.trim(),
    role: elements.userRole.value.trim(),
    phone: elements.userPhone.value.trim(),
    email: elements.userEmail.value.trim(),
    status: elements.userStatus.value.trim()
  };
  if (!validateRequired(data, ['name', 'role', 'phone', 'email'], 'user')) {
    inlineMessage(elements.userFormMessage, 'error', 'Completa los datos del usuario antes de guardar.');
    toast('Faltan datos', 'El usuario no se guardó.', 'error');
    return;
  }
  if (!data.email.includes('@')) {
    setInvalid('userEmail', 'Ingresa un correo válido.');
    inlineMessage(elements.userFormMessage, 'error', 'El correo debe ser válido.');
    return;
  }
  const editId = elements.userId.value;
  const existing = state.users.find((u) => u.id === editId);
  const record = { id: editId || id(), ...data, createdAt: existing?.createdAt || now(), updatedAt: now() };
  await put(STORES.users, record);
  await addNotification(editId ? 'Usuario actualizado' : 'Usuario registrado', `${record.name} quedó guardado como ${record.role}.`, 'success', false);
  await refreshAll();
  resetUserForm();
  toast('Usuario guardado', `${record.name} apareció en la lista de usuarios.`, 'success');
}

function renderUsers() {
  const search = normalize(elements.userSearch.value);
  const list = state.users.filter((u) => normalize(`${u.name} ${u.role} ${u.email} ${u.phone} ${u.status}`).includes(search));
  elements.userTableBody.innerHTML = list.length ? list.map((u) => `
    <tr>
      <td><strong>${escapeHtml(u.name)}</strong></td>
      <td>${escapeHtml(u.role)}</td>
      <td>${escapeHtml(u.phone)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>
        <select class="state-select" data-user-status="${u.id}">
          ${USER_STATUS.map((s) => `<option value="${s}" ${s === u.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
      <td><div class="row-actions">
        <button class="icon-btn edit" data-user-edit="${u.id}" type="button">Editar</button>
        <button class="icon-btn delete" data-user-delete="${u.id}" type="button">Eliminar</button>
      </div></td>
    </tr>
  `).join('') : '<tr><td colspan="6" class="empty-cell">No hay usuarios para mostrar.</td></tr>';

  elements.userTableBody.querySelectorAll('[data-user-status]').forEach((select) => select.addEventListener('change', () => changeUserStatus(select.dataset.userStatus, select.value)));
  elements.userTableBody.querySelectorAll('[data-user-edit]').forEach((btn) => btn.addEventListener('click', () => editUser(btn.dataset.userEdit)));
  elements.userTableBody.querySelectorAll('[data-user-delete]').forEach((btn) => btn.addEventListener('click', () => deleteUser(btn.dataset.userDelete)));

  const countByRole = ['Conductor', 'Administrador', 'Cliente', 'Gerencia'].map((role) => ({ role, count: state.users.filter((u) => u.role === role).length }));
  elements.userSummary.innerHTML = countByRole.map((item) => `<div class="summary-item"><span>${item.role}</span><strong>${item.count}</strong></div>`).join('');
}

async function changeUserStatus(userId, status) {
  const user = state.users.find((u) => u.id === userId);
  if (!user) return;
  await put(STORES.users, { ...user, status, updatedAt: now() });
  await addNotification('Estado de usuario cambiado', `${user.name} ahora está como ${status}.`, 'info', false);
  await refreshAll();
  toast('Estado actualizado', `${user.name} cambió a ${status}.`, 'info');
}

function editUser(userId) {
  const u = state.users.find((item) => item.id === userId);
  if (!u) return;
  elements.userId.value = u.id;
  elements.userName.value = u.name;
  elements.userRole.value = u.role;
  elements.userPhone.value = u.phone;
  elements.userEmail.value = u.email;
  elements.userStatus.value = u.status;
  elements.userFormTitle.textContent = `Editando ${u.name}`;
  elements.cancelUserEditBtn.classList.remove('hidden');
  scrollToElement(elements.userForm);
}

async function deleteUser(userId) {
  const u = state.users.find((item) => item.id === userId);
  if (!u) return;
  if (!confirm(`¿Eliminar a ${u.name}?`)) return;
  await remove(STORES.users, userId);
  await addNotification('Usuario eliminado', `${u.name} fue eliminado de la base local.`, 'warning', false);
  await refreshAll();
  toast('Usuario eliminado', `${u.name} fue eliminado.`, 'warning');
}

function resetUserForm() {
  elements.userForm.reset();
  elements.userId.value = '';
  elements.userFormTitle.textContent = 'Registrar usuario';
  elements.cancelUserEditBtn.classList.add('hidden');
  inlineMessage(elements.userFormMessage, '', '');
  clearValidation('user');
}

/* ===================== Vehículos ===================== */

async function loadDemoVehicles() {
  await insertMany(STORES.vehicles, demoData.vehicles.map((v) => ({ ...v, id: id(), plate: uniquePlate(v.plate) })));
  await addNotification('Vehículos de ejemplo cargados', 'Se agregaron camiones de prueba a la flota.', 'success', false);
  await refreshAll();
  toast('Vehículos cargados', 'Se agregaron vehículos de ejemplo.', 'success');
}

async function saveVehicle(event) {
  event.preventDefault();
  const data = {
    plate: elements.vehiclePlate.value.trim().toUpperCase(),
    type: elements.vehicleType.value.trim(),
    capacity: elements.vehicleCapacity.value.trim(),
    km: Number(elements.vehicleKm.value),
    sensor: elements.vehicleSensor.value.trim(),
    status: elements.vehicleStatus.value.trim()
  };
  if (!validateRequired(data, ['plate', 'type', 'capacity', 'km'], 'vehicle')) {
    inlineMessage(elements.vehicleFormMessage, 'error', 'Completa los datos del vehículo antes de guardar.');
    toast('Faltan datos', 'El vehículo no se guardó.', 'error');
    return;
  }
  const editId = elements.vehicleId.value;
  const duplicate = state.vehicles.find((v) => normalize(v.plate) === normalize(data.plate) && v.id !== editId);
  if (duplicate) {
    setInvalid('vehiclePlate', 'La patente ya existe.');
    inlineMessage(elements.vehicleFormMessage, 'error', 'La patente ya está registrada.');
    return;
  }
  const existing = state.vehicles.find((v) => v.id === editId);
  const record = { id: editId || id(), ...data, createdAt: existing?.createdAt || now(), updatedAt: now() };
  await put(STORES.vehicles, record);
  await addNotification(editId ? 'Vehículo actualizado' : 'Vehículo registrado', `${record.plate} quedó guardado con estado ${record.status}.`, 'success', false);
  await refreshAll();
  resetVehicleForm();
  toast('Vehículo guardado', `${record.plate} quedó disponible en el sistema.`, 'success');
}

function renderVehicles() {
  const search = normalize(elements.vehicleSearch.value);
  const list = state.vehicles.filter((v) => normalize(`${v.plate} ${v.type} ${v.capacity} ${v.sensor} ${v.status}`).includes(search));
  elements.vehicleTableBody.innerHTML = list.length ? list.map((v) => `
    <tr>
      <td><strong>${escapeHtml(v.plate)}</strong></td>
      <td>${escapeHtml(v.type)}</td>
      <td>${escapeHtml(v.capacity)}</td>
      <td>${Number(v.km).toLocaleString('es-CL')} km</td>
      <td>${escapeHtml(v.sensor)}</td>
      <td>
        <select class="state-select" data-vehicle-status="${v.id}">
          ${VEHICLE_STATUS.map((s) => `<option value="${s}" ${s === v.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
      <td><div class="row-actions">
        <button class="icon-btn edit" data-vehicle-edit="${v.id}" type="button">Editar</button>
        <button class="icon-btn delete" data-vehicle-delete="${v.id}" type="button">Eliminar</button>
      </div></td>
    </tr>
  `).join('') : '<tr><td colspan="7" class="empty-cell">No hay vehículos para mostrar.</td></tr>';

  elements.vehicleTableBody.querySelectorAll('[data-vehicle-status]').forEach((select) => select.addEventListener('change', () => changeVehicleStatus(select.dataset.vehicleStatus, select.value)));
  elements.vehicleTableBody.querySelectorAll('[data-vehicle-edit]').forEach((btn) => btn.addEventListener('click', () => editVehicle(btn.dataset.vehicleEdit)));
  elements.vehicleTableBody.querySelectorAll('[data-vehicle-delete]').forEach((btn) => btn.addEventListener('click', () => deleteVehicle(btn.dataset.vehicleDelete)));

  const counts = VEHICLE_STATUS.map((status) => ({ status, count: state.vehicles.filter((v) => v.status === status).length }));
  elements.vehicleSummary.innerHTML = counts.map((item) => `<div class="summary-item"><span>${item.status}</span><strong>${item.count}</strong></div>`).join('');
}

async function changeVehicleStatus(vehicleId, status) {
  const vehicle = state.vehicles.find((v) => v.id === vehicleId);
  if (!vehicle) return;
  await put(STORES.vehicles, { ...vehicle, status, updatedAt: now() });
  await addNotification('Estado de vehículo cambiado', `${vehicle.plate} cambió a ${status}.`, 'info', false);
  await refreshAll();
  toast('Vehículo actualizado', `${vehicle.plate} ahora está como ${status}.`, 'info');
}

function editVehicle(vehicleId) {
  const v = state.vehicles.find((item) => item.id === vehicleId);
  if (!v) return;
  elements.vehicleId.value = v.id;
  elements.vehiclePlate.value = v.plate;
  elements.vehicleType.value = v.type;
  elements.vehicleCapacity.value = v.capacity;
  elements.vehicleKm.value = v.km;
  elements.vehicleSensor.value = v.sensor;
  elements.vehicleStatus.value = v.status;
  elements.vehicleFormTitle.textContent = `Editando ${v.plate}`;
  elements.cancelVehicleEditBtn.classList.remove('hidden');
  scrollToElement(elements.vehicleForm);
}

async function deleteVehicle(vehicleId) {
  const v = state.vehicles.find((item) => item.id === vehicleId);
  if (!v) return;
  if (!confirm(`¿Eliminar vehículo ${v.plate}?`)) return;
  await remove(STORES.vehicles, vehicleId);
  await addNotification('Vehículo eliminado', `${v.plate} fue eliminado de la flota.`, 'warning', false);
  await refreshAll();
  toast('Vehículo eliminado', `${v.plate} fue eliminado.`, 'warning');
}

function resetVehicleForm() {
  elements.vehicleForm.reset();
  elements.vehicleId.value = '';
  elements.vehicleFormTitle.textContent = 'Registrar vehículo';
  elements.cancelVehicleEditBtn.classList.add('hidden');
  inlineMessage(elements.vehicleFormMessage, '', '');
  clearValidation('vehicle');
}

/* ===================== Rutas ===================== */

async function loadDemoRoutes() {
  await insertMany(STORES.routes, demoData.routes.map((r) => ({ ...r, id: id(), name: `${r.name} copia ${String(Date.now()).slice(-4)}` })));
  await addNotification('Rutas de ejemplo cargadas', 'Se agregaron rutas demostrativas al módulo de rutas.', 'success', false);
  await refreshAll();
  toast('Rutas cargadas', 'Se agregaron rutas de ejemplo.', 'success');
}

async function saveRoute(event) {
  event.preventDefault();
  const data = {
    name: elements.routeName.value.trim(),
    origin: elements.routeOrigin.value.trim(),
    destination: elements.routeDestination.value.trim(),
    distance: Number(elements.routeDistance.value),
    time: elements.routeTime.value.trim(),
    risk: elements.routeRisk.value.trim()
  };
  if (!validateRequired(data, ['name', 'origin', 'destination', 'distance', 'time'], 'route')) {
    inlineMessage(elements.routeFormMessage, 'error', 'Completa los datos de la ruta antes de guardar.');
    toast('Faltan datos', 'La ruta no se guardó.', 'error');
    return;
  }
  const editId = elements.routeId.value;
  const existing = state.routes.find((r) => r.id === editId);
  const record = { id: editId || id(), ...data, createdAt: existing?.createdAt || now(), updatedAt: now() };
  await put(STORES.routes, record);
  await addNotification(editId ? 'Ruta actualizada' : 'Ruta registrada', `${record.name} quedó guardada.`, 'success', false);
  await refreshAll();
  resetRouteForm();
  toast('Ruta guardada', `${record.name} quedó disponible para asignar.`, 'success');
}

function renderRoutes() {
  const search = normalize(elements.routeSearch.value);
  const list = state.routes.filter((r) => normalize(`${r.name} ${r.origin} ${r.destination} ${r.risk} ${r.time}`).includes(search));
  elements.routeTableBody.innerHTML = list.length ? list.map((r) => `
    <tr>
      <td><strong>${escapeHtml(r.name)}</strong></td>
      <td>${escapeHtml(r.origin)} → ${escapeHtml(r.destination)}</td>
      <td>${Number(r.distance).toLocaleString('es-CL')} km</td>
      <td>${escapeHtml(r.time)}</td>
      <td><span class="level-badge ${riskClass(r.risk)}">${escapeHtml(r.risk)}</span></td>
      <td><div class="row-actions">
        <button class="icon-btn assign" data-route-use="${r.id}" type="button">Usar</button>
        <button class="icon-btn edit" data-route-edit="${r.id}" type="button">Editar</button>
        <button class="icon-btn delete" data-route-delete="${r.id}" type="button">Eliminar</button>
      </div></td>
    </tr>
  `).join('') : '<tr><td colspan="6" class="empty-cell">No hay rutas para mostrar.</td></tr>';

  elements.routeTableBody.querySelectorAll('[data-route-use]').forEach((btn) => btn.addEventListener('click', () => useRouteInPlanner(btn.dataset.routeUse)));
  elements.routeTableBody.querySelectorAll('[data-route-edit]').forEach((btn) => btn.addEventListener('click', () => editRoute(btn.dataset.routeEdit)));
  elements.routeTableBody.querySelectorAll('[data-route-delete]').forEach((btn) => btn.addEventListener('click', () => deleteRoute(btn.dataset.routeDelete)));
}

function useRouteInPlanner(routeId) {
  const r = state.routes.find((item) => item.id === routeId);
  if (!r) return;
  elements.plannerOrigin.value = r.origin;
  elements.plannerDestination.value = r.destination;
  calculateSuggestedRoute();
}

function calculateSuggestedRoute() {
  const origin = elements.plannerOrigin.value.trim();
  const destination = elements.plannerDestination.value.trim();
  if (!origin || !destination) {
    elements.plannerResult.innerHTML = '<div class="detail-panel" style="border-color:#fecaca;background:#fef2f2;color:#991b1b;font-weight:900;">Ingresa origen y destino para calcular una sugerencia.</div>';
    toast('Datos incompletos', 'Debes ingresar origen y destino.', 'error');
    return;
  }
  const compatible = state.routes.filter((r) => normalize(r.origin) === normalize(origin) && normalize(r.destination) === normalize(destination));
  if (compatible.length === 0) {
    elements.plannerResult.innerHTML = '<div class="detail-panel" style="border-color:#fef3c7;background:#fffbeb;color:#92400e;font-weight:900;">No existe una ruta guardada para ese trayecto.</div>';
    toast('Sin ruta guardada', 'Puedes crear una nueva ruta con ese origen y destino.', 'warning');
    return;
  }
  const selected = compatible.sort((a, b) => riskValue(a.risk) - riskValue(b.risk) || Number(a.distance) - Number(b.distance))[0];
  elements.plannerResult.innerHTML = `
    <div class="planner-result-card">
      <h3>Ruta sugerida: ${escapeHtml(selected.name)}</h3>
      <p><strong>Trayecto:</strong> ${escapeHtml(selected.origin)} → ${escapeHtml(selected.destination)}</p>
      <p><strong>Distancia:</strong> ${Number(selected.distance).toLocaleString('es-CL')} km · <strong>Tiempo:</strong> ${escapeHtml(selected.time)}</p>
      <p><strong>Riesgo:</strong> <span class="level-badge ${riskClass(selected.risk)}">${escapeHtml(selected.risk)}</span></p>
      <p>La sugerencia prioriza menor riesgo y menor distancia disponible en la base local.</p>
    </div>
  `;
  toast('Ruta calculada', `La ruta sugerida es ${selected.name}.`, 'success');
}

function clearPlanner() {
  elements.plannerOrigin.value = '';
  elements.plannerDestination.value = '';
  elements.plannerResult.innerHTML = '';
  toast('Planificador limpio', 'Se limpió el resultado de rutas.', 'info');
}

function editRoute(routeId) {
  const r = state.routes.find((item) => item.id === routeId);
  if (!r) return;
  elements.routeId.value = r.id;
  elements.routeName.value = r.name;
  elements.routeOrigin.value = r.origin;
  elements.routeDestination.value = r.destination;
  elements.routeDistance.value = r.distance;
  elements.routeTime.value = r.time;
  elements.routeRisk.value = r.risk;
  elements.routeFormTitle.textContent = `Editando ${r.name}`;
  elements.cancelRouteEditBtn.classList.remove('hidden');
  scrollToElement(elements.routeForm);
}

async function deleteRoute(routeId) {
  const r = state.routes.find((item) => item.id === routeId);
  if (!r) return;
  if (!confirm(`¿Eliminar ruta ${r.name}?`)) return;
  await remove(STORES.routes, routeId);
  const affectedDispatches = state.dispatches.filter((d) => d.routeId === routeId);
  for (const d of affectedDispatches) {
    await put(STORES.dispatches, { ...d, routeId: '', updatedAt: now() });
  }
  await addNotification('Ruta eliminada', `${r.name} fue eliminada. Los despachos asociados quedaron sin ruta.`, 'warning', false);
  await refreshAll();
  toast('Ruta eliminada', `${r.name} fue eliminada.`, 'warning');
}

function resetRouteForm() {
  elements.routeForm.reset();
  elements.routeId.value = '';
  elements.routeFormTitle.textContent = 'Registrar ruta';
  elements.cancelRouteEditBtn.classList.add('hidden');
  inlineMessage(elements.routeFormMessage, '', '');
  clearValidation('route');
}

/* ===================== Clima ===================== */

async function loadDemoWeather() {
  await insertMany(STORES.weather, demoData.weather.map((w) => ({ ...w, id: id(), zone: `${w.zone} copia ${String(Date.now()).slice(-4)}` })));
  await addNotification('Alertas de clima cargadas', 'Se agregaron alertas climáticas de prueba.', 'success', false);
  await refreshAll();
  toast('Alertas cargadas', 'Se agregaron alertas climáticas de ejemplo.', 'success');
}

async function saveWeather(event) {
  event.preventDefault();
  const data = {
    zone: elements.weatherZone.value.trim(),
    level: elements.weatherLevel.value.trim(),
    description: elements.weatherDescription.value.trim(),
    recommendation: elements.weatherRecommendation.value.trim()
  };
  if (!validateRequired(data, ['zone', 'description', 'recommendation'], 'weather')) {
    inlineMessage(elements.weatherFormMessage, 'error', 'Completa los datos de la alerta antes de guardar.');
    toast('Faltan datos', 'La alerta no se guardó.', 'error');
    return;
  }
  const editId = elements.weatherId.value;
  const existing = state.weather.find((w) => w.id === editId);
  const record = { id: editId || id(), ...data, createdAt: existing?.createdAt || now(), updatedAt: now() };
  await put(STORES.weather, record);
  await addNotification(editId ? 'Alerta climática actualizada' : 'Alerta climática registrada', `${record.zone}: ${record.description}.`, record.level === 'Crítica' ? 'warning' : 'info', false);
  await refreshAll();
  resetWeatherForm();
  toast('Alerta guardada', `La alerta de ${record.zone} apareció en el panel.`, record.level === 'Crítica' ? 'warning' : 'success');
}

function renderWeather() {
  const search = normalize(elements.weatherSearch.value);
  const list = state.weather.filter((w) => normalize(`${w.zone} ${w.level} ${w.description} ${w.recommendation}`).includes(search));

  elements.weatherPanelList.innerHTML = state.weather.length ? state.weather.slice(0, 6).map((w) => `
    <div class="weather-item ${w.level === 'Crítica' ? 'critical' : w.level === 'Informativa' ? 'info' : ''}">
      <h4>${escapeHtml(w.zone)} <span class="level-badge ${weatherClass(w.level)}">${escapeHtml(w.level)}</span></h4>
      <p><strong>Condición:</strong> ${escapeHtml(w.description)}</p>
      <p><strong>Recomendación:</strong> ${escapeHtml(w.recommendation)}</p>
    </div>
  `).join('') : '<div class="weather-item info"><p>No hay alertas climáticas guardadas.</p></div>';

  elements.weatherTableBody.innerHTML = list.length ? list.map((w) => `
    <tr>
      <td><strong>${escapeHtml(w.zone)}</strong></td>
      <td><span class="level-badge ${weatherClass(w.level)}">${escapeHtml(w.level)}</span></td>
      <td>${escapeHtml(w.description)}</td>
      <td>${escapeHtml(w.recommendation)}</td>
      <td><div class="row-actions">
        <button class="icon-btn edit" data-weather-edit="${w.id}" type="button">Editar</button>
        <button class="icon-btn delete" data-weather-delete="${w.id}" type="button">Eliminar</button>
      </div></td>
    </tr>
  `).join('') : '<tr><td colspan="5" class="empty-cell">No hay alertas para mostrar.</td></tr>';

  elements.weatherTableBody.querySelectorAll('[data-weather-edit]').forEach((btn) => btn.addEventListener('click', () => editWeather(btn.dataset.weatherEdit)));
  elements.weatherTableBody.querySelectorAll('[data-weather-delete]').forEach((btn) => btn.addEventListener('click', () => deleteWeather(btn.dataset.weatherDelete)));
}

async function generateRandomWeather() {
  const samples = [
    { zone: 'Ruta 5 Sur - Los Lagos', level: 'Precaución', description: 'Lluvia persistente y calzada resbaladiza', recommendation: 'Reducir velocidad y aumentar distancia de seguridad' },
    { zone: 'Paso austral hacia Aysén', level: 'Crítica', description: 'Nieve intermitente y baja visibilidad', recommendation: 'Activar monitoreo y considerar detención preventiva' },
    { zone: 'Zona de transbordador', level: 'Informativa', description: 'Demora operacional de 45 minutos', recommendation: 'Recalcular hora estimada de llegada' },
    { zone: 'Ruta 9 - Magallanes', level: 'Crítica', description: 'Rachas de viento superiores a 80 km/h', recommendation: 'Conducir con precaución y mantener comunicación con central' }
  ];
  const sample = samples[Math.floor(Math.random() * samples.length)];
  await put(STORES.weather, { ...sample, id: id(), createdAt: now(), updatedAt: now() });
  await addNotification('Alerta simulada generada', `${sample.zone}: ${sample.description}.`, sample.level === 'Crítica' ? 'warning' : 'info', false);
  await refreshAll();
  toast('Alerta generada', `Se creó una alerta para ${sample.zone}.`, sample.level === 'Crítica' ? 'warning' : 'success');
}

function editWeather(weatherId) {
  const w = state.weather.find((item) => item.id === weatherId);
  if (!w) return;
  elements.weatherId.value = w.id;
  elements.weatherZone.value = w.zone;
  elements.weatherLevel.value = w.level;
  elements.weatherDescription.value = w.description;
  elements.weatherRecommendation.value = w.recommendation;
  elements.weatherFormTitle.textContent = `Editando alerta de ${w.zone}`;
  elements.cancelWeatherEditBtn.classList.remove('hidden');
  scrollToElement(elements.weatherForm);
}

async function deleteWeather(weatherId) {
  const w = state.weather.find((item) => item.id === weatherId);
  if (!w) return;
  if (!confirm(`¿Eliminar alerta de ${w.zone}?`)) return;
  await remove(STORES.weather, weatherId);
  await addNotification('Alerta eliminada', `Se eliminó la alerta de ${w.zone}.`, 'warning', false);
  await refreshAll();
  toast('Alerta eliminada', `La alerta de ${w.zone} fue eliminada.`, 'warning');
}

function resetWeatherForm() {
  elements.weatherForm.reset();
  elements.weatherId.value = '';
  elements.weatherFormTitle.textContent = 'Registrar alerta';
  elements.cancelWeatherEditBtn.classList.add('hidden');
  inlineMessage(elements.weatherFormMessage, '', '');
  clearValidation('weather');
}

/* ===================== Base datos / exportación ===================== */

function renderDatabasePreview() {
  elements.dbCountDispatches.textContent = state.dispatches.length;
  elements.dbCountUsers.textContent = state.users.length;
  elements.dbCountVehicles.textContent = state.vehicles.length;
  elements.dbCountRoutes.textContent = state.routes.length;
  elements.dbCountWeather.textContent = state.weather.length;
  elements.dbCountNotifications.textContent = state.notifications.length;

  const preview = {
    actualizado: new Date().toLocaleString('es-CL'),
    resumen: {
      despachos: state.dispatches.length,
      usuarios: state.users.length,
      vehiculos: state.vehicles.length,
      rutas: state.routes.length,
      clima: state.weather.length,
      notificaciones: state.notifications.length
    },
    ultimosDespachos: state.dispatches.slice(0, 5),
    usuarios: state.users.slice(0, 5),
    vehiculos: state.vehicles.slice(0, 5),
    rutas: state.routes.slice(0, 5),
    clima: state.weather.slice(0, 5)
  };
  elements.databasePreview.textContent = JSON.stringify(preview, null, 2);
}

async function exportDatabase() {
  const backup = { exportedAt: now(), version: 'v2.0', ...state };
  downloadJson(backup, `ecoroute-respaldo-${Date.now()}.json`);
  await addNotification('Respaldo exportado', 'Se descargó un archivo JSON con la información guardada.', 'success', false);
  await refreshAll();
  toast('Respaldo exportado', 'Se descargó un archivo JSON con los datos del prototipo.', 'success');
}

async function importDatabase(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data.dispatches || !data.users || !data.vehicles || !data.routes || !data.weather) {
      throw new Error('Formato inválido');
    }
    if (!confirm('Importar reemplazará los datos actuales. ¿Continuar?')) return;
    await Promise.all(Object.values(STORES).map((name) => clear(name)));
    await insertMany(STORES.dispatches, data.dispatches);
    await insertMany(STORES.users, data.users);
    await insertMany(STORES.vehicles, data.vehicles);
    await insertMany(STORES.routes, data.routes);
    await insertMany(STORES.weather, data.weather);
    await insertMany(STORES.notifications, data.notifications || []);
    await addNotification('Base importada', 'Se importó un respaldo JSON correctamente.', 'success', false);
    await refreshAll();
    toast('Importación lista', 'Los datos del respaldo fueron cargados correctamente.', 'success');
  } catch (error) {
    console.error(error);
    toast('Error de importación', 'El archivo no corresponde al formato esperado.', 'error');
  } finally {
    event.target.value = '';
  }
}

async function resetDatabase() {
  if (!confirm('Esto borrará todos los datos guardados y cargará ejemplos iniciales. ¿Continuar?')) return;
  await Promise.all(Object.values(STORES).map((name) => clear(name)));
  await seedIfEmpty();
  await refreshAll();
  toast('Base reiniciada', 'Se borraron los datos y se cargaron ejemplos iniciales.', 'warning');
}

async function copyDatabaseSummary() {
  await navigator.clipboard.writeText(elements.databasePreview.textContent);
  toast('Resumen copiado', 'El resumen de la base local quedó copiado al portapapeles.', 'success');
}

async function clearNotifications() {
  if (!confirm('¿Limpiar todas las notificaciones?')) return;
  await clear(STORES.notifications);
  await addNotification('Notificaciones reiniciadas', 'Se limpió el historial visual de notificaciones.', 'info', false);
  await refreshAll();
  toast('Notificaciones limpiadas', 'El panel de notificaciones fue reiniciado.', 'info');
}

/* ===================== Utilidades de sincronización ===================== */

async function syncDriverAndVehicleStatus(dispatch) {
  const driver = state.users.find((u) => normalize(u.name) === normalize(dispatch.driver) && u.role === 'Conductor');
  const vehicle = state.vehicles.find((v) => normalize(v.plate) === normalize(dispatch.vehicle));
  const active = dispatch.status === 'En ruta' || dispatch.status === 'Retrasado';

  if (driver) {
    await put(STORES.users, { ...driver, status: active ? 'En ruta' : 'Disponible', updatedAt: now() });
  }
  if (vehicle) {
    await put(STORES.vehicles, { ...vehicle, status: active ? 'En ruta' : 'Disponible', updatedAt: now() });
  }
}

function findBestRouteId(origin, destination) {
  const compatible = state.routes.filter((r) => normalize(r.origin) === normalize(origin) && normalize(r.destination) === normalize(destination));
  if (compatible.length === 0) return '';
  return compatible.sort((a, b) => riskValue(a.risk) - riskValue(b.risk) || Number(a.distance) - Number(b.distance))[0].id;
}

function progressByStatus(status) {
  const map = { Pendiente: 8, 'En ruta': 58, Retrasado: 42, Entregado: 100 };
  return map[status] || 0;
}

function gpsLocation(dispatch) {
  if (dispatch.status === 'Pendiente') return `Camión pendiente de salida en ${dispatch.origin}`;
  if (dispatch.status === 'Entregado') return `Entrega completada en ${dispatch.destination}`;
  if (dispatch.status === 'Retrasado') return 'Camión detenido en zona segura por condición climática o espera operacional';

  const dest = normalize(dispatch.destination);
  if (dest.includes('punta arenas')) return 'Camión en tránsito por la Región de Aysén, aproximándose a transbordador';
  if (dest.includes('coyhaique')) return 'Camión avanzando por tramo austral hacia Coyhaique';
  if (dest.includes('puerto montt')) return 'Camión en Ruta 5 Sur, entrando a la Región de Los Lagos';
  if (dest.includes('osorno')) return 'Camión en Ruta 5 Sur, cercano a destino Osorno';
  return 'Camión en tránsito por corredor logístico sur-austral';
}

async function addNotification(title, message, type = 'info', shouldRefresh = true) {
  const record = { id: id(), title, message, type, createdAt: now(), updatedAt: now() };
  await put(STORES.notifications, record);
  if (shouldRefresh) await refreshAll();
  return record;
}

function notificationTemplate(n) {
  return `
    <div class="notification-item">
      <div>
        <h4>${escapeHtml(n.title)}</h4>
        <p>${escapeHtml(n.message)}</p>
      </div>
      <small>${formatDate(n.createdAt)}</small>
    </div>
  `;
}

function toast(title, message, type = 'info') {
  const box = document.createElement('div');
  box.className = `toast ${type}`;
  box.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}</span>`;
  elements.toastStack.appendChild(box);
  setTimeout(() => box.remove(), 4800);
}

/* ===================== Validación y helpers ===================== */

function addLiveValidation(prefix, ids) {
  ids.forEach((inputId) => {
    const field = elements[inputId];
    if (!field) return;
    field.addEventListener('input', () => {
      if (String(field.value).trim()) setValid(inputId);
    });
    field.addEventListener('blur', () => {
      if (!String(field.value).trim()) setInvalid(inputId, 'Campo obligatorio.');
    });
  });
}

function validateRequired(data, keys, prefix) {
  let ok = true;
  keys.forEach((key) => {
    const inputId = fieldIdByDataKey(prefix, key);
    const value = data[key];
    const empty = value === '' || value === null || value === undefined || Number.isNaN(value);
    if (empty) {
      setInvalid(inputId, 'Campo obligatorio.');
      ok = false;
    } else {
      setValid(inputId);
    }
  });
  return ok;
}

function fieldIdByDataKey(prefix, key) {
  const map = {
    dispatch: { guide: 'dispatchGuide', client: 'dispatchClient', origin: 'dispatchOrigin', destination: 'dispatchDestination', driver: 'dispatchDriver', vehicle: 'dispatchVehicle', status: 'dispatchStatus' },
    user: { name: 'userName', role: 'userRole', phone: 'userPhone', email: 'userEmail' },
    vehicle: { plate: 'vehiclePlate', type: 'vehicleType', capacity: 'vehicleCapacity', km: 'vehicleKm' },
    route: { name: 'routeName', origin: 'routeOrigin', destination: 'routeDestination', distance: 'routeDistance', time: 'routeTime' },
    weather: { zone: 'weatherZone', description: 'weatherDescription', recommendation: 'weatherRecommendation' }
  };
  return map[prefix][key];
}

function setInvalid(inputId, message) {
  const input = elements[inputId];
  const error = document.querySelector(`[data-error="${inputId}"]`);
  if (input) input.classList.add('invalid');
  if (error) error.textContent = message;
}

function setValid(inputId) {
  const input = elements[inputId];
  const error = document.querySelector(`[data-error="${inputId}"]`);
  if (input) input.classList.remove('invalid');
  if (error) error.textContent = '';
}

function clearValidation(prefix) {
  const ids = {
    dispatch: ['dispatchGuide', 'dispatchClient', 'dispatchOrigin', 'dispatchDestination', 'dispatchDriver', 'dispatchVehicle', 'dispatchStatus'],
    user: ['userName', 'userRole', 'userPhone', 'userEmail'],
    vehicle: ['vehiclePlate', 'vehicleType', 'vehicleCapacity', 'vehicleKm'],
    route: ['routeName', 'routeOrigin', 'routeDestination', 'routeDistance', 'routeTime'],
    weather: ['weatherZone', 'weatherDescription', 'weatherRecommendation']
  }[prefix] || [];
  ids.forEach(setValid);
}

function inlineMessage(el, type, message) {
  if (!type) {
    el.className = 'inline-message';
    el.textContent = '';
    return;
  }
  el.className = `inline-message ${type}`;
  el.textContent = message;
}

function statusClass(status) {
  return {
    Pendiente: 'status-pending',
    'En ruta': 'status-route',
    Retrasado: 'status-delayed',
    Entregado: 'status-delivered'
  }[status] || 'status-pending';
}

function weatherClass(level) {
  return {
    Informativa: 'level-info',
    Precaución: 'level-warning',
    Crítica: 'level-danger'
  }[level] || 'level-info';
}

function riskClass(risk) {
  return {
    Bajo: 'level-info',
    Medio: 'level-warning',
    Alto: 'level-danger'
  }[risk] || 'level-info';
}

function riskValue(risk) {
  return { Bajo: 1, Medio: 2, Alto: 3 }[risk] || 4;
}

function id() {
  return window.crypto?.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function now() {
  return new Date().toISOString();
}

function normalize(value) {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}

function formatDate(iso) {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(new Date(iso));
}

function sortUpdated(a, b) {
  return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
}

function sortCreated(a, b) {
  return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
}

function scrollToElement(el) {
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function uniqueGuide(base) {
  if (!state.dispatches.some((d) => normalize(d.guide) === normalize(base))) return base;
  return `${base}-${String(Date.now()).slice(-4)}`;
}

function uniqueEmail(email) {
  const [name, domain] = email.split('@');
  if (!state.users.some((u) => normalize(u.email) === normalize(email))) return email;
  return `${name}${String(Date.now()).slice(-4)}@${domain}`;
}

function uniquePlate(plate) {
  if (!state.vehicles.some((v) => normalize(v.plate) === normalize(plate))) return plate;
  return `${plate}-${String(Date.now()).slice(-2)}`;
}

window.showPage = showPage;
window.searchTracking = searchTracking;
window.assignBestRoute = assignBestRoute;
