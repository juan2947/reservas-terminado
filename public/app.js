// StackBlitz muestra la app dentro de un iframe; algunos navegadores bloquean localStorage ahí.
// Estas funciones evitan que la app se rompa si el almacenamiento no está disponible.
const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* sin almacenamiento */ } },
  remove(key) { try { localStorage.removeItem(key); } catch { /* sin almacenamiento */ } }
};

function leerUsuarioGuardado() {
  try { return JSON.parse(storage.get('reservaUser') || 'null'); } catch { return null; }
}

const state = {
  spaces: [],
  reservations: [],
  filteredReservations: [],
  currentView: 'dashboard',
  toastTimer: null,
  token: storage.get('reservaToken') || '',
  user: leerUsuarioGuardado()
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function formatDate(value) {
  if (!value) return '—';
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(year, month - 1, day));
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function defaultFutureDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return localDateString(date);
}

async function api(url, options = {}) {
  const requestOptions = { ...options, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}), ...(options.headers || {}) } };
  const response = await fetch(url, requestOptions);
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('El servidor devolvió una respuesta que no es JSON.');
  }
  if (!response.ok) throw new Error(data.error || `Error HTTP ${response.status}`);
  return data;
}

function showToast(message, type = 'success') {
  const toast = $('#toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.hidden = false;
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => { toast.hidden = true; }, 5000);
}

function showFormMessage(selector, message, type = 'error') {
  const box = $(selector);
  box.textContent = message;
  box.className = `form-message ${type}`;
  box.hidden = false;
}

function clearFormMessage(selector) {
  const box = $(selector);
  box.hidden = true;
  box.textContent = '';
}

function getSpaceName(id) {
  return state.spaces.find((space) => space.id === Number(id))?.nombre || `Espacio #${id}`;
}

function statusLabel(status) {
  const labels = { activa: 'Activa', cancelada: 'Cancelada', finalizada: 'Finalizada' };
  return labels[status] || status || 'Sin estado';
}

function statusBadge(status) {
  const safeStatus = ['activa', 'cancelada', 'finalizada'].includes(status) ? status : 'finalizada';
  return `<span class="status status-${safeStatus}">${statusLabel(safeStatus)}</span>`;
}

function isFutureReservation(reservation) {
  if (reservation.fecha > localDateString()) return true;
  if (reservation.fecha < localDateString()) return false;
  return `${reservation.fecha}T${reservation.horaInicio}:00` > localDateTimeMinute();
}

function localDateTimeMinute() {
  const date = new Date();
  return `${localDateString(date)}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00`;
}

function populateSpaceSelects() {
  const selects = ['#reservation-space', '#filter-space', '#availability-space'];
  for (const selector of selects) {
    const select = $(selector);
    if (!select) continue;
    const previous = select.value;
    const allOption = selector === '#filter-space' ? '<option value="">Todos los espacios</option>' : '<option value="">Selecciona un espacio</option>';
    select.innerHTML = allOption + state.spaces.map((space) =>
      `<option value="${space.id}">${escapeHtml(space.nombre)} — ${escapeHtml(space.ubicacion)}</option>`
    ).join('');
    if ([...select.options].some((option) => option.value === previous)) select.value = previous;
  }
}

async function loadBaseData() {
  const [spaces, reservations] = await Promise.all([api('/espacios'), api('/reservas')]);
  state.spaces = spaces;
  state.reservations = reservations;
  if (state.user?.rol === 'directivo') { const profiles = await api('/usuarios'); $('#profiles-body').innerHTML = profiles.map(u => `<tr><td>${u.id}</td><td>${escapeHtml(u.nombre)}</td><td>${escapeHtml(u.correo)}</td><td>${escapeHtml(u.rol)}</td></tr>`).join(''); }
  populateSpaceSelects();
  renderDashboard();
  renderSpaces();
  if (state.currentView === 'reservas') await loadReservationList();
}

function switchView(view) {
  const allowedViews = ['dashboard', 'form', 'reservas', 'disponibilidad', 'espacios', 'perfiles'];
  if (['espacios', 'perfiles'].includes(view) && state.user?.rol !== 'directivo') { showToast('Esta sección es exclusiva para directivos.', 'error'); return; }
  if (!allowedViews.includes(view)) return;
  state.currentView = view;
  $$('.view').forEach((section) => { section.hidden = section.id !== `view-${view}`; });
  $$('.nav-link').forEach((button) => button.classList.toggle('active', button.dataset.viewLink === view));
  const titles = {
    dashboard: 'Resumen general', form: 'Nueva reserva', reservas: 'Reservas registradas',
    disponibilidad: 'Disponibilidad', espacios: 'Espacios académicos', perfiles: 'Perfiles registrados'
  };
  $('#page-title').textContent = titles[view];

  if (view === 'reservas') loadReservationList().catch((error) => showToast(error.message, 'error'));
  if (view === 'espacios') renderSpaces();
  if (view === 'form' && !$('#reservation-id').value) resetReservationForm();
}

