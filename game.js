// ============================================================
// CONFIG
// ============================================================
const CONFIG = {
  canvasWidth: 800,
  canvasHeight: 500,
  pathWidth: 40,
  enemySpeed: 1.3,
  explosionParticles: 16,
  particleLife: 0.55,
  particleSpeed: 3.2,
  baseUpgradeCost: 35,
  upgradeCostMultiplier: 1.55,
  sellRefundPercent: 0.55,
  wavesToClear: 3,
  // Feedback
  damageNumberLife: 0.7
};

// ============================================================
// TOWER TYPES (progression unlocks)
// ============================================================
const TOWER_TYPES = {
  basic: {
    id: 'basic',
    name: 'Basic',
    emoji: '🔵',
    cost: 50,
    range: 120,
    damage: 25,
    fireRate: 0.9,
    color: '#4a90d9',
    unlockStage: 0,          // available from start
    desc: 'Balanced all-rounder',
    special: null,
    damageUp: 10,
    rangeUp: 15,
    fireRateUp: 0.12
  },
  sniper: {
    id: 'sniper',
    name: 'Sniper',
    emoji: '🎯',
    cost: 80,
    range: 220,
    damage: 55,
    fireRate: 0.45,
    color: '#9b59b6',
    unlockStage: 1,          // unlock after clearing stage 1
    desc: 'Long range, high damage',
    special: 'Long range',
    damageUp: 18,
    rangeUp: 20,
    fireRateUp: 0.06
  },
  cannon: {
    id: 'cannon',
    name: 'Cannon',
    emoji: '💣',
    cost: 90,
    range: 100,
    damage: 30,
    fireRate: 0.55,
    color: '#e67e22',
    unlockStage: 2,
    desc: 'Splash damage',
    special: 'Splash 50px',
    splashRadius: 50,
    damageUp: 12,
    rangeUp: 12,
    fireRateUp: 0.08
  },
  frost: {
    id: 'frost',
    name: 'Frost',
    emoji: '❄️',
    cost: 75,
    range: 110,
    damage: 12,
    fireRate: 1.1,
    color: '#3498db',
    unlockStage: 3,
    desc: 'Slows enemies 40%',
    special: 'Slow 40%',
    slowFactor: 0.6,         // multiply speed by this
    slowDuration: 1.5,
    damageUp: 6,
    rangeUp: 12,
    fireRateUp: 0.15
  }
};

// ============================================================
// STAGES (puzzle-like unique layouts + modifiers)
// ============================================================
const STAGES = [
  {
    id: 0,
    name: 'Stage 1 – The Approach',
    desc: 'Learn the basics • Simple path',
    startingMoney: 120,
    startingLives: 20,
    enemyHealthMult: 1.0,
    enemySpeedMult: 1.0,
    enemyCountBase: 5,
    path: [
      { x: 0, y: 250 }, { x: 150, y: 250 }, { x: 150, y: 100 },
      { x: 400, y: 100 }, { x: 400, y: 400 }, { x: 650, y: 400 },
      { x: 650, y: 200 }, { x: 800, y: 200 }
    ]
  },
  {
    id: 1,
    name: 'Stage 2 – Crossroads',
    desc: 'Sharp turns • Plan placements carefully',
    startingMoney: 100,
    startingLives: 18,
    enemyHealthMult: 1.25,
    enemySpeedMult: 1.1,
    enemyCountBase: 6,
    path: [
      { x: 0, y: 80 }, { x: 200, y: 80 }, { x: 200, y: 250 },
      { x: 500, y: 250 }, { x: 500, y: 80 }, { x: 700, y: 80 },
      { x: 700, y: 400 }, { x: 300, y: 400 }, { x: 300, y: 300 },
      { x: 800, y: 300 }
    ]
  },
  {
    id: 2,
    name: 'Stage 3 – The Spiral',
    desc: 'Tight spaces • Limited tower spots',
    startingMoney: 90,
    startingLives: 16,
    enemyHealthMult: 1.5,
    enemySpeedMult: 1.2,
    enemyCountBase: 7,
    path: [
      { x: 0, y: 250 }, { x: 120, y: 250 }, { x: 120, y: 100 },
      { x: 680, y: 100 }, { x: 680, y: 400 }, { x: 200, y: 400 },
      { x: 200, y: 200 }, { x: 500, y: 200 }, { x: 500, y: 320 },
      { x: 800, y: 320 }
    ]
  },
  {
    id: 3,
    name: 'Stage 4 – Mountain Pass',
    desc: 'Long zigzag • Endurance challenge',
    startingMoney: 80,
    startingLives: 15,
    enemyHealthMult: 1.8,
    enemySpeedMult: 1.3,
    enemyCountBase: 8,
    path: [
      { x: 0, y: 400 }, { x: 100, y: 400 }, { x: 100, y: 100 },
      { x: 250, y: 100 }, { x: 250, y: 350 }, { x: 400, y: 350 },
      { x: 400, y: 80 }, { x: 550, y: 80 }, { x: 550, y: 420 },
      { x: 700, y: 420 }, { x: 700, y: 200 }, { x: 800, y: 200 }
    ]
  }
];

