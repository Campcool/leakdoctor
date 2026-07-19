(function(){
  function ldInit(){
  const path = location.pathname.split('/').pop() || 'index.html';
  const page = path.replace('.html','') || 'index';
  const leakSubPages = ['cases','team','areas','leak-guide','taipei','new-taipei','keelung','taoyuan','hsinchu','miaoli','taichung'];
  const activePage = leakSubPages.indexOf(page) !== -1 ? 'leak-repair' : page;
  const LINE = 'https://lin.ee/WVxmY65';
  const LINE_OA_ID = '@478xvlgl';
  const isLineWebView = /\bLine\//i.test(navigator.userAgent || '');
  if(isLineWebView) document.body.classList.add('ld-line-webview');
  const serviceTheme = ['aircon','washer','homeclean','water-tank','pipe-cleaning','leak-repair'].indexOf(activePage) !== -1 ? activePage : '';
  if(serviceTheme) document.body.classList.add('ld-theme-' + serviceTheme);
  if(serviceTheme && !document.querySelector('link[data-ld-service-story]')){
    const storyCss = document.createElement('link');
    storyCss.rel = 'stylesheet';
    storyCss.href = '/assets/service-story.css?v=20260716a';
    storyCss.setAttribute('data-ld-service-story','true');
    document.head.appendChild(storyCss);
  }

  // ── 分析追蹤：GA4 評估 ID ──
  const GA4_ID = 'G-1H1X1X9QZE';
  const gaEnabled = /^G-[A-Z0-9]{6,}$/.test(GA4_ID) && GA4_ID !== 'G-XXXXXXXXXX';
  if (gaEnabled) {
    const gs = document.createElement('script');
    gs.async = true;
    gs.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    document.head.appendChild(gs);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA4_ID);
  }
  function ldTrack(name, params){
    if (gaEnabled && window.gtag) gtag('event', name, params || {});
  }
  window.ldTrack = ldTrack;
  const SVC_PAGES = {'/aircon.html':'aircon','/washer.html':'washer','/homeclean.html':'homeclean','/water-tank.html':'water_tank','/pipe-cleaning.html':'pipe_cleaning','/leak-repair.html':'leak-repair'};
  const AREA_PAGES = ['/taipei.html','/new-taipei.html','/keelung.html','/taoyuan.html','/hsinchu.html','/miaoli.html','/taichung.html','/areas.html'];
  // 全站點擊追蹤：LINE 連結與電話
  document.addEventListener('click', function(e){
    const a = e.target.closest && e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (href.indexOf('lin.ee') !== -1 || href.indexOf('line.me') !== -1) {
      ldTrack('line_click', { link_url: href, page: location.pathname });
      if(a.hasAttribute('data-line-direct')){
        ldTrack('line_direct_click', {
          placement: a.getAttribute('data-line-direct') || 'unknown',
          page: location.pathname
        });
      }
    } else {
      const clean = href.split('#')[0].split('?')[0];
      const path = clean.charAt(0) === '/' ? clean : '/' + clean.split('/').pop();
      if (SVC_PAGES[path]) ldTrack('service_click', { service: SVC_PAGES[path], page: location.pathname });
      else if (AREA_PAGES.indexOf(path) !== -1) ldTrack('area_click', { area: path.replace('/','').replace('.html',''), page: location.pathname });
    }
  }, true);

  const SERVICE_OPTIONS = ['冷氣清洗','洗衣機清洗','居家清潔','水塔清洗','水管清洗','漏水檢測與修補','其他（請於下方說明）'];
  const PAGE_SERVICE = {aircon:'冷氣清洗', washer:'洗衣機清洗', homeclean:'居家清潔', 'water-tank':'水塔清洗', 'pipe-cleaning':'水管清洗', 'leak-repair':'漏水檢測與修補'};
  const SERVICE_DETAIL_CATALOG = {
    '冷氣清洗': [
      {id:'aircon-wall',label:'壁掛內機',unit:'台',note:'參考價 $1,499／台'},
      {id:'aircon-concealed',label:'吊隱式冷氣',unit:'台',note:'參考價 $2,599／台'},
      {id:'aircon-outdoor',label:'室外機清洗',unit:'台',note:'加購 $500／台'},
      {id:'aircon-window',label:'窗型冷氣',unit:'台',note:'參考價 $3,000／台'},
      {id:'aircon-cassette',label:'四方吹／商用冷氣',unit:'台',note:'需照片與現場條件評估'}
    ],
    '洗衣機清洗': [
      {id:'washer-top',label:'直立式洗衣機',unit:'台',note:'參考價 $1,299／台'},
      {id:'washer-drum',label:'滾筒式洗衣機',unit:'台',note:'參考價 $2,999／台'},
      {id:'washer-commercial',label:'商用／投幣洗衣機',unit:'台',note:'需型號與照片評估'}
    ],
    '居家清潔': [
      {id:'home-regular',label:'定期居家清潔',unit:'次',note:'參考價 $2,500／4 小時'},
      {id:'home-deep',label:'大掃除',unit:'案',note:'參考價 $3,500 起'},
      {id:'home-move',label:'入住／退租清潔',unit:'案',note:'參考價 $3,000 起'},
      {id:'home-renovation',label:'裝潢後細清',unit:'案',note:'參考價 $6,000 起'},
      {id:'home-hood',label:'抽油煙機清潔',unit:'台',note:'依型號與油污程度評估'}
    ],
    '水塔清洗': [
      {id:'tank-rooftop',label:'屋頂不鏽鋼／塑膠水塔',unit:'顆',note:'依容量、顆數、通道與停水條件報價'},
      {id:'tank-concrete-upper',label:'水泥上水塔',unit:'座',note:'需照片、入口尺寸與排水方式評估'},
      {id:'tank-concrete-lower',label:'地下蓄水池／下水塔',unit:'座',note:'涉及通風與安全條件，需人工確認'},
      {id:'tank-building',label:'公寓／社區上下水塔',unit:'案',note:'依公告停水、管委會與施工時段報價'}
    ],
    '水管清洗': [
      {id:'pipe-home',label:'住家水管清洗',unit:'戶',note:'依屋齡、管材、出水點與現場條件報價'},
      {id:'pipe-apartment',label:'公寓／大樓水管清洗',unit:'案',note:'需確認樓層、停水、管線與管委會規範'},
      {id:'pipe-yellow-water',label:'黃水／異味初步判斷',unit:'處',note:'先傳照片與用水狀況，確認是否適合清洗'},
      {id:'pipe-low-flow',label:'水量變小檢查',unit:'處',note:'堵塞、鏽蝕或設備問題需先判斷原因'}
    ],
    '漏水檢測與修補': [
      {id:'leak-inspection',label:'漏水初步檢測',unit:'處',note:'先依水痕、照片與現場狀況判讀'},
      {id:'leak-pressure',label:'給水管壓力測試',unit:'區',note:'依管線範圍評估'},
      {id:'leak-water',label:'排水／防水滿水測試',unit:'區',note:'依測試範圍評估'},
      {id:'leak-infrared',label:'紅外線／含水率檢測',unit:'區',note:'依現場條件選用儀器'},
      {id:'leak-repair',label:'漏水修補施工',unit:'處',note:'確認漏點與工法後報價'}
    ],
    '其他（請於下方說明）': [
      {id:'other-request',label:'其他服務需求',unit:'項',note:'請在備註說明需求與現場狀況'}
    ]
  };

  // 字體
  if(!document.querySelector('link[href*="Noto+Sans"]')){
    const l=document.createElement('link');
    l.rel='stylesheet';
    l.href='https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700;900&display=swap';
    document.head.appendChild(l);
  }
  if(!document.querySelector('link[href*="site-unified.css"]')){
    const unified = document.createElement('link');
    unified.rel = 'stylesheet';
    unified.href = '/assets/site-unified.css';
    document.head.appendChild(unified);
  }
  const existingCraftCss = document.querySelector('link[href*="craft.css"]');
  if(existingCraftCss){
    existingCraftCss.href = '/assets/craft.css?v=20260719a';
  }else{
    const craftCss = document.createElement('link');
    craftCss.rel = 'stylesheet';
    craftCss.href = '/assets/craft.css?v=20260719a';
    document.head.appendChild(craftCss);
  }
  if(!document.querySelector('script[src*="craft.js"]')){
    const craftJs = document.createElement('script');
    craftJs.src = '/assets/craft.js?v=20260716a';
    craftJs.defer = true;
    document.head.appendChild(craftJs);
  }

  // CSS：全部用 ld- 前綴，不影響頁面其他元素
  const css = `
/* ld-header */
#ld-header{
  position:fixed;top:0;left:0;right:0;
  view-transition-name:ld-site-header;
  z-index:9990;
  background:rgba(255,255,255,.97);
  border-bottom:1px solid #cfdadd;
  box-shadow:none;
  backdrop-filter:saturate(150%) blur(16px);
  font-family:'Noto Sans TC',sans-serif;
}
:root{--ld-hdr-h:169px}
#ld-header-spacer{display:block;width:100%;height:var(--ld-hdr-h,169px)}
body,body.service-page{padding-top:0!important}

/* Each service owns a distinct accent that continues from its tab into the page. */
body.ld-theme-aircon{--service-accent:#087ea4;--service-accent-dark:#075f7d;--service-soft:#ecfeff;--service-border:#bae6fd;--orange:#087ea4;--orange-dark:#075f7d;--teal:#0891b2;--cream:#ecfeff;--sand:#bae6fd}
body.ld-theme-washer{--service-accent:#6d5bd0;--service-accent-dark:#5142a7;--service-soft:#f5f3ff;--service-border:#ddd6fe;--orange:#6d5bd0;--orange-dark:#5142a7;--teal:#7c3aed;--cream:#f5f3ff;--sand:#ddd6fe}
body.ld-theme-homeclean{--service-accent:#d97706;--service-accent-dark:#a94f08;--service-soft:#fffbeb;--service-border:#fde68a;--orange:#d97706;--orange-dark:#a94f08;--teal:#ca8a04;--cream:#fffbeb;--sand:#fde68a}
body.ld-theme-water-tank{--service-accent:#0284c7;--service-accent-dark:#075985;--service-soft:#f0f9ff;--service-border:#bae6fd;--orange:#0284c7;--orange-dark:#075985;--teal:#0ea5e9;--cream:#f0f9ff;--sand:#bae6fd}
body.ld-theme-pipe-cleaning{--service-accent:#0e7490;--service-accent-dark:#155e75;--service-soft:#ecfeff;--service-border:#a5f3fc;--orange:#0e7490;--orange-dark:#155e75;--teal:#0891b2;--cream:#ecfeff;--sand:#a5f3fc}
body.ld-theme-leak-repair{--service-accent:#0f766e;--service-accent-dark:#115e59;--service-soft:#f0fdfa;--service-border:#99f6e4;--orange:#0f766e;--orange-dark:#115e59;--teal:#0d9488;--cream:#f0fdfa;--sand:#99f6e4}
.ld-top{
  display:flex;align-items:center;
  justify-content:flex-start;
  box-sizing:border-box;height:70px;gap:16px;padding:4px 14px;
  max-width:1280px;margin:0 auto;
}
.ld-brand{
  display:flex;align-items:center;
  gap:10px;text-decoration:none;
  flex:0 1 auto;min-width:0;
}
.ld-logo{
  width:52px;height:52px;
  flex-shrink:0;
}
.ld-logo-img{width:min(44vw,150px);height:auto;max-height:66px;object-fit:contain;flex-shrink:0;display:block;filter:none}
.ld-texts{flex:1;min-width:0}
.ld-name{
  display:block;
  font-size:18px;font-weight:900;
  color:#1e3a8a;white-space:nowrap;
  line-height:1.25;
}
.ld-sub{
  display:block;
  font-size:9px;font-weight:500;
  color:#3b82f6;
  line-height:1.3;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  max-width:220px;
  letter-spacing:-.01em;
}
.ld-line-btn{
  display:flex;align-items:center;gap:5px;
  background:#06C755;color:#ffffff;
  font-weight:800;font-size:13px;
  font-family:'Noto Sans TC',sans-serif;
  min-height:44px;padding:9px 13px;border-radius:14px;
  text-decoration:none;flex-shrink:0;
  white-space:nowrap;
  border:1px solid #05ad4b;box-shadow:0 8px 18px rgba(6,199,85,.24);
}
.ld-line-btn-text{display:none}
.ld-top-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}
.ld-knowledge-link{
  display:flex;align-items:center;gap:6px;min-height:44px;padding:9px 12px;border-radius:14px;
  border:1.5px solid #cbd7db;background:#fff;color:#17324d;text-decoration:none;
  font-size:12px;font-weight:900;white-space:nowrap;
  box-shadow:0 5px 14px rgba(23,50,77,.08);
  transition:border-color .18s,background .18s,transform .18s,box-shadow .18s;
}
.ld-knowledge-link:hover,.ld-knowledge-link.ld-active{border-color:#138a80;background:#edf8f7;transform:translateY(-1px);box-shadow:0 8px 18px rgba(19,138,128,.14)}
.ld-knowledge-link svg{width:18px;height:18px;display:block}
.ld-knowledge-text{display:inline}

/* nav */
.ld-nav{
  background:linear-gradient(180deg,#fbfcfd,#f0f4f5);
  display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;
  padding:6px 10px 8px;
  max-width:100%;margin:0 auto;
}
.ld-tab{
  display:flex;flex-direction:row;
  align-items:center;justify-content:center;gap:5px;
  min-height:42px;padding:7px 5px;border-radius:14px;
  min-width:0;
  background:#ffffff;
  border:1.5px solid #cbd7db;
  box-shadow:0 5px 13px rgba(23,50,77,.075),inset 0 1px 0 rgba(255,255,255,.9);
  text-decoration:none;cursor:pointer;
  transition:background .18s,border-color .18s,transform .18s,box-shadow .18s;
}
.ld-tab--aircon{--tab-accent:#087ea4;--tab-soft:#ecfeff;--tab-on:#cffafe}
.ld-tab--washer{--tab-accent:#6d5bd0;--tab-soft:#f5f3ff;--tab-on:#ede9fe}
.ld-tab--homeclean{--tab-accent:#d97706;--tab-soft:#fffbeb;--tab-on:#fef3c7}
.ld-tab--water-tank{--tab-accent:#0284c7;--tab-soft:#f0f9ff;--tab-on:#e0f2fe}
.ld-tab--pipe-cleaning{--tab-accent:#0e7490;--tab-soft:#ecfeff;--tab-on:#cffafe}
.ld-tab--leak-repair{--tab-accent:#0f766e;--tab-soft:#f0fdfa;--tab-on:#ccfbf1}
.ld-tab:hover{background:var(--tab-soft);border-color:var(--tab-accent);transform:translateY(-2px);box-shadow:0 10px 22px rgba(23,50,77,.13)}
.ld-tab.ld-active{
  background:var(--tab-accent);
  border-color:var(--tab-accent);
  box-shadow:0 9px 22px rgba(23,50,77,.25);
}
.ld-tab-icon{
  width:19px;height:19px;line-height:1;
  display:flex;align-items:center;justify-content:center;color:var(--tab-accent);flex:0 0 auto;
}
.ld-tab-icon svg{display:block;width:100%;height:100%;stroke:currentColor}
.ld-tab-label{
  display:block;
  font-size:14px;font-weight:900;
  font-family:'Noto Sans TC',sans-serif;
  color:#17324d;
  white-space:normal;line-height:1.12;text-align:center;
  flex:0 1 auto;
}
.ld-tab.ld-active .ld-tab-label{color:#ffffff}
.ld-tab.ld-active .ld-tab-icon{color:#fff}

/* ── 錨點補償：fixed header 遮住錨點的修正 ── */
[id]{scroll-margin-top:var(--ld-hdr-h,169px)}

/* float */
#ld-float{
  position:fixed;right:16px;bottom:calc(112px + env(safe-area-inset-bottom));top:auto;
  transform:none;
  z-index:9991;
  width:54px;height:54px;
  border-radius:50%;
  background:#06C755;
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  gap:2px;
  text-decoration:none;
  box-shadow:0 4px 16px rgba(6,199,85,.5);
  animation:ld-pulse 2s ease-in-out infinite;
}
@keyframes ld-pulse{
  0%,100%{box-shadow:0 4px 16px rgba(6,199,85,.5)}
  50%{box-shadow:0 4px 26px rgba(6,199,85,.75),0 0 0 7px rgba(6,199,85,.1)}
}
#ld-float-icon{
  display:block;
  width:26px;height:26px;
}
#ld-float-text{
  display:block;
  font-size:10px;font-weight:700;
  color:#ffffff;
  font-family:'Noto Sans TC',sans-serif;
  line-height:1;
}

/* PC */
@media(min-width:1024px){
  :root{--ld-hdr-h:79px}
  #ld-header{
    display:flex;align-items:center;justify-content:flex-start;
    gap:14px;padding:6px 22px;
  }
  .ld-top{
    flex:0 0 205px;width:205px;height:66px;max-width:none;
    margin:0;padding:0;
  }
  .ld-brand{
    box-sizing:border-box;width:100%;height:66px;min-height:66px;
    justify-content:flex-start;padding:0;
    border:0;border-radius:0;background:transparent;box-shadow:none;
  }
  .ld-logo-img{width:184px;height:auto;max-height:64px;filter:none}
  .ld-nav{
    flex:1 1 auto;width:auto;max-width:none;
    grid-template-columns:repeat(6,minmax(0,1fr));
    margin:0;padding:0;gap:9px;background:transparent;
  }
  .ld-tab{box-sizing:border-box;height:66px;min-height:66px;padding:8px 7px;gap:6px;border-radius:13px;overflow:hidden;position:relative}
  .ld-tab-icon{width:19px;height:19px}
  .ld-tab-label{font-size:16px}
  .ld-tab.ld-active::after{
    content:'';position:absolute;inset:0 auto 0 -42%;width:34%;pointer-events:none;
    background:linear-gradient(105deg,transparent,rgba(255,255,255,.08),rgba(255,255,255,.44),rgba(255,255,255,.08),transparent);
    transform:skewX(-16deg);animation:ld-active-flow 3.2s ease-in-out infinite;
  }
}

@media(min-width:1280px){.ld-tab-label{font-size:17px}.ld-tab-icon{width:20px;height:20px}}
@keyframes ld-active-flow{0%,18%{left:-42%;opacity:0}28%{opacity:1}68%{opacity:1}82%,100%{left:118%;opacity:0}}

@media(min-width:421px) and (max-width:1023px){:root{--ld-hdr-h:175px}}

@media(max-width:420px){
  .ld-top{height:68px;padding:3px 10px;gap:8px}
  .ld-logo-img{width:min(43vw,145px);height:auto;max-height:64px}
  .ld-top-actions{gap:6px}
  .ld-line-btn{min-width:44px;padding:8px 10px}
  .ld-knowledge-link{padding:8px 9px;font-size:11px}
  .ld-nav{grid-template-columns:repeat(3,minmax(0,1fr));padding:5px 8px 7px;gap:5px}
  .ld-tab{min-height:42px;gap:4px;padding:6px 3px}
  .ld-tab-icon{width:16px;height:16px}
  .ld-tab-label{font-size:13.5px}
}

#ld-back-top{position:fixed;right:20px;bottom:calc(180px + env(safe-area-inset-bottom));z-index:9990;width:42px;height:42px;border-radius:50%;background:#1e3a8a;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;box-shadow:0 2px 12px rgba(30,58,138,.35);opacity:0;transform:translateY(8px);transition:opacity .25s,transform .25s;pointer-events:none;}
@media(min-width:1024px){#ld-back-top{bottom:24px}}
@media(max-width:720px){
  #ld-float{display:none!important}
  #ld-back-top{right:14px;bottom:calc(98px + env(safe-area-inset-bottom))}
}
#ld-back-top.ld-show{opacity:1;transform:translateY(0);pointer-events:auto}
#ld-back-top:hover{background:#1d4ed8}

/* Sticky 底部 CTA Bar */
#ld-stickybar{
  position:fixed;left:0;right:0;bottom:0;z-index:9989;
  display:flex;align-items:center;gap:10px;
  background:#ffffff;
  border-top:2px solid #e5e7eb;
  box-shadow:0 -4px 16px rgba(0,0,0,.08);
  padding:10px 14px;
  padding-bottom:calc(10px + env(safe-area-inset-bottom));
}
.ld-sticky-text{flex:1;min-width:0}
.ld-sticky-title{font-size:13px;font-weight:900;color:#111827;line-height:1.3}
.ld-sticky-sub{font-size:10.5px;color:#6b7280;line-height:1.3}
.ld-sticky-btn{
  flex-shrink:0;display:flex;align-items:center;justify-content:center;gap:5px;
  min-height:44px;padding:9px 13px;border-radius:11px;text-decoration:none;
  border:1.5px solid #06C755;background:#06C755;color:#fff;
  font:800 12.5px 'Noto Sans TC',sans-serif;cursor:pointer;
  box-shadow:0 3px 10px rgba(6,199,85,.28);white-space:nowrap;
}
.ld-sticky-actions{display:flex;align-items:center;gap:7px;flex-shrink:0}
.ld-sticky-btn--form{border-color:#cbd7db;background:#fff;color:#17324d;box-shadow:none}
@media(max-width:370px){
  #ld-stickybar{gap:7px;padding-left:9px;padding-right:9px}
  .ld-sticky-text{display:none}
  .ld-sticky-actions{width:100%}
  .ld-sticky-btn{flex:1}
}
@media(max-width:1023px){
  body{padding-bottom:66px}
}
@media(min-width:1024px){
  #ld-stickybar{display:none}
}

/* 快速預約表單 Modal */
#ld-quote-overlay{
  position:fixed;inset:0;z-index:9995;
  background:rgba(17,24,39,.55);
  display:none;align-items:flex-end;justify-content:center;
  padding:0;
  font-family:'Noto Sans TC',sans-serif;
}
#ld-quote-overlay.ld-show{display:flex}
@media(min-width:640px){
  #ld-quote-overlay{align-items:center;padding:20px}
}
#ld-quote-card{
  background:#fff;width:100%;max-width:560px;
  border-radius:18px 18px 0 0;
  max-height:92vh;overflow-y:auto;
  padding:1.4rem 1.3rem calc(1.4rem + env(safe-area-inset-bottom));
  box-shadow:0 -8px 30px rgba(0,0,0,.25);
}
@media(min-width:640px){
  #ld-quote-card{border-radius:18px;max-height:88vh}
}
.ld-q-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:.3rem}
.ld-q-title{font-size:1.15rem;font-weight:900;color:#111827;line-height:1.35}
.ld-q-sub{font-size:.82rem;color:#6b7280;margin-top:.25rem;line-height:1.6}
.ld-q-close{flex-shrink:0;width:32px;height:32px;border-radius:50%;border:none;background:#f3f4f6;color:#374151;font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center}
.ld-q-close:hover{background:#e5e7eb}
.ld-q-field{margin-top:.95rem}
.ld-q-label{display:block;font-size:.83rem;font-weight:700;color:#111827;margin-bottom:.35rem}
.ld-q-label .ld-req{color:#dc2626;margin-left:2px}
.ld-q-input,.ld-q-select{
  width:100%;padding:.7rem .85rem;border:1.5px solid #d1d5db;border-radius:10px;
  font-size:.92rem;font-family:'Noto Sans TC',sans-serif;color:#111827;background:#fff;
}
.ld-q-input:focus,.ld-q-select:focus{outline:none;border-color:#1e3a8a}
.ld-service-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
.ld-service-choice{
  display:flex;align-items:center;gap:10px;width:100%;min-height:64px;padding:10px 12px;
  border:1.5px solid #cbd7db;border-radius:15px;background:linear-gradient(145deg,#fff,#f7f9fa);
  color:#17324d;text-align:left;cursor:pointer;
  box-shadow:0 5px 13px rgba(23,50,77,.07);
  transition:transform .18s,border-color .18s,background .18s,box-shadow .18s;
}
.ld-service-choice:hover{transform:translateY(-2px);border-color:#f28c28;box-shadow:0 10px 22px rgba(23,50,77,.12)}
.ld-service-choice.ld-selected{border-color:#17324d;background:#17324d;color:#fff;box-shadow:0 10px 24px rgba(23,50,77,.24)}
.ld-service-choice:last-child{grid-column:1/-1}
.ld-service-choice-icon{display:flex;align-items:center;justify-content:center;width:34px;height:34px;flex:0 0 auto;border-radius:10px;background:#edf8f7;color:#138a80}
.ld-service-choice-icon svg{width:23px;height:23px;display:block;stroke:currentColor}
.ld-service-choice.ld-selected .ld-service-choice-icon{background:rgba(255,255,255,.14);color:#7ee5da}
.ld-service-choice-label{font-size:.86rem;font-weight:900;line-height:1.35}
.ld-service-choice-check{margin-left:auto;width:18px;height:18px;border:1.5px solid #aebdc2;border-radius:50%;background:#fff;flex:0 0 auto}
.ld-service-choice.ld-selected .ld-service-choice-check{border:5px solid #7ee5da;background:#17324d}
.ld-detail-section[hidden],.ld-add-menu[hidden]{display:none!important}
.ld-detail-toggle[hidden]{display:none!important}
.ld-detail-toggle{width:100%;margin-top:.85rem;min-height:44px;padding:10px 13px;border:1.5px solid var(--service-border,#dce4e7);border-radius:12px;background:#fff;color:#17324d;font:900 .82rem 'Noto Sans TC',sans-serif;cursor:pointer;text-align:left}
.ld-detail-toggle:hover{border-color:var(--service-accent,#138a80);background:var(--service-soft,#edf8f7)}
.ld-detail-section{margin-top:1rem;padding:14px;border:1.5px solid var(--service-border,#dce4e7);border-radius:16px;background:var(--service-soft,#f7fafb)}
.ld-detail-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}
.ld-detail-title{font-size:.88rem;font-weight:900;color:#17324d}
.ld-detail-help{font-size:.72rem;color:#667680;line-height:1.5;margin-top:2px}
.ld-detail-list{display:grid;gap:9px}
.ld-detail-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;gap:8px;align-items:center;padding:10px;border:1px solid #d5e0e3;border-radius:13px;background:#fff;box-shadow:0 4px 12px rgba(23,50,77,.055)}
.ld-detail-main{min-width:0}
.ld-detail-type{width:100%;border:0;background:transparent;color:#17324d;font:800 .86rem 'Noto Sans TC',sans-serif;padding:2px 22px 2px 0;cursor:pointer}
.ld-detail-type:focus{outline:2px solid var(--service-accent,#138a80);outline-offset:3px;border-radius:4px}
.ld-detail-note{font-size:.69rem;color:#667680;line-height:1.45;margin-top:3px}
.ld-qty-control{display:grid;grid-template-columns:30px 42px 30px;align-items:center;border:1px solid #cbd7db;border-radius:10px;overflow:hidden;background:#fff}
.ld-qty-btn{height:34px;border:0;background:#edf3f4;color:#17324d;font-size:1.05rem;font-weight:900;cursor:pointer}
.ld-qty-btn:hover{background:var(--service-soft,#e8f5f3);color:var(--service-accent,#138a80)}
.ld-detail-qty{width:42px;height:34px;border:0;text-align:center;font:800 .85rem 'Noto Sans TC',sans-serif;color:#17324d;-moz-appearance:textfield}
.ld-detail-qty::-webkit-inner-spin-button,.ld-detail-qty::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
.ld-detail-unit{font-size:.72rem;font-weight:800;color:#667680;min-width:18px}
.ld-detail-remove{width:30px;height:30px;border:0;border-radius:9px;background:#fff1f2;color:#be123c;font-size:1rem;cursor:pointer}
.ld-add-detail{width:100%;margin-top:10px;padding:10px 12px;border:1.5px dashed var(--service-accent,#138a80);border-radius:12px;background:#fff;color:var(--service-accent,#138a80);font:900 .82rem 'Noto Sans TC',sans-serif;cursor:pointer}
.ld-add-detail:hover{background:var(--service-soft,#edf8f7)}
.ld-add-menu{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:8px;padding:9px;border-radius:12px;background:#fff;border:1px solid #d5e0e3}
.ld-add-option{padding:9px 8px;border:1px solid #d5e0e3;border-radius:10px;background:#fff;color:#17324d;font:800 .76rem 'Noto Sans TC',sans-serif;cursor:pointer;text-align:left}
.ld-add-option:hover{border-color:var(--service-accent,#138a80);background:var(--service-soft,#edf8f7)}
.ld-q-row{display:grid;grid-template-columns:1fr 1fr;gap:.7rem}
.ld-q-err{color:#dc2626;font-size:.76rem;margin-top:.3rem;display:none}
.ld-q-field.ld-invalid .ld-q-input,.ld-q-field.ld-invalid .ld-q-select{border-color:#dc2626}
.ld-q-field.ld-invalid .ld-service-choices{padding:5px;border:1.5px solid #dc2626;border-radius:18px}
.ld-q-field.ld-invalid .ld-q-err{display:block}
.ld-q-submit{
  width:100%;margin-top:1.3rem;background:#06C755;color:#fff;font-weight:900;font-size:1rem;
  padding:.95rem;border:none;border-radius:12px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;gap:.5rem;
  box-shadow:0 4px 14px rgba(6,199,85,.4);
}
.ld-q-submit:hover{background:#05b34c}
.ld-q-note{font-size:.72rem;color:#9ca3af;text-align:center;margin-top:.65rem;line-height:1.6}
.ld-q-privacy{margin-top:.8rem;padding:.72rem .8rem;border-radius:10px;background:#f7fafb;color:#667680;font-size:.74rem;line-height:1.55;text-align:left}
@media(max-width:390px){
  .ld-service-choices{grid-template-columns:1fr}
  .ld-service-choice:last-child{grid-column:auto}
  .ld-detail-row{grid-template-columns:minmax(0,1fr) auto auto}
  .ld-detail-unit{display:none}
  .ld-add-menu{grid-template-columns:1fr}
}
`;

  // 注入 CSS
  const oldStyle = document.getElementById('ld-style');
  if(oldStyle) oldStyle.remove();
  const style = document.createElement('style');
  style.id = 'ld-style';
  style.textContent = css;
  document.head.appendChild(style);

  // SVG 定義
  const LOGO = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <circle cx="50" cy="50" r="46" fill="#1e3a8a"/>
    <circle cx="50" cy="50" r="46" fill="none" stroke="#93c5fd" stroke-width="2"/>
    <path d="M50 20L56 42L78 48L56 54L50 76L44 54L22 48L44 42Z" fill="#ffffff"/>
    <circle cx="76" cy="24" r="6" fill="#06C755"/>
    <circle cx="76" cy="24" r="2.4" fill="#ffffff"/>
  </svg>`

  const LINE_ICON = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="18" height="18" style="display:block;flex-shrink:0">
    <rect width="48" height="48" rx="10" fill="#fff"/>
    <path d="M40 22.3C40 15 33.3 9 25 9S10 15 10 22.3c0 6.5 5.8 12 13.6 13 .5.1 1.2.4 1.4.9.2.5.1 1.2.1 1.2l-.2 1.5c-.1.5-.4 1.9 1.7.9 2.2-1 11.5-6.8 15.7-11.6 2.9-3.2 4.7-6.5 4.7-10z" fill="#06C755"/>
    <path d="M21.2 19.2h-1.4c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h1.4c.3 0 .5-.2.5-.5v-6.6c0-.3-.2-.5-.5-.5zM28.6 19.2h-1.4c-.3 0-.5.2-.5.5v3.9l-3-4.2-.2-.2H22c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h1.4c.3 0 .5-.2.5-.5v-3.9l3 4.2.2.2h1.5c.3 0 .5-.2.5-.5v-6.6c0-.3-.2-.5-.5-.5zM19.2 24.3h-2.4v-4.7c0-.3-.2-.5-.5-.5h-1.4c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h4.3c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5zM33.8 20.6c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5h-4.3c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h4.3c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5H31v-1h2.8c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5H31v-1h2.8z" fill="#fff"/>
  </svg>`;

  const LINE_FLOAT_ICON = `<svg id="ld-float-icon" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="26" height="26" style="display:block">
    <path d="M40 22.3C40 15 33.3 9 25 9S10 15 10 22.3c0 6.5 5.8 12 13.6 13 .5.1 1.2.4 1.4.9.2.5.1 1.2.1 1.2l-.2 1.5c-.1.5-.4 1.9 1.7.9 2.2-1 11.5-6.8 15.7-11.6 2.9-3.2 4.7-6.5 4.7-10z" fill="#fff"/>
    <path d="M21.2 19.2h-1.4c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h1.4c.3 0 .5-.2.5-.5v-6.6c0-.3-.2-.5-.5-.5zM28.6 19.2h-1.4c-.3 0-.5.2-.5.5v3.9l-3-4.2-.2-.2H22c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h1.4c.3 0 .5-.2.5-.5v-3.9l3 4.2.2.2h1.5c.3 0 .5-.2.5-.5v-6.6c0-.3-.2-.5-.5-.5zM19.2 24.3h-2.4v-4.7c0-.3-.2-.5-.5-.5h-1.4c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h4.3c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5zM33.8 20.6c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5h-4.3c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h4.3c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5H31v-1h2.8c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5H31v-1h2.8z" fill="#06C755"/>
  </svg>`;

  function craftIcon(id){ return '<svg class="craft-icon" aria-hidden="true"><use href="/assets/icons.svg#' + id + '"></use></svg>'; }
  const NAV_ICONS = {
    aircon:craftIcon('aircon'),
    washer:craftIcon('washer'),
    homeclean:craftIcon('homeclean'),
    water:craftIcon('droplet'),
    pipe:craftIcon('tools'),
    leak:craftIcon('leak'),
    knowledge:craftIcon('book'),
    other:'<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>'
  };

  // 頁籤
  const tabs = [
    {id:'aircon', href:'aircon.html', icon:NAV_ICONS.aircon, label:'冷氣清洗'},
    {id:'washer', href:'washer.html', icon:NAV_ICONS.washer, label:'洗衣機清洗'},
    {id:'homeclean', href:'homeclean.html', icon:NAV_ICONS.homeclean, label:'居家清潔'},
    {id:'water-tank', href:'water-tank.html', icon:NAV_ICONS.water, label:'水塔清洗'},
    {id:'pipe-cleaning', href:'pipe-cleaning.html', icon:NAV_ICONS.pipe, label:'水管清洗'},
    {id:'leak-repair', href:'leak-repair.html', icon:NAV_ICONS.leak, label:'漏水檢測與修補'},
  ];

  const tabsHTML = tabs.map(t =>
    `<a href="/${t.href}" class="ld-tab ld-tab--${t.id}${t.id===activePage?' ld-active':''}">
      <span class="ld-tab-icon">${t.icon}</span>
      <span class="ld-tab-label">${t.label}</span>
    </a>`
  ).join('');
  const SERVICE_CHOICE_ICONS = [NAV_ICONS.aircon,NAV_ICONS.washer,NAV_ICONS.homeclean,NAV_ICONS.water,NAV_ICONS.pipe,NAV_ICONS.leak,NAV_ICONS.other];

  const html = `
    <a id="ld-float" href="${LINE}" target="_blank" rel="noopener">
      ${LINE_FLOAT_ICON}
      <span id="ld-float-text">LINE</span>
    </a>
    <header id="ld-header">
      <div class="ld-top">
        <a class="ld-brand" href="/" aria-label="灰汰郎｜冷氣清洗・洗衣機清洗・居家清潔・水塔清洗・水管清洗・漏水檢測與修補">
          <picture>
            <source srcset="/logo/logos/logo-master-transparent.webp" type="image/webp">
            <img class="ld-logo-img" src="/logo/logos/logo-master-transparent.png" alt="灰汰郎 清潔公司" width="660" height="295">
          </picture>
        </a>
      </div>
      <nav class="ld-nav">${tabsHTML}</nav>
    </header>
    <div id="ld-header-spacer" aria-hidden="true"></div>
    <button id="ld-back-top" onclick="window.scrollTo({top:0,behavior:\'smooth\'})" title="回到頂部">↑</button>
    <div id="ld-stickybar">
      <div class="ld-sticky-text">
        <div class="ld-sticky-title">需要估價或先問問題？</div>
        <div class="ld-sticky-sub">直接問，或用 1 分鐘整理需求</div>
      </div>
      <div class="ld-sticky-actions">
        <a class="ld-sticky-btn" href="${LINE}" target="_blank" rel="noopener" data-line-direct="mobile-sticky">LINE 直接問</a>
        <button type="button" class="ld-sticky-btn ld-sticky-btn--form" onclick="ldOpenQuote()">填單估價</button>
      </div>
    </div>
    <div id="ld-quote-overlay">
      <div id="ld-quote-card" role="dialog" aria-modal="true" aria-labelledby="ld-q-title">
        <div class="ld-q-head">
          <div>
            <div class="ld-q-title" id="ld-q-title">LINE 預約估價</div>
            <div class="ld-q-sub">填寫基本資料，送出後開啟 LINE 傳送給我們，客服會盡快回覆報價</div>
          </div>
          <button type="button" class="ld-q-close" onclick="ldCloseQuote()" aria-label="關閉">✕</button>
        </div>
        <form id="ld-q-form" novalidate>
          <div class="ld-q-field" id="ld-f-name">
            <label class="ld-q-label" for="ld-q-name">姓名<span class="ld-req">*</span></label>
            <input class="ld-q-input" id="ld-q-name" type="text" placeholder="您的稱呼" autocomplete="name">
            <div class="ld-q-err">請輸入姓名</div>
          </div>
          <div class="ld-q-field" id="ld-f-phone">
            <label class="ld-q-label" for="ld-q-phone">電話<span class="ld-req">*</span></label>
            <input class="ld-q-input" id="ld-q-phone" type="tel" placeholder="0912-345-678" autocomplete="tel" inputmode="tel">
            <div class="ld-q-err">請輸入正確的聯絡電話</div>
          </div>
          <div class="ld-q-field" id="ld-f-addr">
            <label class="ld-q-label" for="ld-q-addr">服務地區（選填）</label>
            <input class="ld-q-input" id="ld-q-addr" type="text" placeholder="例如：台北市中山區，完整地址可稍後提供" autocomplete="address-level2">
          </div>
          <div class="ld-q-field" id="ld-f-service">
            <div class="ld-q-label" id="ld-q-service-label">選擇服務<span class="ld-req">*</span></div>
            <div class="ld-service-choices" role="radiogroup" aria-labelledby="ld-q-service-label">
              ${SERVICE_OPTIONS.map((s,i)=>`<button type="button" class="ld-service-choice" data-service="${s}" aria-pressed="false"><span class="ld-service-choice-icon">${SERVICE_CHOICE_ICONS[i]}</span><span class="ld-service-choice-label">${s==='其他（請於下方說明）'?'其他需求':s}</span><span class="ld-service-choice-check" aria-hidden="true"></span></button>`).join('')}
            </div>
            <input type="hidden" id="ld-q-service" value="">
            <div class="ld-q-err">請選擇服務項目</div>
          </div>
          <button type="button" class="ld-detail-toggle" id="ld-detail-toggle" aria-expanded="false" hidden>＋ 補充機型／數量（選填）</button>
          <div class="ld-detail-section" id="ld-q-detail-section" hidden>
            <div class="ld-detail-head">
              <div>
                <div class="ld-detail-title">服務內容與數量</div>
                <div class="ld-detail-help">已放入最常見項目；可直接改類型，或按＋增加其他設備／項目。</div>
              </div>
            </div>
            <div class="ld-detail-list" id="ld-q-detail-list"></div>
            <button type="button" class="ld-add-detail" id="ld-add-detail" aria-expanded="false">＋ 增加其他設備／項目</button>
            <div class="ld-add-menu" id="ld-add-menu" hidden></div>
          </div>
          <div class="ld-q-field">
            <label class="ld-q-label">希望日期與時間</label>
            <div class="ld-q-row">
              <input class="ld-q-input" id="ld-q-date" type="date">
              <select class="ld-q-select" id="ld-q-time">
                <option value="">希望時段（可不填）</option>
                <option value="上午 9:00-12:00">上午 9:00-12:00</option>
                <option value="下午 13:00-17:00">下午 13:00-17:00</option>
                <option value="傍晚 17:00-19:00">傍晚 17:00-19:00</option>
                <option value="晚上 19:00-21:00">晚上 19:00-21:00</option>
                <option value="時間皆可">時間皆可</option>
              </select>
            </div>
          </div>
          <div class="ld-q-field">
            <label class="ld-q-label" for="ld-q-note">現場狀況或其他需求</label>
            <textarea class="ld-q-input" id="ld-q-note" rows="3" placeholder="例如：冷氣漏水、機型、樓層、停車或希望處理的範圍"></textarea>
          </div>
          <div class="ld-q-privacy">資料僅用於本次服務聯繫，不會公開；完整地址可於確認預約前再提供。</div>
          <button type="submit" class="ld-q-submit">送出並開啟 LINE</button>
          <div class="ld-q-note">送出後會開啟 LINE，訊息已幫您填好，再按一下「傳送」即可完成預約估價，純諮詢完全免費</div>
        </form>
      </div>
    </div>`;

  // 移除舊版 header
  ['ld-header','ld-header-spacer','site-header','ld-float','ld-join','hdr-float','float-line'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.remove();
  });

  document.body.insertAdjacentHTML('afterbegin', html);

  const mergedLeakTargets = {
    cases:'cases-carousel', team:'team-carousel', areas:'service-area',
    taipei:'service-area', 'new-taipei':'service-area', keelung:'service-area',
    taoyuan:'service-area', hsinchu:'service-area', miaoli:'service-area', taichung:'service-area'
  };
  if(mergedLeakTargets[page]){
    const firstContent = document.querySelector('main, body > section');
    if(firstContent){
      firstContent.insertAdjacentHTML('beforebegin', `<aside class="legacy-merge-notice"><div><strong>此內容已整合到「漏水檢測與修補」</strong><span>施工案例、專業人員與服務地區現在集中在同一頁，查找資訊更清楚。</span></div><a href="/leak-repair.html#${mergedLeakTargets[page]}">前往整合頁面 →</a></aside>`);
    }
  }

  const SERVICE_STORIES = {
    aircon:{
      title:'冷氣清洗先看三張圖',
      cards:[
        {tag:'為什麼需要洗',title:'髒污常藏在濾網後面',text:'蒸發器、風鼓、集水盤與排水管累積灰塵後，容易出現異味、風量變小或滴水。',image:'/assets/optimized/aircon-dirt-map-sm.webp',fallback:'/assets/optimized/aircon-dirt-map-sm.jpg'},
        {tag:'怎麼洗',title:'打開面板清到風鼓與排水',text:'清洗前先保護現場，再依機型拆洗濾網、蒸發器、風鼓、集水盤與排水管。',image:'/assets/service-story/aircon-service-story-20260714.webp',fallback:'/assets/service-story/aircon-service-story-20260714.jpg'},
        {tag:'清洗前後案例',title:'確認風量、異味與排水',text:'復原後檢查出風、排水與運轉狀況，避免只看外觀就結束。',image:'/assets/optimized/aircon-leak-guide-sm.webp',fallback:'/assets/optimized/aircon-leak-guide-sm.jpg'}
      ]
    },
    washer:{
      title:'洗衣機清洗先看三張圖',
      cards:[
        {tag:'為什麼需要洗',title:'內外槽夾層才是異味來源',text:'洗劑殘留、棉絮、皮屑與潮濕霉斑常堆在槽背，看起來乾淨也可能有黑屑。',image:'/assets/optimized/washer-dirt-source-sm.webp',fallback:'/assets/optimized/washer-dirt-source-sm.jpg',fit:'contain',width:733,height:1100},
        {tag:'怎麼洗',title:'拆出內槽才看得到槽背',text:'直立式與滾筒式結構不同，會先看品牌、容量、安裝空間，再安排可拆洗範圍。',image:'/assets/service-story/washer-service-story-20260714.webp',fallback:'/assets/service-story/washer-service-story-20260714.jpg'},
        {tag:'完工確認',title:'組裝後要試運轉',text:'清洗後會復原部件並確認進水、排水與脫水，讓機器回到可正常使用的狀態。',image:'/assets/optimized/washer-hidden-dirt-sm.webp',fallback:'/assets/optimized/washer-hidden-dirt-sm.jpg'}
      ]
    },
    homeclean:{
      title:'居家清潔先看三張圖',
      cards:[
        {tag:'為什麼需要洗',title:'油污、水垢與落塵要分區處理',text:'廚房、浴室、地面與高處灰塵的工具不同，先分區才不會重複污染。',image:'/assets/service-story/homeclean-service-story-20260714.webp',fallback:'/assets/service-story/homeclean-service-story-20260714.jpg'},
        {tag:'怎麼洗',title:'由高到低、由乾到濕',text:'先確認範圍、材質與重點區域，再安排除塵、去油、水垢與地面整理。',image:'/assets/optimized/homeclean-service-og-20260713-sm.webp',fallback:'/assets/optimized/homeclean-service-og-20260713-sm.jpg'},
        {tag:'清洗前後案例',title:'重點區域整理後更好維持',text:'廚房、浴室與地面依髒污分開處理，完工時確認容易忽略的角落與接縫。',image:'/cases-clean/case01-after.webp',fallback:'/cases-clean/case01-after.jpg'}
      ]
    },
    'water-tank':{
      title:'水塔清洗先看三張圖',
      cards:[
        {tag:'為什麼需要洗',title:'蓄水容器會累積沉積物',text:'屋頂水塔、塑膠水塔、水泥水塔與地下蓄水池，都要先看容量與內部狀況。',image:'/assets/service-story/water-tank-service-story-20260714.webp',fallback:'/assets/service-story/water-tank-service-story-20260714.jpg'},
        {tag:'怎麼洗',title:'停水、排水、復水要有順序',text:'上下水塔、加壓馬達與排水點會影響施工安排，報價前要先看照片。',image:'/assets/optimized/water-tank-system-sm.webp',fallback:'/assets/optimized/water-tank-system-sm.jpg',fit:'contain',width:733,height:1100},
        {tag:'清洗前後案例',title:'內壁清潔與復水確認',text:'清洗後會確認水塔內壁、排水狀況與復水流程，降低沉積物再次進入用水端。',image:'/assets/optimized/water-tank-hero-sm.webp',fallback:'/assets/optimized/water-tank-hero-sm.jpg'}
      ]
    },
    'pipe-cleaning':{
      title:'水管清洗先看三張圖',
      cards:[
        {tag:'為什麼需要洗',title:'黃水、異味、水量變小要先分類',text:'原因可能來自水塔、管材、熱水器或閥件，不一定全都適合直接清洗。',image:'/assets/service-story/pipe-cleaning-service-story-20260714.webp',fallback:'/assets/service-story/pipe-cleaning-service-story-20260714.jpg'},
        {tag:'怎麼洗',title:'先判斷管材與屋齡',text:'水管清洗可改善沉積，但老舊管線去除堵塞後可能讓滲漏更明顯。',image:'/assets/optimized/pipe-cleaning-effects-sm.webp',fallback:'/assets/optimized/pipe-cleaning-effects-sm.jpg',fit:'contain',width:733,height:1100},
        {tag:'清洗前後案例',title:'前後水色與水量一起確認',text:'完工時會觀察出水狀況、水量變化與濾網沉積，協助判斷是否還需要檢修。',image:'/assets/optimized/pipe-cleaning-hero-sm.webp',fallback:'/assets/optimized/pipe-cleaning-hero-sm.jpg'}
      ]
    },
    'leak-repair':{
      title:'漏水檢測先看三張圖',
      cards:[
        {tag:'為什麼需要檢測',title:'水痕不等於漏點',text:'牆面、天花、窗框或浴室滲水，需要先縮小範圍，避免盲目施工。',image:'/assets/optimized/leak-detection-methods-sm.webp',fallback:'/assets/optimized/leak-detection-methods-sm.jpg'},
        {tag:'怎麼查',title:'用現象與工具交叉判斷',text:'熱像、水分、色素或局部拆檢會依現場條件選用，不用同一套答案套所有漏水。',image:'/assets/service-story/leak-repair-service-story-20260714.webp',fallback:'/assets/service-story/leak-repair-service-story-20260714.jpg'},
        {tag:'修補案例',title:'找到源頭再選工法',text:'檢測、灌注、防水或重做防水層的價格差很多，先判斷才能避免修錯。',image:'/assets/optimized/home-leak-knowledge-sm.webp',fallback:'/assets/optimized/home-leak-knowledge-sm.jpg'}
      ]
    }
  };

  function renderServiceStory(){
    const config = SERVICE_STORIES[activePage];
    if(!config || document.querySelector('.service-story')) return;
    const hero = document.getElementById('page-hero') || (page === 'leak-repair' ? document.getElementById('hero') : null);
    if(!hero){
      if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderServiceStory, {once:true});
      return;
    }
    const cards = config.cards.map(function(card, index){
      const fallback = card.fallback || card.image;
      const loading = index === 0 ? 'eager' : 'lazy';
      const priority = index === 0 ? ' fetchpriority="high"' : '';
      const mediaClass = card.fit === 'contain' ? ' service-story-media--contain' : '';
      const imageWidth = card.width || 1200;
      const imageHeight = card.height || 675;
      return '<article class="service-story-card">' +
        '<div class="service-story-media' + mediaClass + '">' +
          '<picture><source srcset="' + card.image + '" type="image/webp"><img src="' + fallback + '" alt="' + card.title + '" loading="' + loading + '" decoding="async"' + priority + ' width="' + imageWidth + '" height="' + imageHeight + '"></picture>' +
        '</div>' +
        '<div class="service-story-copy"><span class="service-story-tag">' + card.tag + '</span><h3>' + card.title + '</h3><p>' + card.text + '</p></div>' +
      '</article>';
    }).join('');
    const dots = config.cards.map(function(card, index){
      return '<button type="button" class="service-story-dot' + (index === 0 ? ' is-active' : '') + '" data-story-index="' + index + '" aria-label="切換到第 ' + (index + 1) + ' 張"></button>';
    }).join('');
    hero.insertAdjacentHTML('afterend',
      '<section class="service-story" aria-label="' + config.title + '">' +
        '<div class="service-story-inner">' +
          '<div class="service-story-head"><div><div class="service-story-kicker">服務圖解</div><h2 class="service-story-title">' + config.title + '</h2></div>' +
          '<div class="service-story-controls"><button type="button" class="service-story-btn" data-story-dir="-1" aria-label="上一張">‹</button><button type="button" class="service-story-btn" data-story-dir="1" aria-label="下一張">›</button></div></div>' +
          '<div class="service-story-track" tabindex="0">' + cards + '</div>' +
          '<div class="service-story-dots" aria-hidden="true">' + dots + '</div>' +
        '</div>' +
      '</section>');
    const story = hero.nextElementSibling;
    const track = story && story.querySelector('.service-story-track');
    const storyCards = track ? Array.from(track.querySelectorAll('.service-story-card')) : [];
    const storyDots = story ? Array.from(story.querySelectorAll('.service-story-dot')) : [];
    let storyIndex = 0;
    let storyTimer = null;
    function setStoryIndex(index){
      if(!storyCards.length) return;
      storyIndex = (index + storyCards.length) % storyCards.length;
      const target = storyCards[storyIndex];
      try{
        track.scrollTo({left: target.offsetLeft - track.offsetLeft, behavior:'smooth'});
      }catch(error){
        track.scrollLeft = target.offsetLeft - track.offsetLeft;
      }
      storyDots.forEach(function(dot, dotIndex){
        dot.classList.toggle('is-active', dotIndex === storyIndex);
      });
    }
    function syncStoryIndex(){
      if(!track || !storyCards.length) return;
      let nearest = 0;
      let best = Infinity;
      storyCards.forEach(function(card, index){
        const distance = Math.abs(card.offsetLeft - track.offsetLeft - track.scrollLeft);
        if(distance < best){ best = distance; nearest = index; }
      });
      storyIndex = nearest;
      storyDots.forEach(function(dot, dotIndex){
        dot.classList.toggle('is-active', dotIndex === storyIndex);
      });
    }
    function startStoryAuto(){
      if(!track || storyCards.length < 2 || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
      stopStoryAuto();
      storyTimer = window.setInterval(function(){ setStoryIndex(storyIndex + 1); }, 4000);
    }
    function stopStoryAuto(){
      if(storyTimer){ window.clearInterval(storyTimer); storyTimer = null; }
    }
    story && story.querySelectorAll('.service-story-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        if(!track || !storyCards.length) return;
        const dir = Number(btn.getAttribute('data-story-dir') || 1);
        stopStoryAuto();
        setStoryIndex(storyIndex + dir);
        startStoryAuto();
      });
    });
    storyDots.forEach(function(dot){
      dot.addEventListener('click', function(){
        stopStoryAuto();
        setStoryIndex(Number(dot.getAttribute('data-story-index') || 0));
        startStoryAuto();
      });
    });
    if(track){
      let scrollTimer = null;
      track.addEventListener('scroll', function(){
        if(scrollTimer) window.clearTimeout(scrollTimer);
        scrollTimer = window.setTimeout(syncStoryIndex, 80);
      }, {passive:true});
      ['pointerdown','touchstart','mouseenter','focusin'].forEach(function(eventName){
        track.addEventListener(eventName, stopStoryAuto, {passive:true});
      });
      ['pointerup','touchend','mouseleave','focusout'].forEach(function(eventName){
        track.addEventListener(eventName, startStoryAuto, {passive:true});
      });
      startStoryAuto();
    }
  }
  renderServiceStory();

  function enhancePriceTables(){
    document.querySelectorAll('.price-table').forEach(function(table){
      const headers = Array.from(table.querySelectorAll('tr:first-child th')).map(function(th){
        return th.textContent.trim();
      });
      if(!headers.length) return;
      Array.from(table.querySelectorAll('tr')).slice(1).forEach(function(row){
        Array.from(row.children).forEach(function(cell, index){
          if(headers[index]) cell.setAttribute('data-label', headers[index]);
        });
      });
    });
  }
  enhancePriceTables();
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', enhancePriceTables, {once:true});
  }

  // Fixed Header 的等高 spacer 避免內容被遮住，並同步頁內錨點高度。
  function setOffset(){
    var hdrEl = document.getElementById('ld-header');
    if(hdrEl){
      var hh = hdrEl.offsetHeight;
      if(hh > 0 && hh < 240){
        document.documentElement.style.setProperty('--ld-hdr-h', hh + 'px');
        var spacer = document.getElementById('ld-header-spacer');
        if(spacer) spacer.style.height = hh + 'px';
      }
    }
  }
  setOffset();
  window.addEventListener('resize', setOffset);
  if(window.ResizeObserver){
    const headerObserver = new ResizeObserver(setOffset);
    const observedHeader = document.getElementById('ld-header');
    if(observedHeader) headerObserver.observe(observedHeader);
  }
  // 多個時機確保字體載入後重新計算 header 高度
  setTimeout(setOffset, 50);
  setTimeout(setOffset, 200);
  setTimeout(setOffset, 500);
  setTimeout(setOffset, 1000);
  window.addEventListener('load', function(){ setOffset(); setTimeout(setOffset, 200); });
  // 字體載入完成也更新
  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(function(){ setOffset(); });
  }


  // 回到頂部按鈕顯示控制
  window.addEventListener('scroll', function(){
    const btn = document.getElementById('ld-back-top');
    if(btn) btn.classList.toggle('ld-show', window.scrollY > 400);
  }, {passive:true});

  // ── 快速預約表單 ──
  const qOverlay = document.getElementById('ld-quote-overlay');
  const qForm = document.getElementById('ld-q-form');
  const qDate = document.getElementById('ld-q-date');
  const qService = document.getElementById('ld-q-service');
  const qServiceButtons = Array.from(document.querySelectorAll('.ld-service-choice'));
  const qDetailToggle = document.getElementById('ld-detail-toggle');
  const qDetailSection = document.getElementById('ld-q-detail-section');
  const qDetailList = document.getElementById('ld-q-detail-list');
  const qAddDetail = document.getElementById('ld-add-detail');
  const qAddMenu = document.getElementById('ld-add-menu');
  let detailsExpanded = false;

  function setDetailsExpanded(expanded){
    detailsExpanded = Boolean(expanded && qDetailList && qDetailList.children.length);
    if(qDetailSection) qDetailSection.hidden = !detailsExpanded;
    if(qDetailToggle){
      qDetailToggle.setAttribute('aria-expanded', detailsExpanded ? 'true' : 'false');
      qDetailToggle.textContent = detailsExpanded ? '收合機型／數量' : '＋ 補充機型／數量（選填）';
    }
  }

  function detailCatalog(service){
    return SERVICE_DETAIL_CATALOG[service] || [];
  }
  function updateDetailRow(row, catalog){
    const selected = catalog.find(function(item){ return item.id === row.querySelector('.ld-detail-type').value; }) || catalog[0];
    if(!selected) return;
    row.querySelector('.ld-detail-note').textContent = selected.note;
    row.querySelector('.ld-detail-unit').textContent = selected.unit;
  }
  function addDetailRow(service, itemId, removable){
    const catalog = detailCatalog(service);
    if(!qDetailList || !catalog.length) return;
    const selected = catalog.find(function(item){ return item.id === itemId; }) || catalog[0];
    const row = document.createElement('div');
    row.className = 'ld-detail-row';
    row.innerHTML = '<div class="ld-detail-main">' +
      '<select class="ld-detail-type" aria-label="服務類型">' + catalog.map(function(item){ return '<option value="' + item.id + '"' + (item.id === selected.id ? ' selected' : '') + '>' + item.label + '</option>'; }).join('') + '</select>' +
      '<div class="ld-detail-note"></div></div>' +
      '<div class="ld-qty-control"><button type="button" class="ld-qty-btn" data-step="-1" aria-label="減少數量">−</button><input class="ld-detail-qty" type="number" min="1" max="20" value="1" inputmode="numeric" aria-label="數量"><button type="button" class="ld-qty-btn" data-step="1" aria-label="增加數量">＋</button></div>' +
      '<span class="ld-detail-unit"></span>' +
      (removable ? '<button type="button" class="ld-detail-remove" aria-label="移除此項">✕</button>' : '');
    qDetailList.appendChild(row);
    updateDetailRow(row, catalog);
    row.querySelector('.ld-detail-type').addEventListener('change', function(){ updateDetailRow(row, catalog); });
    row.querySelectorAll('.ld-qty-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        const input = row.querySelector('.ld-detail-qty');
        const next = Math.max(1, Math.min(20, Number(input.value || 1) + Number(btn.getAttribute('data-step'))));
        input.value = String(next);
      });
    });
    const remove = row.querySelector('.ld-detail-remove');
    if(remove) remove.addEventListener('click', function(){ row.remove(); });
  }
  function renderAddMenu(service){
    const catalog = detailCatalog(service);
    if(!qAddMenu) return;
    qAddMenu.innerHTML = catalog.map(function(item){ return '<button type="button" class="ld-add-option" data-item="' + item.id + '">＋ ' + item.label + '</button>'; }).join('');
    qAddMenu.querySelectorAll('.ld-add-option').forEach(function(btn){
      btn.addEventListener('click', function(){
        addDetailRow(service, btn.getAttribute('data-item'), true);
        qAddMenu.hidden = true;
        if(qAddDetail) qAddDetail.setAttribute('aria-expanded','false');
      });
    });
  }
  function renderServiceDetails(service){
    const catalog = detailCatalog(service);
    if(!qDetailSection || !qDetailList) return;
    qDetailList.innerHTML = '';
    if(qDetailToggle) qDetailToggle.hidden = !catalog.length;
    if(!catalog.length){ setDetailsExpanded(false); return; }
    addDetailRow(service, catalog[0].id, false);
    renderAddMenu(service);
    if(qAddMenu) qAddMenu.hidden = true;
    if(qAddDetail) qAddDetail.setAttribute('aria-expanded','false');
    setDetailsExpanded(false);
  }
  if(qDetailToggle){
    qDetailToggle.addEventListener('click', function(){ setDetailsExpanded(!detailsExpanded); });
  }
  if(qAddDetail){
    qAddDetail.addEventListener('click', function(){
      if(!qAddMenu) return;
      qAddMenu.hidden = !qAddMenu.hidden;
      qAddDetail.setAttribute('aria-expanded', qAddMenu.hidden ? 'false' : 'true');
    });
  }
  function selectService(value){
    const changed = qService && qService.value !== value;
    if(qService) qService.value = value || '';
    qServiceButtons.forEach(function(btn){
      const selected = btn.getAttribute('data-service') === value;
      btn.classList.toggle('ld-selected', selected);
      btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
    if(changed || (qDetailList && !qDetailList.children.length)) renderServiceDetails(value);
    if(value) setFieldValid('ld-f-service', true);
  }
  qServiceButtons.forEach(function(btn){
    btn.addEventListener('click', function(){ selectService(btn.getAttribute('data-service') || ''); });
  });
  if(qDate){
    const today = new Date();
    qDate.min = today.toISOString().slice(0,10);
  }
  let qHistoryOpen = false;
  let qPendingNavigation = '';
  function hideQuote(){
    if(!qOverlay) return;
    qOverlay.classList.remove('ld-show');
    document.body.style.overflow = '';
  }

  window.ldOpenQuote = function(serviceKey){
    if(!qOverlay) return;
    const preset = (serviceKey && PAGE_SERVICE[serviceKey]) || PAGE_SERVICE[page] || '';
    if(preset) selectService(preset);
    if(!isLineWebView && !qOverlay.classList.contains('ld-show')){
      try{
        history.pushState({ldQuote:true}, '', location.href);
        qHistoryOpen = true;
      }catch(error){
        qHistoryOpen = false;
      }
    }else{
      qHistoryOpen = false;
    }
    qOverlay.classList.add('ld-show');
    document.body.style.overflow = 'hidden';
    ldTrack('quote_open', { service: serviceKey || page, page: location.pathname });
  };

  window.ldCloseQuote = function(){
    if(!qOverlay) return;
    if(qHistoryOpen){
      history.back();
      return;
    }
    hideQuote();
  };

  window.addEventListener('popstate', function(){
    if(qOverlay && qOverlay.classList.contains('ld-show')) hideQuote();
    qHistoryOpen = false;
    if(qPendingNavigation){
      const target = qPendingNavigation;
      qPendingNavigation = '';
      window.location.href = target;
    }
  });

  if(qOverlay){
    qOverlay.addEventListener('click', function(e){
      if(e.target === qOverlay) ldCloseQuote();
    });
  }
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') ldCloseQuote();
  });

  function setFieldValid(id, valid){
    const el = document.getElementById(id);
    if(el) el.classList.toggle('ld-invalid', !valid);
  }

  function collectServiceDetails(service){
    const catalog = detailCatalog(service);
    if(!detailsExpanded || !qDetailList || !catalog.length) return [];
    return Array.from(qDetailList.querySelectorAll('.ld-detail-row')).map(function(row){
      const item = catalog.find(function(entry){ return entry.id === row.querySelector('.ld-detail-type').value; });
      const quantity = Math.max(1, Number(row.querySelector('.ld-detail-qty').value || 1));
      return item ? item.label + ' × ' + quantity + item.unit + '（' + item.note + '）' : '';
    }).filter(Boolean);
  }

  if(qForm){
    qForm.addEventListener('submit', function(e){
      e.preventDefault();
      const name = document.getElementById('ld-q-name').value.trim();
      const phone = document.getElementById('ld-q-phone').value.trim();
      const addr = document.getElementById('ld-q-addr').value.trim();
      const service = document.getElementById('ld-q-service').value;
      const date = document.getElementById('ld-q-date').value;
      const time = document.getElementById('ld-q-time').value;
      const note = document.getElementById('ld-q-note').value.trim();

      const phoneOk = /^[0-9+\-\s()]{8,}$/.test(phone);

      let valid = true;
      if(!name){ setFieldValid('ld-f-name', false); valid = false; } else setFieldValid('ld-f-name', true);
      if(!phoneOk){ setFieldValid('ld-f-phone', false); valid = false; } else setFieldValid('ld-f-phone', true);
      if(!service){ setFieldValid('ld-f-service', false); valid = false; } else setFieldValid('ld-f-service', true);
      if(!valid) return;

      let dateLabel = '未指定';
      if(date){
        const d = new Date(date + 'T00:00:00');
        dateLabel = (d.getMonth()+1) + '/' + d.getDate() + '（' + '日一二三四五六'[d.getDay()] + '）';
      }
      const timeLabel = time || '未指定';

      const guideSummary = typeof window.ldLeakGuideSummary === 'string' ? window.ldLeakGuideSummary.trim() : '';
      const serviceDetails = collectServiceDetails(service);
      const msgLines = [
        '【灰汰郎 到府服務詢價】',
        '姓名：' + name,
        '電話：' + phone,
        '服務項目：' + service,
        '希望日期：' + dateLabel,
        '希望時段：' + timeLabel
      ];
      if(addr) msgLines.splice(3, 0, '服務地址：' + addr);
      serviceDetails.forEach(function(detail){ msgLines.push('服務內容：' + detail); });
      if(note) msgLines.push('現場狀況／備註：' + note);
      if(guideSummary) msgLines.push('漏水判讀摘要：' + guideSummary);
      const msg = msgLines.join('\n');

      ldTrack('quote_submit', { service: service, page: location.pathname });
      const url = 'https://line.me/R/oaMessage/' + LINE_OA_ID + '/?' + encodeURIComponent(msg);
      hideQuote();
      if(qHistoryOpen){
        qPendingNavigation = url;
        history.back();
      }else{
        window.location.href = url;
      }
    });
  }
  }
  if(document.body){ ldInit(); }
  else { document.addEventListener('DOMContentLoaded', ldInit); }
})();
