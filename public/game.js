/* ══════════════════════════════════════════════════════════════
   VSEATeam Block Word – Game Logic v3
   Mechanic:
   - Lưới 11x11 có chữ ngẫu nhiên (từ ẩn bên trong)
   - Hình khối bên dưới = shape của từ, chữ bị xáo trộn
   - Kéo hình vào lưới → so khớp tất cả ô → xanh / đỏ
   - Không highlight trước vị trí đúng
══════════════════════════════════════════════════════════════ */

const GRID_SIZE = 11;

// ── ROUND DEFINITIONS ─────────────────────────────────────────────
const ROUNDS = [
    {
        clue: 'Tên viết tắt hoặc tên gọi ngắn gọn của Đội',
        display: 'VSEATEAM',
        timeLimit: 120,
        hints: ['💬 Gồm 8 chữ cái, bắt đầu bằng V', '💬 Chứa "SEA" ở giữa', '💬 Kết thúc bằng "TEAM"'],
        words: [
            { letters: ['V', 'S', 'E', 'A', 'T', 'E', 'A', 'M'], shape: 'line' }
        ]
    },
    {
        clue: 'Khoa mà Đội VSEATeam trực thuộc',
        display: 'KINH TẾ',
        timeLimit: 90,
        hints: ['💬 Gồm 6 chữ (bỏ dấu)', '💬 Liên quan tài chính', '💬 Bắt đầu bằng K'],
        words: [
            { letters: ['K', 'I', 'N', 'H', 'T', 'E'], shape: 'L' }
        ]
    },
    {
        clue: 'Số năm thành lập và hoạt động của Đội (viết bằng chữ)',
        display: 'MƯỜI SÁU NĂM',
        timeLimit: 120,
        hints: ['💬 Gồm 10 chữ (bỏ dấu)', '💬 Hơn 15 năm', '💬 Giữa 15 và 17'],
        words: [
            { letters: ['M', 'U', 'O', 'I'], shape: 'line' },
            { letters: ['S', 'A', 'U'], shape: 'line' },
            { letters: ['N', 'A', 'M'], shape: 'diag' }
        ]
    },
    {
        clue: 'Tên hoạt động thiện nguyện của Đội vào dịp Trung thu',
        display: 'TRUNG THU NHÂN ÁI',
        timeLimit: 90,
        hints: ['💬 13 chữ (bỏ dấu)', '💬 Bắt đầu "TRUNG THU"', '💬 Kết thúc mang ý nghĩa yêu thương'],
        words: [
            { letters: ['T', 'R', 'U', 'N', 'G', 'T', 'H', 'U'], shape: 'line' },
            { letters: ['N', 'H', 'A', 'N', 'A', 'I'], shape: 'L' }
        ]
    },
    {
        clue: 'Tên hoạt động thiện nguyện của Đội vào dịp Tết',
        display: 'XUÂN YÊU THƯƠNG',
        timeLimit: 90,
        hints: ['💬 13 chữ (bỏ dấu)', '💬 Bắt đầu bằng mùa đầu năm', '💬 Chứa "YEUTHUONG"'],
        words: [
            { letters: ['X', 'U', 'A', 'N'], shape: 'line' },
            { letters: ['Y', 'E', 'U'], shape: 'diag' },
            { letters: ['T', 'H', 'U', 'O', 'N', 'G'], shape: 'L' }
        ]
    }
];

// ── SHAPE TEMPLATES (tọa độ tương đối) ───────────────────────────
// Mỗi shape trả về mảng [dr,dc] theo độ dài n
function getShapeCells(shape, n, rotation) {
    let cells = [];
    if (shape === 'line') {
        // Hướng ngang hoặc dọc dựa vào rotation
        if (rotation % 2 === 0) {
            for (let i = 0; i < n; i++) cells.push([0, i]); // ngang
        } else {
            for (let i = 0; i < n; i++) cells.push([i, 0]); // dọc
        }
    } else if (shape === 'L') {
        // rotation 0: dọc rồi ngang phải
        // rotation 1: ngang rồi dọc xuống
        // rotation 2: dọc rồi ngang trái
        // rotation 3: ngang rồi dọc lên
        const half = Math.ceil(n / 2);
        const rest = n - half;
        if (rotation % 4 === 0) {
            for (let i = 0; i < half; i++) cells.push([i, 0]);
            for (let i = 1; i <= rest; i++) cells.push([half - 1, i]);
        } else if (rotation % 4 === 1) {
            for (let i = 0; i < half; i++) cells.push([0, i]);
            for (let i = 1; i <= rest; i++) cells.push([i, half - 1]);
        } else if (rotation % 4 === 2) {
            for (let i = 0; i < half; i++) cells.push([i, rest]);
            for (let i = 0; i < rest; i++) cells.push([half - 1, i]);
        } else {
            for (let i = 0; i < half; i++) cells.push([rest, i]);
            for (let i = 0; i < rest; i++) cells.push([i, 0]);
        }
    } else if (shape === 'diag') {
        // rotation 0: chéo ↘, rotation 1: chéo ↙
        if (rotation % 2 === 0) {
            for (let i = 0; i < n; i++) cells.push([i, i]);
        } else {
            for (let i = 0; i < n; i++) cells.push([i, n - 1 - i]);
        }
    }
    return cells;
}

