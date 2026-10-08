const apiBaseUrl = (window.MONITOR_CONFIG?.apiBaseUrl || '').replace(/\/+$/, '');
const apiUrl = (path) => `${apiBaseUrl}${path}`;
const apiFetch = (path, options = {}) => fetch(apiUrl(path), {
    credentials: 'include',
    ...options
});

const formatRp = (angka) => new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0
}).format(angka);

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
})[character]);

const sensorHasReading = (kmr) => kmr.last_reading_at > 0;
const adminModal = document.getElementById('admin-modal');
const adminKeyInput = document.getElementById('admin-key');
let resolveAdminAccess = null;
let dashboardRefreshTimer = null;
const trendHistory = [];

const formatKwh = (value) => Number(value).toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3
});

const formatReadingTime = (timestamp) => new Date(timestamp * 1000).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
});

const renderTrend = (watts, hasOnlineSensor) => {
    const chartEmpty = document.getElementById('chart-empty');
    const axisLabels = document.getElementById('chart-axis-labels');
    const line = document.getElementById('trend-line');
    const dot = document.getElementById('trend-dot');
    const value = document.getElementById('trend-value');
    if (!hasOnlineSensor) {
        chartEmpty.hidden = false;
        line.setAttribute('points', '');
        dot.hidden = true;
        axisLabels.hidden = true;
        value.innerText = '—';
        return;
    }

    const now = Date.now();
    trendHistory.push({ timestamp: now, watts });
    while (trendHistory.length > 0 && (
        now - trendHistory[0].timestamp > 60_000 || trendHistory.length > 21
    )) {
        trendHistory.shift();
    }

    const maxWatts = Math.max(100, ...trendHistory.map((sample) => sample.watts));
    const axisMax = Math.ceil(maxWatts / 100) * 100;
    const points = trendHistory.map((sample, index) => {
        const x = trendHistory.length === 1
            ? 48
            : 48 + (index / (trendHistory.length - 1)) * 580;
        const y = 186 - (sample.watts / axisMax) * 162;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const [lastX, lastY] = points[points.length - 1].split(',');
    line.setAttribute('points', points.join(' '));
    dot.setAttribute('cx', lastX);
    dot.setAttribute('cy', lastY);
    dot.hidden = false;
    axisLabels.hidden = false;
    chartEmpty.hidden = true;
    value.innerText = watts.toFixed(1);
    document.getElementById('chart-max').textContent = `${axisMax} W`;
    document.getElementById('chart-mid-high').textContent = `${Math.round(axisMax * 2 / 3)} W`;
    document.getElementById('chart-mid-low').textContent = `${Math.round(axisMax / 3)} W`;
};

const closeAdminModal = (granted = false) => {
    adminModal.hidden = true;
    adminKeyInput.value = '';
    if (resolveAdminAccess) resolveAdminAccess(granted);
    resolveAdminAccess = null;
};

const requestAdminKey = () => new Promise((resolve) => {
    resolveAdminAccess = resolve;
    adminKeyInput.value = '';
    document.getElementById('admin-error').hidden = true;
    adminModal.hidden = false;
    adminKeyInput.focus();
});

document.getElementById('admin-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const key = adminKeyInput.value.trim();
    if (!key) return;
    const submitButton = event.currentTarget.querySelector('[type="submit"]');
    const error = document.getElementById('admin-error');
    submitButton.disabled = true;
    error.hidden = true;
    try {
        const response = await apiFetch('/api/admin/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: key })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Konfirmasi admin gagal.');
        closeAdminModal(true);
    } catch (error) {
        document.getElementById('admin-error').innerText = error.message;
        document.getElementById('admin-error').hidden = false;
    } finally {
        submitButton.disabled = false;
    }
});

document.getElementById('admin-cancel').addEventListener('click', () => closeAdminModal());
document.getElementById('admin-cancel-icon').addEventListener('click', () => closeAdminModal());
adminModal.addEventListener('click', (event) => {
    if (event.target === adminModal) closeAdminModal();
});

const authScreen = document.getElementById('auth-screen');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');

const showDashboard = () => {
    authScreen.hidden = true;
    dashboard.hidden = false;
    loadData();
    if (!dashboardRefreshTimer) dashboardRefreshTimer = window.setInterval(loadData, 3000);
};

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = document.getElementById('login-submit');
    submitButton.disabled = true;
    loginError.hidden = true;
    try {
        const response = await apiFetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: loginPassword.value })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Login gagal.');
        loginPassword.value = '';
        showDashboard();
    } catch (error) {
        loginError.innerText = error.message;
        loginError.hidden = false;
    } finally {
        submitButton.disabled = false;
    }
});

