/*
 * Hướng dẫn donate (index.html #huong-dan): tự chạy 4 pha của cảnh "tay cầm điện thoại quét QR", làm sáng bước tương ứng,
 * bấm bước để nhảy tới pha đó, rê chuột thì cảnh nghiêng theo. Chỉ chạy khi khu vực đang hiện trên màn hình; tôn trọng nút
 * tạm dừng chuyển động của trang (html[data-motion="off"]) và prefers-reduced-motion.
 */
(function () {
  'use strict';
  const section = document.querySelector('.guide');
  const stage = document.getElementById('guideStage');
  if (!section || !stage) return;

  const steps = Array.from(section.querySelectorAll('.guide-step'));
  const PHASES = steps.length;
  const DURATION = [3600, 3600, 3400, 4200];
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionOn = () => root.dataset.motion !== 'off' && !(reduce.matches && root.dataset.motion !== 'on');

  let phase = 0;
  let timer = null;
  let visible = false;

  function show(next) {
    phase = (next + PHASES) % PHASES;
    stage.dataset.phase = String(phase);
    section.style.setProperty('--guide-phase', DURATION[phase] + 'ms');
    steps.forEach((step, i) => step.classList.toggle('is-active', i === phase));
  }

  function schedule() {
    clearTimeout(timer);
    const playing = visible && motionOn();
    section.classList.toggle('is-playing', playing);
    if (!playing) return;
    timer = setTimeout(() => {
      show(phase + 1);
      schedule();
    }, DURATION[phase]);
  }

  steps.forEach((step, i) => {
    const btn = step.querySelector('.guide-step-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      show(i);
      schedule();
    });
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
        schedule();
      },
      { threshold: 0.35 },
    ).observe(stage);
  } else {
    visible = true;
    schedule();
  }

  // Nút tạm dừng của trang đổi html[data-motion]: dừng/chạy lại theo.
  new MutationObserver(schedule).observe(root, { attributes: true, attributeFilter: ['data-motion'] });
  reduce.addEventListener?.('change', schedule);

  // Nghiêng theo chuột (chỉ máy có chuột, khi chuyển động đang bật).
  const wrap = stage.parentElement;
  if (wrap && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let raf = 0;
    wrap.addEventListener('pointermove', (e) => {
      if (!motionOn()) return;
      const r = wrap.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        stage.style.setProperty('--ry', (x * 10).toFixed(2) + 'deg');
        stage.style.setProperty('--rx', (-y * 6).toFixed(2) + 'deg');
      });
    });
    wrap.addEventListener('pointerleave', () => {
      stage.style.setProperty('--ry', '0deg');
      stage.style.setProperty('--rx', '0deg');
    });
  }

  show(0);
})();