// ── GRID GENERATION ───────────────────────────────────────────────
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function rndChar() { return ALPHA[Math.floor(Math.random() * 26)]; }

function buildGrid(words) {
    // grid[r][c] = { char, wordIdx, letterIdx }
    const grid = Array.from({ length: GRID_SIZE }, () =>
        Array.from({ length: GRID_SIZE }, () => ({ char: rndChar(), wordIdx: -1, letterIdx: -1 }))
    );

    words.forEach((word, wi) => {
        const n = word.letters.length;
        let placed = false, attempts = 0;
        while (!placed && attempts < 500) {
            attempts++;
            // Chọn shape rotation ngẫu nhiên để đặt vào lưới
            const rot = Math.floor(Math.random() * 4);
            const cells = getShapeCells(word.shape, n, rot);
            const maxDr = Math.max(...cells.map(([r]) => r));
            const maxDc = Math.max(...cells.map(([, c]) => c));
            const startR = Math.floor(Math.random() * (GRID_SIZE - maxDr));
            const startC = Math.floor(Math.random() * (GRID_SIZE - maxDc));

            // Kiểm tra không đè lên word khác
            const ok = cells.every(([dr, dc]) => grid[startR + dr][startC + dc].wordIdx === -1);
            if (ok) {
                cells.forEach(([dr, dc], li) => {
                    grid[startR + dr][startC + dc] = {
                        char: word.letters[li],
                        wordIdx: wi,
                        letterIdx: li
                    };
                });
                // Lưu vị trí đặt vào word object
                word._placedCells = cells.map(([dr, dc]) => [startR + dr, startC + dc]);
                word._rotation = rot;
                placed = true;
            }
        }
        if (!placed) {
            // fallback: đặt ngang ở hàng wi
            word._placedCells = word.letters.map((l, i) => {
                grid[wi][i] = { char: l, wordIdx: wi, letterIdx: i };
                return [wi, i];
            });
            word._rotation = 0;
        }
    });

    return grid;
}

// ── STATE ─────────────────────────────────────────────────────────
let state = {
    playerId: null, playerName: '',
    currentRound: 0, score: 0, roundsCompleted: 0,
    startTime: 0, timer: null, timeLeft: 0,
    hintTimer: null, hintIndex: 0,
    gifts: [], giftName: '', wonGift: false,
    grid: [],
    words: [],        // word objects với _placedCells, _rotation
    pieceRotations: [],
    placed: [],       // index các word đã đặt đúng
    dragWordIdx: -1,
    touchWordIdx: -1,
    touchFloater: null,
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

// ── GAME STATUS CHECK ─────────────────────────────────────────────
async function checkGameActive() {
    try {
        const res = await fetch('/api/game.php?action=status');
        return (await res.json()).active;
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
            state.playerId = data.playerId; state.playerName = fullName;
            state.score = 0; state.roundsCompleted = 0;
            state.currentRound = 0; state.startTime = Date.now();
            showLoading(false);
            if (data.gameActive) startRound(0); else showWaiting();
        } else throw new Error(data.message || 'Đăng ký thất bại');
    } catch (err) {
        showLoading(false);
        errEl.textContent = err.message; errEl.style.display = 'block';
        document.getElementById('btn-register').disabled = false;
    }
}

function showWaiting() {
    document.getElementById('waiting-name').textContent = state.playerName;
    showScreen('screen-waiting');
    state.waitingPoll = setInterval(async () => {
        if (await checkGameActive()) {
            clearInterval(state.waitingPoll); state.waitingPoll = null;
            state.startTime = Date.now(); startRound(0);
        }
    }, 3000);
}

