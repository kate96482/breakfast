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
    const PIN_KEY = 'breakfast-pin';
    const CACHE_TIME_KEY = 'breakfast-cache-time';
    const LIB = window.BreakfastLib;
    const REMINDER_HOUR = 7; // 「加到行事曆」的提醒時間
    const GEO_KEY = 'breakfast-geo';       // 地址 → 座標（查過的存起來，不用每次重查）
    const HOME_KEY = 'breakfast-home';     // 出發地址
    const WALK_KEY = 'breakfast-walk';     // 只抽步行幾分鐘內的店（沒有就是不限）
    const WX_KEY = 'breakfast-weather';
    const NOTE_KEY = 'breakfast-note';     // 管理者給 00 的今日留言
    const DEFAULT_POINT = { lat: 25.05, lon: 121.61 }; // 沒設出發地址時，天氣用南港

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
        'bookmark': '<path d="M18 7v14l-6 -4l-6 4v-14a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4z"/>',
        'share-2': '<path d="M8 9h-1a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-8a2 2 0 0 0 -2 -2h-1"/><path d="M12 14v-11"/><path d="M9 6l3 -3l3 3"/>',
        'calendar-plus': '<path d="M12.5 21h-6.5a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v5"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M4 11h16"/><path d="M16 19h6"/><path d="M19 16v6"/>',
        'walk': '<path d="M13 4m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M7 21l3 -4"/><path d="M16 21l-2 -4l-3 -3l1 -6"/><path d="M6 12l2 -3l4 -1l3 3l3 1"/>',
        'message': '<path d="M8 9h8"/><path d="M8 13h6"/><path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z"/>',
        'trash': '<path d="M4 7l16 0"/><path d="M10 11l0 6"/><path d="M14 11l0 6"/><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"/><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"/>',
        'download': '<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"/><path d="M7 11l5 5l5 -5"/><path d="M12 4l0 12"/>',
        'info-circle': '<path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/>',
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
        geo: readGeo(),       // { 地址: { lat, lon, level, t } 或 { fail: true, t } }
        weather: null,        // { now, today, tomorrow }，抓不到就是 null
        note: readNote(),     // 今天的留言 { date, text }
        notes: [],            // 管理者看到的留言列表
        lineIdx: 0,           // 戳荷包蛋時，輪到第幾句
        cal: null,            // 政府行事曆（國定假日），沒抓到就是 null
        calYears: new Set(),  // 行事曆有哪幾年
        reportOffset: 0,      // 月報看哪個月：0 這個月、-1 上個月…
        override: null,       // 手動切換「抽現在／抽明天」，只在這個時段有效
        updatedAt: 0,         // 目前畫面上的資料是什麼時候抓的
        stale: false,         // 最近一次更新失敗（例如沒網路），畫面上是舊資料
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
            setNote(data.note);
            return data.items.map(normalize).filter((x) => x.name);
        }
        const res = await fetch(CONFIG.CSV_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return csvToItems(await res.text());
    }

    function readNote() {
        try {
            const n = JSON.parse(storage.get(NOTE_KEY) || 'null');
            return n && n.date && n.text ? n : null;
        } catch (e) {
            return null;
        }
    }

    // 後端只會回傳「今天」的留言；後端還沒更新時沒有這個欄位，就當作沒有留言
    function setNote(n) {
        state.note = n && n.text ? { date: String(n.date), text: String(n.text).slice(0, 80) } : null;
        storage.set(NOTE_KEY, state.note ? JSON.stringify(state.note) : null);
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

    const writeCache = () => {
        storage.set(CACHE_KEY, JSON.stringify(state.items));
        storage.set(CACHE_TIME_KEY, String(Date.now()));
    };

    // 先顯示上次的資料，再到背景抓最新的
    async function load() {
        const cached = !state.loaded && readCache();
        if (cached) {
            state.items = cached;
            state.loaded = true;
            state.updatedAt = Number(storage.get(CACHE_TIME_KEY)) || 0;
            renderAll();
            runGeoQueue();
        }
        try {
            const items = await fetchItems();
            state.items = items;
            state.loaded = true;
            state.lastFetch = Date.now();
            state.updatedAt = state.lastFetch;
            state.stale = false;
            writeCache();
            renderAll();
            runGeoQueue();
        } catch (err) {
            console.error(err);
            state.stale = true;
            renderFoot();
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
    const isoDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

    // 抽籤的對象：14:00 以前抽「現在」營業的店，14:00 以後抽「明天早餐」（晚上抽，通常是在決定明天吃什麼）
    // 結果面板裡可以手動切換；換到下一個時段（過了 14:00 或隔天）就恢復自動
    const TOMORROW_FROM = 14;
    const autoMode = () => (new Date().getHours() >= TOMORROW_FROM ? 'tomorrow' : 'today');
    const effectiveMode = () => (state.override && state.override.base === autoMode() ? state.override.mode : autoMode());
    const tomorrowDate = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d; };
    const restsOn = (item, dow) => parseHours(item.hours).off.has(dow);

    // 明天的營業時間，例如「明天 06:00–13:00 營業」
    function tomorrowStatus(item) {
        if (!item.hours) return null;
        const h = parseHours(item.hours);
        if (h.off.has(tomorrowDate().getDay())) return { text: '明天公休', cls: 'closed' };
        if (h.open == null) return { text: `明天 ${item.hours}`, cls: 'soon' };
        return { text: `明天 ${fmtTime(h.open)}–${fmtTime(h.close)} 營業`, cls: 'soon' };
    }

    /* ---------- 出發地址與步行距離 ---------- */

    function readGeo() {
        try { return JSON.parse(storage.get(GEO_KEY) || '{}') || {}; } catch (e) { return {}; }
    }
    const homeAddr = () => (storage.get(HOME_KEY) || String(CONFIG.HOME_ADDRESS || '')).trim();
    const maxWalk = () => { const n = Number(storage.get(WALK_KEY)); return n === 10 || n === 15 || n === 20 ? n : 0; };
    const geoOf = (addr) => { const g = addr && state.geo[addr]; return g && !g.fail ? g : null; };
    const homePoint = () => geoOf(homeAddr());

    // 出發點到這家店的直線距離（公尺）；還沒查到座標就是 null
    function distanceOf(item) {
        const a = homePoint();
        const b = geoOf(item.addr);
        return a && b ? LIB.haversine(a.lat, a.lon, b.lat, b.lon) : null;
    }

    // 卡片上顯示的步行資訊；null 代表什麼都不顯示（還沒設地址、還在查）
    function walkInfo(item) {
        if (!homeAddr() || !homePoint()) return null;
        const m = distanceOf(item);
        if (m != null) return { text: LIB.formatWalk(m), muted: false };
        const g = item.addr && state.geo[item.addr];
        if (!item.addr) return { text: '沒有地址，算不出步行距離', muted: true };
        if (g && g.fail) return { text: '地址查不到，算不出步行距離', muted: true };
        return null;
    }

    function walkHtml(item) {
        if (!homeAddr()) return '';
        const w = walkInfo(item);
        return `<div class="walk${w && w.muted ? ' muted' : ''}" data-dist="${esc(item.id)}"${w ? '' : ' hidden'}>${icon('walk')}<span>${w ? esc(w.text) : ''}</span></div>`;
    }

    // 座標一筆一筆查到，就地更新畫面上的距離，不重畫整個清單
    function updateDistances() {
        document.querySelectorAll('[data-dist]').forEach((el) => {
            const item = findItem(el.dataset.dist);
            const w = item && walkInfo(item);
            el.hidden = !w;
            el.classList.toggle('muted', !!(w && w.muted));
            const span = el.querySelector('span');
            if (span) span.textContent = w ? w.text : '';
        });
        renderBar();
    }

    function sortByDistance(list) {
        if (!homePoint()) return list;
        const far = 1e9;
        return list.map((it, i) => ({ it, i, d: distanceOf(it) })).sort((a, b) => ((a.d == null ? far : a.d) - (b.d == null ? far : b.d)) || a.i - b.i).map((x) => x.it);
    }

    // 查不到的地址，隔一天再試（可能只是那時沒網路）
    const needsGeo = (addr) => { const g = state.geo[addr]; return !g || (g.fail && Date.now() - g.t > DAY_MS); };
    let geoRunning = false;

    // 在背景一筆一筆查（出發地址先查）。Nominatim 規定每秒最多一次，所以每筆之間會等一下；查過的存在手機裡，之後不會重查
    async function runGeoQueue() {
        if (geoRunning || !homeAddr() || navigator.onLine === false) return;
        geoRunning = true;
        let did = false;
        try {
            for (;;) {
                const addrs = [homeAddr(), ...state.items.map((it) => it.addr)].filter(Boolean);
                const todo = addrs.filter((a, i) => addrs.indexOf(a) === i && needsGeo(a));
                if (!todo.length) break;
                const addr = todo[0];
                const r = await LIB.geocode(addr);
                if (!addrs.includes(addr)) continue; // 查的時候地址被改掉了
                state.geo[addr] = r ? { lat: r.lat, lon: r.lon, level: r.level, t: Date.now() } : { fail: true, t: Date.now() };
                storage.set(GEO_KEY, JSON.stringify(state.geo));
                did = true;
                updateDistances();
                refreshHomeNote();
                if (r && addr === homeAddr()) loadWeather();
                await sleep(1100);
            }
        } finally {
            geoRunning = false;
        }
        // 全部查完才重新排序，而且只在使用者還停在第一張卡的時候，免得看到一半卡片跳掉
        if (did && (state.view === 'grid' || state.swipeIndex === 0) && !document.querySelector('dialog[open]')) renderList();
    }

    function saveHome() {
        const input = $('#home-addr');
        if (!input) return;
        const addr = input.value.trim();
        storage.set(HOME_KEY, addr || null);
        if (addr && state.geo[addr] && state.geo[addr].fail) { delete state.geo[addr]; storage.set(GEO_KEY, JSON.stringify(state.geo)); } // 重新試一次
        renderList();
        updateDistances();
        const dlg = $('#settings');
        const top = dlg.scrollTop;
        renderSettings(); // 下面的說明文字會跟著有沒有地址改變
        dlg.scrollTop = top;
        loadWeather();
        runGeoQueue();
        toast(addr ? '已儲存，正在查位置' : '已清除出發地址');
    }

    function geoSummary() {
        const home = homeAddr();
        if (!home) return '填上你常出發的地址（家、公司、學校都可以），卡片就會顯示走路幾分鐘。地址只存在這支手機；查座標時會把地址送到 OpenStreetMap 的免費服務，不會附上其他資料。';
        const g = state.geo[home];
        if (!g) return navigator.onLine === false ? '目前沒有網路，連上網路後會自動查位置。' : '正在查位置…';
        if (g.fail) return '找不到這個地址。請確認有「縣市、區、路名、門牌號碼」，例如：台北市南港區忠孝東路六段 1 號。';
        const shops = state.items.filter((it) => it.addr);
        const ok = shops.filter((it) => geoOf(it.addr)).length;
        const failed = shops.filter((it) => state.geo[it.addr] && state.geo[it.addr].fail).length;
        const pending = shops.length - ok - failed;
        const precise = g.level === 'street' ? '只找到路名附近，距離會有些誤差' : g.level === 'lane' ? '找到巷弄附近' : '已找到';
        return `出發點：${precise}。店家位置 ${ok} / ${shops.length} 家${pending ? '（還在查）' : ''}${failed ? `，${failed} 家的地址查不到` : ''}。`;
    }

    const refreshHomeNote = () => { const el = $('#home-note'); if (el) el.textContent = geoSummary(); };

    /* ---------- 天氣（Open-Meteo） ---------- */

    // 用出發地址的位置（沒設就用南港）；半小時內不重抓，抓不到就安靜地不顯示
    async function loadWeather() {
        const p = homePoint() || DEFAULT_POINT;
        let cached = null;
        try { cached = JSON.parse(storage.get(WX_KEY) || 'null'); } catch (e) { cached = null; }
        const usable = cached && cached.day === dayKey() && Math.abs(cached.lat - p.lat) < 0.01 && Math.abs(cached.lon - p.lon) < 0.01 && cached.data;
        if (usable) {
            if (!state.weather) { state.weather = cached.data; renderHero(); }
            if (Date.now() - cached.t < 30 * 60 * 1000) return;
        }
        try {
            const data = await LIB.fetchWeather(p.lat, p.lon);
            state.weather = data;
            storage.set(WX_KEY, JSON.stringify({ t: Date.now(), day: dayKey(), lat: p.lat, lon: p.lon, data }));
            renderHero();
        } catch (e) { /* 沒網路或服務暫時不能用：不顯示天氣就好 */ }
    }

    // 抽「現在」：略過已打烊的；抽「明天」：略過明天公休的；都略過最近 2 天吃過的。略過後一家都不剩，就不略過
    function drawPool(mode = effectiveMode()) {
        const list = visible();
        let pool;
        let closed = 0;
        let rest = 0;
        if (mode === 'tomorrow') {
            const dow = tomorrowDate().getDay();
            const work = list.filter((it) => !restsOn(it, dow));
            pool = work.length ? work : list;
            rest = work.length ? list.length - work.length : 0;
        } else {
            const open = list.filter((it) => (statusOf(it) || {}).cls !== 'closed');
            pool = open.length ? open : list;
            closed = open.length ? list.length - open.length : 0;
        }
        // 只抽走得到的店：還不知道距離的店（位置還沒查到）不會被排除
        let far = 0;
        const limit = maxWalk();
        if (limit && homePoint()) {
            const near = pool.filter((it) => { const m = distanceOf(it); return m == null || LIB.walkMinutes(m) <= limit; });
            if (near.length) { far = pool.length - near.length; pool = near; }
        }
        const fresh = pool.filter((it) => !recentlyEaten(it.id));
        const eaten = fresh.length ? pool.length - fresh.length : 0;
        if (fresh.length) pool = fresh;
        return { list: pool, closed, rest, far, eaten, mode };
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

    // 抽籤方式：吐司機、扭蛋機、翻牌、刮刮卡、每次隨機
    const METHODS = ['toaster', 'gacha', 'flip', 'scratch'];
    const getMethod = () => { const v = storage.get(METHOD_KEY); return v === 'random' || METHODS.includes(v) ? v : 'toaster'; };
    const pickMethod = () => { const m = getMethod(); return m === 'random' ? METHODS[Math.floor(Math.random() * METHODS.length)] : m; };
    const shuffled = (arr) => arr.map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);

    // 動畫播完（或自己操作完）回傳抽到的店；中途把面板關掉就回傳 null
    async function drawAnimation(dlg, method, { list, final }) {
        if (method === 'flip') return flipAnimation(dlg, list, final);
        if (method === 'scratch') return scratchAnimation(dlg, final);
        await (method === 'gacha' ? gachaAnimation(dlg) : toasterAnimation(dlg));
        return final;
    }

    // 等使用者操作；面板被關掉就算了，不會一直卡著
    function waitForUser(dlg, setup) {
        return new Promise((resolve) => {
            let done = false;
            const finish = (value) => {
                if (done) return;
                done = true;
                dlg.removeEventListener('close', onClose);
                resolve(value);
            };
            const onClose = () => finish(null);
            dlg.addEventListener('close', onClose);
            setup(finish);
        });
    }

    // 翻牌：發 3 張牌（3 家不同的店），點哪一張就是哪一家
    function flipAnimation(dlg, list, final) {
        const others = shuffled(list.filter((x) => x.id !== final.id)).slice(0, 2);
        const cards = shuffled([final, ...others]);
        dlg.innerHTML = `
            <div class="sheet-grip"></div>
            <div class="pick rolling">
                <p class="pick-label">點一張牌，看看是哪一家</p>
                <div class="flip-row">${cards.map((it, i) => `
                    <button type="button" class="flip-card" data-i="${i}" aria-label="第 ${i + 1} 張牌，還沒翻開">
                        <span class="flip-inner">
                            <span class="flip-face flip-back">${icon('egg')}</span>
                            <span class="flip-face flip-front"><b>${esc(it.name)}</b></span>
                        </span>
                    </button>`).join('')}</div>
                <h2 class="pick-name" tabindex="-1" autofocus>&nbsp;</h2>
            </div>`;
        return waitForUser(dlg, (finish) => {
            let chosen = false;
            dlg.querySelector('.flip-row').addEventListener('click', async (e) => {
                const btn = e.target.closest('.flip-card');
                if (!btn || chosen) return;
                chosen = true;
                dlg.querySelectorAll('.flip-card').forEach((c) => { if (c !== btn) c.classList.add('dim'); });
                btn.classList.add('flipped');
                btn.setAttribute('aria-label', `翻開了：${cards[Number(btn.dataset.i)].name}`);
                await sleep(900);
                finish(cards[Number(btn.dataset.i)]);
            });
        });
    }

    // 刮刮卡：用手指刮掉銀色的那層，刮開約一半就揭曉
    function scratchAnimation(dlg, final) {
        dlg.innerHTML = `
            <div class="sheet-grip"></div>
            <div class="pick rolling">
                <p class="pick-label">用手指刮開，看看吃什麼</p>
                <div class="scratch">
                    <div class="scratch-under">${icon(typeIcon(final))}<b>${esc(final.name)}</b></div>
                    <canvas class="scratch-cover" aria-hidden="true"></canvas>
                </div>
                <button type="button" class="link-btn" data-scratch-skip>直接揭曉</button>
                <h2 class="pick-name" tabindex="-1" autofocus>&nbsp;</h2>
            </div>`;
        return waitForUser(dlg, (finish) => {
            const box = dlg.querySelector('.scratch');
            const cv = dlg.querySelector('.scratch-cover');
            const dpr = Math.min(window.devicePixelRatio || 1, 3);
            const w = box.clientWidth;
            const h = box.clientHeight;
            cv.width = Math.round(w * dpr);
            cv.height = Math.round(h * dpr);
            const g = cv.getContext('2d');
            g.scale(dpr, dpr);
            const grad = g.createLinearGradient(0, 0, w, h);
            grad.addColorStop(0, '#b9bfc6');
            grad.addColorStop(0.5, '#e4e7ea');
            grad.addColorStop(1, '#aeb4bb');
            g.fillStyle = grad;
            g.fillRect(0, 0, w, h);
            g.strokeStyle = 'rgba(255,255,255,0.35)';
            g.lineWidth = 6;
            for (let x = -h; x < w; x += 22) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + h, 0); g.stroke(); }
            g.fillStyle = '#4a4f55';
            g.font = 'bold 22px system-ui, -apple-system, "PingFang TC", sans-serif';
            g.textAlign = 'center';
            g.textBaseline = 'middle';
            g.fillText('刮開看看', w / 2, h / 2);

            const R = 24; // 刮開的筆刷半徑
            const CELL = 12;
            const cols = Math.ceil(w / CELL);
            const rows = Math.ceil(h / CELL);
            const seen = new Uint8Array(cols * rows);
            let marked = 0;
            let last = null;
            let finished = false;
            const reveal = () => {
                if (finished) return;
                finished = true;
                cv.classList.add('gone');
                setTimeout(() => finish(final), reduceMotion() ? 0 : 450);
            };
            const scratchAt = (x, y) => {
                g.globalCompositeOperation = 'destination-out';
                g.strokeStyle = '#000'; // 要完全不透明才刮得乾淨
                g.lineCap = 'round';
                g.lineWidth = R * 2;
                g.beginPath();
                g.moveTo(last ? last[0] : x, last ? last[1] : y);
                g.lineTo(x, y);
                g.stroke();
                last = [x, y];
                for (let cy = Math.max(0, Math.floor((y - R) / CELL)); cy <= Math.min(rows - 1, Math.floor((y + R) / CELL)); cy++) {
                    for (let cx = Math.max(0, Math.floor((x - R) / CELL)); cx <= Math.min(cols - 1, Math.floor((x + R) / CELL)); cx++) {
                        const dx = cx * CELL + CELL / 2 - x;
                        const dy = cy * CELL + CELL / 2 - y;
                        if (dx * dx + dy * dy <= R * R && !seen[cy * cols + cx]) { seen[cy * cols + cx] = 1; marked++; }
                    }
                }
                if (marked / (cols * rows) > 0.45) reveal();
            };
            const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
            let down = false;
            cv.addEventListener('pointerdown', (e) => { down = true; last = null; cv.setPointerCapture(e.pointerId); scratchAt(...pos(e)); });
            cv.addEventListener('pointermove', (e) => { if (down) scratchAt(...pos(e)); });
            const up = () => { down = false; last = null; };
            cv.addEventListener('pointerup', up);
            cv.addEventListener('pointercancel', up);
            // 在刮的時候，不要讓面板跟著被往下拉或整頁捲動
            ['touchstart', 'touchmove'].forEach((t) => cv.addEventListener(t, (e) => { e.stopPropagation(); }, { passive: true }));
            dlg.querySelector('[data-scratch-skip]').addEventListener('click', reveal);
        });
    }

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
        let final = choices[Math.floor(Math.random() * choices.length)];
        const dlg = $('#pick');
        if (!dlg.open) dlg.showModal();

        if (list.length > 1 && !reduceMotion()) {
            state.rolling = true;
            const chosen = await drawAnimation(dlg, pickMethod(), { list: choices.length > 1 ? choices : list, final });
            state.rolling = false;
            if (!chosen || !dlg.open) return; // 過程中被關掉了
            final = chosen; // 翻牌是使用者自己點的那一張
        }
        state.pick = final.id;
        dlg.innerHTML = pickHtml(final, pool);
        celebrate(dlg);
    }

    // 點餐入口：有網址用線上點餐，沒有就打電話，再沒有就導航
    function orderLink(item, extra, labels) {
        const tel = telOf(item);
        const eat = `data-eat="${esc(item.id)}"`;
        if (item.link) return `<a class="act primary ${extra}" ${eat} href="${esc(item.link)}" target="_blank" rel="noopener">${icon('shopping-bag')}${labels[0]}</a>`;
        if (tel) return `<a class="act primary ${extra}" ${eat} href="tel:${esc(tel)}">${icon('phone')}${labels[1]}</a>`;
        return `<a class="act primary ${extra}" href="${esc(mapUrl(item))}" target="_blank" rel="noopener">${icon('map-2')}${labels[2]}</a>`;
    }

    // 抽到之後，最大的按鈕是「點餐」；沒有點餐網址就換成打電話
    function pickActions(item) {
        const tel = telOf(item);
        const map = mapUrl(item);
        const eat = `data-eat="${esc(item.id)}"`;
        const main = orderLink(item, 'big', ['線上點餐', '打電話點餐', '導航過去']);
        const others = [
            item.link && tel ? `<a class="act" ${eat} href="tel:${esc(tel)}">${icon('phone')}電話</a>` : '',
            item.link || tel ? `<a class="act" href="${esc(map)}" target="_blank" rel="noopener">${icon('map-2')}地圖</a>` : '',
            `<button type="button" class="act outline" data-act="draw">${icon('arrows-shuffle')}換一家</button>`,
        ].join('');
        return `${main}<div class="actions">${others}</div>`;
    }

    /* ---------- 記住明天要吃的店 ---------- */

    function readPin() {
        try {
            const p = JSON.parse(storage.get(PIN_KEY) || 'null');
            if (!p) return null;
            if (!p.id || !p.day || Date.now() > p.until) { storage.set(PIN_KEY, null); return null; } // 過了那天就清掉
            return p;
        } catch (e) {
            return null;
        }
    }

    function clearPin() {
        storage.set(PIN_KEY, null);
        renderPin();
        renderHero();
    }

    function togglePin(id) {
        const day = tomorrowDate();
        const cur = readPin();
        if (cur && cur.id === id && cur.day === dayKey(day)) {
            storage.set(PIN_KEY, null);
        } else {
            const end = new Date(day);
            end.setHours(23, 59, 59, 999);
            storage.set(PIN_KEY, JSON.stringify({ id, day: dayKey(day), until: end.getTime() }));
        }
        renderPin();
        renderHero();
    }

    // 今天要吃的那家（昨晚記住的）
    function todaysPin() {
        const pin = readPin();
        if (!pin || pin.day !== dayKey()) return null;
        const item = findItem(pin.id);
        return item ? { pin, item } : null;
    }

    function pinButtonHtml(id) {
        const pin = readPin();
        const on = !!pin && pin.id === id && pin.day === dayKey(tomorrowDate());
        return `<button type="button" class="act pin${on ? ' on' : ''}" data-act="pin" data-id="${esc(id)}" aria-pressed="${on}">${icon('bookmark')}${on ? '已記住，明早顯示在首頁（點一下取消）' : '記住這家，明早顯示在首頁'}</button>`;
    }

    // 首頁最上面：晚上記住之後，顯示一條「明天早餐」；隔天早上變成完整的卡片，直接點餐
    function renderPin() {
        const el = $('#pin');
        const pin = state.loaded ? readPin() : null;
        const item = pin && findItem(pin.id);
        if (!item) {
            el.hidden = true;
            el.innerHTML = '';
            return;
        }
        el.hidden = false;
        if (pin.day === dayKey()) {
            const st = statusOf(item);
            el.innerHTML = `
                <div class="pin-card">
                    ${photoHtml(item, { status: false, w: 480 })}
                    <div class="pin-body">
                        <span class="pin-label">昨晚決定的今天早餐</span>
                        <h3 class="name">${esc(item.name)}</h3>
                        ${st ? `<span class="status ${st.cls}">${esc(st.text)}</span>` : ''}
                        <div class="actions">${orderLink(item, '', ['點餐', '打電話', '導航'])}<button type="button" class="act" data-act="unpin-redraw">重抽</button></div>
                    </div>
                </div>`;
        } else {
            el.innerHTML = `
                <div class="pin-compact">${icon('bookmark')}<span class="pin-text">明天早餐：<b>${esc(item.name)}</b></span>
                    <button type="button" class="link-btn" data-act="unpin">取消</button></div>`;
        }
    }

    function switchDrawMode() {
        if (state.rolling) return;
        state.override = { mode: effectiveMode() === 'tomorrow' ? 'today' : 'tomorrow', base: autoMode() };
        renderBar();
        doDraw();
    }

    function extraActions(item, tomorrow) {
        const id = esc(item.id);
        const cal = tomorrow ? `<button type="button" class="act" data-act="calendar" data-id="${id}">${icon('calendar-plus')}加到行事曆</button>` : '';
        const share = `<button type="button" class="act" data-act="share" data-id="${id}" data-mode="${tomorrow ? 'tomorrow' : 'today'}">${icon('share-2')}傳給對方</button>`;
        return `<div class="actions">${cal}${share}</div>`;
    }

    // 抽的那天剛好放假，提醒有些店可能休息
    function holidayWarn(tomorrow) {
        const name = holidayName(tomorrow ? tomorrowDate() : new Date());
        return name ? `<p class="pick-warn">${icon('info-circle')}${tomorrow ? '明天' : '今天'}是${esc(name)}，有些店可能休息，先打電話確認比較保險</p>` : '';
    }

    // 下雨的時候，說明這家要不要出門
    function weatherWarn(item, mode) {
        const text = LIB.weatherNote(state.weather, mode, !!item.link);
        return text ? `<p class="pick-warn">${icon('info-circle')}${esc(text)}</p>` : '';
    }

    function pickHtml(item, pool) {
        const tomorrow = pool.mode === 'tomorrow';
        const from = state.filter === '全部' ? '' : `「${state.filter}」`;
        const skipped = [
            pool.closed ? `${pool.closed} 家打烊` : '',
            pool.rest ? `${pool.rest} 家明天公休` : '',
            pool.far ? `${pool.far} 家太遠` : '',
            pool.eaten ? `${pool.eaten} 家最近吃過` : '',
        ].filter(Boolean).join('、');
        const ago = eatenText(item.id);
        return `
            <div class="sheet-grip"></div>
            <div class="pick reveal">
                <p class="pick-label">${tomorrow ? '明天早餐就吃' : '今天就吃'}</p>
                <h2 class="pick-name" tabindex="-1" autofocus>${esc(item.name)}</h2>
                <p class="last-eaten" data-last="${esc(item.id)}">${ago ? `上次吃：${ago}` : ''}</p>
                ${walkHtml(item)}
                ${photoHtml(item, { w: 900, forceStatus: tomorrow ? tomorrowStatus(item) : undefined })}
                ${noteHtml(item)}
                ${holidayWarn(tomorrow)}
                ${weatherWarn(item, pool.mode)}
                ${pickActions(item)}
                ${tomorrow ? pinButtonHtml(item.id) : ''}
                ${extraActions(item, tomorrow)}
                <p class="pick-hint">從${from} ${pool.list.length} 家裡抽${skipped ? `（略過 ${skipped}）` : ''}</p>
                <button type="button" class="link-btn" data-act="draw-mode">${tomorrow ? '改抽現在還開著的店' : '改抽明天早餐'}</button>
            </div>`;
    }

    /* ---------- 畫面 ---------- */

    // 雲端硬碟的照片可以指定大小（網址結尾的 =w1000），依畫面需要的大小載入，比較省流量
    const imgSrc = (url, w) => String(url).replace(/^(https:\/\/lh3\.googleusercontent\.com\/d\/[^=]+)=w\d+$/, `$1=w${w}`);

    function photoHtml(item, { tags = false, status = true, edit = false, pill = false, w = 640, forceStatus } = {}) {
        const st = forceStatus !== undefined ? forceStatus : status ? statusOf(item) : null;
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

    // 愛吃的品項拆成一個一個（用頓號、逗號或換行分開），點哪個複製哪個，也可以全部複製，貼到 LINE 點餐很方便
    const noteItems = (note) => String(note || '').split(/[\n、，,]+/).map((x) => x.trim()).filter(Boolean);

    function noteHtml(item) {
        const items = noteItems(item.note);
        if (!items.length) return '';
        const id = esc(item.id);
        const chips = items.map((t, i) => `<button type="button" class="item-chip" data-act="copy-one" data-id="${id}" data-i="${i}" aria-label="複製 ${esc(t)}"><span>${esc(t)}</span>${icon('copy')}</button>`).join('');
        const all = items.length > 1 ? `<button type="button" class="item-chip all" data-act="copy-all" data-id="${id}"><span>全部複製</span>${icon('copy')}</button>` : '';
        return `<div class="note"><b class="note-label">00 愛吃</b><div class="note-items">${chips}${all}</div></div>`;
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
        const mode = effectiveMode();
        $('#draw-btn').innerHTML = `${icon('dice-5')}${mode === 'tomorrow' ? '幫我抽明天早餐' : '幫我抽一家'}`;
        $('#draw-btn').disabled = !state.loaded || !drawPool(mode).list.length;
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

    const SKELETON = '<div class="skeleton" aria-hidden="true">' + '<div class="sk-card"><div class="sk-photo"></div><div class="sk-line w60"></div><div class="sk-line"></div><div class="sk-line w80"></div></div>'.repeat(2) + '</div>';

    function renderList() {
        const list = visible();
        const box = $('#list');
        if (!state.loaded) {
            if (!box.querySelector('.skeleton') && !box.querySelector('[data-act="retry"]')) box.innerHTML = SKELETON;
            return;
        }
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
        const near = sortByDistance(list); // 有出發地址的話，同一種營業狀態裡近的排前面
        if (!near.some((it) => it.hours)) return near;
        const rank = (it) => STATUS_ORDER[(statusOf(it) || { cls: 'none' }).cls];
        return near.map((it, i) => ({ it, i, r: rank(it) })).sort((a, b) => a.r - b.r || a.i - b.i).map((x) => x.it);
    }

    function renderSwipe(source) {
        const list = sortByStatus(source);
        const cards = list.map((item) => `
            <article class="scard" data-id="${esc(item.id)}">
                ${photoHtml(item, { tags: true, edit: true, pill: true })}
                <div class="body">
                    <h3 class="name">${esc(item.name)}</h3>
                    ${walkHtml(item)}
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

    function renderGrid(source) {
        const list = sortByDistance(source);
        const card = (item) => `
            <div class="gcard" role="button" tabindex="0" data-act="detail" data-id="${esc(item.id)}" aria-label="${esc(item.name)}">
                ${photoHtml(item, { edit: true, w: 480 })}
                <div class="body">
                    <h3 class="name">${esc(item.name)}</h3>
                    ${walkHtml(item)}
                    ${item.note ? `<div class="like">愛吃 ${esc(noteItems(item.note).join('、'))}</div>` : ''}
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

    function agoText(t) {
        const m = Math.floor((Date.now() - t) / 60000);
        if (m < 1) return '剛剛';
        if (m < 60) return `${m} 分鐘前`;
        const h = Math.floor(m / 60);
        return h < 24 ? `${h} 小時前` : `${Math.floor(h / 24)} 天前`;
    }

    function renderFoot() {
        const count = state.loaded ? `共 ${state.items.length} 家早餐店` : '';
        let updated = '';
        if (state.loaded && state.updatedAt) {
            updated = state.stale ? `・目前離線，顯示 ${agoText(state.updatedAt)}的資料` : `・資料更新於 ${agoText(state.updatedAt)}`;
        }
        $('#foot-info').textContent = count + updated;
        $('#admin-btn').innerHTML = isAdmin() ? '離開管理模式' : `${icon('lock')} 管理`;
        const nb = $('#notes-btn');
        nb.hidden = !isAdmin();
        nb.innerHTML = `${icon('message')} 留言給 00`;
    }

    /* ---------- 搖一搖抽籤 ---------- */

    const shakeCapable = () => 'DeviceMotionEvent' in window && matchMedia('(pointer: coarse)').matches;
    const isShakeOn = () => storage.get(SHAKE_KEY) === '1';
    let lastMotion = null;
    let spikes = [];
    let lastShake = 0;
    let motionSeen = false; // 這次打開網頁後，有沒有收到過動作感應資料

    // 1 秒內晃 3 次以上才算搖，走路或拿起手機不會觸發；抽籤面板、設定面板開著的時候也不觸發
    function onMotion(e) {
        const a = e.accelerationIncludingGravity;
        if (!a || a.x == null) return;
        motionSeen = true;
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
        motionSeen = false;
    }

    // iPhone 每次重新打開網頁，動作感應的權限都要在「點一下」的當下重新請求一次，不然收不到任何資料。
    // 所以搖一搖開著、但這次還沒收到動作資料時，就在第一次點畫面時補請求（已經有資料就不會再問）
    function armShakePermission() {
        if (typeof DeviceMotionEvent === 'undefined' || typeof DeviceMotionEvent.requestPermission !== 'function') return;
        document.addEventListener('click', async () => {
            if (motionSeen || !isShakeOn()) return;
            try {
                if ((await DeviceMotionEvent.requestPermission()) === 'granted') {
                    startShake();
                    if (!document.querySelector('dialog[open]')) toast('搖一搖已啟用');
                }
            } catch (e) { /* 這次不能請求或被拒絕，維持原狀 */ }
        }, { once: true, capture: true });
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

    /* ---------- 月報 ---------- */

    const TYPE_COLORS = ['#c93232', '#ef9f27', '#378add', '#1d9e75', '#7f77dd', '#ff8fa3'];

    function reportMonth() {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() + state.reportOffset);
        return { year: d.getFullYear(), month: d.getMonth() + 1 };
    }
    const monthLabel = (ym) => (ym.year === new Date().getFullYear() ? `${ym.month} 月` : `${ym.year} 年 ${ym.month} 月`);
    const reportStats = (ym) => LIB.monthStats(state.log, state.items, state.passport, ym.year, ym.month);

    function reportHtml() {
        const ym = reportMonth();
        const st = reportStats(ym);
        const first = state.log.reduce((m, e) => Math.min(m, e[1]), Infinity);
        const canPrev = first < new Date(ym.year, ym.month - 1, 1).getTime();
        const canNext = state.reportOffset < 0;
        let body = `<p class="hint">${monthLabel(ym)}還沒有紀錄。按過「電話」或「點餐」，就會記在這裡。</p>`;
        if (st.total) {
            const max = st.top[0].count;
            body = `
                <div class="rp-nums">
                    <div><b>${st.total}</b><span>次早餐</span></div>
                    <div><b>${st.days}</b><span>天有吃</span></div>
                    <div><b>${st.shops}</b><span>家店</span></div>
                    <div><b>${st.newCount}</b><span>家新嘗試</span></div>
                </div>
                <ol class="rp-top">${st.top.map((t) => `<li><span class="rp-name">${esc(t.name)}</span><span class="rp-n">${t.count} 次</span>
                    <span class="rp-bar"><i style="width:${Math.round((t.count / max) * 100)}%"></i></span></li>`).join('')}</ol>
                <div class="rp-stack" role="img" aria-label="${esc(st.types.map((t) => `${t.type} ${t.count} 次`).join('、'))}">${st.types.map((t, i) => `<i style="flex:${t.count};background:${TYPE_COLORS[i % TYPE_COLORS.length]}"></i>`).join('')}</div>
                <ul class="rp-legend">${st.types.map((t, i) => `<li><i style="background:${TYPE_COLORS[i % TYPE_COLORS.length]}"></i>${esc(t.type)} ${t.count}</li>`).join('')}</ul>
                <button type="button" class="btn full" data-act="report-save">${icon('download')}存成圖片</button>`;
        }
        return `<section data-report>
            <h3>早餐月報<span class="rp-nav">
                <button type="button" data-act="report-prev" aria-label="上個月"${canPrev ? '' : ' disabled'}>${icon('chevron-left')}</button>
                <b>${monthLabel(ym)}</b>
                <button type="button" data-act="report-next" aria-label="下個月"${canNext ? '' : ' disabled'}>${icon('chevron-right')}</button>
            </span></h3>
            ${body}
        </section>`;
    }

    function shiftReport(delta) {
        state.reportOffset = Math.min(0, state.reportOffset + delta);
        const sec = $('#mine [data-report]');
        if (sec) sec.outerHTML = reportHtml();
    }

    // 把月報畫成一張圖（1080×1620），顏色跟著目前的主題皮膚
    function drawReport(ym, st) {
        const W = 1080;
        const H = 1620;
        const cv = document.createElement('canvas');
        cv.width = W;
        cv.height = H;
        const g = cv.getContext('2d');
        const css = getComputedStyle(document.documentElement);
        const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
        const C = { bg: v('--bg-color', '#fff9f5'), card: v('--primary-soft', '#fdeaea'), ink: v('--text-dark', '#222'), ink2: v('--text-2', '#555'), main: v('--primary-color', '#c93232'), onMain: v('--on-primary', '#fff'), track: v('--surface-2', '#eee') };
        const FONT = '"PingFang TC","Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif';
        const text = (str, x, y, size, color, weight = 'normal', align = 'left') => {
            g.font = `${weight} ${size}px ${FONT}`;
            g.fillStyle = color;
            g.textAlign = align;
            g.textBaseline = 'alphabetic';
            g.fillText(str, x, y);
        };
        const fit = (str, maxW, size, weight) => {
            g.font = `${weight} ${size}px ${FONT}`;
            let t = str;
            while (t.length > 1 && g.measureText(t).width > maxW) t = t.slice(0, -1);
            return t === str ? str : `${t}…`;
        };
        const rr = (x, y, w, h, r, color) => {
            g.fillStyle = color;
            g.beginPath();
            g.moveTo(x + r, y);
            g.arcTo(x + w, y, x + w, y + h, r);
            g.arcTo(x + w, y + h, x, y + h, r);
            g.arcTo(x, y + h, x, y, r);
            g.arcTo(x, y, x + w, y, r);
            g.closePath();
            g.fill();
        };

        g.fillStyle = C.bg;
        g.fillRect(0, 0, W, H);
        g.fillStyle = C.main;
        g.fillRect(0, 0, W, 270);
        // 荷包蛋
        g.fillStyle = '#fff';
        g.beginPath(); g.ellipse(930, 140, 92, 70, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#ffb62e';
        g.beginPath(); g.arc(930, 136, 42, 0, Math.PI * 2); g.fill();
        text(`00 的 ${ym.month} 月早餐月報`, 60, 150, 68, C.onMain, 'bold');
        text(`${ym.year} 年`, 62, 215, 36, C.onMain);

        const tiles = [[st.total, '次早餐'], [st.days, '天有吃'], [st.shops, '家店'], [st.newCount, '家新嘗試']];
        tiles.forEach(([n, label], i) => {
            const x = 60 + (i % 2) * 510;
            const y = 320 + Math.floor(i / 2) * 190;
            rr(x, y, 450, 160, 28, C.card);
            text(String(n), x + 40, y + 98, 84, C.main, 'bold');
            text(label, x + 40, y + 140, 34, C.ink2);
        });

        text('最常吃的店', 60, 770, 44, C.ink, 'bold');
        const max = st.top.length ? st.top[0].count : 1;
        st.top.forEach((t, i) => {
            const y = 810 + i * 100;
            text(fit(t.name, 760, 36, 'normal'), 60, y + 36, 36, C.ink);
            text(`${t.count} 次`, 1020, y + 36, 36, C.ink2, 'normal', 'right');
            rr(60, y + 52, 960, 20, 10, C.track);
            rr(60, y + 52, Math.max(20, 960 * (t.count / max)), 20, 10, C.main);
        });

        text('吃了哪些類型', 60, 1366, 44, C.ink, 'bold');
        const total = st.types.reduce((a, t) => a + t.count, 0) || 1;
        let x = 60;
        st.types.forEach((t, i) => {
            const w = Math.max(14, Math.round((960 * t.count) / total));
            rr(x, 1392, w, 34, 8, TYPE_COLORS[i % TYPE_COLORS.length]);
            x += w;
        });
        let lx = 60;
        let ly = 1480;
        st.types.forEach((t, i) => {
            const label = `${t.type} ${t.count}`;
            g.font = `normal 32px ${FONT}`;
            const w = g.measureText(label).width + 56;
            if (lx + w > 1020) { lx = 60; ly += 44; }
            g.fillStyle = TYPE_COLORS[i % TYPE_COLORS.length];
            g.beginPath(); g.arc(lx + 12, ly - 11, 12, 0, Math.PI * 2); g.fill();
            text(label, lx + 36, ly, 32, C.ink2);
            lx += w + 16;
        });
        text('00 專屬早餐清單', W / 2, H - 28, 28, C.ink2, 'normal', 'center');
        return new Promise((resolve) => cv.toBlob(resolve, 'image/png'));
    }

    function showShot(blob, name) {
        const url = URL.createObjectURL(blob);
        const dlg = $('#shot');
        dlg.innerHTML = `
            <div class="sheet-head">
                <h2 tabindex="-1" autofocus>早餐月報</h2>
                <button type="button" class="icon-btn" data-close aria-label="關閉">${icon('x')}</button>
            </div>
            <div class="pad">
                <img class="shot-img" src="${url}" alt="早餐月報圖片">
                <p class="hint">長按圖片，選「加入照片」或「儲存圖片」。</p>
                <a class="btn primary full" href="${url}" download="${esc(name)}">${icon('download')}下載圖片</a>
            </div>`;
        dlg.addEventListener('close', () => URL.revokeObjectURL(url), { once: true });
        dlg.showModal();
        dlg.scrollTop = 0;
    }

    async function saveReport(btn) {
        const ym = reportMonth();
        const st = reportStats(ym);
        if (!st.total) return;
        const blob = await drawReport(ym, st);
        if (!blob) { toast('做不出圖片，可以改用螢幕截圖'); return; }
        const name = `早餐月報-${ym.year}-${String(ym.month).padStart(2, '0')}.png`;
        const file = new File([blob], name, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({ files: [file], title: `${ym.month} 月早餐月報` });
                return;
            } catch (e) {
                if (e && e.name === 'AbortError') return; // 自己按了取消
            }
        }
        showShot(blob, name);
    }

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
                ${reportHtml()}
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

    const METHOD_HINT = {
        toaster: '按下去，吐司機會彈出今天的早餐。',
        gacha: '轉一下扭蛋機，掉出一顆膠囊。',
        flip: '發三張牌，你自己點一張，點到哪家就是哪家。',
        scratch: '用手指刮開銀色那層，看看是哪一家。',
        random: '每次抽都隨機換一種玩法。',
    };

    function settingsHtml() {
        const mode = THEME.get();
        const skin = THEME.getSkin();
        const method = getMethod();
        const shakeOn = isShakeOn();
        const seg = (act, current, options, extra = '') => `<div class="seg ${extra}" role="group">${options.map(([v, label]) =>
            `<button type="button" class="${v === current ? 'on' : ''}" data-act="${act}" data-v="${v}" aria-pressed="${v === current}">${label}</button>`).join('')}</div>`;
        const shakeNote = shakeOn
            ? '已開啟：在主畫面搖一搖手機就會抽。iPhone 重新打開網頁後，第一次點畫面時可能會再問你一次是否允許動作感應。'
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
                    ${seg('set-method', method, [['toaster', '吐司機'], ['gacha', '扭蛋機'], ['flip', '翻牌三選一'], ['scratch', '刮刮卡'], ['random', '每次隨機']], 'wrap')}
                    <p class="hint">${METHOD_HINT[method]}</p>
                </section>
                <section>
                    <h3>出發地址<small>算步行距離用</small></h3>
                    <div class="inline-add">
                        <input id="home-addr" maxlength="120" value="${esc(homeAddr())}" placeholder="例：台北市南港區忠孝東路六段 1 號" enterkeyhint="done" autocomplete="off">
                        <button type="button" class="btn sm" data-act="save-home">儲存</button>
                    </div>
                    <p class="hint" id="home-note">${geoSummary()}</p>
                    <h3 class="sub-title">只抽走得到的店</h3>
                    ${seg('set-walk', String(maxWalk()), [['0', '不限'], ['10', '10 分內'], ['15', '15 分內'], ['20', '20 分內']])}
                    <p class="hint">${homeAddr() ? '步行幾分鐘是用直線距離估的。位置還沒查到的店不會被排除。' : '要先填出發地址，這個才有用。'}</p>
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

    /* ---------- 節日與生日 ---------- */

    const SPECIAL_DAYS = Array.isArray(CONFIG.SPECIAL_DAYS) ? CONFIG.SPECIAL_DAYS : [];
    const CAL_KEY = 'breakfast-cal';
    const CAL_TTL = 30 * DAY_MS;

    // 國定假日：有抓到那一年的政府行事曆就用它，沒有就只認固定日期的那幾個
    const calendarFor = (date) => (state.calYears.has(date.getFullYear()) ? state.cal : null);
    const holidayName = (date) => LIB.holidayLabel(LIB.holidayOn(date, calendarFor(date)));
    const specialToday = (now = new Date()) => LIB.specialOn(now, calendarFor(now), SPECIAL_DAYS);

    // 行事曆每年存一次在手機裡（30 天內不重抓）；抓不到就先用存起來的，再不行就只用固定日期
    async function loadCalendar() {
        let store = {};
        try { store = JSON.parse(storage.get(CAL_KEY) || '{}') || {}; } catch (e) { store = {}; }
        const years = [...new Set([new Date().getFullYear(), tomorrowDate().getFullYear()])];
        const apply = () => {
            const have = years.filter((y) => store[y] && Array.isArray(store[y].data));
            state.calYears = new Set(have);
            state.cal = LIB.buildCalendar(have.flatMap((y) => store[y].data));
        };
        apply();
        renderHero();
        let changed = false;
        await Promise.all(years.map(async (y) => {
            if (store[y] && Date.now() - store[y].t < CAL_TTL) return;
            try {
                const res = await fetch(LIB.CAL_URL(y));
                if (!res.ok) return;
                const data = await res.json();
                if (!Array.isArray(data) || !data.length) return;
                store[y] = { t: Date.now(), data: data.filter((x) => x && x.isHoliday && x.description).map((x) => ({ date: x.date, isHoliday: true, description: x.description })) };
                changed = true;
            } catch (e) { /* 讀不到就算了 */ }
        }));
        if (changed) {
            storage.set(CAL_KEY, JSON.stringify(store));
            apply();
            renderHero();
        }
    }

    // 荷包蛋會說的話，由重要到不重要；平常只有最後一句（依時間打招呼）。第一句就是平常顯示的那句
    function heroLines(now = new Date()) {
        const lines = [];
        const special = specialToday(now);
        if (special && special.kind !== 'holiday') lines.push(special.greeting);
        if (state.note && state.note.date === isoDay(now)) lines.push(`留言給 00：${state.note.text}`);
        const pin = pinLine(now);
        if (pin) lines.push(pin);
        if (special && special.kind === 'holiday') lines.push(special.greeting);
        // 生日倒數：最後 7 天排在問候前面（一開網頁就看到），再早一點的只在戳荷包蛋時才說
        const near = LIB.countdownLine(now, SPECIAL_DAYS.map((d) => Object.assign({}, d, { countdown: Math.min(d.countdown == null ? 14 : d.countdown, 7) })));
        if (near) lines.push(near);
        const tom = !(special && special.kind === 'holiday') && holidayName(tomorrowDate());
        if (tom) lines.push(`明天是${tom}，有些店可能休息`);
        const wx = LIB.weatherLine(state.weather, autoMode());
        if (wx) lines.push(wx);
        lines.push(greeting(now));
        const far = LIB.countdownLine(now, SPECIAL_DAYS);
        if (far && far !== near) lines.push(far);
        return lines;
    }

    function pinLine(now = new Date()) {
        const h = now.getHours();
        const today = todaysPin();
        if (today && h >= 5 && h < 14) return `早安！昨晚決定了今天吃「${today.item.name}」`;
        const pin = readPin();
        const tomorrowItem = pin && pin.day === dayKey(tomorrowDate()) && findItem(pin.id);
        if (tomorrowItem && h >= 14) return `已記住明天吃「${tomorrowItem.name}」，晚安！`;
        return '';
    }

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
        const special = specialToday(now);
        const acc = $('#egg .acc');
        if (acc) acc.innerHTML = special && LIB.ACCESSORIES[special.accessory] ? LIB.ACCESSORIES[special.accessory] : '';
        hero.classList.toggle('birthday', !!special && special.kind === 'birthday');
        if (!state.quip) $('#bubble').textContent = heroLines(now)[0];
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
            // 輪流說：今天的特別消息（生日、節日、記住的店…），最後才是隨機的悄悄話
            const seq = heroLines().slice(1).concat([QUIPS[Math.floor(Math.random() * QUIPS.length)]]);
            $('#bubble').textContent = seq[state.lineIdx++ % seq.length];
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

    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (e) { /* 少數環境不能用剪貼簿 API，改用舊方法 */ }
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (err) { /* 忽略 */ }
        ta.remove();
        return ok;
    }

    const toNode = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };

    // 複製愛吃的品項：index 是第幾個，null 代表全部
    async function copyItem(btn, id, index) {
        const item = findItem(id);
        if (!item) return;
        const text = index == null ? item.note : noteItems(item.note)[index];
        if (!text) return;
        const ok = await copyToClipboard(text);
        // 在彈出視窗裡，提示訊息會被蓋住，所以直接讓圖示變成打勾
        const svg = btn.querySelector('svg');
        if (svg) {
            svg.replaceWith(toNode(icon(ok ? 'check' : 'x')));
            setTimeout(() => { const cur = btn.querySelector('svg'); if (cur) cur.replaceWith(toNode(icon('copy'))); }, 1500);
        }
        if (!document.querySelector('dialog[open]')) toast(ok ? '已複製，可以貼到 LINE 了' : '複製失敗，請手動選取');
    }

    // 彈出視窗裡提示訊息會被蓋住，所以讓按鈕自己顯示結果幾秒
    function flashButton(btn, html, ms = 2200) {
        const old = btn.innerHTML;
        btn.innerHTML = html;
        setTimeout(() => { btn.innerHTML = old; }, ms);
    }

    // 傳給對方：手機會跳出分享選單（LINE 等）；不支援就複製文字
    async function shareItem(btn, id, mode) {
        const item = findItem(id);
        if (!item) return;
        const tomorrow = mode === 'tomorrow';
        const when = tomorrow ? tomorrowStatus(item) : statusOf(item);
        const text = LIB.shareText({ tomorrow, item, whenText: when ? when.text : '', link: item.link });
        if (navigator.share) {
            try {
                await navigator.share({ text });
                return;
            } catch (e) {
                if (e && e.name === 'AbortError') return; // 自己按了取消
            }
        }
        const ok = await copyToClipboard(text);
        flashButton(btn, `${icon(ok ? 'check' : 'x')}${ok ? '已複製，貼到 LINE 就好' : '複製失敗'}`);
    }

    // 加到行事曆：產生 .ics，明天 7:00 提醒。優先用分享選單（手機可以直接選「行事曆」），不行就下載檔案
    async function addToCalendar(btn, id) {
        const item = findItem(id);
        if (!item) return;
        const start = tomorrowDate();
        start.setHours(REMINDER_HOUR, 0, 0, 0);
        const st = tomorrowStatus(item);
        const items = noteItems(item.note);
        const description = [
            st && st.text,
            items.length ? `要吃：${items.join('、')}` : '',
            item.phone ? `電話：${item.phone}` : '',
            item.link ? `點餐：${item.link}` : '',
        ].filter(Boolean).join('\n');
        const ics = LIB.buildICS({
            uid: `${item.id}-${LIB.ymd(start)}@breakfast`,
            summary: `早餐：${item.name}`,
            start,
            minutes: 30,
            description,
            location: item.addr,
            url: item.link,
        });
        const file = new File([ics], 'breakfast-reminder.ics', { type: 'text/calendar' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({ files: [file] });
                return;
            } catch (e) {
                if (e && e.name === 'AbortError') return;
            }
        }
        const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'breakfast-reminder.ics';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        flashButton(btn, `${icon('check')}已產生行程檔`);
    }

    function renderAll() {
        renderTheme();
        renderHero();
        renderPin();
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
                    ${walkHtml(item)}
                    ${infoRows(item)}
                    ${actionsHtml(item)}
                    <div class="actions"><button type="button" class="act" data-act="share" data-id="${esc(id)}" data-mode="${effectiveMode()}">${icon('share-2')}傳給對方</button></div>
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

    // 留言給 00：選一天寫一句話，那天荷包蛋就會說出來
    const NEED_UPDATE = '後端還沒更新：請把新版 Code.gs 貼到 Apps Script 並重新部署（步驟在說明文件）。';
    const noteErr = (msg) => { $('#note-err').textContent = msg || ''; };
    const noteMsg = (e) => (e && e.message === '未知的動作' ? NEED_UPDATE : (e && e.message) || '發生錯誤');
    const noteDayLabel = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${m}/${d}（週${WEEK[new Date(y, m - 1, d).getDay()]}）`; };

    function renderNotes() {
        $('#note-list').innerHTML = state.notes.length
            ? state.notes.map((n) => `<li>
                <button type="button" class="note-row" data-act="note-edit" data-date="${esc(n.date)}" aria-label="修改 ${esc(noteDayLabel(n.date))} 的留言"><b>${esc(noteDayLabel(n.date))}</b><span>${esc(n.text)}</span></button>
                <button type="button" class="icon-btn" data-act="note-del" data-date="${esc(n.date)}" aria-label="刪除 ${esc(noteDayLabel(n.date))} 的留言">${icon('trash')}</button></li>`).join('')
            : '<li class="empty">還沒有排好的留言</li>';
    }

    async function openNotes() {
        const dlg = $('#notes');
        $('#note-date').min = isoDay();
        $('#note-date').value = isoDay(tomorrowDate());
        $('#note-text').value = '';
        noteErr('');
        state.notes = [];
        renderNotes();
        dlg.showModal();
        dlg.scrollTop = 0;
        try {
            state.notes = (await api('listNotes')).notes || [];
            renderNotes();
        } catch (e) {
            noteErr(noteMsg(e));
        }
    }

    async function saveNote(date, text) {
        const btn = $('#note-save');
        btn.disabled = true;
        noteErr('');
        try {
            state.notes = (await api('saveNote', { date, text })).notes || [];
            renderNotes();
            if (date === isoDay()) { setNote(text ? { date, text } : null); renderHero(); }
            toast(text ? '已儲存留言' : '已刪除留言');
            return true;
        } catch (e) {
            noteErr(noteMsg(e));
            return false;
        } finally {
            btn.disabled = false;
        }
    }

    async function onSaveNote(e) {
        e.preventDefault();
        const date = $('#note-date').value;
        const text = $('#note-text').value.trim();
        if (!date) { noteErr('請選一天'); return; }
        if (!text) { noteErr('請寫一句話（要刪除留言，按下面列表的垃圾桶）'); return; }
        if (await saveNote(date, text)) $('#note-text').value = '';
    }

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
        $('#add-btn').innerHTML = icon('plus');
        $('#settings-btn').innerHTML = icon('settings');
        $('#mine-btn').innerHTML = icon('notebook');
        $('#draw-btn').innerHTML = `${icon('dice-5')}幫我抽一家`;
        enableSwipeClose($('#pick'));
        enableSwipeClose($('#detail'));
        enableSwipeClose($('#mine'));
        enableSwipeClose($('#settings'));
        enableSwipeClose($('#shot'));

        // 彈出視窗開著的時候，把背後的頁面固定住（記住捲到哪裡，關掉再還原），
        // 不然在視窗或灰色背景上滑動，背景也會跟著動
        let lockedY = 0;
        const syncScrollLock = () => {
            const style = document.body.style;
            const locked = style.position === 'fixed';
            const anyOpen = !!document.querySelector('dialog[open]');
            if (anyOpen && !locked) {
                lockedY = window.scrollY;
                style.position = 'fixed';
                style.top = `-${lockedY}px`;
                style.left = '0';
                style.right = '0';
            } else if (!anyOpen && locked) {
                style.position = '';
                style.top = '';
                style.left = '';
                style.right = '';
                window.scrollTo(0, lockedY);
            }
        };
        document.querySelectorAll('dialog').forEach((d) => new MutationObserver(syncScrollLock).observe(d, { attributes: true, attributeFilter: ['open'] }));
        if (isShakeOn()) {
            startShake();
            armShakePermission();
        }
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
                case 'copy-one': copyItem(el, id, Number(el.dataset.i)); break;
                case 'copy-all': copyItem(el, id, null); break;
                case 'share': shareItem(el, id, el.dataset.mode); break;
                case 'calendar': addToCalendar(el, id); break;
                case 'theme': cycleTheme(); break;
                case 'egg': pokeEgg(); break;
                case 'mine': state.reportOffset = 0; openMine(); break;
                case 'report-prev': shiftReport(-1); break;
                case 'report-next': shiftReport(1); break;
                case 'report-save': saveReport(el); break;
                case 'settings': openSettings(); break;
                case 'set-mode': THEME.set(el.dataset.v); refreshTheme(); renderSettings(); break;
                case 'set-skin': THEME.setSkin(el.dataset.v); refreshTheme(); renderSettings(); break;
                case 'set-method':
                    storage.set(METHOD_KEY, el.dataset.v === 'toaster' ? null : el.dataset.v);
                    renderSettings();
                    break;
                case 'note-edit':
                    $('#note-date').value = el.dataset.date;
                    $('#note-text').value = (state.notes.find((n) => n.date === el.dataset.date) || {}).text || '';
                    $('#note-text').focus();
                    break;
                case 'note-del': saveNote(el.dataset.date, ''); break;
                case 'save-home': saveHome(); break;
                case 'set-walk':
                    storage.set(WALK_KEY, el.dataset.v === '0' ? null : el.dataset.v);
                    renderSettings();
                    renderBar();
                    break;
                case 'toggle-shake': toggleShake(); break;
                case 'draw-mode': switchDrawMode(); break;
                case 'pin': togglePin(id); el.outerHTML = pinButtonHtml(id); break;
                case 'unpin': clearPin(); break;
                case 'unpin-redraw': clearPin(); doDraw(); break;
                default: break;
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target && e.target.id === 'home-addr') { e.preventDefault(); saveHome(); return; }
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
        $('#notes-btn').addEventListener('click', openNotes);
        $('#note-form').addEventListener('submit', onSaveNote);
        $('#notes [data-close]').innerHTML = icon('x');
        enableSwipeClose($('#notes'));
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
            loadWeather();
            if (!state.loaded) return;
            if (Date.now() - state.lastFetch > 60 * 1000) load();
            else renderAll();
        });
        window.addEventListener('online', () => { runGeoQueue(); loadWeather(); });

        // 開著不動的時候，每分鐘更新一次日夜模式、問候語和抽籤範圍（不動卡片，免得看到一半跳掉）
        setInterval(() => {
            if (document.hidden) return;
            refreshTheme();
            renderBar();
            renderPin();
            renderFoot();
        }, 60 * 1000);

        // 離線快取：沒網路也能打開（見 sw.js）
        if ('serviceWorker' in navigator && location.protocol !== 'file:') {
            window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { /* 不支援或被擋住就算了 */ }));
        }
    }

    bind();
    renderAll();
    load();
    loadCalendar();
    loadWeather();
})();
