/* VSEATeam Block Word v4 */
const GRID_SIZE = 11;
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const ROUNDS = [
    {
        clue: 'Tên viết tắt hoặc tên gọi ngắn gọn của Đội', display: 'VSEATEAM', timeLimit: 120,
        hints: ['💬 Gồm 8 chữ, bắt đầu bằng V', '💬 Chứa "SEA" ở giữa', '💬 Kết thúc bằng "TEAM"'],
        words: [{ letters: ['V', 'S', 'E', 'A', 'T', 'E', 'A', 'M'], shape: 'line', label: 'VSEATEAM' }]
    },

    {
        clue: 'Khoa mà Đội VSEATeam trực thuộc', display: 'KINH TẾ', timeLimit: 90,
        hints: ['💬 Gồm 6 chữ (bỏ dấu)', '💬 Liên quan tài chính', '💬 Bắt đầu bằng K'],
        words: [{ letters: ['K', 'I', 'N', 'H', 'T', 'E'], shape: 'L', label: 'KINHTE' }]
    },

    {
        clue: 'Số năm thành lập và hoạt động của Đội (viết bằng chữ)', display: 'MƯỜI SÁU NĂM', timeLimit: 120,
        hints: ['💬 Gồm 10 chữ (bỏ dấu)', '💬 Hơn 15 năm', '💬 Giữa 15 và 17'],
        words: [
            { letters: ['M', 'U', 'O', 'I'], shape: 'line', label: 'MUOI' },
            { letters: ['S', 'A', 'U'], shape: 'line', label: 'SAU' },
            { letters: ['N', 'A', 'M'], shape: 'diag', label: 'NAM' }
        ]
    },

    {
        clue: 'Tên hoạt động thiện nguyện của Đội vào dịp Trung thu', display: 'TRUNG THU NHÂN ÁI', timeLimit: 90,
        hints: ['💬 13 chữ (bỏ dấu)', '💬 Bắt đầu "TRUNG THU"', '💬 Kết thúc mang ý nghĩa yêu thương'],
        words: [
            { letters: ['T', 'R', 'U', 'N', 'G', 'T', 'H', 'U'], shape: 'line', label: 'TRUNGTHU' },
            { letters: ['N', 'H', 'A', 'N', 'A', 'I'], shape: 'L', label: 'NHANAI' }
        ]
    },

    {
        clue: 'Tên hoạt động thiện nguyện của Đội vào dịp Tết', display: 'XUÂN YÊU THƯƠNG', timeLimit: 90,
        hints: ['💬 13 chữ (bỏ dấu)', '💬 Bắt đầu bằng mùa đầu năm', '💬 Chứa "YEUTHUONG"'],
        words: [
            { letters: ['X', 'U', 'A', 'N'], shape: 'line', label: 'XUAN' },
            { letters: ['Y', 'E', 'U'], shape: 'diag', label: 'YEU' },
            { letters: ['T', 'H', 'U', 'O', 'N', 'G'], shape: 'L', label: 'THUONG' }
        ]
    }
];

/* ── SHAPE CELLS ── */
function getShapeCells(shape, n, rot) {
    var cells = [];
    if (shape === 'line') {
        if (rot % 2 === 0) { for (var i = 0; i < n; i++) cells.push([0, i]); }
        else { for (var i = 0; i < n; i++) cells.push([i, 0]); }
    } else if (shape === 'L') {
        var half = Math.ceil(n / 2), rest = n - half, r4 = rot % 4;
        if (r4 === 0) { for (var i = 0; i < half; i++) cells.push([i, 0]); for (var i = 1; i <= rest; i++) cells.push([half - 1, i]); }
        else if (r4 === 1) { for (var i = 0; i < half; i++) cells.push([0, i]); for (var i = 1; i <= rest; i++) cells.push([i, half - 1]); }
        else if (r4 === 2) { for (var i = 0; i < half; i++) cells.push([i, rest]); for (var i = 0; i < rest; i++) cells.push([half - 1, i]); }
        else { for (var i = 0; i < half; i++) cells.push([rest, i]); for (var i = 0; i < rest; i++) cells.push([i, 0]); }
    } else if (shape === 'diag') {
        if (rot % 2 === 0) { for (var i = 0; i < n; i++) cells.push([i, i]); }
        else { for (var i = 0; i < n; i++) cells.push([i, n - 1 - i]); }
    }
    return cells;
}