// ── START ROUND ───────────────────────────────────────────────────
function startRound(idx) {
    if (idx >= ROUNDS.length) { endGame(); return; }
    clearInterval(state.timer); clearInterval(state.hintTimer);
    state.currentRound = idx;
    state.hintIndex = 0;
    state.placed = [];

    const round = ROUNDS[idx];
    // Deep copy words
    state.words = round.words.map(w => ({ ...w, letters: [...w.letters], _placedCells: null, _rotation: 0 }));

    // Build lưới với từ ẩn bên trong
    state.grid = buildGrid(state.words);

    // Rotation hình khối ban đầu = ngẫu nhiên (có thể không giống lưới)
    state.pieceRotations = state.words.map(() => Math.floor(Math.random() * 4));

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
            cell.className = 'grid-cell';
            cell.dataset.r = r;
            cell.dataset.c = c;
            cell.textContent = state.grid[r][c].char;

            // Ô đã đặt đúng
            if (state.grid[r][c].correct) {
                cell.classList.add('correct-cell');
            }

            // Drop events
            cell.addEventListener('dragover', e => { e.preventDefault(); onDragOverCell(r, c); });
            cell.addEventListener('dragleave', clearPreview);
            cell.addEventListener('drop', e => { e.preventDefault(); onDropCell(r, c); });

            // Touch
            cell.addEventListener('touchmove', onTouchMoveCell, { passive: false });
            cell.addEventListener('touchend', onTouchEndCell);

            container.appendChild(cell);
        }
    }
}

// ── RENDER PIECES ─────────────────────────────────────────────────
function renderPieces() {
    const tray = document.getElementById('pieces-tray');
    tray.innerHTML = '';

    state.words.forEach((word, wi) => {
        if (state.placed.includes(wi)) return;

        const rot = state.pieceRotations[wi];
        const cells = getShapeCells(word.shape, word.letters.length, rot);

        // Xáo trộn thứ tự hiển thị chữ trên hình (giống nhau mỗi lần xoay)
        // Dùng seeded shuffle dựa trên wi để nhất quán
        const shuffledLetters = shuffleSeeded([...word.letters], wi * 7 + 3);

        const maxR = Math.max(...cells.map(([r]) => r));
        const maxC = Math.max(...cells.map(([, c]) => c));
        const CELL = 34;
        const GAP = 2;

        const wrap = document.createElement('div');
        wrap.className = 'piece-wrap';
        wrap.title = 'Click để xoay • Kéo vào lưới';

        const board = document.createElement('div');
        board.className = 'piece-board';
        board.style.width = `${(maxC + 1) * (CELL + GAP) - GAP}px`;
        board.style.height = `${(maxR + 1) * (CELL + GAP) - GAP}px`;
        board.style.position = 'relative';

        cells.forEach(([r, c], li) => {
            const pcell = document.createElement('div');
            pcell.className = 'piece-cell';
            pcell.textContent = shuffledLetters[li]; // chữ xáo trộn
            pcell.style.left = `${c * (CELL + GAP)}px`;
            pcell.style.top = `${r * (CELL + GAP)}px`;
            pcell.style.width = pcell.style.height = `${CELL}px`;
            board.appendChild(pcell);
        });

        const lbl = document.createElement('div');
        lbl.className = 'piece-label';
        lbl.textContent = word.letters.join(''); // tên gợi ý

        wrap.appendChild(board);
        wrap.appendChild(lbl);

        // Click = xoay
        wrap.addEventListener('click', () => {
            state.pieceRotations[wi] = (state.pieceRotations[wi] + 1) % 4;
            renderPieces();
        });

        // Drag desktop
        wrap.draggable = true;
        wrap.addEventListener('dragstart', e => { state.dragWordIdx = wi; e.dataTransfer.effectAllowed = 'move'; });
        wrap.addEventListener('dragend', () => { state.dragWordIdx = -1; clearPreview(); });

        // Touch mobile
        wrap.addEventListener('touchstart', e => onTouchStartPiece(e, wi), { passive: false });

        tray.appendChild(wrap);
    });

    if (state.placed.length === state.words.length) {
        tray.innerHTML = '<div class="all-placed">✅ Tất cả đã đặt đúng!</div>';
    }
}