// ============================================================
// PERSISTENCE
// ============================================================
const SAVE_KEY = 'td_progress_v2';

function loadProgress() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (data && Array.isArray(data.unlocked)) return data;
  } catch (e) {}
  return { unlocked: [0], cleared: [], towers: ['basic'] };
}

function saveProgress(p) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(p));
}

let progress = loadProgress();

// ============================================================
// GAME STATE
// ============================================================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let currentStage = null;
let PATH = [];
let money = 100;
let lives = 20;
let wave = 0;
let placingTower = false;
let selectedTowerType = null;   // which type player is placing
let selectedTower = null;       // tower instance for upgrades
let towers = [];
let enemies = [];
let projectiles = [];
let particles = [];
let damageNumbers = [];
let lastTime = 0;
let spawnTimer = 0;
let enemiesToSpawn = 0;
let stageCleared = false;
let gameOver = false;
let animFrameId = null;

// ============================================================
// CLASSES
// ============================================================
class Tower {
  constructor(x, y, typeId) {
    const t = TOWER_TYPES[typeId];
    this.x = x;
    this.y = y;
    this.typeId = typeId;
    this.type = t;
    this.level = 1;
    this.range = t.range;
    this.damage = t.damage;
    this.fireRate = t.fireRate;
    this.cooldown = 0;
    this.totalInvested = t.cost;
    this.splashRadius = t.splashRadius || 0;
    this.slowFactor = t.slowFactor || 1;
    this.slowDuration = t.slowDuration || 0;
  }

  getUpgradeCost() {
    return Math.floor(CONFIG.baseUpgradeCost * Math.pow(CONFIG.upgradeCostMultiplier, this.level - 1));
  }

  getSellValue() {
    return Math.floor(this.totalInvested * CONFIG.sellRefundPercent);
  }

  upgrade() {
    const cost = this.getUpgradeCost();
    if (money < cost) return false;
    money -= cost;
    this.totalInvested += cost;
    this.level++;
    this.damage += this.type.damageUp;
    this.range += this.type.rangeUp;
    this.fireRate += this.type.fireRateUp;
    if (this.splashRadius) this.splashRadius += 5;
    updateUI();
    // Immediate feedback particle burst
    createUpgradeBurst(this.x, this.y, this.type.color);
    return true;
  }

  update(dt) {
    this.cooldown -= dt;
    if (this.cooldown <= 0) {
      const target = this.findTarget();
      if (target) {
        projectiles.push(new Projectile(this.x, this.y, target, this));
        this.cooldown = 1 / this.fireRate;
      }
    }
  }

  findTarget() {
    let closest = null;
    let closestDist = Infinity;
    for (const e of enemies) {
      if (e.dead) continue;
      const d = dist(this.x, this.y, e.x, e.y);
      if (d <= this.range && d < closestDist) {
        closest = e;
        closestDist = d;
      }
    }
    return closest;
  }

