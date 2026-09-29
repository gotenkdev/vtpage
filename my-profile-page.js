/*
 * Hồ sơ cá nhân (/my-profile): tên hiển thị, ảnh đại diện, quốc gia của TÀI KHOẢN (khác hồ sơ trang donate). Thẻ bên phải xem trước
 * cập nhật ngay khi gõ. Ảnh lưu ngay khi chọn (thu nhỏ trong trình duyệt nếu quá 2 MB).
 */
(function () {
  'use strict';
  const root = document.getElementById('accountContent');
  if (!root || !window.VTApi) return;
  const $ = (id) => document.getElementById(id);
  // Mã quốc gia ISO 3166-1 alpha-2; tên hiện bằng tiếng Việt qua Intl.DisplayNames.
  const CODES = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
  let names;
  try {
    names = new Intl.DisplayNames(['vi'], { type: 'region' });
  } catch {
    names = { of: (c) => c };
  }
  const countryName = (c) => (c ? names.of(c) || c : 'Chưa chọn');
  const select = $('apCountry');
  const opts = CODES.map((c) => [c, countryName(c)]).sort((a, b) => a[1].localeCompare(b[1], 'vi'));
  const vn = opts.findIndex(([c]) => c === 'VN');
  if (vn > 0) opts.unshift(opts.splice(vn, 1)[0]); // Việt Nam lên đầu
  for (const [c, n] of opts) select.append(new Option(n, c));

  const nameInput = $('apName');
  let saved = null;
  let avatarUrl = null;
  const initial = () => (nameInput.value.trim() || (saved && saved.email) || '?').slice(0, 1).toUpperCase();

  function renderAvatar() {
    for (const [img, fb] of [['apAvatarImg', 'apAvatarFallback'], ['apPrevImg', 'apPrevFallback']]) {
      $(img).hidden = !avatarUrl;
      $(fb).hidden = !!avatarUrl;
      if (avatarUrl) $(img).src = avatarUrl;
      else $(fb).textContent = initial();
    }
    $('apAvatarRemove').hidden = !avatarUrl;
  }
  function renderPreview() {
    $('apPrevName').textContent = nameInput.value.trim() || (saved ? saved.email.split('@')[0] : 'Tên của bạn');
    $('apPrevMail').textContent = saved ? saved.email : '';
    $('apPrevCountry').textContent = countryName(select.value);
    const dirty = saved && (nameInput.value.trim() !== (saved.displayName || '') || select.value !== (saved.country || ''));
    $('apSave').disabled = !dirty;
    if (!avatarUrl) renderAvatar();
  }
  // Ô chọn quốc gia: nghe cả 'change' (một số trình duyệt điện thoại không phát 'input' cho <select>).
  const onEdit = () => { $('apStatus').textContent = ''; renderPreview(); };
  nameInput.addEventListener('input', onEdit);
  select.addEventListener('input', onEdit);
  select.addEventListener('change', onEdit);

  function showError(msg) {
    $('apError').hidden = !msg;
    $('apErrorText').textContent = msg || '';
  }

  $('apForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');
    const btn = $('apSave');
    btn.disabled = true;
    $('apStatus').textContent = 'Đang lưu…';
    try {
      const { account } = await window.VTApi.call('PATCH', '/me/account-profile', {
        displayName: nameInput.value.trim() || null,
        country: select.value || null,
      });
      saved = account;
      $('apStatus').textContent = 'Đã lưu.';
    } catch (err) {
      showError(err.message);
      $('apStatus').textContent = '';
    }
    renderPreview();
  });

  // ---- Ảnh đại diện ----
  const MAX_BYTES = 2 * 1024 * 1024;
  async function shrink(file) {
    if (file.size <= MAX_BYTES) return file;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1024 / bitmap.width, 1024 / bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    if (!blob || blob.size > MAX_BYTES) throw new Error('Ảnh quá lớn, hãy chọn ảnh nhỏ hơn.');
    return blob;
  }
  $('apAvatarInput').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    showError('');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      showError('Chỉ nhận ảnh PNG, JPEG hoặc WebP.');
      return;
    }
    $('apStatus').textContent = 'Đang tải ảnh…';
    try {
      avatarUrl = (await window.VTApi.uploadImage('/me/account-avatar', await shrink(file))).avatarUrl;
      renderAvatar();
      $('apStatus').textContent = 'Đã lưu ảnh.';
    } catch (err) {
      showError(err.message);
      $('apStatus').textContent = '';
    }
  });
  $('apAvatarRemove').addEventListener('click', async () => {
    showError('');
    try {
      await window.VTApi.call('DELETE', '/me/account-avatar');
      avatarUrl = null;
      renderAvatar();
      $('apStatus').textContent = 'Đã xóa ảnh.';
    } catch (err) {
      showError(err.message);
    }
  });

  window.VTApi.me()
    .then(async (me) => {
      if (!me || (me.mfa.enabled && !me.mfa.verified)) {
        window.location.href = '/sign-in';
        return;
      }
      saved = (await window.VTApi.call('GET', '/me/account-profile')).account;
      nameInput.value = saved.displayName || '';
      $('apEmail').value = saved.email;
      select.value = saved.country || '';
      avatarUrl = saved.avatarUrl;
      renderAvatar();
      renderPreview();
      $('apLoading').hidden = true;
      root.hidden = false;
    })
    .catch((err) => {
      console.error(err);
      $('settingsSubtitle').textContent = 'Không tải được. Hãy tải lại trang.';
    });
})();
