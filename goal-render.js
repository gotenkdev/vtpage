/*
 * Mục tiêu ủng hộ: bộ vẽ DÙNG CHUNG cho overlay OBS (goal.html) và bản xem trước ở trang Cài đặt Donate.
 * 5 mẫu động theo phong cách AWE (nền gần đen, chữ trắng ngà, điểm nhấn cyan, nhãn mono giãn chữ, đường kẻ mảnh).
 * Tiêu đề/ghi chú của streamer đi vào trang bằng textContent. Khung SVG là chuỗi cố định trong mã, không chứa dữ liệu người dùng.
 * API: window.VTGoal = { TEMPLATES, mount(container) -> { update(goal, raised, count) } }
 */
(function () {
  'use strict';
  const TEMPLATES = [
    ['orbit', 'Orbit — vòng tiến độ'],
    ['instrument', 'Instrument — thanh đo'],
    ['liquid', 'Liquid — chất lỏng'],
    ['segments', 'Segments — ô sáng'],
    ['editorial', 'Editorial — số lớn'],
  ];
  const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(n));
  const SEGMENTS = 24;

  const SKELETONS = {
    orbit: `
      <div class="vg-orbit-ring">
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <circle class="vg-ticks" cx="100" cy="100" r="94"/>
          <circle class="vg-track" cx="100" cy="100" r="78"/>
          <circle class="vg-arc" cx="100" cy="100" r="78" pathLength="100"/>
        </svg>
        <div class="vg-orbit-dot"><i></i></div>
        <div class="vg-orbit-center"><span class="vg-pct"></span><span class="vg-label">ĐÃ ĐẠT</span></div>
      </div>
      <div class="vg-orbit-text">
        <span class="vg-label">MỤC TIÊU · <span class="vg-count"></span> LƯỢT</span>
        <strong class="vg-title"></strong>
        <span class="vg-note"></span>
        <span class="vg-figures"><b class="vg-raised"></b><span class="vg-sep">/</span><span class="vg-target"></span></span>
      </div>`,
    instrument: `
      <div class="vg-row"><span class="vg-label">MỤC TIÊU</span><span class="vg-label"><span class="vg-count"></span> LƯỢT ỦNG HỘ</span></div>
      <strong class="vg-title"></strong>
      <span class="vg-note"></span>
      <div class="vg-meter"><div class="vg-fill"><i class="vg-scan"></i></div><div class="vg-scale"></div></div>
      <div class="vg-row vg-figures"><b class="vg-raised"></b><span class="vg-pct"></span><span class="vg-target"></span></div>`,
    liquid: `
      <div class="vg-row"><strong class="vg-title"></strong><span class="vg-pct"></span></div>
      <span class="vg-note"></span>
      <div class="vg-tank">
        <div class="vg-fluid"><i class="vg-edge"></i>
          <i class="vg-bubble"></i><i class="vg-bubble"></i><i class="vg-bubble"></i>
        </div>
      </div>
      <div class="vg-row vg-figures"><b class="vg-raised"></b><span class="vg-label"><span class="vg-count"></span> LƯỢT · MỤC TIÊU <span class="vg-target"></span></span></div>`,
    segments: `
      <div class="vg-row"><span class="vg-label">MỤC TIÊU / <span class="vg-count"></span> LƯỢT</span><span class="vg-pct"></span></div>
      <strong class="vg-title"></strong>
      <span class="vg-note"></span>
      <div class="vg-segs"></div>
      <div class="vg-row vg-figures"><b class="vg-raised"></b><span class="vg-target"></span></div>`,
    editorial: `
      <span class="vg-label">MỤC TIÊU ỦNG HỘ — <span class="vg-count"></span> LƯỢT</span>
      <strong class="vg-title"></strong>
      <div class="vg-big"><b class="vg-raised"></b></div>
      <div class="vg-line"><i class="vg-head"></i></div>
      <div class="vg-row"><em class="vg-pct"></em><span class="vg-label">TRÊN <span class="vg-target"></span></span></div>
      <span class="vg-note"></span>`,
  };

  function mount(container) {
    let el = null;
    let template = null;
    let shown = 0;
    let lastRaised = null;
    let frame = null;

    function build(t) {
      container.textContent = '';
      el = document.createElement('div');
      el.className = 'vg vg-' + t;
      el.innerHTML = SKELETONS[t];
      const segs = el.querySelector('.vg-segs');
      if (segs) for (let i = 0; i < SEGMENTS; i += 1) {
        const s = document.createElement('i');
        s.style.setProperty('--i', String(i));
        segs.append(s);
      }
      const scale = el.querySelector('.vg-scale');
      if (scale) for (let i = 0; i <= 40; i += 1) scale.append(document.createElement('i'));
      container.append(el);
      template = t;
    }

    const setText = (sel, text) => el.querySelectorAll(sel).forEach((n) => { n.textContent = text; });

    function paint(value, goal, count) {
      const target = Math.max(0, goal.targetAmount);
      const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
      el.style.setProperty('--p', pct.toFixed(2));
      setText('.vg-raised', fmt(value) + 'đ');
      setText('.vg-target', fmt(target) + 'đ');
      setText('.vg-pct', Math.floor(pct) + '%');
      setText('.vg-count', String(count));
      el.querySelectorAll('.vg-segs i').forEach((s, i) => {
        s.classList.toggle('on', (i + 1) / SEGMENTS <= pct / 100 + 1e-9);
        s.classList.toggle('next', i === Math.floor((pct / 100) * SEGMENTS) && pct < 100);
      });
      el.classList.toggle('is-done', target > 0 && value >= target);
    }

    return {
      update(goal, raised, count) {
        if (template !== goal.template || !el) build(goal.template);
        el.style.opacity = String(goal.opacity / 100);
        setText('.vg-title', goal.title || 'Mục tiêu ủng hộ');
        setText('.vg-note', goal.note || '');
        el.querySelectorAll('.vg-note').forEach((n) => { n.hidden = !goal.note; });
        // Số chạy lên từ giá trị đang hiện tới giá trị mới (1,2 giây), kèm nhịp sáng khi tăng.
        const from = shown;
        const to = raised;
        if (lastRaised !== null && to > lastRaised) {
          el.classList.remove('is-bump');
          void el.offsetWidth;
          el.classList.add('is-bump');
        }
        lastRaised = to;
        cancelAnimationFrame(frame);
        const start = performance.now();
        const step = (now) => {
          const t = Math.min(1, (now - start) / 1200);
          const eased = 1 - Math.pow(1 - t, 3);
          shown = from + (to - from) * eased;
          paint(shown, goal, count);
          if (t < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
      },
    };
  }

  window.VTGoal = { TEMPLATES, mount };
})();
