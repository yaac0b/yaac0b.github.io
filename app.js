/**
 * Jacob Jibu — Retro Arcade Portfolio Logic (app.js)
 * Features:
 * - Real-Time Synthesized 8-Bit Web Audio Engine & Chiptune BGM
 * - Fast Retro BIOS Boot Sequence & Reboot Engine
 * - Interactive Hacker Debug CLI Terminal (~ Key or Button)
 * - RPG Skill Tree / Perk Graph Interactive Lore Switcher
 * - Quest Category Filtering with 8-bit Audio Blips
 * - Interactive Coin Slot Easter Egg with Spark Particle Physics
 * - Live Photo Upload & Editable Bio Dialogue
 * - Comic Halftone Racing Cursor Trail
 */

// ================= 🎵 SYNTHESIZED 8-BIT AUDIO ENGINE & CHIPTUNE BGM =================
let audioCtx = null;
let sfxMuted = false;
let bgmPlaying = false;
let bgmTimer = null;

function initAudioCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(freq, type = 'square', duration = 0.08, gainVal = 0.08) {
  if (sfxMuted) return;
  try {
    const ctx = initAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch(e){}
}

const Sound = {
  blip() { playTone(520, 'square', 0.04, 0.04); },
  coin() {
    playTone(987.77, 'square', 0.08, 0.09);
    setTimeout(() => playTone(1318.51, 'square', 0.28, 0.09), 80);
  },
  bootBeep() { playTone(880, 'sine', 0.12, 0.1); },
  cliType() { playTone(700 + Math.random() * 200, 'triangle', 0.02, 0.02); },
  powerUp() {
    // Classic 8-bit "cheat unlocked" arpeggio — Mario 1-Up style
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 'square', 0.12, 0.07), i * 80);
    });
  }
};

// Real-Time Synthesized 8-Bit Chiptune Ambient BGM
const CHIPTUNE_NOTES = [
  261.63, 329.63, 392.00, 523.25, // C Major
  220.00, 261.63, 329.63, 440.00, // A Minor
  174.61, 220.00, 261.63, 349.23, // F Major
  196.00, 246.94, 293.66, 392.00  // G Major
];
let bgmStep = 0;

function toggleBGM() {
  initAudioCtx();
  bgmPlaying = !bgmPlaying;
  const bgmState = document.getElementById('bgmState');
  const bgmToggleBtn = document.getElementById('bgmToggleBtn');

  if (bgmPlaying) {
    if (bgmState) bgmState.textContent = 'ON';
    if (bgmToggleBtn) bgmToggleBtn.classList.add('active');
    bgmTimer = setInterval(() => {
      const freq = CHIPTUNE_NOTES[bgmStep % CHIPTUNE_NOTES.length];
      playTone(freq, 'triangle', 0.14, 0.035);
      bgmStep++;
    }, 160);
  } else {
    if (bgmState) bgmState.textContent = 'OFF';
    if (bgmToggleBtn) bgmToggleBtn.classList.remove('active');
    clearInterval(bgmTimer);
  }
}

// ================= 💾 FAST RETRO BIOS BOOT SEQUENCE =================
const biosOverlay = document.getElementById('biosOverlay');
const biosLog = document.getElementById('biosLog');
const biosSkipBtn = document.getElementById('biosSkipBtn');
const rebootBtn = document.getElementById('rebootBtn');

const BOOT_MESSAGES = [
  "BIOS DATE: 08/15/2026 15:12:24 VER 4.20.0",
  "CPU: Tensilica Xtensa Dual-Core 32-bit LX6 @ 240MHz",
  "SRAM TEST: 520 KB OK | SPI FLASH: 4MB WINBOND OK",
  "CHECKING PERIPHERALS...",
  "  -> ADC / DAC CALIBRATION: OK (12-bit, Vref=1.1V)",
  "  -> GPIO / PWM TIMERS: 16 CHANNELS INITIALIZED",
  "  -> I2C MASTER BUS (0x68 MPU, 0x3C OLED): DETECTED",
  "  -> SPI BUS 0 (SD CARD / TFT DISPLAY): DETECTED",
  "  -> UART 0 (DEBUG CONSOLE @ 115200 BAUD): READY",
  "  -> 802.11 b/g/n Wi-Fi & BLE 4.2 PHY: ONLINE",
  "LOADING SYSTEM: Jacob_Jibu_EEE_OS_v7.0.bin",
  "VERIFYING CHECKSUM: 0x819000 [CGPA 8.19 VALIDATED]",
  "SYSTEM READY. BOOTING SHELL INTERFACE..."
];