/* ── GRID BUILD ── */
function rndChar() { return ALPHA[Math.floor(Math.random() * 26)]; }

function buildGrid(words) {
    var grid = [];
    for (var r = 0; r < GRID_SIZE; r++) {
        grid[r] = [];
        for (var c = 0; c < GRID_SIZE; c++) {
            grid[r][c] = { char: rndChar(), wordIdx: -1, letterIdx: -1, correct: false };
        }
    }
    words.forEach(function (word, wi) {
        var n = word.letters.length, placed = false, attempts = 0;
        while (!placed && attempts < 600) {
            attempts++;
            var rot = Math.floor(Math.random() * 4);
            var cells = getShapeCells(word.shape, n, rot);
            var maxDr = 0, maxDc = 0;
            cells.forEach(function (rc) { if (rc[0] > maxDr) maxDr = rc[0]; if (rc[1] > maxDc) maxDc = rc[1]; });
            if (GRID_SIZE - maxDr < 1 || GRID_SIZE - maxDc < 1) continue;
            var startR = Math.floor(Math.random() * (GRID_SIZE - maxDr));
            var startC = Math.floor(Math.random() * (GRID_SIZE - maxDc));
            var ok = cells.every(function (rc) { return grid[startR + rc[0]][startC + rc[1]].wordIdx === -1; });
            if (ok) {
                cells.forEach(function (rc, li) {
                    var row = startR + rc[0], col = startC + rc[1];
                    grid[row][col] = { char: word.letters[li], wordIdx: wi, letterIdx: li, correct: false };
                });
                word._placed = cells.map(function (rc) { return [startR + rc[0], startC + rc[1]]; });
                word._rot = rot;
                placed = true;
            }
        }
        if (!placed) {
            word._placed = word.letters.map(function (l, i) {
                grid[wi][i] = { char: l, wordIdx: wi, letterIdx: i, correct: false };
                return [wi, i];
            });
            word._rot = 0;
        }
    });
    return grid;
}

/* ── SHUFFLE SEEDED ── */
function shuffleSeed(arr, seed) {
    var a = arr.slice(), s = seed;
    for (var i = a.length - 1; i > 0; i--) {
        s = (s * 1664525 + 1013904223) | 0;
        var j = Math.abs(s) % (i + 1);
        var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
}

/* ── STATE ── */
var state = {
    playerId: null, playerName: '', currentRound: 0, score: 0, roundsCompleted: 0,
    startTime: 0, timer: null, timeLeft: 0, hintTimer: null, hintIndex: 0,
    gifts: [], giftName: '', wonGift: false,
    grid: [], words: [], pieceRots: [], placed: [],
    dragIdx: -1, touchIdx: -1, touchFloater: null, waitPoll: null,
    revTimer: null, revStep: 0
};

/* ── UTILS ── */
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
    document.getElementById(id).classList.add('active');
    window.scrollTo(0, 0);
}
function showLoading(v) { document.getElementById('loading-overlay').style.display = v ? 'flex' : 'none'; }
function $cell(r, c) { return document.querySelector('.grid-cell[data-r="' + r + '"][data-c="' + c + '"]'); }

/* ── GAME STATUS ── */
async function checkGameActive() {
    try { var r = await fetch('/api/game.php?action=status'); return (await r.json()).active; }
    catch (e) { return false; }
}