  draw() {
    // Range when selected
    if (selectedTower === this) {
      ctx.strokeStyle = this.type.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = this.type.color.replace(')', ', 0.3)').replace('rgb', 'rgba').replace('#', '');
      // simple alpha range
      ctx.strokeStyle = hexToRgba(this.type.color, 0.3);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = hexToRgba(this.type.color, 0.15);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Body
    ctx.fillStyle = this.type.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 17, 0, Math.PI * 2);
    ctx.fill();

    // Inner detail
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(this.x - 4, this.y - 4, 6, 0, Math.PI * 2);
    ctx.fill();

    // Level badge
    if (this.level > 1) {
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(this.x + 12, this.y - 12, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.level, this.x + 12, this.y - 12);
    }
  }
}

class Enemy {
  constructor() {
    this.pathIndex = 0;
    this.x = PATH[0].x;
    this.y = PATH[0].y;
    const s = currentStage;
    const waveScale = 1 + (wave - 1) * 0.2;
    this.baseSpeed = CONFIG.enemySpeed * s.enemySpeedMult * (0.95 + Math.random() * 0.1);
    this.speed = this.baseSpeed;
    this.health = Math.floor(100 * s.enemyHealthMult * waveScale);
    this.maxHealth = this.health;
    this.dead = false;
    this.reachedEnd = false;
    this.slowTimer = 0;
  }

  applySlow(factor, duration) {
    this.speed = this.baseSpeed * factor;
    this.slowTimer = Math.max(this.slowTimer, duration);
  }

  update(dt) {
    if (this.dead || this.reachedEnd) return;

    // Slow decay
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) this.speed = this.baseSpeed;
    }

    const target = PATH[this.pathIndex + 1];
    if (!target) {
      this.reachedEnd = true;
      lives--;
      updateUI();
      return;
    }
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance < this.speed) {
      this.pathIndex++;
      this.x = target.x;
      this.y = target.y;
    } else {
      this.x += (dx / distance) * this.speed;
      this.y += (dy / distance) * this.speed;
    }
  }

  takeDamage(amount, color) {
    this.health -= amount;
    spawnDamageNumber(this.x, this.y - 20, amount, color || '#fff');
    if (this.health <= 0) {
      this.dead = true;
      money += 12 + wave * 3;
      updateUI();
      createExplosion(this.x, this.y);
    }
  }

  draw() {
    if (this.dead) return;
    // Slow tint
    ctx.fillStyle = this.slowTimer > 0 ? '#7ec8e3' : '#e94560';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 13, 0, Math.PI * 2);
    ctx.fill();

    const barW = 26, barH = 4;
    ctx.fillStyle = '#333';
    ctx.fillRect(this.x - barW / 2, this.y - 20, barW, barH);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(this.x - barW / 2, this.y - 20, barW * Math.max(0, this.health / this.maxHealth), barH);
  }
}

