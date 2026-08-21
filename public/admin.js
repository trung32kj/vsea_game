/* ══════════════════════════════════════════════════════════════
   VSEATeam Admin Panel – JavaScript
══════════════════════════════════════════════════════════════ */

// ── CONFIG ────────────────────────────────────────────────────────
const API = '';

const FETCH_OPTS = { credentials: 'include' };
const JSON_HEADERS = { 'Content-Type': 'application/json' };

let allPlayers = [];
let allGifts = [];
let editingGiftId = null;
let confirmCallback = null;

// ── INIT ──────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
    const res = await fetch(`${API}/api/admin.php?action=check`, FETCH_OPTS);
    const data = await res.json();
    if (data.isAdmin) showAdminApp();

    document.getElementById('confirm-ok').addEventListener('click', () => {
        closeConfirm();
        if (confirmCallback) confirmCallback();
    });
});

// ── AUTH ──────────────────────────────────────────────────────────
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-user').value.trim();
    const password = document.getElementById('login-pass').value;
    const errEl = document.getElementById('login-error');
    errEl.style.display = 'none';
    try {
        const res = await fetch(`${API}/api/admin.php?action=login`, {
            method: 'POST',
            headers: JSON_HEADERS,
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('login-modal').style.display = 'none';
            showAdminApp();
        } else {
            errEl.textContent = data.message || 'Đăng nhập thất bại';
            errEl.style.display = 'block';
        }
    } catch {
        errEl.textContent = 'Lỗi kết nối server';
        errEl.style.display = 'block';
    }
}

async function handleLogout() {
    await fetch(`${API}/api/admin.php?action=logout`, { method: 'POST', ...FETCH_OPTS });
    location.reload();
}

function showAdminApp() {
    document.getElementById('login-modal').style.display = 'none';
    document.getElementById('admin-app').style.display = 'grid';
    loadDashboard();
    loadPlayers();
    loadGifts();
}

// ── SIDEBAR ───────────────────────────────────────────────────────
function switchTab(tab, el) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    el.classList.add('active');
    closeSidebar();
}
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); }

// ── GAME SESSION ──────────────────────────────────────────────────
function updateGameStatusUI(active) {
    const badge = document.getElementById('game-status-badge');
    const btnStart = document.getElementById('btn-start-game');
    const btnStop = document.getElementById('btn-stop-game');
    if (!badge) return;
    if (active) {
        badge.textContent = '▶ Đang mở';
        badge.className = 'game-status-badge badge-active';
        btnStart.style.display = 'none';
        btnStop.style.display = 'inline-block';
    } else {
        badge.textContent = '⏸ Chưa mở';
        badge.className = 'game-status-badge badge-stopped';
        btnStart.style.display = 'inline-block';
        btnStop.style.display = 'none';
    }
}

async function startGameSession() {
    const btn = document.getElementById('btn-start-game');
    btn.disabled = true; btn.textContent = '⏳ Đang mở...';
    try {
        const res = await fetch(`${API}/api/admin.php?action=start_game`, { method: 'POST', ...FETCH_OPTS });
        const data = await res.json();
        if (data.success) { updateGameStatusUI(true); loadGifts(); loadDashboard(); }
    } catch (err) { console.error(err); }
    finally { btn.disabled = false; btn.textContent = '▶ Bắt đầu game'; }
}

async function stopGameSession() {
    const btn = document.getElementById('btn-stop-game');
    btn.disabled = true;
    try {
        const res = await fetch(`${API}/api/admin.php?action=stop_game`, { method: 'POST', ...FETCH_OPTS });
        const data = await res.json();
        if (data.success) updateGameStatusUI(false);
    } catch (err) { console.error(err); }
    finally { btn.disabled = false; }
}

