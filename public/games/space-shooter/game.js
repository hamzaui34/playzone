const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

console.log('[SpaceShooter] Starting initialization...');

let W, H;

function resize() {
  const container = document.getElementById('canvas-wrapper');
  W = canvas.width = container.offsetWidth;
  H = canvas.height = container.offsetHeight;
  console.log('[SpaceShooter] Canvas resized:', W, 'x', H);
}

resize();
window.addEventListener('resize', resize);

console.log('[SpaceShooter] Canvas initialized');

const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const healthFill = document.getElementById('health-fill');
const waveNumEl = document.getElementById('wave-num');
const menuScreen = document.getElementById('menu-screen');
const pauseScreen = document.getElementById('pause-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const bossWarning = document.getElementById('boss-warning');
const victoryScreen = document.getElementById('victory-screen');

const finalScoreEl = document.getElementById('final-score');
const finalWaveEl = document.getElementById('final-wave');
const finalKillsEl = document.getElementById('final-kills');
const newHighBadge = document.getElementById('new-high-badge');

let audioContext = null;
let soundEnabled = localStorage.getItem('spaceShooterSound') !== 'false';
let audioInitialized = false;

function initAudio() {
  if (audioInitialized) return;
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioInitialized = true;
  } catch (e) {}
}

function playSound(type) {
  if (!soundEnabled || !audioContext) return;
  try {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    switch(type) {
      case 'shoot':
        osc.frequency.setValueAtTime(880, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        osc.start();
        osc.stop(audioContext.currentTime + 0.1);
        break;
      case 'explosion':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, audioContext.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        osc.start();
        osc.stop(audioContext.currentTime + 0.3);
        break;
      case 'hit':
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        osc.start();
        osc.stop(audioContext.currentTime + 0.15);
        break;
      case 'powerup':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, audioContext.currentTime);
        osc.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        osc.start();
        osc.stop(audioContext.currentTime + 0.3);
        break;
      case 'boss':
        osc.type = 'square';
        osc.frequency.setValueAtTime(110, audioContext.currentTime);
        osc.frequency.setValueAtTime(82, audioContext.currentTime + 0.2);
        gain.gain.setValueAtTime(0.12, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        osc.start();
        osc.stop(audioContext.currentTime + 0.4);
        break;
    }
  } catch (e) {}
}

let game = {
  running: false,
  paused: false,
  started: false,
  score: 0,
  highScore: parseInt(localStorage.getItem('spaceShooterHighScore')) || 0,
  wave: 1,
  kills: 0,
  health: 100,
  maxHealth: 100,
  lastTime: 0,
  spawnTimer: 0,
  waveTimer: 0,
  bossTimer: 0,
  difficulty: 1,
  shakeTimer: 0,
  shakeIntensity: 0,
  zone: 'normal',
  powerups: [],
  playerLevel: 1,
  fireRate: 1,
  bulletDamage: 1
};

highScoreEl.textContent = game.highScore;

let player = {
  x: 0, y: 0,
  width: 50, height: 60,
  speed: 7,
  shootCooldown: 0,
  invincible: 0,
  engineParticles: [],
  weaponLevel: 1,
  autoFire: false
};

let bullets = [];
let enemies = [];
let particles = [];
let stars = [];
let nebulaClouds = [];
let asteroids = [];
let powerups = [];

function initStars() {
  stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 2.5 + 0.5,
      speed: Math.random() * 3 + 0.5,
      brightness: Math.random() * 0.5 + 0.5,
      twinkle: Math.random() * Math.PI * 2
    });
  }
}

function initNebula() {
  nebulaClouds = [];
  for (let i = 0; i < 8; i++) {
    nebulaClouds.push({
      x: Math.random() * W,
      y: Math.random() * H,
      radius: 80 + Math.random() * 180,
      color: Math.random() > 0.5 ? 
        `rgba(${Math.floor(Math.random() * 100)}, 0, ${Math.floor(150 + Math.random() * 100)}, 0.08)` :
        `rgba(0, ${Math.floor(80 + Math.random() * 100)}, ${Math.floor(150 + Math.random() * 100)}, 0.08)`,
      moveX: (Math.random() - 0.5) * 0.2,
      moveY: (Math.random() - 0.5) * 0.1
    });
  }
}

function initAsteroids() {
  asteroids = [];
  if (game.zone === 'asteroid' || game.zone === 'danger') {
    for (let i = 0; i < 15; i++) {
      asteroids.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: 20 + Math.random() * 40,
        speed: 0.5 + Math.random() * 1.5,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        vertices: generateAsteroidVertices()
      });
    }
  }
}

function generateAsteroidVertices() {
  const vertices = [];
  const points = 7 + Math.floor(Math.random() * 4);
  for (let i = 0; i < points; i++) {
    const angle = (Math.PI * 2 / points) * i;
    const radius = 0.7 + Math.random() * 0.4;
    vertices.push({ angle, radius });
  }
  return vertices;
}

function initGame() {
  player.x = W / 2;
  player.y = H - 100;
  player.shootCooldown = 0;
  player.invincible = 0;
  player.engineParticles = [];
  player.weaponLevel = 1;
  player.autoFire = true;
  
  bullets = [];
  enemies = [];
  particles = [];
  asteroids = [];
  powerups = [];
  
  game.score = 0;
  game.wave = 1;
  game.kills = 0;
  game.health = 100;
  game.difficulty = 1;
  game.spawnTimer = 0;
  game.waveTimer = 0;
  game.bossTimer = 0;
  game.zone = 'normal';
  game.powerups = [];
  game.playerLevel = 1;
  game.fireRate = 1;
  game.bulletDamage = 1;
  
  scoreEl.textContent = '0';
  healthFill.style.width = '100%';
  waveNumEl.textContent = '1';
  
  initStars();
  initNebula();
  initAsteroids();
}

