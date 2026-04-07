(function(){
  const path = location.pathname.split('/').pop() || 'index.html';
  const page = path.replace('.html','') || 'index';
  const LINE = 'https://lin.ee/rjmmYyC';

  // 字體
  if(!document.querySelector('link[href*="Noto+Sans"]')){
    const l=document.createElement('link');
    l.rel='stylesheet';
    l.href='https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700;900&display=swap';
    document.head.appendChild(l);
  }

  // CSS：全部用 ld- 前綴，不影響頁面其他元素
  const css = `
/* ld-header */
#ld-header{
  position:fixed;top:0;left:0;right:0;
  z-index:9990;
  background:#ffffff;
  border-bottom:2px solid #e5e7eb;
  box-shadow:0 2px 10px rgba(0,0,0,.07);
  font-family:'Noto Sans TC',sans-serif;
}
.ld-top{
  display:flex;align-items:center;
  justify-content:space-between;
  gap:8px;padding:8px 14px;
  max-width:1200px;margin:0 auto;
}
.ld-brand{
  display:flex;align-items:center;
  gap:8px;text-decoration:none;
  flex:1;min-width:0;
}
.ld-logo{
  width:36px;height:36px;
  flex-shrink:0;
}
.ld-texts{flex:1;min-width:0}
.ld-name{
  display:block;
  font-size:16px;font-weight:900;
  color:#1e3a8a;white-space:nowrap;
  line-height:1.25;
}
.ld-sub{
  display:block;
  font-size:10px;font-weight:500;
  color:#3b82f6;white-space:nowrap;
  line-height:1.3;
}
.ld-line-btn{
  display:flex;align-items:center;gap:5px;
  background:#06C755;color:#ffffff;
  font-weight:700;font-size:12px;
  font-family:'Noto Sans TC',sans-serif;
  padding:6px 10px;border-radius:9px;
  text-decoration:none;flex-shrink:0;
  white-space:nowrap;
}
.ld-line-btn-text{display:none}

/* nav */
.ld-nav{
  background:#1e3a8a;
  display:flex;gap:5px;
  padding:6px 10px;
  overflow-x:auto;
  -webkit-overflow-scrolling:touch;
  scrollbar-width:none;
}
.ld-nav::-webkit-scrollbar{display:none}
.ld-tab{
  display:flex;flex-direction:column;
  align-items:center;gap:3px;
  padding:7px 9px;border-radius:9px;
  min-width:58px;flex-shrink:0;
  background:rgba(255,255,255,.12);
  border:1.5px solid rgba(255,255,255,.16);
  text-decoration:none;cursor:pointer;
  transition:background .15s;
}
.ld-tab:hover{background:rgba(255,255,255,.22)}
.ld-tab.ld-active{
  background:#ffffff;
  border-color:#ffffff;
  box-shadow:0 2px 6px rgba(0,0,0,.12);
}
.ld-tab-icon{
  font-size:16px;line-height:1;
  display:block;
}
.ld-tab-label{
  display:block;
  font-size:10px;font-weight:700;
  font-family:'Noto Sans TC',sans-serif;
  color:rgba(255,255,255,.93);
  white-space:nowrap;line-height:1.2;
}
.ld-tab-sub{
  display:none;
  font-size:9px;
  font-family:'Noto Sans TC',sans-serif;
  color:rgba(255,255,255,.5);
  white-space:nowrap;
}
.ld-tab.ld-active .ld-tab-label{color:#1e3a8a}
.ld-tab.ld-active .ld-tab-sub{color:#6b7280}

/* float */
#ld-float{
  position:fixed;right:14px;top:50%;
  transform:translateY(-50%);
  z-index:9991;
  width:54px;height:54px;
  border-radius:50%;
  background:#06C755;
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  gap:2px;
  text-decoration:none;
  box-shadow:0 4px 16px rgba(6,199,85,.5);
  animation:ld-pulse 2.5s ease-in-out infinite;
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
  .ld-top{padding:12px 40px}
  .ld-logo{width:48px;height:48px}
  .ld-name{font-size:22px}
  .ld-sub{font-size:11px}
  .ld-line-btn{font-size:14px;padding:8px 16px;gap:6px}
  .ld-line-btn-text{display:inline}
  .ld-nav{padding:12px 40px;justify-content:center;gap:8px}
  .ld-tab{min-width:86px;padding:10px 14px;gap:4px;border-radius:11px}
  .ld-tab-icon{font-size:22px}
  .ld-tab-label{font-size:12px}
  .ld-tab-sub{display:block}
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
    <path d="M22 18L22 52Q22 72 42 72Q62 72 62 52L62 44" fill="none" stroke="#0d9488" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="22" cy="16" r="8" fill="#0d9488"/><circle cx="22" cy="16" r="4" fill="#f0fdfa"/>
    <circle cx="62" cy="42" r="8" fill="#0d9488"/><circle cx="62" cy="42" r="4" fill="#f0fdfa"/>
    <path d="M42 56C42 56 24 72 24 84C24 93 32 100 42 100C52 100 60 93 60 84C60 72 42 56 42 56Z" fill="#1d4ed8" stroke="#60a5fa" stroke-width="2"/>
    <path d="M33 84Q42 76 51 84" fill="none" stroke="#93c5fd" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M36 91Q42 86 48 91" fill="none" stroke="#bfdbfe" stroke-width="2" stroke-linecap="round"/>
  </svg>`;

  const LINE_ICON = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="18" height="18" style="display:block;flex-shrink:0">
    <rect width="48" height="48" rx="10" fill="#fff"/>
    <path d="M40 22.3C40 15 33.3 9 25 9S10 15 10 22.3c0 6.5 5.8 12 13.6 13 .5.1 1.2.4 1.4.9.2.5.1 1.2.1 1.2l-.2 1.5c-.1.5-.4 1.9 1.7.9 2.2-1 11.5-6.8 15.7-11.6 2.9-3.2 4.7-6.5 4.7-10z" fill="#06C755"/>
    <path d="M21.2 19.2h-1.4c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h1.4c.3 0 .5-.2.5-.5v-6.6c0-.3-.2-.5-.5-.5zM28.6 19.2h-1.4c-.3 0-.5.2-.5.5v3.9l-3-4.2-.2-.2H22c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h1.4c.3 0 .5-.2.5-.5v-3.9l3 4.2.2.2h1.5c.3 0 .5-.2.5-.5v-6.6c0-.3-.2-.5-.5-.5zM19.2 24.3h-2.4v-4.7c0-.3-.2-.5-.5-.5h-1.4c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h4.3c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5zM33.8 20.6c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5h-4.3c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h4.3c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5H31v-1h2.8c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5H31v-1h2.8z" fill="#fff"/>
  </svg>`;

  const LINE_FLOAT_ICON = `<svg id="ld-float-icon" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="26" height="26" style="display:block">
    <path d="M40 22.3C40 15 33.3 9 25 9S10 15 10 22.3c0 6.5 5.8 12 13.6 13 .5.1 1.2.4 1.4.9.2.5.1 1.2.1 1.2l-.2 1.5c-.1.5-.4 1.9 1.7.9 2.2-1 11.5-6.8 15.7-11.6 2.9-3.2 4.7-6.5 4.7-10z" fill="#fff"/>
    <path d="M21.2 19.2h-1.4c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h1.4c.3 0 .5-.2.5-.5v-6.6c0-.3-.2-.5-.5-.5zM28.6 19.2h-1.4c-.3 0-.5.2-.5.5v3.9l-3-4.2-.2-.2H22c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h1.4c.3 0 .5-.2.5-.5v-3.9l3 4.2.2.2h1.5c.3 0 .5-.2.5-.5v-6.6c0-.3-.2-.5-.5-.5zM19.2 24.3h-2.4v-4.7c0-.3-.2-.5-.5-.5h-1.4c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h4.3c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5zM33.8 20.6c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5h-4.3c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h4.3c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5H31v-1h2.8c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5H31v-1h2.8z" fill="#06C755"/>
  </svg>`;

  // 頁籤
  const tabs = [
    {id:'index',    href:'index.html',               icon:'🏠', label:'首頁',     sub:'回主頁'},
    {id:'knowledge',href:'knowledge.html',           icon:'📖', label:'漏水百科', sub:'免費知識'},
    {id:'cases',    href:'cases.html',               icon:'📋', label:'施工案例', sub:'真實記錄'},
    {id:'team',     href:'team.html',                icon:'👷', label:'合作廠商', sub:'師傅介紹'},
    {id:'pricing',  href:'index.html#pricing',       icon:'💰', label:'費用行情', sub:'透明報價'},
    {id:'area',     href:'index.html#service-area',  icon:'📍', label:'服務地區', sub:'全台本島'},
    {id:'protect',  href:'index.html#consumer-protect', icon:'🛡️', label:'消費者保障', sub:'避免踩雷'},
  ];

  const tabsHTML = tabs.map(t =>
    `<a href="${t.href}" class="ld-tab${t.id===page?' ld-active':''}">
      <span class="ld-tab-icon">${t.icon}</span>
      <span class="ld-tab-label">${t.label}</span>
      <span class="ld-tab-sub">${t.sub}</span>
    </a>`
  ).join('');

  const html = `
    <a id="ld-float" href="${LINE}" target="_blank" rel="noopener">
      ${LINE_FLOAT_ICON}
      <span id="ld-float-text">LINE</span>
    </a>
    <header id="ld-header">
      <div class="ld-top">
        <a class="ld-brand" href="index.html">
          <div class="ld-logo">${LOGO}</div>
          <div class="ld-texts">
            <span class="ld-name">台灣漏水醫生</span>
            <span class="ld-sub">漏水工班快速媒合平台</span>
          </div>
        </a>
        <a href="${LINE}" target="_blank" rel="noopener" class="ld-line-btn">
          ${LINE_ICON}
          <span class="ld-line-btn-text">加入 LINE 諮詢</span>
        </a>
      </div>
      <nav class="ld-nav">${tabsHTML}</nav>
    </header>`;

  // 移除舊版 header
  ['ld-header','site-header','ld-float','hdr-float','float-line'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.remove();
  });

  document.body.insertAdjacentHTML('afterbegin', html);

  // 計算 header 高度，補 padding-top
  function setOffset(){
    const h = document.getElementById('ld-header');
    if(h) document.body.style.paddingTop = h.offsetHeight + 'px';
  }
  setOffset();
  window.addEventListener('resize', setOffset);
  setTimeout(setOffset, 300);
  window.addEventListener('load', setOffset);
})();
