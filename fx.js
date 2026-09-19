/*
 * VT Page — chuyển động.
 * Cả trang chạy theo MỘT nhịp 5 giây ("ting"): lưới loa gợn sóng, đèn LED,
 * chip thông báo, sơ đồ cơ chế đều bám cùng đồng hồ document.timeline.
 * Tôn trọng prefers-reduced-motion; nút góc trái dưới cho phép tạm dừng.
 */
(() => {
  'use strict';

  const BEAT = 5000;   // độ dài một nhịp (ms)
  const TING = 1300;   // thời điểm loa "ting" trong nhịp (ms), khớp 26% của keyframes
  const WAVE_LIFE = 2.5; // sóng lan trong 2,5 giây rồi tắt hẳn (giây)
  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clock = () => document.timeline.currentTime;

  /* ---------------- công tắc chuyển động ---------------- */
  let saved = null;
  try { saved = localStorage.getItem('vtpage_motion'); } catch (e) { /* bỏ qua */ }
  let enabled = saved ? saved === 'on' : !reduceMq.matches;
  let origin = Math.floor(clock() / BEAT) * BEAT;
  const subscribers = [];

  function alignAnimations() {
    document.getAnimations().forEach((anim) => {
      if (anim.animationName && anim.animationName.indexOf('beat-') === 0) {
        try { anim.startTime = origin; } catch (e) { /* bỏ qua */ }
      }
    });
  }

  let alignQueued = false;
  document.addEventListener('animationstart', (event) => {
    if (!event.animationName || event.animationName.indexOf('beat-') !== 0 || alignQueued) return;
    alignQueued = true;
    requestAnimationFrame(() => { alignQueued = false; alignAnimations(); });
  }, true);

  function applyMotion() {
    root.dataset.motion = enabled ? 'on' : 'off';
    const btn = $('#motionToggle');
    if (btn) {
      const label = enabled ? 'Tạm dừng chuyển động' : 'Bật chuyển động';
      btn.setAttribute('aria-label', label);
      btn.title = label;
    }
    if (enabled) requestAnimationFrame(alignAnimations);
    subscribers.forEach((fn) => fn());
  }

  function setMotion(on, persist) {
    enabled = on;
    if (persist) { try { localStorage.setItem('vtpage_motion', on ? 'on' : 'off'); } catch (e) { /* bỏ qua */ } }
    applyMotion();
  }

  reduceMq.addEventListener('change', () => { if (!saved) setMotion(!reduceMq.matches, false); });

  /* ---------------- lưới loa (canvas) ---------------- */
  const hex = (h) => {
    const n = parseInt(h.trim().replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };

  class Grille {
    constructor(canvas, kind) {
      this.cv = canvas;
      this.ctx = canvas.getContext('2d');
      this.kind = kind;                    // 'face' | 'lattice'
      this.visible = true;
      this.ripples = [];
      this.pointer = null;
      this.level = 0;
      this.target = 0;
      this.resize();
    }

    resize() {
      const rect = this.cv.getBoundingClientRect();
      this.dpr = Math.min(window.devicePixelRatio || 1, this.kind === 'lattice' ? 1.5 : 2);
      this.w = Math.max(1, Math.round(rect.width));
      this.h = Math.max(1, Math.round(rect.height));
      this.cv.width = Math.round(this.w * this.dpr);
      this.cv.height = Math.round(this.h * this.dpr);

      const css = getComputedStyle(this.cv);
      const dark = hex(css.getPropertyValue('--dot') || '#000000');
      const lit = hex(css.getPropertyValue('--dot-lit') || '#ffffff');

      if (this.kind === 'face') {
        this.pitch = this.w / 21;
        this.base = 0.19; this.gain = 0.25; this.speed = 9.5; this.sigma = 1.9; this.decay = 0.85;
        this.a0 = 1; this.a1 = 1;
        this.ox = parseFloat(this.cv.dataset.ox || '1') * this.w;
        this.oy = parseFloat(this.cv.dataset.oy || '0.15') * this.h;
      } else {
        this.pitch = window.innerWidth < 720 ? 22 : 28;
        this.base = 0.085; this.gain = 0.16; this.speed = 11; this.sigma = 2.4; this.decay = 1.05;
        this.a0 = 0.13; this.a1 = 0.85;
        const led = $('.loa-led');
        if (led) {
          const lr = led.getBoundingClientRect();
          const cr = this.cv.getBoundingClientRect();
          this.ox = lr.left - cr.left + lr.width / 2;
          this.oy = lr.top - cr.top + lr.height / 2;
        } else { this.ox = this.w * 0.72; this.oy = this.h * 0.45; }
        // vùng nhìn thấy (thay cho CSS mask): ellipse quanh thiết bị
        this.mx = this.ox / this.w; this.my = this.oy / this.h;
      }
      this.rested = false;   // đổi kích thước xoá canvas: buộc vẽ lại
      this.rowH = this.pitch * 0.866;
      this.cols = Math.ceil(this.w / this.pitch) + 2;
      this.rows = Math.ceil(this.h / this.rowH) + 2;

      // bảng màu đã lượng tử hoá để không phải dựng chuỗi cho từng chấm
      this.lut = [];
      for (let i = 0; i <= 24; i += 1) {
        const k = i / 24;
        const r = Math.round(dark[0] + (lit[0] - dark[0]) * k);
        const g = Math.round(dark[1] + (lit[1] - dark[1]) * k);
        const b = Math.round(dark[2] + (lit[2] - dark[2]) * k);
        const a = this.a0 + (this.a1 - this.a0) * k;
        this.lut.push(`rgba(${r},${g},${b},${a.toFixed(3)})`);
      }
    }

    ripple(x, y, amp) { this.ripples.push({ t0: clock(), x, y, amp: amp || 0.6 }); }

    wave(d, tMs) {
      let v = 0;
      const t = (tMs - TING) / 1000;
      if (t > 0 && t < WAVE_LIFE) {
        const amp = Math.exp(-t * this.decay) * Math.pow(1 - t / WAVE_LIFE, 1.2);
        const x1 = (d - t * this.speed) / this.sigma;
        v += amp * Math.exp(-x1 * x1);
        const t2 = t - 0.3;
        if (t2 > 0) {
          const x2 = (d - t2 * this.speed) / this.sigma;
          v += 0.5 * Math.exp(-t2 * this.decay) * Math.pow(1 - t / WAVE_LIFE, 1.2) * Math.exp(-x2 * x2);
        }
      }
      return v;
    }

    draw(now, still, rest) {
      const { ctx, w, h, dpr, pitch, rowH, cols, rows } = this;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const tMs = rest ? 0 : (still ? 2000 : ((now - origin) % BEAT + BEAT) % BEAT);

      const live = this.ripples.filter((r) => now - r.t0 < 2600);
      this.ripples = live;
      if (this.pointer) this.target = 1; else this.target = 0;
      this.level += (this.target - this.level) * 0.14;
      const sig2 = 2 * (pitch * 2.4) * (pitch * 2.4);

      for (let r = 0; r < rows; r += 1) {
        const y = r * rowH;
        const shift = (r & 1) ? pitch / 2 : 0;
        for (let c = 0; c < cols; c += 1) {
          const x = c * pitch + shift;

          let vis = 1;
          if (this.kind === 'lattice') {
            const ex = (x - this.mx * w) / (0.8 * w);
            const ey = (y - this.my * h) / (0.95 * h);
            const e = Math.sqrt(ex * ex + ey * ey);
            if (e >= 0.82) continue;
            vis = e <= 0.25 ? 1 : (0.82 - e) / 0.57;
          }

          const d = Math.hypot(x - this.ox, y - this.oy) / pitch;
          let v = this.wave(d, tMs);
          for (let i = 0; i < live.length; i += 1) {
            const rp = live[i];
            const t = (now - rp.t0) / 1000;
            const xr = (Math.hypot(x - rp.x, y - rp.y) / pitch - t * 12) / this.sigma;
            v += rp.amp * Math.exp(-t * 1.6) * Math.exp(-xr * xr);
          }
          let p = 0;
          if (this.level > 0.01 && this.pointer) {
            const dx = x - this.pointer.x;
            const dy = y - this.pointer.y;
            p = this.level * Math.exp(-(dx * dx + dy * dy) / sig2);
          }
          const k = Math.min(1, v * 1.1 + p * 0.9);
          const rad = pitch * (this.base + this.gain * Math.min(1.25, v) + this.gain * 0.8 * p);
          const idx = Math.round(k * 24);
          ctx.fillStyle = this.lut[idx];
          if (vis < 1) ctx.globalAlpha = vis; else ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(x, y, rad, 0, 6.2832);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
  }

  const grilles = [];
  let raf = 0;

  function frame() {
    raf = 0;
    if (!enabled || document.hidden) return;
    let any = false;
    const now = clock();
    const phase = ((now - origin) % BEAT + BEAT) % BEAT;
    const waving = phase >= TING - 60 && phase < TING + WAVE_LIFE * 1000 + 60;
    for (let i = 0; i < grilles.length; i += 1) {
      const g = grilles[i];
      if (!g.visible) continue;
      any = true;
      if (waving || g.ripples.length || g.pointer || g.level > 0.01) {
        g.draw(now, false);
        g.rested = false;
      } else if (!g.rested) {
        g.draw(now, false, true);   // một khung nghỉ sạch, rồi không vẽ lại cho tới nhịp sau
        g.rested = true;
      }
    }
    if (any) raf = requestAnimationFrame(frame);
  }

  function kick() {
    if (enabled) { if (!raf) raf = requestAnimationFrame(frame); }
  }

  function redrawStill() {
    if (enabled) return;
    grilles.forEach((g) => g.draw(clock(), true));
  }

  function initGrilles() {
    const items = $$('[data-grille]').map((cv) => new Grille(cv, 'face'))
      .concat($$('[data-lattice]').map((cv) => new Grille(cv, 'lattice')));
    items.forEach((g) => {
      grilles.push(g);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
          g.visible = entries[0].isIntersecting;
          if (g.visible) kick();
        }).observe(g.cv);
      }
      if ('ResizeObserver' in window) {
        let first = true;
        new ResizeObserver(() => {
          if (first) { first = false; return; }
          g.resize();
          if (enabled) kick(); else g.draw(clock(), true);
        }).observe(g.cv);
      }
    });

    window.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      grilles.forEach((g) => {
        if (!g.visible) return;
        const rect = g.cv.getBoundingClientRect();
        const inside = event.clientX >= rect.left && event.clientX <= rect.right
          && event.clientY >= rect.top && event.clientY <= rect.bottom;
        g.pointer = inside ? { x: event.clientX - rect.left, y: event.clientY - rect.top } : null;
      });
      kick();
    }, { passive: true });

    const clearPointer = () => { grilles.forEach((g) => { g.pointer = null; }); kick(); };
    document.documentElement.addEventListener('pointerleave', clearPointer);
    window.addEventListener('blur', clearPointer);
    document.addEventListener('visibilitychange', kick);
    window.addEventListener('load', () => {
      // sau khi phông chữ và bố cục ổn định: đo lại vị trí đèn LED
      grilles.forEach((g) => g.resize());
      if (enabled) kick(); else redrawStill();
    });
    subscribers.push(() => { if (enabled) kick(); else redrawStill(); });
  }

  /* ---------------- điều khiển thủ công ---------------- */
  function ting() {
    if (!enabled) setMotion(true, false);
    origin = clock() - (TING - 450);
    alignAnimations();
    kick();
  }

  function poke() {
    if (!enabled) return;
    grilles.forEach((g) => {
      if (g.kind !== 'face') return;
      g.ripple(g.ox, g.oy, 0.5);
    });
    kick();
  }

  function buzz() {
    const loa = $('.loa');
    if (loa) {
      loa.classList.remove('is-buzz');
      void loa.offsetWidth;
      loa.classList.add('is-buzz');
      setTimeout(() => loa.classList.remove('is-buzz'), 480);
    }
    if (!enabled) return;
    grilles.forEach((g) => {
      if (g.kind !== 'face') return;
      [0, 110, 220].forEach((delay) => setTimeout(() => { g.ripple(g.w * 0.5, g.h * 0.5, 0.7); kick(); }, delay));
    });
  }

  window.VTFX = { ting, poke, buzz, isOn: () => enabled };

  /* ---------------- sơ đồ cơ chế: 4 điểm luân phiên ---------------- */
  function initSpecs() {
    const list = $('#specs');
    const diagram = $('#diagram');
    if (!list || !diagram) return;
    const items = $$('.spec', list);
    let index = -1;
    let timer = 0;
    let hover = false;
    let visible = false;

    const show = (n) => {
      index = n;
      items.forEach((el, k) => el.classList.toggle('is-active', k === n));
      if (n < 0) delete diagram.dataset.active; else diagram.dataset.active = String(n + 1);
    };
    const schedule = () => { clearTimeout(timer); timer = setTimeout(step, 3200); };
    function step() {
      if (enabled && visible && !hover) show((index + 1) % items.length);
      schedule();
    }
    const sync = () => {
      if (enabled && visible) { if (index < 0) show(0); schedule(); }
      else { clearTimeout(timer); if (!enabled) show(-1); }
    };

    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; sync(); }, { threshold: 0.25 }).observe(diagram);
    subscribers.push(sync);

    items.forEach((el, k) => {
      el.addEventListener('pointerenter', () => { if (enabled) { hover = true; list.classList.add('is-hold'); show(k); } });
    });
    list.addEventListener('pointerleave', () => { hover = false; list.classList.remove('is-hold'); if (enabled) schedule(); });
  }

  /* ---------------- so sánh: hai đường tiền đua nhau ---------------- */
  function initRace() {
    const card = $('#raceCard');
    if (!card) return;
    const wallet = $('.lane-wallet', card);
    const vt = $('.lane-vt', card);
    const wSteps = $$('.step', wallet);
    const vSteps = $$('.step', vt);
    const vFinal = $('.step-final', vt);
    const wRes = $('.result', wallet);
    const vRes = $('.result', vt);
    const LOOP = 11800;
    const marks = wSteps.concat(vSteps, [vFinal]);
    let timers = [];
    let token = 0;
    let visible = false;
    let running = false;

    const clear = () => { timers.forEach(clearTimeout); timers = []; };
    const reset = () => {
      marks.forEach((el) => el.classList.remove('is-lit', 'is-live'));
      wRes.classList.remove('is-on');
      vRes.classList.remove('is-on');
    };
    const settle = () => { clear(); token += 1; running = false; card.classList.remove('is-racing'); reset(); };

    function run() {
      clear();
      reset();
      running = true;
      card.classList.add('is-racing');
      token += 1;
      const mine = token;
      const at = (ms, fn) => timers.push(setTimeout(() => { if (mine === token) fn(); }, ms));
      const lit = (el) => { el.classList.remove('is-live'); el.classList.add('is-lit'); };
      const live = (el) => el.classList.add('is-live');

      at(120, () => { lit(wSteps[0]); lit(vSteps[0]); });
      // VT Page: hai bước là xong
      at(600, () => live(vSteps[1]));
      at(1100, () => lit(vSteps[1]));
      at(1400, () => lit(vFinal));
      at(1600, () => vRes.classList.add('is-on'));
      // Mô hình có ví: mỗi bước chờ rất lâu
      at(1000, () => live(wSteps[1]));
      at(4000, () => lit(wSteps[1]));
      at(4100, () => live(wSteps[2]));
      at(6500, () => lit(wSteps[2]));
      at(6600, () => live(wSteps[3]));
      at(8200, () => lit(wSteps[3]));
      at(8500, () => wRes.classList.add('is-on'));
      at(LOOP, run);
    }

    const sync = () => { if (enabled && visible) { if (!running) run(); } else if (running || card.classList.contains('is-racing')) settle(); };
    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; sync(); }, { threshold: 0.3 }).observe(card);
    subscribers.push(sync);

    const btn = $('#raceBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        if (!enabled) setMotion(true, false);
        settle();
        visible = true;
        run();
      });
    }
  }

  /* ---------------- hiện dần khi cuộn ---------------- */
  function initReveal() {
    const items = $$('.reveal');
    if (!('IntersectionObserver' in window)) { items.forEach((el) => el.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach((el) => io.observe(el));
  }

  /* ---------------- đầu trang ---------------- */
  function initBar() {
    const bar = $('.bar');
    if (!bar) return;
    const update = () => bar.classList.toggle('is-scrolled', window.scrollY > 6);
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ---------------- nút bấm ---------------- */
  function initButtons() {
    const toggle = $('#motionToggle');
    if (toggle) toggle.addEventListener('click', () => setMotion(!enabled, true));
    const demo = $('#demoBtn');
    if (demo) demo.addEventListener('click', ting);

    // gõ vào ô nhập thì loa rung nhẹ theo từng phím
    $$('.sign-in-form input').forEach((input) => input.addEventListener('input', poke));
  }

  applyMotion();
  initGrilles();
  initSpecs();
  initRace();
  initReveal();
  initBar();
  initButtons();
})();