const keys = {};
let touchStartX = 0, touchStartY = 0;
let touchMoveX = 0, touchMoveY = 0;
let isFiring = false;
let joystickActive = false;
let joystickX = 0, joystickY = 0;

document.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
    if (game.started && !game.paused) player.autoFire = true;
  }
  if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && game.started) {
    if (!game.paused) {
      game.paused = true;
      pauseScreen.classList.remove('hidden');
    }
  }
});

document.addEventListener('keyup', e => {
  keys[e.key] = false;
  if (e.key === ' ' || e.key === 'Spacebar') {
    player.autoFire = false;
  }
});

const joystickBase = document.getElementById('joystick-base');
const joystickThumb = document.getElementById('joystick-thumb');
const joystickZone = document.getElementById('joystick-zone');

let joystickCenter = { x: 0, y: 0 };

function handleJoystickStart(e) {
  e.preventDefault();
  initAudio();
  const touch = e.touches ? e.touches[0] : e;
  const rect = joystickBase.getBoundingClientRect();
  joystickCenter = { 
    x: rect.left + rect.width / 2, 
    y: rect.top + rect.height / 2 
  };
  joystickActive = true;
  handleJoystickMove(e);
}

function handleJoystickMove(e) {
  if (!joystickActive) return;
  e.preventDefault();
  const touch = e.touches ? e.touches[0] : e;
  const dx = touch.clientX - joystickCenter.x;
  const dy = touch.clientY - joystickCenter.y;
  const maxDist = 40;
  const dist = Math.min(Math.sqrt(dx*dx + dy*dy), maxDist);
  const angle = Math.atan2(dy, dx);
  
  joystickX = Math.cos(angle) * dist / maxDist;
  joystickY = Math.sin(angle) * dist / maxDist;
  
  joystickThumb.style.transform = `translate(${joystickX * maxDist}px, ${joystickY * maxDist}px)`;
}

function handleJoystickEnd(e) {
  e.preventDefault();
  joystickActive = false;
  joystickX = 0;
  joystickY = 0;
  joystickThumb.style.transform = 'translate(0, 0)';
}

joystickZone.addEventListener('touchstart', handleJoystickStart, { passive: false });
joystickZone.addEventListener('touchmove', handleJoystickMove, { passive: false });
joystickZone.addEventListener('touchend', handleJoystickEnd, { passive: false });
joystickZone.addEventListener('mousedown', handleJoystickStart);
document.addEventListener('mousemove', e => { if (joystickActive) handleJoystickMove(e); });
document.addEventListener('mouseup', handleJoystickEnd);

const fireBtn = document.getElementById('fire-btn');
fireBtn.addEventListener('touchstart', e => {
  e.preventDefault();
  initAudio();
  isFiring = true;
  player.autoFire = true;
  fireBtn.classList.add('active');
}, { passive: false });
fireBtn.addEventListener('touchend', e => {
  e.preventDefault();
  isFiring = false;
  if (!keys[' '] && !keys['Spacebar']) player.autoFire = false;
  fireBtn.classList.remove('active');
}, { passive: false });
fireBtn.addEventListener('mousedown', () => { 
  initAudio();
  isFiring = true; 
  player.autoFire = true;
  fireBtn.classList.add('active');
});
fireBtn.addEventListener('mouseup', () => { 
  isFiring = false; 
  if (!keys[' '] && !keys['Spacebar']) player.autoFire = false;
  fireBtn.classList.remove('active');
});

canvas.addEventListener('click', e => {
  if (game.running && !game.paused) {
    playerShoot();
  }
});

function playerShoot() {
  if (player.shootCooldown > 0) return;
  
  const cooldown = Math.max(8, 20 - game.fireRate * 2);
  player.shootCooldown = cooldown;
  
  playSound('shoot');
  
  const bulletSpeed = 14;
  
  if (player.weaponLevel === 1) {
    bullets.push({
      x: player.x,
      y: player.y - player.height / 2,
      vx: 0,
      vy: -bulletSpeed,
      width: 5,
      height: 20,
      damage: game.bulletDamage,
      type: 'player'
    });
  } else if (player.weaponLevel === 2) {
    bullets.push({
      x: player.x - 15,
      y: player.y - player.height / 2,
      vx: 0,
      vy: -bulletSpeed,
      width: 5,
      height: 18,
      damage: game.bulletDamage,
      type: 'player'
    });
    bullets.push({
      x: player.x + 15,
      y: player.y - player.height / 2,
      vx: 0,
      vy: -bulletSpeed,
      width: 5,
      height: 18,
      damage: game.bulletDamage,
      type: 'player'
    });
  } else {
    bullets.push({
      x: player.x,
      y: player.y - player.height / 2,
      vx: 0,
      vy: -bulletSpeed,
      width: 6,
      height: 22,
      damage: game.bulletDamage * 1.5,
      type: 'player'
    });
    bullets.push({
      x: player.x - 20,
      y: player.y - player.height / 3,
      vx: -1,
      vy: -bulletSpeed * 0.9,
      width: 4,
      height: 16,
      damage: game.bulletDamage,
      type: 'player'
    });
    bullets.push({
      x: player.x + 20,
      y: player.y - player.height / 3,
      vx: 1,
      vy: -bulletSpeed * 0.9,
      width: 4,
      height: 16,
      damage: game.bulletDamage,
      type: 'player'
    });
  }
  
  for (let i = 0; i < 3; i++) {
    particles.push({
      x: player.x + (Math.random() - 0.5) * 10,
      y: player.y - player.height / 2,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 3 - 2,
      size: 2 + Math.random() * 2,
      color: '#00ffff',
      life: 0.4
    });
  }
}