class Projectile {
  constructor(x, y, target, tower) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.tower = tower;
    this.damage = tower.damage;
    this.speed = 7;
    this.dead = false;
    this.color = tower.type.color;
  }

  update(dt) {
    if (this.dead || this.target.dead) {
      this.dead = true;
      return;
    }
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance < this.speed) {
      this.hit();
      this.dead = true;
    } else {
      this.x += (dx / distance) * this.speed;
      this.y += (dy / distance) * this.speed;
    }
  }

  hit() {
    const t = this.tower;
    // Splash
    if (t.splashRadius > 0) {
      for (const e of enemies) {
        if (e.dead) continue;
        if (dist(this.target.x, this.target.y, e.x, e.y) <= t.splashRadius) {
          e.takeDamage(this.damage, t.type.color);
        }
      }
      createSplashRing(this.target.x, this.target.y, t.splashRadius, t.type.color);
    } else {
      this.target.takeDamage(this.damage, t.type.color);
    }
    // Slow
    if (t.slowFactor < 1) {
      this.target.applySlow(t.slowFactor, t.slowDuration);
    }
    createHitSparks(this.x, this.y, t.type.color);
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Particle {
  constructor(x, y, options = {}) {
    this.x = x;
    this.y = y;
    const angle = options.angle ?? Math.random() * Math.PI * 2;
    const speed = options.speed ?? (Math.random() * CONFIG.particleSpeed + 1);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = options.life ?? CONFIG.particleLife;
    this.maxLife = this.life;
    this.size = options.size ?? (Math.random() * 4 + 2);
    this.color = options.color ?? '#ff6b35';
    this.gravity = options.gravity ?? 0.05;
    this.dead = false;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) { this.dead = true; return; }
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.vx *= 0.97;
    this.vy *= 0.97;
  }

  draw() {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

class DamageNumber {
  constructor(x, y, amount, color) {
    this.x = x;
    this.y = y;
    this.amount = Math.round(amount);
    this.color = color;
    this.life = CONFIG.damageNumberLife;
    this.maxLife = this.life;
    this.vy = -40;
    this.dead = false;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) { this.dead = true; return; }
    this.y += this.vy * dt;
    this.vy *= 0.95;
  }

  draw() {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('-' + this.amount, this.x, this.y);
    ctx.globalAlpha = 1;
  }
}

// ============================================================
// EFFECTS
// ============================================================
function createExplosion(x, y) {
  for (let i = 0; i < CONFIG.explosionParticles; i++) {
    particles.push(new Particle(x, y, {
      speed: Math.random() * CONFIG.particleSpeed + 1.2,
      size: Math.random() * 5 + 2,
      life: CONFIG.particleLife + Math.random() * 0.25,
      color: ['#ff6b35', '#f7c59f', '#ff9f1c', '#e94560'][Math.floor(Math.random() * 4)]
    }));
  }
}

function createHitSparks(x, y, color) {
  for (let i = 0; i < 5; i++) {
    particles.push(new Particle(x, y, {
      speed: Math.random() * 2 + 0.5,
      size: Math.random() * 3 + 1,
      life: 0.25,
      color: color || '#f1c40f',
      gravity: 0.02
    }));
  }
}

function createUpgradeBurst(x, y, color) {
  for (let i = 0; i < 12; i++) {
    particles.push(new Particle(x, y, {
      speed: Math.random() * 3 + 1,
      size: Math.random() * 4 + 2,
      life: 0.4,
      color: color || '#f1c40f',
      gravity: -0.02
    }));
  }
}

function createSplashRing(x, y, radius, color) {
  // visual ring particles
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    particles.push(new Particle(
      x + Math.cos(angle) * radius * 0.3,
      y + Math.sin(angle) * radius * 0.3,
      {
        angle,
        speed: radius / 15,
        size: 3,
        life: 0.3,
        color: color || '#e67e22',
        gravity: 0
      }
    ));
  }
}

