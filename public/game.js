/* ══════════════════════════════════════════════════════════════
   VSEATeam Word Search – Game Logic
══════════════════════════════════════════════════════════════ */

// ── ROUND DEFINITIONS ─────────────────────────────────────────────
// display  : từ gốc tiếng Việt (chỉ hiện SAU khi tìm đúng)
// word     : chuỗi không dấu dùng để đặt vào lưới
// clue     : mô tả gợi ý (hiện ngay từ đầu)
// hints[]  : gợi ý thêm lần lượt sau mỗi 60s – KHÔNG chứa đáp án
// difficulty:
//   1 – dễ  : chỉ đặt ngang/dọc, lưới 12x12, nhiễu ít
//   2 – tb  : ngang/dọc/chéo, lưới 14x14
//   3 – khó : mọi hướng + đảo ngược, lưới 15x15, nhiễu chứa chữ của từ
const ROUNDS = [
    {
        clue: 'Tên viết tắt hoặc tên gọi ngắn gọn của Đội',
        display: 'VSEATEAM',
        word: 'VSEATEAM',
        hints: [
            '💬 Gợi ý 1: Gồm 8 chữ cái, bắt đầu bằng chữ V',
            '💬 Gợi ý 2: Chứa cụm "SEA" ở giữa',
            '💬 Gợi ý 3: Kết thúc bằng "TEAM"'
        ],
        difficulty: 1,
        timeLimit: 120
    },
    {
        clue: 'Số năm thành lập và hoạt động của Đội (viết bằng chữ)',
        display: 'MƯỜI SÁU NĂM',
        word: 'MUOISAUNAM',
        hints: [
            '💬 Gợi ý 1: Gồm 10 chữ cái (không dấu)',
            '💬 Gợi ý 2: Đội đã hoạt động hơn 15 năm',
            '💬 Gợi ý 3: Con số nằm giữa 15 và 17'
        ],
        difficulty: 1,
        timeLimit: 120
    },
    {
        clue: 'Khoa mà Đội VSEATeam trực thuộc',
        display: 'KINH TẾ',
        word: 'KINHTE',
        hints: [
            '💬 Gợi ý 1: Gồm 6 chữ cái (không dấu)',
            '💬 Gợi ý 2: Liên quan đến tài chính, thương mại',
            '💬 Gợi ý 3: Bắt đầu bằng chữ K'
        ],
        difficulty: 2,
        timeLimit: 90
    },
    {
        clue: 'Tên hoạt động thiện nguyện của Đội vào dịp Trung thu',
        display: 'TRUNG THU NHÂN ÁI',
        word: 'TRUNGTHUNAHAI',
        hints: [
            '💬 Gợi ý 1: Gồm 13 chữ cái (không dấu)',
            '💬 Gợi ý 2: Tên bắt đầu bằng "TRUNG THU"',
            '💬 Gợi ý 3: Kết thúc bằng 2 chữ mang ý nghĩa yêu thương'
        ],
        difficulty: 2,
        timeLimit: 90
    },
    {
        clue: 'Tên hoạt động thiện nguyện của Đội vào dịp Tết',
        display: 'XUÂN YÊU THƯƠNG',
        word: 'XUANYEUTHUONG',
        hints: [
            '💬 Gợi ý 1: Gồm 13 chữ cái (không dấu)',
            '💬 Gợi ý 2: Bắt đầu bằng mùa đầu tiên trong năm',
            '💬 Gợi ý 3: Chứa cụm "YEUTHUONG" ở nửa sau'
        ],
        difficulty: 3,
        timeLimit: 90
    }
];

// Grid size per difficulty
const GRID_SIZES = { 1: 12, 2: 14, 3: 15 };

// Allowed directions per difficulty
const DIRS_ALL = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const DIRS_EASY = [[0, 1], [1, 0]]; // chỉ ngang + dọc xuôi
const DIRS_MED = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1]]; // ngang dọc + 2 chéo

function getDirs(difficulty) {
    if (difficulty === 1) return DIRS_EASY;
    if (difficulty === 2) return DIRS_MED;
    return DIRS_ALL;
}

// ── STATE ─────────────────────────────────────────────────────────
let state = {
    playerId: null, playerName: '',
    currentRound: 0, score: 0, roundsCompleted: 0,
    startTime: 0,
    timer: null, timeLeft: 0,
    hintTimer: null, hintIndex: 0, hintIntervalSec: 60,
    gifts: [], giftName: '', wonGift: false,
    gridData: [], gridSize: 0,
    selectedCells: [], isDragging: false, foundCells: new Set(),
    wordCells: new Set()
};

