/*
 * Ô chọn tự dựng thay cho popup <select> của trình duyệt (một số trình duyệt như Cốc Cốc không mở được popup đó).
 * <select> gốc VẪN là nơi giữ giá trị: bị ẩn đi nhưng vẫn nằm trong form, code khác đọc/ghi .value như cũ và nhận sự kiện
 * input/change như cũ. Danh sách tự cập nhật khi code thêm/bớt <option>. Bỏ qua <select multiple> và <select data-native>.
 */
(function () {
  'use strict';
  const valueDesc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  const indexDesc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'selectedIndex');
  const fold = (t) =>
    t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  let seq = 0;
  let openMenu = null;

  function enhance(select) {
    if (select.dataset.enhanced || select.multiple || select.hasAttribute('data-native')) return;
    select.dataset.enhanced = '1';
    seq += 1;
    const id = select.id || 'sel' + seq;
    const wrap = document.createElement('div');
    wrap.className = 'sel';
    select.parentNode.insertBefore(wrap, select);
    wrap.append(select);
    select.classList.add('sel-native');
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sel-btn';
    btn.id = id + '-btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    const text = document.createElement('span');
    btn.append(text);
    btn.insertAdjacentHTML(
      'beforeend',
      '<svg viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    );
    wrap.append(btn);
    // Nhãn <label for="..."> trỏ sang nút để bấm nhãn cũng mở được, và trình đọc màn hình đọc đúng tên.
    if (select.id) {
      for (const label of document.querySelectorAll(`label[for="${CSS.escape(select.id)}"]`)) {
        label.htmlFor = btn.id;
        if (!label.id) label.id = id + '-lbl';
        btn.setAttribute('aria-labelledby', label.id + ' ' + btn.id);
      }
    }
    if (!btn.hasAttribute('aria-labelledby') && select.getAttribute('aria-label'))
      btn.setAttribute('aria-label', select.getAttribute('aria-label'));

    const pop = document.createElement('div');
    pop.className = 'sel-pop';
    pop.hidden = true;
    const search = document.createElement('input');
    search.type = 'search';
    search.className = 'sel-search';
    search.placeholder = 'Tìm…';
    search.autocomplete = 'off';
    search.setAttribute('aria-label', 'Tìm');
    const list = document.createElement('ul');
    list.className = 'sel-list';
    list.setAttribute('role', 'listbox');
    list.id = id + '-list';
    list.tabIndex = -1;
    pop.append(search, list);
    wrap.append(pop);

    let shown = [];
    let hl = 0;
    const current = () => select.options[indexDesc.get.call(select)];
    function syncText() {
      const o = current();
      text.textContent = o ? o.textContent : '';
      btn.disabled = select.disabled;
    }
    // Code khác gán select.value = ... thì chữ trên nút cũng đổi theo.
    Object.defineProperty(select, 'value', {
      configurable: true,
      get() {
        return valueDesc.get.call(this);
      },
      set(v) {
        valueDesc.set.call(this, v);
        syncText();
      },
    });
    Object.defineProperty(select, 'selectedIndex', {
      configurable: true,
      get() {
        return indexDesc.get.call(this);
      },
      set(v) {
        indexDesc.set.call(this, v);
        syncText();
      },
    });
    new MutationObserver(syncText).observe(select, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
    select.addEventListener('change', syncText);
    select.form && select.form.addEventListener('reset', () => setTimeout(syncText));

    function render() {
      const q = fold(search.value.trim());
      const opts = Array.from(select.options).filter((o) => !o.hidden);
      shown = opts.filter((o) => !q || fold(o.textContent).includes(q));
      const cur = current();
      hl = q ? 0 : Math.max(0, shown.indexOf(cur));
      list.textContent = '';
      shown.forEach((o, i) => {
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.id = `${id}-o${i}`;
        li.textContent = o.textContent;
        li.setAttribute('aria-selected', String(o === cur));
        if (o.disabled) li.setAttribute('aria-disabled', 'true');
        li.addEventListener('mousedown', (e) => e.preventDefault());
        li.addEventListener('click', () => pick(o));
        list.append(li);
      });
      if (!shown.length) {
        const li = document.createElement('li');
        li.className = 'sel-empty';
        li.textContent = 'Không tìm thấy';
        list.append(li);
      }
      move(0);
    }
    function move(d) {
      if (!shown.length) return;
      hl = (hl + d + shown.length) % shown.length;
      Array.from(list.children).forEach((li, i) => li.classList.toggle('is-hl', i === hl));
      const li = list.children[hl];
      if (li) {
        li.scrollIntoView({ block: 'nearest' });
        (search.hidden ? list : search).setAttribute('aria-activedescendant', li.id);
      }
    }
    function open() {
      if (select.disabled) return;
      if (openMenu && openMenu !== close) openMenu();
      openMenu = close;
      // Ô tìm kiếm chỉ khi danh sách dài.
      search.hidden = select.options.length <= 10;
      search.value = '';
      pop.hidden = false;
      wrap.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      // Mở lên trên nếu phía dưới không đủ chỗ.
      const r = btn.getBoundingClientRect();
      wrap.classList.toggle('sel-up', window.innerHeight - r.bottom < 300 && r.top > window.innerHeight - r.bottom);
      render();
      (search.hidden ? list : search).focus();
    }
    function close(focusBtn) {
      if (pop.hidden) return;
      pop.hidden = true;
      wrap.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      if (openMenu === close) openMenu = null;
      if (focusBtn === true) btn.focus();
    }
    function pick(o) {
      if (o.disabled) return;
      const changed = o !== current();
      indexDesc.set.call(select, o.index);
      syncText();
      close(true);
      if (changed) {
        select.dispatchEvent(new Event('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    function keys(e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        move(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        move(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (shown[hl]) pick(shown[hl]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close(true);
      } else if (e.key === 'Tab') {
        close(false);
      }
    }
    btn.addEventListener('click', () => (pop.hidden ? open() : close(false)));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        open();
      }
    });
    search.addEventListener('input', render);
    search.addEventListener('keydown', keys);
    list.addEventListener('keydown', keys);
    syncText();
  }

  document.addEventListener('click', (e) => {
    if (openMenu && !e.target.closest('.sel.is-open')) openMenu(false);
  });

  function scan(root) {
    if (root.matches && root.matches('select')) enhance(root);
    if (root.querySelectorAll) root.querySelectorAll('select').forEach(enhance);
  }
  scan(document);
  // Ô chọn thêm vào sau (code dựng động) cũng được thay.
  new MutationObserver((records) => {
    for (const r of records) for (const n of r.addedNodes) if (n.nodeType === 1) scan(n);
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