function spawnDamageNumber(x, y, amount, color) {
  damageNumbers.push(new DamageNumber(x + (Math.random() * 16 - 8), y, amount, color));
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ============================================================
// UI HELPERS
// ============================================================
const upgradePanel = document.getElementById('upgrade-panel');
const towerPicker = document.getElementById('tower-picker');

function showUpgradePanel(tower) {
  selectedTower = tower;
  document.getElementById('tower-type-name').textContent = tower.type.name;
  document.getElementById('tower-level').textContent = tower.level;
  document.getElementById('stat-damage').textContent = tower.damage;
  document.getElementById('stat-range').textContent = Math.round(tower.range);
  document.getElementById('stat-firerate').textContent = tower.fireRate.toFixed(2);
  document.getElementById('upgrade-cost').textContent = tower.getUpgradeCost();
  document.getElementById('sell-value').textContent = tower.getSellValue();

  const specialRow = document.getElementById('stat-special-row');
  if (tower.type.special) {
    specialRow.classList.remove('hidden');
    document.getElementById('stat-special').textContent = tower.type.special;
  } else {
    specialRow.classList.add('hidden');
  }
  upgradePanel.classList.remove('hidden');
}

function hideUpgradePanel() {
  selectedTower = null;
  upgradePanel.classList.add('hidden');
}

function showTowerPicker() {
  const opts = document.getElementById('tower-options');
  opts.innerHTML = '';
  for (const id of progress.towers) {
    const t = TOWER_TYPES[id];
    const btn = document.createElement('button');
    btn.className = 'tower-option';
    btn.innerHTML = `
      <span>${t.emoji}</span>
      <span class="opt-name">${t.name}</span>
      <span class="opt-cost">$${t.cost}</span>
      <span class="opt-desc">${t.desc}</span>
    `;
    btn.addEventListener('click', () => {
      if (money < t.cost) {
        showMessage('Not enough money!');
        return;
      }
      selectedTowerType = id;
      placingTower = true;
      towerPicker.classList.add('hidden');
      showMessage('Tap map to place ' + t.name);
    });
    opts.appendChild(btn);
  }
  towerPicker.classList.remove('hidden');
  hideUpgradePanel();
}

function hideTowerPicker() {
  towerPicker.classList.add('hidden');
  placingTower = false;
  selectedTowerType = null;
}

function updateUI() {
  document.getElementById('money').textContent = money;
  document.getElementById('lives').textContent = lives;
  document.getElementById('wave').textContent = wave;
}

function showMessage(text, duration = 2000) {
  const el = document.getElementById('message');
  el.textContent = text;
  setTimeout(() => { if (el.textContent === text) el.textContent = ''; }, duration);
}

function dist(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function isOnPath(x, y) {
  for (let i = 0; i < PATH.length - 1; i++) {
    const p1 = PATH[i], p2 = PATH[i + 1];
    if (pointToSegmentDistance(x, y, p1.x, p1.y, p2.x, p2.y) < CONFIG.pathWidth) return true;
  }
  return false;
}

function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
  const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = lenSq !== 0 ? dot / lenSq : -1;
  let xx, yy;
  if (param < 0) { xx = x1; yy = y1; }
  else if (param > 1) { xx = x2; yy = y2; }
  else { xx = x1 + param * C; yy = y1 + param * D; }
  return Math.hypot(px - xx, py - yy);
}

function findTowerAt(x, y) {
  for (const t of towers) {
    if (dist(x, y, t.x, t.y) < 22) return t;
  }
  return null;
}

// ============================================================
// MENU & STAGE
// ============================================================
function renderUnlockedTowers() {
  const el = document.getElementById('unlocked-towers');
  el.innerHTML = '';
  for (const key of Object.keys(TOWER_TYPES)) {
    const t = TOWER_TYPES[key];
    const unlocked = progress.towers.includes(key);
    const badge = document.createElement('span');
    badge.className = 'tower-badge' + (unlocked ? '' : ' locked-badge');
    badge.textContent = (unlocked ? t.emoji + ' ' : '🔒 ') + t.name;
    el.appendChild(badge);
  }
}

function renderStageList() {
  const list = document.getElementById('stage-list');
  list.innerHTML = '';
  STAGES.forEach((stage) => {
    const unlocked = progress.unlocked.includes(stage.id);
    const cleared = progress.cleared.includes(stage.id);
    const btn = document.createElement('button');
    btn.className = 'stage-btn';
    btn.disabled = !unlocked;

    let statusClass = 'status-locked', statusText = '🔒 Locked';
    if (cleared) { statusClass = 'status-cleared'; statusText = '★ Cleared'; }
    else if (unlocked) { statusClass = 'status-unlocked'; statusText = '▶ Play'; }

    btn.innerHTML = `
      <div class="stage-info">
        <span class="stage-title">${stage.name}</span>
        <span class="stage-desc">${stage.desc}</span>
      </div>
      <span class="stage-status ${statusClass}">${statusText}</span>
    `;
    if (unlocked) btn.addEventListener('click', () => startStage(stage.id));
    list.appendChild(btn);
  });
}

function showMainMenu() {
  if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
  document.getElementById('main-menu').classList.remove('hidden');
  document.getElementById('game-screen').classList.add('hidden');
  document.getElementById('stage-complete').classList.add('hidden');
  document.getElementById('game-over').classList.add('hidden');
  hideUpgradePanel();
  hideTowerPicker();
  renderUnlockedTowers();
  renderStageList();
}

function startStage(stageId) {
  currentStage = STAGES[stageId];
  PATH = currentStage.path;

  money = currentStage.startingMoney;
  lives = currentStage.startingLives;
  wave = 0;
  placingTower = false;
  selectedTowerType = null;
  selectedTower = null;
  towers = [];
  enemies = [];
  projectiles = [];
  particles = [];
  damageNumbers = [];
  enemiesToSpawn = 0;
  spawnTimer = 0;
  stageCleared = false;
  gameOver = false;
  lastTime = 0;

  document.getElementById('stage-name').textContent = currentStage.name;
  document.getElementById('main-menu').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  document.getElementById('stage-complete').classList.add('hidden');
  document.getElementById('game-over').classList.add('hidden');
  hideUpgradePanel();
  hideTowerPicker();
  updateUI();
  showMessage(currentStage.desc);

  animFrameId = requestAnimationFrame(gameLoop);
}

function onStageCleared() {
  stageCleared = true;
  if (!progress.cleared.includes(currentStage.id)) {
    progress.cleared.push(currentStage.id);
  }
  // Unlock next stage
  const nextId = currentStage.id + 1;
  if (nextId < STAGES.length && !progress.unlocked.includes(nextId)) {
    progress.unlocked.push(nextId);
  }
  // Unlock tower for this stage clear
  let unlockMsg = '';
  for (const key of Object.keys(TOWER_TYPES)) {
    const t = TOWER_TYPES[key];
    if (t.unlockStage === currentStage.id + 1 && !progress.towers.includes(key)) {
      // unlocked after clearing this stage (unlockStage matches next)
    }
    if (t.unlockStage === currentStage.id && !progress.towers.includes(key) && key !== 'basic') {
      // already available if unlockStage <= cleared
    }
  }
  // Simpler: unlock tower whose unlockStage === next stage id, or unlockStage === cleared stage + 1
  for (const key of Object.keys(TOWER_TYPES)) {
    const t = TOWER_TYPES[key];
    if (t.unlockStage === currentStage.id + 1 && !progress.towers.includes(key)) {
      progress.towers.push(key);
      unlockMsg = `New tower unlocked: ${t.emoji} ${t.name}!`;
    }
  }
  // Also unlock towers that should be available at this stage index
  for (const key of Object.keys(TOWER_TYPES)) {
    const t = TOWER_TYPES[key];
    if (t.unlockStage <= currentStage.id + 1 && !progress.towers.includes(key)) {
      progress.towers.push(key);
      if (!unlockMsg) unlockMsg = `New tower unlocked: ${t.emoji} ${t.name}!`;
    }
  }

  saveProgress(progress);

  document.getElementById('complete-msg').textContent = 'You survived 3 waves!';
  const um = document.getElementById('unlock-msg');
  if (unlockMsg) {
    um.textContent = unlockMsg;
    um.classList.remove('hidden');
  } else {
    um.classList.add('hidden');
  }
  document.getElementById('stage-complete').classList.remove('hidden');
}

function onGameOver() {
  gameOver = true;
  document.getElementById('game-over').classList.remove('hidden');
}

// ============================================================
// GAME LOOP
// ============================================================
function gameLoop(timestamp) {
  if (gameOver || stageCleared) return;

  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Path
  ctx.strokeStyle = '#3a3a5a';
  ctx.lineWidth = CONFIG.pathWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(PATH[0].x, PATH[0].y);
  for (let i = 1; i < PATH.length; i++) ctx.lineTo(PATH[i].x, PATH[i].y);
  ctx.stroke();

  // Spawn
  if (enemiesToSpawn > 0) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      try {
        enemies.push(new Enemy());
        enemiesToSpawn--;
        spawnTimer = Math.max(0.35, 0.7 - wave * 0.05);
      } catch (err) {
        console.error('Spawn error:', err);
        enemiesToSpawn = 0;
      }
    }
  }

  for (const t of towers) { t.update(dt); t.draw(); }
  for (const e of enemies) { e.update(dt); e.draw(); }
  for (const p of projectiles) { p.update(dt); p.draw(); }
  for (const p of particles) { p.update(dt); p.draw(); }
  for (const d of damageNumbers) { d.update(dt); d.draw(); }

  enemies = enemies.filter(e => !e.dead && !e.reachedEnd);
  projectiles = projectiles.filter(p => !p.dead);
  particles = particles.filter(p => !p.dead);
  damageNumbers = damageNumbers.filter(d => !d.dead);

  if (lives <= 0) { onGameOver(); return; }

  if (wave >= CONFIG.wavesToClear && enemies.length === 0 && enemiesToSpawn === 0) {
    onStageCleared();
    return;
  }

  animFrameId = requestAnimationFrame(gameLoop);
}