// ── SHUFFLE (seeded đơn giản) ─────────────────────────────────────
function shuffleSeeded(arr, seed) {
    const a = [...arr];
    let s = seed;
    for (let i = a.length - 1; i > 0; i--) {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        const j = Math.abs(s) % (i + 1);
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ── DRAG DESKTOP ─────────────────────────────────────────────────
function onDragOverCell(r, c) {
    if (state.dragWordIdx < 0) return;
    showPreview(state.dragWordIdx, r, c);
}

function onDropCell(r, c) {
    if (state.dragWordIdx < 0) return;
    tryPlace(state.dragWordIdx, r, c);
    clearPreview();
}

// ── TOUCH MOBILE ─────────────────────────────────────────────────
function onTouchStartPiece(e, wi) {
    e.preventDefault();
    state.touchWordIdx = wi;
    const touch = e.touches[0];

    const word = state.words[wi];
    const rot = state.pieceRotations[wi];
    const cells = getShapeCells(word.shape, word.letters.length, rot);
    const shuffled = shuffleSeeded([...word.letters], wi * 7 + 3);
    const CELL = 28, GAP = 2;
    const maxR = Math.max(...cells.map(([r]) => r));
    const maxC = Math.max(...cells.map(([, c]) => c));

    const f = document.createElement('div');
    f.className = 'touch-floater';
    f.style.width = `${(maxC + 1) * (CELL + GAP)}px`;
    f.style.height = `${(maxR + 1) * (CELL + GAP)}px`;
    f.style.position = 'fixed';
    f.style.pointerEvents = 'none';
    f.style.zIndex = '9999';
    f.style.opacity = '0.85';

    cells.forEach(([r, c], li) => {
        const pc = document.createElement('div');
        pc.className = 'piece-cell floater-cell';
        pc.textContent = shuffled[li];
        pc.style.cssText = `position:absolute;left:${c * (CELL + GAP)}px;top:${r * (CELL + GAP)}px;width:${CELL}px;height:${CELL}px;font-size:10px;`;
        f.appendChild(pc);
    });

    f.style.left = `${touch.clientX - 20}px`;
    f.style.top = `${touch.clientY - 20}px`;
    document.body.appendChild(f);
    state.touchFloater = f;
}

function onTouchMoveCell(e) {
    e.preventDefault();
    if (state.touchWordIdx < 0 || !state.touchFloater) return;
    const touch = e.touches[0];
    state.touchFloater.style.left = `${touch.clientX - 20}px`;
    state.touchFloater.style.top = `${touch.clientY - 20}px`;

    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (el && el.classList.contains('grid-cell')) {
        showPreview(state.touchWordIdx, +el.dataset.r, +el.dataset.c);
    } else clearPreview();
}

function onTouchEndCell(e) {
    if (state.touchWordIdx < 0) return;
    const touch = e.changedTouches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (el && el.classList.contains('grid-cell')) {
        tryPlace(state.touchWordIdx, +el.dataset.r, +el.dataset.c);
    }
    clearPreview();
    if (state.touchFloater) { state.touchFloater.remove(); state.touchFloater = null; }
    state.touchWordIdx = -1;
}

// ── PREVIEW ───────────────────────────────────────────────────────
let _lastPreviewKey = '';

function showPreview(wi, anchorR, anchorC) {
    const key = `${wi}-${anchorR}-${anchorC}`;
    if (key === _lastPreviewKey) return;
    clearPreview();
    _lastPreviewKey = key;

    const word = state.words[wi];
    const rot = state.pieceRotations[wi];
    const cells = getShapeCells(word.shape, word.letters.length, rot);

    // Kiểm tra hợp lệ: tất cả ô trong lưới
    const inBounds = cells.every(([dr, dc]) => {
        const r = anchorR + dr, c = anchorC + dc;
        return r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE;
    });

    cells.forEach(([dr, dc]) => {
        const r = anchorR + dr, c = anchorC + dc;
        const el = getCellEl(r, c);
        if (el) el.classList.add(inBounds ? 'preview-hover' : 'preview-invalid');
    });
}

function clearPreview() {
    _lastPreviewKey = '';
    document.querySelectorAll('.preview-hover,.preview-invalid')
        .forEach(el => el.classList.remove('preview-hover', 'preview-invalid'));
}

function getCellEl(r, c) {
    return document.querySelector(`.grid-cell[data-r="${r}"][data-c="${c}"]`);
}

// ── TRY PLACE ─────────────────────────────────────────────────────
function tryPlace(wi, anchorR, anchorC) {
    if (state.placed.includes(wi)) return;

    const word = state.words[wi];
    const rot = state.pieceRotations[wi];
    const cells = getShapeCells(word.shape, word.letters.length, rot);

    // Kiểm tra trong bounds
    const inBounds = cells.every(([dr, dc]) => {
        const r = anchorR + dr, c = anchorC + dc;
        return r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE;
    });
    if (!inBounds) {
        flashRed(cells.map(([dr, dc]) => [anchorR + dr, anchorC + dc]));
        return;
    }

    // Kiểm tra tất cả ô có chứa đúng chữ của word không
    // (không phụ thuộc thứ tự — so khớp theo nội dung)
    const targetLetters = [...word.letters];
    const cellLetters = cells.map(([dr, dc]) => state.grid[anchorR + dr][anchorC + dc].char);

    // Kiểm tra set chữ khớp
    const correct = checkLettersMatch(cellLetters, targetLetters);

    if (correct) {
        // Đánh dấu đúng
        cells.forEach(([dr, dc]) => {
            const r = anchorR + dr, c = anchorC + dc;
            state.grid[r][c].correct = true;
            const el = getCellEl(r, c);
            if (el) { el.classList.add('correct-cell'); el.classList.remove('preview-hover'); }
        });
        state.placed.push(wi);

        const bonus = Math.max(0, Math.floor(state.timeLeft / 5));
        state.score += 50 + bonus;
        document.getElementById('score-display').textContent = state.score;

        renderPieces();

        if (state.placed.length === state.words.length) {
            state.roundsCompleted++;
            document.getElementById('found-indicator').style.display = 'block';
            document.getElementById('found-word').textContent = ROUNDS[state.currentRound].display;
            clearInterval(state.timer); clearInterval(state.hintTimer);
            setTimeout(() => nextRound(true), 1800);
        }
    } else {
        flashRed(cells.map(([dr, dc]) => [anchorR + dr, anchorC + dc]));
    }
}

// So khớp multiset chữ
function checkLettersMatch(got, expected) {
    if (got.length !== expected.length) return false;
    const g = [...got].sort().join('');
    const e = [...expected].sort().join('');
    return g === e;
}

function flashRed(positions) {
    positions.forEach(([r, c]) => {
        const el = getCellEl(r, c);
        if (el) {
            el.classList.add('wrong');
            setTimeout(() => el.classList.remove('wrong'), 600);
        }
    });
}

// ── HINT TIMER ────────────────────────────────────────────────────
function startHintTimer(round) {
    clearInterval(state.hintTimer);
    state.hintTimer = setInterval(() => {
        if (state.hintIndex < round.hints.length) {
            const el = document.getElementById('extra-hint');
            el.textContent = round.hints[state.hintIndex];
            el.style.display = 'block';
            el.classList.remove('hint-flash'); void el.offsetWidth; el.classList.add('hint-flash');
            state.hintIndex++;
        } else clearInterval(state.hintTimer);
    }, 45000);
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
    document.getElementById('timer-display').textContent = state.timeLeft;
    document.getElementById('timer-fill').style.width = (state.timeLeft / round.timeLimit * 100) + '%';
}

// ── NEXT ROUND ────────────────────────────────────────────────────
function nextRound(succeeded) {
    clearInterval(state.timer); clearInterval(state.hintTimer);
    const next = state.currentRound + 1;
    if (next >= ROUNDS.length) { endGame(); return; }
    const overlay = document.createElement('div');
    overlay.className = 'round-transition';
    overlay.innerHTML = `<div class="round-transition-card">
    <h3>${succeeded ? '✅' : '⏰'} Vòng ${state.currentRound + 1} ${succeeded ? 'hoàn thành!' : '– Hết giờ!'}</h3>
    <p>Chuẩn bị vòng tiếp theo</p>
    <div class="next-word">Vòng ${next + 1} / ${ROUNDS.length}</div>
    <p style="color:#5f6368;font-size:13px;margin-top:6px">${ROUNDS[next].clue}</p>
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
            method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
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
        state.gifts = (data.gifts && data.gifts.length) ? data.gifts : [{ name: 'Chúc mừng!', probability: 100 }];
    } catch { state.gifts = [{ name: 'Sticker VSEATeam', probability: 30 }, { name: 'Kẹo ngọt', probability: 25 }, { name: 'Voucher 50k', probability: 15 }, { name: 'Quà đặc biệt', probability: 5 }, { name: 'Chúc mừng tham gia!', probability: 25 }]; }
    const tot = state.gifts.reduce((s, g) => s + g.probability, 0);
    if (tot < 100) state.gifts.push({ name: 'Chúc mừng tham gia!', probability: 100 - tot });
    drawWheel(0);
}

function drawWheel(rotation) {
    const canvas = document.getElementById('spin-canvas'), ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2, r = W / 2 - 8;
    ctx.clearRect(0, 0, W, H);
    const total = state.gifts.reduce((s, g) => s + g.probability, 0);
    let start = rotation;
    state.gifts.forEach((g, i) => {
        const slice = (g.probability / total) * 2 * Math.PI, end = start + slice;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, end); ctx.closePath();
        ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length]; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(start + slice / 2);
        ctx.textAlign = 'right'; ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.min(13, 300 / state.gifts.length)}px sans-serif`;
        ctx.fillText(g.name.length > 14 ? g.name.substring(0, 13) + '…' : g.name, r - 10, 5);
        ctx.restore(); start = end;
    });
    ctx.beginPath(); ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 2; ctx.stroke();
}