/* ── REGISTER ── */
async function handleRegister(e) {
    e.preventDefault();
    var fn = document.getElementById('inp-name').value.trim();
    var em = document.getElementById('inp-email').value.trim();
    var ph = document.getElementById('inp-phone').value.trim();
    var cl = document.getElementById('inp-class').value.trim();
    var errEl = document.getElementById('register-error');
    errEl.style.display = 'none';
    document.getElementById('btn-register').disabled = true;
    showLoading(true);
    try {
        var res = await fetch('/api/game.php?action=register', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
            body: JSON.stringify({ fullName: fn, email: em, phone: ph, className: cl })
        });
        var data = await res.json();
        if (data.success) {
            state.playerId = data.playerId; state.playerName = fn;
            state.score = 0; state.roundsCompleted = 0; state.currentRound = 0; state.startTime = Date.now();
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
    state.waitPoll = setInterval(async function () {
        if (await checkGameActive()) {
            clearInterval(state.waitPoll); state.waitPoll = null;
            state.startTime = Date.now(); startRound(0);
        }
    }, 3000);
}

/* ── START ROUND ── */
function startRound(idx) {
    if (idx >= ROUNDS.length) { endGame(); return; }
    clearInterval(state.timer); clearInterval(state.hintTimer); clearInterval(state.revTimer);
    state.currentRound = idx; state.hintIndex = 0; state.placed = []; state.revStep = 0;

    var round = ROUNDS[idx];
    // Deep copy words
    state.words = round.words.map(function (w) {
        return { letters: w.letters.slice(), shape: w.shape, label: w.label, _placed: null, _rot: 0 };
    });
    state.grid = buildGrid(state.words);
    state.pieceRots = state.words.map(function () { return Math.floor(Math.random() * 4); });

    document.getElementById('round-current').textContent = idx + 1;
    document.getElementById('round-total').textContent = ROUNDS.length;
    document.getElementById('score-display').textContent = state.score;
    document.getElementById('round-clue').textContent = round.clue;
    document.getElementById('round-display').textContent = round.display;
    document.getElementById('found-indicator').style.display = 'none';
    var eH = document.getElementById('extra-hint'); eH.style.display = 'none'; eH.textContent = '';

    renderGrid();
    renderPieces();
    startTimer(round.timeLimit);
    startHintTimer(round);
    startRevealTimer();
    showScreen('screen-game');
}

/* ── RENDER GRID ── */
function renderGrid() {
    var con = document.getElementById('word-grid');
    con.innerHTML = '';
    con.style.gridTemplateColumns = 'repeat(' + GRID_SIZE + ',1fr)';
    for (var r = 0; r < GRID_SIZE; r++) {
        for (var c = 0; c < GRID_SIZE; c++) {
            (function (rr, cc) {
                var el = document.createElement('div');
                el.className = 'grid-cell';
                el.dataset.r = rr; el.dataset.c = cc;
                el.textContent = state.grid[rr][cc].char;
                if (state.grid[rr][cc].correct) el.classList.add('correct-cell');
                el.addEventListener('dragover', function (e) { e.preventDefault(); onDragOver(rr, cc); });
                el.addEventListener('dragleave', clearPrev);
                el.addEventListener('drop', function (e) { e.preventDefault(); onDrop(rr, cc); });
                el.addEventListener('touchmove', onTouchMove, { passive: false });
                el.addEventListener('touchend', onTouchEnd);
                con.appendChild(el);
            })(r, c);
        }
    }
}

/* ── RENDER PIECES ── */
function renderPieces() {
    var tray = document.getElementById('pieces-tray');
    tray.innerHTML = '';

    state.words.forEach(function (word, wi) {
        if (state.placed.indexOf(wi) >= 0) return;

        var rot = state.pieceRots[wi];
        var cells = getShapeCells(word.shape, word.letters.length, rot);
        var shuffled = shuffleSeed(word.letters, wi * 17 + 7);

        var maxR = 0, maxC = 0;
        cells.forEach(function (rc) { if (rc[0] > maxR) maxR = rc[0]; if (rc[1] > maxC) maxC = rc[1]; });
        var SZ = 34, GAP = 3;

        var wrap = document.createElement('div');
        wrap.className = 'piece-wrap';

        var board = document.createElement('div');
        board.className = 'piece-board';
        board.style.width = ((maxC + 1) * (SZ + GAP) - GAP) + 'px';
        board.style.height = ((maxR + 1) * (SZ + GAP) - GAP) + 'px';
        board.style.position = 'relative';

        cells.forEach(function (rc, li) {
            var pc = document.createElement('div');
            pc.className = 'piece-cell';
            pc.textContent = shuffled[li];          // chữ xáo trộn
            pc.style.left = (rc[1] * (SZ + GAP)) + 'px';
            pc.style.top = (rc[0] * (SZ + GAP)) + 'px';
            pc.style.width = SZ + 'px';
            pc.style.height = SZ + 'px';
            board.appendChild(pc);
        });

        var lbl = document.createElement('div');
        lbl.className = 'piece-label';
        lbl.textContent = word.label;             // label tên từ

        wrap.appendChild(board);
        wrap.appendChild(lbl);

        // Click xoay
        wrap.addEventListener('click', function () {
            state.pieceRots[wi] = (state.pieceRots[wi] + 1) % 4;
            renderPieces();
        });

        // Drag desktop
        wrap.draggable = true;
        wrap.addEventListener('dragstart', function (e) {
            state.dragIdx = wi; e.dataTransfer.effectAllowed = 'move';
        });
        wrap.addEventListener('dragend', function () {
            state.dragIdx = -1; clearPrev();
        });

        // Touch mobile
        wrap.addEventListener('touchstart', function (e) { onTouchStart(e, wi); }, { passive: false });

        tray.appendChild(wrap);
    });

    if (state.placed.length > 0 && state.placed.length === state.words.length) {
        tray.innerHTML = '<div class="all-placed">✅ Tất cả đã đặt đúng!</div>';
    }
}

/* ── DRAG ── */
function onDragOver(r, c) { if (state.dragIdx < 0) return; showPrev(state.dragIdx, r, c); }
function onDrop(r, c) { if (state.dragIdx < 0) return; tryPlace(state.dragIdx, r, c); clearPrev(); }

/* ── TOUCH ── */
function onTouchStart(e, wi) {
    e.preventDefault();
    state.touchIdx = wi;
    var touch = e.touches[0];
    var word = state.words[wi];
    var rot = state.pieceRots[wi];
    var cells = getShapeCells(word.shape, word.letters.length, rot);
    var shuffled = shuffleSeed(word.letters, wi * 17 + 7);
    var SZ = 28, GAP = 2;
    var maxR = 0, maxC = 0;
    cells.forEach(function (rc) { if (rc[0] > maxR) maxR = rc[0]; if (rc[1] > maxC) maxC = rc[1]; });

    var f = document.createElement('div');
    f.style.cssText = 'position:fixed;z-index:9999;pointer-events:none;opacity:.85;' +
        'width:' + ((maxC + 1) * (SZ + GAP)) + 'px;height:' + ((maxR + 1) * (SZ + GAP)) + 'px;' +
        'left:' + (touch.clientX - 20) + 'px;top:' + (touch.clientY - 20) + 'px;';
    cells.forEach(function (rc, li) {
        var pc = document.createElement('div');
        pc.className = 'piece-cell floater-cell';
        pc.textContent = shuffled[li];
        pc.style.cssText = 'position:absolute;left:' + (rc[1] * (SZ + GAP)) + 'px;top:' + (rc[0] * (SZ + GAP)) + 'px;' +
            'width:' + SZ + 'px;height:' + SZ + 'px;font-size:10px;';
        f.appendChild(pc);
    });
    document.body.appendChild(f);
    state.touchFloater = f;
}

function onTouchMove(e) {
    e.preventDefault();
    if (state.touchIdx < 0 || !state.touchFloater) return;
    var touch = e.touches[0];
    state.touchFloater.style.left = (touch.clientX - 20) + 'px';
    state.touchFloater.style.top = (touch.clientY - 20) + 'px';
    var el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (el && el.classList.contains('grid-cell')) showPrev(state.touchIdx, +el.dataset.r, +el.dataset.c);
    else clearPrev();
}

function onTouchEnd(e) {
    if (state.touchIdx < 0) return;
    var touch = e.changedTouches[0];
    var el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (el && el.classList.contains('grid-cell')) tryPlace(state.touchIdx, +el.dataset.r, +el.dataset.c);
    clearPrev();
    if (state.touchFloater) { state.touchFloater.remove(); state.touchFloater = null; }
    state.touchIdx = -1;
}

/* ── PREVIEW ── */
var _pk = '';
function showPrev(wi, ar, ac) {
    var key = wi + '-' + ar + '-' + ac;
    if (key === _pk) return;
    clearPrev(); _pk = key;
    var word = state.words[wi];
    var cells = getShapeCells(word.shape, word.letters.length, state.pieceRots[wi]);
    var ok = cells.every(function (rc) {
        var r = ar + rc[0], c = ac + rc[1];
        return r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE;
    });
    cells.forEach(function (rc) {
        var el = $cell(ar + rc[0], ac + rc[1]);
        if (el) el.classList.add(ok ? 'preview-hover' : 'preview-invalid');
    });
}
function clearPrev() {
    _pk = '';
    document.querySelectorAll('.preview-hover,.preview-invalid').forEach(function (el) {
        el.classList.remove('preview-hover', 'preview-invalid');
    });
}

/* ── TRY PLACE ── */
function tryPlace(wi, ar, ac) {
    if (state.placed.indexOf(wi) >= 0) return;
    var word = state.words[wi];
    var cells = getShapeCells(word.shape, word.letters.length, state.pieceRots[wi]);

    var inBounds = cells.every(function (rc) {
        var r = ar + rc[0], c = ac + rc[1];
        return r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE;
    });
    if (!inBounds) { flashRed(cells, ar, ac); return; }

    var got = cells.map(function (rc) { return state.grid[ar + rc[0]][ac + rc[1]].char; });
    var exp = word.letters.slice();
    var correct = got.slice().sort().join('') === exp.slice().sort().join('');

    if (correct) {
        cells.forEach(function (rc) {
            var r = ar + rc[0], c = ac + rc[1];
            state.grid[r][c].correct = true;
            var el = $cell(r, c);
            if (el) { el.classList.add('correct-cell'); el.classList.remove('preview-hover', 'hint-dim', 'hint-border'); }
        });
        state.placed.push(wi);
        state.score += 50 + Math.max(0, Math.floor(state.timeLeft / 5));
        document.getElementById('score-display').textContent = state.score;
        renderPieces();

        if (state.placed.length === state.words.length) {
            state.roundsCompleted++;
            document.getElementById('found-indicator').style.display = 'block';
            document.getElementById('found-word').textContent = ROUNDS[state.currentRound].display;
            clearInterval(state.timer); clearInterval(state.hintTimer); clearInterval(state.revTimer);
            setTimeout(function () { nextRound(true); }, 1800);
        }
    } else {
        flashRed(cells, ar, ac);
    }
}

function flashRed(cells, ar, ac) {
    cells.forEach(function (rc) {
        var el = $cell(ar + rc[0], ac + rc[1]);
        if (el) { el.classList.add('wrong'); setTimeout(function () { el.classList.remove('wrong'); }, 600); }
    });
}

/* ── REVEAL TIMER (gợi ý sau 30s và 60s) ── */
function startRevealTimer() {
    clearInterval(state.revTimer);
    state.revStep = 0;
    state.revTimer = setInterval(function () {
        if (state.revStep < 1 && state.timeLeft <= 60) { state.revStep = 1; doReveal1(); }
        if (state.revStep < 2 && state.timeLeft <= 30) { state.revStep = 2; doReveal2(); }
    }, 1000);
}

function doReveal1() {
    // Làm mờ ngẫu nhiên TẤT CẢ ô nhiễu toàn lưới (wordIdx === -1), 600ms/ô
    // Không mờ ô keyword (wordIdx >= 0) và ô đã đặt đúng
    var noiseCells = [];
    for (var r = 0; r < GRID_SIZE; r++) {
        for (var c = 0; c < GRID_SIZE; c++) {
            var cell = state.grid[r][c];
            if (cell.wordIdx === -1 && !cell.correct) {
                noiseCells.push([r, c]);
            }
        }
    }
    // Xáo trộn ngẫu nhiên thứ tự
    for (var i = noiseCells.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = noiseCells[i]; noiseCells[i] = noiseCells[j]; noiseCells[j] = tmp;
    }
    // Mờ dần từng ô 600ms/ô
    noiseCells.forEach(function (rc, i) {
        setTimeout(function () {
            var el = $cell(rc[0], rc[1]);
            if (el && !el.classList.contains('correct-cell') && !el.classList.contains('hint-border')) {
                el.classList.add('hint-dim');
            }
        }, i * 600);
    });
    var eH = document.getElementById('extra-hint');
    eH.textContent = '💡 Các ô nhiễu đang mờ dần, từ ẩn sẽ hiện rõ hơn...';
    eH.style.display = 'block';
    eH.classList.remove('hint-flash'); void eH.offsetWidth; eH.classList.add('hint-flash');
}

function doReveal2() {
    // Viền vàng nhấp nháy quanh ô của từ chưa đặt
    state.words.forEach(function (word, wi) {
        if (state.placed.indexOf(wi) >= 0 || !word._placed) return;
        word._placed.forEach(function (rc, i) {
            setTimeout(function () {
                if (state.placed.indexOf(wi) >= 0) return;
                var el = $cell(rc[0], rc[1]); if (el) el.classList.add('hint-border');
            }, i * 250);
        });
    });
    var eH = document.getElementById('extra-hint');
    eH.textContent = '💡 Ô viền vàng = vị trí của từ cần tìm!';
    eH.style.display = 'block';
    eH.classList.remove('hint-flash'); void eH.offsetWidth; eH.classList.add('hint-flash');
}

/* ── HINT TIMER ── */
function startHintTimer(round) {
    clearInterval(state.hintTimer);
    state.hintTimer = setInterval(function () {
        if (state.hintIndex < round.hints.length) {
            var el = document.getElementById('extra-hint');
            el.textContent = round.hints[state.hintIndex];
            el.style.display = 'block';
            el.classList.remove('hint-flash'); void el.offsetWidth; el.classList.add('hint-flash');
            state.hintIndex++;
        } else clearInterval(state.hintTimer);
    }, 40000);
}

/* ── TIMER ── */
function startTimer(s) {
    clearInterval(state.timer);
    state.timeLeft = s; updateTimerUI();
    state.timer = setInterval(function () {
        state.timeLeft--; updateTimerUI();
        if (state.timeLeft <= 0) {
            clearInterval(state.timer); clearInterval(state.hintTimer); clearInterval(state.revTimer);
            setTimeout(function () { nextRound(false); }, 1000);
        }
    }, 1000);
}
function updateTimerUI() {
    var r = ROUNDS[state.currentRound];
    document.getElementById('timer-display').textContent = state.timeLeft;
    document.getElementById('timer-fill').style.width = (state.timeLeft / r.timeLimit * 100) + '%';
}

/* ── NEXT ROUND ── */
function nextRound(ok) {
    clearInterval(state.timer); clearInterval(state.hintTimer); clearInterval(state.revTimer);
    var next = state.currentRound + 1;
    if (next >= ROUNDS.length) { endGame(); return; }
    var ov = document.createElement('div'); ov.className = 'round-transition';
    ov.innerHTML = '<div class="round-transition-card"><h3>' + (ok ? '✅' : '⏰') + ' Vòng ' + (state.currentRound + 1) + ' ' + (ok ? 'hoàn thành!' : '– Hết giờ!') + '</h3>' +
        '<p>Chuẩn bị vòng tiếp theo</p><div class="next-word">Vòng ' + (next + 1) + ' / ' + ROUNDS.length + '</div>' +
        '<p style="color:#5f6368;font-size:13px;margin-top:6px">' + ROUNDS[next].clue + '</p></div>';
    document.body.appendChild(ov);
    setTimeout(function () { ov.remove(); startRound(next); }, 2200);
}

/* ── END GAME ── */
async function endGame() {
    clearInterval(state.timer); clearInterval(state.hintTimer); clearInterval(state.revTimer);
    var tu = Math.floor((Date.now() - state.startTime) / 1000);
    showLoading(true);
    try {
        var res = await fetch('/api/game.php?action=result', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
            body: JSON.stringify({ playerId: state.playerId, score: state.score, timeUsed: tu, roundsCompleted: state.roundsCompleted })
        });
        var d = await res.json(); state.giftName = d.giftName; state.wonGift = d.wonGift;
    } catch (e) { state.giftName = 'Chúc mừng bạn đã tham gia!'; state.wonGift = false; }
    showLoading(false);
    document.getElementById('spin-score').textContent = state.score;
    document.getElementById('spin-rounds').textContent = state.roundsCompleted;
    await loadGiftsAndDrawWheel();
    showScreen('screen-spin');
}

