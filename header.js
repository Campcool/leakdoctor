(function(){
  // 判斷當前頁面
  const path = location.pathname.split('/').pop() || 'index.html';
  const page = path.replace('.html','') || 'index';

  // 注入字體
  if(!document.querySelector('link[href*="fonts.googleapis"]')){
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap';
    document.head.appendChild(link);
  }

  // 注入全域 CSS
  const style = document.createElement('style');
  style.textContent = `
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{font-family:'Noto Sans TC',sans-serif;color:#1a202c;background:#f8fafc;line-height:1.8;font-size:18px;padding-top:0}
    a{text-decoration:none;color:inherit}
    :root{
      --blue:#1d4ed8;--blue-dark:#1e3a8a;--blue-light:#eff6ff;--blue-mid:#3b82f6;
      --green:#16a34a;--teal:#0d9488;--teal-light:#f0fdfa;
      --orange:#ea580c;--orange-light:#fff7ed;
      --purple:#7c3aed;--purple-light:#f5f3ff;
      --red:#dc2626;
      --gray-100:#f3f4f6;--gray-200:#e5e7eb;--gray-500:#6b7280;--gray-900:#111827;
    }
    /* Float LINE */
    #float-line{
      position:fixed;right:1rem;top:50%;transform:translateY(-50%);z-index:999;
      width:60px;height:60px;border-radius:50%;
      background:#06C755;color:#fff;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      font-size:.62rem;font-weight:700;line-height:1.4;
      box-shadow:0 4px 20px rgba(6,199,85,.55);
      animation:gpulse 2.5s ease-in-out infinite;
      text-decoration:none;
    }
    @keyframes gpulse{
      0%,100%{box-shadow:0 4px 20px rgba(6,199,85,.55)}
      50%{box-shadow:0 4px 32px rgba(6,199,85,.8),0 0 0 10px rgba(6,199,85,.12)}
    }
    /* ── Header：手機/PC 均固定在頂部 ── */
    #site-header{
      position:fixed;top:0;left:0;right:0;z-index:1000;
      background:rgba(255,255,255,.98);
      border-bottom:2px solid #e5e7eb;
      box-shadow:0 2px 12px rgba(0,0,0,.08);
    }
    /* body 補償 fixed header 佔的高度 */
    body{padding-top:var(--hdr-h,116px)}

    .hdr-top{
      padding:.52rem 1rem;
      display:flex;align-items:center;justify-content:space-between;gap:.5rem;
      max-width:1200px;margin:0 auto;
    }
    .hdr-brand{display:flex;align-items:center;gap:.52rem;text-decoration:none}
    .hdr-logo svg{width:38px;height:38px;flex-shrink:0}
    .hdr-name{font-size:1rem;font-weight:900;color:#1e3a8a;white-space:nowrap}
    .hdr-sub{font-size:.58rem;color:#3b82f6;font-weight:500;display:block;margin-top:1px;white-space:nowrap}
    .hdr-line{
      display:flex;align-items:center;gap:.28rem;
      background:#06C755;color:#fff;font-weight:700;
      font-size:.72rem;padding:.36rem .68rem;border-radius:9px;
      white-space:nowrap;text-decoration:none;flex-shrink:0;
    }
    .hdr-line svg{width:18px;height:18px;flex-shrink:0}
    .hdr-line-text{display:none}

    /* ── 頁籤（手機版加大） ── */
    .page-nav{
      background:#1e3a8a;
      padding:.42rem .65rem;
      display:flex;gap:.35rem;
      overflow-x:auto;scrollbar-width:none;
    }
    .page-nav::-webkit-scrollbar{display:none}
    .pn-link{
      display:flex;flex-direction:column;align-items:center;gap:.22rem;
      padding:.52rem .65rem;border-radius:10px;min-width:60px;
      background:rgba(255,255,255,.12);border:1.5px solid rgba(255,255,255,.16);
      cursor:pointer;transition:.2s;flex-shrink:0;text-decoration:none;
    }
    .pn-link:hover{background:rgba(255,255,255,.24);transform:translateY(-1px)}
    .pn-link.active{background:#fff;border-color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.12)}
    .pn-icon{font-size:1.15rem;line-height:1}
    .pn-label{font-size:.65rem;font-weight:700;color:rgba(255,255,255,.94);white-space:nowrap;line-height:1.2}
    .pn-sub{display:none;font-size:.52rem;color:rgba(255,255,255,.5);white-space:nowrap}
    .pn-link.active .pn-label{color:#1e3a8a}
    .pn-link.active .pn-sub{color:#64748b}

    /* ── PC ≥1024px ── */
    @media(min-width:1024px){
      body{font-size:15px;padding-top:var(--hdr-h,136px)}
      .hdr-top{padding:.85rem 2.5rem}
      .hdr-logo svg{width:52px;height:52px}
      .hdr-name{font-size:1.35rem}
      .hdr-sub{font-size:.72rem}
      .hdr-line{font-size:.88rem;padding:.5rem 1.1rem;gap:.42rem}
      .hdr-line svg{width:22px;height:22px}
      .hdr-line-text{display:inline}
      .page-nav{padding:.85rem 2.5rem;justify-content:center;gap:.65rem}
      .pn-link{min-width:90px;padding:.75rem 1rem;gap:.3rem;border-radius:12px}
      .pn-icon{font-size:1.45rem}
      .pn-label{font-size:.75rem}
      .pn-sub{display:block}
    }
  `;
  document.head.appendChild(style);

  // 頁籤定義
  const tabs = [
    {id:'index',    href:'index.html',     icon:'🏠', label:'首頁',     sub:'回主頁'},
    {id:'knowledge',href:'knowledge.html', icon:'📖', label:'漏水百科', sub:'免費知識'},
    {id:'cases',    href:'cases.html',     icon:'📋', label:'施工案例', sub:'真實記錄'},
    {id:'team',     href:'team.html',      icon:'👷', label:'合作廠商', sub:'師傅介紹'},
    {id:'pricing',  href:'index.html#pricing', icon:'💰', label:'費用行情', sub:'透明報價'},
    {id:'area',     href:'index.html#service-area', icon:'📍', label:'服務地區', sub:'全台本島'},
    {id:'protect',  href:'index.html#consumer-protect', icon:'🛡️', label:'消費者保障', sub:'避免踩雷'},
  ];

  // 建立 header HTML
  const tabsHTML = tabs.map(t => `
    <a href="${t.href}" class="pn-link${t.id===page?' active':''}">
      <span class="pn-icon">${t.icon}</span>
      <span class="pn-label">${t.label}</span>
      <span class="pn-sub">${t.sub}</span>
    </a>`).join('');

  const headerHTML = `
    <a id="float-line" href="https://lin.ee/rjmmYyC" target="_blank" rel="noopener">
      <svg width="28" height="28" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path d="M40 22.3C40 15 33.3 9 25 9S10 15 10 22.3c0 6.5 5.8 12 13.6 13 .5.1 1.2.4 1.4.9.2.5.1 1.2.1 1.2l-.2 1.5c-.1.5-.4 1.9 1.7.9 2.2-1 11.5-6.8 15.7-11.6 2.9-3.2 4.7-6.5 4.7-10z" fill="#fff"/>
        <path d="M21.2 19.2h-1.4c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h1.4c.3 0 .5-.2.5-.5v-6.6c0-.3-.2-.5-.5-.5zM28.6 19.2h-1.4c-.3 0-.5.2-.5.5v3.9l-3-4.2-.2-.2H22c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h1.4c.3 0 .5-.2.5-.5v-3.9l3 4.2.2.2h1.5c.3 0 .5-.2.5-.5v-6.6c0-.3-.2-.5-.5-.5zM19.2 24.3h-2.4v-4.7c0-.3-.2-.5-.5-.5h-1.4c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h4.3c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5zM33.8 20.6c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5h-4.3c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h4.3c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5H31v-1h2.8c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5H31v-1h2.8z" fill="#06C755"/>
      </svg>
      <span style="font-size:.58rem;font-weight:700;margin-top:2px">LINE</span>
    </a>

    <header id="site-header">
      <div class="hdr-top">
        <a class="hdr-brand" href="index.html">
          <div class="hdr-logo">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 18L22 52Q22 72 42 72Q62 72 62 52L62 44" fill="none" stroke="#0d9488" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="22" cy="16" r="8" fill="#0d9488"/>
              <circle cx="22" cy="16" r="4" fill="#f0fdfa"/>
              <circle cx="62" cy="42" r="8" fill="#0d9488"/>
              <circle cx="62" cy="42" r="4" fill="#f0fdfa"/>
              <path d="M42 56C42 56 24 72 24 84C24 93 32 100 42 100C52 100 60 93 60 84C60 72 42 56 42 56Z" fill="#1d4ed8" stroke="#60a5fa" stroke-width="2"/>
              <path d="M33 84Q42 76 51 84" fill="none" stroke="#93c5fd" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M36 91Q42 86 48 91" fill="none" stroke="#bfdbfe" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div>
            <div class="hdr-name">台灣漏水醫生</div>
            <span class="hdr-sub">漏水工班快速媒合平台</span>
          </div>
        </a>
        <a href="https://lin.ee/rjmmYyC" target="_blank" rel="noopener" class="hdr-line">
          <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="10" fill="#fff"/>
            <path d="M40 22.3C40 15 33.3 9 25 9S10 15 10 22.3c0 6.5 5.8 12 13.6 13 .5.1 1.2.4 1.4.9.2.5.1 1.2.1 1.2l-.2 1.5c-.1.5-.4 1.9 1.7.9 2.2-1 11.5-6.8 15.7-11.6 2.9-3.2 4.7-6.5 4.7-10z" fill="#06C755"/>
            <path d="M21.2 19.2h-1.4c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h1.4c.3 0 .5-.2.5-.5v-6.6c0-.3-.2-.5-.5-.5zM28.6 19.2h-1.4c-.3 0-.5.2-.5.5v3.9l-3-4.2-.2-.2H22c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h1.4c.3 0 .5-.2.5-.5v-3.9l3 4.2.2.2h1.5c.3 0 .5-.2.5-.5v-6.6c0-.3-.2-.5-.5-.5zM19.2 24.3h-2.4v-4.7c0-.3-.2-.5-.5-.5h-1.4c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h4.3c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5zM33.8 20.6c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5h-4.3c-.3 0-.5.2-.5.5v6.6c0 .3.2.5.5.5h4.3c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5H31v-1h2.8c.3 0 .5-.2.5-.5v-1.4c0-.3-.2-.5-.5-.5H31v-1h2.8z" fill="#fff"/>
          </svg>
          <span class="hdr-line-text">加入 LINE 諮詢</span>
        </a>
      </div>
      <nav class="page-nav">${tabsHTML}</nav>
    </header>
  `;

  // 插入到 body 最前面
  document.body.insertAdjacentHTML('afterbegin', headerHTML);

  // 動態計算 header 高度，確保 body padding-top 正確
  function setHeaderOffset(){
    const h = document.getElementById('site-header');
    if(h){
      const hh = h.offsetHeight;
      document.documentElement.style.setProperty('--hdr-h', hh + 'px');
      document.body.style.paddingTop = hh + 'px';
    }
  }
  setHeaderOffset();
  window.addEventListener('resize', setHeaderOffset);
  // 字體載入後再算一次
  setTimeout(setHeaderOffset, 300);
})();
