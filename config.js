// 網站設定
// API_URL：部署 Google Apps Script 後拿到的網址（以 /exec 結尾），設定方式見 docs/部署說明.md
//          還沒設定時，網站會改讀 CSV_URL，只能看、不能在網頁上編輯
// CSV_URL：試算表「發佈到網路」的 CSV 網址
window.BREAKFAST_CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbwbv1CKFfZhHRSenzzRNAtGNvN2dWUxFqcxu4l34hKfv2WX8GjjzNSkLTj9WYjnbI4AXQ/exec',
    // 特別的日子（月、日、名字、種類）。生日當天荷包蛋會戴派對帽，前 countdown 天會倒數。
    // 國定假日不用寫在這裡，網頁會自己讀政府的行事曆
    SPECIAL_DAYS: [{ month: 10, day: 22, name: '00', kind: 'birthday', countdown: 14 }],
    // 出發地址（選填）：算步行距離用。也可以在網頁的「設定」裡填，填在網頁的會優先，而且只存在那支手機
    HOME_ADDRESS: '',
    CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR9V8Aau0g3g-Jrgdsp2rX8yykfl1vQsY62JKBv7mxO91EVuXRcXvDoeFnzle5lMgc96Gl4oG_YJ-Ub/pub?gid=0&single=true&output=csv',
};