let bootInterval = null;
let bootSkipped = false;

function runBiosBoot() {
  if (!biosOverlay || !biosLog) return;
  bootSkipped = false;
  biosOverlay.classList.remove('hidden');
  biosLog.textContent = '';
  Sound.bootBeep();

  let idx = 0;
  bootInterval = setInterval(() => {
    if (idx < BOOT_MESSAGES.length && !bootSkipped) {
      biosLog.textContent += BOOT_MESSAGES[idx] + "\n";
      Sound.cliType();
      idx++;
    } else {
      clearInterval(bootInterval);
      setTimeout(endBios, 300);
    }
  }, 90);
}

function endBios() {
  bootSkipped = true;
  clearInterval(bootInterval);
  if (biosOverlay) biosOverlay.classList.add('hidden');
  Sound.blip();
}

// ================= 📟 INTERACTIVE CLI TERMINAL =================
const cliModal = document.getElementById('cliModal');
const cliToggleBtn = document.getElementById('cliToggleBtn');
const cliCloseBtn = document.getElementById('cliCloseBtn');
const cliInput = document.getElementById('cliInput');
const cliOutput = document.getElementById('cliOutput');

function toggleCli() {
  if (!cliModal) return;
  cliModal.classList.toggle('active');
  if (cliModal.classList.contains('active')) {
    if (cliInput) cliInput.focus();
    Sound.blip();
  }
}

const CLI_COMMANDS = {
  help: "Available commands:\n- help: List commands\n- skills: Output technical skill inventory\n- projects: View the 6 engineering builds\n- experience: Show timeline\n- contact: Display phone, email, and LinkedIn\n- resume: Open PDF résumé link\n- sudo hire jacob: Issue official employment contract\n- play: Launch Circuit Hopper minigame\n- godmode: ??? [REDACTED CHEAT CODE]\n- reboot: Rerun BIOS boot sequence\n- clear: Clear terminal screen\n- exit: Close CLI",
  skills: "SKILLS:\n- Core Electrical: Circuit Design, Power Electronics, Electrical Machines & Drives, Power Systems & Distribution, Control Systems, Industrial Automation\n- Tools: MATLAB/Simulink, LTspice, Keil µVision, Arduino IDE, Git\n- Programming & Embedded Platforms: Embedded C, C++, Python, Java, ESP32, ESP8266, Arduino\n- Additional: IoT, Wireless Communication, Sensor Interfacing, Machine Learning for Control",
  projects: "PROJECT BUILDS:\n1. Rocket Recovery System (Team IGNITION - Electrical Lead)\n2. Industrial Manufacturing Systems (Apollo Tyres Ltd.)\n3. Adaptive Matrix LED Headlamp System (PWM, LED Driver Circuits)\n4. Smart Climate Regulation Platform (SIH, Peltier)\n5. Smart Energy Management & Load Shedding (Relay Control, ESP32)\n6. Hack 16-Bit Computer Architecture (CPU, HDL)",
  experience: "EXPERIENCE:\n- 2023-Present: B.Tech EEE at VIT Chennai (CGPA 8.19)\n- 2025-2026: Electrical Systems Lead, Recovery Systems, Team IGNITION\n- 2025: Automation & Industrial Intern, Apollo Tyres Ltd.\n- 2021-2023: MTHSS Kaloor (94.66%)",
  contact: "CONTACT INFO:\n- Email: jacobjibu386@gmail.com\n- Phone: +91 90371 29838\n- LinkedIn: https://www.linkedin.com/in/jacob-jibu-95a0a228b",
  resume: "Opening Résumé PDF in new tab...",
  reboot: "Rebooting system...",
  whoami: "guest (Authenticated on Jacob's EEE Rig)",
  clear: "",
  "sudo hire jacob": "🎉 [SUCCESS] EXCELLENT DECISION! Jacob Jibu has accepted the mission. Contact jacobjibu386@gmail.com immediately to finalize contract details!"
};

