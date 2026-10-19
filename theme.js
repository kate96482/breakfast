// 日夜模式：放在 <head> 裡，畫面出現之前就套用，才不會先閃一下白底
// auto：18:00 到隔天 05:00 用夜間；day / night：固定
(() => {
    const KEY = 'breakfast-theme';
    const COLORS = { light: '#fff9f5', dark: '#17181a' };

    function get() {
        try {
            const v = localStorage.getItem(KEY);
            return v === 'day' || v === 'night' ? v : 'auto';
        } catch (e) {
            return 'auto';
        }
    }

    function resolve(mode, now = new Date()) {
        const h = now.getHours();
        return mode === 'night' || (mode === 'auto' && (h >= 18 || h < 5)) ? 'dark' : 'light';
    }

    function apply(mode) {
        const theme = resolve(mode);
        document.documentElement.setAttribute('data-theme', theme);
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', COLORS[theme]);
        return theme;
    }

    function set(mode) {
        try {
            if (mode === 'auto') localStorage.removeItem(KEY);
            else localStorage.setItem(KEY, mode);
        } catch (e) { /* 無痕模式存不了，這次先用就好 */ }
        return apply(mode);
    }

    window.BreakfastTheme = { get, set, apply, resolve };
    apply(get());
})();
