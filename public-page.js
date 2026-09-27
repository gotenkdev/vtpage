/*
 * Trang người xem (u.html, vtpage.vn/<username>) kiểu VT Page: nút Nhắn tin (sắp có) / Theo dõi / Thông tin, ba tab Donate /
 * Phát nhạc / Mục tiêu, Bảng xếp hạng Ngày/Tháng/Tổng, danh sách Gần đây. Luồng tạo đơn, QR, ghi âm vẫn ở auth.js.
 * Mọi dữ liệu người dùng (tên, lời nhắn) vào trang bằng textContent.
 */
(function () {
  'use strict';
  const root = document.getElementById('donateProfile');
  if (!root || !window.VTApi) return;
  const $ = (id) => document.getElementById(id);
  const username = window.location.pathname.replace(/^\/+/, '').split('/')[0];
  const base = '/profiles/' + encodeURIComponent(username);
  const vnd = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
  let profile = null;
  let me = null;

  function toast(text) {
    const t = $('vpToast');
    t.textContent = text;
    t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => (t.hidden = true), 3500);
  }

  // ---- Nút đầu trang ----
  $('vpMessage').addEventListener('click', () => toast('Tính năng nhắn tin sẽ sớm có.'));

  const followBtn = $('vpFollow');
  function renderFollow(state) {
    followBtn.setAttribute('aria-pressed', String(state.following));
    followBtn.textContent = state.following ? 'Đang theo dõi' : 'Theo dõi';
    followBtn.classList.toggle('btn-primary', !state.following);
    followBtn.classList.toggle('btn-outline', state.following);
    $('vpFollowers').textContent = new Intl.NumberFormat('vi-VN').format(state.followers) + ' người theo dõi';
  }
  followBtn.addEventListener('click', async () => {
    if (!me) {
      window.location.href = '/sign-in';
      return;
    }
    const following = followBtn.getAttribute('aria-pressed') === 'true';
    followBtn.disabled = true;
    try {
      renderFollow(await window.VTApi.call(following ? 'DELETE' : 'PUT', base + '/follow', following ? undefined : {}));
    } catch (err) {
      toast(err.message);
    } finally {
      followBtn.disabled = false;
    }
  });

  const infoDialog = $('vpInfoDialog');
  $('vpInfo').addEventListener('click', () => {
    $('vpNoBio').hidden = !$('creatorBio').hidden;
    $('vpNoSocials').hidden = !$('creatorSocials').hidden;
    infoDialog.showModal();
  });
  $('vpInfoClose').addEventListener('click', () => infoDialog.close());
  infoDialog.addEventListener('click', (e) => {
    if (e.target === infoDialog) infoDialog.close();
  });

  // ---- Tab Donate / Phát nhạc / Mục tiêu ----
  const tabs = [...root.querySelectorAll('.vp-tab')];
  const musicField = $('musicField');
  const musicInput = $('donateMusic');
  function setMode(mode) {
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.mode === mode)));
    const music = mode === 'music';
    musicField.hidden = !music;
    musicInput.required = music;
    if (!music) musicInput.value = '';
    $('vpGoal').hidden = mode !== 'goal';
    if (mode === 'goal') void loadGoal();
    const submit = $('donateForm').querySelector('button[type="submit"]');
    submit.textContent = music ? 'Gửi yêu cầu phát nhạc' : 'Tạo lệnh donate';
  }
  tabs.forEach((t) => t.addEventListener('click', () => setMode(t.dataset.mode)));

  async function loadGoal() {
    try {
      const { goal } = await window.VTApi.call('GET', base + '/goal');
      if (!goal) return;
      const pct = goal.targetAmount > 0 ? Math.min(100, (goal.raised / goal.targetAmount) * 100) : 0;
      $('vpGoalTitle').textContent = goal.title;
      $('vpGoalNote').textContent = goal.note;
      $('vpGoalNote').hidden = !goal.note;
      $('vpGoalPct').textContent = Math.floor(pct) + '%';
      $('vpGoalFill').style.setProperty('--p', (pct / 100).toFixed(4));
      $('vpGoalRaised').textContent = vnd(goal.raised);
      $('vpGoalTarget').textContent = vnd(goal.targetAmount);
      $('vpGoalCount').textContent = goal.count + ' lượt ủng hộ';
    } catch {
      // bỏ qua: tab mục tiêu chỉ không có số liệu
    }
  }

  // ---- Bảng xếp hạng ----
  const initial = (name) => ([...(name || '?').trim()][0] || '?').toUpperCase();
  function avatar(name) {
    const a = document.createElement('span');
    a.className = 'vp-ava';
    a.textContent = initial(name);
    let h = 0;
    for (const c of name || '') h = (h * 31 + c.codePointAt(0)) % 360;
    a.style.setProperty('--h', String(h));
    return a;
  }
  async function loadBoard(period) {
    root.querySelectorAll('.vp-seg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.period === period)));
    const list = $('lbList');
    try {
      const { leaderboard } = await window.VTApi.call('GET', base + '/leaderboard?period=' + period);
      list.textContent = '';
      (leaderboard || []).forEach((row, i) => {
        const li = document.createElement('li');
        const rank = document.createElement('span');
        rank.className = 'vp-rank-no' + (i < 3 ? ' is-top is-top-' + (i + 1) : '');
        rank.textContent = i < 3 ? '♛' : '#' + (i + 1);
        const name = document.createElement('span');
        name.className = 'vp-rank-name';
        name.textContent = row.name;
        const total = document.createElement('strong');
        total.textContent = vnd(row.total);
        li.append(rank, avatar(row.name), name, total);
        list.append(li);
      });
      $('lbEmpty').hidden = list.childElementCount > 0;
    } catch {
      $('lbEmpty').hidden = false;
    }
  }
  root.querySelectorAll('.vp-seg button').forEach((b) => b.addEventListener('click', () => loadBoard(b.dataset.period)));

  // ---- Gần đây ----
  const ago = (iso) => {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'vừa xong';
    if (s < 3600) return Math.floor(s / 60) + ' phút trước';
    if (s < 86400) return Math.floor(s / 3600) + ' giờ trước';
    return Math.floor(s / 86400) + ' ngày trước';
  };
  async function loadRecent() {
    try {
      const { recent } = await window.VTApi.call('GET', base + '/recent');
      if (!recent) return;
      const list = $('recentList');
      list.textContent = '';
      for (const r of recent) {
        const li = document.createElement('li');
        const head = document.createElement('div');
        head.className = 'vp-recent-head';
        const who = document.createElement('div');
        const name = document.createElement('strong');
        name.textContent = r.name;
        const line = document.createElement('span');
        line.className = 'vp-muted';
        const amount = document.createElement('b');
        amount.className = 'vp-amount';
        amount.textContent = vnd(r.amount);
        line.append('Donate ', amount, r.message ? ' với lời nhắn' : '');
        who.append(name, line);
        const time = document.createElement('time');
        time.dateTime = r.createdAt;
        time.textContent = ago(r.createdAt);
        head.append(avatar(r.name), who, time);
        li.append(head);
        if (r.message) {
          const msg = document.createElement('p');
          msg.className = 'vp-bubble';
          msg.textContent = r.message;
          li.append(msg);
        }
        if (r.hasRecording) {
          const rec = document.createElement('span');
          rec.className = 'vp-rec';
          rec.textContent = '🎙 Có lời nhắn ghi âm';
          li.append(rec);
        }
        list.append(li);
      }
      $('recentEmpty').hidden = recent.length > 0;
      $('recentCard').hidden = false;
    } catch {
      // không có danh sách gần đây cũng không sao
    }
  }

  // ---- Tải ban đầu ----
  (async () => {
    try {
      profile = await window.VTApi.call('GET', base);
    } catch {
      return; // auth.js hiện "Không tìm thấy trang"
    }
    try {
      me = await window.VTApi.me();
    } catch {
      me = null;
    }
    renderFollow({ following: false, followers: profile.followers || 0 });
    const signedIn = me && me.mfa && (!me.mfa.enabled || me.mfa.verified);
    $('vpLoginHint').hidden = Boolean(signedIn);
    if (me && me.mfa && (!me.mfa.enabled || me.mfa.verified)) {
      window.VTApi.call('GET', base + '/follow').then(renderFollow).catch(() => undefined);
    }
    const d = profile.donate || {};
    const musicTab = tabs.find((t) => t.dataset.mode === 'music');
    const goalTab = tabs.find((t) => t.dataset.mode === 'goal');
    musicTab.hidden = !(d.music && d.music.enabled);
    goalTab.hidden = !d.goalEnabled;
    if (d.music && d.music.enabled) {
      $('musicHint').textContent = 'Donate từ ' + vnd(d.music.minAmount) + ' để chọn bài; mỗi bài phát tối đa 3 phút 30 giây, ai donate trước phát trước.';
    }
    setMode('donate');
    if (d.showLeaderboard) {
      $('leaderboard').hidden = false;
      void loadBoard('all');
    }
    if (d.showRecent) void loadRecent();
  })();
})();