function renderDashboard() {
  const active = state.reservations.filter((reservation) => reservation.estado === 'activa');
  $('#stat-total').textContent = String(state.reservations.length);
  $('#stat-active').textContent = String(active.length);
  $('#stat-spaces').textContent = String(state.spaces.length);

  const upcoming = active
    .filter(isFutureReservation)
    .sort((a, b) => `${a.fecha}T${a.horaInicio}`.localeCompare(`${b.fecha}T${b.horaInicio}`))
    .slice(0, 5);
  const tbody = $('#upcoming-body');
  if (!upcoming.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">Todavía no hay próximas reservas. Crea la primera con el botón “Crear reserva”.</td></tr>';
    return;
  }
  tbody.innerHTML = upcoming.map((reservation) => `
    <tr>
      <td><strong>${escapeHtml(getSpaceName(reservation.espacio))}</strong></td>
      <td>${escapeHtml(reservation.solicitante)}</td>
      <td>${escapeHtml(formatDate(reservation.fecha))}</td>
      <td>${escapeHtml(reservation.horaInicio)}–${escapeHtml(reservation.horaFin)}</td>
      <td>${statusBadge(reservation.estado)}</td>
    </tr>`).join('');
}

function reservationRow(reservation, includeActions = true) {
  const actionsAllowed = reservation.estado === 'activa' && isFutureReservation(reservation);
  const actions = includeActions ? `
    <div class="action-group">
      <button class="button-link" type="button" data-action="detail" data-id="${reservation.id}">Ver</button>
      ${actionsAllowed ? `<button class="button-link" type="button" data-action="edit" data-id="${reservation.id}">Editar</button><button class="button-link" type="button" data-action="cancel" data-id="${reservation.id}">Cancelar</button>` : ''}
    </div>` : '';
  return `<tr>
    <td>#${reservation.id}</td>
    <td><strong>${escapeHtml(getSpaceName(reservation.espacio))}</strong></td>
    <td>${escapeHtml(reservation.solicitante)}</td>
    <td>${escapeHtml(formatDate(reservation.fecha))}</td>
    <td>${escapeHtml(reservation.horaInicio)}–${escapeHtml(reservation.horaFin)}</td>
    <td>${statusBadge(reservation.estado)}</td>
    ${includeActions ? `<td>${actions}</td>` : ''}
  </tr>`;
}

async function loadReservationList() {
  const parameters = new URLSearchParams();
  const space = $('#filter-space').value;
  const requester = $('#filter-requester').value.trim();
  const status = $('#filter-status').value;
  const date = $('#filter-date').value;
  if (space) parameters.set('espacio', space);
  if (requester) parameters.set('solicitante', requester);
  if (status) parameters.set('estado', status);
  if (date) parameters.set('fecha', date);

  const suffix = parameters.toString() ? `?${parameters.toString()}` : '';
  const reservations = await api(`/reservas${suffix}`);
  state.filteredReservations = reservations;
  $('#reservation-count').textContent = `${reservations.length} ${reservations.length === 1 ? 'resultado' : 'resultados'}`;
  const tbody = $('#reservations-body');
  tbody.innerHTML = reservations.length
    ? reservations.map((reservation) => reservationRow(reservation, true)).join('')
    : '<tr><td colspan="7" class="empty-cell">No se encontraron reservas con esos filtros.</td></tr>';
}

function resetReservationForm() {
  $('#reservation-form').reset();
  $('#reservation-requester').value = state.user?.nombre || '';
  $('#reservation-requester').readOnly = state.user?.rol !== 'directivo';
  $('#reservation-id').value = '';
  $('#reservation-date').min = localDateString();
  $('#reservation-date').value = defaultFutureDate();
  $('#reservation-form-title').textContent = 'Registrar una reserva';
  $('#reservation-submit').textContent = 'Confirmar reserva';
  $('#cancel-edit').hidden = true;
  clearFormMessage('#reservation-form-message');
}

