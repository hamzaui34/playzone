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
  let joystickX = 0, joystickY = 0, joystickActive = false;
  
  function initTouchControls() {
    log('Initializing touch controls...');
    
    // Button controls
    const btnIds = ['steer-left', 'steer-right', 'accelerate-btn', 'brake-btn', 'reverse-btn'];
    
    btnIds.forEach(function(id) {
      const btn = document.getElementById(id);
      if (!btn) return;
      
      btn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        updateTouchState(id, true);
      }, { passive: false });
      
      btn.addEventListener('touchend', function(e) {
        e.preventDefault();
        updateTouchState(id, false);
      }, { passive: false });
      
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
    
    // Mobile joystick
    initMobileJoystick();
    
    // Mobile buttons
    initMobileButtons();
    
    log('Touch controls ready');
  }
  
  function initMobileJoystick() {
    var joystickArea = document.getElementById('joystick-area');
    var joystickBase = document.getElementById('joystick-base');
    var joystickThumb = document.getElementById('joystick-thumb');
    
    if (!joystickArea || !joystickBase || !joystickThumb) return;
    
    var maxDist = 40;
    var centerX, centerY;
    
    function updateJoystickPosition(clientX, clientY) {
      var rect = joystickBase.getBoundingClientRect();
      centerX = rect.left + rect.width / 2;
      centerY = rect.top + rect.height / 2;
      
      var dx = clientX - centerX;
      var dy = clientY - centerY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
      }
      
      joystickThumb.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
      
      joystickX = dx / maxDist;
      joystickY = dy / maxDist;
    }
    
    function resetJoystick() {
      joystickThumb.style.transform = 'translate(0, 0)';
      joystickX = 0;
      joystickY = 0;
      joystickActive = false;
      touchLeft = false;
      touchRight = false;
    }
    
    joystickArea.addEventListener('touchstart', function(e) {
      e.preventDefault();
      joystickActive = true;
      var touch = e.touches[0];
      updateJoystickPosition(touch.clientX, touch.clientY);
    }, { passive: false });
    
    joystickArea.addEventListener('touchmove', function(e) {
      e.preventDefault();
      if (!joystickActive) return;
      var touch = e.touches[0];
      updateJoystickPosition(touch.clientX, touch.clientY);
    }, { passive: false });
    
    joystickArea.addEventListener('touchend', function(e) {
      e.preventDefault();
      resetJoystick();
    }, { passive: false });
    
    joystickArea.addEventListener('touchcancel', function(e) {
      resetJoystick();
    });
  }
  
  function initMobileButtons() {
    var gasBtn = document.getElementById('mobile-gas');
    var brakeBtn = document.getElementById('mobile-brake');
    var reverseBtn = document.getElementById('mobile-reverse');
    
    [gasBtn, brakeBtn, reverseBtn].forEach(function(btn) {
      if (!btn) return;
      
      btn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        btn.classList.add('pressed');
        if (btn === gasBtn) touchGas = true;
        if (btn === brakeBtn) touchBrake = true;
        if (btn === reverseBtn) touchReverse = true;
      }, { passive: false });
      
      btn.addEventListener('touchend', function(e) {
        e.preventDefault();
        btn.classList.remove('pressed');
        if (btn === gasBtn) touchGas = false;
        if (btn === brakeBtn) touchBrake = false;
        if (btn === reverseBtn) touchReverse = false;
      }, { passive: false });
    });
  }
  
  function applyJoystickInput() {
    if (Math.abs(joystickX) > 0.3) {
      if (joystickX < 0) {
        touchLeft = true;
        touchRight = false;
      } else {
        touchLeft = false;
        touchRight = true;
      }
    } else {
      touchLeft = false;
      touchRight = false;
    }
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
    
    window.gameAudioContext = null;
    window.gameAudioInitialized = false;
    initAudioSystem();
    
    setTimeout(function() {
      loadStep5_Game();
    }, 100);
  }
  
  // ========================================
  // AUDIO SYSTEM
  // ========================================
  var audioCtx = null;
  var engineOsc = null;
  var engineGain = null;
  var tireOsc = null;
  var tireGain = null;
  var lastEngineFreq = 80;
  var lastEngineVol = 0;
  var tireVolume = 0;
  
  function initAudioSystem() {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      engineGain = audioCtx.createGain();
      engineGain.gain.value = 0;
      engineGain.connect(audioCtx.destination);
      
      tireGain = audioCtx.createGain();
      tireGain.gain.value = 0;
      tireGain.connect(audioCtx.destination);
    } catch (e) {
      log('Audio not supported');
    }
  }
  
  function playEngineSound(speed) {
    if (!audioCtx || audioCtx.state === 'suspended') return;
    
    var absSpeed = Math.abs(speed);
    var targetFreq = 60 + absSpeed * 25;
    var targetVol = Math.min(0.15, absSpeed * 0.03);
    
    if (Math.abs(speed) < 0.1) {
      targetFreq = 55;
      targetVol = 0.08;
    }
    
    if (Math.abs(targetFreq - lastEngineFreq) > 2 || Math.abs(targetVol - lastEngineVol) > 0.01) {
      try {
        if (!engineOsc) {
          engineOsc = audioCtx.createOscillator();
          engineOsc.type = 'sawtooth';
          engineOsc.frequency.value = targetFreq;
          engineOsc.connect(engineGain);
          engineOsc.start();
        }
        
        engineGain.gain.setTargetAtTime(targetVol, audioCtx.currentTime, 0.1);
        engineOsc.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.08);
        
        lastEngineFreq = targetFreq;
        lastEngineVol = targetVol;
      } catch (e) {}
    }
  }
  
  function playTireSound(drifting) {
    if (!audioCtx) return;
    
    var targetTireVol = drifting ? 0.12 : 0;
    
    if (Math.abs(targetTireVol - tireVolume) > 0.01) {
      try {
        if (!tireOsc) {
          tireOsc = audioCtx.createOscillator();
          tireOsc.type = 'square';
          tireOsc.frequency.value = 200;
          tireOsc.connect(tireGain);
          tireOsc.start();
        }
        
        tireGain.gain.setTargetAtTime(targetTireVol, audioCtx.currentTime, 0.05);
        tireVolume = targetTireVol;
      } catch (e) {}
    }
  }
  
  function playCollisionSound() {
    if (!audioCtx) return;
    
    try {
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      
      osc.type = 'square';
      osc.frequency.value = 80;
      gain.gain.value = 0.2;
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.frequency.setTargetAtTime(40, audioCtx.currentTime + 0.05, 0.02);
      gain.gain.setTargetAtTime(0, audioCtx.currentTime + 0.1, 0.02);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {}
  }
  
  function stopSounds() {
    if (engineGain && engineGain.gain) {
      engineGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.2);
    }
    if (tireGain && tireGain.gain) {
      tireGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.2);
    }
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
    { id: 1, name: "Empty Lot", difficulty: "easy", time: 60, environment: "parking_lot", coins: 50 },
    { id: 2, name: "Shopping Plaza", difficulty: "easy", time: 70, environment: "shopping", coins: 75 },
    { id: 3, name: "City Street", difficulty: "easy", time: 80, environment: "roadside", coins: 100 },
    { id: 4, name: "Rooftop", difficulty: "medium", time: 90, environment: "rooftop", coins: 150 },
    { id: 5, name: "Multi-Level", difficulty: "medium", time: 100, environment: "multilevel", coins: 200 },
    { id: 6, name: "Bridge", difficulty: "medium", time: 110, environment: "bridge", coins: 250 },
    { id: 7, name: "Mountain", difficulty: "hard", time: 120, environment: "mountain", coins: 350 },
    { id: 8, name: "Industrial", difficulty: "hard", time: 140, environment: "industrial", coins: 450 },
    { id: 9, name: "Night Mode", difficulty: "hard", time: 150, environment: "night", coins: 500 },
    { id: 10, name: "Underground", difficulty: "advanced", time: 160, environment: "underground", coins: 650 },
    { id: 11, name: "Rainy Day", difficulty: "advanced", time: 170, environment: "rain", coins: 750 },
    { id: 12, name: "Expert Drive", difficulty: "advanced", time: 180, environment: "expert", coins: 1000 }
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
    velocityY: 0,
    traction: 1
  };
  
  var carModels = [
    { 
      name: ' sedan', 
      bodyColor: '#2563eb', 
      accentColor: '#1e40af', 
      windowColor: '#1e3a5f',
      price: 0,
      maxSpeed: 5.5,
      acceleration: 0.11,
      brakeForce: 0.22,
      turnSpeed: 0.032,
      unlocked: true,
      desc: 'Balanced'
    },
    { 
      name: 'Sport', 
      bodyColor: '#dc2626', 
      accentColor: '#991b1b', 
      windowColor: '#450a0a',
      price: 500,
      maxSpeed: 6.5,
      acceleration: 0.15,
      brakeForce: 0.28,
      turnSpeed: 0.04,
      unlocked: false,
      desc: 'Fast & Agile'
    },
    { 
      name: 'Luxury', 
      bodyColor: '#1f2937', 
      accentColor: '#374151', 
      windowColor: '#0f172a',
      price: 800,
      maxSpeed: 5,
      acceleration: 0.09,
      brakeForce: 0.35,
      turnSpeed: 0.028,
      unlocked: false,
      desc: 'Great Braking'
    },
    { 
      name: 'Truck', 
      bodyColor: '#16a34a', 
      accentColor: '#166534', 
      windowColor: '#052e16',
      price: 1200,
      maxSpeed: 4.5,
      acceleration: 0.08,
      brakeForce: 0.4,
      turnSpeed: 0.025,
      unlocked: false,
      desc: 'Slow but Grip'
    },
    { 
      name: 'Race', 
      bodyColor: '#9333ea', 
      accentColor: '#7c3aed', 
      windowColor: '#3b0764',
      price: 2000,
      maxSpeed: 7.5,
      acceleration: 0.18,
      brakeForce: 0.3,
      turnSpeed: 0.045,
      unlocked: false,
      desc: 'Maximum Speed'
    },
    { 
      name: 'Drift', 
      bodyColor: '#f59e0b', 
      accentColor: '#d97706', 
      windowColor: '#78350f',
      price: 3000,
      maxSpeed: 6,
      acceleration: 0.14,
      brakeForce: 0.2,
      turnSpeed: 0.055,
      unlocked: false,
      desc: 'Drift King'
    }
  ];
  
  var playerData = {
    coins: 0,
    unlockedCars: [0],
    highestLevel: 1,
    totalPerfects: 0,
    totalPlays: 0
  };
  
  function loadPlayerData() {
    try {
      var saved = localStorage.getItem('carParking_player');
      if (saved) {
        var data = JSON.parse(saved);
        playerData.coins = data.coins || 0;
        playerData.unlockedCars = data.unlockedCars || [0];
        playerData.highestLevel = data.highestLevel || 1;
        playerData.totalPerfects = data.totalPerfects || 0;
        playerData.totalPlays = data.totalPlays || 0;
        
        carModels.forEach(function(cm, idx) {
          cm.unlocked = playerData.unlockedCars.indexOf(idx) >= 0;
        });
      }
    } catch (e) {
      log('Could not load player data');
    }
  }
  
  function savePlayerData() {
    try {
      localStorage.setItem('carParking_player', JSON.stringify(playerData));
    } catch (e) {
      log('Could not save player data');
    }
  }
  
  function addCoins(amount) {
    playerData.coins += amount;
    savePlayerData();
  }
  
  function unlockCar(carIndex) {
    var car = carModels[carIndex];
    if (!car || car.unlocked || playerData.coins < car.price) return false;
    
    playerData.coins -= car.price;
    car.unlocked = true;
    playerData.unlockedCars.push(carIndex);
    savePlayerData();
    return true;
  }
  
