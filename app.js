(() => {
    'use strict';

    const CONFIG = window.BREAKFAST_CONFIG || {};
    const API_URL = String(CONFIG.API_URL || '').trim();
    const CACHE_KEY = 'breakfast-cache-v2';
    const VIEW_KEY = 'breakfast-view';
    const PW_KEY = 'breakfast-admin';
    const WEEK = '日一二三四五六';
    const EAT_KEY = 'breakfast-eaten';
    const DAY_MS = 24 * 3600 * 1000;
    const THEME = window.BreakfastTheme;
    const LOG_KEY = 'breakfast-log';
    const PASS_KEY = 'breakfast-passport';
    const METHOD_KEY = 'breakfast-method';
    const SHAKE_KEY = 'breakfast-shake';
    const FORTUNE_KEY = 'breakfast-fortune-day';

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
        'copy': '<path d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z"/><path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1"/>',
        'check': '<path d="M5 12l5 5l10 -10"/>',
        'sun': '<path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7"/>',
        'moon': '<path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"/>',
        'brightness-half': '<path d="M12 9a3 3 0 0 0 0 6v-6z"/><path d="M6 6h3.5l2.5 -2.5l2.5 2.5h3.5v3.5l2.5 2.5l-2.5 2.5v3.5h-3.5l-2.5 2.5l-2.5 -2.5h-3.5v-3.5l-2.5 -2.5l2.5 -2.5z"/>',
        'egg': '<path d="M19 14.083c0 4.154 -2.966 6.74 -7 6.917c-4.2 0 -7 -2.763 -7 -6.917c0 -5.538 3.5 -11.09 7 -11.083c3.5 .007 7 5.545 7 11.083z"/>',
        'burger': '<path d="M4 15h16a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z"/><path d="M12 4c3.783 0 6.953 2.133 7.786 5h-15.572c.833 -2.867 4.003 -5 7.786 -5z"/><path d="M5 12h14"/>',
        'bread': '<path d="M18 4a3 3 0 0 1 2 5.235v8.765a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-8.764a3 3 0 0 1 1.824 -5.231h12.176v-.005z"/>',
        'coffee': '<path d="M3 14c.83 .642 2.077 1.017 3.5 1c1.423 .017 2.67 -.358 3.5 -1c.83 -.642 2.077 -1.017 3.5 -1c1.423 -.017 2.67 .358 3.5 1"/><path d="M8 3a2.4 2.4 0 0 0 -1 2a2.4 2.4 0 0 0 1 2"/><path d="M12 3a2.4 2.4 0 0 0 -1 2a2.4 2.4 0 0 0 1 2"/><path d="M3 10h14v5a6 6 0 0 1 -6 6h-2a6 6 0 0 1 -6 -6v-5z"/><path d="M16.746 16.726a3 3 0 1 0 .252 -5.555"/>',
        'soup': '<path d="M4 11h16a1 1 0 0 1 1 1v.5c0 1.5 -2.517 5.573 -4 6.5v1a1 1 0 0 1 -1 1h-8a1 1 0 0 1 -1 -1v-1c-1.687 -1.054 -4 -5 -4 -6.5v-.5a1 1 0 0 1 1 -1z"/><path d="M12 4a2.4 2.4 0 0 0 -1 2a2.4 2.4 0 0 0 1 2"/><path d="M16 4a2.4 2.4 0 0 0 -1 2a2.4 2.4 0 0 0 1 2"/><path d="M8 4a2.4 2.4 0 0 0 -1 2a2.4 2.4 0 0 0 1 2"/>',
        'bowl': '<path d="M4 8h16a1 1 0 0 1 1 1v.5c0 1.5 -2.517 5.573 -4 6.5v1a1 1 0 0 1 -1 1h-8a1 1 0 0 1 -1 -1v-1c-1.687 -1.054 -4 -5 -4 -6.5v-.5a1 1 0 0 1 1 -1z"/>',
        'building-store': '<path d="M3 21l18 0"/><path d="M3 7v1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1h-18l2 -4h14l2 4"/><path d="M5 21l0 -10.15"/><path d="M19 21l0 -10.15"/><path d="M9 21v-4a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v4"/>',
        'notebook': '<path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-11a1 1 0 0 1 -1 -1v-14a1 1 0 0 1 1 -1m3 0v18"/><path d="M13 8l2 0"/><path d="M13 12l2 0"/>',
        'trophy': '<path d="M8 21l8 0"/><path d="M12 17l0 4"/><path d="M7 4l10 0"/><path d="M17 4v8a5 5 0 0 1 -10 0v-8"/><path d="M5 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M19 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>',
        'settings': '<path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z"/><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"/>',
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
        eaten: readEaten(),   // { 店家 id: 最後一次吃的時間 }，只存在這支手機
        log: readLog(),       // 週曆用：[[店家 id, 時間], …]
        passport: readPassport(), // 護照用：{ 店家 id: 第一次吃的時間 }
        quip: false,          // 荷包蛋正在說悄悄話
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

    // 試算表的「類型」沒填時，依店名（和愛吃的品項）猜；有填的以試算表為準
    const TYPE_RULES = [
        ['蛋餅', /蛋餅/, true],
        ['漢堡', /漢堡|堡|麥味登|拉亞|摩斯|麥當勞/, true],
        ['飯糰', /飯糰/, true],
        ['中式', /豆漿|小籠包|饅頭|燒餅|包子/, true],
        ['早午餐', /早午餐|brunch/i, true],
        ['超商', /7-?11|7-?ELEVEN|全家|萊爾富|OK超商/i, false],
        ['飲料', /咖啡|星巴|茶|飲|冰/, false],
    ];

    function guessTypes(name, note) {
        return TYPE_RULES
            .filter(([, re, withNote]) => re.test(withNote ? `${name} ${note}` : name))
            .map(([type]) => type);
    }

    function normalize(raw, i) {
        const text = (v) => String(v == null ? '' : v).trim();
        const http = (v) => (/^https?:\/\//i.test(text(v)) ? text(v) : '');
        const id = text(raw.id);
        const name = text(raw.name);
        const note = text(raw.note);
        const explicit = text(raw.type).split(/[、,，/\s]+/).filter(Boolean);
        return {
            id: id || `row-${i}`,
            editable: !!id,
            name,
            img: http(raw.img),
            phone: text(raw.phone),
            addr: text(raw.addr),
            link: http(raw.link),
            note,
            types: explicit.length ? explicit : guessTypes(name, note),
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
            if (!Array.isArray(list) || !list.length) return null;
            // 舊版快取沒有自動猜的類型，讀出來時補上
            return list.map((it) => (it.types && it.types.length ? it : Object.assign({}, it, { types: guessTypes(it.name, it.note) })));
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

    // 找下一個有營業的日子，例如「明早 06:00 開門」「週三 06:00 開門」
    function nextOpenText(h, now) {
        for (let d = 1; d <= 7; d++) {
            const day = (now.getDay() + d) % 7;
            if (h.off.has(day)) continue;
            const t = fmtTime(h.open);
            if (d === 1) return `${h.open < 600 ? '明早' : '明天'} ${t} 開門`;
            return `週${WEEK[day]} ${t} 開門`;
        }
        return '已打烊';
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
        return { text: nextOpenText(h, now), cls: 'closed' };
    }

    /* ---------- 最近吃過（只記在這支手機） ---------- */

    function readEaten() {
        try {
            const raw = JSON.parse(storage.get(EAT_KEY) || '{}') || {};
            const now = Date.now();
            const out = {};
            Object.keys(raw).forEach((id) => { if (now - raw[id] < 90 * DAY_MS) out[id] = raw[id]; });
            return out;
        } catch (e) {
            return {};
        }
    }

    // 幾天前吃的（以日曆天算：今天 0、昨天 1），沒有紀錄回傳 null
    function eatenAgo(id) {
        const t = state.eaten[id];
        if (!t) return null;
        const a = new Date(t);
        const b = new Date();
        a.setHours(0, 0, 0, 0);
        b.setHours(0, 0, 0, 0);
        return Math.round((b - a) / DAY_MS);
    }

    function eatenText(id) {
        const d = eatenAgo(id);
        return d == null ? '' : d === 0 ? '今天' : d === 1 ? '昨天' : `${d} 天前`;
    }

    const recentlyEaten = (id) => { const d = eatenAgo(id); return d != null && d <= 1; };

    function readLog() {
        try {
            const raw = storage.get(LOG_KEY);
            if (raw == null) {
                // 第一次：把之前「最近吃過」的紀錄帶過來
                const eaten = readEaten();
                return Object.keys(eaten).map((id) => [id, eaten[id]]);
            }
            const now = Date.now();
            return (JSON.parse(raw) || []).filter((e) => Array.isArray(e) && now - e[1] < 400 * DAY_MS);
        } catch (e) {
            return [];
        }
    }

    function readPassport() {
        try {
            const raw = storage.get(PASS_KEY);
            return raw == null ? Object.assign({}, readEaten()) : (JSON.parse(raw) || {});
        } catch (e) {
            return {};
        }
    }

    function markEaten(id) {
        const now = Date.now();
        state.eaten[id] = now;
        storage.set(EAT_KEY, JSON.stringify(state.eaten));
        // 週曆：同一家同一天只記一次
        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);
        if (!state.log.some(([i, t]) => i === id && t >= dayStart.getTime())) {
            state.log.push([id, now]);
            state.log = state.log.filter(([, t]) => now - t < 400 * DAY_MS).slice(-300);
            storage.set(LOG_KEY, JSON.stringify(state.log));
        }
        // 護照：第一次吃才蓋章
        if (!state.passport[id]) {
            state.passport[id] = now;
            storage.set(PASS_KEY, JSON.stringify(state.passport));
        }
        const key = CSS.escape(id);
        document.querySelectorAll(`[data-last="${key}"]`).forEach((el) => { el.textContent = '上次吃：今天'; });
        document.querySelectorAll(`[data-pill="${key}"]`).forEach((el) => { el.textContent = '今天吃過'; });
        renderBar();
        const item = findItem(id);
        // 彈出視窗開著的時候，提示訊息會被蓋住，就不顯示
        if (item && !document.querySelector('dialog[open]')) toast(`已記下：今天吃「${item.name}」`);
    }

    /* ---------- 今日運勢、早餐週曆 ---------- */

    const hash = (str) => {
        let h = 2166136261;
        for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
        return h >>> 0;
    };
    const dayKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const WEEK_MON = '一二三四五六日';
    const FORTUNE_TEXT = { 5: '今天超順！想吃什麼都對', 4: '運氣不錯，照直覺選就好', 3: '平平順順，吃飽最重要', 2: '低調一點，吃熟悉的最安心' };
    const TYPE_ICON = { 蛋餅: 'egg', 漢堡: 'burger', 早午餐: 'bread', 飯糰: 'bowl', 中式: 'soup', 超商: 'building-store', 飲料: 'coffee' };
    const typeIcon = (item) => { const t = item.types.find((x) => TYPE_ICON[x]); return t ? TYPE_ICON[t] : 'tools-kitchen-2'; };

    // 同一天結果固定：用日期當種子，所以一天內重開幾次都一樣
    function fortune(now = new Date()) {
        if (!state.items.length) return null;
        const seed = hash(`fortune-${dayKey(now)}`);
        const stars = [2, 3, 3, 4, 4, 5][seed % 6];
        const types = [...new Set(state.items.flatMap((it) => it.types))].sort((a, b) => a.localeCompare(b, 'zh-Hant'));
        const type = types.length ? types[(seed >>> 3) % types.length] : '';
        const pool = (type ? state.items.filter((it) => it.types.includes(type)) : state.items.slice()).sort((a, b) => (a.id < b.id ? -1 : 1));
        return { stars, type, shop: pool[(seed >>> 7) % pool.length] };
    }

    // 這週（週一開始）每一天的 00:00
    function weekDays(now = new Date()) {
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const monday = new Date(today);
        monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d;
        });
    }

    function logsOn(day) {
        const start = day.getTime();
        const end = new Date(day);
        end.setDate(end.getDate() + 1);
        return state.log.filter(([, t]) => t >= start && t < end.getTime()).sort((a, b) => a[1] - b[1]);
    }

    /* ---------- 篩選與抽籤 ---------- */

    function allTypes() {
        const count = new Map();
        state.items.forEach((it) => it.types.forEach((t) => count.set(t, (count.get(t) || 0) + 1)));
        return [...count.entries()].sort((a, b) => b[1] - a[1]).map((e) => e[0]);
    }

    const visible = () => (state.filter === '全部' ? state.items : state.items.filter((it) => it.types.includes(state.filter)));

    const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 抽籤時略過已打烊、最近 2 天吃過的店；略過後一家都不剩，就不略過
    function drawPool() {
        const list = visible();
        const open = list.filter((it) => (statusOf(it) || {}).cls !== 'closed');
        let pool = open.length ? open : list;
        const closed = open.length ? list.length - open.length : 0;
        const fresh = pool.filter((it) => !recentlyEaten(it.id));
        const eaten = fresh.length ? pool.length - fresh.length : 0;
        if (fresh.length) pool = fresh;
        return { list: pool, closed, eaten };
    }

    async function toasterAnimation(dlg) {
        dlg.innerHTML = `
            <div class="sheet-grip"></div>
            <div class="pick rolling">
                <p class="pick-label">吐司烤好了嗎…</p>
                <div class="toaster" aria-hidden="true">
                    <div class="toast-slice"><i class="toast-egg"></i></div>
                    <div class="toaster-body"><i class="toaster-slot"></i></div>
                    <div class="toaster-base"></div>
                    <div class="toaster-lever"></div>
                </div>
                <h2 class="pick-name" tabindex="-1" autofocus>&nbsp;</h2>
            </div>`;
        const toaster = dlg.querySelector('.toaster');
        await sleep(300);
        toaster.classList.add('press');
        await sleep(350);
        toaster.classList.add('pop');
        await sleep(950);
    }

    // 抽籤方式：吐司機、扭蛋機、每次隨機
    const getMethod = () => { const v = storage.get(METHOD_KEY); return v === 'gacha' || v === 'random' ? v : 'toaster'; };
    const pickMethod = () => { const m = getMethod(); return m === 'random' ? (Math.random() < 0.5 ? 'toaster' : 'gacha') : m; };
    const drawAnimation = (dlg, method) => (method === 'gacha' ? gachaAnimation(dlg) : toasterAnimation(dlg));

    async function gachaAnimation(dlg) {
        dlg.innerHTML = `
            <div class="sheet-grip"></div>
            <div class="pick rolling">
                <p class="pick-label">轉轉看會掉出什麼…</p>
                <div class="gacha" aria-hidden="true">
                    <div class="g-dome"><i></i><i></i><i></i><i></i><i></i></div>
                    <div class="g-base"><i class="g-knob"></i></div>
                    <div class="g-chute"></div>
                    <div class="g-capsule"><i class="g-top"></i><i class="g-bot"></i></div>
                </div>
                <h2 class="pick-name" tabindex="-1" autofocus>&nbsp;</h2>
            </div>`;
        const gacha = dlg.querySelector('.gacha');
        await sleep(300);
        gacha.classList.add('spin');
        await sleep(700);
        gacha.classList.add('drop');
        await sleep(600);
        gacha.classList.add('open');
        await sleep(450);
    }

    function celebrate(dlg) {
        if (reduceMotion()) return;
        // 震動只有 Android 有感，iPhone 的 Safari 不支援
        if (navigator.vibrate) navigator.vibrate(30);
        const box = document.createElement('div');
        box.className = 'confetti';
        box.setAttribute('aria-hidden', 'true');
        const colors = ['#c93232', '#ffb62e', '#378add', '#1d9e75', '#7f77dd', '#ff8fa3'];
        for (let i = 0; i < 26; i++) {
            const piece = document.createElement('i');
            piece.style.cssText = `left:${Math.round(10 + Math.random() * 80)}%;background:${colors[i % colors.length]};`
                + `--dx:${Math.round(Math.random() * 120 - 60)}px;--rot:${Math.round(Math.random() * 720 - 360)}deg;`
                + `animation-delay:${(Math.random() * 0.25).toFixed(2)}s;animation-duration:${(0.9 + Math.random() * 0.6).toFixed(2)}s`;
            box.appendChild(piece);
        }
        dlg.appendChild(box);
        setTimeout(() => box.remove(), 1800);
    }

    async function doDraw() {
        if (state.rolling) return;
        const pool = drawPool();
        const list = pool.list;
        if (!list.length) {
            toast('這個類型還沒有店家');
            return;
        }
        const choices = list.length > 1 ? list.filter((x) => x.id !== state.pick) : list;
        const final = choices[Math.floor(Math.random() * choices.length)];
        const dlg = $('#pick');
        if (!dlg.open) dlg.showModal();

        if (list.length > 1 && !reduceMotion()) {
            state.rolling = true;
            await drawAnimation(dlg, pickMethod());
            state.rolling = false;
            if (!dlg.open) return; // 烤的時候被關掉了
        }
        state.pick = final.id;
        dlg.innerHTML = pickHtml(final, pool);
        celebrate(dlg);
    }

    // 抽到之後，最大的按鈕是「點餐」；沒有點餐網址就換成打電話
    function pickActions(item) {
        const tel = telOf(item);
        const map = mapUrl(item);
        const eat = `data-eat="${esc(item.id)}"`;
        const main = item.link
            ? `<a class="act primary big" ${eat} href="${esc(item.link)}" target="_blank" rel="noopener">${icon('shopping-bag')}線上點餐</a>`
            : tel
                ? `<a class="act primary big" ${eat} href="tel:${esc(tel)}">${icon('phone')}打電話點餐</a>`
                : `<a class="act primary big" href="${esc(map)}" target="_blank" rel="noopener">${icon('map-2')}導航過去</a>`;
        const others = [
            item.link && tel ? `<a class="act" ${eat} href="tel:${esc(tel)}">${icon('phone')}電話</a>` : '',
            item.link || tel ? `<a class="act" href="${esc(map)}" target="_blank" rel="noopener">${icon('map-2')}地圖</a>` : '',
            `<button type="button" class="act outline" data-act="draw">${icon('arrows-shuffle')}換一家</button>`,
        ].join('');
        return `${main}<div class="actions">${others}</div>`;
    }

    function pickHtml(item, pool) {
        const from = state.filter === '全部' ? '' : `「${state.filter}」`;
        const skipped = [pool.closed ? `${pool.closed} 家打烊` : '', pool.eaten ? `${pool.eaten} 家最近吃過` : ''].filter(Boolean).join('、');
        const ago = eatenText(item.id);
        return `
            <div class="sheet-grip"></div>
            <div class="pick reveal">
                <p class="pick-label">今天就吃</p>
                <h2 class="pick-name" tabindex="-1" autofocus>${esc(item.name)}</h2>
                <p class="last-eaten" data-last="${esc(item.id)}">${ago ? `上次吃：${ago}` : ''}</p>
                ${photoHtml(item, { w: 900 })}
                ${noteHtml(item)}
                ${pickActions(item)}
                <p class="pick-hint">從${from} ${pool.list.length} 家裡抽${skipped ? `（略過 ${skipped}）` : ''}</p>
            </div>`;
    }

    /* ---------- 畫面 ---------- */

    // 雲端硬碟的照片可以指定大小（網址結尾的 =w1000），依畫面需要的大小載入，比較省流量
    const imgSrc = (url, w) => String(url).replace(/^(https:\/\/lh3\.googleusercontent\.com\/d\/[^=]+)=w\d+$/, `$1=w${w}`);

    function photoHtml(item, { tags = false, status = true, edit = false, pill = false, w = 640 } = {}) {
        const st = status ? statusOf(item) : null;
        const ago = pill ? eatenAgo(item.id) : null;
        return `
            <div class="photo">
                ${icon('tools-kitchen-2')}
                ${item.img ? `<img src="${esc(imgSrc(item.img, w))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : ''}
                ${tags && item.types.length ? `<div class="tags">${item.types.slice(0, 3).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
                ${st ? `<span class="status ${st.cls}">${esc(st.text)}</span>` : ''}
                ${ago != null && ago <= 6 ? `<span class="last-pill" data-pill="${esc(item.id)}">${eatenText(item.id)}吃過</span>` : ''}
                ${edit && item.editable ? `<button type="button" class="edit-fab" data-act="edit" data-id="${esc(item.id)}" aria-label="修改 ${esc(item.name)}">${icon('pencil')}</button>` : ''}
            </div>`;
    }

    // 00 愛吃的品項，右邊有一鍵複製（貼到 LINE 點餐很方便）
    function noteHtml(item) {
        if (!item.note) return '';
        return `<div class="note"><span class="note-text"><b>00 愛吃</b>${esc(item.note)}</span>`
            + `<button type="button" class="copy" data-act="copy" data-id="${esc(item.id)}" aria-label="複製愛吃的品項">${icon('copy')}</button></div>`;
    }

    // 卡片固定顯示四行，沒填的用淡色提示，每張卡片才會一樣整齊
    function infoRows(item) {
        const row = (name, text, empty) => `<div class="meta${empty ? ' muted' : ''}">${icon(name)}<span>${esc(text)}</span></div>`;
        return row('map-pin', item.addr || '沒有地址', !item.addr)
            + row('clock', item.hours || '營業時間還沒填', !item.hours)
            + row('phone', item.phone || '沒有電話', !item.phone)
            + (item.note ? noteHtml(item) : row('heart', '00 愛吃：還沒記錄', true));
    }

    const telOf = (item) => item.phone.replace(/[^\d+#]/g, '');
    const mapUrl = (item) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${item.name} ${item.addr}`.trim());

    function actionsHtml(item) {
        const tel = telOf(item);
        const eat = `data-eat="${esc(item.id)}"`;
        return `
            <div class="actions">
                ${tel ? `<a class="act" ${eat} href="tel:${esc(tel)}">${icon('phone')}電話</a>` : ''}
                <a class="act" href="${esc(mapUrl(item))}" target="_blank" rel="noopener">${icon('map-2')}地圖</a>
                ${item.link ? `<a class="act primary" ${eat} href="${esc(item.link)}" target="_blank" rel="noopener">${icon('shopping-bag')}點餐</a>` : ''}
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

    // 營業中的排前面，沒開的排最後；同一種狀態維持試算表原本的順序
    const STATUS_ORDER = { open: 0, soon: 1, none: 2, closed: 3 };
    function sortByStatus(list) {
        if (!list.some((it) => it.hours)) return list;
        const rank = (it) => STATUS_ORDER[(statusOf(it) || { cls: 'none' }).cls];
        return list.map((it, i) => ({ it, i, r: rank(it) })).sort((a, b) => a.r - b.r || a.i - b.i).map((x) => x.it);
    }

    function renderSwipe(source) {
        const list = sortByStatus(source);
        const cards = list.map((item) => `
            <article class="scard" data-id="${esc(item.id)}">
                ${photoHtml(item, { tags: true, edit: true, pill: true })}
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
                ${photoHtml(item, { edit: true, w: 480 })}
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
        $('#mine-btn').innerHTML = `${icon('notebook')} 我的早餐`;
        $('#settings-btn').innerHTML = `${icon('settings')} 設定`;
    }

    /* ---------- 搖一搖抽籤 ---------- */

    const shakeCapable = () => 'DeviceMotionEvent' in window && matchMedia('(pointer: coarse)').matches;
    const isShakeOn = () => storage.get(SHAKE_KEY) === '1';
    let lastMotion = null;
    let spikes = [];
    let lastShake = 0;

    // 1 秒內晃 3 次以上才算搖，走路或拿起手機不會觸發；抽籤面板、設定面板開著的時候也不觸發
    function onMotion(e) {
        const a = e.accelerationIncludingGravity;
        if (!a || a.x == null) return;
        const cur = [a.x, a.y, a.z];
        if (lastMotion) {
            const now = Date.now();
            const delta = Math.abs(cur[0] - lastMotion[0]) + Math.abs(cur[1] - lastMotion[1]) + Math.abs(cur[2] - lastMotion[2]);
            if (delta > 28) spikes.push(now);
            spikes = spikes.filter((t) => now - t < 1000);
            if (spikes.length >= 3 && now - lastShake > 2500) {
                spikes = [];
                lastShake = now;
                if (!document.hidden && state.loaded && !state.rolling && !document.querySelector('dialog[open]')) doDraw();
            }
        }
        lastMotion = cur;
    }

    function startShake() {
        stopShake();
        window.addEventListener('devicemotion', onMotion);
    }

    function stopShake() {
        window.removeEventListener('devicemotion', onMotion);
        lastMotion = null;
        spikes = [];
    }

    // iPhone 要在「點一下」的當下請求動作感應權限，所以這裡不能先 await 別的東西
    async function setShake(on) {
        if (!on) {
            storage.set(SHAKE_KEY, null);
            stopShake();
            return true;
        }
        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
            try {
                if ((await DeviceMotionEvent.requestPermission()) !== 'granted') return false;
            } catch (e) {
                return false;
            }
        }
        storage.set(SHAKE_KEY, '1');
        startShake();
        return true;
    }

    async function toggleShake() {
        const on = isShakeOn();
        if (!on && !shakeCapable()) {
            $('#shake-note').textContent = '這台裝置沒有動作感應，用手機才能使用。';
            return;
        }
        const ok = await setShake(!on);
        renderSettings();
        if (!ok) $('#shake-note').textContent = '沒有取得動作感應的權限。iPhone 可以到「設定 > Safari > 動作與方向」開啟後再試。';
    }

    /* ---------- 我的早餐：今日運勢、早餐週曆、早餐護照 ---------- */

    const STAR = '<path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z"/>';
    const starsHtml = (n) => Array.from({ length: 5 }, (_, i) => `<svg class="star${i < n ? ' on' : ''}" viewBox="0 0 24 24" aria-hidden="true">${STAR}</svg>`).join('');

    function mineHtml() {
        const now = new Date();
        const f = fortune(now);
        const days = weekDays(now);
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const weekIds = new Set();
        const strip = days.map((day, i) => {
            const logs = logsOn(day);
            logs.forEach(([id]) => { if (findItem(id)) weekIds.add(id); });
            const first = logs.map(([id]) => findItem(id)).find(Boolean);
            return `<div class="wk-day${day.getTime() === todayStart.getTime() ? ' today' : ''}">
                <span class="wk-lbl">${WEEK_MON[i]}</span>
                <span class="wk-dot${first ? ' done' : ''}">${first ? icon(typeIcon(first)) : ''}</span>
                <small>${logs.length > 1 ? `+${logs.length - 1}` : ''}</small></div>`;
        }).join('');
        const rows = days.map((day, i) => {
            const names = logsOn(day).map(([id]) => findItem(id)).filter(Boolean).map((it) => esc(it.name));
            return names.length ? `<li><b>週${WEEK_MON[i]}</b>${names.join('、')}</li>` : '';
        }).join('');

        const total = state.items.length;
        const stamped = state.items.filter((it) => state.passport[it.id]).length;
        const stamps = state.items.map((it) => {
            const on = !!state.passport[it.id];
            return `<button type="button" class="stamp${on ? ' on' : ''}" data-act="detail" data-id="${esc(it.id)}" aria-label="${esc(it.name)}${on ? '，已吃過' : '，還沒吃過'}">
                <span class="stamp-dot">${icon(on ? 'check' : typeIcon(it))}</span>
                <span class="stamp-name">${esc(it.name.split(/\s/)[0])}</span></button>`;
        }).join('');

        return `
            <div class="sheet-head">
                <h2 tabindex="-1" autofocus>我的早餐</h2>
                <button type="button" class="icon-btn" data-close aria-label="關閉">${icon('x')}</button>
            </div>
            <div class="pad mine">
                ${f ? `<section class="fortune">
                    <div class="fortune-head"><span>今日運勢</span><span class="stars" role="img" aria-label="${f.stars} 顆星">${starsHtml(f.stars)}</span></div>
                    <p>${FORTUNE_TEXT[f.stars]}</p>
                    ${f.type ? `<div class="lucky"><span>幸運品項</span><b>${esc(f.type)}</b></div>` : ''}
                    <div class="lucky"><span>幸運店家</span><b>${esc(f.shop.name)}</b></div>
                    <button type="button" class="btn" data-act="detail" data-id="${esc(f.shop.id)}">看看這家</button>
                </section>` : ''}
                <section>
                    <h3>早餐週曆<small>${weekIds.size ? `這週吃了 ${weekIds.size} 家` : '這週還沒記錄'}</small></h3>
                    <div class="wk">${strip}</div>
                    ${rows ? `<ul class="wk-list">${rows}</ul>` : '<p class="hint">按了「電話」或「點餐」，就會記在這裡。</p>'}
                </section>
                <section>
                    <h3>早餐護照<small>已吃過 ${stamped} / ${total} 家</small></h3>
                    ${total >= 3 && stamped === total ? `<div class="complete">${icon('trophy')}集滿了！${total} 家早餐店都吃過一輪</div>` : ''}
                    <div class="stamps">${stamps}</div>
                </section>
                <p class="hint">這些紀錄只存在這支手機，換手機或清除瀏覽資料就會消失。</p>
            </div>`;
    }

    function openMine() {
        const dlg = $('#mine');
        dlg.innerHTML = mineHtml();
        dlg.showModal();
        dlg.scrollTop = 0;
    }

    /* ---------- 設定：日夜模式、主題皮膚、抽籤方式、搖一搖 ---------- */

    const SKIN_INFO = {
        egg: { name: '荷包蛋', l: ['#fff9f5', '#c93232'], d: ['#17181a', '#ff6b6b'] },
        matcha: { name: '抹茶', l: ['#f6fbf5', '#2f7a45'], d: ['#151a16', '#7bc68d'] },
        milktea: { name: '奶茶', l: ['#fbf6f1', '#8a5a3c'], d: ['#1a1714', '#d9a77c'] },
        blueberry: { name: '藍莓', l: ['#f8f7ff', '#5a4fc7'], d: ['#16151d', '#a69bff'] },
    };

    function settingsHtml() {
        const mode = THEME.get();
        const skin = THEME.getSkin();
        const method = getMethod();
        const shakeOn = isShakeOn();
        const seg = (act, current, options) => `<div class="seg" role="group">${options.map(([v, label]) =>
            `<button type="button" class="${v === current ? 'on' : ''}" data-act="${act}" data-v="${v}" aria-pressed="${v === current}">${label}</button>`).join('')}</div>`;
        const shakeNote = shakeOn
            ? '已開啟：在主畫面搖一搖手機就會抽。搖不動的話，關掉再開一次。'
            : shakeCapable()
                ? '開啟後，在主畫面搖一搖手機就會抽籤。iPhone 第一次會問你要不要允許動作感應。'
                : '這台裝置沒有動作感應，用手機才能使用。';
        return `
            <div class="sheet-head">
                <h2 tabindex="-1" autofocus>設定</h2>
                <button type="button" class="icon-btn" data-close aria-label="關閉">${icon('x')}</button>
            </div>
            <div class="pad settings">
                <section>
                    <h3>日夜模式</h3>
                    ${seg('set-mode', mode, [['auto', '自動'], ['day', '白天'], ['night', '夜間']])}
                    <p class="hint">自動：18:00 到隔天 05:00 用夜間。首頁右上角的按鈕也可以快速切換。</p>
                </section>
                <section>
                    <h3>主題皮膚</h3>
                    <div class="skins">${THEME.SKINS.map((k) => {
                        const info = SKIN_INFO[k];
                        return `<button type="button" class="skin${k === skin ? ' on' : ''}" data-act="set-skin" data-v="${k}" aria-pressed="${k === skin}">
                            <span class="skin-sw"><span style="background:${info.l[0]}"><i style="background:${info.l[1]}"></i></span><span style="background:${info.d[0]}"><i style="background:${info.d[1]}"></i></span></span>
                            <span class="skin-name">${info.name}</span></button>`;
                    }).join('')}</div>
                </section>
                <section>
                    <h3>抽籤方式</h3>
                    ${seg('set-method', method, [['toaster', '吐司機'], ['gacha', '扭蛋機'], ['random', '每次隨機']])}
                </section>
                <section>
                    <h3>搖一搖</h3>
                    <button type="button" class="row-switch" role="switch" aria-checked="${shakeOn}" data-act="toggle-shake"><span>搖一搖抽籤</span><i class="switch"></i></button>
                    <p class="hint" id="shake-note">${shakeNote}</p>
                </section>
            </div>`;
    }

    function renderSettings() {
        $('#settings').innerHTML = settingsHtml();
    }

    function openSettings() {
        renderSettings();
        const dlg = $('#settings');
        dlg.showModal();
        dlg.scrollTop = 0;
    }

    /* ---------- 荷包蛋夥伴與日夜模式 ---------- */

    function greeting(now = new Date()) {
        const h = now.getHours();
        const weekend = now.getDay() === 0 || now.getDay() === 6;
        const hasHours = state.loaded && state.items.some((it) => it.hours);
        const open = state.items.filter((it) => (statusOf(it, now) || {}).cls === 'open').length;
        if (h < 5) return '還這麼早？再睡一下，早餐店還沒開喔';
        if (h < 10) return weekend ? (h < 8 ? '週末還這麼早起？今天想吃什麼？' : '週末慢慢來，今天想吃什麼？') : '早安！今天想吃什麼？';
        if (h < 14) {
            if (!hasHours) return '早餐時間快結束了，要快一點喔';
            if (!open) return '早餐店差不多都收了，改吃午餐吧';
            return weekend ? `睡過頭了嗎？還有 ${open} 家開著` : `早餐時間快結束了，還有 ${open} 家開著`;
        }
        if (h < 18) return '下午了，早餐店都收攤囉';
        return '晚安，先看看明天早上吃什麼吧';
    }

    function renderHero() {
        const hero = $('#hero');
        if (!hero) return;
        const now = new Date();
        const dark = document.documentElement.dataset.theme === 'dark';
        const h = now.getHours() + now.getMinutes() / 60;
        // 太陽（或月亮）依時間在天空劃一道弧線；手動切到跟時間不合的模式時，停在中間
        let p;
        if (dark) p = (h >= 18 || h < 5) ? (h >= 18 ? h - 18 : h + 6) / 11 : 0.5;
        else p = (h >= 5 && h < 18) ? (h - 5) / 13 : 0.5;
        hero.classList.toggle('night', dark);
        const orb = $('#orb');
        orb.style.left = `${Math.round(8 + p * 70)}%`;
        orb.style.top = `${Math.round(6 + 34 * Math.pow(2 * p - 1, 2))}px`;
        if (!state.quip) $('#bubble').textContent = greeting(now);
    }

    const QUIPS = ['別戳啦，我會破掉的', '肚子餓了嗎？按下面的按鈕吧', '我是半熟的喔', '要加蛋嗎？', '今天的運氣不錯喔'];
    let quipTimer;
    function pokeEgg() {
        const egg = $('#egg');
        egg.classList.remove('wiggle');
        void egg.offsetWidth;
        egg.classList.add('wiggle');
        state.quip = true;
        // 每天第一次戳，先說今日運勢；之後才是隨機的悄悄話
        const f = storage.get(FORTUNE_KEY) !== dayKey() ? fortune() : null;
        let ms = 2800;
        if (f && f.shop) {
            storage.set(FORTUNE_KEY, dayKey());
            $('#bubble').textContent = `今日運勢 ${'★'.repeat(f.stars)}${'☆'.repeat(5 - f.stars)}　幸運店家：${f.shop.name}`;
            ms = 4800;
        } else {
            $('#bubble').textContent = QUIPS[Math.floor(Math.random() * QUIPS.length)];
        }
        clearTimeout(quipTimer);
        quipTimer = setTimeout(() => { state.quip = false; renderHero(); }, ms);
    }

    const MODE_TEXT = { auto: '自動：18:00 後轉夜間', day: '固定白天', night: '固定夜間' };

    function renderTheme() {
        const mode = THEME.get();
        const btn = $('#theme-btn');
        btn.innerHTML = icon(mode === 'auto' ? 'brightness-half' : mode === 'day' ? 'sun' : 'moon');
        btn.setAttribute('aria-label', `切換日夜模式，目前是${MODE_TEXT[mode]}`);
    }

    function refreshTheme() {
        THEME.apply(THEME.get());
        renderTheme();
        renderHero();
    }

    function cycleTheme() {
        const order = ['auto', 'day', 'night'];
        const next = order[(order.indexOf(THEME.get()) + 1) % order.length];
        const resolved = THEME.set(next);
        renderTheme();
        renderHero();
        toast(next === 'auto' ? `${MODE_TEXT.auto}（現在是${resolved === 'dark' ? '夜間' : '白天'}）` : MODE_TEXT[next]);
    }

    async function copyNote(btn, id) {
        const item = findItem(id);
        if (!item || !item.note) return;
        let ok = false;
        try {
            await navigator.clipboard.writeText(item.note);
            ok = true;
        } catch (e) {
            // 少數環境不能用剪貼簿 API，改用舊方法
            const ta = document.createElement('textarea');
            ta.value = item.note;
            ta.style.cssText = 'position:fixed;opacity:0';
            document.body.appendChild(ta);
            ta.select();
            try { ok = document.execCommand('copy'); } catch (err) { /* 忽略 */ }
            ta.remove();
        }
        // 在彈出視窗裡，提示訊息會被蓋住，所以直接讓按鈕變成打勾
        btn.innerHTML = icon(ok ? 'check' : 'x');
        setTimeout(() => { btn.innerHTML = icon('copy'); }, 1500);
        if (!document.querySelector('dialog[open]')) toast(ok ? '已複製，可以貼到 LINE 了' : '複製失敗，請手動選取');
    }

    function renderAll() {
        renderTheme();
        renderHero();
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
        const ago = eatenText(id);
        const dlg = $('#detail');
        dlg.innerHTML = `
            <div class="detail">
                <div style="position:relative">
                    <div class="sheet-grip on-photo"></div>
                    <button type="button" class="icon-btn close" data-close aria-label="關閉">${icon('x')}</button>
                    ${photoHtml(item, { tags: true, status: false, edit: true, pill: true, w: 900 })}
                </div>
                <div class="body">
                    <h2 class="name" tabindex="-1" autofocus>${esc(item.name)}</h2>
                    ${st ? `<span class="status ${st.cls}">${esc(st.text)}</span>` : ''}
                    <p class="last-eaten" data-last="${esc(id)}">${ago ? `上次吃：${ago}` : ''}</p>
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
        enableSwipeClose($('#mine'));
        enableSwipeClose($('#settings'));
        if (isShakeOn()) startShake();
        $('#editor [data-close]').innerHTML = icon('x');

        document.addEventListener('click', (e) => {
            const closer = e.target.closest('[data-close]');
            if (closer) { closer.closest('dialog').close(); return; }
            // 點彈窗外的灰色區域就關閉
            if (e.target instanceof HTMLDialogElement) { e.target.close(); return; }

            // 按了電話或點餐，就記成今天吃這家（照常跳轉，不攔截）
            const eat = e.target.closest('[data-eat]');
            if (eat) markEaten(eat.dataset.eat);

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
                case 'copy': copyNote(el, id); break;
                case 'theme': cycleTheme(); break;
                case 'egg': pokeEgg(); break;
                case 'mine': openMine(); break;
                case 'settings': openSettings(); break;
                case 'set-mode': THEME.set(el.dataset.v); refreshTheme(); renderSettings(); break;
                case 'set-skin': THEME.setSkin(el.dataset.v); refreshTheme(); renderSettings(); break;
                case 'set-method':
                    storage.set(METHOD_KEY, el.dataset.v === 'toaster' ? null : el.dataset.v);
                    renderSettings();
                    break;
                case 'toggle-shake': toggleShake(); break;
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
            if (document.hidden) return;
            refreshTheme();
            if (!state.loaded) return;
            if (Date.now() - state.lastFetch > 60 * 1000) load();
            else renderAll();
        });

        // 開著不動的時候，每分鐘更新一次日夜模式、問候語和抽籤範圍（不動卡片，免得看到一半跳掉）
        setInterval(() => {
            if (document.hidden) return;
            refreshTheme();
            renderBar();
        }, 60 * 1000);
    }

    bind();
    renderAll();
    load();
})();
