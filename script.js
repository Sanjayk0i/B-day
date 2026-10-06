/**
 * BIRTHDAY SURPRISE FOR DIVYA ♥ — INTERACTIVE ANIMATION ENGINE
 * Pure HTML5 Canvas, SVG, Web Audio, and Pointer Events
 */

(function () {
  'use strict';

  // --- APPLICATION STATES ---
  const STATE = {
    INIT: 0,
    PULLING: 1,
    FLYING: 2,
    IMPACT: 3,
    BANNER: 4,
    TREE_GROW: 5,
    TREE_BLOOM: 6,
    FINAL: 7
  };

  let currentState = STATE.INIT;
  let animFrameId = null;

  // --- DOM ELEMENTS ---
  const container = document.getElementById('experience-container');
  const canvas = document.getElementById('fx-canvas');
  const ctx = canvas.getContext('2d');
  const svg = document.getElementById('scene-svg');

  const introCaption = document.getElementById('intro-caption');
  const pullInstruction = document.getElementById('pull-instruction');
  const dragHandHint = document.getElementById('drag-hand-hint');

  const initialHeartGroup = document.getElementById('initial-heart-group');
  const heartBodyWrap = document.getElementById('heart-body-wrap');
  const bowSystemGroup = document.getElementById('bow-system-group');
  const bowLimbPath = document.getElementById('bow-limb-path');
  const bowGripPath = document.getElementById('bow-grip-path');
  const bowStringPath = document.getElementById('bow-string-path');
  const arrowGroup = document.getElementById('arrow-group');

  const cinematicOverlay = document.getElementById('cinematic-overlay');
  const finalMessageContainer = document.getElementById('final-message-container');
  const replayBtn = document.getElementById('replay-btn');
  const soundBtn = document.getElementById('sound-btn');
  const iconSoundOn = document.getElementById('icon-sound-on');
  const iconSoundMuted = document.getElementById('icon-sound-muted');
  const bgAudio = document.getElementById('bg-audio');

  const finalPullAction = document.getElementById('final-pull-action');
  const pullRibbonHandle = document.getElementById('pull-ribbon-handle');
  const secretLetterModal = document.getElementById('secret-letter-modal');
  const closeLetterBtn = document.getElementById('close-letter-btn');
  const cardReplayBtn = document.getElementById('card-replay-btn');
  const cardEnjoyBtn = document.getElementById('card-enjoy-btn');

  // --- AUDIO SYSTEM ---
  let isMuted = false;
  let audioContext = null;
  let audioPlaying = false;

  function initAudio() {
    if (!audioContext) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) audioContext = new AudioCtx();
      } catch (e) {
        console.warn('AudioContext not supported');
      }
    }
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
  }

  function playSoundtrack() {
    initAudio();
    if (isMuted) return;

    if (bgAudio) {
      bgAudio.volume = 0.85;
      bgAudio.play().then(() => {
        audioPlaying = true;
      }).catch(() => {
        // Fallback to Web Audio romantic music box synthesizer
        playMusicBoxMelody();
      });
    } else {
      playMusicBoxMelody();
    }
  }

  function playMusicBoxMelody() {
    if (audioPlaying || !audioContext || isMuted) return;
    audioPlaying = true;
    
    // Romantic music box notes: C5, E5, G5, B5, C6, G5, A5, F5
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.50, 783.99, 880.00, 698.46];
    let noteIndex = 0;

    function playNote() {
      if (!audioPlaying || isMuted || !audioContext) return;
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(notes[noteIndex % notes.length], audioContext.currentTime);

      gain.gain.setValueAtTime(0.12, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.start();
      osc.stop(audioContext.currentTime + 1.2);

      noteIndex++;
      setTimeout(playNote, 420);
    }
    playNote();
  }

  function toggleSound() {
    isMuted = !isMuted;
    if (isMuted) {
      iconSoundOn.style.display = 'none';
      iconSoundMuted.style.display = 'block';
      if (bgAudio) bgAudio.pause();
      audioPlaying = false;
    } else {
      iconSoundOn.style.display = 'block';
      iconSoundMuted.style.display = 'none';
      playSoundtrack();
    }
  }

  soundBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSound();
  });

  // --- RESPONSIVE LAYOUT & GEOMETRY ---
  let vw = window.innerWidth;
  let vh = window.innerHeight;
  let dpr = window.devicePixelRatio || 1;
  let isPortrait = vh > vw;

  let heartPos = { x: 0, y: 0 };
  let bowPos = { x: 0, y: 0 };
  let bowAngle = 0; // Angle facing the heart
  let bowSpan = 70; // Half height of bow curve

  // Interactive Bow/Arrow pulling state
  let isDragging = false;
  let dragStartPos = { x: 0, y: 0 };
  let currentPullDist = 0;
  let maxPullDist = 65;
  let stringVibration = 0;
  let arrowFlyProgress = 0;
  let arrowStartPos = { x: 0, y: 0 };
  let arrowFlyDuration = 360; // ms
  let arrowFlyStartTime = 0;

  // Particle systems
  let ambientParticles = [];
  let burstParticles = [];
  let driftingPetals = [];
  let fairyFireflies = [];
  let shockwave = null;

  // Tree growth & Blooming state
  let treeGrowthProgress = 0;
  let treeBranches = [];
  let treeBlossoms = [];
  let treeBloomingStartTime = 0;
  let treeBase = { x: 0, y: 0 };
  let heartCanopyCenter = { x: 0, y: 0 };
  let heartCanopyScale = 14;

  function updateLayout() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    dpr = window.devicePixelRatio || 1;
    isPortrait = vh > vw;

    canvas.width = Math.floor(vw * dpr);
    canvas.height = Math.floor(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (isPortrait) {
      // Mobile portrait layout
      heartPos = { x: vw * 0.58, y: vh * 0.28 };
      bowPos = { x: vw * 0.28, y: vh * 0.65 };
      maxPullDist = 55;
      treeBase = { x: vw * 0.50, y: vh * 0.95 };
      heartCanopyCenter = { x: vw * 0.50, y: vh * 0.36 };
      heartCanopyScale = Math.min(vw * 0.024, 13.5);
    } else {
      // Desktop / Tablet landscape layout
      heartPos = { x: vw * 0.68, y: vh * 0.35 };
      bowPos = { x: vw * 0.34, y: vh * 0.62 };
      maxPullDist = 72;
      treeBase = { x: vw * 0.72, y: vh * 0.96 };
      heartCanopyCenter = { x: vw * 0.72, y: vh * 0.38 };
      heartCanopyScale = Math.min(vw * 0.016, vh * 0.022, 16.5);
    }

    // Dynamic trajectory calculation: angle pointing from bow to heart
    const dx = heartPos.x - bowPos.x;
    const dy = heartPos.y - bowPos.y;
    bowAngle = Math.atan2(dy, dx);

    // Position initial heart
    initialHeartGroup.setAttribute('transform', `translate(${heartPos.x}, ${heartPos.y}) scale(${isPortrait ? 0.88 : 1.05})`);

    // Position initial texts
    introCaption.style.left = `${heartPos.x}px`;
    introCaption.style.top = `${heartPos.y - (isPortrait ? 110 : 135)}px`;
    introCaption.style.transform = `translateX(-50%)`;

    pullInstruction.style.left = `${bowPos.x + 25}px`;
    pullInstruction.style.top = `${bowPos.y + (isPortrait ? 55 : 65)}px`;

    dragHandHint.style.left = `${bowPos.x - 10}px`;
    dragHandHint.style.top = `${bowPos.y + 10}px`;

    renderBowAndArrow();
    generateTreeStructure();
  }

  // --- INITIALIZE SCENE 1 ---
  function initScene1() {
    currentState = STATE.INIT;
    currentPullDist = 0;
    stringVibration = 0;
    treeGrowthProgress = 0;
    burstParticles = [];
    shockwave = null;

    initialHeartGroup.style.display = 'block';
    initialHeartGroup.style.opacity = '1';
    heartBodyWrap.classList.remove('heart-impact');
    heartBodyWrap.classList.add('heart-pulse');
    initialHeartGroup.setAttribute('transform', `translate(${heartPos.x}, ${heartPos.y}) scale(${isPortrait ? 0.88 : 1.05})`);

    bowSystemGroup.style.display = 'block';
    bowSystemGroup.style.opacity = '1';

    introCaption.classList.add('visible');
    pullInstruction.classList.add('visible');
    dragHandHint.style.opacity = '0.85';

    cinematicOverlay.classList.remove('active');
    finalMessageContainer.classList.remove('visible');
    replayBtn.classList.remove('visible');
    if (secretLetterModal) secretLetterModal.classList.remove('open');

    container.style.background = 'var(--bg-twilight-radial)';

    // Seed gentle ambient floating particles (Stardust & Twilight Mist)
    ambientParticles = [];
    const count = isPortrait ? 30 : 55;
    const dustColors = [
      'rgba(232, 165, 152, 0.45)', // Rose Gold
      'rgba(212, 178, 232, 0.50)', // Twilight Lavender
      'rgba(254, 209, 102, 0.42)', // Golden Stardust
      'rgba(255, 255, 255, 0.60)'  // Diamond Starlight
    ];
    for (let i = 0; i < count; i++) {
      ambientParticles.push({
        x: Math.random() * vw,
        y: Math.random() * vh,
        radius: Math.random() * 2.6 + 1.1,
        color: dustColors[Math.floor(Math.random() * dustColors.length)],
        vx: (Math.random() - 0.5) * 0.35,
        vy: -Math.random() * 0.45 - 0.12,
        alpha: Math.random() * 0.6 + 0.35
      });
    }

    renderBowAndArrow();
  }

  // --- BOW & ARROW DRAWING ---
  function renderBowAndArrow() {
    if (currentState >= STATE.BANNER) {
      bowSystemGroup.style.display = 'none';
      return;
    }

    const cosA = Math.cos(bowAngle);
    const sinA = Math.sin(bowAngle);
    // Perpendicular vector for the bow limb curve
    const perpX = -sinA;
    const perpY = cosA;

    const span = bowSpan * (isPortrait ? 0.88 : 1.0);
    // When arrow is pulled back, tips bend back slightly
    const tipFlex = currentPullDist * 0.16;

    // Top tip and Bottom tip
    const topTip = {
      x: bowPos.x + perpX * span - cosA * tipFlex,
      y: bowPos.y + perpY * span - sinA * tipFlex
    };
    const bottomTip = {
      x: bowPos.x - perpX * span - cosA * tipFlex,
      y: bowPos.y - perpY * span - sinA * tipFlex
    };

    // Bow wood limb bezier curve
    const bowMidX = bowPos.x + cosA * 12;
    const bowMidY = bowPos.y + sinA * 12;
    bowLimbPath.setAttribute('d', `M ${topTip.x} ${topTip.y} Q ${bowMidX} ${bowMidY} ${bottomTip.x} ${bottomTip.y}`);

    // Grip wrap in the middle
    const gripTop = { x: bowMidX + perpX * 9, y: bowMidY + perpY * 9 };
    const gripBottom = { x: bowMidX - perpX * 9, y: bowMidY - perpY * 9 };
    bowGripPath.setAttribute('d', `M ${gripTop.x} ${gripTop.y} L ${gripBottom.x} ${gripBottom.y}`);

    // Bow String
    if (currentState === STATE.FLYING) {
      // String vibrates with spring decay
      const vib = Math.sin(stringVibration * 1.5) * Math.exp(-stringVibration * 0.12) * 12;
      const midStr = { x: bowPos.x + cosA * vib, y: bowPos.y + sinA * vib };
      bowStringPath.setAttribute('d', `M ${topTip.x} ${topTip.y} Q ${midStr.x} ${midStr.y} ${bottomTip.x} ${bottomTip.y}`);
    } else {
      // String attaches to arrow nock
      const nockX = bowPos.x - cosA * currentPullDist;
      const nockY = bowPos.y - sinA * currentPullDist;
      bowStringPath.setAttribute('d', `M ${topTip.x} ${topTip.y} L ${nockX} ${nockY} L ${bottomTip.x} ${bottomTip.y}`);
    }

    // Arrow positioning and rotation
    if (currentState === STATE.INIT || currentState === STATE.PULLING) {
      const arrX = bowPos.x - cosA * currentPullDist;
      const arrY = bowPos.y - sinA * currentPullDist;
      const deg = (bowAngle * 180) / Math.PI;
      arrowGroup.setAttribute('transform', `translate(${arrX}, ${arrY}) rotate(${deg})`);
      arrowGroup.style.display = 'block';
    } else if (currentState === STATE.FLYING) {
      // Dynamic flying position
      const p = Math.min(1, Math.max(0, arrowFlyProgress));
      const curX = arrowStartPos.x + (heartPos.x - arrowStartPos.x) * p;
      const curY = arrowStartPos.y + (heartPos.y - arrowStartPos.y) * p;
      const deg = (bowAngle * 180) / Math.PI;
      arrowGroup.setAttribute('transform', `translate(${curX}, ${curY}) rotate(${deg})`);
      arrowGroup.style.display = 'block';
    } else {
      arrowGroup.style.display = 'none';
    }
  }

  // --- POINTER EVENTS (TOUCH & MOUSE) ---
  function getPointerPos(e) {
    return { x: e.clientX, y: e.clientY };
  }

  function onPointerDown(e) {
    if (currentState !== STATE.INIT) return;

    initAudio();
    isDragging = true;
    dragStartPos = getPointerPos(e);
    currentState = STATE.PULLING;

    dragHandHint.style.opacity = '0';
    pullInstruction.style.opacity = '0.35';

    if (e.target.setPointerCapture) {
      e.target.setPointerCapture(e.pointerId);
    }
  }

  function onPointerMove(e) {
    if (!isDragging || currentState !== STATE.PULLING) return;

    const cur = getPointerPos(e);
    const dragVecX = cur.x - dragStartPos.x;
    const dragVecY = cur.y - dragStartPos.y;

    // Vector along pulling axis (-cosA, -sinA)
    const pullAxisX = -Math.cos(bowAngle);
    const pullAxisY = -Math.sin(bowAngle);

    // Project drag vector onto pull axis
    const projected = dragVecX * pullAxisX + dragVecY * pullAxisY;
    currentPullDist = Math.max(0, Math.min(maxPullDist, projected));

    renderBowAndArrow();
  }

  function onPointerUp(e) {
    if (!isDragging || currentState !== STATE.PULLING) return;
    isDragging = false;

    if (currentPullDist > 14) {
      // Successfully pulled & released!
      releaseArrow();
    } else {
      // Gentle tap or minimal pull -> trigger delightful auto-pull and fire!
      autoPullAndRelease();
    }
  }

  function autoPullAndRelease() {
    let pullAnimStart = performance.now();
    function animatePull(time) {
      let t = (time - pullAnimStart) / 220;
      if (t < 1) {
        currentPullDist = maxPullDist * 0.85 * Math.sin((t * Math.PI) / 2);
        renderBowAndArrow();
        requestAnimationFrame(animatePull);
      } else {
        currentPullDist = maxPullDist * 0.85;
        renderBowAndArrow();
        setTimeout(releaseArrow, 40);
      }
    }
    requestAnimationFrame(animatePull);
  }

  arrowGroup.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);

  // --- SCENE 2: ARROW FLIGHT ---
  function releaseArrow() {
    currentState = STATE.FLYING;
    arrowStartPos = {
      x: bowPos.x - Math.cos(bowAngle) * currentPullDist,
      y: bowPos.y - Math.sin(bowAngle) * currentPullDist
    };
    arrowFlyStartTime = performance.now();
    arrowFlyProgress = 0;
    stringVibration = 0;

    introCaption.classList.remove('visible');
    pullInstruction.classList.remove('visible');

    // Bow string vibration loop
    const vibInterval = setInterval(() => {
      stringVibration += 0.5;
      renderBowAndArrow();
      if (stringVibration > 18) clearInterval(vibInterval);
    }, 20);
  }

  // --- SCENE 3: HEART IMPACT & EXPLOSION ---
  function triggerHeartImpact() {
    currentState = STATE.IMPACT;
    arrowGroup.style.display = 'none';

    // Start soundtrack immediately on impact
    playSoundtrack();

    // Heart squash & shake
    heartBodyWrap.classList.remove('heart-pulse');
    heartBodyWrap.classList.add('heart-impact');

    // Create Shockwave Flash Ring in Ethereal Rose-Gold & Amethyst
    shockwave = {
      x: heartPos.x,
      y: heartPos.y,
      radius: 20,
      maxRadius: Math.max(vw, vh) * 1.5,
      alpha: 1.0,
      color: '#e65c92'
    };

    // Burst Particles: Rose Gold Hearts, Crystal Daisy Petals, Starlight Sparkles
    burstParticles = [];
    const heartColors = [
      '#e8a598', '#f0a8a8', '#d4b2e8', '#b892db',
      '#eb4d88', '#fed166', '#ffffff'
    ];

    // 1. Mini Hearts
    for (let i = 0; i < 44; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8.5 + 3.2;
      burstParticles.push({
        type: 'heart',
        x: heartPos.x,
        y: heartPos.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: Math.random() * 11 + 7,
        color: heartColors[Math.floor(Math.random() * heartColors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.16,
        alpha: 1,
        life: 1.0,
        decay: Math.random() * 0.015 + 0.012
      });
    }

    // 2. Daisy & Crystal Petals
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7.2 + 2.5;
      burstParticles.push({
        type: 'petal',
        x: heartPos.x,
        y: heartPos.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 7.5 + 5,
        color: Math.random() > 0.4 ? '#ffffff' : (Math.random() > 0.5 ? '#e8a598' : '#fed166'),
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        alpha: 1,
        life: 1.0,
        decay: Math.random() * 0.016 + 0.012
      });
    }

    // 3. Golden & Lavender Celestial Sparkles
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 10.5 + 4;
      burstParticles.push({
        type: 'sparkle',
        x: heartPos.x,
        y: heartPos.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4.2 + 2,
        color: Math.random() > 0.45 ? '#fed166' : (Math.random() > 0.5 ? '#e2b3f7' : '#ffa0c0'),
        alpha: 1,
        life: 1.0,
        decay: Math.random() * 0.025 + 0.018
      });
    }

    // Hide initial heart and bow after shockwave spreads
    setTimeout(() => {
      initialHeartGroup.style.display = 'none';
      bowSystemGroup.style.display = 'none';
      transitionToScene4Banner();
    }, 550);
  }

  // --- SCENE 4: FIRST BIRTHDAY REVEAL (MAGENTA BANNER) ---
  function transitionToScene4Banner() {
    currentState = STATE.BANNER;
    cinematicOverlay.classList.add('active');

    // Display banner for ~2.8s, then smoothly transition to tree growth
    setTimeout(() => {
      transitionToScene5Tree();
    }, 2800);
  }

  // --- SCENE 5 & 6: TREE GROWTH & HEART BLOOMING ---
  function transitionToScene5Tree() {
    currentState = STATE.TREE_GROW;
    cinematicOverlay.classList.remove('active');
    treeGrowthProgress = 0;

    const treeSvgGroup = document.getElementById('tree-svg-group');
    treeSvgGroup.style.opacity = '1';
    treeSvgGroup.innerHTML = '';

    // Render tree trunk & branches in SVG
    buildTreeSvgElements();
  }

  // Mathematical Tree Structure
  function generateTreeStructure() {
    treeBranches = [];
    treeBlossoms = [];

    // Trunk top point where main boughs fork
    const trunkHeight = isPortrait ? vh * 0.42 : vh * 0.44;
    const forkY = treeBase.y - trunkHeight;
    const forkX = treeBase.x;

    // Branches configured to contour and fill the anatomical heart skeleton
    const scale = heartCanopyScale;

    // Left main bough
    treeBranches.push({
      start: { x: forkX, y: forkY },
      cp1: { x: forkX - 25, y: forkY - 40 },
      cp2: { x: forkX - 7 * scale, y: forkY - 2 * scale },
      end: { x: heartCanopyCenter.x - 12 * scale, y: heartCanopyCenter.y + 4 * scale },
      width: 7.5,
      delay: 0.15,
      duration: 0.45
    });

    // Right main bough
    treeBranches.push({
      start: { x: forkX, y: forkY },
      cp1: { x: forkX + 25, y: forkY - 40 },
      cp2: { x: forkX + 7 * scale, y: forkY - 2 * scale },
      end: { x: heartCanopyCenter.x + 12 * scale, y: heartCanopyCenter.y + 4 * scale },
      width: 7.5,
      delay: 0.15,
      duration: 0.45
    });

    // Left upper arch
    treeBranches.push({
      start: { x: heartCanopyCenter.x - 12 * scale, y: heartCanopyCenter.y + 4 * scale },
      cp1: { x: heartCanopyCenter.x - 15 * scale, y: heartCanopyCenter.y - 4 * scale },
      cp2: { x: heartCanopyCenter.x - 12 * scale, y: heartCanopyCenter.y - 10 * scale },
      end: { x: heartCanopyCenter.x - 4 * scale, y: heartCanopyCenter.y - 9 * scale },
      width: 4.8,
      delay: 0.45,
      duration: 0.4
    });

    // Right upper arch
    treeBranches.push({
      start: { x: heartCanopyCenter.x + 12 * scale, y: heartCanopyCenter.y + 4 * scale },
      cp1: { x: heartCanopyCenter.x + 15 * scale, y: heartCanopyCenter.y - 4 * scale },
      cp2: { x: heartCanopyCenter.x + 12 * scale, y: heartCanopyCenter.y - 10 * scale },
      end: { x: heartCanopyCenter.x + 4 * scale, y: heartCanopyCenter.y - 9 * scale },
      width: 4.8,
      delay: 0.45,
      duration: 0.4
    });

    // Inner branches heading towards center cleft
    treeBranches.push({
      start: { x: forkX, y: forkY },
      cp1: { x: forkX - 10, y: forkY - 60 },
      cp2: { x: heartCanopyCenter.x - 4 * scale, y: heartCanopyCenter.y + 2 * scale },
      end: { x: heartCanopyCenter.x - 2 * scale, y: heartCanopyCenter.y - 3 * scale },
      width: 4.5,
      delay: 0.35,
      duration: 0.4
    });

    treeBranches.push({
      start: { x: forkX, y: forkY },
      cp1: { x: forkX + 10, y: forkY - 60 },
      cp2: { x: heartCanopyCenter.x + 4 * scale, y: heartCanopyCenter.y + 2 * scale },
      end: { x: heartCanopyCenter.x + 2 * scale, y: heartCanopyCenter.y - 3 * scale },
      width: 4.5,
      delay: 0.35,
      duration: 0.4
    });

    // Secondary twigs spreading into lobes
    const subConfigs = [
      { sx: -10, sy: 2, ex: -14, ey: -4, d: 0.6 },
      { sx: 10, sy: 2, ex: 14, ey: -4, d: 0.6 },
      { sx: -6, sy: -5, ex: -9, ey: -10, d: 0.7 },
      { sx: 6, sy: -5, ex: 9, ey: -10, d: 0.7 },
      { sx: -3, sy: 6, ex: -7, ey: 8, d: 0.55 },
      { sx: 3, sy: 6, ex: 7, ey: 8, d: 0.55 }
    ];

    subConfigs.forEach(sc => {
      treeBranches.push({
        start: { x: heartCanopyCenter.x + sc.sx * scale, y: heartCanopyCenter.y + sc.sy * scale },
        cp1: { x: heartCanopyCenter.x + (sc.sx + (sc.ex - sc.sx) * 0.5) * scale, y: heartCanopyCenter.y + (sc.sy + (sc.ey - sc.sy) * 0.5) * scale },
        cp2: { x: heartCanopyCenter.x + sc.ex * scale, y: heartCanopyCenter.y + sc.ey * scale },
        end: { x: heartCanopyCenter.x + sc.ex * scale, y: heartCanopyCenter.y + sc.ey * scale },
        width: 3.2,
        delay: sc.d,
        duration: 0.35
      });
    });

    // Generate 650 Canopy Blossoms in Twilight Lavender & Rose Gold Harmony
    const blossomColors = [
      '#e8a598', // Rose Gold
      '#f0a8a8', // Soft Rose
      '#d4b2e8', // Twilight Lavender
      '#b892db', // Lilac
      '#9d4edd', // Celestial Violet
      '#fed166', // Golden Starlight
      '#ffa0c0', // Blush Pink
      '#ee4e8b', // Rich Rose
      '#ffffff', // Crystal Pearl
      '#fce8f3', // Pale Rose Petal
      '#7b195b'  // Deep Amethyst Accent
    ];

    const totalBlossoms = isPortrait ? 520 : 680;
    for (let i = 0; i < totalBlossoms; i++) {
      const t = Math.random() * Math.PI * 2;
      // Area-uniform radial distribution with soft organic edge
      const r = Math.sqrt(Math.random() * 0.95 + 0.05) * (Math.random() * 0.12 + 0.94);

      // Parametric heart equation
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

      const bx = heartCanopyCenter.x + r * hx * scale + (Math.random() - 0.5) * 8;
      const by = heartCanopyCenter.y + r * hy * scale + (Math.random() - 0.5) * 8;

      // Distance from trunk fork determines bloom sequence (fork blooms first, spreading upward & outward)
      const distFromFork = Math.hypot(bx - forkX, by - forkY);
      const bloomDelay = 0.55 + (distFromFork / (scale * 28)) * 0.45;

      treeBlossoms.push({
        x: bx,
        y: by,
        targetSize: Math.random() * 8.5 + 6.5,
        color: blossomColors[Math.floor(Math.random() * blossomColors.length)],
        type: Math.random() > 0.4 ? 'heart' : (Math.random() > 0.3 ? 'flower5' : 'daisy'),
        rotation: Math.random() * Math.PI * 2,
        bloomDelay: bloomDelay,
        bloomDuration: 0.28,
        currentScale: 0
      });
    }

    // Seed continuous drifting breeze petals
    driftingPetals = [];
    for (let i = 0; i < 35; i++) {
      driftingPetals.push({
        x: heartCanopyCenter.x + (Math.random() - 0.5) * scale * 25,
        y: heartCanopyCenter.y + (Math.random() - 0.5) * scale * 20,
        size: Math.random() * 7 + 4,
        color: blossomColors[Math.floor(Math.random() * blossomColors.length)],
        vx: -Math.random() * 1.4 - 0.6,
        vy: Math.random() * 1.2 + 0.8,
        swaySpeed: Math.random() * 0.04 + 0.02,
        swayAngle: Math.random() * Math.PI * 2,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05
      });
    }

    // Seed magical fairy fireflies orbiting the heart canopy
    fairyFireflies = [];
    for (let i = 0; i < 22; i++) {
      fairyFireflies.push({
        baseX: heartCanopyCenter.x + (Math.random() - 0.5) * scale * 26,
        baseY: heartCanopyCenter.y + (Math.random() - 0.5) * scale * 22,
        x: 0,
        y: 0,
        radius: Math.random() * 2.2 + 1.2,
        color: Math.random() > 0.45 ? '#fed166' : '#e879f9',
        orbitRadius: Math.random() * 16 + 8,
        angle: Math.random() * Math.PI * 2,
        orbitSpeed: (Math.random() - 0.5) * 0.035,
        pulseSpeed: Math.random() * 0.06 + 0.04,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }
  }

  function buildTreeSvgElements() {
    const group = document.getElementById('tree-svg-group');
    group.innerHTML = '';

    const trunkHeight = isPortrait ? vh * 0.42 : vh * 0.44;
    const forkY = treeBase.y - trunkHeight;
    const forkX = treeBase.x;

    // Organic tapered trunk with natural slight curve
    const trunkPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const baseWidth = isPortrait ? 18 : 22;
    const topWidth = isPortrait ? 9 : 12;

    const dTrunk = `M ${treeBase.x - baseWidth / 2} ${treeBase.y}
      Q ${treeBase.x - baseWidth / 3} ${treeBase.y - trunkHeight * 0.5} ${forkX - topWidth / 2} ${forkY}
      L ${forkX + topWidth / 2} ${forkY}
      Q ${treeBase.x + baseWidth / 3} ${treeBase.y - trunkHeight * 0.5} ${treeBase.x + baseWidth / 2} ${treeBase.y} Z`;

    trunkPath.setAttribute('d', dTrunk);
    trunkPath.setAttribute('fill', 'url(#tree-bark-grad)');
    trunkPath.setAttribute('id', 'tree-trunk-svg');
    group.appendChild(trunkPath);
  }

  // --- DRAWING PROCEDURAL BLOSSOMS ON CANVAS ---
  function drawBlossom(b, scale) {
    if (scale <= 0.01) return;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rotation);
    ctx.scale(scale, scale);

    if (b.type === 'heart') {
      // Mini 3D Heart
      const sz = b.targetSize;
      ctx.beginPath();
      ctx.moveTo(0, sz * 0.45);
      ctx.bezierCurveTo(-sz * 0.6, sz * 0.1, -sz * 0.9, -sz * 0.35, -sz * 0.7, -sz * 0.7);
      ctx.bezierCurveTo(-sz * 0.5, -sz * 1.0, -sz * 0.15, -sz * 0.9, 0, -sz * 0.55);
      ctx.bezierCurveTo(sz * 0.15, -sz * 0.9, sz * 0.5, -sz * 1.0, sz * 0.7, -sz * 0.7);
      ctx.bezierCurveTo(sz * 0.9, -sz * 0.35, sz * 0.6, sz * 0.1, 0, sz * 0.45);
      ctx.closePath();
      ctx.fillStyle = b.color;
      ctx.shadowColor = 'rgba(150, 20, 60, 0.2)';
      ctx.shadowBlur = 4;
      ctx.fill();

      // Top specular highlight
      ctx.beginPath();
      ctx.ellipse(-sz * 0.25, -sz * 0.5, sz * 0.18, sz * 0.1, -0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.shadowBlur = 0;
      ctx.fill();

    } else if (b.type === 'flower5') {
      // 5-Petal Sakura Blossom
      const sz = b.targetSize * 0.75;
      for (let p = 0; p < 5; p++) {
        ctx.save();
        ctx.rotate((p * Math.PI * 2) / 5);
        ctx.beginPath();
        ctx.ellipse(0, sz, sz * 0.55, sz * 0.85, 0, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();
        ctx.restore();
      }
      // Center golden stamen
      ctx.beginPath();
      ctx.arc(0, 0, sz * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffb300';
      ctx.fill();

    } else {
      // Daisy Blossom
      const sz = b.targetSize * 0.7;
      for (let p = 0; p < 8; p++) {
        ctx.save();
        ctx.rotate((p * Math.PI * 2) / 8);
        ctx.beginPath();
        ctx.ellipse(0, sz, sz * 0.4, sz * 0.75, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(0, 0, sz * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = '#fbb034';
      ctx.fill();
    }

    ctx.restore();
  }

  // Elastic Out Easing Function for juicy, organic pop-in bloom
  function easeOutElastic(x) {
    const c4 = (2 * Math.PI) / 3;
    return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
  }

  // --- MAIN ANIMATION LOOP ---
  function loop(timestamp) {
    ctx.clearRect(0, 0, vw, vh);

    // 1. Draw gentle ambient background particles
    for (let i = 0; i < ambientParticles.length; i++) {
      const p = ambientParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) p.y = vh + 10;
      if (p.x < -10) p.x = vw + 10;
      if (p.x > vw + 10) p.x = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }

    // 2. Handle Arrow Flight
    if (currentState === STATE.FLYING) {
      const elapsed = timestamp - arrowFlyStartTime;
      arrowFlyProgress = Math.min(1, elapsed / arrowFlyDuration);
      renderBowAndArrow();

      // Emit sparkle motion trail
      const curX = arrowStartPos.x + (heartPos.x - arrowStartPos.x) * arrowFlyProgress;
      const curY = arrowStartPos.y + (heartPos.y - arrowStartPos.y) * arrowFlyProgress;

      for (let i = 0; i < 2; i++) {
        burstParticles.push({
          type: 'sparkle',
          x: curX + (Math.random() - 0.5) * 10,
          y: curY + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          size: Math.random() * 3.5 + 1.5,
          color: Math.random() > 0.5 ? '#ffd700' : '#ff4d88',
          alpha: 0.9,
          life: 1.0,
          decay: 0.04
        });
      }

      if (arrowFlyProgress >= 1) {
        triggerHeartImpact();
      }
    }

    // 3. Handle Shockwave & Burst Particles
    if (shockwave) {
      shockwave.radius += (shockwave.maxRadius - shockwave.radius) * 0.09;
      shockwave.alpha *= 0.94;

      ctx.beginPath();
      ctx.arc(shockwave.x, shockwave.y, shockwave.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 59, 123, ${shockwave.alpha * 0.28})`;
      ctx.fill();

      ctx.lineWidth = 4;
      ctx.strokeStyle = `rgba(255, 200, 220, ${shockwave.alpha * 0.6})`;
      ctx.stroke();

      if (shockwave.alpha < 0.01) shockwave = null;
    }

    // Update & draw burst particles
    for (let i = burstParticles.length - 1; i >= 0; i--) {
      const p = burstParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy += 0.14; // gentle gravity
      p.rotation += p.rotSpeed || 0;
      p.life -= p.decay;

      if (p.life <= 0) {
        burstParticles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);

      if (p.type === 'heart') {
        ctx.rotate(p.rotation);
        const sz = p.size;
        ctx.beginPath();
        ctx.moveTo(0, sz * 0.4);
        ctx.bezierCurveTo(-sz * 0.5, sz * 0.1, -sz * 0.8, -sz * 0.3, -sz * 0.6, -sz * 0.6);
        ctx.bezierCurveTo(-sz * 0.4, -sz * 0.9, -sz * 0.1, -sz * 0.8, 0, -sz * 0.5);
        ctx.bezierCurveTo(sz * 0.1, -sz * 0.8, sz * 0.4, -sz * 0.9, sz * 0.6, -sz * 0.6);
        ctx.bezierCurveTo(sz * 0.8, -sz * 0.3, sz * 0.5, sz * 0.1, 0, sz * 0.4);
        ctx.fillStyle = p.color;
        ctx.fill();
      } else if (p.type === 'petal') {
        ctx.rotate(p.rotation);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.5, p.size, 0, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fill();
      }
      ctx.restore();
    }

    // 4. Handle Tree Growth & Heart Canopy Blooming
    if (currentState >= STATE.TREE_GROW) {
      if (treeGrowthProgress < 1) {
        treeGrowthProgress += 0.012; // Growth duration ~1.4s
        if (treeGrowthProgress >= 1) {
          treeGrowthProgress = 1;
          currentState = STATE.TREE_BLOOM;
          treeBloomingStartTime = timestamp;
        }
      }

      // Draw growing tree branches
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = 0; i < treeBranches.length; i++) {
        const b = treeBranches[i];
        if (treeGrowthProgress < b.delay) continue;

        const branchProgress = Math.min(1, (treeGrowthProgress - b.delay) / b.duration);
        if (branchProgress <= 0) continue;

        // Progressive bezier curve rendering
        ctx.beginPath();
        ctx.moveTo(b.start.x, b.start.y);

        // Approximate progression along quadratic/cubic curve
        const curX = b.start.x + (b.end.x - b.start.x) * branchProgress;
        const curY = b.start.y + (b.end.y - b.start.y) * branchProgress;
        const curCp1X = b.start.x + (b.cp1.x - b.start.x) * branchProgress;
        const curCp1Y = b.start.y + (b.cp1.y - b.start.y) * branchProgress;

        ctx.quadraticCurveTo(curCp1X, curCp1Y, curX, curY);
        ctx.strokeStyle = '#381c30'; // Twilight plum-wood bark
        ctx.lineWidth = b.width;
        ctx.stroke();
      }

      // Draw blooming blossoms
      if (treeGrowthProgress > 0.45) {
        let allBloomed = true;
        for (let i = 0; i < treeBlossoms.length; i++) {
          const bl = treeBlossoms[i];
          if (treeGrowthProgress < bl.bloomDelay) {
            allBloomed = false;
            continue;
          }

          const rawProg = Math.min(1, (treeGrowthProgress - bl.bloomDelay) / bl.bloomDuration);
          const easedProg = easeOutElastic(rawProg);
          drawBlossom(bl, easedProg);

          if (rawProg < 1) allBloomed = false;
        }

        // When all blossoms bloom, transition to Scene 7 final message!
        if (allBloomed && currentState === STATE.TREE_BLOOM) {
          currentState = STATE.FINAL;
          finalMessageContainer.classList.add('visible');
          replayBtn.classList.add('visible');
        }
      }

      // Draw drifting breeze petals
      if (treeGrowthProgress > 0.6) {
        for (let i = 0; i < driftingPetals.length; i++) {
          const pt = driftingPetals[i];
          pt.swayAngle += pt.swaySpeed;
          pt.x += pt.vx + Math.sin(pt.swayAngle) * 0.7;
          pt.y += pt.vy;
          pt.rotation += pt.rotSpeed;

          // Wrap around screen
          if (pt.y > vh + 20 || pt.x < -30) {
            pt.x = heartCanopyCenter.x + (Math.random() - 0.2) * heartCanopyScale * 25;
            pt.y = heartCanopyCenter.y + (Math.random() - 0.5) * heartCanopyScale * 15;
          }

          ctx.save();
          ctx.translate(pt.x, pt.y);
          ctx.rotate(pt.rotation);
          ctx.beginPath();
          ctx.ellipse(0, 0, pt.size * 0.5, pt.size, 0, 0, Math.PI * 2);
          ctx.fillStyle = pt.color;
          ctx.globalAlpha = 0.85;
          ctx.fill();
          ctx.restore();
        }
      }

      // Draw magical fairy fireflies hovering around the blossoming heart canopy
      if (treeGrowthProgress > 0.7) {
        for (let i = 0; i < fairyFireflies.length; i++) {
          const ff = fairyFireflies[i];
          ff.angle += ff.orbitSpeed;
          ff.x = ff.baseX + Math.cos(ff.angle) * ff.orbitRadius;
          ff.y = ff.baseY + Math.sin(ff.angle * 1.4) * (ff.orbitRadius * 0.7);

          const glowAlpha = (Math.sin(timestamp * 0.003 * ff.pulseSpeed * 60 + ff.pulseOffset) + 1) * 0.4 + 0.2;

          ctx.save();
          ctx.beginPath();
          ctx.arc(ff.x, ff.y, ff.radius * 3.5, 0, Math.PI * 2);
          ctx.fillStyle = ff.color;
          ctx.globalAlpha = glowAlpha * 0.35;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(ff.x, ff.y, ff.radius, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = glowAlpha;
          ctx.shadowColor = ff.color;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.restore();
        }
      }
    }

    animFrameId = requestAnimationFrame(loop);
  }

  // --- REPLAY FUNCTIONALITY ---
  replayBtn.addEventListener('click', () => {
    initScene1();
    updateLayout();
  });

  // --- SECOND INTERACTIVE PULL & SECRET LETTER REVEAL ---
  let isPullingRibbon = false;
  let ribbonStartY = 0;
  let ribbonCurrentPull = 0;

  function triggerLetterReveal() {
    // Celebratory burst particles across the screen
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 9 + 3;
      burstParticles.push({
        type: Math.random() > 0.4 ? 'heart' : 'sparkle',
        x: vw * 0.5 + (Math.random() - 0.5) * 160,
        y: vh * 0.5 + (Math.random() - 0.5) * 160,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: Math.random() * 9 + 5,
        color: ['#e8a598', '#f0a8a8', '#d4b2e8', '#fed166', '#ffffff'][Math.floor(Math.random() * 5)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.15,
        alpha: 1,
        life: 1.0,
        decay: 0.015
      });
    }

    if (secretLetterModal) {
      secretLetterModal.classList.add('open');
      secretLetterModal.setAttribute('aria-hidden', 'false');
    }

    if (pullRibbonHandle) {
      pullRibbonHandle.style.transform = '';
      pullRibbonHandle.classList.remove('pull-dragging');
    }
  }

  if (finalPullAction) {
    finalPullAction.addEventListener('pointerdown', (e) => {
      isPullingRibbon = true;
      ribbonStartY = e.clientY;
      ribbonCurrentPull = 0;
      if (pullRibbonHandle) pullRibbonHandle.classList.add('pull-dragging');
      if (finalPullAction.setPointerCapture) finalPullAction.setPointerCapture(e.pointerId);
    });

    window.addEventListener('pointermove', (e) => {
      if (!isPullingRibbon) return;
      const deltaY = Math.max(0, Math.min(85, e.clientY - ribbonStartY));
      ribbonCurrentPull = deltaY;
      if (pullRibbonHandle) {
        pullRibbonHandle.style.transform = `translateY(${deltaY}px) scale(${1 + deltaY * 0.002})`;
      }
    });

    window.addEventListener('pointerup', () => {
      if (!isPullingRibbon) return;
      isPullingRibbon = false;
      if (pullRibbonHandle) pullRibbonHandle.classList.remove('pull-dragging');

      if (ribbonCurrentPull > 20) {
        triggerLetterReveal();
      } else {
        // Soft click/tap fallback -> animate pull down and reveal
        let startTime = performance.now();
        function animPull(t) {
          let progress = (t - startTime) / 180;
          if (progress < 1) {
            let dy = Math.sin(progress * Math.PI) * 45;
            if (pullRibbonHandle) pullRibbonHandle.style.transform = `translateY(${dy}px)`;
            requestAnimationFrame(animPull);
          } else {
            triggerLetterReveal();
          }
        }
        requestAnimationFrame(animPull);
      }
    });

    finalPullAction.addEventListener('click', () => {
      if (secretLetterModal && !secretLetterModal.classList.contains('open')) {
        triggerLetterReveal();
      }
    });
  }

  if (closeLetterBtn) {
    closeLetterBtn.addEventListener('click', () => {
      secretLetterModal.classList.remove('open');
      secretLetterModal.setAttribute('aria-hidden', 'true');
    });
  }

  if (cardEnjoyBtn) {
    cardEnjoyBtn.addEventListener('click', () => {
      secretLetterModal.classList.remove('open');
      secretLetterModal.setAttribute('aria-hidden', 'true');
    });
  }

  if (cardReplayBtn) {
    cardReplayBtn.addEventListener('click', () => {
      secretLetterModal.classList.remove('open');
      secretLetterModal.setAttribute('aria-hidden', 'true');
      initScene1();
      updateLayout();
    });
  }

  // --- WINDOW RESIZE & ROTATION ---
  window.addEventListener('resize', () => {
    updateLayout();
  });

  // --- BOOTSTRAP ---
  window.addEventListener('DOMContentLoaded', () => {
    updateLayout();
    initScene1();
    animFrameId = requestAnimationFrame(loop);
  });

})();
