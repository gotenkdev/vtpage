/*
 * Tin nhắn (/messages): danh sách cuộc trò chuyện + nội dung + ô soạn. Mọi nội dung người dùng vào trang bằng textContent (không
 * diễn giải HTML/link). Cập nhật bằng hỏi định kỳ: cuộc đang mở 4 giây/lần, danh sách 15 giây/lần, chỉ khi tab đang hiển thị.
 */
(function () {
  'use strict';
  const root = document.getElementById('msgContent');
  if (!root || !window.VTApi) return;
  const $ = (id) => document.getElementById(id);
  const api = window.VTApi;
  let convs = [];
  let current = null; // { id, role, other, blocked }
  let items = [];
  let lastId = null;

  const p2 = (n) => String(n).padStart(2, '0');
  function stamp(iso) {
    const d = new Date(iso);
    const now = new Date();
    const time = `${p2(d.getHours())}:${p2(d.getMinutes())}`;
    return d.toDateString() === now.toDateString() ? time : `${p2(d.getDate())}/${p2(d.getMonth() + 1)} ${time}`;
  }
  function avatar(el, other) {
    el.textContent = '';
    if (other.avatarUrl) {
      const img = document.createElement('img');
      img.src = other.avatarUrl;
      img.alt = '';
      el.append(img);
    } else {
      el.textContent = (other.name || '?').trim().slice(0, 1).toUpperCase();
    }
  }
  function showError(msg) {
    $('msgError').hidden = !msg;
    $('msgErrorText').textContent = msg || '';
  }

  // ---- Danh sách ----
  async function loadList() {
    const r = await api.call('GET', '/conversations');
    convs = r.conversations;
    $('msgUnread').textContent = r.unread > 0 ? `${r.unread} chưa đọc` : '';
    // Đồng bộ số chưa đọc ở menu trái và chấm trên nút chat đầu trang.
    const side = document.querySelector('.dash-unread');
    if (side) side.textContent = r.unread > 0 ? String(r.unread) : '';
    const dot = document.querySelector('#chatBtn .chat-dot');
    if (dot && r.unread === 0) dot.remove();
    else if (dot) dot.textContent = r.unread > 9 ? '9+' : String(r.unread);
    const ul = $('msgConvs');
    ul.textContent = '';
    for (const c of convs) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'msg-conv' + (current && current.id === c.id ? ' is-active' : '') + (c.unread ? ' is-unread' : '');
      const ava = document.createElement('span');
      ava.className = 'msg-ava';
      avatar(ava, c.other);
      const meta = document.createElement('span');
      meta.className = 'msg-conv-meta';
      const name = document.createElement('strong');
      name.textContent = c.other.name + (c.role === 'streamer' ? '' : ' · trang');
      const last = document.createElement('span');
      last.textContent = c.lastMessage ? (c.lastMessage.fromMe ? 'Bạn: ' : '') + c.lastMessage.body : 'Chưa có tin nhắn';
      meta.append(name, last);
      btn.append(ava, meta);
      if (c.unread) {
        const badge = document.createElement('span');
        badge.className = 'msg-badge';
        badge.textContent = String(c.unread);
        btn.append(badge);
      }
      btn.addEventListener('click', () => void openConv(c.id));
      li.append(btn);
      ul.append(li);
    }
    $('msgConvsEmpty').hidden = convs.length > 0;
  }

  // ---- Cuộc trò chuyện ----
  function renderItems(scrollToEnd) {
    const ol = $('msgItems');
    const box = $('msgScroll');
    const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
    ol.textContent = '';
    for (const m of items) {
      const li = document.createElement('li');
      li.className = 'msg-item' + (m.fromMe ? ' is-me' : '');
      const bubble = document.createElement('p');
      bubble.className = 'msg-bubble';
      bubble.textContent = m.body;
      const time = document.createElement('time');
      time.dateTime = m.at;
      time.textContent = stamp(m.at);
      li.append(bubble, time);
      ol.append(li);
    }
    if (scrollToEnd || atBottom) box.scrollTop = box.scrollHeight;
  }
  function renderHead() {
    avatar($('msgAva'), current.other);
    $('msgName').textContent = current.other.name;
    const link = $('msgLink');
    link.hidden = !current.other.username;
    if (current.other.username) {
      link.href = '/' + encodeURIComponent(current.other.username);
      link.textContent = '@' + current.other.username;
    }
    const block = $('msgBlock');
    block.hidden = current.role !== 'streamer';
    block.textContent = current.blocked ? 'Bỏ chặn' : 'Chặn';
    const note = $('msgBlockedNote');
    note.hidden = !current.blocked;
    note.textContent =
      current.role === 'streamer'
        ? 'Bạn đã chặn người này: họ không gửi thêm tin nhắn được.'
        : 'Trang này không nhận tin nhắn từ bạn nữa.';
    $('msgForm').hidden = current.blocked && current.role === 'viewer';
  }
  async function openConv(id) {
    const c = convs.find((x) => x.id === id);
    if (!c) return;
    current = { id: c.id, role: c.role, other: c.other, blocked: c.blocked };
    history.replaceState(null, '', '/messages?c=' + encodeURIComponent(id));
    $('msgPick').hidden = true;
    $('msgOpen').hidden = false;
    root.classList.add('is-thread');
    showError('');
    renderHead();
    const r = await api.call('GET', `/conversations/${id}/messages`);
    items = r.messages;
    lastId = items.length ? items[items.length - 1].id : null;
    $('msgMore').hidden = items.length < 50;
    renderItems(true);
    if (c.unread) {
      await api.call('POST', `/conversations/${id}/read`).catch(() => undefined);
      c.unread = 0;
      void loadList();
    }
    $('msgInput').focus();
  }
  async function poll() {
    if (!current || document.hidden) return;
    const r = await api.call('GET', `/conversations/${current.id}/messages`).catch(() => null);
    if (!r) return;
    const newest = r.messages.length ? r.messages[r.messages.length - 1].id : null;
    if (newest !== lastId) {
      // Giữ phần tin cũ đã tải thêm, thay phần 50 tin mới nhất.
      const firstNew = r.messages.length ? Number(r.messages[0].id) : Infinity;
      items = items.filter((m) => Number(m.id) < firstNew).concat(r.messages);
      lastId = newest;
      renderItems(false);
      await api.call('POST', `/conversations/${current.id}/read`).catch(() => undefined);
    }
  }
  $('msgMore').addEventListener('click', async () => {
    if (!current || !items.length) return;
    const box = $('msgScroll');
    const before = box.scrollHeight;
    const r = await api.call('GET', `/conversations/${current.id}/messages?before=${items[0].id}`);
    items = r.messages.concat(items);
    $('msgMore').hidden = r.messages.length < 50;
    renderItems(false);
    box.scrollTop = box.scrollHeight - before;
  });

  // ---- Gửi ----
  const input = $('msgInput');
  const grow = () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 160) + 'px';
  };
  input.addEventListener('input', grow);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      $('msgForm').requestSubmit();
    }
  });
  $('msgForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = input.value.trim();
    if (!body || !current) return;
    const btn = $('msgSend');
    btn.disabled = true;
    showError('');
    try {
      const { message } = await api.call('POST', `/conversations/${current.id}/messages`, { body });
      items.push(message);
      lastId = message.id;
      input.value = '';
      grow();
      renderItems(true);
      void loadList();
    } catch (err) {
      showError(err.message);
    } finally {
      btn.disabled = false;
      input.focus();
    }
  });

  $('msgBlock').addEventListener('click', async () => {
    if (!current || current.role !== 'streamer') return;
    const next = !current.blocked;
    if (next && !window.confirm('Chặn người này? Họ sẽ không gửi thêm tin nhắn cho trang của bạn được.')) return;
    try {
      await api.call('POST', `/conversations/${current.id}/block`, { blocked: next });
      current.blocked = next;
      renderHead();
      void loadList();
    } catch (err) {
      showError(err.message);
    }
  });
  $('msgBack').addEventListener('click', () => {
    root.classList.remove('is-thread');
    current = null;
    history.replaceState(null, '', '/messages');
    $('msgOpen').hidden = true;
    $('msgPick').hidden = false;
  });

  api
    .me()
    .then(async (me) => {
      if (!me || (me.mfa.enabled && !me.mfa.verified)) {
        window.location.href = '/sign-in';
        return;
      }
      await loadList();
      $('msgLoading').hidden = true;
      root.hidden = false;
      const want = new URLSearchParams(window.location.search).get('c');
      if (want) await openConv(want);
      setInterval(() => void poll(), 4000);
      setInterval(() => !document.hidden && void loadList().catch(() => undefined), 15000);
    })
    .catch((err) => {
      console.error(err);
      $('settingsSubtitle').textContent = 'Không tải được. Hãy tải lại trang.';
    });
})();