// ============================================================
// INPUT (mouse + touch)
// ============================================================
function handleCanvasClick(x, y) {
  if (gameOver || stageCleared) return;

  if (placingTower && selectedTowerType) {
    const tDef = TOWER_TYPES[selectedTowerType];
    if (money < tDef.cost) {
      showMessage('Not enough money!');
      hideTowerPicker();
      return;
    }
    if (isOnPath(x, y)) {
      showMessage('Cannot place on path!');
      return;
    }
    for (const t of towers) {
      if (dist(x, y, t.x, t.y) < 40) {
        showMessage('Too close to another tower!');
        return;
      }
    }
    towers.push(new Tower(x, y, selectedTowerType));
    money -= tDef.cost;
    placingTower = false;
    selectedTowerType = null;
    hideUpgradePanel();
    updateUI();
    showMessage(tDef.name + ' placed!');
    // Placement feedback
    createUpgradeBurst(x, y, tDef.color);
    return;
  }

  const clicked = findTowerAt(x, y);
  if (clicked) {
    showUpgradePanel(clicked);
    return;
  }
  hideUpgradePanel();
}

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  handleCanvasClick((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
});

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  if (e.changedTouches.length === 0) return;
  const touch = e.changedTouches[0];
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  handleCanvasClick((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
}, { passive: false });

