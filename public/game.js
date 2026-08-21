/* ══════════════════════════════════════════════════════════════
   VSEATeam Block Word – Game Logic
   Mechanic: Kéo/đặt hình khối chữ vào đúng vị trí trên lưới 11x11
══════════════════════════════════════════════════════════════ */

const GRID_SIZE = 11;

// ── ROUND DEFINITIONS ─────────────────────────────────────────────
// pieces: mỗi piece là { label, cells: [[r,c],...] } — tọa độ tương đối
// targetWord: chữ hiển thị trên lưới (không dấu, uppercase)
// placement: vị trí đặt từng piece trên lưới [[anchorR, anchorC], ...]
const ROUNDS = [
    {
        clue: 'Tên viết tắt hoặc tên gọi ngắn gọn của Đội',
        display: 'VSEATEAM',
        timeLimit: 120,
        hints: ['💬 Gồm 8 chữ cái, bắt đầu bằng V', '💬 Chứa "SEA" ở giữa', '💬 Kết thúc bằng "TEAM"'],
        pieces: [
            // 1 hình thẳng ngang 8 ô
            {
                label: 'VSEATEAM', letters: ['V', 'S', 'E', 'A', 'T', 'E', 'A', 'M'],
                cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7]]
            }
        ],
        // vị trí đặt đúng trên lưới (anchor = ô đầu tiên)
        targets: [{ r: 5, c: 1 }]
    },
    {
        clue: 'Khoa mà Đội VSEATeam trực thuộc',
        display: 'KINH TẾ',
        timeLimit: 90,
        hints: ['💬 Gồm 6 chữ (bỏ dấu)', '💬 Liên quan tài chính', '💬 Bắt đầu bằng K'],
        pieces: [
            // KINHTE — hình chữ L: KINH dọc 4 ô, TE ngang từ cuối
            {
                label: 'KINH TẾ', letters: ['K', 'I', 'N', 'H', 'T', 'E'],
                cells: [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [3, 2]]
            }
        ],
        targets: [{ r: 3, c: 4 }]
    },
    {
        clue: 'Số năm thành lập và hoạt động của Đội (viết bằng chữ)',
        display: 'MƯỜI SÁU NĂM',
        timeLimit: 120,
        hints: ['💬 Gồm 10 chữ (bỏ dấu)', '💬 Hơn 15 năm', '💬 Giữa 15 và 17'],
        pieces: [
            // MUOI — thẳng ngang 4
            {
                label: 'MƯỜI', letters: ['M', 'U', 'O', 'I'],
                cells: [[0, 0], [0, 1], [0, 2], [0, 3]]
            },
            // SAU — thẳng dọc 3
            {
                label: 'SÁU', letters: ['S', 'A', 'U'],
                cells: [[0, 0], [1, 0], [2, 0]]
            },
            // NAM — chéo 3 ô (↘)
            {
                label: 'NĂM', letters: ['N', 'A', 'M'],
                cells: [[0, 0], [1, 1], [2, 2]]
            }
        ],
        targets: [{ r: 1, c: 1 }, { r: 1, c: 6 }, { r: 4, c: 1 }]
    },
    {
        clue: 'Tên hoạt động thiện nguyện của Đội vào dịp Trung thu',
        display: 'TRUNG THU NHÂN ÁI',
        timeLimit: 90,
        hints: ['💬 13 chữ (bỏ dấu)', '💬 Bắt đầu "TRUNG THU"', '💬 Kết thúc mang ý nghĩa yêu thương'],
        pieces: [
            // TRUNGTH — thẳng ngang 7
            {
                label: 'TRUNG THU', letters: ['T', 'R', 'U', 'N', 'G', 'T', 'H', 'U'],
                cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7]]
            },
            // NHANAI — chữ L ngược: NHAN dọc 4, AI ngang
            {
                label: 'NHÂN ÁI', letters: ['N', 'H', 'A', 'N', 'A', 'I'],
                cells: [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [3, 2]]
            }
        ],
        targets: [{ r: 2, c: 1 }, { r: 4, c: 5 }]
    },
    {
        clue: 'Tên hoạt động thiện nguyện của Đội vào dịp Tết',
        display: 'XUÂN YÊU THƯƠNG',
        timeLimit: 90,
        hints: ['💬 13 chữ (bỏ dấu)', '💬 Bắt đầu bằng mùa đầu năm', '💬 Chứa "YEUTHUONG"'],
        pieces: [
            // XUAN — thẳng dọc 4
            {
                label: 'XUÂN', letters: ['X', 'U', 'A', 'N'],
                cells: [[0, 0], [1, 0], [2, 0], [3, 0]]
            },
            // YEU — chéo ↘ 3
            {
                label: 'YÊU', letters: ['Y', 'E', 'U'],
                cells: [[0, 0], [1, 1], [2, 2]]
            },
            // THUONG — chữ L: THU ngang 3, ONG dọc 3 từ cuối
            {
                label: 'THƯƠNG', letters: ['T', 'H', 'U', 'O', 'N', 'G'],
                cells: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [3, 2]]
            }
        ],
        targets: [{ r: 1, c: 1 }, { r: 2, c: 4 }, { r: 4, c: 6 }]
    }
];