let isSpinning = false;
function spinWheel() {
    if (isSpinning) return; isSpinning = true;
    document.getElementById('btn-spin').disabled = true;
    document.getElementById('spin-result').style.display = 'none';
    const spins = 5 + Math.random() * 5, dur = 4000, t0 = performance.now();
    const total = state.gifts.reduce((s, g) => s + g.probability, 0);
    let gi = state.gifts.findIndex(g => g.name === state.giftName);
    if (gi < 0) gi = state.gifts.length - 1;
    let cum = 0, tOff = 0;
    for (let i = 0; i <= gi; i++) { const s = (state.gifts[i].probability / total) * 2 * Math.PI; if (i === gi) tOff = cum + s / 2; cum += s; }
    const tRot = spins * 2 * Math.PI - tOff - Math.PI / 2;
    const ease = t => 1 - Math.pow(1 - t, 4);
    (function anim(now) {
        const p = Math.min((now - t0) / dur, 1); drawWheel(ease(p) * tRot);
        if (p < 1) requestAnimationFrame(anim); else { isSpinning = false; showSpinResult(); }
    })(performance.now());
}

function showSpinResult() {
    document.getElementById('spin-gift-icon').textContent = state.wonGift ? '🎁' : '🌟';
    document.getElementById('spin-gift-name').textContent = state.giftName;
    document.getElementById('spin-result').style.display = 'block';
    setTimeout(goToFinish, 2500);
}