loadPlayerData();

  var world = { width: 1200, height: 1000 };
  var obstacles = [];
  var parkingSpots = [];
  var particles = [];
  
  var camera = { 
    x: 0, 
    y: 0,
    targetX: 0,
    targetY: 0,
    mode: 0,
    zoom: 1,
    targetZoom: 1
  };
  
  var cameraModes = [
    { name: 'Top-Down', zoom: 1, offsetAngle: 0 },
    { name: 'Follow', zoom: 0.9, offsetAngle: 0.15 },
    { name: 'Cinematic', zoom: 1.1, offsetAngle: -0.1 }
  ];
  
  var cameraConfig = {
    smoothing: 0.08,
    minZoom: 0.7,
    maxZoom: 1.4
  };
  
  function updateCamera() {
    var mode = cameraModes[camera.mode];
    
    var targetX = player.x;
    var targetY = player.y;
    
    if (camera.mode === 1) {
      var followOffset = 100;
      targetX = player.x - Math.cos(player.angle + Math.PI) * followOffset;
      targetY = player.y - Math.sin(player.angle + Math.PI) * followOffset;
    } else if (camera.mode === 2) {
      var cinematicOffset = 50 + Math.abs(player.speed) * 10;
      targetX = player.x - Math.cos(player.angle) * cinematicOffset;
      targetY = player.y - Math.sin(player.angle) * cinematicOffset;
      camera.targetZoom = 1 + Math.abs(player.speed) * 0.05;
    } else {
      camera.targetZoom = 1;
    }
    
    camera.targetZoom = Math.max(cameraConfig.minZoom, Math.min(cameraConfig.maxZoom, camera.targetZoom));
    camera.targetX = targetX;
    camera.targetY = targetY;
    
    camera.x += (camera.targetX - camera.x) * cameraConfig.smoothing;
    camera.y += (camera.targetY - camera.y) * cameraConfig.smoothing;
    camera.zoom += (camera.targetZoom - camera.zoom) * 0.05;
    
    var halfW = (W / 2) / camera.zoom;
    var halfH = (H / 2) / camera.zoom;
    
    camera.x = Math.max(halfW, Math.min(world.width - halfW, camera.x));
    camera.y = Math.max(halfH, Math.min(world.height - halfH, camera.y));
  }
  
  function cycleCameraMode() {
    camera.mode = (camera.mode + 1) % cameraModes.length;
    log('Camera mode: ' + cameraModes[camera.mode].name);
  }
  
  function adjustColor(hex, amount) {
    var num = parseInt(hex.replace('#', ''), 16);
    var r = Math.min(255, Math.max(0, (num >> 16) + amount));
    var g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    var b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return '#' + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
  }
  
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
    
    document.addEventListener('keydown', function(e) {
      if (e.key === 'c' || e.key === 'C') {
        cycleCameraMode();
      }
    });
    
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
    
    var coinDisplay = document.createElement('div');
    coinDisplay.style.cssText = 'text-align: center; margin-bottom: 15px; padding: 12px; background: rgba(251, 191, 36, 0.2); border-radius: 10px; border: 2px solid #fbbf24;';
    coinDisplay.innerHTML = '<div style="color: #fbbf24; font-size: 24px; font-weight: bold;">' + playerData.coins + ' COINS</div>' +
                       '<div style="color: #9ca3af; font-size: 11px;">Level: ' + playerData.highestLevel + ' | Perfects: ' + playerData.totalPerfects + '</div>';
    container.appendChild(coinDisplay);
    
    var shopTitle = document.createElement('div');
    shopTitle.style.cssText = 'color: white; font-weight: bold; margin: 15px 0 10px;';
    shopTitle.textContent = 'GARAGE - Select Car:';
    container.appendChild(shopTitle);
    
    carModels.forEach(function(cm, idx) {
      var carDiv = document.createElement('div');
      carDiv.style.cssText = 'margin: 8px 0; padding: 12px; background: ' + (idx === player.model ? 'rgba(37, 99, 235, 0.3)' : 'rgba(255,255,255,0.1)') + '; border-radius: 10px; border: 2px solid ' + (idx === player.model ? '#3b82f6' : 'transparent') + '; cursor: pointer;';
      carDiv.onclick = function() {
        if (cm.unlocked) {
          player.model = idx;
          applyCarStats(idx);
          showMissionButtons();
        } else if (unlockCar(idx)) {
          showMissionButtons();
        }
      };
      
      var carInfo = '<div style="display: flex; justify-content: space-between; align-items: center;">' +
                 '<div>' +
                   '<div style="color: ' + cm.bodyColor + '; font-weight: bold; font-size: 16px;">' + cm.name + '</div>' +
                   '<div style="color: #9ca3af; font-size: 11px;">' + cm.desc + '</div>' +
                 '</div>';
      
      if (cm.unlocked) {
        carInfo += '<div style="color: #22c55e; font-weight: bold;">OWNED</div>';
      } else {
        carInfo += '<div style="color: ' + (playerData.coins >= cm.price ? '#fbbf24' : '#ef4444') + '; font-weight: bold;">' + cm.price + ' coins</div>';
      }
      
      carDiv.innerHTML = carInfo;
      container.appendChild(carDiv);
    });
    
    var missionTitle = document.createElement('div');
    missionTitle.style.cssText = 'color: white; font-weight: bold; margin: 20px 0 10px;';
    missionTitle.textContent = 'MISSIONS:';
    container.appendChild(missionTitle);
    
    missions.forEach(function(m) {
      var locked = m.id > playerData.highestLevel;
      var btn = document.createElement('div');
      btn.className = 'mission-card';
      btn.style.cssText = 'padding: 15px; margin: 8px 0; background: ' + (locked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)') + '; border-radius: 10px; cursor: ' + (locked ? 'not-allowed' : 'pointer') + '; color: ' + (locked ? '#6b7280' : 'white') + '; display: block; opacity: ' + (locked ? 0.5 : 1) + ';';
      btn.innerHTML = '<div style="font-weight: bold;">Mission ' + m.id + ': ' + m.name + '</div>' +
                    '<div style="font-size: 12px; color: #aaa;">' + m.difficulty.toUpperCase() + ' | ' + m.time + 's | +' + m.coins + ' coins</div>';
      
      if (!locked) {
        btn.onclick = function(e) {
          e.stopPropagation();
          startMission(m.id);
        };
      }
      
      container.appendChild(btn);
    });
  }
  
  function applyCarStats(carIndex) {
    var car = carModels[carIndex];
    if (!car) return;
    
    player.maxSpeed = car.maxSpeed;
    player.acceleration = car.acceleration;
    player.brakeForce = car.brakeForce;
    player.turnSpeed = car.turnSpeed;
  }
  
  applyCarStats(player.model);
  
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

  var tireTracks = [];
  var maxTireTracks = 40;
  