// ── STATE ─────────────────────────────────────────────────────────
let state = {
    playerId: null, playerName: '',
    currentRound: 0, score: 0, roundsCompleted: 0,
    startTime: 0, timer: null, timeLeft: 0,
    hintTimer: null, hintIndex: 0,
    gifts: [], giftName: '', wonGift: false,

    // grid state
    grid: [],           // 11x11, mỗi ô {letter, pieceIdx, placed}
    pieces: [],         // danh sách piece của vòng hiện tại
    rotations: [],      // số lần xoay của từng piece
    placed: [],         // piece nào đã đặt đúng

    // drag state
    dragging: null,     // {pieceIdx, offsetR, offsetC}
    previewCells: [],   // ô đang preview khi kéo
    previewValid: false,

    waitingPoll: null
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

// ── ROTATE CELLS 90° CW ──────────────────────────────────────────
function rotateCells(cells) {
    // (r,c) → (c, -r) rồi normalize
    const rotated = cells.map(([r, c]) => [c, -r]);
    const minR = Math.min(...rotated.map(([r]) => r));
    const minC = Math.min(...rotated.map(([, c]) => c));
    return rotated.map(([r, c]) => [r - minR, c - minC]);
}

function getRotatedCells(pieceIdx) {
    let cells = [...state.pieces[pieceIdx].cells.map(c => [...c])];
    const times = state.rotations[pieceIdx] % 4;
    for (let i = 0; i < times; i++) cells = rotateCells(cells);
    return cells;
}

// ── GAME STATUS CHECK ─────────────────────────────────────────────
async function checkGameActive() {
    try {
        const res = await fetch('/api/game.php?action=status');
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
        const res = await fetch('/api/game.php?action=register', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ fullName, email, phone, className })
        });
        const data = await res.json();
        if (data.success) {
            state.playerId = data.playerId;
            state.playerName = fullName;
            state.score = 0; state.roundsCompleted = 0;
            state.currentRound = 0; state.startTime = Date.now();
            showLoading(false);
            if (data.gameActive) startRound(0);
            else showWaiting();
        } else throw new Error(data.message || 'Đăng ký thất bại');
    } catch (err) {
        showLoading(false);
        errEl.textContent = err.message; errEl.style.display = 'block';
        document.getElementById('btn-register').disabled = false;
    }
}

// ── WAITING ───────────────────────────────────────────────────────
function showWaiting() {
    document.getElementById('waiting-name').textContent = state.playerName;
    showScreen('screen-waiting');
    state.waitingPoll = setInterval(async () => {
        const active = await checkGameActive();
        if (active) {
            clearInterval(state.waitingPoll); state.waitingPoll = null;
            state.startTime = Date.now();
            startRound(0);
        }
    }, 3000);
}