// ── DASHBOARD ─────────────────────────────────────────────────────
async function loadDashboard() {
    try {
        const res = await fetch(`${API}/api/admin.php?action=stats`, FETCH_OPTS);
        const data = await res.json();
        if (!data.success) return;

        document.getElementById('stat-players').textContent = data.totalPlayers;
        document.getElementById('stat-results').textContent = data.totalResults;
        document.getElementById('stat-gifts').textContent = data.giftsGiven;

        // Game session status
        updateGameStatusUI(data.gameActive);

        const list = document.getElementById('gift-status-list');
        if (!data.gifts || data.gifts.length === 0) {
            list.innerHTML = '<p style="color:#5f6368;font-size:14px">Chưa có quà nào.</p>';
            return;
        }
        list.innerHTML = data.gifts.map(g => {
            const given = g.original_quantity - g.quantity;
            const pct = g.original_quantity > 0
                ? (given / g.original_quantity * 100).toFixed(0) : 0;
            return `
        <div class="gift-status-item">
          <div class="gift-status-top">
            <span>🎁 ${escHtml(g.name)}</span>
            <span>${given} / ${g.original_quantity} &nbsp;(còn ${g.quantity})</span>
          </div>
          <div class="gift-status-bar">
            <div class="gift-status-fill" style="width:${pct}%"></div>
          </div>
        </div>`;
        }).join('');
    } catch (err) { console.error(err); }
}

// ── PLAYERS ───────────────────────────────────────────────────────
async function loadPlayers() {
    try {
        const res = await fetch(`${API}/api/admin.php?action=players`, FETCH_OPTS);
        const data = await res.json();
        if (!data.success) return;
        allPlayers = data.players;
        renderPlayers(allPlayers);
    } catch (err) { console.error(err); }
}