function startEditingReservation(reservation) {
  $('#reservation-id').value = reservation.id;
  $('#reservation-space').value = String(reservation.espacio);
  $('#reservation-requester').value = reservation.solicitante;
  $('#reservation-requester').readOnly = state.user?.rol !== 'directivo';
  $('#reservation-date').min = localDateString();
  $('#reservation-date').value = reservation.fecha;
  $('#reservation-start').value = reservation.horaInicio;
  $('#reservation-end').value = reservation.horaFin;
  $('#reservation-reason').value = reservation.motivo || '';
  $('#reservation-form-title').textContent = `Editar reserva #${reservation.id}`;
  $('#reservation-submit').textContent = 'Guardar cambios';
  $('#cancel-edit').hidden = false;
  clearFormMessage('#reservation-form-message');
  switchView('form');
}

function openReservationDetail(reservation) {
  $('#dialog-title').textContent = `Reserva #${reservation.id}`;
  const fields = [
    ['Espacio', getSpaceName(reservation.espacio)],
    ['Solicitante', reservation.solicitante],
    ['Fecha', formatDate(reservation.fecha)],
    ['Horario', `${reservation.horaInicio}–${reservation.horaFin}`],
    ['Estado', statusLabel(reservation.estado)],
    ['Motivo', reservation.motivo || 'No se indicó un motivo'],
    ['Creada el', formatDateTime(reservation.creadaEn)],
    ['Modificada el', reservation.modificadaEn ? formatDateTime(reservation.modificadaEn) : 'No registra modificaciones'],
    ['Cancelada el', reservation.canceladaEn ? formatDateTime(reservation.canceladaEn) : 'No aplica']
  ];
  const content = $('#dialog-content');
  content.replaceChildren();
  fields.forEach(([label, value]) => {
    const row = document.createElement('div');
    row.className = 'detail-row';
    const caption = document.createElement('small');
    caption.textContent = label;
    const text = document.createElement('strong');
    text.textContent = value;
    row.append(caption, text);
    content.append(row);
  });
  const dialog = $('#reservation-dialog');
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}