/* ── SPIN WHEEL ── */
var WC = ['#1a73e8', '#f5a623', '#34a853', '#ea4335', '#9c27b0', '#00bcd4', '#ff5722', '#607d8b', '#e91e63', '#4caf50'];
async function loadGiftsAndDrawWheel() {
    try {
        var res = await fetch('/api/game.php?action=gifts_public', { credentials: 'include' });
        var d = await res.json();
        state.gifts = (d.gifts && d.gifts.length) ? d.gifts : [{ name: 'Chúc mừng!', probability: 100 }];
    } catch (e) {
        state.gifts = [{ name: 'Sticker VSEATeam', probability: 30 }, { name: 'Kẹo ngọt', probability: 25 },
        { name: 'Voucher 50k', probability: 15 }, { name: 'Quà đặc biệt', probability: 5 }, { name: 'Tham gia', probability: 25 }];
    }
    var tot = state.gifts.reduce(function (s, g) { return s + g.probability; }, 0);
    if (tot < 100) state.gifts.push({ name: 'Chúc mừng tham gia!', probability: 100 - tot });
    drawWheel(0);
}
function drawWheel(rot) {
    var cv = document.getElementById('spin-canvas'), ctx = cv.getContext('2d');
    var W = cv.width, H = cv.height, cx = W / 2, cy = H / 2, r = W / 2 - 8;
    ctx.clearRect(0, 0, W, H);
    var tot = state.gifts.reduce(function (s, g) { return s + g.probability; }, 0), start = rot;
    state.gifts.forEach(function (g, i) {
        var sl = (g.probability / tot) * 2 * Math.PI, end = start + sl;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, end); ctx.closePath();
        ctx.fillStyle = WC[i % WC.length]; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(start + sl / 2);
        ctx.textAlign = 'right'; ctx.fillStyle = '#fff';
        ctx.font = 'bold ' + Math.min(13, 300 / state.gifts.length) + 'px sans-serif';
        ctx.fillText(g.name.length > 14 ? g.name.substring(0, 13) + '…' : g.name, r - 10, 5);
        ctx.restore(); start = end;
    });
    ctx.beginPath(); ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 2; ctx.stroke();
}
var isSpinning = false;
function spinWheel() {
    if (isSpinning) return; isSpinning = true;
    document.getElementById('btn-spin').disabled = true;
    document.getElementById('spin-result').style.display = 'none';
    var spins = 5 + Math.random() * 5, dur = 4000, t0 = performance.now();
    var tot = state.gifts.reduce(function (s, g) { return s + g.probability; }, 0);
    var gi = state.gifts.findIndex(function (g) { return g.name === state.giftName; });
    if (gi < 0) gi = state.gifts.length - 1;
    var cum = 0, tOff = 0;
    for (var i = 0; i <= gi; i++) { var sl = (state.gifts[i].probability / tot) * 2 * Math.PI; if (i === gi) tOff = cum + sl / 2; cum += sl; }
    var tRot = spins * 2 * Math.PI - tOff - Math.PI / 2;
    function ease(t) { return 1 - Math.pow(1 - t, 4); }
    (function anim(now) {
        var p = Math.min((now - t0) / dur, 1); drawWheel(ease(p) * tRot);
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
    document.getElementById('finish-name').textContent = 'Xin chào, ' + state.playerName + '!';
    document.getElementById('finish-score').textContent = state.score;
    document.getElementById('finish-rounds').textContent = state.roundsCompleted + '/' + ROUNDS.length;
    document.getElementById('finish-gift-name').textContent = state.giftName;
    launchConfetti(); showScreen('screen-finish');
}
function launchConfetti() {
    var a = document.getElementById('confetti-area'); a.innerHTML = '';
    var colors = ['#1a73e8', '#f5a623', '#34a853', '#ea4335', '#9c27b0', '#fff'];
    for (var i = 0; i < 60; i++) {
        var p = document.createElement('div'); p.className = 'confetti-piece';
        p.style.left = Math.random() * 100 + '%'; p.style.background = colors[Math.floor(Math.random() * colors.length)];
        p.style.width = p.style.height = (6 + Math.random() * 8) + 'px';
        p.style.animationDuration = (2 + Math.random() * 3) + 's'; p.style.animationDelay = (Math.random() * 2) + 's';
        a.appendChild(p);
    }
}
function restartGame() {
    clearInterval(state.timer); clearInterval(state.hintTimer); clearInterval(state.revTimer);
    if (state.waitPoll) { clearInterval(state.waitPoll); state.waitPoll = null; }
    state = {
        playerId: null, playerName: '', currentRound: 0, score: 0, roundsCompleted: 0, startTime: 0,
        timer: null, timeLeft: 0, hintTimer: null, hintIndex: 0, gifts: [], giftName: '', wonGift: false,
        grid: [], words: [], pieceRots: [], placed: [], dragIdx: -1, touchIdx: -1, touchFloater: null,
        waitPoll: null, revTimer: null, revStep: 0
    };
    document.getElementById('registerForm').reset();
    document.getElementById('register-error').style.display = 'none';
    document.getElementById('btn-register').disabled = false;
    showScreen('screen-register');
}
window.addEventListener('DOMContentLoaded', function () { });
