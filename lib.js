// 共用函式：節日與生日、行事曆檔、步行距離、地址轉座標、天氣、月報、分享文字
// 這個檔案沒有用到網頁的畫面，所以可以直接用 Node 測試（見 docs/部署說明.md 最後的「測試」）。
(function (root) {
    'use strict';

    const pad = (n) => String(n).padStart(2, '0');
    const ymd = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

    /* ================= 中華民國行事曆 ================= */

    // 行政院人事行政總處公布的辦公日曆（含補假、調整放假），由 ruyut/TaiwanCalendar 整理成 JSON，
    // 每年一個檔案。讀不到的時候，只用固定日期的國定假日，不去猜農曆的節日
    const CAL_URL = (year) => `https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar@master/data/${year}.json`;
    const FIXED_HOLIDAYS = { '0101': '開國紀念日', '0228': '和平紀念日', '0404': '兒童節', '0405': '清明節', '0501': '勞動節', '1010': '國慶日' };

    // 節日名稱 → 荷包蛋的配件、問候語（依序比對，先符合先用）
    const HOLIDAY_STYLE = [
        [/開國紀念日/, 'party', '元旦快樂！新的一年也要好好吃早餐'],
        [/小年夜/, 'redcap', '小年夜，年味開始囉'],
        [/除夕/, 'redcap', '除夕快樂，團圓飯前先把早餐吃好'],
        [/春節/, 'redcap', '新年快樂，恭喜發財'],
        [/和平紀念日/, 'flower', '和平紀念日，今天放假'],
        [/兒童節/, 'party', '兒童節快樂，今天可以吃甜一點'],
        [/清明/, 'flower', '清明節，出門前先吃飽'],
        [/勞動節/, 'hardhat', '勞動節快樂，辛苦了'],
        [/端午/, 'zongzi', '端午節快樂，粽子吃了嗎？'],
        [/中秋/, 'moon', '中秋節快樂，月餅吃了嗎？'],
        [/國慶/, 'flag', '國慶日快樂'],
        [/孔子|教師/, 'flower', '教師節快樂，記得跟老師說聲謝謝'],
        [/光復/, 'flag', '光復節，今天放假'],
        [/行憲/, 'flag', '行憲紀念日，今天放假'],
        [/補假|調整放假/, null, '今天補假，有些店可能休息'],
    ];

    // 荷包蛋配件（畫在 48×54 的範圍內，雞蛋本體在下方 y 9 到 41）
    const ACCESSORIES = {
        party: '<path d="M24 -7 L33 13 L15 13 Z" fill="#c93232"/><circle cx="24" cy="-7" r="3" fill="#ffb62e"/><circle cx="21" cy="5" r="1.6" fill="#fff"/><circle cx="27" cy="9" r="1.6" fill="#fff"/>',
        redcap: '<rect x="13" y="1" width="22" height="12" rx="3" fill="#c93232"/><rect x="11" y="11" width="26" height="4" rx="2" fill="#ffb62e"/><circle cx="24" cy="-1" r="2.6" fill="#ffb62e"/>',
        moon: '<circle cx="24" cy="2" r="9" fill="#f3efe0" stroke="#d9cfc0" stroke-width="1.2"/><circle cx="21" cy="0" r="1.6" fill="#d9cfc0"/><circle cx="27" cy="5" r="1.3" fill="#d9cfc0"/>',
        zongzi: '<path d="M24 -4 L35 14 L13 14 Z" fill="#5b9a52"/><path d="M18 9 L30 9" stroke="#e9d7a1" stroke-width="1.6"/><path d="M21 4 L27 4" stroke="#e9d7a1" stroke-width="1.6"/>',
        flag: '<path d="M38 14 L38 -8" stroke="#8a6d3b" stroke-width="1.6"/><rect x="38" y="-8" width="10" height="8" fill="#c93232"/><circle cx="41.5" cy="-4" r="1.8" fill="#fff"/>',
        hardhat: '<path d="M12 14 Q24 -6 36 14 Z" fill="#f2b632"/><rect x="10" y="12" width="28" height="3.5" rx="1.7" fill="#d99a14"/>',
        flower: '<circle cx="24" cy="2" r="3" fill="#ffb62e"/><circle cx="24" cy="-4" r="3.4" fill="#ff8fa3"/><circle cx="30" cy="2" r="3.4" fill="#ff8fa3"/><circle cx="24" cy="8" r="3.4" fill="#ff8fa3"/><circle cx="18" cy="2" r="3.4" fill="#ff8fa3"/>',
    };

    function buildCalendar(list) {
        const map = {};
        (Array.isArray(list) ? list : []).forEach((x) => {
            if (x && x.date) map[x.date] = { off: !!x.isHoliday, name: x.description || '' };
        });
        return map;
    }

    // 某天是不是國定假日（calendar 可以是 null：只用固定日期的那幾個）
    function holidayOn(date, calendar) {
        const key = ymd(date);
        if (calendar && calendar[key]) {
            const c = calendar[key];
            return c.off && c.name ? c.name : '';
        }
        return calendar ? '' : (FIXED_HOLIDAYS[key.slice(4)] || '');
    }

    // 政府資料裡的名稱有些很長，畫面上說「明天是…」的時候用簡短的叫法
    const HOLIDAY_SHORT = [[/光復/, '光復節'], [/孔子|教師/, '教師節'], [/開國紀念日/, '元旦'], [/農曆除夕/, '除夕']];
    const holidayLabel = (name) => { const hit = HOLIDAY_SHORT.find(([re]) => re.test(name)); return hit ? hit[1] : name; };

    function holidayStyle(name) {
        const hit = HOLIDAY_STYLE.find(([re]) => re.test(name));
        return hit ? { accessory: hit[1], greeting: hit[2] } : { accessory: null, greeting: `今天放假：${name}，有些店可能休息` };
    }

    // 距離下一次某月某日還有幾天（今天就是的話回傳 0）
    function daysUntil(month, day, from) {
        const base = midnight(from);
        let next = new Date(base.getFullYear(), month - 1, day);
        if (next < base) next = new Date(base.getFullYear() + 1, month - 1, day);
        return Math.round((next - base) / 86400000);
    }

    // 今天有沒有特別的日子：生日（設定檔）優先，其次是國定假日。回傳 null 代表沒有
    function specialOn(date, calendar, specialDays) {
        const days = Array.isArray(specialDays) ? specialDays : [];
        const hit = days.find((s) => s && s.month === date.getMonth() + 1 && s.day === date.getDate());
        if (hit) {
            const kind = hit.kind === 'birthday' ? 'birthday' : 'memorial';
            return {
                kind,
                name: hit.name,
                accessory: 'party',
                greeting: kind === 'birthday' ? `${hit.name} 生日快樂！今天的早餐要吃好一點` : `今天是${hit.name}`,
                closedLikely: false,
            };
        }
        const name = holidayOn(date, calendar);
        if (!name) return null;
        const style = holidayStyle(name);
        return { kind: 'holiday', name, accessory: style.accessory, greeting: style.greeting, closedLikely: true };
    }

    // 生日倒數：只在「前 N 天」顯示，生日當天由 specialOn 負責
    function countdownLine(date, specialDays) {
        const days = Array.isArray(specialDays) ? specialDays : [];
        let best = null;
        days.forEach((s) => {
            if (!s || s.kind !== 'birthday') return;
            const n = daysUntil(s.month, s.day, date);
            const limit = s.countdown == null ? 14 : s.countdown;
            if (n >= 1 && n <= limit && (!best || n < best.n)) best = { n, name: s.name };
        });
        return best ? `再 ${best.n} 天就是 ${best.name} 的生日` : '';
    }

    /* ================= 加到行事曆（.ics） ================= */

    const icsEscape = (s) => String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

    // 每行最多 75 個位元組，超過要折行（用 UTF-8 位元組算，中文才不會被切壞）
    function icsFold(line) {
        const enc = new TextEncoder();
        const out = [];
        let cur = '';
        let bytes = 0;
        for (const ch of line) {
            const b = enc.encode(ch).length;
            if (bytes + b > 74) { out.push(cur); cur = ` ${ch}`; bytes = 1 + b; } else { cur += ch; bytes += b; }
        }
        out.push(cur);
        return out.join('\r\n');
    }

    const icsLocal = (d) => `${ymd(d)}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    const icsUtc = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    // 時間用「手機當地時間」（不寫時區），提醒在開始的那一刻響
    function buildICS({ uid, summary, start, minutes = 30, description = '', location = '', url = '', now = new Date() }) {
        const end = new Date(start.getTime() + minutes * 60000);
        const lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//breakfast//zh-TW//',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${icsUtc(now)}`,
            `DTSTART:${icsLocal(start)}`,
            `DTEND:${icsLocal(end)}`,
            `SUMMARY:${icsEscape(summary)}`,
        ];
        if (description) lines.push(`DESCRIPTION:${icsEscape(description)}`);
        if (location) lines.push(`LOCATION:${icsEscape(location)}`);
        if (url) lines.push(`URL:${url}`);
        lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape(summary)}`, 'TRIGGER:PT0S', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR');
        return `${lines.map(icsFold).join('\r\n')}\r\n`;
    }

    /* ================= 步行距離 ================= */

    function haversine(lat1, lon1, lat2, lon2) {
        const R = 6371000;
        const rad = (x) => (x * Math.PI) / 180;
        const dLat = rad(lat2 - lat1);
        const dLon = rad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(a));
    }

    // 直線距離 × 1.3（街道不是直線）÷ 每分鐘 75 公尺
    const walkMinutes = (meters) => Math.max(1, Math.round((meters * 1.3) / 75));

    function formatWalk(meters) {
        const min = walkMinutes(meters);
        if (min <= 60) return `步行 ${min} 分`;
        return `約 ${(meters / 1000).toFixed(1)} 公里`;
    }

    /* ================= 地址轉座標（OpenStreetMap Nominatim） ================= */

    // 「114臺北市內湖區五分街31號」→ 縣市、區、路名（含巷弄）、門牌。里名會被去掉
    function parseAddress(addr) {
        const a = String(addr || '').replace(/\s+/g, '').replace(/臺/g, '台').replace(/^\d{3,6}/, '');
        const m = a.match(/^(.+?[市縣])(.+?[區鄉鎮市])(?:[^路街道巷弄段號市區]{1,4}里)?(.+?)(?:(\d+)(?:之\d+|-\d+)?號)/);
        if (!m) return null;
        return { city: m[1], district: m[2], street: m[3], number: m[4] };
    }

    // 由細到粗的查詢順序：有巷弄 → 完整巷弄、只到巷、只有路名；沒有 → 含門牌、只有路名
    function geocodeQueries(parsed) {
        const base = { format: 'jsonv2', limit: '1', countrycodes: 'tw', 'accept-language': 'zh-TW' };
        const out = [];
        const add = (level, params) => out.push({ level, params: Object.assign({}, base, params) });
        const st = parsed.street;
        if (/[巷弄]/.test(st)) {
            add('lane', { street: st, city: parsed.city });
            const lane = st.match(/^(.*?\d+巷)/);
            if (lane && lane[1] !== st) add('lane', { street: lane[1], city: parsed.city });
            add('street', { street: st.replace(/\d+[巷弄].*$/, ''), city: parsed.city });
        } else {
            add('house', { street: `${parsed.number} ${st}`, city: parsed.city });
            add('street', { street: st, city: parsed.city });
        }
        return out;
    }

    const NOMINATIM = 'https://nominatim.openstreetmap.org/search?';

    // 回傳 { lat, lon, level }，查不到回傳 null。Nominatim 規定每秒最多 1 次，所以每次嘗試之間會等一下
    async function geocode(addr, { fetchImpl = root.fetch && root.fetch.bind(root), sleepImpl = (ms) => new Promise((r) => setTimeout(r, ms)), gapMs = 1100 } = {}) {
        const parsed = parseAddress(addr);
        const tries = parsed
            ? geocodeQueries(parsed)
            : [{ level: 'text', params: { q: String(addr || '').trim(), format: 'jsonv2', limit: '1', countrycodes: 'tw', 'accept-language': 'zh-TW' } }];
        for (let i = 0; i < tries.length; i++) {
            if (i > 0) await sleepImpl(gapMs);
            try {
                const res = await fetchImpl(NOMINATIM + new URLSearchParams(tries[i].params).toString());
                if (!res.ok) continue;
                const list = await res.json();
                if (Array.isArray(list) && list.length) return { lat: Number(list[0].lat), lon: Number(list[0].lon), level: tries[i].level };
            } catch (e) { /* 這一種寫法查不到，換下一種 */ }
        }
        return null;
    }

    /* ================= 天氣（Open-Meteo，免費、不用金鑰） ================= */

    const WEATHER_URL = (lat, lon) => 'https://api.open-meteo.com/v1/forecast?'
        + new URLSearchParams({
            latitude: String(lat),
            longitude: String(lon),
            current: 'temperature_2m,precipitation,weather_code',
            daily: 'precipitation_probability_max,temperature_2m_max,temperature_2m_min',
            timezone: 'Asia/Taipei',
            forecast_days: '2',
        }).toString();
    const RAIN_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];

    async function fetchWeather(lat, lon, fetchImpl = root.fetch && root.fetch.bind(root)) {
        const res = await fetchImpl(WEATHER_URL(lat, lon));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        const day = (i) => ({ max: Math.round(d.daily.temperature_2m_max[i]), min: Math.round(d.daily.temperature_2m_min[i]), pop: Math.round(d.daily.precipitation_probability_max[i] || 0) });
        return {
            now: { temp: Math.round(d.current.temperature_2m), rain: Number(d.current.precipitation) || 0, raining: RAIN_CODES.indexOf(d.current.weather_code) >= 0 || Number(d.current.precipitation) > 0 },
            today: day(0),
            tomorrow: day(1),
        };
    }

    // 只在值得提醒的時候回傳一句話，平常回傳空字串，不打擾
    function weatherLine(w, mode) {
        if (!w) return '';
        if (mode === 'tomorrow') {
            const t = w.tomorrow;
            if (t.pop >= 60) return `明天降雨機率 ${t.pop}%，記得帶傘，有線上點餐的店比較方便`;
            if (t.max >= 33) return `明天最高 ${t.max} 度，很熱，想喝點冰的嗎？`;
            if (t.min <= 16) return `明天低到 ${t.min} 度，吃點熱的吧`;
            return '';
        }
        if (w.now.raining) return '外面正在下雨，建議用線上點餐';
        if (w.today.pop >= 60) return `今天降雨機率 ${w.today.pop}%，出門記得帶傘`;
        if (w.today.max >= 33) return `今天最高 ${w.today.max} 度，很熱，想喝點冰的嗎？`;
        if (w.today.min <= 16) return `今天低到 ${w.today.min} 度，吃點熱的吧`;
        return '';
    }

    // 抽到某一家時的備註：下雨時說明這家要不要出門
    function weatherNote(w, mode, hasLink) {
        if (!w) return '';
        const rainy = mode === 'tomorrow' ? w.tomorrow.pop >= 60 : (w.now.raining || w.today.pop >= 60);
        if (!rainy) return '';
        return hasLink ? '會下雨，這家可以線上點餐，不用出門' : '會下雨，這家要出門買，記得帶傘';
    }

    /* ================= 月報 ================= */

    // log：[[店家 id, 時間], …]；passport：{ id: 第一次吃的時間 }
    function monthStats(log, items, passport, year, month) {
        const start = new Date(year, month - 1, 1).getTime();
        const end = new Date(year, month, 1).getTime();
        const byId = {};
        items.forEach((it) => { byId[it.id] = it; });
        const entries = (log || []).filter(([id, t]) => t >= start && t < end && byId[id]);
        const count = {};
        const typeCount = {};
        const days = new Set();
        entries.forEach(([id, t]) => {
            count[id] = (count[id] || 0) + 1;
            days.add(ymd(new Date(t)));
            const type = (byId[id].types || [])[0];
            if (type) typeCount[type] = (typeCount[type] || 0) + 1;
        });
        const top = Object.keys(count)
            .map((id) => ({ id, name: byId[id].name, count: count[id] }))
            .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-Hant'))
            .slice(0, 5);
        const types = Object.keys(typeCount).map((type) => ({ type, count: typeCount[type] })).sort((a, b) => b.count - a.count);
        const newCount = Object.keys(passport || {}).filter((id) => byId[id] && passport[id] >= start && passport[id] < end).length;
        return { total: entries.length, days: days.size, shops: Object.keys(count).length, top, types, newCount };
    }

    /* ================= 傳給對方的文字 ================= */

    function shareText({ tomorrow, item, whenText, link, heading }) {
        const lines = [heading || `${tomorrow ? '明天' : '今天'}早餐吃這家？`, item.name];
        if (whenText) lines.push(whenText);
        if (item.note) lines.push(`要吃：${item.note.replace(/\s*\n\s*/g, '、')}`);
        if (item.phone) lines.push(`電話：${item.phone}`);
        if (link) lines.push(link);
        return lines.join('\n');
    }

    const lib = {
        ymd, midnight, CAL_URL, FIXED_HOLIDAYS, ACCESSORIES,
        buildCalendar, holidayOn, holidayLabel, holidayStyle, daysUntil, specialOn, countdownLine,
        buildICS, icsFold, icsEscape,
        haversine, walkMinutes, formatWalk,
        parseAddress, geocodeQueries, geocode,
        WEATHER_URL, fetchWeather, weatherLine, weatherNote,
        monthStats, shareText,
    };
    root.BreakfastLib = lib;
    if (typeof module !== 'undefined' && module.exports) module.exports = lib;
})(typeof window !== 'undefined' ? window : globalThis);