async function cancelReservation(id) {
  const reservation = state.reservations.find((item) => item.id === Number(id));
  if (!reservation) return;
  const question = `¿Cancelar la reserva #${reservation.id}?\n${getSpaceName(reservation.espacio)} · ${formatDate(reservation.fecha)}\n${reservation.horaInicio}–${reservation.horaFin}\n\nLa reserva permanecerá en el historial.`;
  if (!window.confirm(question)) return;
  try {
    const result = await api(`/reservas/${id}`, { method: 'DELETE' });
    showToast(result.mensaje || 'Reserva cancelada.');
    await loadBaseData();
    if (state.currentView === 'reservas') await loadReservationList();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function renderSpaces() {
  const container = $('#spaces-list');
  if (!state.spaces.length) {
    container.innerHTML = '<div class="empty-cell">No hay espacios registrados.</div>';
    return;
  }
  container.innerHTML = state.spaces.map((space) => `
    <article class="space-card">
      <div class="space-symbol" aria-hidden="true">⌂</div>
      <div class="space-info"><strong>${escapeHtml(space.nombre)}</strong><small>${escapeHtml(space.ubicacion)}</small><small>Capacidad: ${space.capacidad} personas · ID ${space.id}</small></div>
      <div class="space-actions"><button class="button button-secondary button-small" type="button" data-action="edit-space" data-id="${space.id}">Editar</button></div>
    </article>`).join('');
}

function resetSpaceForm() {
  $('#space-form').reset();
  $('#space-id').value = '';
  $('#space-form-title').textContent = 'Agregar espacio';
  $('#space-submit').textContent = 'Guardar espacio';
  $('#cancel-space-edit').hidden = true;
  clearFormMessage('#space-form-message');
}

function editSpace(space) {
  $('#space-id').value = space.id;
  $('#space-name').value = space.nombre;
  $('#space-location').value = space.ubicacion;
  $('#space-capacity').value = space.capacidad;
  $('#space-form-title').textContent = `Editar espacio #${space.id}`;
  $('#space-submit').textContent = 'Guardar cambios';
  $('#cancel-space-edit').hidden = false;
  clearFormMessage('#space-form-message');
  $('#space-name').focus();
}

async function consultAvailability(event) {
  event.preventDefault();
  const space = $('#availability-space').value;
  const date = $('#availability-date').value;
  if (!space || !date) return;
  const resultPanel = $('#availability-result');
  resultPanel.innerHTML = '<div class="empty-state"><span aria-hidden="true">◷</span><h3>Consultando…</h3><p>Buscando las reservas registradas para esa fecha.</p></div>';
  try {
    const parameters = new URLSearchParams({ espacio: space, fecha: date });
    const result = await api(`/reservas/disponibilidad?${parameters.toString()}`);
    const stateText = result.disponible ? 'Sin reservas activas' : `${result.totalReservasActivas} ${result.totalReservasActivas === 1 ? 'reserva activa' : 'reservas activas'}`;
    resultPanel.innerHTML = `
      <div class="availability-header"><div><h3>${escapeHtml(result.espacio.nombre)}</h3><p>${escapeHtml(result.espacio.ubicacion)} · ${escapeHtml(formatDate(result.fecha))}</p></div><span class="availability-summary ${result.disponible ? '' : 'busy'}">${escapeHtml(stateText)}</span></div>
      ${result.disponible
        ? '<div class="availability-empty"><strong>El espacio no tiene reservas activas registradas para esa fecha.</strong><br>Puedes continuar al formulario y solicitar el horario que necesitas.</div>'
        : `<div class="availability-list">${result.reservas.map((reservation) => `<div class="availability-item"><div><strong>${escapeHtml(reservation.horaInicio)}–${escapeHtml(reservation.horaFin)}</strong><small>${escapeHtml(reservation.solicitante)} · Reserva #${reservation.id}</small>${reservation.motivo ? `<small>Motivo: ${escapeHtml(reservation.motivo)}</small>` : ''}</div>${statusBadge(reservation.estado)}</div>`).join('')}</div>`}
      <div class="form-actions"><button class="button button-primary" type="button" id="reserve-this-space">＋ Crear reserva en este espacio</button></div>`;
    $('#reserve-this-space').addEventListener('click', () => {
      switchView('form'); // Cambiar de vista primero, porque al abrir el formulario se reinician sus campos.
      $('#reservation-space').value = String(result.espacio.id);
      $('#reservation-date').value = result.fecha;
    });
  } catch (error) {
    resultPanel.innerHTML = `<div class="form-message error">${escapeHtml(error.message)}</div>`;
  }
}

function exportReservationsCsv() {
  const rows = state.filteredReservations;
  if (!rows.length) {
    showToast('No hay reservas para exportar con los filtros actuales.', 'error');
    return;
  }
  const values = [
    ['ID', 'Espacio', 'Ubicación', 'Solicitante', 'Fecha', 'Hora inicio', 'Hora fin', 'Estado', 'Motivo'],
    ...rows.map((reservation) => {
      const space = state.spaces.find((item) => item.id === Number(reservation.espacio));
      return [reservation.id, space?.nombre || '', space?.ubicacion || '', reservation.solicitante, reservation.fecha, reservation.horaInicio, reservation.horaFin, statusLabel(reservation.estado), reservation.motivo || ''];
    })
  ];
  const csv = values.map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reservas-${localDateString()}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function registerEvents() {
  $$('[data-view-link]').forEach((button) => button.addEventListener('click', () => switchView(button.dataset.viewLink)));
  $$('[data-go]').forEach((button) => button.addEventListener('click', () => switchView(button.dataset.go)));

  $('#reservation-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFormMessage('#reservation-form-message');
    const id = $('#reservation-id').value;
    const data = {
      espacio: Number($('#reservation-space').value),
      solicitante: state.user?.rol === 'directivo' ? $('#reservation-requester').value.trim() : state.user?.nombre,
      fecha: $('#reservation-date').value,
      horaInicio: $('#reservation-start').value,
      horaFin: $('#reservation-end').value,
      motivo: $('#reservation-reason').value.trim()
    };
    try {
      const result = await api(id ? `/reservas/${id}` : '/reservas', {
        method: id ? 'PUT' : 'POST', body: JSON.stringify(data)
      });
      showToast(result.mensaje || 'Operación realizada correctamente.');
      resetReservationForm();
      await loadBaseData();
      switchView('reservas');
    } catch (error) {
      showFormMessage('#reservation-form-message', error.message, 'error');
    }
  });

  $('#cancel-edit').addEventListener('click', () => { resetReservationForm(); switchView('reservas'); });
  $('#reservation-filter').addEventListener('submit', async (event) => {
    event.preventDefault();
    try { await loadReservationList(); } catch (error) { showToast(error.message, 'error'); }
  });
  $('#clear-filters').addEventListener('click', async () => {
    $('#reservation-filter').reset();
    try { await loadReservationList(); } catch (error) { showToast(error.message, 'error'); }
  });
  $('#reservations-body').addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const id = Number(button.dataset.id);
    const reservation = state.filteredReservations.find((item) => item.id === id) || state.reservations.find((item) => item.id === id);
    if (!reservation) return;
    if (button.dataset.action === 'detail') openReservationDetail(reservation);
    if (button.dataset.action === 'edit') startEditingReservation(reservation);
    if (button.dataset.action === 'cancel') cancelReservation(id);
  });
  $('#export-csv').addEventListener('click', exportReservationsCsv);
  $('#availability-form').addEventListener('submit', consultAvailability);

  $('#space-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFormMessage('#space-form-message');
    const id = $('#space-id').value;
    const data = {
      nombre: $('#space-name').value.trim(),
      ubicacion: $('#space-location').value.trim(),
      capacidad: Number($('#space-capacity').value)
    };
    try {
      const result = await api(id ? `/espacios/${id}` : '/espacios', {
        method: id ? 'PUT' : 'POST', body: JSON.stringify(data)
      });
      resetSpaceForm();
      showToast(result.mensaje || 'Espacio guardado correctamente.');
      await loadBaseData();
    } catch (error) {
      showFormMessage('#space-form-message', error.message, 'error');
    }
  });
  $('#cancel-space-edit').addEventListener('click', resetSpaceForm);
  $('#spaces-list').addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="edit-space"]');
    if (!button) return;
    const space = state.spaces.find((item) => item.id === Number(button.dataset.id));
    if (space) editSpace(space);
  });

  const closeDialog = () => {
    const dialog = $('#reservation-dialog');
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
  };
  $('#close-dialog').addEventListener('click', closeDialog);
  $('#dialog-close-bottom').addEventListener('click', closeDialog);
  $('#reservation-dialog').addEventListener('click', (event) => {
    if (event.target === $('#reservation-dialog')) closeDialog();
  });
}