// ================= DOM EVENTS & INITIALIZATION =================
document.addEventListener('DOMContentLoaded', () => {
  // BIOS triggers
  if (biosSkipBtn) biosSkipBtn.addEventListener('click', endBios);
  if (biosOverlay) biosOverlay.addEventListener('click', endBios);
  window.addEventListener('keydown', (e) => {
    if (biosOverlay && !biosOverlay.classList.contains('hidden')) endBios();
  });
  if (rebootBtn) rebootBtn.addEventListener('click', runBiosBoot);

  // ☰ Mobile Nav Toggle
  const navBurgerBtn = document.getElementById('navBurgerBtn');
  const navLinks = document.getElementById('navLinks');
  if (navBurgerBtn && navLinks) {
    navBurgerBtn.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navBurgerBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      navBurgerBtn.textContent = isOpen ? '✕' : '☰';
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navBurgerBtn.setAttribute('aria-expanded', 'false');
        navBurgerBtn.textContent = '☰';
      });
    });
  }

  // 📱 Move REBOOT / CLI / BGM / CRT / PLAY into the mobile nav menu on
  // small screens, and back into the top toolbar on desktop. Same DOM
  // nodes are relocated (not cloned), so every existing listener above
  // keeps working no matter where the button currently lives.
  (function setupResponsiveToolbar() {
    const hudGroup = document.querySelector('.hud-btn-group');
    if (!hudGroup || !navLinks || !navBurgerBtn) return;

    const toolIds = ['rebootBtn', 'cliToggleBtn', 'bgmToggleBtn', 'crtToggleBtn', 'flappyOpenBtn'];
    const toolBtns = toolIds.map(id => document.getElementById(id)).filter(Boolean);
    if (!toolBtns.length) return;

    let mobileToolWrap = document.getElementById('navMobileTools');
    if (!mobileToolWrap) {
      mobileToolWrap = document.createElement('li');
      mobileToolWrap.id = 'navMobileTools';
      mobileToolWrap.className = 'nav-mobile-tools';
    }

    const mq = window.matchMedia('(max-width: 900px)');

    function applyLayout(isMobile) {
      if (isMobile) {
        toolBtns.forEach(btn => mobileToolWrap.appendChild(btn));
        navLinks.appendChild(mobileToolWrap);
      } else {
        toolBtns.forEach(btn => hudGroup.insertBefore(btn, navBurgerBtn));
        if (mobileToolWrap.parentNode) mobileToolWrap.parentNode.removeChild(mobileToolWrap);
      }
    }

    applyLayout(mq.matches);
    mq.addEventListener('change', (e) => applyLayout(e.matches));
  })();

  // CLI triggers
  if (cliToggleBtn) cliToggleBtn.addEventListener('click', toggleCli);
  if (cliCloseBtn) cliCloseBtn.addEventListener('click', toggleCli);
  window.addEventListener('keydown', (e) => {
    if (e.key === '`' || e.key === '~') {
      if (document.activeElement !== cliInput) {
        e.preventDefault();
        toggleCli();
      }
    }
  });

  if (cliInput) {
    cliInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const rawCmd = cliInput.value.trim();
        const cmd = rawCmd.toLowerCase();
        cliInput.value = '';

        const userLine = document.createElement('p');
        userLine.innerHTML = `<span class="prompt-user">guest@jacob-rig:~$</span> <span class="prompt-cmd">${rawCmd}</span>`;
        cliOutput.appendChild(userLine);

        if (cmd === 'clear') {
          cliOutput.innerHTML = '';
          return;
        }
        if (cmd === 'exit') {
          toggleCli();
          return;
        }
        if (cmd === 'resume') {
          window.open('Resume.pdf', '_blank');
        }
        if (cmd === 'reboot') {
          toggleCli();
          runBiosBoot();
          return;
        }
        if (cmd === 'play') {
          toggleCli();
          const flappyOpenBtn = document.getElementById('flappyOpenBtn');
          if (flappyOpenBtn) flappyOpenBtn.click();
          return;
        }
        if (cmd === 'godmode' || cmd === 'iddqd') {
          const respLine2 = document.createElement('p');
          respLine2.className = 'prompt-highlight';
          if (window.godModeActive) {
            respLine2.textContent = '⚠️ GOD MODE already active. You are already invincible.';
          } else {
            window.activateGodMode();
            respLine2.textContent = '🔓 CHEAT ACCEPTED: GOD MODE ENABLED. Circuit Hopper collisions disabled — type \'play\' to try it.';
          }
          cliOutput.appendChild(respLine2);
          cliOutput.scrollTop = cliOutput.scrollHeight;
          Sound.cliType();
          return;
        }
        const respLine = document.createElement('p');
        respLine.className = 'prompt-resp';
        if (CLI_COMMANDS[cmd]) {
          respLine.textContent = CLI_COMMANDS[cmd];
        } else {
          respLine.textContent = `bash: ${cmd}: command not found. Type 'help' for command list.`;
        }
        cliOutput.appendChild(respLine);
        cliOutput.scrollTop = cliOutput.scrollHeight;
        Sound.cliType();
      }
    });
  }

  // BGM Button
  const bgmToggleBtn = document.getElementById('bgmToggleBtn');
  if (bgmToggleBtn) bgmToggleBtn.addEventListener('click', toggleBGM);

  // CRT Scanline Toggle
  const crtToggleBtn = document.getElementById('crtToggleBtn');
  const crtOverlay = document.getElementById('crtOverlay');
  const crtState = document.getElementById('crtState');
  let crtOn = true;
  if (crtToggleBtn) {
    crtToggleBtn.addEventListener('click', () => {
      crtOn = !crtOn;
      if (crtOverlay) crtOverlay.style.display = crtOn ? 'block' : 'none';
      if (crtState) crtState.textContent = crtOn ? 'ON' : 'OFF';
      Sound.blip();
    });
  }

  // 🌳 RPG Skill Tree Lore Switcher
  const perkNodes = document.querySelectorAll('.perk-node');
  const loreTitle = document.getElementById('loreTitle');
  const loreDesc = document.getElementById('loreDesc');
  const loreStats = document.getElementById('loreStats');

  perkNodes.forEach(node => {
    node.addEventListener('click', () => {
      perkNodes.forEach(n => n.classList.remove('active'));
      node.classList.add('active');

      if (loreTitle) loreTitle.textContent = `PERK: ${node.dataset.title}`;
      if (loreDesc) loreDesc.textContent = node.dataset.desc;
      if (loreStats) loreStats.textContent = node.dataset.stats;
      Sound.blip();
    });
  });

  // 🎛️ Quest Category Filter Buttons
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projCards = document.querySelectorAll('.proj-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      projCards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.classList.remove('filtered-out');
        } else {
          card.classList.add('filtered-out');
        }
      });
      Sound.blip();
    });
  });

  // 🎮 Project Detail Modal (Mission Briefing)
  const projectModal = document.getElementById('projectModal');
  const projectModalBackdrop = document.getElementById('projectModalBackdrop');
  const projectModalClose = document.getElementById('projectModalClose');
  const modalMediaBox = document.querySelector('.project-modal-media');
  const modalImage = document.getElementById('modalImage');
  const modalMissionId = document.getElementById('modalMissionId');
  const modalRev = document.getElementById('modalRev');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalMeta = document.getElementById('modalMeta');
  const modalBounty = document.getElementById('modalBounty');

  function openProjectModal(card) {
    const id = card.querySelector('.proj-id span')?.textContent || '';
    const rev = card.querySelector('.proj-id .rev')?.textContent || '';
    const title = card.querySelector('h3')?.textContent || '';
    const desc = card.dataset.detail || card.querySelector('p')?.textContent || '';
    const bounty = card.querySelector('.proj-bounty')?.textContent || '';
    const metaTags = Array.from(card.querySelectorAll('.proj-meta span')).map(s => s.textContent);
    const image = card.dataset.image || '';

    if (modalMissionId) modalMissionId.textContent = `${id} // MISSION BRIEFING`;
    if (modalRev) modalRev.textContent = rev;
    if (modalTitle) modalTitle.textContent = title;
    if (modalDesc) modalDesc.textContent = desc;
    if (modalBounty) modalBounty.textContent = bounty;
    if (modalMeta) modalMeta.innerHTML = metaTags.map(t => `<span>${t}</span>`).join('');

    if (image && modalImage) {
      modalImage.src = image;
      modalImage.alt = title;
      modalMediaBox?.classList.add('has-img');
    } else {
      modalMediaBox?.classList.remove('has-img');
    }

    projectModal?.classList.add('active');
    document.body.style.overflow = 'hidden';
    Sound.blip();
  }

  function closeProjectModal() {
    projectModal?.classList.remove('active');
    document.body.style.overflow = '';
  }

  projCards.forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.proj-link')) return;
      openProjectModal(card);
    });
    const link = card.querySelector('.proj-link');
    if (link) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openProjectModal(card);
      });
    }
  });

  if (projectModalClose) projectModalClose.addEventListener('click', closeProjectModal);
  if (projectModalBackdrop) projectModalBackdrop.addEventListener('click', closeProjectModal);
  const modalContactBtn = document.getElementById('modalContactBtn');
  if (modalContactBtn) modalContactBtn.addEventListener('click', closeProjectModal);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && projectModal?.classList.contains('active')) closeProjectModal();
  });

  // 🪙 Interactive Coin Slot Easter Egg
  const coinWidget = document.getElementById('coinWidget');
  const coinCount = document.getElementById('coinCount');
  let coins = 6;

  if (coinWidget) {
    coinWidget.addEventListener('click', (e) => {
      coins++;
      if (coinCount) coinCount.textContent = String(coins).padStart(2, '0');
      Sound.coin();

      // Spawn spark particles
      for (let i = 0; i < 16; i++) {
        const spark = document.createElement('div');
        spark.className = 'spark';
        spark.style.left = `${e.clientX}px`;
        spark.style.top = `${e.clientY}px`;
        document.body.appendChild(spark);

        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        let vx = Math.cos(angle) * speed;
        let vy = Math.sin(angle) * speed;
        let life = 1;

        const sparkAnim = setInterval(() => {
          spark.style.left = `${parseFloat(spark.style.left) + vx}px`;
          spark.style.top = `${parseFloat(spark.style.top) + vy}px`;
          vy += 0.2; // gravity
          life -= 0.05;
          spark.style.opacity = life;
          if (life <= 0) {
            clearInterval(sparkAnim);
            spark.remove();
          }
        }, 20);
      }
    });
  }

  // Start BIOS Boot on load
  runBiosBoot();
});

