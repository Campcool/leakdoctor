(function(){
  const path = location.pathname.split('/').pop() || 'index.html';
  const page = path.replace('.html','') || 'index';

  // 字體
  if(!document.querySelector('link[href*="fonts.googleapis"]')){
    const l=document.createElement('link');
    l.rel='stylesheet';
    l.href='https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap';
    document.head.appendChild(l);
  }

  // 全域 CSS：用 !important 確保不被各頁面覆蓋
  const style = document.createElement('style');
  style.id = 'global-header-style';
  style.textContent = `
    *,*::before,*::after{box-sizing:border-box}
    :root{
      --blue:#1d4ed8;--blue-dark:#1e3a8a;--blue-light:#eff6ff;--blue-mid:#3b82f6;
      --teal:#0d9488;--teal-light:#f0fdfa;
      --orange:#ea580c;--purple:#7c3aed;--red:#dc2626;
      --green:#16a34a;--gray-200:#e5e7eb;--gray-500:#6b7280;
    }
    html{scroll-behavior:smooth}
    body{
      font-family:'Noto Sans TC',sans-serif!important;
      color:#1a202c;background:#f8fafc;
      line-height:1.8;font-size:18px;
      margin:0!important;padding:0!important;
    }
    a{text-decoration:none;color:inherit}

    /* ── Float LINE button ── */
    #hdr-float{
      position:fixed!important;right:1rem;top:50%;
      transform:translateY(-50%);z-index:9999!important;
      width:58px;height:58px;border-radius:50%;
      background:#06C755;color:#fff;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      gap:2px;text-decoration:none;
      box-shadow:0 4px 18px rgba(6,199,85,.55);
      animation:hdr-pulse 2.5s ease-in-out infinite;
    }
    @keyframes hdr-pulse{
      0%,100%{box-shadow:0 4px 18px rgba(6,199,85,.55)}
      50%{box-shadow:0 4px 28px rgba(6,199,85,.8),0 0 0 8px rgba(6,199,85,.12)}
    }
    #hdr-float span{font-size:.6rem;font-weight:700;line-height:1}

    /* ── Main Header ── */
    #site-header{
      position:fixed!important;
      top:0!important;left:0!important;right:0!important;
      z-index:9998!important;
      background:#fff!important;
      border-bottom:2px solid #e5e7eb!important;
      box-shadow:0 2px 12px rgba(0,0,0,.08)!important;
    }

    /* top bar：logo + LINE button */
    .hdr-top{
      display:flex!important;
      align-items:center!important;
      justify-content:space-between!important;
      gap:.5rem!important;
      padding:.5rem .9rem!important;
      max-width:1200px!important;
      margin:0 auto!important;
    }
    .hdr-brand{
      display:flex!important;align-items:center!important;
      gap:.5rem!important;text-decoration:none!important;
      flex:1!important;min-width:0!important;overflow:hidden!important;
    }
    .hdr-logo{width:36px!important;height:36px!important;flex-shrink:0!important}
    .hdr-logo svg{width:36px!important;height:36px!important;display:block!important}
    .hdr-text{min-width:0!important;overflow:hidden!important}
    .hdr-name{
      font-size:.95rem!important;font-weight:900!important;
      color:#1e3a8a!important;white-space:nowrap!important;
      line-height:1.2!important;display:block!important;
    }
    .hdr-sub{
      font-size:.58rem!important;color:#3b82f6!important;
      font-weight:500!important;white-space:nowrap!important;
      display:block!important;
    }
    .hdr-line-btn{
      display:flex!important;align-items:center!important;gap:.28rem!important;
      background:#06C755!important;color:#fff!important;
      font-weight:700!important;font-size:.72rem!important;
      padding:.34rem .65rem!important;border-radius:9px!important;
      white-space:nowrap!important;text-decoration:none!important;
      flex-shrink:0!important;
    }
    .hdr-line-btn svg{width:17px!important;height:17px!important;flex-shrink:0!important}
    .hdr-line-text{display:none!important}

    /* ── 頁籤 nav ── */
    .hdr-nav{
      background:#1e3a8a!important;
      padding:.4rem .65rem!important;
      display:flex!important;
      gap:.3rem!important;
      overflow-x:auto!important;
      scrollbar-width:none!important;
      -webkit-overflow-scrolling:touch!important;
    }
    .hdr-nav::-webkit-scrollbar{display:none!important}
    .hdr-tab{
      display:flex!important;flex-direction:column!important;
      align-items:center!important;gap:.2rem!important;
      padding:.48rem .6rem!important;
      border-radius:9px!important;min-width:58px!important;
      background:rgba(255,255,255,.11)!important;
      border:1.5px solid rgba(255,255,255,.15)!important;
      cursor:pointer!important;transition:.18s!important;
      flex-shrink:0!important;text-decoration:none!important;
    }
    .hdr-tab:hover{
      background:rgba(255,255,255,.22)!important;
      transform:translateY(-1px)!important;
    }
    .hdr-tab.active{
      background:#fff!important;border-color:#fff!important;
      box-shadow:0 2px 8px rgba(0,0,0,.15)!important;
    }
    .hdr-tab-icon{font-size:1.1rem!important;line-height:1!important;display:block!important}
    .hdr-tab-label{
      font-size:.64rem!important;font-weight:700!important;
      color:rgba(255,255,255,.93)!important;
      white-space:nowrap!important;line-height:1.2!important;
      display:block!important;
    }
    .hdr-tab-sub{
      font-size:.52rem!important;color:rgba(255,255,255,.48)!important;
      white-space:nowrap!important;display:none!important;
    }
    .hdr-tab.active .hdr-tab-label{color:#1e3a8a!important}
    .hdr-tab.active .hdr-tab-sub{color:#64748b!important}

    /* ── PC ≥ 1024px ── */
    @media(min-width:1024px){
      body{font-size:15px!important}
      .hdr-top{padding:.8rem 2.5rem!important}
      .hdr-logo{width:50px!important;height:50px!important}
      .hdr-logo svg{width:50px!important;height:50px!important}
      .hdr-name{font-size:1.3rem!important}
      .hdr-sub{font-size:.7rem!important}
      .hdr-line-btn{font-size:.86rem!important;padding:.48rem 1.05rem!important;gap:.4rem!important}
      .hdr-line-btn svg{width:21px!important;height:21px!important}
      .hdr-line-text{display:inline!important}
      .hdr-nav{padding:.8rem 2.5rem!important;justify-content:center!important;gap:.55rem!important}
      .hdr-tab{min-width:88px!important;padding:.72rem .95rem!important;gap:.28rem!important;border-radius:11px!important}
      .hdr-tab-icon{font-size:1.4rem!important}
      .hdr-tab-label{font-size:.73rem!important}
      .hdr-tab-sub{display:block!important}
    }

    /* ── 各頁面 hero 統一高度 ── */
    #hero,#page-hero,.page-hero,
    .team-hero,.kb-hero,.ch-hero{
      min-height:0!important;
    }
    #page-hero{
      padding:2rem 1.25rem 1.75rem!important;
    }
    @media(min-width:1024px){
      #page-hero{padding:3rem 2.5rem 2.5rem!important}
    }
  `;
  document.head.appendChild(style);

  // 頁籤定義
  const tabs = [
    {id:'index',     href:'index.html',                   icon:'🏠',label:'首頁',    sub:'回主頁'},
    {id:'knowledge', href:'knowledge.html',               icon:'📖',label:'漏水百科',sub:'免費知識'},
    {id:'cases',     href:'cases.html',                   icon:'📋',label:'施工案例',sub:'真實記錄'},
    {id:'team',      href:'team.html',                    icon:'👷',label:'合作廠商',sub:'師傅介紹'},
    {id:'pricing',   href:'index.html#pricing',           icon:'💰',label:'費用行情',sub:'透明報價'},
    {id:'area',      href:'index.html#service-area',      icon:'📍',label:'服務地區',sub:'全台本島'},
    {id:'protect',   href:'index.html#consumer-protect',  icon:'🛡️',label:'消費者保障',sub:'避免踩雷'},
  ];

  const LINE_HREF = 'https://lin.ee/rjmmYyC';

  const LINE_ICON_SVG = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="10" fill="#fff"/>
    <path d="M40 22.3C40 15 33.3 9 25 9S10 15 10 22.3c0 6.5 5.8 12 13.6 13 .5.1 1.2.4 1.4.9.2.5.1 1.2.1 1.2l-.2 1.5c-.1.5-.4 1.9 1.7.9 2.2-1 11.5-6.8 15.7-11.6 2.9-3.2 4.7-6.5 4.7-10z" fill="#06C755"/>
    <path d="M21.2 19.2h-1.4c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h1.4c.3 0 .5-.2.5-.5v-6.6c0-.3-.2-.5-.5-.5zM28.6 19.2h-1.4c-.3 0-.5.2-.5.5v3.9l-3-4.2-.2-.2H22c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h1.4c.3 0 .5-.2.5-.5v-3.9l3 4.2.2.2h1.5c.3 0 .5-.2.5-.5v-6.6c0-.3-.2-.5-.5-.5zM19.2 24.3h-2.4v-4.7c0-.3-.2-.5-.5-.5h-1.4c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h4.3c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5zM33.8 20.6c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5h-4.3c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h4.3c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5H31v-1h2.8c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5H31v-1h2.8z" fill="#fff"/>
  </svg>`;

  const LOGO_SVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 18L22 52Q22 72 42 72Q62 72 62 52L62 44" fill="none" stroke="#0d9488" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="22" cy="16" r="8" fill="#0d9488"/><circle cx="22" cy="16" r="4" fill="#f0fdfa"/>
    <circle cx="62" cy="42" r="8" fill="#0d9488"/><circle cx="62" cy="42" r="4" fill="#f0fdfa"/>
    <path d="M42 56C42 56 24 72 24 84C24 93 32 100 42 100C52 100 60 93 60 84C60 72 42 56 42 56Z" fill="#1d4ed8" stroke="#60a5fa" stroke-width="2"/>
    <path d="M33 84Q42 76 51 84" fill="none" stroke="#93c5fd" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M36 91Q42 86 48 91" fill="none" stroke="#bfdbfe" stroke-width="2" stroke-linecap="round"/>
  </svg>`;

  const tabsHTML = tabs.map(t=>`
    <a href="${t.href}" class="hdr-tab${t.id===page?' active':''}">
      <span class="hdr-tab-icon">${t.icon}</span>
      <span class="hdr-tab-label">${t.label}</span>
      <span class="hdr-tab-sub">${t.sub}</span>
    </a>`).join('');

  const headerHTML = `
    <a id="hdr-float" href="${LINE_HREF}" target="_blank" rel="noopener">
      <svg viewBox="0 0 48 48" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
        <path d="M40 22.3C40 15 33.3 9 25 9S10 15 10 22.3c0 6.5 5.8 12 13.6 13 .5.1 1.2.4 1.4.9.2.5.1 1.2.1 1.2l-.2 1.5c-.1.5-.4 1.9 1.7.9 2.2-1 11.5-6.8 15.7-11.6 2.9-3.2 4.7-6.5 4.7-10z" fill="#fff"/>
        <path d="M21.2 19.2h-1.4c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h1.4c.3 0 .5-.2.5-.5v-6.6c0-.3-.2-.5-.5-.5zM28.6 19.2h-1.4c-.3 0-.5.2-.5.5v3.9l-3-4.2-.2-.2H22c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h1.4c.3 0 .5-.2.5-.5v-3.9l3 4.2.2.2h1.5c.3 0 .5-.2.5-.5v-6.6c0-.3-.2-.5-.5-.5zM19.2 24.3h-2.4v-4.7c0-.3-.2-.5-.5-.5h-1.4c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h4.3c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5zM33.8 20.6c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5h-4.3c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h4.3c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5H31v-1h2.8c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5H31v-1h2.8z" fill="#06C755"/>
      </svg>
      <span>LINE</span>
    </a>
    <header id="site-header">
      <div class="hdr-top">
        <a class="hdr-brand" href="index.html">
          <div class="hdr-logo">${LOGO_SVG}</div>
          <div class="hdr-text">
            <span class="hdr-name">台灣漏水醫生</span>
            <span class="hdr-sub">漏水工班快速媒合平台</span>
          </div>
        </a>
        <a href="${LINE_HREF}" target="_blank" rel="noopener" class="hdr-line-btn">
          ${LINE_ICON_SVG}
          <span class="hdr-line-text">加入 LINE 諮詢</span>
        </a>
      </div>
      <nav class="hdr-nav">${tabsHTML}</nav>
    </header>`;

  // 移除舊 header（避免重複）
  ['site-header','hdr-float','float-line'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.remove();
  });
  const oldStyle = document.getElementById('global-header-style');
  if(oldStyle) oldStyle.remove();

  document.body.insertAdjacentHTML('afterbegin', headerHTML);

  // 動態計算 header 高度，設定 body padding-top
  function applyOffset(){
    const h = document.getElementById('site-header');
    if(!h) return;
    const hh = h.getBoundingClientRect().height;
    document.body.style.setProperty('padding-top', hh + 'px', 'important');
  }
  applyOffset();
  window.addEventListener('resize', applyOffset);
  // 字體載入後重算
  setTimeout(applyOffset, 400);
  // DOM 完全載入後再算一次
  if(document.readyState !== 'complete'){
    window.addEventListener('load', applyOffset);
  }
})();
