// ========================================
// CAR PARKING - MOBILE TAP-TO-START SYSTEM
// ========================================

(function() {
  'use strict';
  
  // ========================================
  // STARTUP STATE
  // ========================================
  const StartupState = {
    NOT_STARTED: 'not_started',
    START_SCREEN: 'start_screen',
    LOADING: 'loading',
    READY: 'ready',
    ERROR: 'error'
  };
  
  let appState = StartupState.NOT_STARTED;
  let loadStartTime = 0;
  let loadTimeout = null;
  
  // ========================================
  // DOM ELEMENTS
  // ========================================
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  
  // ========================================
  // LOGGING
  // ========================================
  function log(msg) {
    console.log('[CarParking] ' + msg);
  }
  
  function error(msg, err) {
    console.error('[CarParking] ' + msg, err);
  }
  
  // ========================================
  // CANVAS SETUP
  // ========================================
  let W, H;
  
  function resizeCanvas() {
    const container = document.getElementById('canvas-wrapper');
    W = canvas.width = container.offsetWidth;
    H = canvas.height = container.offsetHeight;
    log('Canvas resized: ' + W + 'x' + H);
  }
  
  // ========================================
  // TOUCH CONTROLS - Initialize immediately
  // ========================================
  let touchLeft = false, touchRight = false;
  let touchGas = false, touchBrake = false, touchReverse = false;
  
  function initTouchControls() {
    log('Initializing touch controls...');
    
    const btnIds = ['steer-left', 'steer-right', 'accelerate-btn', 'brake-btn', 'reverse-btn'];
    
    btnIds.forEach(function(id) {
      const btn = document.getElementById(id);
      if (!btn) return;
      
      // Touch events
      btn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        updateTouchState(id, true);
      }, { passive: false });
      
      btn.addEventListener('touchend', function(e) {
        e.preventDefault();
        updateTouchState(id, false);
      }, { passive: false });
      
      // Mouse events for desktop testing
      btn.addEventListener('mousedown', function() {
        updateTouchState(id, true);
      });
      
      btn.addEventListener('mouseup', function() {
        updateTouchState(id, false);
      });
      
      btn.addEventListener('mouseleave', function() {
        updateTouchState(id, false);
      });
    });
    
    log('Touch controls ready');
  }
  
  function updateTouchState(id, pressed) {
    if (id === 'steer-left') touchLeft = pressed;
    if (id === 'steer-right') touchRight = pressed;
    if (id === 'accelerate-btn') touchGas = pressed;
    if (id === 'brake-btn') touchBrake = pressed;
    if (id === 'reverse-btn') touchReverse = pressed;
  }
  
  // ========================================
  // KEYBOARD CONTROLS - Add after start
  // ========================================
  const keys = {};
  
  function initKeyboardControls() {
    log('Initializing keyboard controls...');
    
    document.addEventListener('keydown', function(e) {
      keys[e.key] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' '].indexOf(e.key) >= 0) {
        e.preventDefault();
      }
    });
    
    document.addEventListener('keyup', function(e) {
      keys[e.key] = false;
    });
    
    log('Keyboard controls ready');
  }
  
  // ========================================
  // SCREEN MANAGEMENT
  // ========================================
  function showScreen(screenId) {
    var screens = ['start-screen', 'how-to-play', 'menu-screen', 'mission-select', 
                 'pause-screen', 'success-screen', 'fail-screen'];
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
  
  // ========================================
  // START SCREEN EVENT HANDLERS
  // ========================================
  function initStartScreen() {
    log('Setting up start screen...');
    
    var startBtn = document.getElementById('start-play-btn');
    var howBtn = document.getElementById('start-how-btn');
    var howPlayBtn = document.getElementById('how-play-btn');
    
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
    
    log('Start screen ready');
  }
  
  // ========================================
  // START GAME - THE CORE Mobile Flow
  // ========================================
  function handleStartGame() {
    if (appState === StartupState.LOADING) return;
    
    log('=== Starting game from PLAY button ===');
    appState = StartupState.LOADING;
    loadStartTime = Date.now();
    
    // Show loading screen
    showScreen('loading');
    
    // Start loading sequence
    startLoadingSequence();
  }
  
  // ========================================
  // LOADING SEQUENCE
  // ========================================
  function startLoadingSequence() {
    log('Loading sequence started...');
    
    // Set 5 second timeout
    loadTimeout = setTimeout(function() {
      var elapsed = (Date.now() - loadStartTime) / 1000;
      if (appState === StartupState.LOADING) {
        error('Loading timeout after ' + elapsed + 's');
        showLoadError();
      }
    }, 5000);
    
    // Load in sequence: canvas → touch → audio → game
    loadStep1_Canvas();
  }
  
  function loadStep1_Canvas() {
    log('Step 1: Canvas setup...');
    
    try {
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      
      setTimeout(function() {
        loadStep2_Touch();
      }, 100);
    } catch (err) {
      error('Canvas setup failed', err);
      loadStep2_Touch(); // Continue anyway
    }
  }
  
  function loadStep2_Touch() {
    log('Step 2: Touch controls...');
    
    try {
      initTouchControls();
      
      setTimeout(function() {
        loadStep3_Keys();
      }, 100);
    } catch (err) {
      error('Touch init failed', err);
      loadStep3_Keys(); // Continue anyway
    }
  }
  
  function loadStep3_Keys() {
    log('Step 3: Keyboard controls...');
    
    try {
      initKeyboardControls();
      
      setTimeout(function() {
        loadStep4_Audio();
      }, 100);
    } catch (err) {
      error('Keyboard init failed', err);
      loadStep4_Audio(); // Continue anyway
    }
  }
  
  function loadStep4_Audio() {
    log('Step 4: Audio (disabled until gameplay)...');
    
    // DO NOT initialize audio yet - wait for user interaction
    // Store audio context for later
    window.gameAudioContext = null;
    window.gameAudioInitialized = false;
    
    setTimeout(function() {
      loadStep5_Game();
    }, 100);
  }
  
  function loadStep5_Game() {
    log('Step 5: Game initialization...');
    
    try {
      initGame();
      
      setTimeout(function() {
        finishLoading();
      }, 100);
    } catch (err) {
      error('Game init failed', err);
      finishLoading(); // Continue anyway
    }
  }
  
  function sendGameReady() {
    if (window.gameReadySent) {
      log('gameReady already sent, skipping');
      return;
    }
    window.gameReadySent = true;
    log('Sending gameReady to parent');
    window.parent.postMessage({ type: 'gameReady', gameSlug: 'car-parking' }, '*');
  }
  
  function finishLoading() {
    clearTimeout(loadTimeout);
    
    var elapsed = (Date.now() - loadStartTime) / 1000;
    log('Loading complete in ' + elapsed.toFixed(1) + 's');
    
    appState = StartupState.READY;
    
    // Show menu now
    showScreen('menu-screen');
    
    // Notify parent - send only once
    sendGameReady();
  }
  
  function showLoadError() {
    clearTimeout(loadTimeout);
    appState = StartupState.ERROR;
    
    error('Load error shown');
    
    // Show retry option
    showScreen('menu-screen');
  }
  
  // ========================================
  // GAME CONFIGURATION
  // ========================================
  var missions = [
    { id: 1, name: "Empty Lot", difficulty: "easy", time: 60, environment: "parking" },
    { id: 2, name: "Basic Parking", difficulty: "easy", time: 70, environment: "parking" },
    { id: 3, name: "Side Spot", difficulty: "easy", time: 80, environment: "parking" },
    { id: 4, name: "City Street", difficulty: "medium", time: 90, environment: "city" },
    { id: 5, name: "Shopping Area", difficulty: "medium", time: 100, environment: "city" },
    { id: 6, name: "Narrow Lane", difficulty: "medium", time: 110, environment: "residential" },
    { id: 7, name: "Traffic Jam", difficulty: "hard", time: 120, environment: "traffic" },
    { id: 8, name: "Rush Hour", difficulty: "hard", time: 140, environment: "traffic" },
    { id: 9, name: "Night Parking", difficulty: "hard", time: 150, environment: "night" },
    { id: 10, name: "Rainy Day", difficulty: "advanced", time: 160, environment: "rain" },
    { id: 11, name: "Underground", difficulty: "advanced", time: 170, environment: "underground" },
    { id: 12, name: "Expert Drive", difficulty: "advanced", time: 180, environment: "city" }
  ];
  
  var environmentConfigs = {
    parking: { bg: '#3a5a3a', road: '#555', lines: '#fff' },
    city: { bg: '#2a4a5a', road: '#333', lines: '#ffcc00' },
    residential: { bg: '#4a6a4a', road: '#555', lines: '#fff' },
    traffic: { bg: '#3a4a5a', road: '#222', lines: '#ffcc00' },
    night: { bg: '#1a1a2a', road: '#333', lines: '#fff' },
    rain: { bg: '#2a3a4a', road: '#222', lines: '#fff' },
    underground: { bg: '#2a2a3a', road: '#444', lines: '#ffcc00' }
  };
  
  // ========================================
  // GAME STATE
  // ========================================
  var game = {
    state: 'menu',
    currentMission: null,
    timeLeft: 0,
    score: 0,
    paused: false,
    lastTime: 0,
    countdown: 0,
    countdownActive: false
  };
  
  var player = {
    x: 300,
    y: 600,
    angle: -Math.PI / 2,
    speed: 0,
    width: 30,
    length: 50
  };
  
  var world = { width: 1200, height: 1000 };
  var obstacles = [];
  var parkingSpots = [];
  var particles = [];
  var camera = { x: 0, y: 0 };
  
  // ========================================
  // GAME LOGIC
  // ========================================
  function initGame() {
    log('Initializing game logic...');
    
    game.state = 'menu';
    game.lastTime = 0;
    
    // Setup button handlers
    setupButtons();
    
    // Start render loop
    startRenderLoop();
    
    log('Game logic ready');
  }
  
  function setupButtons() {
    log('Setting up game buttons...');
    
    var playBtn = document.getElementById('play-btn');
    var resumeBtn = document.getElementById('resume-btn');
    var restartBtn = document.getElementById('restart-btn');
    var retryBtn = document.getElementById('retry-btn');
    var nextMissionBtn = document.getElementById('next-mission-btn');
    var pauseBtn = document.querySelector('.pause-btn');
    var menuBtn = document.querySelector('.menu-btn');
    var backBtn = document.querySelector('.back-btn');
    var missionSelectBtns = document.querySelectorAll('.mission-select-btn');
    
    if (playBtn) {
      playBtn.onclick = function() {
        showScreen('mission-select');
        showMissionButtons();
      };
    }
    
    if (resumeBtn) {
      resumeBtn.onclick = function() {
        game.paused = false;
        showScreen('gameplay');
        game.lastTime = performance.now();
      };
    }
    
    if (restartBtn) {
      restartBtn.onclick = function() {
        if (game.currentMission) startMission(game.currentMission.id);
      };
    }
    
    if (retryBtn) {
      retryBtn.onclick = function() {
        if (game.currentMission) startMission(game.currentMission.id);
      };
    }
    
    if (nextMissionBtn) {
      nextMissionBtn.onclick = function() {
        if (game.currentMission && game.currentMission.id < missions.length) {
          startMission(game.currentMission.id + 1);
        }
      };
    }
    
    if (pauseBtn) {
      pauseBtn.onclick = function() {
        if (game.state === 'playing') {
          game.paused = true;
          showScreen('pause-screen');
        }
      };
    }
    
    if (menuBtn) {
      menuBtn.onclick = function() {
        game.state = 'menu';
        showScreen('menu-screen');
      };
    }
    
    if (backBtn) {
      backBtn.onclick = function() {
        showScreen('menu-screen');
      };
    }
    
    missionSelectBtns.forEach(function(btn) {
      btn.onclick = function() {
        showScreen('mission-select');
        showMissionButtons();
      };
    });
    
    // Keyboard pause
    document.addEventListener('keydown', function(e) {
      if ((e.key === 'Escape' || e.key === 'p') && game.state === 'playing') {
        game.paused = !game.paused;
        if (game.paused) {
          showScreen('pause-screen');
        } else {
          showScreen('gameplay');
          game.lastTime = performance.now();
        }
      }
    });
  }
  
  function showMissionButtons() {
    var container = document.getElementById('missions-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    missions.forEach(function(m) {
      var btn = document.createElement('div');
      btn.className = 'mission-card';
      btn.style.cssText = 'padding: 15px; margin: 8px 0; background: rgba(255,255,255,0.1); border-radius: 10px; cursor: pointer; color: white; display: block;';
      btn.innerHTML = '<div style="font-weight: bold;">Mission ' + m.id + ': ' + m.name + '</div>' +
                      '<div style="font-size: 12px; color: #aaa;">' + m.difficulty.toUpperCase() + ' | ' + m.time + 's | ' + m.environment + '</div>';
      
      btn.onclick = function(e) {
        e.stopPropagation();
        startMission(m.id);
      };
      
      container.appendChild(btn);
    });
  }
  
  function startMission(missionId) {
    var mission = missions.find(function(m) { return m.id === missionId; });
    if (!mission) return;
    
    log('Starting mission: ' + mission.name);
    
    game.state = 'countdown';
    game.currentMission = mission;
    game.timeLeft = mission.time;
    game.score = 0;
    game.paused = false;
    
    player.x = 300;
    player.y = 600;
    player.angle = -Math.PI / 2;
    player.speed = 0;
    
    camera.x = 0;
    camera.y = 0;
    
    generateWorld(mission);
    showScreen('gameplay');
    startCountdown();
  }
  
  function generateWorld(mission) {
    obstacles = [];
    parkingSpots = [];
    particles = [];
    
    var env = mission.environment;
    
    if (env === 'parking' || env === 'underground') {
      for (var row = 0; row < 4; row++) {
        for (var col = 0; col < 5; col++) {
          parkingSpots.push({
            x: 200 + col * 120,
            y: 150 + row * 140,
            width: 70,
            height: 40,
            target: row === 3 && col === 2
          });
        }
      }
      
      for (var i = 0; i < 15; i++) {
        obstacles.push({
          type: 'car',
          x: 150 + Math.random() * 600,
          y: 100 + Math.random() * 600,
          angle: Math.random() * 0.4 - 0.2,
          color: ['#cc3333', '#3366cc', '#33cc66', '#cccc33', '#333333'][Math.floor(Math.random() * 5)]
        });
      }
    } else if (env === 'city' || env === 'traffic') {
      obstacles.push({ type: 'road', x: 600, y: 300, w: 100, h: 400 });
      obstacles.push({ type: 'road', x: 300, y: 500, w: 600, h: 80 });
      
      parkingSpots.push({ x: 150, y: 150, width: 70, height: 40, target: true });
      parkingSpots.push({ x: 150, y: 300, width: 70, height: 40, target: false });
      parkingSpots.push({ x: 900, y: 150, width: 70, height: 40, target: false });
      parkingSpots.push({ x: 900, y: 300, width: 70, height: 40, target: false });
      
      obstacles.push({ type: 'building', x: 200, y: 150, w: 80, h: 60 });
      obstacles.push({ type: 'building', x: 400, y: 150, w: 80, h: 60 });
      obstacles.push({ type: 'building', x: 800, y: 150, w: 80, h: 60 });
      obstacles.push({ type: 'building', x: 200, y: 700, w: 80, h: 60 });
      obstacles.push({ type: 'building', x: 400, y: 700, w: 80, h: 60 });
      obstacles.push({ type: 'building', x: 800, y: 700, w: 80, h: 60 });
    } else {
      parkingSpots.push({ x: 200, y: 200, width: 70, height: 40, target: true });
      parkingSpots.push({ x: 400, y: 200, width: 70, height: 40, target: false });
      parkingSpots.push({ x: 600, y: 200, width: 70, height: 40, target: false });
      
      obstacles.push({ type: 'house', x: 200, y: 500, w: 60, h: 40 });
      obstacles.push({ type: 'house', x: 400, y: 500, w: 60, h: 40 });
      obstacles.push({ type: 'house', x: 600, y: 500, w: 60, h: 40 });
      obstacles.push({ type: 'house', x: 800, y: 500, w: 60, h: 40 });
    }
  }
  
  function startCountdown() {
    game.countdown = 3;
    updateCountdownDisplay();
    
    var countdownInterval = setInterval(function() {
      game.countdown--;
      
      if (game.countdown > 0) {
        updateCountdownDisplay();
      } else {
        clearInterval(countdownInterval);
        
        game.state = 'playing';
        updateMissionUI();
        
        game.lastTime = performance.now();
      }
    }, 1000);
  }
  
  function updateCountdownDisplay() {
    var countdownEl = document.getElementById('countdown-display');
    if (!countdownEl) {
      var cd = document.createElement('div');
      cd.id = 'countdown-display';
      cd.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 120px; font-weight: bold; color: white; text-shadow: 0 0 30px rgba(0,240,255,0.8), 0 0 60px rgba(0,240,255,0.5); z-index: 1000; pointer-events: none;';
      document.getElementById('game-container').appendChild(cd);
      countdownEl = cd;
    }
    
    if (game.countdown === 0) {
      countdownEl.textContent = 'GO!';
      countdownEl.style.color = '#00ff00';
    } else {
      countdownEl.textContent = game.countdown;
    }
  }
  
  function updateMissionUI() {
    var countdownEl = document.getElementById('countdown-display');
    if (countdownEl) countdownEl.remove();
    
    if (!game.currentMission) return;
    
    var missionNameEl = document.getElementById('mission-name');
    var missionTimerEl = document.getElementById('mission-timer');
    
    if (missionNameEl) missionNameEl.textContent = game.currentMission.name;
    if (missionTimerEl) missionTimerEl.textContent = Math.ceil(game.timeLeft);
  }
  
  // ========================================
  // GAME LOOP
  // ========================================
  function startRenderLoop() {
    log('Starting render loop...');
    game.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  }
  
  function gameLoop(timestamp) {
    if (!game.lastTime) game.lastTime = timestamp;
    var dt = timestamp - game.lastTime;
    game.lastTime = timestamp;
    
    if (game.state === 'playing' && !game.paused) {
      update(Math.min(dt, 32));
    }
    
    draw();
    requestAnimationFrame(gameLoop);
  }
  
  function update(dt) {
    if (game.state === 'countdown') return;
    if (game.state !== 'playing' || game.paused) return;
    
    game.timeLeft -= dt / 1000;
    if (game.timeLeft <= 0) {
      gameOver('Time expired!');
      return;
    }
    
    var gas = keys['ArrowUp'] || keys['w'] || keys['W'] || touchGas;
    var brake = keys['ArrowDown'] || keys['s'] || keys['S'] || touchBrake;
    var left = keys['ArrowLeft'] || keys['a'] || keys['A'] || touchLeft;
    var right = keys['ArrowRight'] || keys['d'] || keys['D'] || touchRight;
    var reverse = keys[' '] || touchReverse;
    
    if (gas) player.speed += 0.15;
    else if (brake) player.speed -= 0.2;
    else player.speed *= 0.95;
    
    player.speed = Math.max(-3, Math.min(5, player.speed));
    
    if (Math.abs(player.speed) > 0.1) {
      var turnDir = player.speed > 0 ? 1 : -1;
      if (left) player.angle -= 0.04 * turnDir;
      if (right) player.angle += 0.04 * turnDir;
    }
    
    player.x += Math.cos(player.angle) * player.speed;
    player.y += Math.sin(player.angle) * player.speed;
    
    player.x = Math.max(20, Math.min(world.width - 20, player.x));
    player.y = Math.max(20, Math.min(world.height - 20, player.y));
    
    camera.x += (player.x - W / 2 - camera.x) * 0.08;
    camera.y += (player.y - H / 2 - camera.y) * 0.08;
    
    checkParking();
    updateMissionUI();
  }
  
  function checkParking() {
    for (var i = 0; i < parkingSpots.length; i++) {
      var spot = parkingSpots[i];
      if (!spot.target) continue;
      
      var dx = player.x - spot.x;
      var dy = player.y - spot.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 30 && Math.abs(player.speed) < 0.5) {
        missionComplete();
        return;
      }
    }
  }
  
  function missionComplete() {
    game.state = 'success';
    game.score = Math.floor(game.timeLeft * 20 + 500);
    
    var scoreEl = document.getElementById('success-score');
    if (scoreEl) scoreEl.textContent = game.score;
    
    showScreen('success-screen');
  }
  
  function gameOver(reason) {
    game.state = 'fail';
    
    var reasonEl = document.getElementById('fail-reason');
    if (reasonEl) reasonEl.textContent = reason;
    
    showScreen('fail-screen');
  }
  
  // ========================================
  // DRAWING
  // ========================================
  function draw() {
    ctx.fillStyle = game.currentMission ? 
      environmentConfigs[game.currentMission.environment].bg : '#1a1a2a';
    ctx.fillRect(0, 0, W, H);
    
    if (game.state === 'menu' || game.state === 'countdown' || game.state === 'loading') {
      drawMenu();
      return;
    }
    
    if (game.state !== 'playing' && game.state !== 'success' && game.state !== 'fail') return;
    
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    
    drawWorld();
    drawCar(player.x, player.y, player.angle, '#3388ff');
    
    ctx.restore();
  }
  
  function drawWorld() {
    for (var i = 0; i < parkingSpots.length; i++) {
      var spot = parkingSpots[i];
      ctx.strokeStyle = spot.target ? '#00ff00' : '#ffffff';
      ctx.lineWidth = spot.target ? 3 : 1;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(spot.x - spot.width / 2, spot.y - spot.height / 2, spot.width, spot.height);
      ctx.setLineDash([]);
      
      if (spot.target) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        ctx.fillRect(spot.x - spot.width / 2, spot.y - spot.height / 2, spot.width, spot.height);
      }
    }
    
    for (var j = 0; j < obstacles.length; j++) {
      var obs = obstacles[j];
      if (obs.type === 'car') {
        drawCar(obs.x, obs.y, obs.angle, obs.color);
      } else if (obs.type === 'building') {
        ctx.fillStyle = '#555566';
        ctx.fillRect(obs.x - obs.w / 2, obs.y - obs.h / 2, obs.w, obs.h);
      } else if (obs.type === 'house') {
        ctx.fillStyle = '#665544';
        ctx.fillRect(obs.x - obs.w / 2, obs.y - obs.h / 2, obs.w, obs.h);
        ctx.fillStyle = '#443322';
        ctx.beginPath();
        ctx.moveTo(obs.x - obs.w / 2 - 5, obs.y - obs.h / 2);
        ctx.lineTo(obs.x, obs.y - obs.h / 2 - 20);
        ctx.lineTo(obs.x + obs.w / 2 + 5, obs.y - obs.h / 2);
        ctx.fill();
      } else if (obs.type === 'road') {
        ctx.fillStyle = '#333333';
        ctx.fillRect(obs.x - obs.w / 2, obs.y - obs.h / 2, obs.w, obs.h);
      }
    }
  }
  
  function drawCar(x, y, angle, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    ctx.fillStyle = color;
    ctx.fillRect(-25, -15, 50, 30);
    
    ctx.fillStyle = '#222222';
    ctx.fillRect(-15, -12, 20, 24);
    
    ctx.fillStyle = '#88ccff';
    ctx.fillRect(-12, -10, 8, 20);
    ctx.fillRect(2, -10, 8, 20);
    
    ctx.restore();
  }
  
  function drawMenu() {
    ctx.fillStyle = '#ffffff';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CAR PARKING', W / 2, H / 2 - 30);
    ctx.font = '16px Arial';
    ctx.fillText('Tap PLAY to start', W / 2, H / 2 + 10);
  }
  
  // ========================================
  // INITIALIZE ON DOM READY
  // ========================================
  function init() {
    log('=== INITIALIZING CAR PARKING ===');
    log('State: NOT_STARTED, waiting for user tap');
    
    appState = StartupState.START_SCREEN;
    
    resizeCanvas();
    initStartScreen();
    
    log('Start screen shown, game ready to begin');
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();