// Coordinate Readout Tracker
const cx = document.getElementById('cx');
const cy = document.getElementById('cy');
window.addEventListener('mousemove', (e) => {
  if(cx && cy){
    cx.textContent = String(e.clientX).padStart(3,'0');
    cy.textContent = String(e.clientY).padStart(3,'0');
  }
});

// ================= COMIC RACING CURSOR & PARTICLES =================
const canvas = document.getElementById('brushCanvas');
const cursorDot = document.getElementById('cursor-dot');
const cursorRing = document.getElementById('cursor-ring');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(hover: none)').matches;

if (canvas && cursorDot && cursorRing && !prefersReducedMotion && !isTouch) {
  const ctx = canvas.getContext('2d');
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  const mouse = {x: innerWidth / 2, y: innerHeight / 2};
  const ring = {x: mouse.x, y: mouse.y};
  let last = {x: mouse.x, y: mouse.y, t: performance.now()};
  let speed = 0;
  const particles = [];

  function resizeCanvas(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function spawnComicParticles(x, y, vx, vy, amount){
    const angle = Math.atan2(vy, vx);
    for(let i = 0; i < amount; i++){
      const a = angle + Math.PI + (Math.random() - .5) * 1.6;
      const force = 1.5 + Math.random() * Math.min(7, speed * .12 + 2);
      particles.push({
        x, y,
        vx: Math.cos(a) * force,
        vy: Math.sin(a) * force,
        life: 1,
        size: 1 + Math.random() * 2.5,
        white: Math.random() < .08
      });
    }
    if(particles.length > 260) particles.splice(0, particles.length - 260);
  }

  function drawSpeedLine(x0, y0, x1, y1){
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.hypot(dx,dy);
    if(dist < 2) return;
    const nx = -dy / dist;
    const ny = dx / dist;

    for(let i = 0; i < 3; i++){
      const offset = (Math.random() - .5) * 9;
      const sx = x0 + nx * offset;
      const sy = y0 + ny * offset;
      const len = Math.min(38, dist * (.7 + Math.random() * .5));

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - dx / dist * len, sy - dy / dist * len);
      ctx.lineWidth = .7 + Math.random() * 1.4;
      ctx.strokeStyle = Math.random() < .12 ? 'rgba(255,255,255,.48)' : 'rgba(198,255,61,.28)';
      ctx.stroke();
    }
  }

  window.addEventListener('mousemove', (e) => {
    const now = performance.now();
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    const dt = Math.max(now - last.t, 1);
    const dist = Math.hypot(dx,dy);
    speed = dist / dt * 16;
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    if(dist > 2){
      drawSpeedLine(last.x,last.y,mouse.x,mouse.y);
      spawnComicParticles(mouse.x,mouse.y,dx,dy,Math.min(7,Math.ceil(dist / 8)));
    }
    last.x = mouse.x;
    last.y = mouse.y;
    last.t = now;
  }, {passive:true});

  const interactive = 'a, button, .tag, .proj-card, .moment-img, .doorway, .perk-node, .coin-slot-widget';
  document.querySelectorAll(interactive).forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });

  function animate(){
    ring.x += (mouse.x - ring.x) * .16;
    ring.y += (mouse.y - ring.y) * .16;
    const stretch = Math.min(speed * .035, .65);

    cursorDot.style.transform = `translate(${mouse.x}px,${mouse.y}px) translate(-50%,-50%)`;
    cursorRing.style.transform = `translate(${ring.x}px,${ring.y}px) translate(-50%,-50%) rotate(${Math.min(speed * .7,35)}deg) scale(${1 + stretch},${1 - stretch*.25})`;

    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,.065)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.restore();

    for(let i = particles.length - 1; i >= 0; i--){
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= .94;
      p.vy *= .94;
      p.life -= .035;
      if(p.life <= 0){
        particles.splice(i,1);
        continue;
      }
      ctx.beginPath();
      ctx.fillStyle = p.white ? `rgba(255,255,255,${p.life*.5})` : `rgba(198,255,61,${p.life*.55})`;
      ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2);
      ctx.fill();
    }
    speed *= .90;
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

