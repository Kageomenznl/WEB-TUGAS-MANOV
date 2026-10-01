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
        document.getElementById('sum-watt').innerText = data.summary.total_watt.toFixed(1);
        document.getElementById('sum-kwh').innerText = data.summary.total_kwh.toFixed(4);
        document.getElementById('sum-biaya').innerText = formatRp(data.summary.total_biaya);

        const onlineCount = data.kamar.filter((kmr) => kmr.sensor_online).length;
        const connectionStatus = document.getElementById('sensor-status');
        const statusLabel = document.getElementById('sensor-status-label');
        connectionStatus.classList.toggle('is-online', onlineCount > 0);
        connectionStatus.classList.toggle('is-waiting', onlineCount === 0);
        statusLabel.innerText = onlineCount > 0
            ? `${onlineCount} dari ${data.kamar.length} sensor terhubung`
            : 'Menunggu sensor';

        const container = document.getElementById('container-kamar');
        container.innerHTML = data.kamar.map((kmr) => {
            const online = kmr.sensor_online;
            const hasReading = sensorHasReading(kmr);
            const updatedAt = hasReading
                ? new Date(kmr.last_reading_at * 1000).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                })
                : 'Belum ada pembacaan';
            const reading = (value, digits, unit) => hasReading
                ? `${Number(value).toFixed(digits)} ${unit}`
                : `— ${unit}`;

            return `
                <article class="room-card">
                    <div class="room-heading">
                        <div class="room-identity">
                            <p class="room-kicker">KAMAR ${escapeHtml(kmr.nomor)}</p>
                            <h3 class="room-title">${escapeHtml(kmr.penghuni || 'Belum diisi')}</h3>
                        </div>
                        <button class="edit-tenant" type="button" data-room="${escapeHtml(kmr.nomor)}" aria-label="Ganti nama penghuni kamar ${escapeHtml(kmr.nomor)}">
                            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m12.9 3.1 4 4M3.5 16.5l3.4-.7L16.5 6.2a2.1 2.1 0 0 0-3-3L3.9 12.8l-.4 3.7Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            <span>Ubah nama</span>
                        </button>
                    </div>

                    <div class="room-power">
                        <div>
                            <span class="power-caption">Daya terukur</span>
                            <p class="power-number">${hasReading ? Number(kmr.daya_watt).toFixed(1) : '—'} <small>W</small></p>
                        </div>
                        <span class="sensor-badge ${online ? 'is-online' : 'is-offline'}">
                            <span class="connection-dot" aria-hidden="true"></span>
                            ${online ? 'Terhubung' : 'Menunggu data'}
                        </span>
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
                            <strong>${kmr.total_kwh.toFixed(4)} kWh</strong>
                        </div>
                        <div class="metric">
                            <span>Estimasi tagihan</span>
                            <strong class="metric-bill">Rp ${formatRp(kmr.biaya_kalkulasi)}</strong>
                        </div>
                    </div>
                    <p class="room-updated">${hasReading ? `Terakhir diperbarui ${updatedAt}` : updatedAt}</p>
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
    tenantName.value = currentName === 'Belum diisi' ? '' : currentName;
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
