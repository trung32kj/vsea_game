const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const DB = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'vseateam-secret-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

function requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) return next();
    return res.status(401).json({ success: false, message: 'Unauthorized' });
}

// ─── GAME STATUS ──────────────────────────────────────────────────
// Client polls this to know if game is open
app.get('/api/game/status', (req, res) => {
    res.json({ active: DB.isGameActive() });
});

// ─── GAME ROUTES ──────────────────────────────────────────────────
app.post('/api/player/register', (req, res) => {
    const { fullName, email, phone, className } = req.body;
    if (!fullName || !email || !phone || !className) {
        return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
    }
    try {
        const player = DB.createPlayer({ fullName, email, phone, className });
        // Trả về trạng thái game cùng lúc để client biết có cần chờ không
        res.json({ success: true, playerId: player.id, gameActive: DB.isGameActive() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

app.post('/api/game/result', (req, res) => {
    const { playerId, score, timeUsed, roundsCompleted } = req.body;
    if (!playerId) return res.status(400).json({ success: false, message: 'Missing playerId' });
    try {
        const { result, wonGift, giftName } = DB.createResult({
            playerId: +playerId, score, timeUsed, roundsCompleted
        });
        res.json({ success: true, resultId: result.id, giftName, wonGift });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

app.get('/api/gifts/public', (req, res) => {
    res.json({ success: true, gifts: DB.getPublicGifts() });
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    const admin = DB.findAdmin(username);
    if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
        return res.status(401).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' });
    }
    req.session.isAdmin = true;
    req.session.adminId = admin.id;
    res.json({ success: true });
});

app.post('/api/admin/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/admin/check', (req, res) => {
    res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

// Start game session – also resets gift quantities
app.post('/api/admin/game/start', requireAdmin, (req, res) => {
    DB.startGame();
    res.json({ success: true, message: 'Game đã được mở. Quà đã reset.' });
});

// Stop game session
app.post('/api/admin/game/stop', requireAdmin, (req, res) => {
    DB.stopGame();
    res.json({ success: true, message: 'Game đã đóng.' });
});

app.get('/api/admin/players', requireAdmin, (req, res) => {
    res.json({ success: true, players: DB.getAllPlayers() });
});

app.delete('/api/admin/players/:id', requireAdmin, (req, res) => {
    DB.deletePlayer(+req.params.id);
    res.json({ success: true });
});

app.get('/api/admin/gifts', requireAdmin, (req, res) => {
    res.json({ success: true, gifts: DB.getGifts() });
});

app.post('/api/admin/gifts', requireAdmin, (req, res) => {
    const { name, quantity, probability } = req.body;
    if (!name || quantity == null || probability == null) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin quà' });
    }
    const gift = DB.createGift({ name, quantity, probability });
    res.json({ success: true, id: gift.id });
});

app.put('/api/admin/gifts/:id', requireAdmin, (req, res) => {
    const { name, quantity, probability } = req.body;
    DB.updateGift(+req.params.id, { name, quantity, probability });
    res.json({ success: true });
});

app.delete('/api/admin/gifts/:id', requireAdmin, (req, res) => {
    DB.deleteGift(+req.params.id);
    res.json({ success: true });
});

app.post('/api/admin/gifts/reset', requireAdmin, (req, res) => {
    DB.resetGiftQuantities();
    res.json({ success: true });
});

app.get('/api/admin/stats', requireAdmin, (req, res) => {
    res.json({ success: true, ...DB.getStats() });
});

// ─── PAGES ────────────────────────────────────────────────────────
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ VSEATeam Word Search: http://localhost:${PORT}`);
    console.log(`🔧 Admin panel:          http://localhost:${PORT}/admin`);
});
