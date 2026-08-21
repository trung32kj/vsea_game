/**
 * Simple JSON file-based database (no native modules required)
 * Stores data in data/db.json
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'data', 'db.json');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function load() {
  if (!fs.existsSync(DB_PATH)) return null;
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch { return null; }
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function now() {
  return new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

// ── Init ──────────────────────────────────────────────────────────
let db = load();
if (!db) {
  db = {
    admins: [], players: [], gifts: [], results: [],
    gameActive: false, _seq: { admins: 0, players: 0, gifts: 0, results: 0 }
  };
}
if (!db._seq) db._seq = { admins: 0, players: 0, gifts: 0, results: 0 };
if (db.gameActive === undefined) db.gameActive = false;

// Seed admin
if (!db.admins || db.admins.length === 0) {
  db._seq.admins++;
  db.admins = [{
    id: db._seq.admins, username: 'admin',
    password_hash: bcrypt.hashSync('admin123', 10), created_at: now()
  }];
  console.log('Tài khoản admin mặc định: admin / admin123');
}

// Seed gifts
if (!db.gifts || db.gifts.length === 0) {
  const defaultGifts = [
    { name: 'Phần quà đặc biệt', quantity: 5, original_quantity: 5, probability: 5 },
    { name: 'Voucher 50k', quantity: 10, original_quantity: 10, probability: 10 },
    { name: 'Sticker VSEATeam', quantity: 50, original_quantity: 50, probability: 20 },
    { name: 'Bookmark xinh', quantity: 30, original_quantity: 30, probability: 15 },
    { name: 'Kẹo ngọt', quantity: 100, original_quantity: 100, probability: 20 }
  ];
  db.gifts = defaultGifts.map(g => { db._seq.gifts++; return { id: db._seq.gifts, ...g }; });
}
save(db);

// ── DB API ────────────────────────────────────────────────────────
const DB = {
  // ── Game session control ───────────────────────────────────────
  isGameActive() { return db.gameActive === true; },

  startGame() {
    // Reset quà về số lượng ban đầu
    db.gifts = db.gifts.map(g => ({ ...g, quantity: g.original_quantity }));
    db.gameActive = true;
    save(db);
  },

  stopGame() {
    db.gameActive = false;
    save(db);
  },

  // ── Players ────────────────────────────────────────────────────
  createPlayer({ fullName, email, phone, className }) {
    db._seq.players++;
    const player = {
      id: db._seq.players, full_name: fullName, email, phone,
      class_name: className, created_at: now()
    };
    db.players.push(player);
    save(db);
    return player;
  },

  deletePlayer(id) {
    db.players = db.players.filter(p => p.id !== id);
    db.results = db.results.filter(r => r.player_id !== id);
    save(db);
  },

  getAllPlayers() {
    return db.players.map(p => {
      const result = db.results.find(r => r.player_id === p.id);
      return { ...p, ...(result || {}) };
    }).sort((a, b) => b.id - a.id);
  },

  // ── Results ────────────────────────────────────────────────────
  createResult({ playerId, score, timeUsed, roundsCompleted }) {
    const available = db.gifts.filter(g => g.quantity > 0);
    const totalW = available.reduce((s, g) => s + g.probability, 0);
    const roll = Math.random() * 100;
    let wonGift = null, cum = 0;
    for (const g of available) {
      cum += g.probability;
      if (roll < cum) { wonGift = g; break; }
    }
    let giftId = null, giftName = 'Chúc mừng bạn đã tham gia!';
    if (wonGift) {
      const idx = db.gifts.findIndex(g => g.id === wonGift.id);
      if (idx !== -1) db.gifts[idx].quantity = Math.max(0, db.gifts[idx].quantity - 1);
      giftId = wonGift.id; giftName = wonGift.name;
    }
    db._seq.results++;
    const result = {
      id: db._seq.results, player_id: playerId, score: score || 0,
      time_used: timeUsed || 0, rounds_completed: roundsCompleted || 0,
      gift_id: giftId, gift_name: giftName, played_at: now()
    };
    db.results.push(result);
    save(db);
    return { result, wonGift: !!wonGift, giftName };
  },

  // ── Gifts ──────────────────────────────────────────────────────
  getGifts() { return [...db.gifts]; },
  getPublicGifts() {
    return db.gifts.filter(g => g.quantity > 0)
      .map(g => ({ id: g.id, name: g.name, probability: g.probability }));
  },
  createGift({ name, quantity, probability }) {
    db._seq.gifts++;
    const gift = {
      id: db._seq.gifts, name, quantity: +quantity,
      original_quantity: +quantity, probability: +probability
    };
    db.gifts.push(gift);
    save(db);
    return gift;
  },
  updateGift(id, { name, quantity, probability }) {
    const idx = db.gifts.findIndex(g => g.id === id);
    if (idx === -1) return false;
    db.gifts[idx] = { ...db.gifts[idx], name, quantity: +quantity, probability: +probability };
    save(db);
    return true;
  },
  deleteGift(id) { db.gifts = db.gifts.filter(g => g.id !== id); save(db); },
  resetGiftQuantities() {
    db.gifts = db.gifts.map(g => ({ ...g, quantity: g.original_quantity }));
    save(db);
  },

  // ── Stats ──────────────────────────────────────────────────────
  getStats() {
    return {
      totalPlayers: db.players.length,
      totalResults: db.results.length,
      giftsGiven: db.results.filter(r => r.gift_id !== null).length,
      gameActive: db.gameActive,
      gifts: db.gifts.map(g => ({
        name: g.name, original_quantity: g.original_quantity, quantity: g.quantity
      }))
    };
  },

  findAdmin(username) { return db.admins.find(a => a.username === username) || null; }
};

module.exports = DB;