// ── INIT ROUND ────────────────────────────────────────────────────
function startRound(idx) {
    if (idx >= ROUNDS.length) { endGame(); return; }
    clearInterval(state.timer); clearInterval(state.hintTimer);
    state.currentRound = idx;
    state.hintIndex = 0;
    state.placed = [];

    const round = ROUNDS[idx];

    // Build pieces với rotation=0
    state.pieces = round.pieces.map(p => ({ ...p, cells: p.cells.map(c => [...c]) }));
    state.rotations = round.pieces.map(() => 0);

    // Build grid 11x11
    state.grid = Array.from({ length: GRID_SIZE }, () =>
        Array.from({ length: GRID_SIZE }, () => ({ letter: '', pieceIdx: -1, correct: false }))
    );

    // Đặt target letters lên grid (hint cells)
    round.pieces.forEach((piece, pi) => {
        const anchor = round.targets[pi];
        piece.cells.forEach(([dr, dc], li) => {
            const r = anchor.r + dr, c = anchor.c + dc;
            if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
                state.grid[r][c].letter = piece.letters[li];
                state.grid[r][c].pieceIdx = pi;
            }
        });
    });

    // HUD
    document.getElementById('round-current').textContent = idx + 1;
    document.getElementById('round-total').textContent = ROUNDS.length;
    document.getElementById('score-display').textContent = state.score;
    document.getElementById('round-clue').textContent = round.clue;
    document.getElementById('round-display').textContent = round.display;
    document.getElementById('found-indicator').style.display = 'none';

    const extraEl = document.getElementById('extra-hint');
    extraEl.style.display = 'none'; extraEl.textContent = '';

    renderGrid();
    renderPieces();
    startTimer(round.timeLimit);
    startHintTimer(round);
    showScreen('screen-game');
}

// ── RENDER GRID ───────────────────────────────────────────────────
function renderGrid() {
    const container = document.getElementById('word-grid');
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;

    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.createElement('div');
            const gCell = state.grid[r][c];
            cell.className = 'grid-cell';
            cell.dataset.r = r; cell.dataset.c = c;

            if (gCell.letter) {
                cell.classList.add('target-cell');
                cell.textContent = gCell.letter;
                if (gCell.correct) cell.classList.add('correct-cell');
            }

            // Drop events
            cell.addEventListener('dragover', e => { e.preventDefault(); onDragOver(r, c); });
            cell.addEventListener('dragleave', () => clearPreview());
            cell.addEventListener('drop', e => { e.preventDefault(); onDrop(r, c); });

            // Touch
            cell.addEventListener('touchmove', onTouchMoveGrid, { passive: false });
            cell.addEventListener('touchend', onTouchEndGrid);

            container.appendChild(cell);
        }
    }
}

// ── RENDER PIECES ─────────────────────────────────────────────────
function renderPieces() {
    const container = document.getElementById('pieces-tray');
    container.innerHTML = '';

    state.pieces.forEach((piece, pi) => {
        if (state.placed.includes(pi)) return; // đã đặt xong

        const cells = getRotatedCells(pi);
        const maxR = Math.max(...cells.map(([r]) => r));
        const maxC = Math.max(...cells.map(([, c]) => c));
        const CELL_PX = 32;

        const wrap = document.createElement('div');
        wrap.className = 'piece-wrap';
        wrap.title = 'Click để xoay • Kéo vào lưới';

        const board = document.createElement('div');
        board.className = 'piece-board';
        board.style.width = `${(maxC + 1) * CELL_PX + maxC * 2}px`;
        board.style.height = `${(maxR + 1) * CELL_PX + maxR * 2}px`;
        board.style.position = 'relative';

        cells.forEach(([r, c], li) => {
            const cell = document.createElement('div');
            cell.className = 'piece-cell';
            cell.textContent = piece.letters[li];
            cell.style.left = `${c * (CELL_PX + 2)}px`;
            cell.style.top = `${r * (CELL_PX + 2)}px`;
            board.appendChild(cell);
        });

        // Label
        const lbl = document.createElement('div');
        lbl.className = 'piece-label';
        lbl.textContent = piece.label;

        wrap.appendChild(board);
        wrap.appendChild(lbl);

        // Click to rotate
        wrap.addEventListener('click', () => rotatePiece(pi));

        // Drag
        wrap.draggable = true;
        wrap.addEventListener('dragstart', e => onDragStart(e, pi));

        // Touch drag
        wrap.addEventListener('touchstart', e => onTouchStartPiece(e, pi), { passive: false });

        container.appendChild(wrap);
    });

    // Thông báo nếu hết piece
    if (state.placed.length === state.pieces.length) {
        container.innerHTML = '<div class="all-placed">✅ Tất cả đã đặt đúng!</div>';
    }
}

// ── ROTATE PIECE ──────────────────────────────────────────────────
function rotatePiece(pi) {
    state.rotations[pi] = (state.rotations[pi] + 1) % 4;
    renderPieces();
}

