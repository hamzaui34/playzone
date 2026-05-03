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
    { id: 1, name: "Empty Lot", difficulty: "easy", time: 60, environment: "parking_lot" },
    { id: 2, name: "Shopping Plaza", difficulty: "easy", time: 70, environment: "shopping" },
    { id: 3, name: "City Street", difficulty: "easy", time: 80, environment: "roadside" },
    { id: 4, name: "Rooftop", difficulty: "medium", time: 90, environment: "rooftop" },
    { id: 5, name: "Multi-Level", difficulty: "medium", time: 100, environment: "multilevel" },
    { id: 6, name: "Bridge", difficulty: "medium", time: 110, environment: "bridge" },
    { id: 7, name: "Mountain", difficulty: "hard", time: 120, environment: "mountain" },
    { id: 8, name: "Industrial", difficulty: "hard", time: 140, environment: "industrial" },
    { id: 9, name: "Night Mode", difficulty: "hard", time: 150, environment: "night" },
    { id: 10, name: "Underground", difficulty: "advanced", time: 160, environment: "underground" },
    { id: 11, name: "Rainy Day", difficulty: "advanced", time: 170, environment: "rain" },
    { id: 12, name: "Expert Drive", difficulty: "advanced", time: 180, environment: "expert" }
  ];
  
  var environmentConfigs = {
    parking_lot: { 
      bg: '#374151', road: '#1f2937', lines: '#fbbf24', floor: '#4b5563',
      name: 'Parking Lot', wallColor: '#6b7280', hasAsphalt: true
    },
    shopping: { 
      bg: '#1e3a5f', road: '#172554', lines: '#ffffff', floor: '#1e40af',
      name: 'Shopping Plaza', wallColor: '#3b82f6', hasAsphalt: true
    },
    roadside: { 
      bg: '#1f2937', road: '#111827', lines: '#fbbf24', floor: '#374151',
      name: 'Roadside', wallColor: '#4b5563', hasAsphalt: true
    },
    rooftop: { 
      bg: '#1e3a8a', road: '#1e40af', lines: '#ffffff', floor: '#3730a3',
      name: 'Rooftop', wallColor: '#6366f1', hasAsphalt: false
    },
    multilevel: { 
      bg: '#292524', road: '#1c1917', lines: '#f97316', floor: '#3c3836',
      name: 'Multi-Level', wallColor: '#78716c', hasAsphalt: true
    },
    bridge: { 
      bg: '#0f172a', road: '#1e3a8a', lines: '#ffffff', floor: '#1e40af',
      name: 'Bridge', wallColor: '#38bdf8', hasAsphalt: false
    },
    mountain: { 
      bg: '#14532d', road: '#166534', lines: '#fbbf24', floor: '#15803d',
      name: 'Mountain', wallColor: '#22c55e', hasAsphalt: false
    },
    industrial: { 
      bg: '#3f3f46', road: '#27272a', lines: '#f97316', floor: '#52525b',
      name: 'Industrial', wallColor: '#71717a', hasAsphalt: true
    },
    night: { 
      bg: '#0a0a0f', road: '#171717', lines: '#fbbf24', floor: '#262626',
      name: 'Night Mode', wallColor: '#52525b', hasAsphalt: true
    },
    underground: { 
      bg: '#1c1c1c', road: '#262626', lines: '#facc15', floor: '#404040',
      name: 'Underground', wallColor: '#a1a1aa', hasAsphalt: true
    },
    rain: { 
      bg: '#1e3a5f', road: '#172554', lines: '#ffffff', floor: '#1e40af',
      name: 'Rainy Day', wallColor: '#3b82f6', hasAsphalt: true
    },
    expert: { 
      bg: '#1f2937', road: '#111827', lines: '#ff6b6b', floor: '#374151',
      name: 'Expert', wallColor: '#ef4444', hasAsphalt: true
    }
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
    length: 50,
    model: 0,
    maxSpeed: 6,
    acceleration: 0.12,
    brakeForce: 0.25,
    friction: 0.97,
    turnSpeed: 0.035,
    driftFactor: 0.92,
    velocityX: 0,
    velocityY: 0
  };
  
  var carModels = [
    { name: 'Sport', bodyColor: '#2563eb', accentColor: '#1e40af', windowColor: '#1e3a5f' },
    { name: 'Luxury', bodyColor: '#1f2937', accentColor: '#374151', windowColor: '#0f172a' },
    { name: 'Classic', bodyColor: '#991b1b', accentColor: '#7f1d1d', windowColor: '#450a0a' }
  ];
  
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
    
    var carSelect = document.createElement('div');
    carSelect.style.cssText = 'margin-bottom: 20px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px;';
    carSelect.innerHTML = '<div style="color: white; font-weight: bold; margin-bottom: 10px;">Select Car:</div>';
    
    carModels.forEach(function(cm, idx) {
      var btn = document.createElement('button');
      btn.style.cssText = 'margin: 5px; padding: 10px 20px; background: ' + (idx === player.model ? '#2563eb' : 'rgba(255,255,255,0.2)') + '; border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: bold;';
      btn.textContent = cm.name;
      btn.onclick = function() {
        player.model = idx;
        showMissionButtons();
      };
      carSelect.appendChild(btn);
    });
    
    container.appendChild(carSelect);
    container.innerHTML = '';
    container.appendChild(carSelect);
    
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
    player.velocityX = 0;
    player.velocityY = 0;
    
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
    var config = environmentConfigs[env] || environmentConfigs.parking_lot;
    
    if (env === 'parking_lot') {
      world.width = 1200;
      world.height = 1200;
      
      for (var row = 0; row < 5; row++) {
        for (var col = 0; col < 4; col++) {
          parkingSpots.push({
            x: 180 + col * 140,
            y: 180 + row * 160,
            width: 65,
            height: 38,
            target: row === 4 && col === 1
          });
        }
      }
      
      obstacles.push({ type: 'wall', x: 80, y: 600, w: 20, h: 1200 });
      obstacles.push({ type: 'wall', x: 700, y: 600, w: 20, h: 1200 });
      obstacles.push({ type: 'wall', x: 390, y: 60, w: 640, h: 20 });
      obstacles.push({ type: 'wall', x: 390, y: 1140, w: 640, h: 20 });
      
      for (var i = 0; i < 12; i++) {
        obstacles.push({
          type: 'car',
          x: 120 + Math.random() * 500,
          y: 120 + Math.random() * 900,
          angle: Math.random() * 0.3 - 0.15,
          color: ['#dc2626', '#2563eb', '#16a34a', '#eab308', '#475569'][Math.floor(Math.random() * 5)]
        });
      }
      
      for (var i = 0; i < 20; i++) {
        if (Math.random() > 0.5) {
          obstacles.push({
            type: 'cone',
            x: 100 + Math.random() * 580,
            y: 100 + Math.random() * 1000
          });
        }
      }
      
    } else if (env === 'shopping') {
      world.width = 1400;
      world.height = 1000;
      
      for (var row = 0; row < 3; row++) {
        for (var col = 0; col < 5; col++) {
          parkingSpots.push({
            x: 200 + col * 130,
            y: 200 + row * 170,
            width: 60,
            height: 35,
            target: row === 2 && col === 2
          });
        }
      }
      
      obstacles.push({ type: 'building', x: 700, y: 100, w: 600, h: 800 });
      obstacles.push({ type: 'entrance', x: 700, y: 500 });
      
      for (var i = 0; i < 10; i++) {
        obstacles.push({
          type: 'car',
          x: 150 + Math.random() * 450,
          y: 180 + Math.random() * 600,
          angle: Math.random() * 0.4 - 0.2,
          color: ['#dc2626', '#2563eb', '#16a34a', '#eab308', '#7c3aed'][Math.floor(Math.random() * 5)]
        });
      }
      
    } else if (env === 'roadside') {
      world.width = 1600;
      world.height = 800;
      
      parkingSpots.push({ x: 150, y: 180, width: 60, height: 35, target: true });
      parkingSpots.push({ x: 150, y: 320, width: 60, height: 35, target: false });
      parkingSpots.push({ x: 150, y: 460, width: 60, height: 35, target: false });
      parkingSpots.push({ x: 150, y: 600, width: 60, height: 35, target: false });
      
      parkingSpots.push({ x: 800, y: 180, width: 60, height: 35, target: false });
      parkingSpots.push({ x: 800, y: 320, width: 60, height: 35, target: false });
      parkingSpots.push({ x: 800, y: 460, width: 60, height: 35, target: false });
      parkingSpots.push({ x: 800, y: 600, width: 60, height: 35, target: false });
      
      obstacles.push({ type: 'sidewalk', y: 100, h: 60 });
      obstacles.push({ type: 'sidewalk', y: 700, h: 60 });
      
      for (var i = 0; i < 8; i++) {
        obstacles.push({ type: 'tree', x: 450 + i * 130, y: 70 });
      }
      
    } else if (env === 'rooftop') {
      world.width = 1000;
      world.height = 800;
      
      for (var row = 0; row < 3; row++) {
        for (var col = 0; col < 4; col++) {
          parkingSpots.push({
            x: 180 + col * 120,
            y: 180 + row * 150,
            width: 55,
            height: 32,
            target: row === 2 && col === 1
          });
        }
      }
      
      obstacles.push({ type: 'edge', y: 50, h: 30 });
      obstacles.push({ type: 'edge', y: 750, h: 30 });
      obstacles.push({ type: 'railing', x: 100, y: 400 });
      obstacles.push({ type: 'railing', x: 900, y: 400 });
      
      for (var i = 0; i < 6; i++) {
        obstacles.push({
          type: 'car',
          x: 150 + Math.random() * 350,
          y: 150 + Math.random() * 450,
          angle: Math.random() * 0.3,
          color: ['#dc2626', '#2563eb', '#16a34a', '#eab308'][Math.floor(Math.random() * 4)]
        });
      }
      
    } else if (env === 'multilevel') {
      world.width = 900;
      world.height = 900;
      
      for (var row = 0; row < 4; row++) {
        for (var col = 0; col < 3; col++) {
          parkingSpots.push({
            x: 150 + col * 150,
            y: 150 + row * 130,
            width: 60,
            height: 35,
            target: row === 3 && col === 1
          });
        }
      }
      
      obstacles.push({ type: 'pillar', x: 80, y: 80 });
      obstacles.push({ type: 'pillar', x: 450, y: 80 });
      obstacles.push({ type: 'pillar', x: 80, y: 450 });
      obstacles.push({ type: 'pillar', x: 450, y: 450 });
      obstacles.push({ type: 'pillar', x: 80, y: 800 });
      obstacles.push({ type: 'pillar', x: 450, y: 800 });
      
    } else if (env === 'bridge') {
      world.width = 1400;
      world.height = 600;
      
      for (var col = 0; col < 6; col++) {
        parkingSpots.push({
          x: 250 + col * 150,
          y: 200,
          width: 55,
          height: 32,
          target: col === 4
        });
        parkingSpots.push({
          x: 250 + col * 150,
          y: 400,
          width: 55,
          height: 32,
          target: false
        });
      }
      
      obstacles.push({ type: 'bridge_rail', x: 700, y: 100 });
      obstacles.push({ type: 'bridge_rail', x: 700, y: 500 });
      
    } else if (env === 'mountain') {
      world.width = 1200;
      world.height = 1000;
      
      for (var row = 0; row < 3; row++) {
        for (var col = 0; col < 4; col++) {
          parkingSpots.push({
            x: 200 + col * 160,
            y: 300 + row * 180,
            width: 70,
            height: 40,
            target: row === 2 && col === 1
          });
        }
      }
      
      obstacles.push({ type: 'barrier', x: 150, y: 100, w: 20, h: 200 });
      obstacles.push({ type: 'barrier', x: 800, y: 100, w: 20, h: 200 });
      obstacles.push({ type: 'rock', x: 100, y: 300 });
      obstacles.push({ type: 'rock', x: 850, y: 350 });
      obstacles.push({ type: 'rock', x: 500, y: 150 });
      obstacles.push({ type: 'rock', x: 300, y: 750 });
      obstacles.push({ type: 'rock', x: 600, y: 800 });
      
    } else if (env === 'industrial' || env === 'expert') {
      world.width = 1100;
      world.height = 900;
      
      for (var row = 0; row < 4; row++) {
        for (var col = 0; col < 4; col++) {
          parkingSpots.push({
            x: 180 + col * 140,
            y: 180 + row * 140,
            width: 60,
            height: 35,
            target: row === 3 && col === 2
          });
        }
      }
      
      obstacles.push({ type: 'concrete', x: 550, y: 100, w: 200, h: 100 });
      obstacles.push({ type: 'barrier', x: 50, y: 100, w: 20, h: 200 });
      obstacles.push({ type: 'barrier', x: 50, y: 600, w: 20, h: 200 });
      
    } else if (env === 'night' || env === 'underground' || env === 'rain') {
      world.width = 1000;
      world.height = 800;
      
      for (var row = 0; row < 3; row++) {
        for (var col = 0; col < 4; col++) {
          parkingSpots.push({
            x: 150 + col * 130,
            y: 150 + row * 160,
            width: 55,
            height: 32,
            target: row === 2 && col === 1
          });
        }
      }
      
      obstacles.push({ type: 'light_post', x: 80, y: 80 });
      obstacles.push({ type: 'light_post', x: 500, y: 80 });
      obstacles.push({ type: 'light_post', x: 500, y: 400 });
      obstacles.push({ type: 'light_post', x: 80, y: 400 });
      
      if (env === 'rain') {
        for (var i = 0; i < 8; i++) {
          obstacles.push({
            type: 'puddle',
            x: 100 + Math.random() * 800,
            y: 150 + Math.random() * 500
          });
        }
      }
      
    } else {
      parkingSpots.push({ x: 200, y: 200, width: 70, height: 40, target: true });
      parkingSpots.push({ x: 400, y: 200, width: 70, height: 40, target: false });
      parkingSpots.push({ x: 600, y: 200, width: 70, height: 40, target: false });
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
    
    var targetSpeed = 0;
    if (gas) targetSpeed = player.maxSpeed;
    else if (brake) targetSpeed = -player.maxSpeed * 0.5;
    else if (reverse) targetSpeed = -player.maxSpeed * 0.3;
    
    if (gas) {
      player.speed += player.acceleration;
    } else if (brake) {
      player.speed -= player.brakeForce;
    } else {
      player.speed *= player.friction;
    }
    
    player.speed = Math.max(-player.maxSpeed * 0.5, Math.min(player.maxSpeed, player.speed));
    
    var speedFactor = Math.abs(player.speed) / player.maxSpeed;
    var turnAmount = player.turnSpeed * (0.5 + speedFactor * 0.5);
    
    if (Math.abs(player.speed) > 0.1) {
      var turnDir = player.speed > 0 ? 1 : -1;
      if (left) player.angle -= turnAmount * turnDir;
      if (right) player.angle += turnAmount * turnDir;
    }
    
    var moveAngle = player.angle;
    if (Math.abs(player.speed) > 2 && (left || right)) {
      var driftAngle = (left ? -1 : 1) * 0.1 * speedFactor;
      moveAngle += driftAngle;
    }
    
    player.velocityX = Math.cos(moveAngle) * player.speed;
    player.velocityY = Math.sin(moveAngle) * player.speed;
    
    player.x += player.velocityX;
    player.y += player.velocityY;
    
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
      
      var carWidth = player.width;
      var carLength = player.length;
      var halfW = carWidth / 2;
      var halfL = carLength / 2;
      
      var cosA = Math.cos(player.angle);
      var sinA = Math.sin(player.angle);
      
      var corners = [
        { x: player.x + cosA * halfL - sinA * halfW, y: player.y + sinA * halfL + cosA * halfW },
        { x: player.x + cosA * halfL + sinA * halfW, y: player.y + sinA * halfL - cosA * halfW },
        { x: player.x - cosA * halfL - sinA * halfW, y: player.y - sinA * halfL + cosA * halfW },
        { x: player.x - cosA * halfL + sinA * halfW, y: player.y - sinA * halfL - cosA * halfW }
      ];
      
      var allInside = true;
      for (var c = 0; c < corners.length; c++) {
        var cx = corners[c].x;
        var cy = corners[c].y;
        var spotLeft = spot.x - spot.width / 2;
        var spotRight = spot.x + spot.width / 2;
        var spotTop = spot.y - spot.height / 2;
        var spotBottom = spot.y + spot.height / 2;
        
        if (cx < spotLeft - 5 || cx > spotRight + 5 || cy < spotTop - 5 || cy > spotBottom + 5) {
          allInside = false;
          break;
        }
      }
      
      if (allInside && Math.abs(player.speed) < 0.3) {
        missionComplete(true);
        return;
      }
      
      var dx = player.x - spot.x;
      var dy = player.y - spot.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      
      if (allInside && Math.abs(player.speed) < 0.5) {
        missionComplete(false);
        return;
      }
    }
  }
  
  function missionComplete(isPerfect) {
    game.state = 'success';
    game.score = Math.floor(game.timeLeft * 20 + 500);
    
    var titleEl = document.querySelector('.result-title');
    if (titleEl) {
      titleEl.textContent = isPerfect ? 'PERFECT PARK!' : 'PARKED!';
    }
    
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
    var config = environmentConfigs[game.currentMission.environment] || environmentConfigs.parking_lot;
    
    ctx.fillStyle = config.bg;
    ctx.fillRect(0, 0, W, H);
    
    if (config.hasAsphalt) {
      drawAsphaltTexture(config);
    } else {
      drawConcreteTexture(config);
    }
    
    drawParkingSpots();
    drawObstacles(config);
  }
  
  function drawAsphaltTexture(config) {
    ctx.fillStyle = config.road;
    ctx.fillRect(0, 0, W, H);
    
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (var i = 0; i < 50; i++) {
      var x = (i * 73) % W;
      var y = (i * 97) % H;
      ctx.fillRect(x, y, 2, 2);
    }
    
    ctx.strokeStyle = config.lines;
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 15]);
    
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    
    ctx.setLineDash([]);
  }
  
  function drawConcreteTexture(config) {
    ctx.fillStyle = config.floor;
    ctx.fillRect(0, 0, W, H);
    
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    for (var i = 0; i < 20; i++) {
      ctx.strokeRect(50 + i * 60, 50 + i * 45, 50, 40);
    }
  }
  
  function drawParkingSpots() {
    for (var i = 0; i < parkingSpots.length; i++) {
      var spot = parkingSpots[i];
      
      if (spot.target) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
        ctx.fillRect(spot.x - spot.width / 2 - 3, spot.y - spot.height / 2 - 3, spot.width + 6, spot.height + 6);
      }
      
      ctx.strokeStyle = spot.target ? '#22c55e' : '#9ca3af';
      ctx.lineWidth = spot.target ? 3 : 2;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(spot.x - spot.width / 2, spot.y - spot.height / 2, spot.width, spot.height);
      ctx.setLineDash([]);
      
      ctx.fillStyle = spot.target ? 'rgba(34, 197, 94, 0.7)' : 'rgba(156, 163, 175, 0.5)';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(spot.target ? 'TARGET' : '', spot.x, spot.y + 4);
    }
  }
  
  function drawObstacles(config) {
    for (var i = 0; i < obstacles.length; i++) {
      var obs = obstacles[i];
      
      if (obs.type === 'car') {
        drawCar(obs.x, obs.y, obs.angle, obs.color);
      } else if (obs.type === 'wall') {
        ctx.fillStyle = config.wallColor;
        ctx.fillRect(obs.x - obs.w / 2, obs.y - obs.h / 2, obs.w, obs.h);
      } else if (obs.type === 'building') {
        ctx.fillStyle = config.wallColor;
        ctx.fillRect(obs.x - obs.w / 2, obs.y - obs.h / 2, obs.w, obs.h);
        
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(obs.x - obs.w / 2 + 5, obs.y + 5, obs.w - 10, 10);
        
        ctx.fillStyle = '#fbbf24';
        for (var w = 0; w < 3; w++) {
          ctx.fillRect(obs.x - obs.w / 2 + 15 + w * 25, obs.y - obs.h / 2 + 15, 12, 8);
        }
      } else if (obs.type === 'cone') {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y - 15);
        ctx.lineTo(obs.x - 8, obs.y + 10);
        ctx.lineTo(obs.x + 8, obs.y + 10);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(obs.x - 5, obs.y - 5, 10, 3);
      } else if (obs.type === 'tree') {
        ctx.fillStyle = '#166534';
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, 25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(obs.x, obs.y - 5, 18, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'sidewalk') {
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(0, obs.y, W, obs.h);
      } else if (obs.type === 'entrance') {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(obs.x - 30, obs.y - 25, 60, 50);
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 10px Arial';
        ctx.fillText('ENTRANCE', obs.x, obs.y + 4);
      } else if (obs.type === 'edge') {
        ctx.fillStyle = config.wallColor;
        ctx.fillRect(0, obs.y, W, obs.h);
      } else if (obs.type === 'railing') {
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(obs.x, obs.y - 5, 3, 250);
      } else if (obs.type === 'pillar') {
        ctx.fillStyle = '#71717a';
        ctx.fillRect(obs.x - 15, obs.y - 15, 30, 30);
        ctx.fillStyle = '#52525b';
        ctx.fillRect(obs.x - 10, obs.y - 10, 20, 20);
      } else if (obs.type === 'bridge_rail') {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(obs.x - 5, obs.y - 10, 10, 150);
      } else if (obs.type === 'barrier') {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(obs.x - obs.w / 2, obs.y - obs.h / 2, obs.w, obs.h);
      } else if (obs.type === 'rock') {
        ctx.fillStyle = '#57534e';
        ctx.beginPath();
        ctx.ellipse(obs.x, obs.y, 30, 20, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'light_post') {
        ctx.fillStyle = '#3f3f46';
        ctx.fillRect(obs.x - 3, obs.y - 15, 6, 50);
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(obs.x, obs.y - 15, 8, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'concrete') {
        ctx.fillStyle = '#71717a';
        ctx.fillRect(obs.x - obs.w / 2, obs.y - obs.h / 2, obs.w, obs.h);
        ctx.strokeStyle = '#52525b';
        ctx.strokeRect(obs.x - obs.w / 2 + 3, obs.y - obs.h / 2 + 3, obs.w - 6, obs.h - 6);
      } else if (obs.type === 'puddle') {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
        ctx.beginPath();
        ctx.ellipse(obs.x, obs.y, 40, 25, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'house') {
        ctx.fillStyle = config.wallColor;
        ctx.fillRect(obs.x - obs.w / 2, obs.y - obs.h / 2, obs.w, obs.h);
        
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y - obs.h / 2 - 15);
        ctx.lineTo(obs.x - obs.w / 2 - 5, obs.y);
        ctx.lineTo(obs.x + obs.w / 2 + 5, obs.y);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
  
  function drawCar(x, y, angle, color) {
    var model = carModels[player.model] || carModels[0];
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    var length = player.length;
    var width = player.width;
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    
    ctx.fillStyle = model.bodyColor;
    ctx.beginPath();
    ctx.moveTo(length / 2, 0);
    ctx.lineTo(length / 3, -width / 2);
    ctx.lineTo(-length / 3, -width / 2);
    ctx.lineTo(-length / 2, -width / 3);
    ctx.lineTo(-length / 2, width / 3);
    ctx.lineTo(-length / 3, width / 2);
    ctx.lineTo(length / 3, width / 2);
    ctx.closePath();
    ctx.fill();
    
    ctx.shadowColor = 'transparent';
    
    ctx.fillStyle = model.windowColor;
    ctx.beginPath();
    ctx.moveTo(length / 4, -width / 2 + 4);
    ctx.lineTo(-length / 4, -width / 2 + 4);
    ctx.lineTo(-length / 4, width / 2 - 4);
    ctx.lineTo(length / 4, width / 2 - 4);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = 'rgba(135, 206, 235, 0.6)';
    ctx.fillRect(-length / 4 + 2, -width / 2 + 6, length / 3, width / 2 - 12);
    
    ctx.fillStyle = model.accentColor;
    ctx.fillRect(-length / 2 + 2, -width / 3, length / 5, width / 1.5);
    
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(length / 3, -width / 2.5, 5, 0, Math.PI * 2);
    ctx.arc(length / 3, width / 2.5, 5, 0, Math.PI * 2);
    ctx.arc(-length / 3, -width / 2.5, 5, 0, Math.PI * 2);
    ctx.arc(-length / 3, width / 2.5, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(length / 3, -width / 2.5, 2.5, 0, Math.PI * 2);
    ctx.arc(length / 3, width / 2.5, 2.5, 0, Math.PI * 2);
    ctx.arc(-length / 3, -width / 2.5, 2.5, 0, Math.PI * 2);
    ctx.arc(-length / 3, width / 2.5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(-length / 2 - 1, -width / 4, 3, 4);
    ctx.fillRect(-length / 2 - 1, width / 4 - 4, 3, 4);
    
    ctx.fillStyle = '#ffff99';
    ctx.fillRect(length / 2 - 2, -width / 4, 3, 4);
    ctx.fillRect(length / 2 - 2, width / 4 - 4, 3, 4);
    
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