function renderPlayers(players) {
    const tbody = document.getElementById('players-tbody');
    if (!players || players.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="loading-row">Chưa có người chơi nào.</td></tr>';
        return;
    }
    tbody.innerHTML = players.map((p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${escHtml(p.full_name)}</strong></td>
      <td>${escHtml(p.email)}</td>
      <td>${escHtml(p.phone)}</td>
      <td>${escHtml(p.class_name)}</td>
      <td>${p.score != null
            ? `<span class="badge badge-blue">${p.score}</span>` : '—'}</td>
      <td>${p.rounds_completed != null ? `${p.rounds_completed}/5` : '—'}</td>
      <td>${p.gift_name
            ? `<span class="badge ${p.gift_name.includes('tham gia') ? 'badge-gray' : 'badge-gold'}">${escHtml(p.gift_name)}</span>`
            : '—'}</td>
      <td style="font-size:12px;color:#5f6368">${p.created_at || '—'}</td>
      <td>
        <button class="btn-icon del" title="Xóa"
          onclick="confirmDeletePlayer(${p.id}, '${escHtml(p.full_name)}')">🗑️</button>
      </td>
    </tr>`).join('');
}

function filterPlayers() {
    const q = document.getElementById('search-input').value.toLowerCase();
    renderPlayers(allPlayers.filter(p =>
        p.full_name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.class_name.toLowerCase().includes(q)
    ));
}

function confirmDeletePlayer(id, name) {
    showConfirm('Xóa người chơi',
        `Bạn có chắc muốn xóa "${name}"? Hành động này không thể hoàn tác.`,
        async () => {
            await fetch(`${API}/api/admin.php?action=delete_player&id=${id}`, { method: 'DELETE', ...FETCH_OPTS });
            loadPlayers(); loadDashboard();
        });
}

function exportCSV() {
    if (!allPlayers.length) return alert('Không có dữ liệu để xuất.');
    const headers = ['STT', 'Họ và tên', 'Email', 'Số điện thoại', 'Lớp',
        'Điểm', 'Vòng', 'Phần quà', 'Thời gian đăng ký'];
    const rows = allPlayers.map((p, i) => [
        i + 1, p.full_name, p.email, p.phone, p.class_name,
        p.score || 0,
        p.rounds_completed != null ? `${p.rounds_completed}/5` : '0/5',
        p.gift_name || 'Không', p.created_at || ''
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `vseateam-players-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
}

// ── GIFTS ─────────────────────────────────────────────────────────
async function loadGifts() {
    try {
        const res = await fetch(`${API}/api/admin.php?action=gifts`, FETCH_OPTS);
        const data = await res.json();
        if (!data.success) return;
        allGifts = data.gifts;
        renderGifts(allGifts);
        updateTotalProb(allGifts);
    } catch (err) { console.error(err); }
}

function renderGifts(gifts) {
    const tbody = document.getElementById('gifts-tbody');
    if (!gifts || gifts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading-row">Chưa có quà nào.</td></tr>';
        return;
    }
    tbody.innerHTML = gifts.map((g, i) => {
        const given = g.original_quantity - g.quantity;
        return `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${escHtml(g.name)}</strong></td>
        <td><span class="badge badge-gold">${g.probability}%</span></td>
        <td>${g.original_quantity}</td>
        <td>${g.quantity <= 0
                ? '<span class="badge badge-gray">Hết</span>'
                : `<span class="badge badge-green">${g.quantity}</span>`}</td>
        <td>${given}</td>
        <td>
          <button class="btn-icon" title="Sửa"
            onclick="openGiftModal(${g.id})">✏️</button>
          <button class="btn-icon del" title="Xóa"
            onclick="confirmDeleteGift(${g.id}, '${escHtml(g.name)}')">🗑️</button>
        </td>
      </tr>`;
    }).join('');
}

function updateTotalProb(gifts) {
    const total = gifts.reduce((s, g) => s + g.probability, 0);
    const el = document.getElementById('total-prob-display');
    if (!el) return;
    const color = total > 100 ? '#ea4335' : total === 100 ? '#34a853' : '#f5a623';
    el.innerHTML = ` | Tổng hiện tại: <strong style="color:${color}">${total}%</strong>`
        + (total > 100 ? ' ⚠️ Vượt 100%!' : '');
}

function openGiftModal(id) {
    editingGiftId = id || null;
    document.getElementById('gift-modal-title').textContent =
        id ? 'Chỉnh sửa quà' : 'Thêm quà mới';
    document.getElementById('gift-modal-error').style.display = 'none';
    if (id) {
        const gift = allGifts.find(g => g.id === id);
        if (gift) {
            document.getElementById('gift-name').value = gift.name;
            document.getElementById('gift-prob').value = gift.probability;
            document.getElementById('gift-qty').value = gift.quantity;
        }
    } else {
        document.getElementById('gift-name').value = '';
        document.getElementById('gift-prob').value = '';
        document.getElementById('gift-qty').value = '';
    }
    document.getElementById('gift-modal').style.display = 'flex';
}

function closeGiftModal() {
    document.getElementById('gift-modal').style.display = 'none';
    editingGiftId = null;
}

async function saveGift(e) {
    e.preventDefault();
    const errEl = document.getElementById('gift-modal-error');
    errEl.style.display = 'none';
    const name = document.getElementById('gift-name').value.trim();
    const quantity = parseInt(document.getElementById('gift-qty').value);
    const probability = parseFloat(document.getElementById('gift-prob').value);
    if (!name || isNaN(quantity) || isNaN(probability)) {
        errEl.textContent = 'Vui lòng điền đầy đủ thông tin.';
        errEl.style.display = 'block';
        return;
    }
    const method = editingGiftId ? 'PUT' : 'POST';
    const url = editingGiftId
        ? `${API}/api/admin.php?action=update_gift&id=${editingGiftId}`
        : `${API}/api/admin.php?action=add_gift`;
    try {
        const res = await fetch(url, {
            method,
            headers: JSON_HEADERS,
            credentials: 'include',
            body: JSON.stringify({ name, quantity, probability })
        });
        const data = await res.json();
        if (data.success) { closeGiftModal(); loadGifts(); loadDashboard(); }
        else { errEl.textContent = data.message || 'Lỗi lưu quà'; errEl.style.display = 'block'; }
    } catch {
        errEl.textContent = 'Lỗi kết nối server';
        errEl.style.display = 'block';
    }
}

function confirmDeleteGift(id, name) {
    showConfirm('Xóa quà tặng', `Bạn có chắc muốn xóa quà "${name}"?`,
        async () => {
            await fetch(`${API}/api/admin.php?action=delete_gift&id=${id}`, { method: 'DELETE', ...FETCH_OPTS });
            loadGifts(); loadDashboard();
        });
}

async function resetGifts() {
    showConfirm('Reset số lượng quà',
        'Khôi phục toàn bộ số lượng quà về giá trị ban đầu?',
        async () => {
            await fetch(`${API}/api/admin.php?action=reset_gifts`, { method: 'POST', ...FETCH_OPTS });
            loadGifts(); loadDashboard();
        });
}

// ── CONFIRM DIALOG ────────────────────────────────────────────────
function showConfirm(title, message, callback) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    confirmCallback = callback;
    document.getElementById('confirm-modal').style.display = 'flex';
}
function closeConfirm() {
    document.getElementById('confirm-modal').style.display = 'none';
    confirmCallback = null;
}

// ── UTILS ─────────────────────────────────────────────────────────
function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