// ── UTILS ─────────────────────────────────────────────────────────
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0, 0);
}
function showLoading(v) {
    document.getElementById('loading-overlay').style.display = v ? 'flex' : 'none';
}

// ── GAME STATUS CHECK ─────────────────────────────────────────────
async function checkGameActive() {
    try {
        const res = await fetch('/api/game/status');
        const data = await res.json();
        return data.active;
    } catch { return false; }
}

// ── REGISTRATION ──────────────────────────────────────────────────
async function handleRegister(e) {
    e.preventDefault();
    const fullName = document.getElementById('inp-name').value.trim();
    const email = document.getElementById('inp-email').value.trim();
    const phone = document.getElementById('inp-phone').value.trim();
    const className = document.getElementById('inp-class').value.trim();
    const errEl = document.getElementById('register-error');
    errEl.style.display = 'none';

    document.getElementById('btn-register').disabled = true;
    showLoading(true);

    try {
        const res = await fetch('/api/player/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, email, phone, className })
        });
        const data = await res.json();
        if (data.success) {
            state.playerId = data.playerId;
            state.playerName = fullName;
            state.score = 0; state.roundsCompleted = 0;
            state.currentRound = 0; state.startTime = Date.now();
            showLoading(false);
            if (data.gameActive) {
                // Game đang mở → vào chơi ngay
                startRound(0);
            } else {
                // Game chưa mở → vào màn chờ
                showWaiting();
            }
        } else {
            throw new Error(data.message || 'Đăng ký thất bại');
        }
    } catch (err) {
        showLoading(false);
        errEl.textContent = err.message;
        errEl.style.display = 'block';
        document.getElementById('btn-register').disabled = false;
    }
}

// ── WAITING SCREEN ────────────────────────────────────────────────
let waitingPoll = null;

function showWaiting() {
    document.getElementById('waiting-name').textContent = state.playerName;
    showScreen('screen-waiting');
    // Poll mỗi 3s cho đến khi admin mở game
    waitingPoll = setInterval(async () => {
        const active = await checkGameActive();
        if (active) {
            clearInterval(waitingPoll);
            waitingPoll = null;
            state.startTime = Date.now();
            startRound(0);
        }
    }, 3000);
}

// ── LETTER BOXES (ô số chữ cái) ───────────────────────────────────
// Hiện các ô trống theo số chữ của display (tính theo từng "từ" trong cụm)
function renderLetterBoxes(display, revealed) {
    const container = document.getElementById('letter-boxes');
    // display VD: "MƯỜI SÁU NĂM"  → tách từng chữ cái, khoảng trắng là dấu cách
    const chars = display.split('');
    container.innerHTML = chars.map(ch => {
        if (ch === ' ') return '<span class="lb-space"></span>';
        const show = revealed && revealed.includes(ch.toUpperCase());
        return `<span class="lb-cell">${show ? ch : ''}</span>`;
    }).join('');
}

// ── GRID GENERATION ───────────────────────────────────────────────
function generateGrid(word, difficulty) {
    const size = GRID_SIZES[difficulty] || 15;
    const dirs = getDirs(difficulty);
    const grid = Array.from({ length: size }, () => Array(size).fill(''));
    const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // Filler pool: difficulty 3 → nhiều chữ cái giống từ hơn
    function randomChar() {
        if (difficulty === 3 && Math.random() < 0.35) {
            return word[Math.floor(Math.random() * word.length)];
        }
        return ALPHA[Math.floor(Math.random() * ALPHA.length)];
    }

    const wordCells = [];
    let placed = false, attempts = 0;
    while (!placed && attempts < 300) {
        attempts++;
        const dir = dirs[Math.floor(Math.random() * dirs.length)];
        const [dr, dc] = dir;
        const minR = dr < 0 ? word.length - 1 : 0;
        const minC = dc < 0 ? word.length - 1 : 0;
        const maxR = dr === 0 ? size : (dr > 0 ? size - word.length : word.length - 1);
        const maxC = dc === 0 ? size : (dc > 0 ? size - word.length : word.length - 1);
        if (maxR <= minR || maxC <= minC) continue;

        const startR = Math.floor(Math.random() * (maxR - minR)) + minR;
        const startC = Math.floor(Math.random() * (maxC - minC)) + minC;

        let ok = true;
        for (let i = 0; i < word.length; i++) {
            const r = startR + i * dr, c = startC + i * dc;
            if (r < 0 || r >= size || c < 0 || c >= size) { ok = false; break; }
            if (grid[r][c] !== '' && grid[r][c] !== word[i]) { ok = false; break; }
        }
        if (ok) {
            wordCells.length = 0;
            for (let i = 0; i < word.length; i++) {
                const r = startR + i * dr, c = startC + i * dc;
                grid[r][c] = word[i];
                wordCells.push(`${r},${c}`);
            }
            placed = true;
        }
    }

    for (let r = 0; r < size; r++)
        for (let c = 0; c < size; c++)
            if (grid[r][c] === '') grid[r][c] = randomChar();

    return { grid, wordCells, size };
}

