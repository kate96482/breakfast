// 日夜模式與主題皮膚：放在 <head> 裡，畫面出現之前就套用，才不會先閃一下白底
// 模式 auto：18:00 到隔天 05:00 用夜間；day / night：固定
// 皮膚 egg（荷包蛋）/ matcha（抹茶）/ milktea（奶茶）/ blueberry（藍莓）
(() => {
    const KEY = 'breakfast-theme';
    const SKIN_KEY = 'breakfast-skin';
    const SKINS = ['egg', 'matcha', 'milktea', 'blueberry'];
    // 手機瀏覽器頂端的顏色，要和各皮膚的背景色一致
    const COLORS = {
        egg: { light: '#fff9f5', dark: '#17181a' },
        matcha: { light: '#f6fbf5', dark: '#151a16' },
        milktea: { light: '#fbf6f1', dark: '#1a1714' },
        blueberry: { light: '#f8f7ff', dark: '#16151d' },
    };

    function read(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }

    function write(key, value) {
        try {
            if (value == null) localStorage.removeItem(key);
            else localStorage.setItem(key, value);
        } catch (e) { /* 無痕模式存不了，這次先用就好 */ }
    }

    function get() {
        const v = read(KEY);
        return v === 'day' || v === 'night' ? v : 'auto';
    }

    function getSkin() {
        const v = read(SKIN_KEY);
        return SKINS.indexOf(v) >= 0 ? v : 'egg';
    }

    function resolve(mode, now = new Date()) {
        const h = now.getHours();
        return mode === 'night' || (mode === 'auto' && (h >= 18 || h < 5)) ? 'dark' : 'light';
    }

    function apply(mode) {
        const theme = resolve(mode);
        const skin = getSkin();
        const root = document.documentElement;
        root.setAttribute('data-theme', theme);
        root.setAttribute('data-skin', skin);
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', COLORS[skin][theme]);
        return theme;
    }

    function set(mode) {
        write(KEY, mode === 'auto' ? null : mode);
        return apply(mode);
    }

    function setSkin(skin) {
        write(SKIN_KEY, skin === 'egg' ? null : skin);
        return apply(get());
    }

    window.BreakfastTheme = { get, set, apply, resolve, getSkin, setSkin, SKINS };
    apply(get());
})();