// ── DRAG & DROP (Desktop) ─────────────────────────────────────────
let dragPieceIdx = -1;

function onDragStart(e, pi) {
    dragPieceIdx = pi;
    e.dataTransfer.effectAllowed = 'move';
}

function onDragOver(r, c) {
    if (dragPieceIdx < 0) return;
    showPreview(dragPieceIdx, r, c);
}

function onDrop(r, c) {
    if (dragPieceIdx < 0) return;
    tryPlace(dragPieceIdx, r, c);
    clearPreview();
    dragPieceIdx = -1;
}

// ── TOUCH DRAG (Mobile) ───────────────────────────────────────────
let touchPieceIdx = -1;
let touchFloater = null;

function onTouchStartPiece(e, pi) {
    e.preventDefault();
    touchPieceIdx = pi;
    const touch = e.touches[0];

    // Tạo floater theo ngón tay
    touchFloater = document.createElement('div');
    touchFloater.className = 'touch-floater';
    const cells = getRotatedCells(pi);
    const CELL_PX = 28;
    cells.forEach(([r, c], li) => {
        const cell = document.createElement('div');
        cell.className = 'piece-cell floater-cell';
        cell.textContent = state.pieces[pi].letters[li];
        cell.style.position = 'absolute';
        cell.style.left = `${c * (CELL_PX + 2)}px`;
        cell.style.top = `${r * (CELL_PX + 2)}px`;
        cell.style.width = `${CELL_PX}px`;
        cell.style.height = `${CELL_PX}px`;
        cell.style.fontSize = '10px';
        touchFloater.appendChild(cell);
    });
    const maxR = Math.max(...cells.map(([r]) => r));
    const maxC = Math.max(...cells.map(([, c]) => c));
    touchFloater.style.width = `${(maxC + 1) * (CELL_PX + 2)}px`;
    touchFloater.style.height = `${(maxR + 1) * (CELL_PX + 2)}px`;
    touchFloater.style.left = `${touch.clientX - 20}px`;
    touchFloater.style.top = `${touch.clientY - 20}px`;
    document.body.appendChild(touchFloater);
}

function onTouchMoveGrid(e) {
    e.preventDefault();
    if (touchPieceIdx < 0 || !touchFloater) return;
    const touch = e.touches[0];
    touchFloater.style.left = `${touch.clientX - 20}px`;
    touchFloater.style.top = `${touch.clientY - 20}px`;

    // Tìm ô grid dưới ngón tay
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (el && el.classList.contains('grid-cell')) {
        const r = +el.dataset.r, c = +el.dataset.c;
        showPreview(touchPieceIdx, r, c);
    }
}

function onTouchEndGrid(e) {
    if (touchPieceIdx < 0) return;
    const touch = e.changedTouches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (el && el.classList.contains('grid-cell')) {
        const r = +el.dataset.r, c = +el.dataset.c;
        tryPlace(touchPieceIdx, r, c);
    }
    clearPreview();
    if (touchFloater) { touchFloater.remove(); touchFloater = null; }
    touchPieceIdx = -1;
}

// ── PREVIEW ───────────────────────────────────────────────────────
function showPreview(pi, anchorR, anchorC) {
    clearPreview();
    const cells = getRotatedCells(pi);
    const round = ROUNDS[state.currentRound];
    const target = round.targets[pi];

    // Kiểm tra có khớp target không
    const valid = cells.every(([dr, dc], li) => {
        const r = anchorR + dr, c = anchorC + dc;
        const tr = target.r + round.pieces[pi].cells[0][0]; // sẽ tính lại
        return r === target.r + round.pieces[pi].cells[li][0] &&
            c === target.c + round.pieces[pi].cells[li][1];
    });

    // Tô preview lên grid
    cells.forEach(([dr, dc]) => {
        const r = anchorR + dr, c = anchorC + dc;
        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return;
        const el = document.querySelector(`.grid-cell[data-r="${r}"][data-c="${c}"]`);
        if (el) el.classList.add(valid ? 'preview-valid' : 'preview-invalid');
    });
    state.previewCells = cells.map(([dr, dc]) => [anchorR + dr, anchorC + dc]);
    state.previewValid = valid;
}

function clearPreview() {
    document.querySelectorAll('.preview-valid, .preview-invalid')
        .forEach(el => el.classList.remove('preview-valid', 'preview-invalid'));
    state.previewCells = [];
}