// ── ROUND START ───────────────────────────────────────────────────
function startRound(idx) {
    if (idx >= ROUNDS.length) { endGame(); return; }

    // Clear hint timer from previous round
    clearInterval(state.hintTimer);
    state.hintIndex = 0;

    state.currentRound = idx;
    state.foundCells = new Set();
    state.selectedCells = [];
    state.isDragging = false;

    const round = ROUNDS[idx];
    const { grid, wordCells, size } = generateGrid(round.word, round.difficulty);
    state.gridData = grid;
    state.gridSize = size;
    state.wordCells = new Set(wordCells);

    // HUD
    document.getElementById('round-current').textContent = idx + 1;
    document.getElementById('round-total').textContent = ROUNDS.length;
    document.getElementById('score-display').textContent = state.score;
    document.getElementById('round-clue').textContent = round.clue;
    document.getElementById('round-hint').textContent =
        `📏 Từ gồm ${round.display.replace(/\s/g, '').length} chữ cái`;
    document.getElementById('found-indicator').style.display = 'none';

    // Extra hint vùng (ẩn ban đầu)
    const extraEl = document.getElementById('extra-hint');
    extraEl.style.display = 'none';
    extraEl.textContent = '';

    // Letter boxes
    renderLetterBoxes(round.display, null);

    renderGrid(size);
    startTimer(round.timeLimit);
    startHintTimer(round);
    showScreen('screen-game');
}

// ── HINT TIMER (mỗi 60s hiện 1 gợi ý thêm) ───────────────────────
function startHintTimer(round) {
    clearInterval(state.hintTimer);
    state.hintTimer = setInterval(() => {
        if (state.hintIndex < round.hints.length) {
            const extraEl = document.getElementById('extra-hint');
            extraEl.textContent = round.hints[state.hintIndex];
            extraEl.style.display = 'block';
            // flash animation
            extraEl.classList.remove('hint-flash');
            void extraEl.offsetWidth;
            extraEl.classList.add('hint-flash');
            state.hintIndex++;
        } else {
            clearInterval(state.hintTimer);
        }
    }, state.hintIntervalSec * 1000);
}

// ── RENDER GRID ───────────────────────────────────────────────────
function renderGrid(size) {
    const container = document.getElementById('word-grid');
    container.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    container.innerHTML = '';

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.textContent = state.gridData[r][c];
            cell.dataset.r = r;
            cell.dataset.c = c;
            cell.addEventListener('mousedown', onCellStart);
            cell.addEventListener('mouseover', onCellOver);
            cell.addEventListener('touchstart', onTouchStart, { passive: false });
            cell.addEventListener('touchmove', onTouchMove, { passive: false });
            if (state.foundCells.has(`${r},${c}`)) cell.classList.add('found');
            container.appendChild(cell);
        }
    }
    document.addEventListener('mouseup', onCellEnd);
    document.addEventListener('touchend', onTouchEnd);
}

function getCellEl(r, c) {
    return document.querySelector(`.grid-cell[data-r="${r}"][data-c="${c}"]`);
}

// ── SELECTION ─────────────────────────────────────────────────────
function highlightSelection() {
    document.getElementById('word-grid')
        .querySelectorAll('.grid-cell.active').forEach(el => {
            if (!state.foundCells.has(`${el.dataset.r},${el.dataset.c}`))
                el.classList.remove('active');
        });
    state.selectedCells.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        if (!state.foundCells.has(key)) {
            const el = getCellEl(r, c);
            if (el) el.classList.add('active');
        }
    });
}

