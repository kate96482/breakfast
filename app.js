(() => {
    'use strict';

    const CONFIG = window.BREAKFAST_CONFIG || {};
    const API_URL = String(CONFIG.API_URL || '').trim();
    const CACHE_KEY = 'breakfast-cache-v2';
    const VIEW_KEY = 'breakfast-view';
    const PW_KEY = 'breakfast-admin';
    const WEEK = '日一二三四五六';

    // 試算表標題（第一列）↔ 欄位，和 apps-script/Code.gs 一致
    const FIELDS = {
        id: 'id', name: '店名', img: '照片', phone: '電話', addr: '地址',
        link: '線上點餐網址', note: '愛吃什麼', type: '類型', hours: '營業時間',
    };

    // 圖示（Tabler Icons，MIT 授權）
    const ICONS = {
        'phone': '<path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2"/>',
        'map-2': '<path d="M12 18.5l-3 -1.5l-6 3v-13l6 -3l6 3l6 -3v7.5"/><path d="M9 4v13"/><path d="M15 7v5.5"/><path d="M21.121 20.121a3 3 0 1 0 -4.242 0c.418 .419 1.125 1.045 2.121 1.879c1.051 -.89 1.759 -1.516 2.121 -1.879z"/><path d="M19 18v.01"/>',
        'shopping-bag': '<path d="M6.331 8h11.339a2 2 0 0 1 1.977 2.304l-1.255 8.152a3 3 0 0 1 -2.966 2.544h-6.852a3 3 0 0 1 -2.965 -2.544l-1.255 -8.152a2 2 0 0 1 1.977 -2.304z"/><path d="M9 11v-5a3 3 0 0 1 6 0v5"/>',
        'arrows-shuffle': '<path d="M18 4l3 3l-3 3"/><path d="M18 20l3 -3l-3 -3"/><path d="M3 7h3a5 5 0 0 1 5 5a5 5 0 0 0 5 5h5"/><path d="M21 7h-5a4.978 4.978 0 0 0 -3 1m-4 8a4.984 4.984 0 0 1 -3 1h-3"/>',
        'layout-grid': '<path d="M4 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"/><path d="M14 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"/><path d="M4 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"/><path d="M14 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"/>',
        'carousel-horizontal': '<path d="M7 5m0 1a1 1 0 0 1 1 -1h8a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-8a1 1 0 0 1 -1 -1z"/><path d="M22 17h-1a1 1 0 0 1 -1 -1v-8a1 1 0 0 1 1 -1h1"/><path d="M2 17h1a1 1 0 0 0 1 -1v-8a1 1 0 0 0 -1 -1h-1"/>',
        'pencil': '<path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4"/><path d="M13.5 6.5l4 4"/>',
        'plus': '<path d="M12 5l0 14"/><path d="M5 12l14 0"/>',
        'x': '<path d="M18 6l-12 12"/><path d="M6 6l12 12"/>',
        'chevron-left': '<path d="M15 6l-6 6l6 6"/>',
        'chevron-right': '<path d="M9 6l6 6l-6 6"/>',
        'camera': '<path d="M5 7h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2"/><path d="M9 13a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"/>',
        'clock': '<path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 7v5l3 3"/>',
        'map-pin': '<path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"/><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z"/>',
        'lock': '<path d="M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6z"/><path d="M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0"/><path d="M8 11v-4a4 4 0 1 1 8 0v4"/>',
        'dice-5': '<path d="M3 3m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z"/><circle cx="8.5" cy="8.5" r=".5" fill="currentColor"/><circle cx="15.5" cy="8.5" r=".5" fill="currentColor"/><circle cx="15.5" cy="15.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="15.5" r=".5" fill="currentColor"/><circle cx="12" cy="12" r=".5" fill="currentColor"/>',
        'heart': '<path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572"/>',
        'tools-kitchen-2': '<path d="M19 3v12h-5c-.023 -3.681 .184 -7.406 5 -12zm0 12v6h-1v-3m-10 -14v17m-3 -17v3a3 3 0 1 0 6 0v-3"/>',
    };
    const icon = (name) => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

    const $ = (sel) => document.querySelector(sel);
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    // 無痕模式等情況 localStorage 可能不能用，包起來避免整頁壞掉
    const storage = {
        get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
        set(key, value) {
            try { value == null ? localStorage.removeItem(key) : localStorage.setItem(key, value); } catch (e) { /* 忽略 */ }
        },
    };

    const state = {
        items: [],
        loaded: false,
        lastFetch: 0,
        filter: '全部',
        view: storage.get(VIEW_KEY) === 'grid' ? 'grid' : 'swipe',
        swipeIndex: 0,
        pw: API_URL ? (storage.get(PW_KEY) || '') : '',
        pick: null,        // 抽到的店 id
        rolling: false,
        editing: null,     // 正在修改的店（null 代表新增）
        photo: null,       // 剛選的新照片 { mime, base64, dataUrl }
        editTypes: new Set(),
        editOff: new Set(),
        rawHours: '',
    };

    const isAdmin = () => !!(API_URL && state.pw);
    const findItem = (id) => state.items.find((x) => x.id === id);

    /* ---------- 資料 ---------- */

    function normalize(raw, i) {
        const text = (v) => String(v == null ? '' : v).trim();
        const http = (v) => (/^https?:\/\//i.test(text(v)) ? text(v) : '');
        const id = text(raw.id);
        return {
            id: id || `row-${i}`,
            editable: !!id,
            name: text(raw.name),
            img: http(raw.img),
            phone: text(raw.phone),
            addr: text(raw.addr),
            link: http(raw.link),
            note: text(raw.note),
            types: text(raw.type).split(/[、,，/\s]+/).filter(Boolean),
            hours: text(raw.hours),
        };
    }

    // 正確處理引號和欄位裡的逗號、換行
    function parseCSV(text) {
        const rows = [];
        let row = [];
        let field = '';
        let quoted = false;
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (quoted) {
                if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
                else if (c === '"') quoted = false;
                else field += c;
            } else if (c === '"') quoted = true;
            else if (c === ',') { row.push(field); field = ''; }
            else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
            else if (c !== '\r') field += c;
        }
        if (field || row.length) { row.push(field); rows.push(row); }
        return rows;
    }

    function csvToItems(text) {
        const rows = parseCSV(text);
        const header = (rows.shift() || []).map((h) => h.trim());
        const idx = {};
        Object.keys(FIELDS).forEach((key) => { idx[key] = header.indexOf(FIELDS[key]); });
        return rows
            .map((r) => {
                const raw = {};
                Object.keys(FIELDS).forEach((key) => { raw[key] = idx[key] >= 0 ? r[idx[key]] : ''; });
                return raw;
            })
            .map(normalize)
            .filter((x) => x.name);
    }

    async function fetchItems() {
        if (API_URL) {
            const res = await fetch(API_URL, { cache: 'no-store' });
            const data = await res.json();
            if (!data.ok) throw new Error(data.error || '讀取失敗');
            return data.items.map(normalize).filter((x) => x.name);
        }
        const res = await fetch(CONFIG.CSV_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return csvToItems(await res.text());
    }

    function readCache() {
        try {
            const list = JSON.parse(storage.get(CACHE_KEY) || 'null');
            return Array.isArray(list) && list.length ? list : null;
        } catch (e) {
            return null;
        }
    }

    const writeCache = () => storage.set(CACHE_KEY, JSON.stringify(state.items));

    // 先顯示上次的資料，再到背景抓最新的
    async function load() {
        const cached = !state.loaded && readCache();
        if (cached) {
            state.items = cached;
            state.loaded = true;
            renderAll();
        }
        try {
            const items = await fetchItems();
            state.items = items;
            state.loaded = true;
            state.lastFetch = Date.now();
            writeCache();
            renderAll();
        } catch (err) {
            console.error(err);
            if (state.loaded) toast('目前無法更新，先顯示上次的資料');
            else $('#list').innerHTML = `<div class="state">菜單載入失敗了<br><button type="button" class="btn" data-act="retry">再試一次</button></div>`;
        }
    }

    /* ---------- 營業時間 ---------- */

    // 支援「06:00-12:00」「0600~1200 週日公休」「06:00-11:30 週一、週二公休」
    function parseHours(text) {
        const s = String(text || '');
        const out = { open: null, close: null, off: new Set() };
        const m = s.match(/(\d{1,2})[:：]?(\d{2})\s*[-~～–—至到]\s*(\d{1,2})[:：]?(\d{2})/);
        if (m) {
            out.open = Number(m[1]) * 60 + Number(m[2]);
            out.close = Number(m[3]) * 60 + Number(m[4]);
        }
        const seg = s.match(/((?:[週周星期禮拜]*[日天一二三四五六][、,，和及\s]*)+)(?:公休|休息|休)/);
        if (seg) {
            for (const c of seg[1]) {
                if (c === '日' || c === '天') out.off.add(0);
                else if (WEEK.includes(c)) out.off.add(WEEK.indexOf(c));
            }
        }
        return out;
    }

    const fmtTime = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

    function serializeHours(open, close, off) {
        const parts = [];
        if (open && close) parts.push(`${open}-${close}`);
        if (off.size) parts.push([...off].sort().map((d) => '週' + WEEK[d]).join('、') + '公休');
        return parts.join(' ');
    }

    function statusOf(item, now = new Date()) {
        if (!item.hours) return null;
        const h = parseHours(item.hours);
        if (h.off.has(now.getDay())) return { text: '今天公休', cls: 'closed' };
        if (h.open == null) return null;
        const mins = now.getHours() * 60 + now.getMinutes();
        const overnight = h.close <= h.open;
        const isOpen = overnight ? (mins >= h.open || mins < h.close) : (mins >= h.open && mins < h.close);
        if (isOpen) return { text: `營業中・到 ${fmtTime(h.close)}`, cls: 'open' };
        if (mins < h.open) return { text: `${fmtTime(h.open)} 開門`, cls: 'soon' };
        return { text: '已打烊', cls: 'closed' };
    }

    /* ---------- 篩選與抽籤 ---------- */

    function allTypes() {
        const count = new Map();
        state.items.forEach((it) => it.types.forEach((t) => count.set(t, (count.get(t) || 0) + 1)));
        return [...count.entries()].sort((a, b) => b[1] - a[1]).map((e) => e[0]);
    }

    const visible = () => (state.filter === '全部' ? state.items : state.items.filter((it) => it.types.includes(state.filter)));

    // 抽籤時略過已打烊的店；如果全部都打烊了，就還是從全部裡抽
    function drawPool() {
        const list = visible();
        const usable = list.filter((it) => (statusOf(it) || {}).cls !== 'closed');
        if (usable.length && usable.length < list.length) return { list: usable, skipped: list.length - usable.length };
        return { list, skipped: 0 };
    }

    async function doDraw() {
        if (state.rolling) return;
        const { list, skipped } = drawPool();
        if (!list.length) {
            toast('這個類型還沒有店家');
            return;
        }
        const choices = list.length > 1 ? list.filter((x) => x.id !== state.pick) : list;
        const final = choices[Math.floor(Math.random() * choices.length)];
        const dlg = $('#pick');
        if (!dlg.open) dlg.showModal();

        if (list.length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
            state.rolling = true;
            dlg.innerHTML = `
                <div class="sheet-grip"></div>
                <div class="pick rolling">
                    <p class="pick-label">抽籤中…</p>
                    <h2 class="pick-name" id="roll-name" tabindex="-1" autofocus>&nbsp;</h2>
                    <div class="photo">${icon('dice-5')}</div>
                </div>`;
            const nameEl = $('#roll-name');
            for (let i = 0; i < 14; i++) {
                nameEl.textContent = list[Math.floor(Math.random() * list.length)].name;
                await sleep(40 + i * i);
            }
            state.rolling = false;
        }
        state.pick = final.id;
        if (navigator.vibrate) navigator.vibrate(20);
        dlg.innerHTML = pickHtml(final, list.length, skipped);
    }

    function pickHtml(item, total, skipped) {
        const from = state.filter === '全部' ? '' : `「${state.filter}」`;
        return `
            <div class="sheet-grip"></div>
            <div class="pick reveal">
                <p class="pick-label">今天就吃</p>
                <h2 class="pick-name" tabindex="-1" autofocus>${esc(item.name)}</h2>
                ${photoHtml(item)}
                ${item.note ? `<div class="note"><b>00 愛吃</b>${esc(item.note)}</div>` : ''}
                ${actionsHtml(item)}
                <button type="button" class="btn primary big full" data-act="draw">${icon('arrows-shuffle')}再抽一次</button>
                <p class="pick-hint">從${from} ${total} 家裡抽${skipped ? `，已略過 ${skipped} 家打烊` : ''}</p>
            </div>`;
    }

    /* ---------- 畫面 ---------- */

    function photoHtml(item, { tags = false, status = true, edit = false } = {}) {
        const st = status ? statusOf(item) : null;
        return `
            <div class="photo">
                ${icon('tools-kitchen-2')}
                ${item.img ? `<img src="${esc(item.img)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ''}
                ${tags && item.types.length ? `<div class="tags">${item.types.slice(0, 3).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
                ${st ? `<span class="status ${st.cls}">${esc(st.text)}</span>` : ''}
                ${edit && item.editable ? `<button type="button" class="edit-fab" data-act="edit" data-id="${esc(item.id)}" aria-label="修改 ${esc(item.name)}">${icon('pencil')}</button>` : ''}
            </div>`;
    }

    // 卡片固定顯示四行，沒填的用淡色提示，每張卡片才會一樣整齊
    function infoRows(item) {
        const row = (name, text, empty) => `<div class="meta${empty ? ' muted' : ''}">${icon(name)}<span>${esc(text)}</span></div>`;
        return row('map-pin', item.addr || '沒有地址', !item.addr)
            + row('clock', item.hours || '營業時間還沒填', !item.hours)
            + row('phone', item.phone || '沒有電話', !item.phone)
            + (item.note ? `<div class="note"><b>00 愛吃</b>${esc(item.note)}</div>` : row('heart', '00 愛吃：還沒記錄', true));
    }

    function actionsHtml(item) {
        const tel = item.phone.replace(/[^\d+#]/g, '');
        const map = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${item.name} ${item.addr}`.trim());
        return `
            <div class="actions">
                ${tel ? `<a class="act" href="tel:${esc(tel)}">${icon('phone')}電話</a>` : ''}
                <a class="act" href="${esc(map)}" target="_blank" rel="noopener">${icon('map-2')}地圖</a>
                ${item.link ? `<a class="act primary" href="${esc(item.link)}" target="_blank" rel="noopener">${icon('shopping-bag')}點餐</a>` : ''}
            </div>`;
    }

    function renderBar() {
        $('#draw-btn').disabled = !state.loaded || !drawPool().list.length;
    }

    function renderChips() {
        const types = allTypes();
        if (state.filter !== '全部' && !types.includes(state.filter)) state.filter = '全部';
        const chip = (type, count) => `
            <button type="button" class="chip ${state.filter === type ? 'on' : ''}" role="tab" aria-selected="${state.filter === type}"
                data-act="filter" data-type="${esc(type)}">${esc(type)} <small>${count}</small></button>`;
        $('#chips').innerHTML = chip('全部', state.items.length)
            + types.map((t) => chip(t, state.items.filter((it) => it.types.includes(t)).length)).join('');
    }

    function renderToggle() {
        document.querySelectorAll('.view-toggle button').forEach((b) => {
            const on = b.dataset.view === state.view;
            b.classList.toggle('on', on);
            b.setAttribute('aria-pressed', on);
        });
    }

    function renderList() {
        const list = visible();
        const box = $('#list');
        if (!state.items.length) {
            box.innerHTML = `<div class="state">還沒有店家${isAdmin() ? '<br>按右上角的「新增」加入第一家' : ''}</div>`;
            return;
        }
        if (!list.length) {
            box.innerHTML = '<div class="state">這個類型還沒有店家</div>';
            return;
        }
        if (state.view === 'grid') renderGrid(list);
        else renderSwipe(list);
    }

    function renderSwipe(list) {
        const cards = list.map((item) => `
            <article class="scard" data-id="${esc(item.id)}">
                ${photoHtml(item, { tags: true, edit: true })}
                <div class="body">
                    <h3 class="name">${esc(item.name)}</h3>
                    ${infoRows(item)}
                    ${actionsHtml(item)}
                </div>
            </article>`).join('');

        $('#list').innerHTML = `
            <div class="track" id="track">${cards}</div>
            <div class="pager">
                <button type="button" class="icon-btn" data-act="prev" aria-label="上一家">${icon('chevron-left')}</button>
                ${list.length <= 15 ? `<div class="dots">${list.map(() => '<span class="dot"></span>').join('')}</div>` : ''}
                <span class="count" id="count"></span>
                <button type="button" class="icon-btn" data-act="next" aria-label="下一家">${icon('chevron-right')}</button>
            </div>`;

        const track = $('#track');
        state.swipeIndex = Math.min(state.swipeIndex, list.length - 1);
        if (state.swipeIndex > 0) track.scrollLeft = cardOffset(track, state.swipeIndex);
        track.addEventListener('scroll', () => updatePager(track), { passive: true });
        updatePager(track);
    }

    const swipeCards = (track) => [...track.querySelectorAll('.scard')];

    function cardOffset(track, i) {
        const cards = swipeCards(track);
        return cards[i] ? cards[i].offsetLeft - cards[0].offsetLeft : 0;
    }

    function currentIndex(track) {
        const cards = swipeCards(track);
        if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) return cards.length - 1;
        let best = 0;
        let bestDist = Infinity;
        cards.forEach((c, i) => {
            const d = Math.abs(c.offsetLeft - cards[0].offsetLeft - track.scrollLeft);
            if (d < bestDist) { bestDist = d; best = i; }
        });
        return best;
    }

    function updatePager(track) {
        const i = currentIndex(track);
        const total = swipeCards(track).length;
        state.swipeIndex = i;
        document.querySelectorAll('.dot').forEach((d, j) => d.classList.toggle('on', j === i));
        const count = $('#count');
        if (count) count.textContent = `${i + 1} / ${total}`;
    }

    function goTo(i) {
        const track = $('#track');
        if (!track) return;
        const total = swipeCards(track).length;
        const target = Math.max(0, Math.min(total - 1, i));
        track.scrollTo({ left: cardOffset(track, target), behavior: 'smooth' });
    }

    const GROUPS = [['open', '營業中'], ['soon', '等一下開'], ['none', '營業時間還沒填'], ['closed', '現在沒開']];

    function renderGrid(list) {
        const card = (item) => `
            <div class="gcard" role="button" tabindex="0" data-act="detail" data-id="${esc(item.id)}" aria-label="${esc(item.name)}">
                ${photoHtml(item, { edit: true })}
                <div class="body">
                    <h3 class="name">${esc(item.name)}</h3>
                    ${item.note ? `<div class="like">愛吃 ${esc(item.note)}</div>` : ''}
                </div>
            </div>`;

        // 都還沒填營業時間就不分組
        if (!list.some((it) => it.hours)) {
            $('#list').innerHTML = `<div class="grid">${list.map(card).join('')}</div>`;
            return;
        }
        const groups = { open: [], soon: [], none: [], closed: [] };
        list.forEach((it) => groups[(statusOf(it) || { cls: 'none' }).cls].push(it));
        $('#list').innerHTML = GROUPS.filter(([key]) => groups[key].length).map(([key, label]) => `
            <h3 class="group-title ${key}">${label}・${groups[key].length} 家</h3>
            <div class="grid${key === 'closed' ? ' dim' : ''}">${groups[key].map(card).join('')}</div>`).join('');
    }

    function renderFoot() {
        $('#foot-info').textContent = state.loaded ? `共 ${state.items.length} 家早餐店` : '';
        $('#admin-btn').innerHTML = isAdmin() ? '離開管理模式' : `${icon('lock')} 管理`;
    }

    function renderAll() {
        document.body.classList.toggle('admin', isAdmin());
        renderChips();
        renderBar();
        renderToggle();
        renderList();
        renderFoot();
    }

    function openDetail(id) {
        const item = findItem(id);
        if (!item) return;
        const st = statusOf(item);
        const dlg = $('#detail');
        dlg.innerHTML = `
            <div class="detail">
                <div style="position:relative">
                    <div class="sheet-grip on-photo"></div>
                    <button type="button" class="icon-btn close" data-close aria-label="關閉">${icon('x')}</button>
                    ${photoHtml(item, { tags: true, status: false, edit: true })}
                </div>
                <div class="body">
                    <h2 class="name" tabindex="-1" autofocus>${esc(item.name)}</h2>
                    ${st ? `<span class="status ${st.cls}">${esc(st.text)}</span>` : ''}
                    ${infoRows(item)}
                    ${actionsHtml(item)}
                </div>
            </div>`;
        dlg.showModal();
    }

    function enableSwipeClose(dlg) {
        let startY = null;
        let dy = 0;
        const reset = () => { dlg.style.transform = ''; dlg.style.transition = ''; };
        dlg.addEventListener('touchstart', (e) => {
            if (dlg.scrollTop > 0 || e.touches.length !== 1) { startY = null; return; }
            startY = e.touches[0].clientY;
            dy = 0;
            dlg.style.transition = 'none';
        }, { passive: true });
        dlg.addEventListener('touchmove', (e) => {
            if (startY == null) return;
            dy = e.touches[0].clientY - startY;
            dlg.style.transform = dy > 0 ? `translateY(${dy}px)` : '';
        }, { passive: true });
        dlg.addEventListener('touchend', () => {
            if (startY == null) return;
            startY = null;
            dlg.style.transition = 'transform 0.2s ease-out';
            if (dy > 90) {
                dlg.style.transform = 'translateY(100%)';
                setTimeout(() => dlg.close(), 180);
            } else {
                dlg.style.transform = '';
            }
        });
        dlg.addEventListener('close', reset);
    }

    let toastTimer;
    function toast(msg) {
        const t = $('#toast');
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
    }

    /* ---------- 管理模式 ---------- */

    async function api(action, payload = {}, pw = state.pw) {
        const res = await fetch(API_URL, {
            method: 'POST',
            // 用 text/plain 才不會觸發 CORS 預檢，Apps Script 不支援預檢
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(Object.assign({ action, password: pw }, payload)),
        });
        let data;
        try {
            data = await res.json();
        } catch (e) {
            throw new Error('伺服器沒有正確回應，請稍後再試');
        }
        if (!data.ok) {
            if (action !== 'check' && data.error === '密碼錯誤') logout();
            throw new Error(data.error || '發生錯誤');
        }
        return data;
    }

    function logout() {
        state.pw = '';
        storage.set(PW_KEY, null);
        renderAll();
    }

    function onAdminButton() {
        if (isAdmin()) {
            logout();
            toast('已離開管理模式');
        } else if (!API_URL) {
            toast('還沒設定 Apps Script，請先照部署說明設定');
        } else {
            $('#login-err').textContent = '';
            $('#login-pw').value = '';
            $('#login').showModal();
        }
    }

    async function onLogin(e) {
        e.preventDefault();
        const pw = $('#login-pw').value;
        const btn = e.target.querySelector('[type=submit]');
        btn.disabled = true;
        try {
            await api('check', {}, pw);
            state.pw = pw;
            storage.set(PW_KEY, pw);
            $('#login').close();
            await load();
            toast('已進入管理模式');
        } catch (err) {
            $('#login-err').textContent = err.message;
        } finally {
            btn.disabled = false;
        }
    }

    function openEditor(item) {
        state.editing = item || null;
        state.photo = null;
        state.editTypes = new Set(item ? item.types : (state.filter !== '全部' ? [state.filter] : []));
        const h = parseHours(item ? item.hours : '');
        state.editOff = new Set(h.off);
        // 看不懂的營業時間寫法先保留原文，避免一存檔就不見
        state.rawHours = item && item.hours && h.open == null && !h.off.size ? item.hours : '';

        $('#edit-title').textContent = item ? '修改店家' : '新增店家';
        $('#f-name').value = item ? item.name : '';
        $('#f-phone').value = item ? item.phone : '';
        $('#f-addr').value = item ? item.addr : '';
        $('#f-link').value = item ? item.link : '';
        $('#f-note').value = item ? item.note : '';
        $('#f-img').value = item ? item.img : '';
        $('#f-open').value = h.open != null ? fmtTime(h.open) : '';
        $('#f-close').value = h.close != null ? fmtTime(h.close) : '';
        $('#f-newtype').value = '';
        $('#f-file').value = '';
        $('#edit-err').textContent = '';
        document.querySelectorAll('#edit-form .invalid').forEach((x) => x.classList.remove('invalid'));
        $('#del-btn').hidden = !item;

        setPreview(item ? item.img : '');
        renderTypeChips();
        renderDays();
        $('#editor').showModal();
        $('#editor').scrollTop = 0;
    }

    function setPreview(src) {
        const img = $('#f-preview');
        img.hidden = !src;
        if (src) img.src = src;
        else img.removeAttribute('src');
        $('.photo-pick-label').innerHTML = `${icon('camera')}${src ? '換照片' : '從相簿選照片'}`;
    }

    function renderTypeChips() {
        const types = [...new Set([...allTypes(), ...state.editTypes])];
        $('#f-types').innerHTML = types.length
            ? types.map((t) => `<button type="button" class="chip ${state.editTypes.has(t) ? 'on' : ''}" data-type="${esc(t)}">${esc(t)}</button>`).join('')
            : '<span class="sub">還沒有類型，可以在下面新增</span>';
    }

    function renderDays() {
        $('#f-off').innerHTML = [...WEEK].map((d, i) =>
            `<button type="button" class="${state.editOff.has(i) ? 'on' : ''}" data-day="${i}" aria-pressed="${state.editOff.has(i)}" aria-label="週${d}公休">${d}</button>`).join('');
    }

    function addType() {
        const input = $('#f-newtype');
        const t = input.value.trim().replace(/[、,，/\s]+/g, '');
        if (!t) return;
        state.editTypes.add(t);
        input.value = '';
        renderTypeChips();
    }

    function resizeImage(file, max = 1200) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1, max / Math.max(img.width, img.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                URL.revokeObjectURL(url);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
                resolve({ mime: 'image/jpeg', base64: dataUrl.split(',')[1], dataUrl });
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('讀不到這張照片，換一張試試'));
            };
            img.src = url;
        });
    }

    async function onPickFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        try {
            state.photo = await resizeImage(file);
            $('#f-img').value = '';
            setPreview(state.photo.dataUrl);
        } catch (err) {
            $('#edit-err').textContent = err.message;
        }
    }

    async function onSave(e) {
        e.preventDefault();
        const val = (sel) => $(sel).value.trim();
        const errors = [];
        const mark = (sel, bad) => $(sel).classList.toggle('invalid', bad);

        mark('#f-name', !val('#f-name'));
        if (!val('#f-name')) errors.push('請填店名');
        ['#f-link', '#f-img'].forEach((sel) => {
            const bad = !!val(sel) && !/^https?:\/\//i.test(val(sel));
            mark(sel, bad);
            if (bad) errors.push('網址要以 http:// 或 https:// 開頭');
        });
        const open = val('#f-open');
        const close = val('#f-close');
        if (!!open !== !!close) errors.push('開門和打烊時間要一起填');
        if (errors.length) {
            $('#edit-err').textContent = [...new Set(errors)].join('；');
            return;
        }

        const hours = serializeHours(open, close, state.editOff) || state.rawHours;
        const item = {
            id: state.editing ? state.editing.id : '',
            name: val('#f-name'),
            phone: val('#f-phone'),
            addr: val('#f-addr'),
            link: val('#f-link'),
            note: val('#f-note'),
            type: [...state.editTypes].join('、'),
            hours,
            img: state.photo ? '' : val('#f-img'),
            clearImg: !state.photo && !val('#f-img'),
        };

        const btn = $('#save-btn');
        btn.disabled = true;
        btn.textContent = state.photo ? '上傳照片中…' : '儲存中…';
        $('#edit-err').textContent = '';
        try {
            const photo = state.photo ? { mime: state.photo.mime, base64: state.photo.base64 } : null;
            const data = await api('save', { item, photo });
            const saved = normalize(data.item, 0);
            const i = state.items.findIndex((x) => x.id === saved.id);
            if (i >= 0) state.items[i] = saved;
            else state.items.push(saved);
            writeCache();
            $('#editor').close();
            if (i < 0) {
                state.filter = '全部';
                state.swipeIndex = state.items.length - 1;
            }
            renderAll();
            toast(i >= 0 ? '已儲存' : `已新增「${saved.name}」`);
        } catch (err) {
            $('#edit-err').textContent = err.message;
            if (!isAdmin()) $('#editor').close();
        } finally {
            btn.disabled = false;
            btn.textContent = '儲存';
        }
    }

    async function onDelete() {
        const item = state.editing;
        if (!item) return;
        if (!confirm(`確定要刪除「${item.name}」嗎？\n刪錯的話，可以到 Google 試算表的「版本記錄」救回來。`)) return;
        const btn = $('#del-btn');
        btn.disabled = true;
        try {
            await api('delete', { id: item.id });
            state.items = state.items.filter((x) => x.id !== item.id);
            if (state.pick === item.id) state.pick = null;
            writeCache();
            $('#editor').close();
            renderAll();
            toast(`已刪除「${item.name}」`);
        } catch (err) {
            $('#edit-err').textContent = err.message;
        } finally {
            btn.disabled = false;
        }
    }

    /* ---------- 事件 ---------- */

    function bind() {
        $('.view-toggle [data-view="swipe"]').innerHTML = icon('carousel-horizontal');
        $('.view-toggle [data-view="grid"]').innerHTML = icon('layout-grid');
        $('#add-btn').innerHTML = `${icon('plus')}新增`;
        $('#draw-btn').innerHTML = `${icon('dice-5')}幫我抽一家`;
        enableSwipeClose($('#pick'));
        enableSwipeClose($('#detail'));
        $('#editor [data-close]').innerHTML = icon('x');

        document.addEventListener('click', (e) => {
            const closer = e.target.closest('[data-close]');
            if (closer) { closer.closest('dialog').close(); return; }
            // 點彈窗外的灰色區域就關閉
            if (e.target instanceof HTMLDialogElement) { e.target.close(); return; }

            const el = e.target.closest('[data-act]');
            if (!el) return;
            const id = el.dataset.id;
            switch (el.dataset.act) {
                case 'draw': doDraw(); break;
                case 'detail': openDetail(id); break;
                case 'edit':
                    if ($('#detail').open) $('#detail').close();
                    openEditor(findItem(id));
                    break;
                case 'prev': goTo(state.swipeIndex - 1); break;
                case 'next': goTo(state.swipeIndex + 1); break;
                case 'filter':
                    state.filter = el.dataset.type;
                    state.swipeIndex = 0;
                    renderAll();
                    break;
                case 'retry': load(); break;
                default: break;
            }
        });

        document.addEventListener('keydown', (e) => {
            const card = e.target.closest && e.target.closest('.gcard');
            if (card && e.target === card && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                openDetail(card.dataset.id);
            }
        });

        // 照片載入失敗就留下預設圖示
        document.addEventListener('error', (e) => {
            if (e.target.tagName === 'IMG' && e.target.closest('.photo')) e.target.remove();
        }, true);

        $('.view-toggle').addEventListener('click', (e) => {
            const b = e.target.closest('[data-view]');
            if (!b || b.dataset.view === state.view) return;
            state.view = b.dataset.view;
            storage.set(VIEW_KEY, state.view);
            renderToggle();
            renderList();
        });

        $('#admin-btn').addEventListener('click', onAdminButton);
        $('#add-btn').addEventListener('click', () => openEditor(null));
        $('#login-form').addEventListener('submit', onLogin);
        $('#edit-form').addEventListener('submit', onSave);
        $('#del-btn').addEventListener('click', onDelete);
        $('#f-file').addEventListener('change', onPickFile);
        $('#f-img').addEventListener('input', () => {
            state.photo = null;
            const v = $('#f-img').value.trim();
            setPreview(/^https?:\/\//i.test(v) ? v : '');
        });
        $('#f-addtype').addEventListener('click', addType);
        $('#f-newtype').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); addType(); }
        });
        $('#f-types').addEventListener('click', (e) => {
            const b = e.target.closest('[data-type]');
            if (!b) return;
            const t = b.dataset.type;
            if (state.editTypes.has(t)) state.editTypes.delete(t);
            else state.editTypes.add(t);
            renderTypeChips();
        });
        $('#f-off').addEventListener('click', (e) => {
            const b = e.target.closest('[data-day]');
            if (!b) return;
            const d = Number(b.dataset.day);
            if (state.editOff.has(d)) state.editOff.delete(d);
            else state.editOff.add(d);
            renderDays();
        });

        // 從背景切回來時，更新營業狀態，超過一分鐘就順便抓新資料
        document.addEventListener('visibilitychange', () => {
            if (document.hidden || !state.loaded) return;
            if (Date.now() - state.lastFetch > 60 * 1000) load();
            else renderAll();
        });
    }

    bind();
    renderAll();
    load();
})();
