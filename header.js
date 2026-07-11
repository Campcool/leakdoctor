(function(){
  function ldInit(){
  const path = location.pathname.split('/').pop() || 'index.html';
  const page = path.replace('.html','') || 'index';
  const leakSubPages = ['cases','team','areas','leak-guide','taipei','new-taipei','keelung','taoyuan','hsinchu','miaoli','taichung'];
  const activePage = leakSubPages.indexOf(page) !== -1 ? 'leak-repair' : page;
  const LINE = 'https://lin.ee/WVxmY65';
  const JOIN_FORM = 'https://forms.gle/T4UTULXMaXaoGZQG8';
  const LINE_OA_ID = '@478xvlgl';

  // ── 分析追蹤：把下面的 G-XXXXXXXXXX 換成你的 GA4 評估 ID 即自動啟用 ──
  const GA4_ID = 'G-XXXXXXXXXX';
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
  const SVC_PAGES = {'/aircon.html':'aircon','/washer.html':'washer','/homeclean.html':'homeclean','/leak-repair.html':'leak-repair'};
  const AREA_PAGES = ['/taipei.html','/new-taipei.html','/keelung.html','/taoyuan.html','/hsinchu.html','/miaoli.html','/taichung.html','/areas.html'];
  // 全站點擊追蹤：LINE 連結與電話
  document.addEventListener('click', function(e){
    const a = e.target.closest && e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (href.indexOf('lin.ee') !== -1 || href.indexOf('line.me') !== -1) {
      ldTrack('line_click', { link_url: href, page: location.pathname });
    } else {
      const clean = href.split('#')[0].split('?')[0];
      const path = clean.charAt(0) === '/' ? clean : '/' + clean.split('/').pop();
      if (SVC_PAGES[path]) ldTrack('service_click', { service: SVC_PAGES[path], page: location.pathname });
      else if (AREA_PAGES.indexOf(path) !== -1) ldTrack('area_click', { area: path.replace('/','').replace('.html',''), page: location.pathname });
    }
  }, true);

  const SERVICE_OPTIONS = ['冷氣清洗','洗衣機清洗','居家清潔','漏水檢測與修補','其他（請於下方說明）'];
  const PAGE_SERVICE = {aircon:'冷氣清洗', washer:'洗衣機清洗', homeclean:'居家清潔', 'leak-repair':'漏水檢測與修補'};

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

  // CSS：全部用 ld- 前綴，不影響頁面其他元素
  const css = `
/* ld-header */
#ld-header{
  position:sticky;top:0;
  view-transition-name:ld-site-header;
  z-index:9990;
  background:rgba(255,255,255,.97);
  border-bottom:1px solid #cfdadd;
  box-shadow:none;
  backdrop-filter:saturate(150%) blur(16px);
  font-family:'Noto Sans TC',sans-serif;
}
body,body.service-page{padding-top:0!important}
.ld-top{
  display:flex;align-items:center;
  justify-content:flex-start;
  gap:16px;padding:8px 18px;
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
.ld-logo-img{height:64px;width:auto;max-width:min(48vw,290px);object-fit:contain;flex-shrink:0;display:block;filter:drop-shadow(0 4px 8px rgba(23,50,77,.12))}
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
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;
  padding:9px 12px 12px;
  max-width:100%;margin:0 auto;
}
.ld-tab{
  display:flex;flex-direction:row;
  align-items:center;justify-content:center;gap:7px;
  padding:10px 8px;border-radius:14px;
  min-width:0;
  background:#ffffff;
  border:1.5px solid #cbd7db;
  box-shadow:0 5px 13px rgba(23,50,77,.075),inset 0 1px 0 rgba(255,255,255,.9);
  text-decoration:none;cursor:pointer;
  transition:background .18s,border-color .18s,transform .18s,box-shadow .18s;
}
.ld-tab:hover{background:#ffffff;border-color:#f28c28;transform:translateY(-2px);box-shadow:0 10px 22px rgba(23,50,77,.13)}
.ld-tab.ld-active{
  background:#17324d;
  border-color:#17324d;
  box-shadow:0 9px 22px rgba(23,50,77,.25);
}
.ld-tab-icon{
  width:23px;height:23px;line-height:1;
  display:flex;align-items:center;justify-content:center;color:#138a80;flex:0 0 auto;
}
.ld-tab-icon svg{display:block;width:100%;height:100%;stroke:currentColor}
.ld-tab-label{
  display:block;
  font-size:12px;font-weight:800;
  font-family:'Noto Sans TC',sans-serif;
  color:#17324d;
  white-space:nowrap;line-height:1.2;
}
.ld-tab-sub{
  display:none;
  font-size:9px;
  font-family:'Noto Sans TC',sans-serif;
  color:#667680;
  white-space:nowrap;
}
.ld-tab.ld-active .ld-tab-label{color:#ffffff}
.ld-tab.ld-active .ld-tab-sub{color:#dbeafe}
.ld-tab.ld-active .ld-tab-icon{color:#7ee5da}

/* ── 錨點補償：fixed header 遮住錨點的修正 ── */
[id]{scroll-margin-top:var(--ld-hdr-h,130px)}

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

/* 加入我們按鈕 */
#ld-join{
  position:fixed;right:14px;
  z-index:9991;
  width:54px;height:54px;
  border-radius:50%;
  background:#1e3a8a;
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  gap:2px;
  text-decoration:none;
  box-shadow:0 4px 14px rgba(30,58,138,.45);
  transition:background .2s,box-shadow .2s;
}
#ld-join:hover{background:#1d4ed8;box-shadow:0 4px 20px rgba(30,58,138,.6)}
#ld-join-icon{font-size:20px;line-height:1}
#ld-join-text{
  display:block;
  font-size:9.5px;font-weight:700;
  color:#ffffff;
  font-family:'Noto Sans TC',sans-serif;
  line-height:1;letter-spacing:.02em;
}
/* PC */
@media(min-width:1024px){
  .ld-top{padding:10px 32px}
  .ld-logo{width:68px;height:68px}
  .ld-logo-img{height:76px;max-width:340px}
  .ld-name{font-size:22px}
  .ld-sub{font-size:11px}
  .ld-line-btn{font-size:14px;padding:8px 16px;gap:6px}
  .ld-line-btn-text{display:inline}
  .ld-knowledge-text{display:inline}
  .ld-nav{grid-template-columns:repeat(4,minmax(170px,210px));justify-content:center;padding:10px 32px 12px;gap:12px}
  .ld-tab{min-height:58px;padding:9px 14px;gap:9px;border-radius:14px}
  .ld-tab-icon{width:27px;height:27px}
  .ld-tab-label{font-size:13px}
  .ld-tab-sub{display:block}
}

@media(max-width:420px){
  .ld-top{padding:7px 10px;gap:8px}
  .ld-logo-img{height:58px;max-width:47vw}
  .ld-top-actions{gap:6px}
  .ld-line-btn{min-width:44px;padding:8px 10px}
  .ld-knowledge-link{padding:8px 9px;font-size:11px}
  .ld-nav{padding:7px 8px 9px;gap:5px}
  .ld-tab{gap:5px;padding:8px 4px}
  .ld-tab-icon{width:20px;height:20px}
  .ld-tab-label{font-size:11px}
}

#ld-back-top{position:fixed;right:20px;bottom:calc(180px + env(safe-area-inset-bottom));z-index:9990;width:42px;height:42px;border-radius:50%;background:#1e3a8a;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;box-shadow:0 2px 12px rgba(30,58,138,.35);opacity:0;transform:translateY(8px);transition:opacity .25s,transform .25s;pointer-events:none;}
@media(min-width:1024px){#ld-back-top{bottom:24px}}
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
  flex-shrink:0;display:flex;align-items:center;gap:6px;
  background:#06C755;color:#fff;font-weight:700;font-size:13.5px;
  padding:11px 18px;border-radius:11px;text-decoration:none;
  box-shadow:0 3px 10px rgba(6,199,85,.35);white-space:nowrap;
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
@media(max-width:390px){
  .ld-service-choices{grid-template-columns:1fr}
  .ld-service-choice:last-child{grid-column:auto}
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

  const NAV_ICONS = {
    aircon:'<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="8" rx="2"/><path d="M6 8h12M7 16c1.4-1.7 2.8-1.7 4.2 0s2.8 1.7 4.2 0M8 20c1-1.1 2-1.1 3 0s2 1.1 3 0"/></svg>',
    washer:'<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="2.5" width="16" height="19" rx="2.5"/><path d="M4 7.5h16M7 5h.01M10 5h.01"/><circle cx="12" cy="14.5" r="4.5"/><path d="M9.5 14.5c1.6-1.2 3.4 1.2 5 0"/></svg>',
    homeclean:'<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 11.5 12 4l8.5 7.5M6 10v10h12V10M9.5 20v-5h5v5"/><path d="m18.5 3 .5 1.5L20.5 5 19 5.5 18.5 7 18 5.5 16.5 5 18 4.5Z"/></svg>',
    leak:'<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.5 3.5S6 9 6 12.5a4.5 4.5 0 0 0 7.8 3.1"/><circle cx="16.5" cy="16.5" r="3.5"/><path d="m19 19 2.2 2.2"/></svg>',
    knowledge:'<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5Z"/></svg>',
    other:'<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>'
  };

  // 頁籤
  const tabs = [
    {id:'aircon', href:'aircon.html', icon:NAV_ICONS.aircon, label:'冷氣清洗', sub:'設備拆洗'},
    {id:'washer', href:'washer.html', icon:NAV_ICONS.washer, label:'洗衣機清洗', sub:'內槽拆洗'},
    {id:'homeclean', href:'homeclean.html', icon:NAV_ICONS.homeclean, label:'居家清潔', sub:'空間分區'},
    {id:'leak-repair', href:'leak-repair.html', icon:NAV_ICONS.leak, label:'漏水檢測與修補', sub:'檢測・止漏'},
  ];

  const tabsHTML = tabs.map(t =>
    `<a href="/${t.href}" class="ld-tab${t.id===activePage?' ld-active':''}">
      <span class="ld-tab-icon">${t.icon}</span>
      <span class="ld-tab-label">${t.label}</span>
      <span class="ld-tab-sub">${t.sub}</span>
    </a>`
  ).join('');
  const SERVICE_CHOICE_ICONS = [NAV_ICONS.aircon,NAV_ICONS.washer,NAV_ICONS.homeclean,NAV_ICONS.leak,NAV_ICONS.other];

  const html = `
    <a id="ld-float" href="${LINE}" target="_blank" rel="noopener">
      ${LINE_FLOAT_ICON}
      <span id="ld-float-text">LINE</span>
    </a>
    <a id="ld-join" href="${JOIN_FORM}" target="_blank" rel="noopener" title="廠商合作申請">
      <span id="ld-join-icon">🤝</span>
      <span id="ld-join-text">加入我們</span>
    </a>
    <header id="ld-header">
      <div class="ld-top">
        <a class="ld-brand" href="/index.html" aria-label="灰汰郎｜冷氣清洗・洗衣機清洗・居家清潔・漏水檢測與修補">
          <picture>
            <source srcset="/logo/logos/website-header-logo-640x240.webp" type="image/webp">
            <img class="ld-logo-img" src="/logo/logos/website-header-logo-640x240.png" alt="灰汰郎 清潔公司" width="640" height="240">
          </picture>
        </a>
      </div>
      <nav class="ld-nav">${tabsHTML}</nav>
    </header>
    <button id="ld-back-top" onclick="window.scrollTo({top:0,behavior:\'smooth\'})" title="回到頂部">↑</button>
    <div id="ld-stickybar">
      <div class="ld-sticky-text">
        <div class="ld-sticky-title">需要估價或先問問題？</div>
        <div class="ld-sticky-sub">以 LINE 傳照片，資訊最完整</div>
      </div>
      <button type="button" class="ld-sticky-btn" onclick="ldOpenQuote()">使用 LINE 預約</button>
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
            <label class="ld-q-label" for="ld-q-addr">服務地址<span class="ld-req">*</span></label>
            <input class="ld-q-input" id="ld-q-addr" type="text" placeholder="市／區＋街道地址" autocomplete="street-address">
            <div class="ld-q-err">請輸入服務地址</div>
          </div>
          <div class="ld-q-field" id="ld-f-service">
            <div class="ld-q-label" id="ld-q-service-label">選擇服務<span class="ld-req">*</span></div>
            <div class="ld-service-choices" role="radiogroup" aria-labelledby="ld-q-service-label">
              ${SERVICE_OPTIONS.map((s,i)=>`<button type="button" class="ld-service-choice" data-service="${s}" aria-pressed="false"><span class="ld-service-choice-icon">${SERVICE_CHOICE_ICONS[i]}</span><span class="ld-service-choice-label">${s==='其他（請於下方說明）'?'其他需求':s}</span><span class="ld-service-choice-check" aria-hidden="true"></span></button>`).join('')}
            </div>
            <input type="hidden" id="ld-q-service" value="">
            <div class="ld-q-err">請選擇服務項目</div>
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
          <button type="submit" class="ld-q-submit">送出並開啟 LINE</button>
          <div class="ld-q-note">送出後會開啟 LINE，訊息已幫您填好，再按一下「傳送」即可完成預約估價，純諮詢完全免費</div>
        </form>
      </div>
    </div>`;

  // 移除舊版 header
  ['ld-header','site-header','ld-float','hdr-float','float-line'].forEach(id => {
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

  // Header 保持在文件流中，僅同步高度給錨點與頁內 sticky 導覽。
  function setOffset(){
    var hdrEl = document.getElementById('ld-header');
    if(hdrEl){
      var hh = hdrEl.offsetHeight;
      if(hh > 0 && hh < 240){
        document.documentElement.style.setProperty('--ld-hdr-h', hh + 'px');
      }
    }
  }
  setOffset();
  window.addEventListener('resize', setOffset);
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


  // 加入我們按鈕：固定在 LINE 按鈕下方
  (function(){
    function posJoin(){
      const lineBtn = document.getElementById('ld-float');
      const joinBtn = document.getElementById('ld-join');
      if(!lineBtn || !joinBtn) return;
      const lineRect = lineBtn.getBoundingClientRect();
      // LINE 按鈕是 fixed top:50%，加入我們在它下方 66px
      joinBtn.style.top = (window.innerHeight/2 + 33 + 8) + 'px';
    }
    posJoin();
    window.addEventListener('resize', posJoin);
  })();
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
  function selectService(value){
    if(qService) qService.value = value || '';
    qServiceButtons.forEach(function(btn){
      const selected = btn.getAttribute('data-service') === value;
      btn.classList.toggle('ld-selected', selected);
      btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
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
    if(!qOverlay.classList.contains('ld-show')){
      try{
        history.pushState({ldQuote:true}, '', location.href);
        qHistoryOpen = true;
      }catch(error){
        qHistoryOpen = false;
      }
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

  if(qForm){
    qForm.addEventListener('submit', function(e){
      e.preventDefault();
      const name = document.getElementById('ld-q-name').value.trim();
      const phone = document.getElementById('ld-q-phone').value.trim();
      const addr = document.getElementById('ld-q-addr').value.trim();
      const service = document.getElementById('ld-q-service').value;
      const date = document.getElementById('ld-q-date').value;
      const time = document.getElementById('ld-q-time').value;

      const phoneOk = /^[0-9+\-\s()]{8,}$/.test(phone);

      let valid = true;
      if(!name){ setFieldValid('ld-f-name', false); valid = false; } else setFieldValid('ld-f-name', true);
      if(!phoneOk){ setFieldValid('ld-f-phone', false); valid = false; } else setFieldValid('ld-f-phone', true);
      if(!addr){ setFieldValid('ld-f-addr', false); valid = false; } else setFieldValid('ld-f-addr', true);
      if(!service){ setFieldValid('ld-f-service', false); valid = false; } else setFieldValid('ld-f-service', true);
      if(!valid) return;

      let dateLabel = '未指定';
      if(date){
        const d = new Date(date + 'T00:00:00');
        dateLabel = (d.getMonth()+1) + '/' + d.getDate() + '（' + '日一二三四五六'[d.getDay()] + '）';
      }
      const timeLabel = time || '未指定';

      const guideSummary = typeof window.ldLeakGuideSummary === 'string' ? window.ldLeakGuideSummary.trim() : '';
      const msgLines = [
        '【灰汰郎 到府服務詢價】',
        '姓名：' + name,
        '電話：' + phone,
        '服務地址：' + addr,
        '服務項目：' + service,
        '希望日期：' + dateLabel,
        '希望時段：' + timeLabel
      ];
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