function getLineCells(r1, c1, r2, c2) {
    if (r1 === r2 && c1 === c2) return [`${r1},${c1}`];
    const dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1);
    const steps = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1));
    if (dr !== 0 && dc !== 0 && Math.abs(r2 - r1) !== Math.abs(c2 - c1)) {
        return Math.abs(r2 - r1) > Math.abs(c2 - c1)
            ? getLineCells(r1, c1, r2, c1)
            : getLineCells(r1, c1, r1, c2);
    }
    const cells = [];
    for (let i = 0; i <= steps; i++) cells.push(`${r1 + i * dr},${c1 + i * dc}`);
    return cells;
}

let dragStart = null, touchStartCell = null;

function onCellStart(e) {
    state.isDragging = true;
    const r = +e.currentTarget.dataset.r, c = +e.currentTarget.dataset.c;
    dragStart = { r, c };
    state.selectedCells = [`${r},${c}`];
    highlightSelection();
}
function onCellOver(e) {
    if (!state.isDragging || !dragStart) return;
    state.selectedCells = getLineCells(dragStart.r, dragStart.c,
        +e.currentTarget.dataset.r, +e.currentTarget.dataset.c);
    highlightSelection();
}
function onCellEnd() {
    if (!state.isDragging) return;
    state.isDragging = false;
    checkSelection();
    dragStart = null;
}
function onTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!el || !el.classList.contains('grid-cell')) return;
    state.isDragging = true;
    touchStartCell = { r: +el.dataset.r, c: +el.dataset.c };
    state.selectedCells = [`${touchStartCell.r},${touchStartCell.c}`];
    highlightSelection();
}
function onTouchMove(e) {
    e.preventDefault();
    if (!state.isDragging || !touchStartCell) return;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!el || !el.classList.contains('grid-cell')) return;
    state.selectedCells = getLineCells(touchStartCell.r, touchStartCell.c,
        +el.dataset.r, +el.dataset.c);
    highlightSelection();
}
function onTouchEnd() {
    if (!state.isDragging) return;
    state.isDragging = false;
    checkSelection();
    touchStartCell = null;
}

// ── CHECK SELECTION ───────────────────────────────────────────────
function checkSelection() {
    const selected = state.selectedCells.slice();
    const selectedStr = selected.join('|');
    const wordCells = [...state.wordCells];
    const fwd = wordCells.join('|');
    const rev = wordCells.slice().reverse().join('|');

    if (selectedStr === fwd || selectedStr === rev) {
        // ✅ ĐÚNG
        selected.forEach(key => {
            state.foundCells.add(key);
            const [r, c] = key.split(',').map(Number);
            const el = getCellEl(r, c);
            if (el) { el.classList.remove('active'); el.classList.add('found'); }
        });

        clearInterval(state.hintTimer);

        const timeBonus = Math.max(0, Math.floor(state.timeLeft / 5));
        state.score += 100 + timeBonus;
        state.roundsCompleted++;
        document.getElementById('score-display').textContent = state.score;

        const round = ROUNDS[state.currentRound];
        // Hiện đầy đủ chữ trong ô letter boxes khi đúng
        renderLetterBoxes(round.display, round.display.replace(/\s/g, '').toUpperCase().split(''));

        document.getElementById('found-word').textContent = round.display;
        document.getElementById('found-indicator').style.display = 'block';

        clearInterval(state.timer);
        state.selectedCells = [];
        setTimeout(() => nextRound(true), 1600);
    } else {
        // ❌ SAI – flash đỏ
        selected.forEach(key => {
            const [r, c] = key.split(',').map(Number);
            const el = getCellEl(r, c);
            if (el && !state.foundCells.has(key)) el.classList.add('wrong');
        });
        setTimeout(() => {
            selected.forEach(key => {
                const [r, c] = key.split(',').map(Number);
                const el = getCellEl(r, c);
                if (el && !state.foundCells.has(key)) el.classList.remove('active', 'wrong');
            });
        }, 500);
        state.selectedCells = [];
    }
}

// ── TIMER ──────────────────────────────────────────────────────────
function startTimer(seconds) {
    clearInterval(state.timer);
    state.timeLeft = seconds;
    updateTimerUI();
    state.timer = setInterval(() => {
        state.timeLeft--;
        updateTimerUI();
        if (state.timeLeft <= 0) {
            clearInterval(state.timer);
            clearInterval(state.hintTimer);
            // Hết giờ: hiện đáp án trong ô rồi chuyển vòng
            const round = ROUNDS[state.currentRound];
            renderLetterBoxes(round.display, round.display.replace(/\s/g, '').toUpperCase().split(''));
            setTimeout(() => nextRound(false), 1200);
        }
    }, 1000);
}