function spawnEnemy() {
  if (enemies.length >= 15) return;
  
  let type, size, hp, speed, color, scoreValue, pattern;
  
  if (game.wave <= 3) {
    type = 'scout';
    size = 35;
    hp = 1;
    speed = 1.5 + Math.random();
    color = '#ff4466';
    scoreValue = 10;
    pattern = 'linear';
  } else if (game.wave <= 6) {
    const types = ['scout', 'fighter', 'zigzag'];
    type = types[Math.floor(Math.random() * types.length)];
    size = type === 'scout' ? 35 : type === 'fighter' ? 45 : 40;
    hp = type === 'scout' ? 1 : type === 'fighter' ? 2 : 1;
    speed = type === 'zigzag' ? 2 + Math.random() : 1.5 + Math.random();
    color = type === 'scout' ? '#ff4466' : type === 'fighter' ? '#ff8844' : '#44ff88';
    scoreValue = type === 'scout' ? 10 : type === 'fighter' ? 25 : 20;
    pattern = type;
  } else {
    const types = ['scout', 'fighter', 'zigzag', 'diver'];
    type = types[Math.floor(Math.random() * types.length)];
    size = type === 'scout' ? 35 : type === 'fighter' ? 50 : type === 'zigzag' ? 40 : 45;
    hp = type === 'scout' ? 1 : type === 'fighter' ? 3 : type === 'zigzag' ? 2 : 2;
    speed = type === 'diver' ? 3 + Math.random() * 0.5 : 1.5 + Math.random();
    color = type === 'diver' ? '#ff2244' : type === 'fighter' ? '#ff8844' : type === 'zigzag' ? '#44ff88' : '#ff4466';
    scoreValue = type === 'diver' ? 30 : type === 'scout' ? 10 : type === 'fighter' ? 30 : 20;
    pattern = type;
  }
  
  const difficultyMult = 1 + (game.difficulty - 1) * 0.3;
  
  enemies.push({
    x: Math.random() * (W - 60) + 30,
    y: -size,
    width: size,
    height: size,
    speed: speed * difficultyMult,
    hp: hp * difficultyMult,
    maxHp: hp * difficultyMult,
    type,
    color,
    scoreValue,
    pattern,
    shootCooldown: 60 + Math.random() * 60,
    wobble: Math.random() * Math.PI * 2,
    diveAngle: 0,
    startX: 0
  });
}

function spawnBoss() {
  const bossTypes = ['behemoth', 'phantom', 'leviathan'];
  const type = bossTypes[Math.floor(Math.random() * bossTypes.length)];
  
  let size, hp, speed, color;
  
  switch(type) {
    case 'behemoth':
      size = 140;
      hp = 40 + game.wave * 8;
      speed = 0.6;
      color = '#ff2244';
      break;
    case 'phantom':
      size = 100;
      hp = 30 + game.wave * 6;
      speed = 1;
      color = '#8844ff';
      break;
    case 'leviathan':
      size = 180;
      hp = 60 + game.wave * 10;
      speed = 0.4;
      color = '#22ffaa';
      break;
  }
  
  enemies.push({
    x: W / 2,
    y: -size,
    width: size,
    height: size * 0.7,
    speed,
    hp,
    maxHp: hp,
    type: 'boss',
    bossType: type,
    color,
    scoreValue: 1000,
    pattern: 'boss',
    shootCooldown: type === 'phantom' ? 20 : 40,
    phase: 0,
    phaseTimer: 0,
    moveTimer: 0,
    targetX: W / 2
  });
  
  playSound('boss');
}

function createExplosion(x, y, color, count = 15) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
    const speed = 2 + Math.random() * 4;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 5,
      color,
      life: 1,
      decay: 0.02 + Math.random() * 0.02
    });
  }
  
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 30;
    particles.push({
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: 1 + Math.random() * 2,
      color: '#ffffff',
      life: 0.5 + Math.random() * 0.3,
      decay: 0.05
    });
  }
}