// ── TRY PLACE ─────────────────────────────────────────────────────
function tryPlace(pi, anchorR, anchorC) {
    if (state.placed.includes(pi)) return;

    const cells = getRotatedCells(pi);
    const round = ROUNDS[state.currentRound];
    const target = round.targets[pi];
    const piece = round.pieces[pi];

    // Tính tọa độ target với rotation hiện tại
    let targetCells = piece.cells.map(c => [...c]);
    const times = state.rotations[pi] % 4;
    for (let i = 0; i < times; i++) targetCells = rotateCells(targetCells);

    // Kiểm tra anchor có khớp với target không
    const correct = cells.every(([dr, dc], li) => {
        return (anchorR + dr) === (target.r + targetCells[li][0]) &&
            (anchorC + dc) === (target.c + targetCells[li][1]);
    });

    if (correct) {
        // Đặt đúng → mark correct
        cells.forEach(([dr, dc]) => {
            const r = anchorR + dr, c = anchorC + dc;
            if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
                state.grid[r][c].correct = true;
            }
        });
        state.placed.push(pi);

        // Hiệu ứng
        cells.forEach(([dr, dc]) => {
            const el = document.querySelector(`.grid-cell[data-r="${anchorR + dr}"][data-c="${anchorC + dc}"]`);
            if (el) { el.classList.add('correct-cell'); el.classList.remove('target-cell'); }
        });

        // Điểm
        const timeBonus = Math.max(0, Math.floor(state.timeLeft / 5));
        state.score += 50 + timeBonus;
        document.getElementById('score-display').textContent = state.score;

        renderPieces();

        // Kiểm tra thắng vòng
        if (state.placed.length === state.pieces.length) {
            state.roundsCompleted++;
            document.getElementById('found-indicator').style.display = 'block';
            document.getElementById('found-word').textContent = round.display;
            clearInterval(state.timer); clearInterval(state.hintTimer);
            setTimeout(() => nextRound(true), 1800);
        }
    } else {
        // Đặt sai → flash đỏ
        cells.forEach(([dr, dc]) => {
            const r = anchorR + dr, c = anchorC + dc;
            const el = document.querySelector(`.grid-cell[data-r="${r}"][data-c="${c}"]`);
            if (el) { el.classList.add('wrong'); setTimeout(() => el.classList.remove('wrong'), 500); }
        });
    }
}

// ── HINT TIMER ────────────────────────────────────────────────────
function startHintTimer(round) {
    clearInterval(state.hintTimer);
    state.hintTimer = setInterval(() => {
        if (state.hintIndex < round.hints.length) {
            const extraEl = document.getElementById('extra-hint');
            extraEl.textContent = round.hints[state.hintIndex];
            extraEl.style.display = 'block';
            extraEl.classList.remove('hint-flash'); void extraEl.offsetWidth;
            extraEl.classList.add('hint-flash');
            state.hintIndex++;
        } else clearInterval(state.hintTimer);
    }, 45000); // 45s mỗi gợi ý
}

// ── TIMER ─────────────────────────────────────────────────────────
function startTimer(seconds) {
    clearInterval(state.timer);
    state.timeLeft = seconds;
    updateTimerUI();
    state.timer = setInterval(() => {
        state.timeLeft--;
        updateTimerUI();
        if (state.timeLeft <= 0) {
            clearInterval(state.timer); clearInterval(state.hintTimer);
            setTimeout(() => nextRound(false), 1000);
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
    clearInterval(state.timer); clearInterval(state.hintTimer);
    const next = state.currentRound + 1;
    if (next >= ROUNDS.length) { endGame(); return; }

    const overlay = document.createElement('div');
    overlay.className = 'round-transition';
    const nextR = ROUNDS[next];
    overlay.innerHTML = `
    <div class="round-transition-card">
      <h3>${succeeded ? '✅' : '⏰'} Vòng ${state.currentRound + 1} ${succeeded ? 'hoàn thành!' : '– Hết giờ!'}</h3>
      <p>Chuẩn bị vòng tiếp theo</p>
      <div class="next-word">Vòng ${next + 1} / ${ROUNDS.length}</div>
      <p style="color:#5f6368;font-size:13px;margin-top:6px">${nextR.clue}</p>
    </div>`;
    document.body.appendChild(overlay);
    setTimeout(() => { overlay.remove(); startRound(next); }, 2200);
}

// ── END GAME ──────────────────────────────────────────────────────
async function endGame() {
    clearInterval(state.timer); clearInterval(state.hintTimer);
    const timeUsed = Math.floor((Date.now() - state.startTime) / 1000);
    showLoading(true);
    try {
        const res = await fetch('/api/game.php?action=result', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ playerId: state.playerId, score: state.score, timeUsed, roundsCompleted: state.roundsCompleted })
        });
        const data = await res.json();
        state.giftName = data.giftName; state.wonGift = data.wonGift;
    } catch { state.giftName = 'Chúc mừng bạn đã tham gia!'; state.wonGift = false; }
    showLoading(false);
    document.getElementById('spin-score').textContent = state.score;
    document.getElementById('spin-rounds').textContent = state.roundsCompleted;
    await loadGiftsAndDrawWheel();
    showScreen('screen-spin');
}