document.getElementById('site-logout').addEventListener('click', async () => {
    if (dashboardRefreshTimer) window.clearInterval(dashboardRefreshTimer);
    dashboardRefreshTimer = null;
    try {
        const response = await apiFetch('/api/logout', { method: 'POST' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Logout gagal.');
        dashboard.hidden = true;
        authScreen.hidden = false;
        trendHistory.length = 0;
        loginPassword.value = '';
        loginPassword.focus();
    } catch (error) {
        console.error(error);
    }
});

const checkLoginStatus = async () => {
    try {
        const response = await apiFetch('/api/auth/status');
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Status login tidak dapat diperiksa.');
        if (result.authenticated) showDashboard();
    } catch (error) {
        loginError.innerText = error.message;
        loginError.hidden = false;
        console.error(error);
    }
};

const loadData = async () => {
    try {
        const response = await apiFetch('/api/data');
        if (!response.ok) {
            let message = `Data pemantauan tidak dapat dimuat (${response.status}).`;
            try {
                const result = await response.json();
                if (result.error) message = result.error;
            } catch (error) {
                console.error('Respons error API bukan JSON yang valid.', error);
            }
            throw new Error(message);
        }
        const data = await response.json();

        document.getElementById('display-tarif').innerText = formatRp(data.tarif_per_kwh);
        const hasOnlineSensor = data.kamar.some((kmr) => kmr.sensor_online);
        document.getElementById('sum-watt').innerText = hasOnlineSensor
            ? data.summary.total_watt.toFixed(1)
            : '—';
        document.getElementById('sum-watt-unit').hidden = !hasOnlineSensor;
        document.getElementById('sum-kwh').innerText = data.summary.has_month_reading
            ? formatKwh(data.summary.total_kwh)
            : '—';
        document.getElementById('sum-kwh-unit').hidden = !data.summary.has_month_reading;
        document.getElementById('sum-biaya').innerText = data.summary.has_month_reading
            ? formatRp(data.summary.total_biaya)
            : '—';
        document.getElementById('sum-biaya-unit').hidden = !data.summary.has_month_reading;

        const onlineCount = data.kamar.filter((kmr) => kmr.sensor_online).length;
        const connectionStatus = document.getElementById('sensor-status');
        const statusLabel = document.getElementById('sensor-status-label');
        connectionStatus.classList.toggle('is-online', onlineCount > 0);
        connectionStatus.classList.toggle('is-waiting', onlineCount === 0);
        const lastReadingAt = data.summary.last_reading_at;
        statusLabel.innerText = onlineCount > 0
            ? `${onlineCount} dari ${data.kamar.length} sensor terhubung · diperbarui ${formatReadingTime(lastReadingAt)}`
            : lastReadingAt > 0
                ? `Sensor offline · pembacaan terakhir ${formatReadingTime(lastReadingAt)}`
                : 'Belum ada data dari sensor';

        const onlineBoardCount = data.kamar.filter((kmr) => kmr.board_online).length;
        const boardStatus = document.getElementById('board-status');
        const boardStatusLabel = document.getElementById('board-status-label');
        const lastBoardSeenAt = data.summary.last_board_seen_at;
        boardStatus.classList.toggle('is-online', onlineBoardCount > 0);
        boardStatus.classList.toggle('is-waiting', onlineBoardCount === 0);
        boardStatusLabel.innerText = onlineBoardCount > 0
            ? `${onlineBoardCount} ESP32 terhubung · terakhir terlihat ${formatReadingTime(lastBoardSeenAt)}`
            : lastBoardSeenAt > 0
                ? `ESP32 terputus · terakhir terlihat ${formatReadingTime(lastBoardSeenAt)}`
                : 'ESP32 belum terhubung';

        renderTrend(data.summary.total_watt, hasOnlineSensor);

        const container = document.getElementById('container-kamar');
        container.innerHTML = data.kamar.map((kmr) => {
            const online = kmr.sensor_online;
            const hasReading = sensorHasReading(kmr);
            const reading = (value, digits, unit) => hasReading
                ? `${Number(value).toFixed(digits)} ${unit}`
                : `<span class="no-reading">— ${unit}</span>`;
            const penghuni = kmr.penghuni?.trim();
            const isVacant = !penghuni || penghuni === 'Belum diisi';

            return `
                <article class="room-card${isVacant ? ' is-vacant' : ''}">
                    <div class="room-heading">
                        <div class="room-identity">
                            <p class="room-kicker">KAMAR ${escapeHtml(kmr.nomor)}</p>
                            <h3 class="room-title">${escapeHtml(isVacant ? 'Kosong' : penghuni)}</h3>
                        </div>
                        ${isVacant ? '<span class="vacant-label">KAMAR KOSONG</span>' : ''}
                        <button class="edit-tenant" type="button" data-room="${escapeHtml(kmr.nomor)}" aria-label="${isVacant ? 'Isi' : 'Ubah'} penghuni kamar ${escapeHtml(kmr.nomor)}" title="${isVacant ? 'Isi kamar' : 'Ubah nama penghuni'}">
                            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m12.9 3.1 4 4M3.5 16.5l3.4-.7L16.5 6.2a2.1 2.1 0 0 0-3-3L3.9 12.8l-.4 3.7Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </button>
                    </div>

                    <div class="room-power">
                        <div>
                            <span class="power-caption">Daya terukur</span>
                            <p class="power-number${hasReading ? '' : ' no-reading'}">${hasReading ? Number(kmr.daya_watt).toFixed(1) : '—'}${hasReading ? ' <small>W</small>' : ''}</p>
                        </div>
                        ${online ? '<span class="sensor-badge is-online"><span class="connection-dot" aria-hidden="true"></span>Terhubung</span>' : ''}
                    </div>

                    <div class="room-metrics">
                        <div class="metric">
                            <span>Tegangan</span>
                            <strong>${reading(kmr.voltage_v, 1, 'V')}</strong>
                        </div>
                        <div class="metric">
                            <span>Arus</span>
                            <strong>${reading(kmr.current_a, 3, 'A')}</strong>
                        </div>
                        <div class="metric">
                            <span>Konsumsi</span>
                            <strong>${kmr.has_month_reading ? `${formatKwh(kmr.total_kwh)} kWh` : '<span class="no-reading">—</span>'}</strong>
                        </div>
                        <div class="metric">
                            <span>Estimasi tagihan</span>
                            <strong class="metric-bill">${kmr.has_month_reading ? `Rp ${formatRp(kmr.biaya_kalkulasi)}` : '<span class="no-reading">—</span>'}</strong>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    } catch (error) {
        const container = document.getElementById('container-kamar');
        if (!container.querySelector('.room-card')) {
            container.innerHTML = `<p class="loading-message load-error">${escapeHtml(error.message)} Mencoba kembali...</p>`;
        }
        console.error(error);
    }
};

const modal = document.getElementById('tenant-modal');
const tenantForm = document.getElementById('tenant-form');
const tenantName = document.getElementById('tenant-name');
const tenantError = document.getElementById('tenant-error');
let editingRoom = null;

const closeTenantModal = () => {
    modal.hidden = true;
    editingRoom = null;
};

document.getElementById('container-kamar').addEventListener('click', (event) => {
    const button = event.target.closest('[data-room]');
    if (!button) return;

    const room = button.dataset.room;
    const currentName = button.closest('.room-card').querySelector('.room-title').innerText;
    editingRoom = room;
    document.getElementById('tenant-room-label').innerText = `Kamar ${room}`;
    tenantName.value = currentName === 'Belum diisi' || currentName === 'Kosong' ? '' : currentName;
    tenantError.hidden = true;
    modal.hidden = false;
    tenantName.focus();
});

document.getElementById('tenant-cancel').addEventListener('click', closeTenantModal);
document.getElementById('tenant-cancel-icon').addEventListener('click', closeTenantModal);
modal.addEventListener('click', (event) => {
    if (event.target === modal) closeTenantModal();
});

tenantForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!editingRoom) return;

    const saveButton = document.getElementById('tenant-save');
    saveButton.disabled = true;
    tenantError.hidden = true;
    try {
        if (!await requestAdminKey()) return;
        const response = await apiFetch(`/api/kamar/${encodeURIComponent(editingRoom)}/penghuni`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ penghuni: tenantName.value })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Nama penghuni gagal disimpan.');
        closeTenantModal();
        await loadData();
    } catch (error) {
        tenantError.innerText = error.message;
        tenantError.hidden = false;
    } finally {
        saveButton.disabled = false;
    }
});

const tariffModal = document.getElementById('tariff-modal');
const tariffForm = document.getElementById('tariff-form');
const tariffInput = document.getElementById('tariff-input');
const tariffError = document.getElementById('tariff-error');

const closeTariffModal = () => {
    tariffModal.hidden = true;
};

const ubahTarif = () => {
    tariffInput.value = document.getElementById('display-tarif').innerText.replace(/\./g, '');
    tariffError.hidden = true;
    tariffModal.hidden = false;
    tariffInput.focus();
};

document.getElementById('tariff-cancel').addEventListener('click', closeTariffModal);
document.getElementById('tariff-cancel-icon').addEventListener('click', closeTariffModal);
tariffModal.addEventListener('click', (event) => {
    if (event.target === tariffModal) closeTariffModal();
});

tariffForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const saveButton = document.getElementById('tariff-save');
    saveButton.disabled = true;
    tariffError.hidden = true;

    try {
        if (!await requestAdminKey()) return;
        const response = await apiFetch('/api/tarif', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tarif: Number(tariffInput.value) })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Tarif gagal diperbarui.');
        closeTariffModal();
        await loadData();
    } catch (error) {
        tariffError.innerText = error.message;
        tariffError.hidden = false;
    } finally {
        saveButton.disabled = false;
    }
});

checkLoginStatus();