function createPowerup(x, y) {
  const types = ['health', 'weapon', 'shield', 'score'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  powerups.push({
    x, y,
    width: 30,
    height: 30,
    type,
    bobOffset: Math.random() * Math.PI * 2,
    rotation: 0
  });
}

function update(dt) {
  if (!game.running || game.paused) return;
  
  const moveX = (keys['ArrowRight'] || keys['d'] || keys['D'] ? 1 : 0) - 
                (keys['ArrowLeft'] || keys['a'] || keys['A'] ? 1 : 0);
  const moveY = (keys['ArrowDown'] || keys['s'] || keys['S'] ? 1 : 0) - 
                (keys['ArrowUp'] || keys['w'] || keys['W'] ? 1 : 0);
  
  const joystickMoveX = joystickX;
  const joystickMoveY = joystickY;
  
  const totalMoveX = (moveX || joystickMoveX);
  const totalMoveY = (moveY || joystickMoveY);
  
  player.x += totalMoveX * player.speed;
  player.y += totalMoveY * player.speed * 0.7;
  
  player.x = Math.max(player.width / 2, Math.min(W - player.width / 2, player.x));
  player.y = Math.max(player.height / 2, Math.min(H - player.height / 2, player.y));
  
  if (keys[' '] || keys['Spacebar'] || player.autoFire || isFiring) {
    playerShoot();
  }
  
  if (player.shootCooldown > 0) player.shootCooldown--;
  if (player.invincible > 0) player.invincible--;
  
  if (Math.random() < 0.5) {
    const exhaustSize = 3 + Math.random() * 3;
    player.engineParticles.push({
      x: player.x + (Math.random() - 0.5) * 15,
      y: player.y + player.height / 2,
      vx: (Math.random() - 0.5) * 1,
      vy: 4 + Math.random() * 3,
      size: exhaustSize,
      life: 1,
      color: Math.random() > 0.3 ? '#00aaff' : '#ffaa00'
    });
  }
  
  for (let i = player.engineParticles.length - 1; i >= 0; i--) {
    const p = player.engineParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.04;
    p.size *= 0.97;
    if (p.life <= 0 || p.size < 0.5) player.engineParticles.splice(i, 1);
  }
  
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx;
    b.y += b.vy;
    
    if (b.type === 'player') {
      if (b.y < -20) {
        bullets.splice(i, 1);
        continue;
      }
      
      if (Math.random() < 0.3) {
        particles.push({
          x: b.x + (Math.random() - 0.5) * 3,
          y: b.y + b.height / 2,
          vx: (Math.random() - 0.5) * 0.5,
          vy: 2 + Math.random(),
          size: 1.5 + Math.random(),
          color: '#00ffff',
          life: 0.3
        });
      }
    } else {
      if (b.y > H + 20) {
        bullets.splice(i, 1);
        continue;
      }
    }
  }
  
  game.spawnTimer++;
  const spawnRate = Math.max(40, 90 - game.wave * 5);
  
  if (game.spawnTimer > spawnRate) {
    game.spawnTimer = 0;
    spawnEnemy();
    if (game.difficulty > 1.5 && Math.random() < 0.4) spawnEnemy();
    if (game.difficulty > 2.5 && Math.random() < 0.3) spawnEnemy();
  }
  
  game.waveTimer++;
  if (game.waveTimer > 600) {
    game.waveTimer = 0;
    game.wave++;
    game.difficulty += 0.2;
    waveNumEl.textContent = game.wave;
    
    if (game.wave % 5 === 0) {
      showBossWarning();
    } else {
      updateZone();
    }
  }
  
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    
    if (e.type === 'boss') {
      e.phaseTimer++;
      e.moveTimer++;
      
      if (e.y < 80) {
        e.y += e.speed;
      } else {
        if (e.moveTimer > 100) {
          e.targetX = 100 + Math.random() * (W - 200);
          e.moveTimer = 0;
        }
        e.x += (e.targetX - e.x) * 0.02;
        e.x += Math.sin(e.phaseTimer * 0.05) * (e.bossType === 'phantom' ? 4 : 2);
      }
      
      e.shootCooldown--;
      if (e.shootCooldown <= 0) {
        e.shootCooldown = e.bossType === 'phantom' ? 25 : 50;
        
        if (e.bossType === 'behemoth') {
          for (let a = -1; a <= 1; a++) {
            bullets.push({
              x: e.x + a * 30,
              y: e.y + e.height / 2,
              vx: a * 0.5,
              vy: 5,
              width: 10,
              height: 16,
              type: 'enemy'
            });
          }
        } else if (e.bossType === 'phantom') {
          for (let a = 0; a < 5; a++) {
            const angle = Math.atan2(player.y - e.y, player.x - e.x) + (a - 2) * 0.3;
            bullets.push({
              x: e.x,
              y: e.y + e.height / 2,
              vx: Math.cos(angle) * 6,
              vy: Math.sin(angle) * 6,
              width: 8,
              height: 12,
              type: 'enemy'
            });
          }
        } else if (e.bossType === 'leviathan') {
          bullets.push({
            x: e.x - e.width / 3,
            y: e.y + e.height / 2,
            vx: 0,
            vy: 6,
            width: 20,
            height: 30,
            type: 'enemy'
          });
          bullets.push({
            x: e.x + e.width / 3,
            y: e.y + e.height / 2,
            vx: 0,
            vy: 6,
            width: 20,
            height: 30,
            type: 'enemy'
          });
        }
      }
    } else {
      switch(e.pattern) {
        case 'linear':
          e.y += e.speed;
          break;
        case 'zigzag':
          e.y += e.speed * 0.8;
          e.wobble += 0.08;
          e.x += Math.sin(e.wobble) * 2;
          break;
        case 'diver':
          if (e.y < H / 3) {
            e.y += e.speed;
          } else {
            e.diveAngle = Math.atan2(player.y - e.y, player.x - e.x);
            e.x += Math.cos(e.diveAngle) * e.speed * 1.5;
            e.y += Math.sin(e.diveAngle) * e.speed * 1.5;
          }
          break;
        default:
          e.y += e.speed;
      }
      
      if (e.y > 0 && e.y < H * 0.7) {
        e.shootCooldown--;
        if (e.shootCooldown <= 0) {
          e.shootCooldown = 80 + Math.random() * 60;
          const bulletSpeed = 4 + game.difficulty;
          
          if (e.type === 'fighter') {
            const angle = Math.atan2(player.y - e.y, player.x - e.x);
            bullets.push({
              x: e.x,
              y: e.y + e.height / 2,
              vx: Math.cos(angle) * bulletSpeed,
              vy: Math.sin(angle) * bulletSpeed,
              width: 8,
              height: 12,
              type: 'enemy'
            });
          } else if (e.type === 'diver') {
            bullets.push({
              x: e.x,
              y: e.y + e.height / 2,
              vx: 0,
              vy: bulletSpeed * 1.2,
              width: 6,
              height: 10,
              type: 'enemy'
            });
          } else if (Math.random() < 0.3) {
            bullets.push({
              x: e.x,
              y: e.y + e.height / 2,
              vx: 0,
              vy: bulletSpeed,
              width: 6,
              height: 10,
              type: 'enemy'
            });
          }
        }
      }
    }
    
    if (e.y > H + 80 || e.x < -80 || e.x > W + 80) {
      enemies.splice(i, 1);
    }
  }
  
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    
    if (b.type === 'player') {
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        const hitBox = e.type === 'boss' ? 0.7 : 0.8;
        
        if (Math.abs(b.x - e.x) < (b.width + e.width * hitBox) / 2 && 
            Math.abs(b.y - e.y) < (b.height + e.height * hitBox) / 2) {
          e.hp -= b.damage;
          bullets.splice(i, 1);
          createExplosion(b.x, b.y, e.color, 6);
          playSound('hit');
          
          if (e.hp <= 0) {
            createExplosion(e.x, e.y, e.color, e.type === 'boss' ? 40 : 20);
            playSound('explosion');
            game.score += e.scoreValue;
            game.kills++;
            scoreEl.textContent = game.score;
            
            if (Math.random() < 0.15) {
              createPowerup(e.x, e.y);
            }
            
            enemies.splice(j, 1);
            
            if (e.type === 'boss') {
              showVictory();
            }
          }
          break;
        }
      }
    } else {
      if (player.invincible <= 0 && 
          Math.abs(b.x - player.x) < 35 && 
          Math.abs(b.y - player.y) < 40) {
        bullets.splice(i, 1);
        takeDamage(10 + game.wave * 2);
      }
    }
  }
  
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (player.invincible <= 0 && 
        Math.abs(e.x - player.x) < (e.width + player.width) / 2 - 15 && 
        Math.abs(e.y - player.y) < (e.height + player.height) / 2 - 15) {
      takeDamage(20 + game.wave * 3);
      e.hp = 0;
      createExplosion(e.x, e.y, e.color, 15);
      playSound('explosion');
      enemies.splice(i, 1);
    }
  }
  
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.y += a.speed;
    a.rotation += a.rotSpeed;
    
    if (a.y > H + a.size) {
      a.y = -a.size;
      a.x = Math.random() * W;
    }
    
    if (player.invincible <= 0 && 
        Math.abs(a.x - player.x) < a.size * 0.8 && 
        Math.abs(a.y - player.y) < a.size * 0.8) {
      takeDamage(15);
      a.y = -a.size;
      playSound('hit');
    }
  }
  
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    p.y += 1.5;
    p.rotation += 0.03;
    p.bobOffset += 0.1;
    
    if (Math.abs(p.x - player.x) < 40 && Math.abs(p.y - player.y) < 45) {
      applyPowerup(p.type);
      playSound('powerup');
      powerups.splice(i, 1);
      continue;
    }
    
    if (p.y > H + 30) powerups.splice(i, 1);
  }
  
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05;
    p.life -= p.decay || 0.03;
    if (p.life <= 0) particles.splice(i, 1);
  }
  
  stars.forEach(s => {
    s.y += s.speed;
    s.twinkle += 0.05;
    if (s.y > H) {
      s.y = 0;
      s.x = Math.random() * W;
    }
  });
  
  nebulaClouds.forEach(n => {
    n.x += n.moveX;
    n.y += n.moveY;
    if (n.x < -n.radius) n.x = W + n.radius;
    if (n.x > W + n.radius) n.x = -n.radius;
    if (n.y < -n.radius) n.y = H + n.radius;
    if (n.y > H + n.radius) n.y = -n.radius;
  });
  
  if (game.shakeTimer > 0) game.shakeTimer--;
}