function updateTimerUI() {
    const round = ROUNDS[state.currentRound];
    const pct = (state.timeLeft / round.timeLimit) * 100;
    document.getElementById('timer-display').textContent = state.timeLeft;
    document.getElementById('timer-fill').style.width = pct + '%';
}

// ── NEXT ROUND ────────────────────────────────────────────────────
function nextRound(succeeded) {
    clearInterval(state.timer);
    clearInterval(state.hintTimer);
    const next = state.currentRound + 1;

    if (next >= ROUNDS.length) { endGame(); return; }

    const overlay = document.createElement('div');
    overlay.className = 'round-transition';
    const nextR = ROUNDS[next];
    overlay.innerHTML = `
    <div class="round-transition-card">
      <h3>${succeeded ? '✅' : '⏰'} Vòng ${state.currentRound + 1}
        ${succeeded ? 'hoàn thành!' : '– Hết giờ!'}</h3>
      <p>Chuẩn bị cho vòng tiếp theo</p>
      <div class="next-word">Vòng ${next + 1} / ${ROUNDS.length}</div>
      <p style="color:#5f6368;font-size:13px;margin-top:6px">${nextR.clue}</p>
      <div class="diff-badge diff-${nextR.difficulty}">
        ${nextR.difficulty === 1 ? '⭐ Dễ' : nextR.difficulty === 2 ? '⭐⭐ Trung bình' : '⭐⭐⭐ Khó'}
      </div>
    </div>`;
    document.body.appendChild(overlay);
    setTimeout(() => { overlay.remove(); startRound(next); }, 2200);
}

// ── END GAME ──────────────────────────────────────────────────────
async function endGame() {
    clearInterval(state.timer);
    clearInterval(state.hintTimer);
    const timeUsed = Math.floor((Date.now() - state.startTime) / 1000);
    showLoading(true);
    try {
        const res = await fetch('/api/game/result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerId: state.playerId, score: state.score,
                timeUsed, roundsCompleted: state.roundsCompleted
            })
        });
        const data = await res.json();
        state.giftName = data.giftName;
        state.wonGift = data.wonGift;
    } catch {
        state.giftName = 'Chúc mừng bạn đã tham gia!';
        state.wonGift = false;
    }
    showLoading(false);
    document.getElementById('spin-score').textContent = state.score;
    document.getElementById('spin-rounds').textContent = state.roundsCompleted;
    await loadGiftsAndDrawWheel();
    showScreen('screen-spin');
}

// ── SPIN WHEEL ────────────────────────────────────────────────────
const WHEEL_COLORS = [
    '#1a73e8', '#f5a623', '#34a853', '#ea4335',
    '#9c27b0', '#00bcd4', '#ff5722', '#607d8b', '#e91e63', '#4caf50'
];

async function loadGiftsAndDrawWheel() {
    try {
        const res = await fetch('/api/gifts/public');
        const data = await res.json();
        state.gifts = data.gifts && data.gifts.length > 0
            ? data.gifts : [{ name: 'Chúc mừng!', probability: 100 }];
    } catch {
        state.gifts = [
            { name: 'Sticker VSEATeam', probability: 30 },
            { name: 'Bookmark xinh', probability: 25 },
            { name: 'Kẹo ngọt', probability: 25 },
            { name: 'Voucher 50k', probability: 15 },
            { name: 'Quà đặc biệt', probability: 5 }
        ];
    }
    const totalPct = state.gifts.reduce((s, g) => s + g.probability, 0);
    if (totalPct < 100)
        state.gifts.push({ name: 'Chúc mừng tham gia!', probability: 100 - totalPct });
    drawWheel(0);
}