async function startApp() {
  $('#reservation-date').min = localDateString();
  $('#reservation-date').value = defaultFutureDate();
  $('#availability-date').value = defaultFutureDate();
  $('#availability-date').min = localDateString();
  registerEvents();
  $('#show-login').addEventListener('click', () => { $('#login-form').hidden = false; $('#register-form').hidden = true; });
  $('#show-register').addEventListener('click', () => { $('#login-form').hidden = true; $('#register-form').hidden = false; });
  const authenticate = async (url, payload) => {
    const result = await api(url, { method: 'POST', body: JSON.stringify(payload) });
    state.token = result.token; state.user = result.usuario;
    storage.set('reservaToken', state.token); storage.set('reservaUser', JSON.stringify(state.user));
    $('#auth-screen').hidden = true; $('#application-shell').hidden = false;
    $('#current-user-name').textContent = state.user.nombre;
    $('#current-user-role').textContent = state.user.rol === 'directivo' ? 'Directivo' : state.user.rol === 'docente' ? 'Docente' : 'Alumno';
    $$('[data-admin-only]').forEach(el => { el.hidden = state.user.rol !== 'directivo'; });
    $('#reservation-requester').value = state.user.nombre; $('#reservation-requester').readOnly = state.user.rol !== 'directivo';
    await loadBaseData(); resetReservationForm();
  };
  $('#login-form').addEventListener('submit', async e => { e.preventDefault(); try { await authenticate('/usuarios/login', { correo: $('#login-email').value, password: $('#login-password').value }); } catch (err) { showFormMessage('#login-message', err.message); } });
  $('#register-form').addEventListener('submit', async e => { e.preventDefault(); try { await authenticate('/usuarios/registro', { nombre: $('#register-name').value, correo: $('#register-email').value, password: $('#register-password').value, rol: $('#register-role').value }); } catch (err) { showFormMessage('#register-message', err.message); } });
  $('#logout-button').addEventListener('click', async () => { try { await api('/usuarios/logout', { method: 'POST' }); } catch {} storage.remove('reservaToken'); storage.remove('reservaUser'); state.token = ''; state.user = null; $('#application-shell').hidden = true; $('#auth-screen').hidden = false; $('#login-form').reset(); });
  if (state.token && state.user) {
    try { const me = await api('/usuarios/perfil'); state.user = me; $('#auth-screen').hidden = true; $('#application-shell').hidden = false; $('#current-user-name').textContent = me.nombre; $('#current-user-role').textContent = me.rol; $$('[data-admin-only]').forEach(el => { el.hidden = me.rol !== 'directivo'; }); $('#reservation-requester').value = me.nombre; $('#reservation-requester').readOnly = me.rol !== 'directivo'; await loadBaseData(); }
    catch { storage.remove('reservaToken'); storage.remove('reservaUser'); state.token = ''; state.user = null; }
  }
}

document.addEventListener('DOMContentLoaded', startApp);