function applyPowerup(type) {
  switch(type) {
    case 'health':
      game.health = Math.min(game.maxHealth, game.health + 25);
      healthFill.style.width = game.health + '%';
      for (let i = 0; i < 10; i++) {
        particles.push({
          x: player.x,
          y: player.y,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          size: 3,
          color: '#00ff88',
          life: 0.8
        });
      }
      break;
    case 'weapon':
      player.weaponLevel = Math.min(3, player.weaponLevel + 1);
      game.fireRate += 0.5;
      game.bulletDamage += 0.3;
      game.score += 50;
      scoreEl.textContent = game.score;
      break;
    case 'shield':
      player.invincible = 180;
      for (let i = 0; i < 15; i++) {
        particles.push({
          x: player.x,
          y: player.y,
          vx: Math.cos(i / 15 * Math.PI * 2) * 3,
          vy: Math.sin(i / 15 * Math.PI * 2) * 3,
          size: 4,
          color: '#4488ff',
          life: 1.5
        });
      }
      break;
    case 'score':
      game.score += 200;
      scoreEl.textContent = game.score;
      for (let i = 0; i < 8; i++) {
        particles.push({
          x: player.x + (Math.random() - 0.5) * 40,
          y: player.y + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 3,
          vy: -Math.random() * 4,
          size: 4,
          color: '#ffdd00',
          life: 1
        });
      }
      break;
  }
}

function updateZone() {
  if (game.wave <= 3) {
    game.zone = 'normal';
  } else if (game.wave <= 6) {
    game.zone = 'asteroid';
    initAsteroids();
  } else if (game.wave <= 9) {
    game.zone = 'danger';
    initAsteroids();
  } else {
    game.zone = 'red';
  }
}

function takeDamage(amount) {
  game.health -= amount;
  player.invincible = 60;
  game.shakeTimer = 15;
  game.shakeIntensity = 8;
  healthFill.style.width = Math.max(0, game.health) + '%';
  
  for (let i = 0; i < 10; i++) {
    particles.push({
      x: player.x,
      y: player.y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      size: 4,
      color: '#ff4444',
      life: 0.6
    });
  }
  
  playSound('hit');
  
  if (game.health <= 0) {
    gameOver();
  }
}