function drawWheel(rotation) {
    const canvas = document.getElementById('spin-canvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2, r = W / 2 - 8;
    ctx.clearRect(0, 0, W, H);
    const total = state.gifts.reduce((s, g) => s + g.probability, 0);
    let startAngle = rotation;
    state.gifts.forEach((gift, i) => {
        const slice = (gift.probability / total) * 2 * Math.PI;
        const endAngle = startAngle + slice;
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, startAngle, endAngle); ctx.closePath();
        ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length]; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(startAngle + slice / 2);
        ctx.textAlign = 'right'; ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.min(13, 300 / state.gifts.length)}px sans-serif`;
        ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 2;
        ctx.fillText(gift.name.length > 14 ? gift.name.substring(0, 13) + '…' : gift.name, r - 10, 5);
        ctx.restore();
        startAngle = endAngle;
    });
    ctx.beginPath(); ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 2; ctx.stroke();
}

let isSpinning = false;

function spinWheel() {
    if (isSpinning) return;
    isSpinning = true;
    document.getElementById('btn-spin').disabled = true;
    document.getElementById('spin-result').style.display = 'none';

    const totalSpins = 5 + Math.random() * 5;
    const duration = 4000;
    const startTime = performance.now();
    const total = state.gifts.reduce((s, g) => s + g.probability, 0);
    let giftIndex = state.gifts.findIndex(g => g.name === state.giftName);
    if (giftIndex === -1) giftIndex = state.gifts.length - 1;
    let cum = 0, targetOffset = 0;
    for (let i = 0; i <= giftIndex; i++) {
        const slice = (state.gifts[i].probability / total) * 2 * Math.PI;
        if (i === giftIndex) targetOffset = cum + slice / 2;
        cum += slice;
    }
    const targetRotation = totalSpins * 2 * Math.PI - targetOffset - Math.PI / 2;
    function easeOut(t) { return 1 - Math.pow(1 - t, 4); }
    function animate(now) {
        const p = Math.min((now - startTime) / duration, 1);
        drawWheel(easeOut(p) * targetRotation);
        if (p < 1) requestAnimationFrame(animate);
        else { isSpinning = false; showSpinResult(); }
    }
    requestAnimationFrame(animate);
}

function showSpinResult() {
    document.getElementById('spin-gift-icon').textContent = state.wonGift ? '🎁' : '🌟';
    document.getElementById('spin-gift-name').textContent = state.giftName;
    document.getElementById('spin-result').style.display = 'block';
    setTimeout(() => goToFinish(), 2500);
}

// ── FINISH ────────────────────────────────────────────────────────
function goToFinish() {
    document.getElementById('finish-name').textContent = `Xin chào, ${state.playerName}!`;
    document.getElementById('finish-score').textContent = state.score;
    document.getElementById('finish-rounds').textContent = `${state.roundsCompleted}/${ROUNDS.length}`;
    document.getElementById('finish-gift-name').textContent = state.giftName;
    launchConfetti();
    showScreen('screen-finish');
}

function launchConfetti() {
    const area = document.getElementById('confetti-area');
    area.innerHTML = '';
    const colors = ['#1a73e8', '#f5a623', '#34a853', '#ea4335', '#9c27b0', '#fff'];
    for (let i = 0; i < 60; i++) {
        const p = document.createElement('div');
        p.className = 'confetti-piece';
        p.style.left = Math.random() * 100 + '%';
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        p.style.width = (6 + Math.random() * 8) + 'px';
        p.style.height = (6 + Math.random() * 8) + 'px';
        p.style.animationDuration = (2 + Math.random() * 3) + 's';
        p.style.animationDelay = (Math.random() * 2) + 's';
        area.appendChild(p);
    }
}

function restartGame() {
    clearInterval(state.timer);
    clearInterval(state.hintTimer);
    if (waitingPoll) { clearInterval(waitingPoll); waitingPoll = null; }
    state = {
        playerId: null, playerName: '', currentRound: 0, score: 0,
        roundsCompleted: 0, startTime: 0, timer: null, timeLeft: 0,
        hintTimer: null, hintIndex: 0, hintIntervalSec: 60,
        gifts: [], giftName: '', wonGift: false,
        gridData: [], gridSize: 0, selectedCells: [],
        isDragging: false, foundCells: new Set(), wordCells: new Set()
    };
    document.getElementById('registerForm').reset();
    document.getElementById('register-error').style.display = 'none';
    document.getElementById('btn-register').disabled = false;
    showScreen('screen-register');
}

// ── INIT ──────────────────────────────────────────────────────────
// Intro luôn hiện, không khoá nút — người chơi tự vào form
// Việc chờ admin xảy ra SAU khi đã điền form xong
window.addEventListener('DOMContentLoaded', () => {
    // Không cần làm gì thêm, luồng đã xử lý qua handleRegister
});