document.getElementById('btn-tower').addEventListener('click', () => {
  if (gameOver || stageCleared) return;
  showTowerPicker();
});

document.getElementById('btn-cancel-place').addEventListener('click', hideTowerPicker);

document.getElementById('btn-start').addEventListener('click', () => {
  if (gameOver || stageCleared) return;
  if (enemiesToSpawn > 0 || enemies.length > 0) {
    showMessage('Wave still in progress!');
    return;
  }
  if (wave >= CONFIG.wavesToClear) {
    showMessage('All waves cleared!');
    return;
  }
  wave++;
  const base = currentStage.enemyCountBase;
  enemiesToSpawn = base + wave * 2 + currentStage.id;
  spawnTimer = 0;
  // Spawn first enemy immediately so player sees action right away
  if (enemiesToSpawn > 0) {
    enemies.push(new Enemy());
    enemiesToSpawn--;
    spawnTimer = 0.6;
  }
  updateUI();
  showMessage('Wave ' + wave + ' — ' + (enemiesToSpawn + 1) + ' enemies');
});

document.getElementById('btn-upgrade').addEventListener('click', () => {
  if (!selectedTower) return;
  if (money < selectedTower.getUpgradeCost()) {
    showMessage('Not enough money!');
    return;
  }
  const prevDmg = selectedTower.damage;
  selectedTower.upgrade();
  showUpgradePanel(selectedTower);
  showMessage('+' + (selectedTower.damage - prevDmg) + ' damage! Lv.' + selectedTower.level);
});

document.getElementById('btn-sell').addEventListener('click', () => {
  if (!selectedTower) return;
  const value = selectedTower.getSellValue();
  money += value;
  towers = towers.filter(t => t !== selectedTower);
  hideUpgradePanel();
  updateUI();
  showMessage('Sold for $' + value);
});

document.getElementById('btn-close-panel').addEventListener('click', hideUpgradePanel);

document.getElementById('btn-back-menu').addEventListener('click', showMainMenu);
document.getElementById('btn-back-from-complete').addEventListener('click', showMainMenu);
document.getElementById('btn-back-from-over').addEventListener('click', showMainMenu);

document.getElementById('btn-next-stage').addEventListener('click', () => {
  const nextId = currentStage.id + 1;
  if (nextId < STAGES.length && progress.unlocked.includes(nextId)) {
    startStage(nextId);
  } else {
    showMainMenu();
  }
});

document.getElementById('btn-retry').addEventListener('click', () => startStage(currentStage.id));

document.getElementById('btn-reset-progress').addEventListener('click', () => {
  if (confirm('Reset all progress?')) {
    progress = { unlocked: [0], cleared: [], towers: ['basic'] };
    saveProgress(progress);
    renderUnlockedTowers();
    renderStageList();
  }
});

// ============================================================
// BOOT
// ============================================================
showMainMenu();