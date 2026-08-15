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
  cliType() { playTone(700 + Math.random() * 200, 'triangle', 0.02, 0.02); }
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
  "LOADING FIRMWARE: Jacob_Jibu_Embedded_OS_v7.0.bin",
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
  help: "Available commands:\n- help: List commands\n- skills: Output technical skill inventory\n- projects: View the 6 engineering builds\n- experience: Show timeline\n- contact: Display phone, email, and LinkedIn\n- resume: Open PDF résumé link\n- sudo hire jacob: Issue official employment contract\n- reboot: Rerun BIOS boot sequence\n- clear: Clear terminal screen\n- exit: Close CLI",
  skills: "SKILLS:\n- Firmware: Embedded C, C++, Python, Assembly, Java\n- Platforms: ESP32, ESP8266, Arduino, ARM Cortex\n- Tools: MATLAB/Simulink, LTspice, Keil µVision, Arduino IDE, Git\n- Core: Hardware Validation, Circuit Design, I2C/SPI/UART, Power Electronics, Industrial Systems",
  projects: "PROJECT BUILDS:\n1. Adaptive Matrix LED Headlamp System (Arduino, YOLO, PWM)\n2. ESP32 Smart Energy Management (ML, MQTT)\n3. Smart Climate Regulation Platform (SIH, Peltier)\n4. Hack 16-Bit Computer Architecture (CPU, HDL)\n5. Rocket Recovery System (Team IGNITION - Project Lead)\n6. Industrial Manufacturing Systems (Apollo Tyres Ltd.)",
  experience: "EXPERIENCE:\n- 2023-Present: B.Tech EEE at VIT Chennai (CGPA 8.19)\n- 2025-2026: Recovery Subsystem Member & Project Lead, Team IGNITION\n- 2025: Industrial & Automation Intern, Apollo Tyres Ltd.\n- 2021-2023: MTHSS Kaloor (94.66%)",
  contact: "CONTACT INFO:\n- Email: jacobjibu386@gmail.com\n- Phone: +91 90371 29838\n- LinkedIn: https://www.linkedin.com/in/jacob-jibu-95a0a228b",
  resume: "Opening Résumé PDF in new tab...",
  reboot: "Rebooting system...",
  whoami: "guest (Authenticated on Jacob's Embedded Rig)",
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
      navBurgerBtn.textContent = isOpen ? '✕ CLOSE' : '☰ MENU';
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navBurgerBtn.setAttribute('aria-expanded', 'false');
        navBurgerBtn.textContent = '☰ MENU';
      });
    });
  }

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
