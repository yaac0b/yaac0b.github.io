/**
 * Jacob Jibu — Retro Arcade Portfolio (app.js)
 *
 *  - 8-bit Web Audio engine + chiptune BGM (starts only after a user gesture, so no browser warnings)
 *  - BIOS boot sequence (once per visit; REBOOT replays it)
 *  - Responsive nav: dropdown on phones/tablets, scroll-spy highlighting
 *  - Hacker CLI terminal (~ key or button) with history, tab-complete, shortcuts, keyboard-aware on phones
 *  - Skill-tree lore switcher, project filters, swipe carousels with dots
 *  - Project "mission briefing" modal (bottom sheet on phones), focus-trapped
 *  - Coin-slot easter egg with spark particles
 *  - Comic cursor trail (mouse devices only; idles when the mouse is still)
 *  - Circuit Hopper minigame — frame-rate independent (same speed on 60/90/120/144 Hz screens)
 */
(function () {
  'use strict';

  /* =================== HELPERS =================== */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const root = document.documentElement;
  const media = (q) => window.matchMedia(q);
  const reducedMotion = media('(prefers-reduced-motion: reduce)');
  const finePointer = media('(hover: hover) and (pointer: fine)');
  const coarsePointer = media('(hover: none), (pointer: coarse)');
  const onMedia = (mql, fn) => (mql.addEventListener ? mql.addEventListener('change', fn) : mql.addListener(fn));

  const store = {
    get(key, session) { try { return (session ? sessionStorage : localStorage).getItem(key); } catch (e) { return null; } },
    set(key, val, session) { try { (session ? sessionStorage : localStorage).setItem(key, val); } catch (e) { /* private mode */ } }
  };

  let scrollLocks = 0;
  const lockScroll = () => { if (scrollLocks++ === 0) root.classList.add('scroll-lock'); };
  const unlockScroll = () => { scrollLocks = Math.max(0, scrollLocks - 1); if (!scrollLocks) root.classList.remove('scroll-lock'); };

  const smoothBehavior = () => (reducedMotion.matches ? 'auto' : 'smooth');

  /* =================== 8-BIT AUDIO =================== */
  const Audio8 = (() => {
    let ctx = null;
    let master = null;

    // Must only be called from inside a user gesture (click / key).
    function ensure() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!ctx) {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.9;
        master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return ctx;
    }

    function tone(freq, type = 'square', dur = 0.08, vol = 0.08, when = 0) {
      if (!ctx || ctx.state !== 'running') return;
      try {
        const t = ctx.currentTime + Math.max(0, when);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(gain);
        gain.connect(master);
        osc.start(t);
        osc.stop(t + dur + 0.02);
      } catch (e) { /* ignore */ }
    }

    return { ensure, tone, get ctx() { return ctx; } };
  })();

  // Unlock audio on the first real user gesture (prevents "AudioContext was not allowed to start").
  (function setupAudioUnlock() {
    const unlock = (e) => {
      if (e.type === 'keydown' && (e.key === 'Escape' || e.key === 'Tab' || e.key === 'Shift' || e.ctrlKey || e.metaKey || e.altKey)) return;
      const ctx = Audio8.ensure();
      if (ctx) {
        window.removeEventListener('click', unlock, true);
        window.removeEventListener('keydown', unlock, true);
      }
    };
    window.addEventListener('click', unlock, true);
    window.addEventListener('keydown', unlock, true);
  })();

  const Sound = {
    blip() { Audio8.tone(520, 'square', 0.04, 0.04); },
    coin() { Audio8.tone(987.77, 'square', 0.08, 0.09); Audio8.tone(1318.51, 'square', 0.28, 0.09, 0.08); },
    bootBeep() { Audio8.tone(880, 'sine', 0.12, 0.1); },
    type() { Audio8.tone(700 + Math.random() * 200, 'triangle', 0.02, 0.02); },
    powerUp() { [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => Audio8.tone(f, 'square', 0.12, 0.07, i * 0.08)); },
    score() { Audio8.tone(1046.5, 'square', 0.06, 0.045); },
    crash() { Audio8.tone(180, 'sawtooth', 0.25, 0.06); Audio8.tone(90, 'square', 0.35, 0.05, 0.06); }
  };

  /* Chiptune BGM — notes scheduled on the audio clock (no drift / jitter) */
  const BGM = (() => {
    const NOTES = [
      261.63, 329.63, 392.00, 523.25, // C
      220.00, 261.63, 329.63, 440.00, // Am
      174.61, 220.00, 261.63, 349.23, // F
      196.00, 246.94, 293.66, 392.00  // G
    ];
    const STEP = 0.16;
    let playing = false, timer = null, nextTime = 0, step = 0;

    function schedule() {
      const ctx = Audio8.ctx;
      if (!ctx || ctx.state !== 'running') return;
      if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
      while (nextTime < ctx.currentTime + 0.3) {
        const f = NOTES[step % NOTES.length];
        const when = nextTime - ctx.currentTime;
        Audio8.tone(f, 'triangle', 0.14, 0.035, when);
        if (step % 4 === 0) Audio8.tone(NOTES[step % NOTES.length] / 2, 'square', 0.55, 0.014, when);
        nextTime += STEP;
        step++;
      }
    }
    function start() {
      const ctx = Audio8.ensure();
      if (!ctx) return false;
      playing = true;
      nextTime = ctx.currentTime + 0.08;
      clearInterval(timer);
      timer = setInterval(schedule, 60);
      schedule();
      return true;
    }
    function stop() { playing = false; clearInterval(timer); timer = null; }

    // pause the music in background tabs
    document.addEventListener('visibilitychange', () => {
      const ctx = Audio8.ctx;
      if (!ctx || !playing) return;
      if (document.hidden) ctx.suspend().catch(() => {});
      else ctx.resume().catch(() => {});
    });

    return { start, stop, get playing() { return playing; } };
  })();

  /* =================== GENERIC MODAL (focus trap + scroll lock) =================== */
  const openModals = [];
  function createModal(el, opts = {}) {
    if (!el) return null;
    const panel = $('.modal-panel', el);
    let lastFocus = null;

    const isOpen = () => el.classList.contains('active');
    function open(focusTarget) {
      if (isOpen()) return;
      lastFocus = document.activeElement;
      el.classList.add('active');
      el.setAttribute('aria-hidden', 'false');
      lockScroll();
      openModals.push(api);
      if (panel) panel.scrollTop = 0;
      requestAnimationFrame(() => {
        const t = focusTarget || $('.modal-close', el);
        if (t) t.focus({ preventScroll: true });
      });
    }
    function close() {
      if (!isOpen()) return;
      el.classList.remove('active');
      el.setAttribute('aria-hidden', 'true');
      unlockScroll();
      const i = openModals.indexOf(api);
      if (i > -1) openModals.splice(i, 1);
      if (opts.onClose) opts.onClose();
      if (lastFocus && document.contains(lastFocus) && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    el.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
    el.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || !panel) return;
      const f = $$('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])', panel)
        .filter((n) => n.offsetParent !== null || n === document.activeElement);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    const api = { el, open, close, isOpen };
    return api;
  }

  /* =================== BIOS BOOT =================== */
  const Boot = (() => {
    const log = $('#biosLog');
    const overlay = $('#biosOverlay');
    const MESSAGES = [
      'BIOS DATE: 08/15/2026 15:12:24 VER 4.20.0',
      'CPU: Tensilica Xtensa Dual-Core 32-bit LX6 @ 240MHz',
      'SRAM TEST: 520 KB OK | SPI FLASH: 4MB WINBOND OK',
      'CHECKING PERIPHERALS...',
      '  -> ADC / DAC CALIBRATION: OK (12-bit, Vref=1.1V)',
      '  -> GPIO / PWM TIMERS: 16 CHANNELS INITIALIZED',
      '  -> I2C MASTER BUS (0x68 MPU, 0x3C OLED): DETECTED',
      '  -> SPI BUS 0 (SD CARD / TFT DISPLAY): DETECTED',
      '  -> UART 0 (DEBUG CONSOLE @ 115200 BAUD): READY',
      '  -> 802.11 b/g/n Wi-Fi & BLE 4.2 PHY: ONLINE',
      'LOADING SYSTEM: Jacob_Jibu_EEE_OS_v7.0.bin',
      'VERIFYING CHECKSUM: 0x819000 [CGPA 8.19 VALIDATED]',
      'SYSTEM READY. BOOTING SHELL INTERFACE...'
    ];
    let lineTimer = null, endTimer = null;

    const isBooting = () => root.classList.contains('booting');
    function clearTimers() { clearInterval(lineTimer); clearTimeout(endTimer); lineTimer = endTimer = null; }

    function run() {
      if (!log) return;
      clearTimeout(window.__bootFailsafe);
      clearTimers();
      root.classList.add('booting');
      log.textContent = '';
      const cursor = document.createElement('span');
      cursor.className = 'cursor-blink';
      log.appendChild(cursor);
      Sound.bootBeep();

      let i = 0;
      lineTimer = setInterval(() => {
        if (i < MESSAGES.length) {
          log.insertBefore(document.createTextNode(MESSAGES[i] + '\n'), cursor);
          log.scrollTop = log.scrollHeight;
          Sound.type();
          i++;
        } else {
          clearInterval(lineTimer);
          endTimer = setTimeout(end, 450);
        }
      }, reducedMotion.matches ? 25 : 90);
    }

    function end() {
      clearTimers();
      clearTimeout(window.__bootFailsafe);
      if (!isBooting()) return;
      root.classList.remove('booting');
      store.set('biosSeen', '1', true);
      Sound.blip();
    }

    if (overlay) overlay.addEventListener('click', end);
    return { run, end, isBooting };
  })();

  /* =================== NAVIGATION =================== */
  const Nav = (() => {
    const bar = $('#topbar');
    const btn = $('#navBurgerBtn');
    const panel = $('#navPanel');
    const collapsed = media('(max-width: 1079px)');
    if (!bar || !btn || !panel) return { isOpen: () => false, close() {} };

    const isOpen = () => bar.classList.contains('menu-open');
    function open() {
      bar.classList.add('menu-open');
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', 'Close menu');
    }
    function close() {
      bar.classList.remove('menu-open');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Open menu');
    }

    btn.addEventListener('click', () => { (isOpen() ? close : open)(); Sound.blip(); });
    // any link or tool inside the dropdown closes it
    panel.addEventListener('click', (e) => { if (collapsed.matches && e.target.closest('a, button')) close(); });
    // tap outside closes it
    document.addEventListener('click', (e) => { if (isOpen() && !bar.contains(e.target)) close(); });
    onMedia(collapsed, close);

    // scroll-spy: highlight the section currently on screen
    const links = $$('.nav-links a');
    const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    if ('IntersectionObserver' in window) {
      const spy = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          links.forEach((a) => a.classList.remove('is-active'));
          const a = map.get(en.target.id);
          if (a) a.classList.add('is-active');
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      map.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
    }

    return { isOpen, close, button: btn };
  })();

  /* =================== CRT + BGM TOGGLES =================== */
  (function setupToggles() {
    const crtBtn = $('#crtToggleBtn');
    const crtOverlay = $('#crtOverlay');
    const crtState = $('#crtState');
    let crtOn = store.get('crt') !== 'off';

    function applyCrt() {
      if (crtOverlay) crtOverlay.classList.toggle('off', !crtOn);
      if (crtState) crtState.textContent = crtOn ? 'ON' : 'OFF';
      if (crtBtn) crtBtn.setAttribute('aria-pressed', String(crtOn));
    }
    applyCrt();
    if (crtBtn) crtBtn.addEventListener('click', () => { crtOn = !crtOn; store.set('crt', crtOn ? 'on' : 'off'); applyCrt(); Sound.blip(); });

    const bgmBtn = $('#bgmToggleBtn');
    const bgmState = $('#bgmState');
    function applyBgm() {
      if (bgmState) bgmState.textContent = BGM.playing ? 'ON' : 'OFF';
      if (bgmBtn) bgmBtn.setAttribute('aria-pressed', String(BGM.playing));
    }
    if (bgmBtn) bgmBtn.addEventListener('click', () => { if (BGM.playing) BGM.stop(); else BGM.start(); applyBgm(); });

    window.__toggles = {
      crt() { crtOn = !crtOn; store.set('crt', crtOn ? 'on' : 'off'); applyCrt(); return crtOn; },
      bgm() { if (BGM.playing) BGM.stop(); else BGM.start(); applyBgm(); return BGM.playing; }
    };
  })();

  /* =================== SKILL TREE =================== */
  (function setupPerks() {
    const nodes = $$('.perk-node');
    const card = $('#perkLoreCard');
    const title = $('#loreTitle'), desc = $('#loreDesc'), stats = $('#loreStats');
    nodes.forEach((node) => {
      node.addEventListener('click', () => {
        nodes.forEach((n) => { n.classList.remove('active'); n.setAttribute('aria-pressed', 'false'); });
        node.classList.add('active');
        node.setAttribute('aria-pressed', 'true');
        if (title) title.textContent = `PERK: ${node.dataset.title}`;
        if (desc) desc.textContent = node.dataset.desc;
        if (stats) stats.textContent = node.dataset.stats;
        if (card) { card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash'); }
        Sound.blip();
      });
    });
  })();

  /* =================== CAROUSELS (phones/tablets) =================== */
  const Carousels = (() => {
    const all = [];
    function init(track) {
      const dots = document.createElement('div');
      dots.className = 'carousel-dots';
      dots.setAttribute('aria-label', 'Carousel position');
      track.insertAdjacentElement('afterend', dots);

      const visibleItems = () => Array.from(track.children).filter((el) => el.getClientRects().length > 0);
      const padLeft = () => parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;

      function itemLeft(item) {
        return track.scrollLeft + item.getBoundingClientRect().left - track.getBoundingClientRect().left - padLeft();
      }
      function update() {
        const items = visibleItems();
        const btns = dots.children;
        if (!btns.length) return;
        let best = 0, bestDist = Infinity;
        const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
        items.forEach((it, i) => {
          const d = Math.abs(itemLeft(it) - track.scrollLeft);
          if (d < bestDist) { bestDist = d; best = i; }
        });
        if (atEnd) best = items.length - 1;
        Array.from(btns).forEach((b, i) => b.setAttribute('aria-current', String(i === best)));
      }
      function build() {
        dots.textContent = '';
        const items = visibleItems();
        if (items.length < 2 || track.scrollWidth <= track.clientWidth + 4) { dots.hidden = true; return; }
        dots.hidden = false;
        items.forEach((item, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('aria-label', `Show item ${i + 1} of ${items.length}`);
          b.addEventListener('click', () => track.scrollTo({ left: itemLeft(item), behavior: smoothBehavior() }));
          dots.appendChild(b);
        });
        update();
      }

      let ticking = false;
      track.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => { ticking = false; update(); });
      }, { passive: true });

      const api = { track, build, reset() { track.scrollLeft = 0; build(); } };
      all.push(api);
      build();
      return api;
    }

    $$('[data-carousel]').forEach(init);
    let rt = null;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => all.forEach((c) => c.build()), 150); });
    window.addEventListener('load', () => all.forEach((c) => c.build()));
    return { forTrack: (t) => all.find((c) => c.track === t) };
  })();

  /* =================== PROJECT FILTERS + BRIEFING MODAL =================== */
  const Projects = (() => {
    const cards = $$('.proj-card');
    const grid = $('.proj-grid');
    const modal = createModal($('#projectModal'));
    const mediaBox = $('.project-modal-media');
    const img = $('#modalImage');
    const zoom = $('#modalZoom');
    const f = {
      id: $('#modalMissionId'), rev: $('#modalRev'), title: $('#modalTitle'),
      desc: $('#modalDesc'), meta: $('#modalMeta'), bounty: $('#modalBounty')
    };

    function open(card) {
      if (!modal) return;
      const text = (sel) => { const n = $(sel, card); return n ? n.textContent.trim() : ''; };
      f.id.textContent = `${text('.mid')} // MISSION BRIEFING`;
      f.rev.textContent = text('.rev');
      f.title.textContent = text('h3');
      f.desc.textContent = card.dataset.detail || text('p');
      f.bounty.textContent = text('.proj-bounty');
      f.meta.textContent = '';
      $$('.proj-meta span', card).forEach((s) => {
        const tag = document.createElement('span');
        tag.textContent = s.textContent;
        f.meta.appendChild(tag);
      });

      const src = card.dataset.image || '';
      mediaBox.classList.toggle('light', card.dataset.light === 'true');
      img.removeAttribute('src');
      if (src) {
        mediaBox.classList.add('has-img');
        img.alt = text('h3');
        img.onerror = () => mediaBox.classList.remove('has-img');
        img.src = src;
        zoom.href = src;
      } else {
        mediaBox.classList.remove('has-img');
      }
      modal.open();
      Sound.blip();
    }

    cards.forEach((card) => {
      const title = $('h3', card);
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-haspopup', 'dialog');
      if (title) card.setAttribute('aria-label', `Open briefing: ${title.textContent.trim()}`);
      card.addEventListener('click', () => open(card));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(card); }
      });
    });

    const contactBtn = $('#modalContactBtn');
    if (contactBtn) contactBtn.addEventListener('click', () => modal && modal.close());

    // category filter
    const filterBtns = $$('.filter-btn');
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        const filter = btn.dataset.filter;
        cards.forEach((card) => card.classList.toggle('filtered-out', !(filter === 'all' || card.dataset.category === filter)));
        const c = grid && Carousels.forTrack(grid);
        if (c) c.reset();
        Sound.blip();
      });
    });

    return { open, cards, modal };
  })();

  /* =================== CIRCUIT HOPPER (frame-rate independent) =================== */
  const Game = (() => {
    const canvas = $('#flappyCanvas');
    const modalEl = $('#flappyModal');
    if (!canvas || !modalEl) return null;
    const ctx = canvas.getContext('2d');
    const scoreEl = $('#flappyScore');
    const bestEl = $('#flappyBest');
    const godBadge = $('#godModeBadge');

    const W = 360, H = 480;
    const GRAVITY = 0.45, FLAP_V = -7.2, GAP = 150, PIPE_W = 54, SPEED = 2.6, INTERVAL = 105;
    const STEP = 1000 / 60; // physics always runs at 60 ticks/sec

    let bird, pipes, frame, idle, score, best = 0, state = 'ready', godMode = false, godUnlocked = false;
    let raf = 0, last = 0, acc = 0, overAt = 0;

    const modal = createModal(modalEl, { onClose: stop });
    canvas.tabIndex = 0;

    function setupCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function loadBest() { const v = parseInt(store.get('circuitHopperBest') || '0', 10); return Number.isFinite(v) ? v : 0; }

    function reset() {
      bird = { x: 80, y: H / 2 - 20, vy: 0, size: 18 };
      pipes = [];
      frame = 40; // first pipe arrives ~1s after start
      idle = 0;
      score = 0;
      state = 'ready';
      godMode = godUnlocked;
      if (scoreEl) scoreEl.textContent = '0';
      if (godBadge) godBadge.classList.toggle('hidden', !godMode);
    }

    function flap() {
      if (state === 'over') {
        if (performance.now() - overAt < 450) return; // avoid accidental instant restart
        reset();
      }
      if (state === 'ready') state = 'playing';
      bird.vy = FLAP_V;
      Sound.blip();
    }

    function spawnPipe() {
      const margin = 50;
      pipes.push({ x: W, gapY: margin + Math.random() * (H - margin * 2 - GAP), passed: false });
    }
    const overlap = (ax, ay, aw, ah, bx, by, bw, bh) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

    function gameOver() {
      state = 'over';
      overAt = performance.now();
      if (score > best) { best = score; store.set('circuitHopperBest', String(best)); if (bestEl) bestEl.textContent = String(best); }
      Sound.crash();
    }

    function update() {
      if (state === 'ready') { idle++; bird.y = H / 2 - 20 + Math.sin(idle / 10) * 6; return; }
      if (state !== 'playing') return;
      frame++;
      bird.vy += GRAVITY;
      bird.y += bird.vy;
      if (frame % INTERVAL === 0) spawnPipe();

      const half = bird.size / 2;
      for (let i = pipes.length - 1; i >= 0; i--) {
        const p = pipes[i];
        p.x -= SPEED;
        if (!p.passed && p.x + PIPE_W < bird.x) {
          p.passed = true;
          score++;
          if (scoreEl) scoreEl.textContent = String(score);
          Sound.score();
        }
        if (!godMode) {
          const bx = bird.x - half, by = bird.y - half;
          if (overlap(bx, by, bird.size, bird.size, p.x, 0, PIPE_W, p.gapY) ||
              overlap(bx, by, bird.size, bird.size, p.x, p.gapY + GAP, PIPE_W, H - (p.gapY + GAP))) {
            gameOver();
            return;
          }
        }
        if (p.x + PIPE_W < -5) pipes.splice(i, 1);
      }

      if (godMode) {
        if (bird.y > H) bird.y = 0;
        if (bird.y < 0) bird.y = H;
      } else if (bird.y + half > H || bird.y - half < 0) {
        gameOver();
      }
    }

    function centerText(txt, y, size, color) {
      ctx.font = `${size}px "Press Start 2P", monospace`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText(txt, W / 2, y);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(198,255,61,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let gx = 0; gx <= W; gx += 24) { ctx.moveTo(gx + 0.5, 0); ctx.lineTo(gx + 0.5, H); }
      for (let gy = 0; gy <= H; gy += 24) { ctx.moveTo(0, gy + 0.5); ctx.lineTo(W, gy + 0.5); }
      ctx.stroke();

      const pipeColor = godMode ? '#ffc857' : '#c6ff3d';
      pipes.forEach((p) => {
        ctx.fillStyle = pipeColor;
        ctx.shadowColor = pipeColor;
        ctx.shadowBlur = 10;
        ctx.fillRect(p.x, 0, PIPE_W, p.gapY);
        ctx.fillRect(p.x, p.gapY + GAP, PIPE_W, H - (p.gapY + GAP));
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#020408';
        ctx.fillRect(p.x + 6, 8, PIPE_W - 12, Math.max(0, p.gapY - 16));
        ctx.fillRect(p.x + 6, p.gapY + GAP + 8, PIPE_W - 12, Math.max(0, H - (p.gapY + GAP) - 16));
      });

      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate(state === 'playing' ? Math.max(-0.5, Math.min(0.9, bird.vy * 0.06)) : 0);
      const chip = godMode ? '#ffc857' : '#ffe066';
      ctx.fillStyle = chip;
      ctx.shadowColor = chip;
      ctx.shadowBlur = 14;
      ctx.fillRect(-bird.size / 2, -bird.size / 2, bird.size, bird.size);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#000';
      for (let leg = -1; leg <= 1; leg += 2) {
        ctx.fillRect(-bird.size / 2 - 3, leg * 4 - 1, 3, 2);
        ctx.fillRect(bird.size / 2, leg * 4 - 1, 3, 2);
      }
      ctx.restore();

      if (state === 'ready') {
        centerText('CIRCUIT HOPPER', H / 2 - 86, 14, '#c6ff3d');
        centerText(coarsePointer.matches ? 'TAP TO START' : 'CLICK / SPACE TO START', H / 2 + 54, 9, '#ffe066');
        centerText(`BEST: ${best}`, H / 2 + 80, 8, '#7d948b');
      } else if (state === 'over') {
        ctx.fillStyle = 'rgba(2,4,8,0.78)';
        ctx.fillRect(0, 0, W, H);
        centerText('GAME OVER', H / 2 - 30, 16, '#c6ff3d');
        centerText(`SCORE: ${score}`, H / 2 + 4, 10, '#ffe066');
        centerText(`BEST: ${best}`, H / 2 + 24, 10, '#ffe066');
        centerText(coarsePointer.matches ? 'TAP TO RETRY' : 'CLICK / SPACE TO RETRY', H / 2 + 56, 8, '#cdd9e5');
      } else {
        centerText(String(score), 46, 22, 'rgba(235,250,220,0.85)');
      }
      ctx.textAlign = 'left';
    }

    function loop(ts) {
      if (!last) last = ts;
      let dt = ts - last;
      last = ts;
      if (dt > 100) dt = 100; // tab switch / hiccup guard
      acc += dt;
      while (acc >= STEP) { update(); acc -= STEP; }
      draw();
      raf = requestAnimationFrame(loop);
    }
    function startLoop() { cancelAnimationFrame(raf); last = 0; acc = 0; raf = requestAnimationFrame(loop); }
    function stop() { cancelAnimationFrame(raf); raf = 0; }

    function open() {
      setupCanvas();
      best = loadBest();
      if (bestEl) bestEl.textContent = String(best);
      reset();
      modal.open(canvas);
      startLoop();
      Sound.blip();
    }

    canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button > 0) return;
      e.preventDefault();
      canvas.focus({ preventScroll: true });
      flap();
    });

    document.addEventListener('visibilitychange', () => {
      if (!modal.isOpen()) return;
      if (document.hidden) stop(); else startLoop();
    });

    const openBtn = $('#flappyOpenBtn');
    if (openBtn) openBtn.addEventListener('click', open);

    return {
      open,
      flap,
      isOpen: () => modal.isOpen(),
      close: () => modal.close(),
      enableGod() { const was = godUnlocked; godUnlocked = true; godMode = true; if (godBadge) godBadge.classList.remove('hidden'); return !was; }
    };
  })();

  /* =================== CLI TERMINAL =================== */
  const CLI = (() => {
    const modal = $('#cliModal');
    const out = $('#cliOutput');
    const input = $('#cliInput');
    const form = $('#cliForm');
    if (!modal || !out || !input || !form) return { isOpen: () => false, toggle() {}, close() {} };

    const history = [];
    let hIndex = -1;
    const SECTIONS = ['about', 'skills', 'projects', 'experience', 'contact'];
    const LINKS = {
      email: 'mailto:jacobjibu386@gmail.com',
      phone: 'tel:+919037129838',
      linkedin: 'https://www.linkedin.com/in/jacob-jibu-95a0a228b',
      github: 'https://github.com/yaacob'
    };

    const isOpen = () => modal.classList.contains('active');

    // keep the terminal inside the *visible* area when the phone keyboard is up
    function syncViewport() {
      const vv = window.visualViewport;
      if (!vv) return;
      modal.style.setProperty('--vv-h', `${Math.round(vv.height)}px`);
      modal.style.setProperty('--vv-top', `${Math.round(vv.offsetTop)}px`);
      out.scrollTop = out.scrollHeight;
    }
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => isOpen() && syncViewport());
      window.visualViewport.addEventListener('scroll', () => isOpen() && syncViewport());
    }

    function open() {
      if (isOpen()) return;
      syncViewport();
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      input.focus({ preventScroll: true });
      out.scrollTop = out.scrollHeight;
      Sound.blip();
    }
    function close() {
      if (!isOpen()) return;
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      input.blur();
    }
    const toggle = () => (isOpen() ? close() : open());

    function line(text, cls = 'prompt-resp') {
      const p = document.createElement('p');
      p.className = cls;
      p.textContent = text;
      out.appendChild(p);
      return p;
    }
    function linkLine(label, href, text) {
      const p = document.createElement('p');
      p.className = 'prompt-resp';
      p.appendChild(document.createTextNode(label));
      const a = document.createElement('a');
      a.href = href;
      a.textContent = text;
      if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; }
      p.appendChild(a);
      out.appendChild(p);
    }
    function echo(raw) {
      const p = document.createElement('p');
      const u = document.createElement('span');
      u.className = 'prompt-user';
      u.textContent = 'guest@jacob-rig:~$ ';
      const c = document.createElement('span');
      c.className = 'prompt-cmd';
      c.textContent = raw; // textContent: typed input can never inject HTML
      p.append(u, c);
      out.appendChild(p);
    }
    function goTo(id) {
      const el = document.getElementById(id);
      if (!el) return false;
      close();
      el.scrollIntoView({ behavior: smoothBehavior(), block: 'start' });
      return true;
    }

    const projectList = () => Projects.cards.map((c, i) => `  ${i + 1}. ${$('h3', c).textContent.trim()}`).join('\n');

    const COMMANDS = {
      help: () => line(
        'AVAILABLE COMMANDS\n' +
        '  help            list commands\n' +
        '  whoami          who is this?\n' +
        '  skills          skill inventory\n' +
        '  projects        the 6 builds\n' +
        '  open <1-6>      open a project briefing\n' +
        '  experience      timeline\n' +
        '  contact         email / phone / links\n' +
        '  resume          open the PDF résumé\n' +
        '  ls, cd <name>   list / jump to sections\n' +
        '  music, crt      toggle BGM / scanlines\n' +
        '  play            launch Circuit Hopper\n' +
        '  reboot          rerun the BIOS boot\n' +
        '  sudo hire jacob employment contract\n' +
        '  clear, exit'
      ),
      whoami: () => line('guest — authenticated on Jacob\'s EEE rig.\nJacob Jibu: B.Tech EEE @ VIT Chennai, power + control systems, industrial automation.'),
      skills: () => line(
        'SKILLS\n' +
        '- Core Electrical: Circuit Design, Power Electronics, Electrical Machines & Drives, Power Systems & Distribution, Control Systems, Industrial Automation\n' +
        '- Tools: MATLAB, Simulink, LTspice, Keil µVision, Arduino IDE\n' +
        '- Programming & Embedded: Embedded C, C, Python, Java, ESP32, ESP8266, Arduino\n' +
        '- Additional: IoT, Wireless Communication, Sensor Interfacing, Machine Learning for Control'
      ),
      projects: () => line(`PROJECT BUILDS\n${projectList()}\nType 'open <number>' for a briefing.`),
      open: (args) => {
        const n = parseInt(args[0], 10);
        const card = Projects.cards[n - 1];
        if (!card) return line('usage: open <1-6>', 'prompt-err');
        close();
        Projects.open(card);
      },
      experience: () => line(
        'EXPERIENCE\n' +
        '- 2023–now  B.Tech EEE, VIT Chennai (CGPA 8.19)\n' +
        '- 2025–26   Electrical Systems Lead, Recovery Systems, Team IGNITION\n' +
        '- 2025      Automation & Industrial Intern, Apollo Tyres Ltd.\n' +
        '- 2021–23   MTHSS Kaloor (94.66%)'
      ),
      contact: () => {
        line('CONTACT INFO');
        linkLine('- Email:    ', LINKS.email, 'jacobjibu386@gmail.com');
        linkLine('- Phone:    ', LINKS.phone, '+91 90371 29838');
        linkLine('- LinkedIn: ', LINKS.linkedin, 'in/jacob-jibu-95a0a228b');
        linkLine('- GitHub:   ', LINKS.github, 'github.com/yaacob');
      },
      resume: () => { line('Opening résumé PDF in a new tab…'); window.open('Resume.pdf', '_blank', 'noopener'); },
      linkedin: () => { line('Opening LinkedIn…'); window.open(LINKS.linkedin, '_blank', 'noopener'); },
      github: () => { line('Opening GitHub…'); window.open(LINKS.github, '_blank', 'noopener'); },
      email: () => { line('Launching mail client…'); window.location.href = LINKS.email; },
      ls: () => line(SECTIONS.map((s) => `${s}/`).join('  ')),
      cd: (args) => {
        const target = (args[0] || '').replace(/[/.~]/g, '').toLowerCase();
        if (!target) return line('usage: cd <section>   (try: ls)', 'prompt-err');
        if (!goTo(target)) line(`cd: ${target}: no such section`, 'prompt-err');
      },
      music: () => line(`BGM ${window.__toggles.bgm() ? 'ON ♪' : 'OFF'}`),
      crt: () => line(`CRT scanlines ${window.__toggles.crt() ? 'ON' : 'OFF'}`),
      play: () => { close(); if (Game) Game.open(); },
      reboot: () => { close(); Boot.run(); },
      date: () => line(new Date().toString()),
      echo: (args) => line(args.join(' ')),
      sudo: () => line('[sudo] permission denied. Hint: try \'sudo hire jacob\'.', 'prompt-err'),
      'sudo hire jacob': () => { line('🎉 [SUCCESS] EXCELLENT DECISION! Jacob Jibu has accepted the mission. Contact jacobjibu386@gmail.com to finalize contract details!', 'prompt-highlight'); Sound.powerUp(); },
      godmode: () => {
        if (!Game) return;
        const fresh = Game.enableGod();
        line(fresh ? '🔓 CHEAT ACCEPTED: GOD MODE ENABLED. Circuit Hopper collisions disabled — type \'play\'.' : '⚠️ GOD MODE already active. You are already invincible.', 'prompt-highlight');
        if (fresh) Sound.powerUp();
      },
      clear: () => { out.textContent = ''; },
      exit: () => close()
    };
    COMMANDS.about = COMMANDS.whoami;
    COMMANDS.bgm = COMMANDS.music;
    COMMANDS.goto = COMMANDS.cd;
    COMMANDS.iddqd = COMMANDS.godmode;
    COMMANDS.cls = COMMANDS.clear;
    const VISIBLE = ['help', 'whoami', 'skills', 'projects', 'open', 'experience', 'contact', 'resume', 'linkedin', 'github', 'email', 'ls', 'cd', 'music', 'crt', 'play', 'reboot', 'date', 'echo', 'clear', 'exit'];

    function run(raw) {
      const trimmed = raw.trim();
      if (!trimmed) return;
      history.unshift(trimmed);
      if (history.length > 40) history.pop();
      hIndex = -1;
      echo(trimmed);
      const lower = trimmed.toLowerCase().replace(/\s+/g, ' ');
      const [cmd, ...args] = lower.split(' ');
      const has = (k) => Object.prototype.hasOwnProperty.call(COMMANDS, k);
      if (has(lower)) COMMANDS[lower]([]);
      else if (has(cmd)) COMMANDS[cmd](args);
      else line(`bash: ${cmd}: command not found. Type 'help' for the command list.`, 'prompt-err');
      out.scrollTop = out.scrollHeight;
      Sound.type();
    }

    form.addEventListener('submit', (e) => { e.preventDefault(); const v = input.value; input.value = ''; run(v); });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        if (hIndex < history.length - 1) { hIndex++; input.value = history[hIndex]; }
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        if (hIndex > 0) { hIndex--; input.value = history[hIndex]; } else { hIndex = -1; input.value = ''; }
        e.preventDefault();
      } else if (e.key === 'Tab') {
        const v = input.value.trim().toLowerCase();
        if (!v) return;
        const hits = VISIBLE.filter((c) => c.startsWith(v));
        e.preventDefault();
        if (hits.length === 1) input.value = `${hits[0]} `;
        else if (hits.length > 1) line(hits.join('  '));
        out.scrollTop = out.scrollHeight;
      }
    });

    $$('#cliChips button').forEach((b) => b.addEventListener('click', () => {
      run(b.dataset.cmd);
      if (isOpen() && finePointer.matches) input.focus({ preventScroll: true });
    }));

    const toggleBtn = $('#cliToggleBtn');
    const closeBtn = $('#cliCloseBtn');
    if (toggleBtn) toggleBtn.addEventListener('click', toggle);
    if (closeBtn) closeBtn.addEventListener('click', close);

    return { isOpen, open, close, toggle };
  })();

  /* =================== COIN SLOT EASTER EGG =================== */
  (function setupCoins() {
    const btn = $('#coinWidget');
    const countEl = $('#coinCount');
    if (!btn) return;
    let coins = 6;
    const sparks = [];
    let raf = 0;

    function tick() {
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx; s.y += s.vy; s.vy += 0.25; s.life -= 0.035;
        if (s.life <= 0) { s.el.remove(); sparks.splice(i, 1); continue; }
        s.el.style.transform = `translate(${s.x}px, ${s.y}px)`;
        s.el.style.opacity = String(s.life);
      }
      raf = sparks.length ? requestAnimationFrame(tick) : 0;
    }

    btn.addEventListener('click', (e) => {
      coins++;
      if (countEl) countEl.textContent = String(coins).padStart(2, '0');
      btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
      if (coins % 10 === 0) Sound.powerUp(); else Sound.coin();
      if (reducedMotion.matches) return;

      const r = btn.getBoundingClientRect();
      const x0 = e.clientX || r.left + r.width / 2;
      const y0 = e.clientY || r.top + r.height / 2;
      for (let i = 0; i < 16; i++) {
        const el = document.createElement('div');
        el.className = 'spark';
        document.body.appendChild(el);
        const a = Math.random() * Math.PI * 2;
        const v = 2 + Math.random() * 5;
        sparks.push({ el, x: x0, y: y0, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.5, life: 1 });
      }
      if (!raf) raf = requestAnimationFrame(tick);
    });
  })();

  /* =================== COMIC CURSOR (mouse only, sleeps when idle) =================== */
  (function setupCursor() {
    const canvas = $('#brushCanvas');
    const dot = $('#cursor-dot');
    const ring = $('#cursor-ring');
    const cx = $('#cx'), cy = $('#cy');
    if (!canvas || !dot || !ring || !finePointer.matches || reducedMotion.matches) return;

    document.body.classList.add('comic-cursor');
    const ctx = canvas.getContext('2d');
    let dpr = 1;
    const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
    const ringPos = { x: mouse.x, y: mouse.y };
    let last = { x: mouse.x, y: mouse.y, t: performance.now() };
    let speed = 0, raf = 0, quietFrames = 0;
    const particles = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    function spawn(x, y, vx, vy, n) {
      const ang = Math.atan2(vy, vx);
      for (let i = 0; i < n; i++) {
        const a = ang + Math.PI + (Math.random() - 0.5) * 1.6;
        const force = 1.5 + Math.random() * Math.min(7, speed * 0.12 + 2);
        particles.push({ x, y, vx: Math.cos(a) * force, vy: Math.sin(a) * force, life: 1, size: 1 + Math.random() * 2.5, white: Math.random() < 0.08 });
      }
      if (particles.length > 260) particles.splice(0, particles.length - 260);
    }

    function speedLine(x0, y0, x1, y1) {
      const dx = x1 - x0, dy = y1 - y0, dist = Math.hypot(dx, dy);
      if (dist < 2) return;
      const nx = -dy / dist, ny = dx / dist;
      for (let i = 0; i < 3; i++) {
        const off = (Math.random() - 0.5) * 9;
        const sx = x0 + nx * off, sy = y0 + ny * off;
        const len = Math.min(38, dist * (0.7 + Math.random() * 0.5));
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - (dx / dist) * len, sy - (dy / dist) * len);
        ctx.lineWidth = 0.7 + Math.random() * 1.4;
        ctx.strokeStyle = Math.random() < 0.12 ? 'rgba(255,255,255,.48)' : 'rgba(198,255,61,.28)';
        ctx.stroke();
      }
    }

    function frame() {
      ringPos.x += (mouse.x - ringPos.x) * 0.16;
      ringPos.y += (mouse.y - ringPos.y) * 0.16;
      const stretch = Math.min(speed * 0.035, 0.65);
      dot.style.transform = `translate(${mouse.x}px,${mouse.y}px) translate(-50%,-50%)`;
      ring.style.transform = `translate(${ringPos.x}px,${ringPos.y}px) translate(-50%,-50%) rotate(${Math.min(speed * 0.7, 35)}deg) scale(${1 + stretch},${1 - stretch * 0.25})`;

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,.065)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vx *= 0.94; p.vy *= 0.94; p.life -= 0.035;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.fillStyle = p.white ? `rgba(255,255,255,${p.life * 0.5})` : `rgba(198,255,61,${p.life * 0.55})`;
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      speed *= 0.9;

      // go to sleep once everything has settled (saves CPU/GPU when the mouse is still)
      const settled = !particles.length && Math.abs(mouse.x - ringPos.x) < 0.3 && Math.abs(mouse.y - ringPos.y) < 0.3;
      quietFrames = settled ? quietFrames + 1 : 0;
      if (quietFrames > 70) {
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.restore();
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(frame);
    }
    const wake = () => { quietFrames = 0; if (!raf) raf = requestAnimationFrame(frame); };

    window.addEventListener('mousemove', (e) => {
      const now = performance.now();
      const dx = e.clientX - last.x, dy = e.clientY - last.y;
      const dt = Math.max(now - last.t, 1);
      const dist = Math.hypot(dx, dy);
      speed = (dist / dt) * 16;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (dist > 2) {
        speedLine(last.x, last.y, mouse.x, mouse.y);
        spawn(mouse.x, mouse.y, dx, dy, Math.min(7, Math.ceil(dist / 8)));
      }
      last = { x: mouse.x, y: mouse.y, t: now };
      if (cx && cy) { cx.textContent = String(e.clientX).padStart(3, '0'); cy.textContent = String(e.clientY).padStart(3, '0'); }
      document.body.classList.remove('cursor-away');
      wake();
    }, { passive: true });

    document.addEventListener('mouseleave', () => document.body.classList.add('cursor-away'));

    const INTERACTIVE = 'a, button, .tag, .proj-card, .moment-card, .doorway, .perk-node, canvas#flappyCanvas';
    document.addEventListener('mouseover', (e) => {
      document.body.classList.toggle('cursor-hover', !!(e.target.closest && e.target.closest(INTERACTIVE)));
    });

    wake();
  })();

  /* =================== SCROLL REVEAL =================== */
  (function setupReveal() {
    if (!('IntersectionObserver' in window) || reducedMotion.matches) return;
    const targets = $$('.moments-head, .moment, .doorway-inner, #about .arcade-sec-title, .about-dossier-card, .stat-arcade-box, .skill-tree-container, .spec-sheet, #projects .arcade-sec-title, .proj-card, .campaign-stage-card, .contact-cockpit-frame, #skills .arcade-sec-title, #experience .arcade-sec-title');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.classList.add('in');
        io.unobserve(el);
        // drop the helper classes afterwards so hover transforms work normally
        setTimeout(() => el.classList.remove('reveal', 'in'), 700);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    targets.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) return; // already on screen: leave it alone
      el.classList.add('reveal');
      io.observe(el);
    });
  })();

  /* =================== GLOBAL KEYBOARD =================== */
  document.addEventListener('keydown', (e) => {
    if (Boot.isBooting()) {
      if (!e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); Boot.end(); }
      return;
    }

    if (e.key === 'Escape') {
      const top = openModals[openModals.length - 1];
      if (top) { top.close(); return; }
      if (CLI.isOpen()) { CLI.close(); return; }
      if (Nav.isOpen()) { Nav.close(); if (Nav.button) Nav.button.focus(); }
      return;
    }

    if (Game && Game.isOpen()) {
      if (e.key === ' ' || e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        if (!e.repeat) Game.flap();
      }
      return;
    }

    const typing = e.target instanceof HTMLElement && e.target.matches('input, textarea, select, [contenteditable="true"]');
    if (!typing && !openModals.length && (e.key === '`' || e.key === '~')) {
      e.preventDefault();
      CLI.toggle();
    }
  });

  /* =================== MISC + START =================== */
  const rebootBtn = $('#rebootBtn');
  if (rebootBtn) rebootBtn.addEventListener('click', Boot.run);
  const skipBtn = $('#biosSkipBtn');
  if (skipBtn) skipBtn.addEventListener('click', (e) => { e.stopPropagation(); Boot.end(); });

  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  if (root.classList.contains('booting')) Boot.run();
})();