function draw() {
  ctx.save();
  
  if (game.shakeTimer > 0) {
    ctx.translate(
      (Math.random() - 0.5) * game.shakeIntensity,
      (Math.random() - 0.5) * game.shakeIntensity
    );
  }
  
  let gradient;
  
  switch(game.zone) {
    case 'normal':
      gradient = ctx.createLinearGradient(0, 0, 0, H);
      gradient.addColorStop(0, '#0a0a2e');
      gradient.addColorStop(0.5, '#1a0a3e');
      gradient.addColorStop(1, '#0a0a2e');
      break;
    case 'asteroid':
      gradient = ctx.createLinearGradient(0, 0, 0, H);
      gradient.addColorStop(0, '#15152a');
      gradient.addColorStop(0.5, '#1f1f35');
      gradient.addColorStop(1, '#15152a');
      break;
    case 'danger':
      gradient = ctx.createLinearGradient(0, 0, 0, H);
      gradient.addColorStop(0, '#1a1025');
      gradient.addColorStop(0.5, '#2a1525');
      gradient.addColorStop(1, '#1a1025');
      break;
    case 'red':
      gradient = ctx.createLinearGradient(0, 0, 0, H);
      gradient.addColorStop(0, '#2a0a15');
      gradient.addColorStop(0.5, '#3a1020');
      gradient.addColorStop(1, '#2a0a15');
      break;
  }
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
  
  nebulaClouds.forEach(n => {
    const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius);
    grad.addColorStop(0, n.color);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  });
  
  stars.forEach(s => {
    const twinkle = Math.sin(s.twinkle) * 0.3 + 0.7;
    ctx.globalAlpha = s.brightness * twinkle;
    ctx.fillStyle = game.zone === 'red' ? '#ffccaa' : '#ffffff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  
  asteroids.forEach(a => {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rotation);
    ctx.fillStyle = '#3a3a4a';
    ctx.strokeStyle = '#5a5a6a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.vertices[0].radius * a.size * Math.cos(a.vertices[0].angle), 
               a.vertices[0].radius * a.size * Math.sin(a.vertices[0].angle));
    for (let i = 1; i < a.vertices.length; i++) {
      ctx.lineTo(a.vertices[i].radius * a.size * Math.cos(a.vertices[i].angle), 
                 a.vertices[i].radius * a.size * Math.sin(a.vertices[i].angle));
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });
  
  player.engineParticles.forEach(p => {
    ctx.globalAlpha = p.life;
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
    grad.addColorStop(0, p.color);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  
  drawPlayer();
  
  bullets.forEach(b => {
    if (b.type === 'player') {
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(b.x - b.width / 2, b.y - b.height / 2, b.width, b.height);
      
      ctx.shadowBlur = 5;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(b.x - b.width / 4, b.y - b.height / 3, b.width / 2, b.height * 0.4);
    } else {
      ctx.shadowColor = '#ff4444';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(b.x - b.width / 2, b.y - b.height / 2, b.width, b.height);
      
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(b.x - b.width / 4, b.y - b.height / 4, b.width / 2, b.height * 0.3);
    }
    ctx.shadowBlur = 0;
  });
  
  enemies.forEach(e => {
    drawEnemy(e);
  });
  
  powerups.forEach(p => {
    const bobY = Math.sin(p.bobOffset) * 5;
    ctx.save();
    ctx.translate(p.x, p.y + bobY);
    ctx.rotate(p.rotation);
    
    let color;
    switch(p.type) {
      case 'health': color = '#00ff88'; break;
      case 'weapon': color = '#ff8800'; break;
      case 'shield': color = '#4488ff'; break;
      case 'score': color = '#ffdd00'; break;
    }
    
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = color;
    
    ctx.beginPath();
    ctx.moveTo(0, -p.height / 2);
    ctx.lineTo(p.width / 2, 0);
    ctx.lineTo(0, p.height / 2);
    ctx.lineTo(-p.width / 2, 0);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const symbol = p.type === 'health' ? '+' : p.type === 'weapon' ? 'W' : p.type === 'shield' ? 'S' : '$';
    ctx.fillText(symbol, 0, 0);
    
    ctx.shadowBlur = 0;
    ctx.restore();
  });
  
  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  
  if (player.invincible > 0 && Math.floor(player.invincible / 4) % 2 === 0) {
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.width * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  
  ctx.restore();
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);
  
  if (player.invincible > 0 && Math.floor(player.invincible / 5) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }
  
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 25;
  
  const w = player.width;
  const h = player.height;
  
  ctx.fillStyle = '#00aaff';
  ctx.beginPath();
  ctx.moveTo(0, -h / 2);
  ctx.lineTo(-w / 3, -h / 4);
  ctx.lineTo(-w / 2, h / 3);
  ctx.lineTo(-w / 4, h / 2);
  ctx.lineTo(w / 4, h / 2);
  ctx.lineTo(w / 2, h / 3);
  ctx.lineTo(w / 3, -h / 4);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = '#0066aa';
  ctx.beginPath();
  ctx.moveTo(0, -h / 3);
  ctx.lineTo(-w / 5, 0);
  ctx.lineTo(w / 5, 0);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = '#00ddff';
  ctx.beginPath();
  ctx.moveTo(0, -h / 2 + 5);
  ctx.lineTo(-w / 6, -h / 4);
  ctx.lineTo(w / 6, -h / 4);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = '#ff6600';
  ctx.beginPath();
  ctx.moveTo(-w / 5, h / 3);
  ctx.lineTo(-w / 8, h / 2 + 5);
  ctx.lineTo(-w / 10, h / 3);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w / 5, h / 3);
  ctx.lineTo(w / 8, h / 2 + 5);
  ctx.lineTo(w / 10, h / 3);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = '#00ffff';
  ctx.beginPath();
  ctx.arc(-w / 4, h / 6, 4, 0, Math.PI * 2);
  ctx.arc(w / 4, h / 6, 4, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-w / 4, h / 6, 2, 0, Math.PI * 2);
  ctx.arc(w / 4, h / 6, 2, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawEnemy(e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  
  if (e.type === 'boss') {
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 30;
    
    ctx.fillStyle = e.color;
    
    if (e.bossType === 'behemoth') {
      ctx.beginPath();
      ctx.moveTo(0, -e.height / 2);
      ctx.lineTo(-e.width / 2, -e.height / 4);
      ctx.lineTo(-e.width / 2, e.height / 4);
      ctx.lineTo(-e.width / 3, e.height / 2);
      ctx.lineTo(e.width / 3, e.height / 2);
      ctx.lineTo(e.width / 2, e.height / 4);
      ctx.lineTo(e.width / 2, -e.height / 4);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = '#220011';
      ctx.fillRect(-e.width / 3, -e.height / 4, e.width * 2/3, e.height / 2);
      
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.arc(-e.width / 4, 0, 8, 0, Math.PI * 2);
      ctx.arc(e.width / 4, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-e.width / 4, 0, 4, 0, Math.PI * 2);
      ctx.arc(e.width / 4, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.bossType === 'phantom') {
      ctx.beginPath();
      ctx.moveTo(0, e.height / 2);
      ctx.bezierCurveTo(-e.width / 2, e.height / 4, -e.width / 2, -e.height / 2, 0, -e.height / 2);
      ctx.bezierCurveTo(e.width / 2, -e.height / 2, e.width / 2, e.height / 4, 0, e.height / 2);
      ctx.fill();
      
      ctx.fillStyle = '#440088';
      ctx.beginPath();
      ctx.moveTo(0, e.height / 3);
      ctx.lineTo(-e.width / 4, 0);
      ctx.lineTo(e.width / 4, 0);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = '#ff44ff';
      ctx.beginPath();
      ctx.arc(-e.width / 5, -e.height / 8, 6, 0, Math.PI * 2);
      ctx.arc(e.width / 5, -e.height / 8, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.bossType === 'leviathan') {
      ctx.beginPath();
      ctx.moveTo(0, -e.height / 2);
      ctx.lineTo(-e.width / 3, -e.height / 3);
      ctx.lineTo(-e.width / 2, 0);
      ctx.lineTo(-e.width / 3, e.height / 3);
      ctx.lineTo(e.width / 3, e.height / 3);
      ctx.lineTo(e.width / 2, 0);
      ctx.lineTo(e.width / 3, -e.height / 3);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = '#003322';
      ctx.fillRect(-e.width / 4, -e.height / 3, e.width / 2, e.height * 2/3);
      
      ctx.fillStyle = '#44ffaa';
      ctx.beginPath();
      ctx.ellipse(-e.width / 6, 0, 15, 8, 0, 0, Math.PI * 2);
      ctx.ellipse(e.width / 6, 0, 15, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const hpRatio = e.hp / e.maxHp;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(-e.width / 2, -e.height / 2 - 20, e.width, 10);
    ctx.fillStyle = hpRatio > 0.5 ? '#00ff00' : hpRatio > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillRect(-e.width / 2, -e.height / 2 - 20, e.width * hpRatio, 10);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(-e.width / 2, -e.height / 2 - 20, e.width, 10);
  } else {
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 20;
    ctx.fillStyle = e.color;
    
    const s = e.width / 2;
    
    if (e.type === 'fighter') {
      ctx.beginPath();
      ctx.moveTo(0, s);
      ctx.lineTo(-s, 0);
      ctx.lineTo(-s / 2, -s / 2);
      ctx.lineTo(s / 2, -s / 2);
      ctx.lineTo(s, 0);
      ctx.closePath();
      ctx.fill();
    } else if (e.type === 'zigzag') {
      ctx.beginPath();
      ctx.moveTo(0, s);
      ctx.lineTo(-s, s / 3);
      ctx.lineTo(-s / 2, -s / 2);
      ctx.lineTo(s / 2, -s / 2);
      ctx.lineTo(s, s / 3);
      ctx.closePath();
      ctx.fill();
    } else if (e.type === 'diver') {
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s, s);
      ctx.lineTo(0, s / 2);
      ctx.lineTo(-s, s);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, s);
      ctx.lineTo(-s, -s / 2);
      ctx.lineTo(-s / 2, -s);
      ctx.lineTo(s / 2, -s);
      ctx.lineTo(s, -s / 2);
      ctx.closePath();
      ctx.fill();
    }
    
    ctx.fillStyle = '#000022';
    ctx.beginPath();
    ctx.moveTo(0, s / 2);
    ctx.lineTo(-s / 2, -s / 4);
    ctx.lineTo(s / 2, -s / 4);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(-s / 3, 0, 4, 0, Math.PI * 2);
    ctx.arc(s / 3, 0, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.shadowBlur = 0;
  ctx.restore();
}

function gameLoop(timestamp) {
  if (!game.running) return;
  
  const dt = timestamp - game.lastTime;
  game.lastTime = timestamp;
  
  update(dt);
  draw();
  
  if (game.running && !game.paused) {
    requestAnimationFrame(gameLoop);
  }
}

function startGame() {
  initAudio();
  initGame();
  game.running = true;
  game.paused = false;
  game.started = true;
  menuScreen.classList.add('hidden');
  gameoverScreen.classList.add('hidden');
  victoryScreen.classList.add('hidden');
  pauseScreen.classList.add('hidden');
  game.lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function gameOver() {
  game.running = false;
  if (game.score > game.highScore) {
    game.highScore = game.score;
    localStorage.setItem('spaceShooterHighScore', game.highScore);
    highScoreEl.textContent = game.highScore;
    newHighBadge.classList.remove('hidden');
  } else {
    newHighBadge.classList.add('hidden');
  }
  finalScoreEl.textContent = game.score;
  finalWaveEl.textContent = game.wave;
  finalKillsEl.textContent = game.kills;
  gameoverScreen.classList.remove('hidden');
}

function showBossWarning() {
  game.running = false;
  bossWarning.classList.remove('hidden');
  setTimeout(() => {
    bossWarning.classList.add('hidden');
    spawnBoss();
    game.running = true;
    game.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  }, 3000);
}

function showVictory() {
  game.running = false;
  document.getElementById('victory-score').textContent = game.score;
  document.getElementById('victory-waves').textContent = game.wave;
  document.getElementById('victory-kills').textContent = game.kills;
  victoryScreen.classList.remove('hidden');
}

function showMenu() {
  game.running = false;
  game.started = false;
  menuScreen.classList.remove('hidden');
  gameoverScreen.classList.add('hidden');
  victoryScreen.classList.add('hidden');
  pauseScreen.classList.add('hidden');
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem('spaceShooterSound', soundEnabled);
  document.getElementById('sound-toggle').textContent = soundEnabled ? '🔊' : '🔇';
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;
document.getElementById('victory-restart-btn').onclick = startGame;

// ========================================
// MOBILE TAP-TO-START SYSTEM
// ========================================

var StartupState = {
  NOT_STARTED: 'not_started',
  START_SCREEN: 'start_screen',
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error'
};

var appState = StartupState.NOT_STARTED;
var loadStartTime = 0;
var loadTimeout = null;

function log(msg) {
  console.log('[SpaceShooter] ' + msg);
}

function error(msg, err) {
  console.error('[SpaceShooter] ' + msg, err);
}

function showScreen(screenId) {
  var screens = ['start-screen', 'how-to-play', 'menu-screen', 'pause-screen', 
                 'gameover-screen', 'boss-warning', 'victory-screen'];
  screens.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) {
      if (id === screenId) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });
}

function initStartScreen() {
  log('Setting up start screen...');
  
  var startBtn = document.getElementById('start-play-btn');
  var howBtn = document.getElementById('start-how-btn');
  var howPlayBtn = document.getElementById('how-play-btn');
  var playBtn = document.getElementById('play-btn');
  
  if (startBtn) {
    startBtn.addEventListener('click', handleStartGame);
    startBtn.addEventListener('touchend', function(e) {
      e.preventDefault();
      handleStartGame();
    });
  }
  
  if (howBtn) {
    howBtn.addEventListener('click', function() {
      showScreen('how-to-play');
    });
  }
  
  if (howPlayBtn) {
    howPlayBtn.addEventListener('click', function() {
      showScreen('start-screen');
    });
  }
  
  if (playBtn) {
    playBtn.onclick = startGame;
  }
  
  log('Start screen ready');
}

function handleStartGame() {
  if (appState === StartupState.LOADING) return;
  
  log('=== Starting game from PLAY button ===');
  appState = StartupState.LOADING;
  loadStartTime = Date.now();
  
  loadTimeout = setTimeout(function() {
    var elapsed = (Date.now() - loadStartTime) / 1000;
    if (appState === StartupState.LOADING) {
      error('Loading timeout after ' + elapsed + 's');
      appState = StartupState.ERROR;
      showScreen('menu-screen');
    }
  }, 5000);
  
  loadStep1_Resize();
}

function loadStep1_Resize() {
  log('Step 1: Canvas resize...');
  try {
    resize();
    window.addEventListener('resize', resize);
    setTimeout(function() { loadStep2_Touch(); }, 50);
  } catch (err) {
    error('Resize failed', err);
    loadStep2_Touch();
  }
}

function loadStep2_Touch() {
  log('Step 2: Touch controls...');
  try {
    initTouchControls();
    setTimeout(function() { loadStep3_Keys(); }, 50);
  } catch (err) {
    error('Touch init failed', err);
    loadStep3_Keys();
  }
}

function loadStep3_Keys() {
  log('Step 3: Keyboard...');
  setTimeout(function() { loadStep4_Audio(); }, 50);
}

function loadStep4_Audio() {
  log('Step 4: Audio (waiting for interaction)...');
  window.gameAudioContext = null;
  window.gameAudioInitialized = false;
  setTimeout(function() { loadStep5_Ready(); }, 50);
}

function loadStep5_Ready() {
  clearTimeout(loadTimeout);
  var elapsed = (Date.now() - loadStartTime) / 1000;
  log('Loading complete in ' + elapsed.toFixed(1) + 's');
  
  appState = StartupState.READY;
  showScreen('menu-screen');
  
  // Send gameReady only once
  if (!window.gameReadySent) {
    window.gameReadySent = true;
    log('Sending gameReady to parent');
    window.parent.postMessage({ type: 'gameReady', gameSlug: 'space-shooter' }, '*');
  }
}

// ========================================
// INIT ON DOM READY
// ========================================
function init() {
  log('=== INITIALIZING SPACE SHOOTER ===');
  log('State: NOT_STARTED, waiting for user tap');
  
  appState = StartupState.START_SCREEN;
  initStartScreen();
  
  log('Start screen shown, game ready to begin');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}