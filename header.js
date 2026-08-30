(function(){
    // ── 全站減少動態偏好：使用者開啟 prefers-reduced-motion 時停用所有過場動畫與轉場 ──
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const rm = document.createElement('style');
    rm.setAttribute('data-ld-reduced-motion', 'true');
    rm.textContent = (
      '*,*::before,*::after{animation:none!important;transition:none!important;}' +
      '@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation:none!important;transition:none!important;}}'
    );
    document.head.appendChild(rm);
  }
function ldInit(){
  const path = location.pathname.split('/').pop() || 'index.html';
  const page = path.replace('.html','') || 'index';
  const leakSubPages = ['cases','team','areas','leak-guide','taipei','new-taipei','keelung','taoyuan','hsinchu','miaoli','taichung'];
  const activePage = leakSubPages.indexOf(page) !== -1 ? 'leak-repair' : page;
  const LINE = 'https://lin.ee/WVxmY65';
  const LINE_OA_ID = '@478xvlgl';
  const BOT_API_BASE = 'https://leakdoctor-bot.a0920077473.workers.dev';
  const LEAD_API = BOT_API_BASE + '/api/leads';
  const AVAILABILITY_API = BOT_API_BASE + '/api/service-availability';
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
  function gaValue(field, timeoutMs){
    return new Promise(function(resolve){
      if(!gaEnabled || !window.gtag){ resolve(''); return; }
      let settled = false;
      const finish = function(value){
        if(settled) return;
        settled = true;
        resolve(value == null ? '' : String(value));
      };
      try{ gtag('get', GA4_ID, field, finish); }
      catch(error){ finish(''); }
      setTimeout(function(){ finish(''); }, timeoutMs || 900);
    });
  }
  function cookieGaClientId(){
    const match = document.cookie.match(/(?:^|;\s*)_ga=GA\d+\.\d+\.(\d+\.\d+)/);
    return match ? match[1] : '';
  }
  const ATTR_KEYS = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','gbraid','wbraid'];
  function leadAttribution(){
    const current = {};
    const params = new URLSearchParams(location.search);
    ATTR_KEYS.forEach(function(key){
      const value = params.get(key);
      if(value) current[key] = value.slice(0,240);
    });
    let first = {};
    try{
      first = JSON.parse(sessionStorage.getItem('ld_attribution') || '{}') || {};
      if(Object.keys(current).length){
        first = Object.assign({}, first, current);
        sessionStorage.setItem('ld_attribution', JSON.stringify(first));
      }
    }catch(error){ first = current; }
    return Object.keys(current).length ? current : first;
  }
  function landingPage(){
    try{
      const saved = sessionStorage.getItem('ld_landing_page');
      if(saved) return saved;
      const value = location.href.slice(0,500);
      sessionStorage.setItem('ld_landing_page', value);
      return value;
    }catch(error){
      return location.href.slice(0,500);
    }
  }
  // 在訪客落地當下保存來源；若等到送出表單才記錄，跨頁後 UTM 會遺失。
  leadAttribution();
  landingPage();
  // Homepage price route shares the same lead capture, attribution and LINE identity.
  // Copy-only never calls this bridge or emits a conversion.
  window.ldCreatePriceInquiry = async function(inquiry){
    const attribution = leadAttribution();
    const identifiers = await Promise.all([gaValue('client_id',900),gaValue('session_id',900)]);
    const controller = new AbortController();
    const timer = setTimeout(function(){controller.abort();},8000);
    try{
      const response = await fetch(LEAD_API,{
        method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,
        body:JSON.stringify(Object.assign({},inquiry,{
          attribution:attribution,sourcePage:location.pathname,landingPage:landingPage(),
          referrer:(document.referrer || '').slice(0,500),gaClientId:identifiers[0] || cookieGaClientId(),
          gaSessionId:identifiers[1],website:''
        }))
      });
      const result = await response.json().catch(function(){return {};});
      if(!response.ok || !result.leadId) throw new Error('lead_capture_failed');
      ldTrack('generate_lead',{lead_source:attribution.utm_source || 'website',items:[{item_name:inquiry.service,quantity:1}]});
      ldTrack('quote_submit',{service:inquiry.service,page:location.pathname,lead_id:result.leadId,placement:'homepage_price'});
      return {leadId:result.leadId,lineBase:'https://line.me/R/oaMessage/' + LINE_OA_ID + '/?'};
    }finally{clearTimeout(timer);}
  };
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
      {id:'aircon-wall',backendId:'wall_mounted_split',label:'壁掛內機',unit:'台',note:'參考價 $1,599／台'},
      {id:'aircon-concealed',backendId:'ceiling_concealed',label:'吊隱式冷氣',unit:'台',note:'參考價 $2,799／台'},
      {id:'aircon-outdoor',backendId:'aircon_outdoor_unit',label:'室外機清洗',unit:'台',note:'加購 $500／台'},
      {id:'aircon-window',backendId:'window_aircon',label:'窗型冷氣',unit:'台',note:'需確認台數與出勤條件'},
      {id:'aircon-cassette',backendId:'ceiling_cassette_4way',label:'四方吹／商用冷氣',unit:'台',note:'需照片與現場條件評估'}
    ],
    '洗衣機清洗': [
      {id:'washer-top',backendId:'top_load_washer',label:'直立式洗衣機',unit:'台',note:'參考價 $1,599／台'},
      {id:'washer-drum',backendId:'front_load_drum_washer',label:'滾筒式洗衣機',unit:'台',note:'參考價 $3,599／台'},
      {id:'washer-commercial',backendId:'commercial_washer',label:'商用／投幣洗衣機',unit:'台',note:'需型號與照片評估'}
    ],
    '居家清潔': [
      {id:'home-regular',backendId:'home_cleaning_4h',label:'定期居家清潔',unit:'次',note:'參考價 $2,500／4 小時'},
      {id:'home-deep',backendId:'deep_cleaning',label:'大掃除',unit:'案',note:'依範圍個案報價'},
      {id:'home-move',backendId:'move_out_cleaning',label:'入住／退租清潔',unit:'案',note:'依範圍個案報價'},
      {id:'home-renovation',backendId:'post_renovation_cleaning',label:'裝潢後細清',unit:'案',note:'依範圍個案報價'},
      {id:'home-hood',backendId:'range_hood_cleaning',label:'抽油煙機清潔',unit:'台',note:'依型號與油污程度個案報價'}
    ],
    '水塔清洗': [
      {id:'tank-rooftop',backendId:'rooftop_tank',label:'屋頂不鏽鋼水塔',unit:'顆',note:'參考價 $1,599／顆'},
      {id:'tank-concrete-upper',backendId:'concrete_upper_tank',label:'水泥上水塔',unit:'座',note:'需照片、入口尺寸與排水方式評估'},
      {id:'tank-concrete-lower',backendId:'concrete_lower_tank',label:'地下蓄水池／下水塔',unit:'座',note:'涉及通風與安全條件，需人工確認'},
      {id:'tank-building',backendId:'upper_lower_tanks',label:'公寓／社區上下水塔',unit:'案',note:'依公告停水、管委會與施工時段報價'}
    ],
    '水管清洗': [
      {id:'pipe-home',backendId:'water_pipe_cleaning_house',label:'透天水管清洗',unit:'戶',note:'參考價 $4,999／戶'},
      {id:'pipe-apartment',backendId:'water_pipe_cleaning',label:'公寓／大樓水管清洗',unit:'戶',note:'參考價 $3,599／戶'},
      {id:'pipe-yellow-water',backendId:'water_pipe_cleaning',label:'黃水／異味初步判斷',unit:'處',note:'先傳照片與用水狀況，確認是否適合清洗'},
      {id:'pipe-low-flow',backendId:'water_pipe_cleaning',label:'水量變小檢查',unit:'處',note:'堵塞、鏽蝕或設備問題需先判斷原因'}
    ],
    '漏水檢測與修補': [
      {id:'leak-inspection',backendId:'leak_inspection',label:'漏水初步檢測',unit:'處',note:'先依水痕、照片與現場狀況判讀'},
      {id:'leak-pressure',backendId:'leak_inspection',label:'給水管壓力測試',unit:'區',note:'依管線範圍評估'},
      {id:'leak-water',backendId:'leak_inspection',label:'排水／防水滿水測試',unit:'區',note:'依測試範圍評估'},
      {id:'leak-infrared',backendId:'leak_inspection',label:'紅外線／含水率檢測',unit:'區',note:'依現場條件選用儀器'},
      {id:'leak-repair',backendId:'leak_inspection',label:'漏水修補施工',unit:'處',note:'確認漏點與工法後報價'}
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
    existingCraftCss.href = '/assets/craft.css?v=20260723a';
  }else{
    const craftCss = document.createElement('link');
    craftCss.rel = 'stylesheet';
    craftCss.href = '/assets/craft.css?v=20260723a';
    document.head.appendChild(craftCss);
  }
  if(!document.querySelector('script[src*="craft.js"]')){
    const craftJs = document.createElement('script');
    craftJs.src = '/assets/craft.js?v=20260831-reading';
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
  width:64px;height:64px;
  border-radius:18px;
  background:#fff;
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  gap:2px;
  text-decoration:none;
  animation:none;
}
#ld-float-icon{
  display:block;
  width:48px;height:48px;
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

@media(max-width:1023px){
  :root{--ld-hdr-h:116px}
  .ld-top{height:62px;padding:3px 12px;gap:8px}
  .ld-logo-img{width:min(42vw,142px);height:auto;max-height:56px}
  .ld-nav{
    display:flex;overflow-x:auto;overscroll-behavior-x:contain;
    scroll-snap-type:x proximity;scrollbar-width:none;
    padding:4px 12px 6px;gap:6px;
  }
  .ld-nav::-webkit-scrollbar{display:none}
  .ld-tab{
    flex:0 0 auto;min-width:112px;min-height:44px;
    gap:5px;padding:7px 10px;scroll-snap-align:center;
  }
  .ld-tab-icon{width:17px;height:17px}
  .ld-tab-label{font-size:14px;white-space:nowrap}
}

@media(max-width:420px){
  :root{--ld-hdr-h:114px}
  .ld-top{height:60px;padding:3px 10px;gap:8px}
  .ld-logo-img{width:min(43vw,138px);height:auto;max-height:54px}
  .ld-top-actions{gap:6px}
  .ld-line-btn{min-width:44px;padding:8px 10px}
  .ld-knowledge-link{padding:8px 9px;font-size:11px}
  .ld-nav{padding:4px 10px 6px;gap:5px}
  .ld-tab{min-width:104px;min-height:44px;gap:4px;padding:7px 8px}
  .ld-tab-icon{width:16px;height:16px}
  .ld-tab-label{font-size:14px}
}

#ld-back-top{position:fixed;right:20px;bottom:calc(180px + env(safe-area-inset-bottom));z-index:9990;width:44px;height:44px;border-radius:50%;background:#1e3a8a;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;box-shadow:0 2px 12px rgba(30,58,138,.35);opacity:0;transform:translateY(8px);transition:opacity .25s,transform .25s;pointer-events:none;}
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
.ld-sticky-title{font-size:14px;font-weight:900;color:#111827;line-height:1.3}
.ld-sticky-sub{font-size:12px;color:#6b7280;line-height:1.4}
.ld-sticky-btn{
  flex-shrink:0;display:flex;align-items:center;justify-content:center;gap:5px;
  min-height:44px;padding:9px 13px;border-radius:11px;text-decoration:none;
  border:1.5px solid #06C755;background:#06C755;color:#fff;
  font:800 14px 'Noto Sans TC',sans-serif;cursor:pointer;
  box-shadow:0 3px 10px rgba(6,199,85,.28);white-space:nowrap;
}
.ld-sticky-actions{display:flex;align-items:center;gap:7px;flex-shrink:0}
.ld-sticky-btn--form{border-color:#cbd7db;background:#fff;color:#17324d;box-shadow:none}
@media(max-width:420px){
  #ld-stickybar{gap:7px;padding-left:9px;padding-right:9px}
  .ld-sticky-text{display:none}
  .ld-sticky-actions{width:100%}
  .ld-sticky-btn{flex:1}
}
@media(max-width:1023px){
  body{padding-bottom:var(--ld-bottom-space,calc(76px + env(safe-area-inset-bottom)))}
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
.ld-q-sub{font-size:.875rem;color:#6b7280;margin-top:.25rem;line-height:1.6}
.ld-q-close{flex-shrink:0;width:44px;height:44px;min-height:44px;border-radius:50%;border:none;background:#f3f4f6;color:#374151;font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center}
.ld-q-close:hover{background:#e5e7eb}
.ld-q-field{margin-top:.95rem}
.ld-q-label{display:block;font-size:.875rem;font-weight:700;color:#111827;margin-bottom:.35rem}
.ld-q-label .ld-req{color:#dc2626;margin-left:2px}
.ld-q-input,.ld-q-select{
  width:100%;min-height:44px;padding:.7rem .85rem;border:1.5px solid #d1d5db;border-radius:10px;
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
.ld-service-choice-label{font-size:.875rem;font-weight:900;line-height:1.35}
.ld-service-choice-check{margin-left:auto;width:18px;height:18px;border:1.5px solid #aebdc2;border-radius:50%;background:#fff;flex:0 0 auto}
.ld-service-choice.ld-selected .ld-service-choice-check{border:5px solid #7ee5da;background:#17324d}
.ld-detail-section[hidden],.ld-add-menu[hidden]{display:none!important}
.ld-detail-toggle[hidden]{display:none!important}
.ld-detail-toggle{width:100%;margin-top:.85rem;min-height:44px;padding:10px 13px;border:1.5px solid var(--service-border,#dce4e7);border-radius:12px;background:#fff;color:#17324d;font-size:.875rem;font-weight:900;font-family:'Noto Sans TC',sans-serif;cursor:pointer;text-align:left}
.ld-detail-toggle:hover{border-color:var(--service-accent,#138a80);background:var(--service-soft,#edf8f7)}
.ld-detail-section{margin-top:1rem;padding:14px;border:1.5px solid var(--service-border,#dce4e7);border-radius:16px;background:var(--service-soft,#f7fafb)}
.ld-detail-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}
.ld-detail-title{font-size:.88rem;font-weight:900;color:#17324d}
.ld-detail-help{font-size:.875rem;color:#667680;line-height:1.5;margin-top:2px}
.ld-detail-list{display:grid;gap:9px}
.ld-detail-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;gap:8px;align-items:center;padding:10px;border:1px solid #d5e0e3;border-radius:13px;background:#fff;box-shadow:0 4px 12px rgba(23,50,77,.055)}
.ld-detail-main{min-width:0}
.ld-detail-type{width:100%;min-height:44px;border:0;background:transparent;color:#17324d;font-size:.875rem;font-weight:800;font-family:'Noto Sans TC',sans-serif;padding:2px 22px 2px 0;cursor:pointer}
.ld-detail-type:focus{outline:2px solid var(--service-accent,#138a80);outline-offset:3px;border-radius:4px}
.ld-detail-note{font-size:.875rem;color:#667680;line-height:1.45;margin-top:3px}
.ld-qty-control{display:grid;grid-template-columns:44px 44px 44px;align-items:center;border:1px solid #cbd7db;border-radius:10px;overflow:hidden;background:#fff}
.ld-qty-btn{height:44px;min-height:44px;border:0;background:#edf3f4;color:#17324d;font-size:1.05rem;font-weight:900;cursor:pointer}
.ld-qty-btn:hover{background:var(--service-soft,#e8f5f3);color:var(--service-accent,#138a80)}
.ld-detail-qty{width:44px;height:44px;min-height:44px;border:0;text-align:center;font-size:.875rem;font-weight:800;font-family:'Noto Sans TC',sans-serif;color:#17324d;-moz-appearance:textfield}
.ld-detail-qty::-webkit-inner-spin-button,.ld-detail-qty::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
.ld-detail-unit{font-size:.875rem;font-weight:800;color:#667680;min-width:18px}
.ld-detail-remove{width:44px;height:44px;min-height:44px;border:0;border-radius:9px;background:#fff1f2;color:#be123c;font-size:1rem;cursor:pointer}
.ld-add-detail{width:100%;min-height:44px;margin-top:10px;padding:10px 12px;border:1.5px dashed var(--service-accent,#138a80);border-radius:12px;background:#fff;color:var(--service-accent,#138a80);font-size:.875rem;font-weight:900;font-family:'Noto Sans TC',sans-serif;cursor:pointer}
.ld-add-detail:hover{background:var(--service-soft,#edf8f7)}
.ld-add-menu{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:8px;padding:9px;border-radius:12px;background:#fff;border:1px solid #d5e0e3}
.ld-add-option{min-height:44px;padding:9px 8px;border:1px solid #d5e0e3;border-radius:10px;background:#fff;color:#17324d;font-size:.875rem;font-weight:800;font-family:'Noto Sans TC',sans-serif;cursor:pointer;text-align:left}
.ld-add-option:hover{border-color:var(--service-accent,#138a80);background:var(--service-soft,#edf8f7)}
.ld-q-row{display:grid;grid-template-columns:1fr 1fr;gap:.7rem}
.ld-q-err{color:#dc2626;font-size:.875rem;margin-top:.3rem;display:none}
.ld-q-field.ld-invalid .ld-q-input,.ld-q-field.ld-invalid .ld-q-select{border-color:#dc2626}
.ld-q-field.ld-invalid .ld-service-choices{padding:5px;border:1.5px solid #dc2626;border-radius:18px}
.ld-q-field.ld-invalid .ld-q-err{display:block}
.ld-q-submit{
  width:100%;min-height:44px;margin-top:1.3rem;background:#06C755;color:#fff;font-weight:900;font-size:1rem;
  padding:.95rem;border:none;border-radius:12px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;gap:.5rem;
  box-shadow:0 4px 14px rgba(6,199,85,.4);
}
.ld-q-submit:hover{background:#036a2f}
.ld-q-submit:disabled{opacity:.68;cursor:wait}
.ld-q-hp{position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important;overflow:hidden!important}
.ld-q-status{min-height:1.25rem;margin-top:.55rem;font-size:.875rem;line-height:1.5;text-align:center;color:#5b6b73}
.ld-q-status.ld-error{color:#b42318}
.ld-q-note{font-size:.875rem;color:#667680;text-align:center;margin-top:.65rem;line-height:1.6}
.ld-q-privacy{margin-top:.8rem;padding:.72rem .8rem;border-radius:10px;background:#f7fafb;color:#667680;font-size:.875rem;line-height:1.55;text-align:left}
@media(max-width:390px){
  .ld-service-choices{grid-template-columns:1fr}
  .ld-service-choice:last-child{grid-column:auto}
  .ld-detail-row{grid-template-columns:minmax(0,1fr) auto}
  .ld-detail-main{grid-column:1/-1}
  .ld-qty-control{justify-self:start}
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

  // 共用精修層；部分頁面在 body 另載入 legacy CSS，覆寫仍須檢查實際 cascade。
  const existingPolishCss = document.querySelector('link[href*="uiux-polish.css"]');
  if(existingPolishCss){
    existingPolishCss.href = '/assets/uiux-polish.css?v=20260830c';
  }else{
    const polishCss = document.createElement('link');
    polishCss.rel = 'stylesheet';
    polishCss.href = '/assets/uiux-polish.css?v=20260830c';
    document.head.appendChild(polishCss);
  }

  // SVG 定義
  const LOGO = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" aria-hidden="true" focusable="false">
    <circle cx="50" cy="50" r="46" fill="#1e3a8a"/>
    <circle cx="50" cy="50" r="46" fill="none" stroke="#93c5fd" stroke-width="2"/>
    <path d="M50 20L56 42L78 48L56 54L50 76L44 54L22 48L44 42Z" fill="#ffffff"/>
    <circle cx="76" cy="24" r="6" fill="#06C755"/>
    <circle cx="76" cy="24" r="2.4" fill="#ffffff"/>
  </svg>`


  function craftIcon(id){ return '<svg class="craft-icon" aria-hidden="true"><use href="/assets/icons.svg#' + id + '"></use></svg>'; }
  const NAV_ICONS = {
    aircon:craftIcon('aircon'),
    washer:craftIcon('washer'),
    homeclean:craftIcon('homeclean'),
    water:craftIcon('water-tank'),
    pipe:craftIcon('pipe-cleaning'),
    leak:craftIcon('leak'),
    knowledge:craftIcon('book'),
    other:'<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>'
  };

  // 頁籤
  // 業主 2026-08-30 確認六大項，各服務保留自己的頁籤與作用中狀態。
  const activeNavId = activePage;
  const tabs = [
    {id:'aircon', href:'aircon.html', icon:NAV_ICONS.aircon, label:'冷氣清洗'},
    {id:'washer', href:'washer.html', icon:NAV_ICONS.washer, label:'洗衣機清洗'},
    {id:'homeclean', href:'homeclean.html', icon:NAV_ICONS.homeclean, label:'居家清潔'},
    {id:'water-tank', href:'water-tank.html', icon:NAV_ICONS.water, label:'水塔清洗'},
    {id:'pipe-cleaning', href:'pipe-cleaning.html', icon:NAV_ICONS.pipe, label:'水管清洗'},
    {id:'leak-repair', href:'leak-repair.html', icon:NAV_ICONS.leak, label:'漏水檢測與修補'},
  ];

  const tabsHTML = tabs.map(t =>
    `<a href="/${t.href}" class="ld-tab ld-tab--${t.id}${t.id===activeNavId?' ld-active':''}"${t.id===activeNavId?' aria-current="page"':''}>
      <span class="ld-tab-icon">${t.icon}</span>
      <span class="ld-tab-label">${t.label}</span>
    </a>`
  ).join('');
  const SERVICE_CHOICE_ICONS = [NAV_ICONS.aircon,NAV_ICONS.washer,NAV_ICONS.homeclean,NAV_ICONS.water,NAV_ICONS.pipe,NAV_ICONS.leak,NAV_ICONS.other];

  const html = `
    <a class="ld-skip-link" href="#main">跳到主要內容</a>
    <a id="ld-float" href="${LINE}" target="_blank" rel="noopener" aria-label="LINE 詢價與預約">
      <img id="ld-float-icon" src="/assets/brand/line-brand-icon.png" alt="" width="48" height="48">
    </a>
    <header id="ld-header">
      <div class="ld-top">
        <a class="ld-brand" href="/" aria-label="灰汰郎｜冷氣清洗・洗衣機清洗・居家清潔・水塔清洗・水管清洗・漏水檢測與修補">
          <picture>
            <source srcset="/logo/logos/website-header-logo-640x240.webp" type="image/webp">
            <img class="ld-logo-img" src="/logo/logos/website-header-logo-640x240.png" alt="灰汰郎居家服務" width="640" height="240">
          </picture>
        </a>
      </div>
      <nav class="ld-nav" aria-label="主要服務">${tabsHTML}</nav>
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
      <div id="ld-quote-card" role="dialog" aria-modal="true" aria-labelledby="ld-q-title" tabindex="-1">
        <div class="ld-q-head">
          <div>
            <div class="ld-q-title" id="ld-q-title">整理需求，LINE 接著聊</div>
            <div class="ld-q-sub">先填必要資料；設備型號、數量與照片可到 LINE 再補充，專員確認後才安排服務。</div>
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
            <label class="ld-q-label" for="ld-q-addr">服務地區 <span class="ld-optional">選填</span></label>
            <input class="ld-q-input" id="ld-q-addr" type="text" placeholder="例如：台北市中山區（完整地址稍後提供）" autocomplete="address-level2">
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
            <label class="ld-q-label">希望日期與時間 <span class="ld-optional">選填</span></label>
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
            <label class="ld-q-label" for="ld-q-note">現場狀況 <span class="ld-optional">選填</span></label>
            <textarea class="ld-q-input" id="ld-q-note" rows="3" placeholder="例如：冷氣漏水、設備型號、樓層或希望處理的範圍"></textarea>
          </div>
          <div class="ld-q-hp" aria-hidden="true">
            <label for="ld-q-website">網站</label>
            <input id="ld-q-website" name="website" type="text" tabindex="-1" autocomplete="off">
          </div>
          <div class="ld-q-privacy">資料只用於本次估價、聯繫與服務安排，不會公開；完整地址可等確認預約時再提供。</div>
          <button type="submit" class="ld-q-submit">建立需求並開啟 LINE</button>
          <div class="ld-q-status" id="ld-q-status" role="status" aria-live="polite"></div>
          <div class="ld-q-note">開啟 LINE 後再按一次「傳送」即可；詢問與照片初判不收費。</div>
        </form>
      </div>
    </div>`;

  // 移除舊版 header
  ['ld-header','ld-header-spacer','site-header','ld-float','ld-join','hdr-float','float-line'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.remove();
  });

  document.body.insertAdjacentHTML('afterbegin', html);

  // 手機導覽是單列橫向滑動，六個服務放不進一個畫面，所以要把「目前所在的服務」捲進可視範圍。
  //
  // 為什麼不用 nav.scrollLeft = offsetLeft - ...：
  // 那條算式本身沒錯，但在 insertAdjacentHTML 之後的第一個 requestAnimationFrame 裡，
  // 版面尚未定案，offsetLeft／clientWidth 還不是最終值，算出來是 0；而且之後除了 resize
  // 沒有任何補算機制。2026-08-24 實測三個服務頁載入後 scrollLeft 全為 0，
  // 漏水檢測頁的作用中頁籤完全在畫面外（誤差 439px）。
  //
  // 改用 scrollIntoView 由瀏覽器自行處理版面時機，並在 load 與字體載入完成後各補一次
  // （字體換掉會改變頁籤寬度，位置要重算）。
  let userScrolledNav = false;
  function centerActiveServiceTab(){
    const nav = document.querySelector('.ld-nav');
    const activeTab = nav && nav.querySelector('.ld-active');
    if(!nav || !activeTab || window.innerWidth >= 1024) return;
    if(nav.scrollWidth <= nav.clientWidth) return;           // 放得下就不用捲
    activeTab.scrollIntoView({ block:'nearest', inline:'center' });
  }
  function centerIfUntouched(){
    if(userScrolledNav) return;                              // 使用者自己捲過就不要搶回去
    centerActiveServiceTab();
  }
  requestAnimationFrame(() => requestAnimationFrame(centerActiveServiceTab));
  window.addEventListener('load', centerIfUntouched);
  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(centerIfUntouched).catch(() => {});
  }
  (function bindNavScrollGuards(){
    const nav = document.querySelector('.ld-nav');
    if(!nav) return;
    // 只認使用者自己的操作（滑動／滾輪／鍵盤方向鍵），程式捲動不算
    ['pointerdown','touchstart','wheel','keydown'].forEach(evt => {
      nav.addEventListener(evt, () => { userScrolledNav = true; }, { passive:true });
    });
  })();
  // resize 只在跨過 1024px 斷點時重算；否則手機網址列一收合就會把使用者捲到的位置搶走。
  let wasMobileNav = window.innerWidth < 1024;
  window.addEventListener('resize', () => {
    const isMobileNav = window.innerWidth < 1024;
    if(isMobileNav === wasMobileNav) return;
    wasMobileNav = isMobileNav;
    userScrolledNav = false;                                 // 換版面等於重新開始
    centerActiveServiceTab();
  });

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
        {tag:'清洗前後案例',title:'風鼓與出風口清潔前後',text:'真實服務紀錄可直接看出霉斑與附著髒污的處理差異，復原後仍會檢查出風、排水與運轉。',image:'/cases/aircon/case02-combined.webp',fallback:'/cases/aircon/case02-combined.jpg',width:1200,height:1200}
      ]
    },
    washer:{
      title:'洗衣機清洗先看三張圖',
      cards:[
        {tag:'為什麼需要洗',title:'內外槽夾層才是異味來源',text:'洗劑殘留、棉絮、皮屑與潮濕霉斑常堆在槽背，看起來乾淨也可能有黑屑。',image:'/assets/optimized/washer-dirt-source-sm.webp',fallback:'/assets/optimized/washer-dirt-source-sm.jpg',fit:'contain',width:733,height:1100},
        {tag:'怎麼洗',title:'拆出內槽才看得到槽背',text:'直立式與滾筒式結構不同，會先看品牌、容量、安裝空間，再安排可拆洗範圍。',image:'/assets/service-story/washer-service-story-20260714.webp',fallback:'/assets/service-story/washer-service-story-20260714.jpg'},
        {tag:'清洗前後案例',title:'拆出內槽才看得到的差異',text:'槽背、底盤與支架的髒污藏在外觀下方；清潔完成、復原後還要確認進水、排水與脫水。',image:'/cases/washer/case02-combined.webp',fallback:'/cases/washer/case02-combined.jpg',width:1200,height:1200}
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
        {tag:'為什麼需要洗',title:'蓄水容器會累積沉積物',text:'目前承接屋頂白鐵水塔；先看容量、內部狀況與頂樓通道，再確認是否能安排。',image:'/assets/service-story/water-tank-service-story-20260714.webp',fallback:'/assets/service-story/water-tank-service-story-20260714.jpg'},
        {tag:'怎麼洗',title:'停水、排水、復水要有順序',text:'上下水塔、加壓馬達與排水點會影響施工安排，報價前要先看照片。',image:'/assets/optimized/water-tank-system-sm.webp',fallback:'/assets/optimized/water-tank-system-sm.jpg',fit:'contain',width:733,height:1100},
        {tag:'清洗前後案例',title:'從頂部人孔看內壁與底部',text:'真實服務紀錄呈現內壁與底部沉積清除後的狀況，完工還會確認排水與復水流程。',image:'/cases/water-tank/case01-after.webp',fallback:'/cases/water-tank/case01-after.jpg',width:1200,height:1600}
      ]
    },
    'pipe-cleaning':{
      title:'水管清洗先看三張圖',
      cards:[
        {tag:'為什麼需要洗',title:'黃水、異味、水量變小要先分類',text:'原因可能來自水塔、管材、熱水器或閥件，不一定全都適合直接清洗。',image:'/assets/service-story/pipe-cleaning-service-story-20260714.webp',fallback:'/assets/service-story/pipe-cleaning-service-story-20260714.jpg'},
        {tag:'怎麼洗',title:'先判斷管材與屋齡',text:'水管清洗可改善沉積，但老舊管線去除堵塞後可能讓滲漏更明顯。',image:'/assets/optimized/pipe-cleaning-effects-sm.webp',fallback:'/assets/optimized/pipe-cleaning-effects-sm.jpg',fit:'contain',width:733,height:1100},
        {tag:'現場實拍',title:'堵塞可能發生在管件與接頭',text:'鏽蝕、沉積、濾網或閥件都可能讓水量變小；是否適合清洗要搭配管材、屋齡與設備一起判斷。',image:'/cases/pipe-cleaning/case01-blockage.webp',fallback:'/cases/pipe-cleaning/case01-blockage.jpg',width:1200,height:1600}
      ]
    },
    'leak-repair':{
      title:'漏水檢測先看三張圖',
      cards:[
        {tag:'為什麼需要檢測',title:'水痕不等於漏點',text:'牆面、天花、窗框或浴室滲水，需要先縮小範圍，避免盲目施工。',image:'/assets/optimized/leak-detection-methods-sm.webp',fallback:'/assets/optimized/leak-detection-methods-sm.jpg'},
        {tag:'怎麼查',title:'用現象與工具交叉判斷',text:'熱像、水分、色素或局部拆檢會依現場條件選用，不用同一套答案套所有漏水。',image:'/assets/service-story/leak-repair-service-story-20260714.webp',fallback:'/assets/service-story/leak-repair-service-story-20260714.jpg'},
        {tag:'現場實拍',title:'異常出水位置不等於真正漏點',text:'水甚至可能從插座或接縫流出；先停用附近電源並縮小水源範圍，再決定檢測與修補方式。',image:'/cases/leak-repair/case01-outlet.webp',fallback:'/cases/leak-repair/case01-outlet.jpg',width:1200,height:1600}
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
          '<div class="service-story-dots" role="group" aria-label="' + config.title + '照片輪播指標">' + dots + '</div>' +
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
  // 以實際高度保留空間：涵蓋 safe-area、文字換行、字型載入與縮放。
  function setBottomSpace(){
    var stickyBar = document.getElementById('ld-stickybar');
    if(stickyBar) document.documentElement.style.setProperty('--ld-bottom-space', stickyBar.offsetHeight + 'px');
  }
  setBottomSpace();
  window.addEventListener('resize', setBottomSpace);
  window.addEventListener('load', setBottomSpace);
  if(window.ResizeObserver){
    const bottomObserver = new ResizeObserver(setBottomSpace);
    const stickyBar = document.getElementById('ld-stickybar');
    if(stickyBar) bottomObserver.observe(stickyBar);
  }
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
  const qCard = document.getElementById('ld-quote-card');
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
  let liveAvailableServiceIds = null;

  function serviceIsAvailable(service){
    if(service === '其他（請於下方說明）') return true;
    const catalog = SERVICE_DETAIL_CATALOG[service] || [];
    return !liveAvailableServiceIds || catalog.some(function(item){ return !item.backendId || liveAvailableServiceIds.has(item.backendId); });
  }

  function applyServiceAvailability(payload){
    liveAvailableServiceIds = new Set(Array.isArray(payload.serviceIds) ? payload.serviceIds : []);
    qServiceButtons.forEach(function(btn){
      const service = btn.getAttribute('data-service') || '';
      btn.hidden = !serviceIsAvailable(service);
    });
    const pageServices = {
      aircon:['wall_mounted_split','ceiling_concealed','window_aircon','ceiling_cassette_4way','commercial_aircon'],
      washer:['top_load_washer','front_load_drum_washer','commercial_washer'],
      homeclean:['home_cleaning_4h','deep_cleaning','move_out_cleaning','post_renovation_cleaning','range_hood_cleaning'],
      'water-tank':['rooftop_tank','concrete_upper_tank','concrete_lower_tank','upper_lower_tanks'],
      'pipe-cleaning':['water_pipe_cleaning','water_pipe_cleaning_house'],
      'leak-repair':['leak_inspection']
    };
    Object.keys(pageServices).forEach(function(pageId){
      const visible = pageServices[pageId].some(function(id){ return liveAvailableServiceIds.has(id); });
      document.querySelectorAll('.ld-tab--'+pageId).forEach(function(tab){ tab.hidden = !visible; });
    });
    if(qService && qService.value && !serviceIsAvailable(qService.value)) selectService('');
  }

  fetch(AVAILABILITY_API, {headers:{'Accept':'application/json'}})
    .then(function(response){ if(!response.ok) throw new Error('HTTP '+response.status); return response.json(); })
    .then(applyServiceAvailability)
    .catch(function(){ /* API 暫時失敗時保留內容瀏覽與 LINE 直接詢問，不阻斷網站。 */ });

  function setDetailsExpanded(expanded){
    detailsExpanded = Boolean(expanded && qDetailList && qDetailList.children.length);
    if(qDetailSection) qDetailSection.hidden = !detailsExpanded;
    if(qDetailToggle){
      qDetailToggle.setAttribute('aria-expanded', detailsExpanded ? 'true' : 'false');
      qDetailToggle.textContent = detailsExpanded ? '收合機型／數量' : '＋ 補充機型／數量（選填）';
    }
  }

  function detailCatalog(service){
    const catalog = SERVICE_DETAIL_CATALOG[service] || [];
    if(!liveAvailableServiceIds) return catalog;
    return catalog.filter(function(item){ return !item.backendId || liveAvailableServiceIds.has(item.backendId); });
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
  let qReturnFocus = null;
  function quoteFocusable(){
    if(!qCard) return [];
    return Array.from(qCard.querySelectorAll('button, input, select, textarea, a[href], [tabindex]')).filter(function(el){
      return !el.disabled && el.type !== 'hidden' && el.tabIndex >= 0 && el.offsetParent !== null
        && !el.closest('[hidden]') && el.getAttribute('aria-hidden') !== 'true';
    });
  }
  function focusQuoteCard(){
    if(!qCard || !qOverlay || !qOverlay.classList.contains('ld-show')) return;
    try{ qCard.focus({preventScroll:true}); }
    catch(error){ qCard.focus(); }
  }
  function hideQuote(){
    if(!qOverlay) return;
    qOverlay.classList.remove('ld-show');
    document.body.style.overflow = '';
    const returnFocus = qReturnFocus;
    qReturnFocus = null;
    if(returnFocus && document.contains(returnFocus) && typeof returnFocus.focus === 'function'){
      requestAnimationFrame(function(){ returnFocus.focus(); });
    }
  }

  window.ldOpenQuote = function(serviceKey){
    if(!qOverlay) return;
    const wasOpen = qOverlay.classList.contains('ld-show');
    if(!wasOpen) qReturnFocus = document.activeElement;
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
    if(!wasOpen) requestAnimationFrame(focusQuoteCard);
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
    if(!qOverlay || !qOverlay.classList.contains('ld-show')) return;
    if(e.key === 'Escape'){
      e.preventDefault();
      ldCloseQuote();
      return;
    }
    if(e.key !== 'Tab') return;
    const focusable = quoteFocusable();
    if(!focusable.length){
      e.preventDefault();
      focusQuoteCard();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if(e.shiftKey && (document.activeElement === first || !qCard.contains(document.activeElement))){
      e.preventDefault();
      last.focus();
    }else if(!e.shiftKey && (document.activeElement === last || !qCard.contains(document.activeElement))){
      e.preventDefault();
      first.focus();
    }
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
    qForm.addEventListener('submit', async function(e){
      e.preventDefault();
      if(qForm.dataset.submitting === '1') return;
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

      const submitButton = qForm.querySelector('.ld-q-submit');
      const submitStatus = document.getElementById('ld-q-status');
      qForm.dataset.submitting = '1';
      if(submitButton){
        submitButton.disabled = true;
        submitButton.textContent = '正在建立詢價案件…';
      }
      if(submitStatus){
        submitStatus.classList.remove('ld-error');
        submitStatus.textContent = '正在安全儲存資料，完成後會開啟 LINE';
      }

      let dateLabel = '未指定';
      if(date){
        const d = new Date(date + 'T00:00:00');
        dateLabel = (d.getMonth()+1) + '/' + d.getDate() + '（' + '日一二三四五六'[d.getDay()] + '）';
      }
      const timeLabel = time || '未指定';

      const guideSummary = typeof window.ldLeakGuideSummary === 'string' ? window.ldLeakGuideSummary.trim() : '';
      const serviceDetails = collectServiceDetails(service);
      const attribution = leadAttribution();
      const identifiers = await Promise.all([gaValue('client_id', 900), gaValue('session_id', 900)]);
      const gaClientId = identifiers[0] || cookieGaClientId();
      let leadId = '';
      let leadTimer = 0;
      try{
        const controller = new AbortController();
        leadTimer = setTimeout(function(){ controller.abort(); }, 8000);
        const response = await fetch(LEAD_API, {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          signal: controller.signal,
          body: JSON.stringify({
            name: name,
            phone: phone,
            service: service,
            address: addr,
            preferredTime: [date || '', time || ''].filter(Boolean).join(' '),
            note: [note, guideSummary ? '漏水判讀摘要：' + guideSummary : ''].filter(Boolean).join('\n'),
            details: serviceDetails,
            attribution: attribution,
            sourcePage: location.pathname,
            landingPage: landingPage(),
            referrer: (document.referrer || '').slice(0,500),
            gaClientId: gaClientId,
            gaSessionId: identifiers[1],
            website: (document.getElementById('ld-q-website') || {}).value || ''
          })
        });
        const result = await response.json().catch(function(){ return {}; });
        if(!response.ok || !result.leadId) throw new Error(result.error || 'lead_capture_failed');
        leadId = result.leadId;
      }catch(error){
        qForm.dataset.submitting = '0';
        if(submitButton){
          submitButton.disabled = false;
          submitButton.textContent = '重新送出並開啟 LINE';
        }
        if(submitStatus){
          submitStatus.classList.add('ld-error');
          submitStatus.textContent = '目前無法建立案件，資料尚未送出。請稍後重試，或使用頁面上的「LINE 直接問」。';
        }
        ldTrack('lead_capture_error', { service: service, page: location.pathname });
        return;
      }finally{
        if(leadTimer) clearTimeout(leadTimer);
      }

      const msgLines = [
        '【灰汰郎 到府服務詢價】',
        '線索編號：' + leadId,
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

      ldTrack('generate_lead', {
        lead_source: attribution.utm_source || 'website',
        items: [{item_name: service, quantity: 1}]
      });
      ldTrack('quote_submit', { service: service, page: location.pathname, lead_id: leadId });
      if(submitStatus) submitStatus.textContent = '案件 ' + leadId + ' 已建立，正在開啟 LINE';
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
