// Trình phát nhạc theo yêu cầu cho OBS Browser Source. Token ở #hash. Hàng đợi do máy chủ giữ: trang này chỉ lấy bài ĐẦU, báo bắt đầu,
// phát tối đa `maxSeconds` (210 giây) rồi báo xong. "Qua bài" ở trang cài đặt đổi trạng thái bài đang phát; trang này thấy ở lần hỏi kế
// tiếp (3 giây) thì dừng và sang bài sau. Mở lại OBS giữa chừng: phát tiếp bài đang dở từ đúng vị trí.
(function () {
  // API nhúng của YouTube gửi địa chỉ trang hiện tại (kể cả #hash) sang YouTube, nên token phải RỜI khỏi thanh địa chỉ trước khi nạp
  // YouTube: đọc token, giữ trong sessionStorage (để tải lại trang vẫn chạy), rồi xóa #hash.
  let token = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token');
  try {
    if (token) sessionStorage.setItem('vtp-music-token', token);
    else token = sessionStorage.getItem('vtp-music-token');
  } catch {
    // trình duyệt chặn lưu trữ: chỉ dùng token trong lần mở này
  }
  if (window.location.hash) history.replaceState(null, '', window.location.pathname);
  const notice = document.getElementById('musicNotice');
  const box = document.getElementById('player');
  const show = (text) => {
    notice.textContent = text;
    notice.hidden = false;
  };
  if (!token || !/^vtol_[0-9a-f]{64}$/.test(token)) {
    show('Thiếu hoặc sai link phát nhạc. Lấy link đúng ở trang Cài đặt Donate → Phát nhạc.');
    return;
  }
  const base = '/api/v1/overlay/' + encodeURIComponent(token) + '/music';
  const view = window.VTMusic.mount(box);
  let state = null; // phản hồi gần nhất của máy chủ
  let playing = null; // { id, videoId, startedAtMs }
  let player = null;
  let ready = false;
  let finishing = false;

  const post = (path) => fetch(base + path, { method: 'POST', credentials: 'omit' }).then((r) => (r.ok && r.status !== 204 ? r.json() : null));

  function render() {
    if (!state) return;
    const m = state.music;
    box.hidden = !m.enabled || (!playing && !m.alwaysShow && state.queue.length === 0);
    const item = playing ? state.current || state.queue.find((q) => q.id === playing.id) || playing.item : null;
    view.render({
      template: m.template,
      opacity: m.opacity,
      item,
      elapsed: playing ? (Date.now() - playing.startedAtMs) / 1000 : 0,
      total: state.maxSeconds,
      queueCount: state.queue.length,
      idleTitle: m.idleTitle,
      idleText: m.idleText,
      displayText: m.displayText,
    });
  }

  function stopVideo() {
    if (player && ready) player.stopVideo();
  }

  async function finish() {
    if (!playing || finishing) return;
    finishing = true;
    const id = playing.id;
    stopVideo();
    playing = null;
    try {
      await post('/' + id + '/done');
    } finally {
      finishing = false;
      void tick();
    }
  }

  function announce(item) {
    const m = state.music;
    if (!m.voiceEnabled || !window.VTAlerts) return;
    const text = m.voiceText
      .replace(/\{name\}/g, item.donorName)
      .replace(/\{music\}/g, item.title)
      .replace(/\{amount\}/g, new Intl.NumberFormat('vi-VN').format(item.amount) + ' đồng');
    void window.VTAlerts.speak(text, 'vi_female', m.volume);
  }

  function playItem(item, offsetSeconds) {
    playing = { id: item.id, videoId: item.videoId, item, startedAtMs: Date.now() - offsetSeconds * 1000 };
    if (player && ready) {
      player.loadVideoById({ videoId: item.videoId, startSeconds: Math.max(0, Math.floor(offsetSeconds)) });
      player.setVolume(state.music.volume);
      // OBS cho tự phát có tiếng. Trình duyệt thường (xem thử) chặn tự phát có tiếng: sau 3 giây vẫn chưa chạy thì phát TẮT TIẾNG
      // để hàng đợi không bị kẹt; mở trong OBS sẽ không rơi vào nhánh này.
      const id = item.id;
      setTimeout(() => {
        if (!playing || playing.id !== id || !player) return;
        const st = player.getPlayerState();
        if (st !== window.YT.PlayerState.PLAYING && st !== window.YT.PlayerState.BUFFERING) {
          player.mute();
          player.playVideo();
        }
      }, 3000);
    }
    if (offsetSeconds < 2) announce(item);
    render();
  }

  async function tick() {
    try {
      const res = await fetch(base, { credentials: 'omit', cache: 'no-store' });
      if (res.status === 404) return show('Link đã bị đổi hoặc không còn hiệu lực. Lấy link mới ở trang Cài đặt Donate.');
      if (!res.ok) return;
      state = await res.json();
    } catch {
      return;
    }
    if (!state.music.enabled) {
      if (playing) stopVideo();
      playing = null;
      return render();
    }
    if (playing) {
      // Bài đang phát bị "Qua bài" (không còn là bài đang phát trên máy chủ): dừng, sang bài kế.
      if (!state.current || state.current.id !== playing.id) {
        stopVideo();
        playing = null;
      } else if ((Date.now() - playing.startedAtMs) / 1000 >= state.maxSeconds) {
        return finish();
      } else if (player && ready) {
        player.setVolume(state.music.volume);
      }
    }
    if (!playing && state.current && !finishing) {
      // Mở lại OBS khi một bài đang dở: phát tiếp từ đúng vị trí (hoặc kết thúc nếu đã quá giờ).
      const offset = (Date.now() - new Date(state.current.startedAt).getTime()) / 1000;
      if (offset >= state.maxSeconds) {
        playing = { id: state.current.id, item: state.current, startedAtMs: 0 };
        return finish();
      }
      playItem(state.current, offset);
    } else if (!playing && state.queue.length > 0 && ready) {
      const head = state.queue[0];
      const started = await post('/' + head.id + '/start').catch(() => null);
      if (started && started.started) playItem(head, 0);
    }
    render();
  }

  // API nhúng của YouTube (chỉ trang này được phép tải, xem CSP riêng trong Caddyfile).
  window.onYouTubeIframeAPIReady = () => {
    player = new window.YT.Player('yt', {
      host: 'https://www.youtube-nocookie.com',
      width: 320,
      height: 180,
      playerVars: { autoplay: 1, controls: 0, disablekb: 1, playsinline: 1, rel: 0 },
      events: {
        onReady: () => {
          ready = true;
          if (playing) playItem(playing.item, (Date.now() - playing.startedAtMs) / 1000);
          void tick();
        },
        onStateChange: (e) => {
          if (e.data === window.YT.PlayerState.ENDED) void finish();
        },
        // Video bị gỡ/tắt nhúng sau khi donate: bỏ qua, sang bài kế (không kẹt hàng đợi).
        onError: () => void finish(),
      },
    });
  };
  // Chẩn đoán (xem trạng thái trình phát YouTube trong DevTools): -1 chưa bắt đầu, 1 đang phát, 2 tạm dừng, 5 đã nạp.
  window.vtMusicPlayerState = () => (player && ready ? player.getPlayerState() : null);
  const api = document.createElement('script');
  api.src = 'https://www.youtube.com/iframe_api';
  document.head.append(api);

  void tick();
  setInterval(tick, 3000);
  setInterval(render, 1000);
})();
