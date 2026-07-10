/* 灰汰郎共用快速估價器
 * 用法：頁面放 <div data-ld-estimator data-preset="aircon"></div> 並載入本檔。
 * 價格資料：內建設定為準（與服務頁一致），並嘗試讀 /data/service-options.json
 * 增補「需報價」機型（四方吹、商用、水塔等）→ 導向預約表單。
 */
(function(){
  var CSS = [
'.ldq-wrap{max-width:720px;margin:0 auto}',
'.ldq-head{text-align:center;margin-bottom:1.4rem}',
'.ldq-tag{display:inline-block;font-size:.72rem;font-weight:700;letter-spacing:.06em;padding:.26rem .8rem;border-radius:99px;background:#eff6ff;color:#1d4ed8;margin-bottom:.6rem}',
'.ldq-title{font-size:1.5rem;font-weight:900;color:#111827;line-height:1.25;margin:.35rem 0}',
'.ldq-sub{font-size:.9rem;color:#6b7280}',
'.ldq-card{background:#fff;border:2px solid #e5e7eb;border-radius:18px;padding:1.4rem 1.25rem;box-shadow:0 6px 24px rgba(30,58,138,.08)}',
'.ldq-step{margin-bottom:1.15rem}',
'.ldq-label{display:flex;align-items:center;gap:.5rem;font-size:.95rem;font-weight:800;color:#111827;margin-bottom:.7rem}',
'.ldq-num{width:24px;height:24px;border-radius:50%;background:#1e3a8a;color:#fff;font-size:.8rem;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
'.ldq-opts{display:flex;flex-wrap:wrap;gap:.55rem}',
'.ldq-opt{font-size:.88rem;font-weight:700;color:#374151;background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:11px;padding:.6rem 1rem;cursor:pointer;transition:.15s;display:flex;align-items:center;gap:.4rem;font-family:inherit}',
'.ldq-opt:hover{border-color:#3b82f6}',
'.ldq-opt.on{background:#1e3a8a;color:#fff;border-color:#1e3a8a}',
'.ldq-extra{margin-top:.9rem;display:flex;flex-wrap:wrap;gap:1rem;align-items:center}',
'.ldq-qty{display:flex;align-items:center;gap:.6rem;font-size:.85rem;font-weight:700;color:#374151}',
'.ldq-stepper{display:flex;align-items:center;gap:.2rem;border:1.5px solid #e5e7eb;border-radius:10px;overflow:hidden}',
'.ldq-stepper button{width:36px;height:36px;background:#f9fafb;color:#1e3a8a;font-size:1.1rem;font-weight:900;border:none;cursor:pointer;font-family:inherit}',
'.ldq-stepper button:hover{background:#eff6ff}',
'.ldq-stepper span{min-width:36px;text-align:center;font-weight:800;color:#111827}',
'.ldq-ping{display:flex;align-items:center;gap:.6rem;font-size:.85rem;font-weight:700;color:#374151}',
'.ldq-ping input{width:96px;padding:.5rem .7rem;border:1.5px solid #e5e7eb;border-radius:9px;font-size:.9rem;font-family:inherit}',
'.ldq-ping input:focus{outline:none;border-color:#1e3a8a}',
'.ldq-result{margin-top:.3rem;background:linear-gradient(135deg,#eff6ff,#e0e7ff);border:1.5px solid #c7d2fe;border-radius:14px;padding:1.15rem 1.2rem;text-align:center;display:none}',
'.ldq-result.show{display:block}',
'.ldq-rlabel{font-size:.78rem;font-weight:700;color:#1d4ed8;letter-spacing:.04em}',
'.ldq-rprice{font-size:1.7rem;font-weight:900;color:#1e3a8a;line-height:1.2;margin:.25rem 0}',
'.ldq-rnote{font-size:.8rem;color:#4b5563;line-height:1.6;margin-bottom:.9rem}',
'.ldq-book{background:#06C755;color:#fff;font-weight:800;font-size:.95rem;padding:.8rem 1.5rem;border-radius:11px;cursor:pointer;box-shadow:0 3px 12px rgba(6,199,85,.35);width:100%;border:none;font-family:inherit}',
'.ldq-book:hover{background:#05b34c}',
'.ldq-foot{font-size:.75rem;color:#9ca3af;text-align:center;margin-top:.9rem;line-height:1.6}'
  ].join('\n');

  // 內建設定（與服務頁價目一致；改價時三處同步：頁面價目表、schema、此處＋llms.txt）
  var CONFIG = {
    order: ['aircon','washer','homeclean','watertank','leak'],
    groups: {
      aircon: {label:'冷氣清洗', icon:'❄️', book:'aircon', unit:'台', qty:true, types:[
        {n:'分離式（壁掛）', p:1499},{n:'吊隱式', p:2599},{n:'窗型', p:3000}]},
      washer: {label:'洗衣機清洗', icon:'🧺', book:'washer', unit:'台', qty:true, types:[
        {n:'直立式', p:1299},{n:'滾筒式', p:2999}]},
      homeclean: {label:'居家清潔', icon:'🧽', book:'homeclean', types:[
        {n:'定時維持清潔', base:2500, note:'4 小時起，超時每小時約 $450–600'},
        {n:'大掃除・深度清潔', min:3500, low:200, high:350, ping:true},
        {n:'退租・入住清潔', min:3000, low:200, high:350, ping:true},
        {n:'裝潢後細清', min:6000, low:400, high:1000, ping:true}]},
      watertank: {label:'水塔清洗', icon:'🚰', book:'homeclean', types:[
        {n:'不鏽鋼／塑膠水塔', quote:true},{n:'水泥水塔・蓄水池', quote:true},{n:'上下水塔一起洗', quote:true}]},
      leak: {label:'水管抓漏', icon:'💧', book:'leak-repair', free:true}
    }
  };

  // 嘗試以 service-options.json 增補「需報價」機型（失敗則靜默沿用內建）
  function enrich(cb){
    try{
      fetch('/data/service-options.json').then(function(r){return r.ok?r.json():null}).then(function(d){
        if(d && d.service_groups){
          d.service_groups.forEach(function(g){
            var key = g.id==='aircon_cleaning'?'aircon':(g.id==='washer_cleaning'?'washer':null);
            if(!key) return;
            var have = CONFIG.groups[key].types.map(function(t){return t.n});
            (g.options||[]).forEach(function(o){
              if(o.pricing && o.pricing.status==='quote_required'){
                var name = o.label;
                if(have.indexOf(name)===-1 && !have.some(function(h){return h.indexOf(o.short_label||name)!==-1})){
                  CONFIG.groups[key].types.push({n:name, quote:true});
                }
              }
            });
          });
        }
        cb();
      }).catch(function(){cb()});
    }catch(e){cb()}
  }

  function fmt(n){ return '$'+Number(n).toLocaleString('en-US'); }
  function track(name, params){ if(window.ldTrack) window.ldTrack(name, params); }

  function render(host){
    var preset = host.getAttribute('data-preset') || '';
    host.innerHTML =
      '<div class="ldq-wrap"><div class="ldq-head"><div class="ldq-tag">30 秒估價</div>'+
      '<h2 class="ldq-title">快速估價，先看行情再預約</h2>'+
      '<p class="ldq-sub">選服務、選細項，立即看到參考價格</p></div>'+
      '<div class="ldq-card">'+
      '<div class="ldq-step"><div class="ldq-label"><span class="ldq-num">1</span>選擇服務</div><div class="ldq-opts" data-r="svc"></div></div>'+
      '<div class="ldq-step" data-r="step2" style="display:none"><div class="ldq-label"><span class="ldq-num">2</span><span data-r="s2label">選擇項目</span></div><div class="ldq-opts" data-r="types"></div><div class="ldq-extra" data-r="extra"></div></div>'+
      '<div class="ldq-result" data-r="result"><div class="ldq-rlabel">參考價格</div><div class="ldq-rprice" data-r="price">—</div><div class="ldq-rnote" data-r="note"></div><button type="button" class="ldq-book" data-r="book">📋 用這個項目立即預約</button></div>'+
      '<div class="ldq-foot">以上為參考估價，實際費用以師傅到府現場評估為準</div>'+
      '</div></div>';

    var q = function(sel){ return host.querySelector('[data-r="'+sel+'"]'); };
    var sel = {g:null, ti:null, qty:1, ping:null};

    function showResult(price, note, book){
      q('price').textContent = price; q('note').textContent = note;
      q('result').classList.add('show');
      q('book').onclick = function(){ track('quote_open',{via:'estimator'}); if(window.ldOpenQuote) window.ldOpenQuote(book); };
    }
    function compute(){
      var g = CONFIG.groups[sel.g], t = g.types[sel.ti];
      if(t.quote){ showResult('需現場報價','此項目依現場條件報價，按下方按鈕留下資料，我們免費為您估價', g.book); return; }
      if(g.qty){ showResult('約 '+fmt(t.p*sel.qty)+' 起', t.n+'　'+fmt(t.p)+' / '+g.unit+' × '+sel.qty+' '+g.unit, g.book); }
      else if(t.base){ showResult(fmt(t.base)+' 起', t.note, g.book); }
      else if(t.ping){
        if(sel.ping>0){ var lo=Math.max(t.min,sel.ping*t.low), hi=Math.max(t.min,sel.ping*t.high);
          showResult('約 '+fmt(lo)+'–'+fmt(hi), t.n+'　約 $'+t.low+'–$'+t.high+'/坪，最低 '+fmt(t.min), g.book); }
        else { showResult(fmt(t.min)+' 起', t.n+'　約 $'+t.low+'–$'+t.high+'/坪（輸入坪數看區間）', g.book); }
      }
    }
    function pickType(i, btn){
      sel.ti=i; sel.qty=1; sel.ping=null;
      Array.prototype.forEach.call(q('types').children,function(c){c.classList.remove('on')});
      btn.classList.add('on');
      var g=CONFIG.groups[sel.g], t=g.types[i], ex=q('extra'); ex.innerHTML='';
      if(g.qty && !t.quote){
        var w=document.createElement('div'); w.className='ldq-qty';
        w.innerHTML='<span>數量</span><span class="ldq-stepper"><button type="button">−</button><span>1</span><button type="button">＋</button></span><span>'+g.unit+'</span>';
        var st=w.querySelector('.ldq-stepper'), num=st.children[1];
        st.children[0].onclick=function(){sel.qty=Math.max(1,sel.qty-1);num.textContent=sel.qty;compute()};
        st.children[2].onclick=function(){sel.qty=Math.min(20,sel.qty+1);num.textContent=sel.qty;compute()};
        ex.appendChild(w);
      } else if(t.ping){
        var w2=document.createElement('div'); w2.className='ldq-ping';
        w2.innerHTML='<span>坪數</span><input type="number" min="1" max="200" inputmode="numeric" placeholder="選填"><span>坪</span>';
        w2.querySelector('input').oninput=function(e){sel.ping=parseInt(e.target.value,10)||null;compute()};
        ex.appendChild(w2);
      }
      compute();
    }
    function pickSvc(key, btn){
      sel={g:key,ti:null,qty:1,ping:null};
      Array.prototype.forEach.call(q('svc').children,function(c){c.classList.remove('on')});
      if(btn) btn.classList.add('on');
      track('service_click',{service:key,via:'estimator'});
      var g=CONFIG.groups[key], tbox=q('types'), ex=q('extra');
      tbox.innerHTML=''; ex.innerHTML=''; q('result').classList.remove('show');
      if(g.free){ q('step2').style.display='none';
        showResult('免費初步判斷','傳照片給客服，免費初判漏水類型，再依現場狀況報價', g.book); return; }
      q('step2').style.display='block';
      q('s2label').textContent = g.qty?'選擇機型':'選擇類型';
      g.types.forEach(function(t,i){
        var b=document.createElement('button'); b.type='button'; b.className='ldq-opt';
        b.textContent=t.n+(t.quote?'（需報價）':''); b.onclick=function(){pickType(i,b)};
        tbox.appendChild(b);
      });
    }
    CONFIG.order.forEach(function(key){
      var g=CONFIG.groups[key];
      var b=document.createElement('button'); b.type='button'; b.className='ldq-opt';
      b.innerHTML='<span>'+g.icon+'</span>'+g.label; b.onclick=function(){pickSvc(key,b)};
      q('svc').appendChild(b);
      if(preset===key){ setTimeout(function(){ b.click(); },0); }
    });
  }

  function init(){
    var hosts = document.querySelectorAll('[data-ld-estimator]');
    if(!hosts.length) return;
    if(!document.getElementById('ldq-style')){
      var s=document.createElement('style'); s.id='ldq-style'; s.textContent=CSS;
      document.head.appendChild(s);
    }
    enrich(function(){ Array.prototype.forEach.call(hosts, render); });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