function update(dt) {
    if (game.state === 'countdown') return;
    if (game.state !== 'playing' || game.paused) return;
    
    game.timeLeft -= dt / 1000;
    if (game.timeLeft <= 0) {
      stopSounds();
      gameOver('Time expired!');
      return;
    }
    
    var gas = keys['ArrowUp'] || keys['w'] || keys['W'] || touchGas;
    var brake = keys['ArrowDown'] || keys['s'] || keys['S'] || touchBrake;
    var left = keys['ArrowLeft'] || keys['a'] || keys['A'] || touchLeft;
    var right = keys['ArrowRight'] || keys['d'] || keys['D'] || touchRight;
    var reverse = keys[' '] || touchReverse;
    
    var handbrake = brake && Math.abs(player.speed) > 2;
    
    var speedFactor = Math.abs(player.speed) / player.maxSpeed;
    player.traction = 1 - (speedFactor * 0.6);
    if (handbrake) player.traction = 0.3;
    
    if (gas) {
      player.speed += player.acceleration * player.traction;
    } else if (brake) {
      player.speed -= (handbrake ? player.brakeForce * 1.5 : player.brakeForce);
    } else {
      player.speed *= player.friction;
    }
    
    var turnGrip = player.traction * 0.7;
    var turnAmount = player.turnSpeed * (0.3 + speedFactor * 0.7) * turnGrip;
    
    if (handbrake) {
      turnAmount *= 2.2;
    }
    
    if (Math.abs(player.speed) > 0.15) {
      var turnDir = player.speed > 0 ? 1 : -1;
      if (left) player.angle -= turnAmount * turnDir;
      if (right) player.angle += turnAmount * turnDir;
    }
    
    var grip = player.traction;
    if (handbrake) grip = 0.4;
    
    player.velocityX = player.velocityX * 0.92 + Math.cos(player.angle) * player.speed * (1 - grip) * 0.08;
    player.velocityY = player.velocityY * 0.92 + Math.sin(player.angle) * player.speed * (1 - grip) * 0.08;
    
    var moveX = Math.cos(player.angle) * player.speed * grip;
    var moveY = Math.sin(player.angle) * player.speed * grip;
    
    player.x += moveX + player.velocityX;
    player.y += moveY + player.velocityY;
    
    var isDrifting = handbrake || (speedFactor > 0.6 && (left || right));
    if (audioCtx && audioCtx.state === 'running') {
      playEngineSound(player.speed);
      playTireSound(isDrifting);
    }
    
    if (isDrifting && Math.abs(player.speed) > 1) {
      tireTracks.push({
        x: player.x - Math.cos(player.angle) * player.length * 0.4,
        y: player.y - Math.sin(player.angle) * player.length * 0.4,
        alpha: Math.min(0.5, speedFactor)
      });
      tireTracks.push({
        x: player.x - Math.cos(player.angle) * player.length * 0.4 + Math.sin(player.angle) * player.width * 0.3,
        y: player.y - Math.sin(player.angle) * player.length * 0.4 - Math.cos(player.angle) * player.width * 0.3,
        alpha: Math.min(0.5, speedFactor)
      });
      
      if (tireTracks.length > maxTireTracks) {
        tireTracks.shift();
        tireTracks.shift();
      }
    }
    
    handleCollisions();
    
    player.x = Math.max(25, Math.min(world.width - 25, player.x));
    player.y = Math.max(25, Math.min(world.height - 25, player.y));
    
    updateCamera();
    
    checkParking();
    updateMissionUI();
  }
  
  function getPlayerCorners() {
    var carWidth = player.width;
    var carLength = player.length;
    var halfW = carWidth / 2;
    var halfL = carLength / 2;
    
    var cosA = Math.cos(player.angle);
    var sinA = Math.sin(player.angle);
    
    return [
      { x: player.x + cosA * halfL - sinA * halfW, y: player.y + sinA * halfL + cosA * halfW },
      { x: player.x + cosA * halfL + sinA * halfW, y: player.y + sinA * halfL - cosA * halfW },
      { x: player.x - cosA * halfL - sinA * halfW, y: player.y - sinA * halfL + cosA * halfW },
      { x: player.x - cosA * halfL + sinA * halfW, y: player.y - sinA * halfL - cosA * halfW }
    ];
  }
  
  function pointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx - rw / 2 && px <= rx + rw / 2 && py >= ry - rh / 2 && py <= ry + rh / 2;
  }
  
  function rectanglesOverlap(r1x1, r1y1, r1w, r1h, r2x1, r2y1, r2w, r2h, angle) {
    if (angle) {
      var corners1 = getPlayerCorners();
      for (var i = 0; i < 4; i++) {
        if (pointInRect(corners1[i].x, corners1[i].y, r2x1, r2y1, r2w, r2h)) return true;
      }
      return false;
    }
    return r1x1 - r1w / 2 < r2x1 + r2w / 2 && r1x1 + r1w / 2 > r2x1 - r2w / 2 &&
           r1y1 - r1h / 2 < r2y1 + r2h / 2 && r1y1 + r1h / 2 > r2y1 - r2h / 2;
  }
  
  function circleRectOverlap(cx, cy, cr, rx, ry, rw, rh) {
    var closestX = Math.max(rx - rw / 2, Math.min(cx, rx + rw / 2));
    var closestY = Math.max(ry - rh / 2, Math.min(cy, ry + rh / 2));
    var distX = cx - closestX;
    var distY = cy - closestY;
    return (distX * distX + distY * distY) < (cr * cr);
  }
  
  function handleCollisions() {
    for (var i = 0; i < obstacles.length; i++) {
      var obs = obstacles[i];
      var collided = false;
      var collisionNormal = { x: 0, y: 0 };
      
      if (obs.type === 'car' || obs.type === 'wall') {
        var obsW = obs.w || 50;
        var obsH = obs.h || 30;
        if (rectanglesOverlap(player.x, player.y, player.length, player.width, obs.x, obs.y, obsW, obsH, obs.angle)) {
          collided = true;
          var dx = player.x - obs.x;
          var dy = player.y - obs.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            collisionNormal.x = dx / dist;
            collisionNormal.y = dy / dist;
          } else {
            collisionNormal.x = 1;
            collisionNormal.y = 0;
          }
        }
      } else if (obs.type === 'building' || obs.type === 'concrete') {
        if (rectanglesOverlap(player.x, player.y, player.length, player.width, obs.x, obs.y, obs.w, obs.h, 0)) {
          collided = true;
          var dx = player.x - obs.x;
          var dy = player.y - obs.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            collisionNormal.x = dx / dist;
            collisionNormal.y = dy / dist;
          } else {
            collisionNormal.x = 1;
            collisionNormal.y = 0;
          }
        }
      } else if (obs.type === 'barrier' || obs.type === 'edge') {
        var bw = obs.w || 20;
        var bh = obs.h || 30;
        if (rectanglesOverlap(player.x, player.y, player.length, player.width, obs.x, obs.y, bw, bh, 0)) {
          collided = true;
          if (obs.w < obs.h) {
            collisionNormal.x = player.x > obs.x ? 1 : -1;
            collisionNormal.y = 0;
          } else {
            collisionNormal.x = 0;
            collisionNormal.y = player.y > obs.y ? 1 : -1;
          }
        }
      } else if (obs.type === 'cone') {
        if (circleRectOverlap(player.x, player.y, 15, obs.x, obs.y, 15, 15)) {
          collided = true;
          var dx = player.x - obs.x;
          var dy = player.y - obs.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            collisionNormal.x = dx / dist;
            collisionNormal.y = dy / dist;
          }
        }
      } else if (obs.type === 'tree') {
        if (circleRectOverlap(player.x, player.y, 25, obs.x, obs.y, 25, 25)) {
          collided = true;
          var dx = player.x - obs.x;
          var dy = player.y - obs.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            collisionNormal.x = dx / dist;
            collisionNormal.y = dy / dist;
          }
        }
      } else if (obs.type === 'bridge_rail') {
        if (rectanglesOverlap(player.x, player.y, player.length, player.width, obs.x, obs.y, 10, 150, 0)) {
          collided = true;
          collisionNormal.x = player.x > obs.x ? 1 : -1;
          collisionNormal.y = 0;
        }
      } else if (obs.type === 'railing') {
        if (rectanglesOverlap(player.x, player.y, player.length, player.width, obs.x, obs.y, 3, 250, 0)) {
          collided = true;
          collisionNormal.x = player.x > obs.x ? 1 : -1;
          collisionNormal.y = 0;
        }
      } else if (obs.type === 'rock') {
        if (circleRectOverlap(player.x, player.y, 20, obs.x, obs.y, 30, 20)) {
          collided = true;
          var dx = player.x - obs.x;
          var dy = player.y - obs.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            collisionNormal.x = dx / dist;
            collisionNormal.y = dy / dist;
          }
        }
      } else if (obs.type === 'pillar') {
        if (circleRectOverlap(player.x, player.y, 15, obs.x, obs.y, 30, 30)) {
          collided = true;
          var dx = player.x - obs.x;
          var dy = player.y - obs.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            collisionNormal.x = dx / dist;
            collisionNormal.y = dy / dist;
          }
        }
      } else if (obs.type === 'light_post') {
        if (circleRectOverlap(player.x, player.y, 8, obs.x, obs.y, 8, 50)) {
          collided = true;
          var dx = player.x - obs.x;
          var dy = player.y - obs.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            collisionNormal.x = dx / dist;
            collisionNormal.y = dy / dist;
          }
        }
      }
      
      if (collided) {
        var pushStrength = 3;
        player.x += collisionNormal.x * pushStrength;
        player.y += collisionNormal.y * pushStrength;
        
        player.speed *= 0.5;
        player.velocityX *= -0.3;
        player.velocityY *= -0.3;
        
        log('Collision with: ' + obs.type);
        playCollisionSound();
      }
    }
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
    var baseScore = Math.floor(game.timeLeft * 20 + 500);
    var missionCoins = game.currentMission ? game.currentMission.coins : 50;
    var perfectBonus = isPerfect ? Math.floor(missionCoins * 0.5) : 0;
    var totalCoins = missionCoins + perfectBonus;
    
    game.score = baseScore + (isPerfect ? 200 : 0);
    
    playerData.totalPlays++;
    playerData.totalPerfects += isPerfect ? 1 : 0;
    
    if (game.currentMission && game.currentMission.id >= playerData.highestLevel) {
      playerData.highestLevel = Math.min(12, game.currentMission.id + 1);
    }
    
    addCoins(totalCoins);
    
    var titleEl = document.querySelector('.result-title');
    if (titleEl) {
      titleEl.textContent = isPerfect ? 'PERFECT PARK!' : 'PARKED!';
    }
    
    var scoreEl = document.getElementById('success-score');
    if (scoreEl) {
      scoreEl.textContent = game.score + '\n+' + totalCoins + ' coins';
    }
    
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
    ctx.translate(W / 2, H / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-W / 2, -H / 2);
    ctx.translate(-camera.x, -camera.y);
    
    drawWorld();
    drawTireTracks();
    drawCar(player.x, player.y, player.angle, '#3388ff');
    
    ctx.restore();
  }
  
  function drawTireTracks() {
    for (var i = 0; i < tireTracks.length; i++) {
      var track = tireTracks[i];
      ctx.fillStyle = 'rgba(40, 40, 40, ' + track.alpha + ')';
      ctx.beginPath();
      ctx.arc(track.x, track.y, 3, 0, Math.PI * 2);
      ctx.fill();
      track.alpha *= 0.98;
    }
    
    var writeIdx = [];
    for (var j = 0; j < tireTracks.length; j++) {
      if (tireTracks[j].alpha < 0.02) {
        writeIdx.push(j);
      }
    }
    for (var k = writeIdx.length - 1; k >= 0; k--) {
      tireTracks.splice(writeIdx[k], 1);
    }
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
    
    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 8;
    
    // Car body with gradient
    var gradient = ctx.createLinearGradient(-length / 2, 0, length / 2, 0);
    gradient.addColorStop(0, model.bodyColor);
    gradient.addColorStop(0.5, adjustColor(model.bodyColor, 20));
    gradient.addColorStop(1, model.bodyColor);
    
    ctx.fillStyle = gradient;
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
    
    // Window
    ctx.fillStyle = model.windowColor;
    ctx.beginPath();
    ctx.moveTo(length / 4, -width / 2 + 4);
    ctx.lineTo(-length / 4, -width / 2 + 4);
    ctx.lineTo(-length / 4, width / 2 - 4);
    ctx.lineTo(length / 4, width / 2 - 4);
    ctx.closePath();
    ctx.fill();
    
    // Glass reflection
    ctx.fillStyle = 'rgba(200, 220, 255, 0.25)';
    ctx.beginPath();
    ctx.moveTo(length / 4, -width / 2 + 6);
    ctx.lineTo(0, -width / 2 + 6);
    ctx.lineTo(-length / 6, width / 2 - 8);
    ctx.lineTo(length / 6, width / 2 - 8);
    ctx.closePath();
    ctx.fill();
    
    // Windshield edge
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