// ── SPIN WHEEL ────────────────────────────────────────────────────
const WHEEL_COLORS = ['#1a73e8', '#f5a623', '#34a853', '#ea4335', '#9c27b0', '#00bcd4', '#ff5722', '#607d8b', '#e91e63', '#4caf50'];

async function loadGiftsAndDrawWheel() {
    try {
        const res = await fetch('/api/game.php?action=gifts_public', { credentials: 'include' });
        const data = await res.json();
        state.gifts = data.gifts && data.gifts.length > 0 ? data.gifts : [{ name: 'Chúc mừng!', probability: 100 }];
    } catch {
        state.gifts = [{ name: 'Sticker VSEATeam', probability: 30 }, { name: 'Bookmark xinh', probability: 25 },
        { name: 'Kẹo ngọt', probability: 25 }, { name: 'Voucher 50k', probability: 15 }, { name: 'Quà đặc biệt', probability: 5 }];
    }
    const totalPct = state.gifts.reduce((s, g) => s + g.probability, 0);
    if (totalPct < 100) state.gifts.push({ name: 'Chúc mừng tham gia!', probability: 100 - totalPct });
    drawWheel(0);
}

function drawWheel(rotation) {
    const canvas = document.getElementById('spin-canvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2, r = W / 2 - 8;
    ctx.clearRect(0, 0, W, H);
    const total = state.gifts.reduce((s, g) => s + g.probability, 0);
    let startAngle = rotation;
    state.gifts.forEach((gift, i) => {
        const slice = (gift.probability / total) * 2 * Math.PI;
        const end = startAngle + slice;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, startAngle, end); ctx.closePath();
        ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length]; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(startAngle + slice / 2);
        ctx.textAlign = 'right'; ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.min(13, 300 / state.gifts.length)}px sans-serif`;
        ctx.fillText(gift.name.length > 14 ? gift.name.substring(0, 13) + '…' : gift.name, r - 10, 5);
        ctx.restore();
        startAngle = end;
    });
    ctx.beginPath(); ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 2; ctx.stroke();
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
    if (giftIndex < 0) giftIndex = state.gifts.length - 1;
    let cum = 0, targetOffset = 0;
    for (let i = 0; i <= giftIndex; i++) {
        const slice = (state.gifts[i].probability / total) * 2 * Math.PI;
        if (i === giftIndex) targetOffset = cum + slice / 2;
        cum += slice;
    }
    const targetRotation = totalSpins * 2 * Math.PI - targetOffset - Math.PI / 2;
    const easeOut = t => 1 - Math.pow(1 - t, 4);
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
    clearInterval(state.timer); clearInterval(state.hintTimer);
    if (state.waitingPoll) { clearInterval(state.waitingPoll); state.waitingPoll = null; }
    state = {
        playerId: null, playerName: '', currentRound: 0, score: 0,
        roundsCompleted: 0, startTime: 0, timer: null, timeLeft: 0,
        hintTimer: null, hintIndex: 0, gifts: [], giftName: '', wonGift: false,
        grid: [], pieces: [], rotations: [], placed: [],
        dragging: null, previewCells: [], previewValid: false, waitingPoll: null
    };
    document.getElementById('registerForm').reset();
    document.getElementById('register-error').style.display = 'none';
    document.getElementById('btn-register').disabled = false;
    showScreen('screen-register');
}

window.addEventListener('DOMContentLoaded', () => { });