// ================= 🎮 CIRCUIT HOPPER MINIGAME (FLAPPY CLONE) =================
(function () {
  const modal = document.getElementById('flappyModal');
  const openBtn = document.getElementById('flappyOpenBtn');
  const closeBtn = document.getElementById('flappyModalClose');
  const backdrop = document.getElementById('flappyModalBackdrop');
  const canvas = document.getElementById('flappyCanvas');
  const scoreEl = document.getElementById('flappyScore');
  const bestEl = document.getElementById('flappyBest');
  const godBadge = document.getElementById('godModeBadge');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const W = canvas.width, H = canvas.height;
  const GRAVITY = 0.45;
  const FLAP_VELOCITY = -7.2;
  const PIPE_GAP = 150;
  const PIPE_WIDTH = 54;
  const PIPE_SPEED = 2.6;
  const PIPE_INTERVAL = 105; // frames between new pipes

  let bird, pipes, frame, score, best, running, godMode, rafId;

  window.godModeActive = false;

  function loadBest() {
    try { return parseInt(localStorage.getItem('circuitHopperBest') || '0', 10); } catch (e) { return 0; }
  }
  function saveBest(val) {
    try { localStorage.setItem('circuitHopperBest', String(val)); } catch (e) {}
  }

  function resetGame() {
    bird = { x: 70, y: H / 2, vy: 0, size: 18 };
    pipes = [];
    frame = 0;
    score = 0;
    running = true;
    godMode = window.godModeActive;
    if (scoreEl) scoreEl.textContent = '0';
    if (godBadge) godBadge.classList.toggle('hidden', !godMode);
  }

  function flap() {
    if (!running) { resetGame(); return; }
    bird.vy = FLAP_VELOCITY;
    Sound.blip();
  }

  function spawnPipe() {
    const margin = 50;
    const gapY = margin + Math.random() * (H - margin * 2 - PIPE_GAP);
    pipes.push({ x: W, gapY, passed: false });
  }

  function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function update() {
    frame++;
    bird.vy += GRAVITY;
    bird.y += bird.vy;

    if (frame % PIPE_INTERVAL === 0) spawnPipe();

    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= PIPE_SPEED;

      if (!p.passed && p.x + PIPE_WIDTH < bird.x) {
        p.passed = true;
        score++;
        if (scoreEl) scoreEl.textContent = String(score);
        Sound.blip();
      }

      if (!godMode) {
        const birdBox = [bird.x - bird.size / 2, bird.y - bird.size / 2, bird.size, bird.size];
        const topPipe = [p.x, 0, PIPE_WIDTH, p.gapY];
        const botPipe = [p.x, p.gapY + PIPE_GAP, PIPE_WIDTH, H - (p.gapY + PIPE_GAP)];
        if (rectsOverlap(...birdBox, ...topPipe) || rectsOverlap(...birdBox, ...botPipe)) {
          gameOver();
        }
      }

      if (p.x + PIPE_WIDTH < -5) pipes.splice(i, 1);
    }

    if (!godMode && (bird.y + bird.size / 2 > H || bird.y - bird.size / 2 < 0)) {
      gameOver();
    } else if (godMode) {
      if (bird.y > H) bird.y = 0;
      if (bird.y < 0) bird.y = H;
    }
  }

  function gameOver() {
    running = false;
    if (score > best) {
      best = score;
      saveBest(best);
      if (bestEl) bestEl.textContent = String(best);
    }
    Sound.blip();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // background grid
    ctx.strokeStyle = 'rgba(198,255,61,0.06)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < W; gx += 24) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (let gy = 0; gy < H; gy += 24) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

    // pipes styled like PCB traces
    pipes.forEach(p => {
      ctx.fillStyle = godMode ? '#ffc857' : '#c6ff3d';
      ctx.shadowColor = godMode ? '#ffc857' : '#c6ff3d';
      ctx.shadowBlur = 10;
      ctx.fillRect(p.x, 0, PIPE_WIDTH, p.gapY);
      ctx.fillRect(p.x, p.gapY + PIPE_GAP, PIPE_WIDTH, H - (p.gapY + PIPE_GAP));
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#020408';
      ctx.fillRect(p.x + 6, 8, PIPE_WIDTH - 12, Math.max(0, p.gapY - 16));
      ctx.fillRect(p.x + 6, p.gapY + PIPE_GAP + 8, PIPE_WIDTH - 12, Math.max(0, H - (p.gapY + PIPE_GAP) - 16));
    });

    // bird styled like a little IC chip
    ctx.save();
    ctx.translate(bird.x, bird.y);
    const angle = Math.max(-0.5, Math.min(0.9, bird.vy * 0.06));
    ctx.rotate(angle);
    ctx.fillStyle = godMode ? '#ffc857' : '#ffe066';
    ctx.shadowColor = godMode ? '#ffc857' : '#ffe066';
    ctx.shadowBlur = 14;
    ctx.fillRect(-bird.size / 2, -bird.size / 2, bird.size, bird.size);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000';
    for (let leg = -1; leg <= 1; leg += 2) {
      ctx.fillRect(-bird.size / 2 - 3, leg * 4 - 1, 3, 2);
      ctx.fillRect(bird.size / 2, leg * 4 - 1, 3, 2);
    }
    ctx.restore();

    if (!running) {
      ctx.fillStyle = 'rgba(2,4,8,0.78)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#c6ff3d';
      ctx.font = '16px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 30);
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffe066';
      ctx.fillText(`SCORE: ${score}`, W / 2, H / 2 + 4);
      ctx.fillText(`BEST: ${best}`, W / 2, H / 2 + 24);
      ctx.fillStyle = '#cdd9e5';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText('TAP TO RETRY', W / 2, H / 2 + 54);
      ctx.textAlign = 'left';
    }
  }

  function loop() {
    if (running) update();
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function openFlappy() {
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    best = loadBest();
    if (bestEl) bestEl.textContent = String(best);
    resetGame();
    cancelAnimationFrame(rafId);
    loop();
    Sound.blip();
  }

  function closeFlappy() {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    cancelAnimationFrame(rafId);
  }

  if (openBtn) openBtn.addEventListener('click', openFlappy);
  if (closeBtn) closeBtn.addEventListener('click', closeFlappy);
  if (backdrop) backdrop.addEventListener('click', closeFlappy);
  window.addEventListener('keydown', (e) => {
    if (!modal || !modal.classList.contains('active')) return;
    if (e.key === 'Escape') { closeFlappy(); return; }
    if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); flap(); }
  });
  canvas.addEventListener('mousedown', flap);
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); flap(); }, { passive: false });

  // 🕹️ GOD MODE — activate via CLI command "godmode"
  window.activateGodMode = function () {
    window.godModeActive = true;
    if (godBadge) godBadge.classList.remove('hidden');
    if (typeof godMode !== 'undefined') godMode = true;
  };
})();