function goToFinish() {
    document.getElementById('finish-name').textContent = `Xin chào, ${state.playerName}!`;
    document.getElementById('finish-score').textContent = state.score;
    document.getElementById('finish-rounds').textContent = `${state.roundsCompleted}/${ROUNDS.length}`;
    document.getElementById('finish-gift-name').textContent = state.giftName;
    launchConfetti(); showScreen('screen-finish');
}

function launchConfetti() {
    const area = document.getElementById('confetti-area'); area.innerHTML = '';
    const colors = ['#1a73e8', '#f5a623', '#34a853', '#ea4335', '#9c27b0', '#fff'];
    for (let i = 0; i < 60; i++) {
        const p = document.createElement('div'); p.className = 'confetti-piece';
        p.style.left = Math.random() * 100 + '%'; p.style.background = colors[~~(Math.random() * colors.length)];
        p.style.width = p.style.height = (6 + Math.random() * 8) + 'px';
        p.style.animationDuration = (2 + Math.random() * 3) + 's'; p.style.animationDelay = (Math.random() * 2) + 's';
        area.appendChild(p);
    }
}

function restartGame() {
    clearInterval(state.timer); clearInterval(state.hintTimer);
    if (state.waitingPoll) { clearInterval(state.waitingPoll); state.waitingPoll = null; }
    state = {
        playerId: null, playerName: '', currentRound: 0, score: 0, roundsCompleted: 0, startTime: 0,
        timer: null, timeLeft: 0, hintTimer: null, hintIndex: 0, gifts: [], giftName: '', wonGift: false,
        grid: [], words: [], pieceRotations: [], placed: [], dragWordIdx: -1, touchWordIdx: -1, touchFloater: null, waitingPoll: null
    };
    document.getElementById('registerForm').reset();
    document.getElementById('register-error').style.display = 'none';
    document.getElementById('btn-register').disabled = false;
    showScreen('screen-register');
}

window.addEventListener('DOMContentLoaded', () => { });
