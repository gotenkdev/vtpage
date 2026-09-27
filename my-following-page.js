/* Trang Đang theo dõi (/my-following): các trang người đang đăng nhập theo dõi; bỏ theo dõi ngay tại đây. */
(function () {
  'use strict';
  const root = document.getElementById('followContent');
  if (!root || !window.VTApi) return;
  const $ = (id) => document.getElementById(id);
  let rows = [];

  function render() {
    const list = $('fwList');
    list.textContent = '';
    for (const f of rows) {
      const card = document.createElement('div');
      card.className = 'fw-card';
      const link = document.createElement('a');
      link.className = 'fw-main';
      link.href = '/' + encodeURIComponent(f.username);
      let ava;
      if (f.avatarUrl) {
        ava = document.createElement('img');
        ava.src = f.avatarUrl;
        ava.alt = '';
      } else {
        ava = document.createElement('span');
        ava.textContent = f.name.slice(0, 1).toUpperCase();
      }
      ava.className = 'mo-ava fw-ava';
      const meta = document.createElement('span');
      meta.className = 'fw-meta';
      const name = document.createElement('strong');
      name.textContent = f.name;
      const handle = document.createElement('small');
      handle.textContent = '@' + f.username;
      meta.append(name, handle);
      link.append(ava, meta);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-outline btn-sm';
      btn.textContent = 'Bỏ theo dõi';
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          await window.VTApi.call('DELETE', '/profiles/' + encodeURIComponent(f.username) + '/follow');
          rows = rows.filter((r) => r.username !== f.username);
          render();
        } catch (err) {
          window.alert(err.message);
          btn.disabled = false;
        }
      });
      card.append(link, btn);
      list.append(card);
    }
    $('fwEmpty').hidden = rows.length > 0;
    $('fwCount').textContent = rows.length + ' trang';
    const counter = document.querySelector('.dash-count');
    if (counter) counter.textContent = String(rows.length);
  }

  window.VTApi.me()
    .then(async (me) => {
      if (!me || (me.mfa.enabled && !me.mfa.verified)) {
        window.location.href = '/sign-in';
        return;
      }
      rows = (await window.VTApi.call('GET', '/me/following')).following;
      render();
      $('fwLoading').hidden = true;
      root.hidden = false;
    })
    .catch((err) => {
      console.error(err);
      $('settingsSubtitle').textContent = 'Không tải được. Hãy tải lại trang.';
    });
})();
