(function(){
  'use strict';

  // Public retail snapshot: leakdoctor-bot main@3a5b94e, src/catalog.ts (2026-08-30).
  // Supplier costs (including -1) are NOT retail prices. Bot re-prices every draft.
  const services = [
    {id:'wall_mounted_split',group:'aircon',groupLabel:'冷氣清洗',label:'壁掛分離式冷氣清洗（室內機）',unit:'台',price:1599,note:'價格只含室內機；室外機另列加購',popular:true},
    {id:'ceiling_concealed',group:'aircon',groupLabel:'冷氣清洗',label:'吊隱式冷氣清洗（二風鼓，室內機）',unit:'台',price:2799,note:'價格只含室內機；室外機與三風鼓以上另加購'},
    {id:'transformer_split_aircon',group:'aircon',groupLabel:'冷氣清洗',label:'變形金剛機型冷氣清洗（國際牌／三菱）',unit:'台',price:2500,note:'需提供品牌、型號與照片'},
    {id:'blower_wheel_removal',group:'aircon',groupLabel:'冷氣加購',label:'風鼓拆下深度清洗（加購）',unit:'台',price:800,note:'需搭配冷氣清洗'},
    {id:'ceiling_concealed_extra_blower',group:'aircon',groupLabel:'冷氣加購',label:'吊隱式加購風鼓（每多一組）',unit:'組',price:500,note:'三風鼓以上適用'},
    {id:'aircon_outdoor_unit',group:'aircon',groupLabel:'冷氣加購',label:'室外機清洗',unit:'台',price:500,note:'壁掛與吊隱都需另加購；需確認安裝位置與安全條件',popular:true},
    {id:'window_aircon',group:'aircon',groupLabel:'冷氣清洗',label:'窗型冷氣清洗',unit:'台',quote:true,priceLabel:'3 台以上再安排評估',note:'需兩人搬抬，未達三台先由專員確認'},
    {id:'ceiling_cassette_4way',group:'aircon',groupLabel:'冷氣清洗',label:'四方吹冷氣清洗',unit:'台',quote:true,priceLabel:'依機型與高度報價',note:'請提供面板與現場照片'},
    {id:'commercial_aircon',group:'aircon',groupLabel:'冷氣清洗',label:'商用冷氣清洗',unit:'案',quote:true,priceLabel:'依案件報價',note:'需確認機型、數量與進場限制'},

    {id:'top_load_washer',group:'washer',groupLabel:'洗衣機清洗',label:'直立式洗衣機清洗',unit:'台',price:1599,note:'需確認品牌、容量與型號',popular:true},
    {id:'front_load_drum_washer',group:'washer',groupLabel:'洗衣機清洗',label:'滾筒式洗衣機清洗',unit:'台',price:3599,note:'日立／三菱洗脫烘需先確認機型'},
    {id:'commercial_washer',group:'washer',groupLabel:'洗衣機清洗',label:'商用或投幣洗衣機清洗',unit:'台',quote:true,priceLabel:'依型號與容量報價',note:'請提供正面照與型號'},

    {id:'home_cleaning_4h',group:'homeclean',groupLabel:'居家清潔',label:'定時居家清潔 4 小時',unit:'次',price:2500,note:'實際範圍依現場狀況確認',popular:true},
    {id:'deep_cleaning',group:'homeclean',groupLabel:'居家清潔',label:'大掃除',unit:'案',quote:true,priceLabel:'NT$ 3,500 起',note:'依坪數與現況確認'},
    {id:'move_out_cleaning',group:'homeclean',groupLabel:'居家清潔',label:'退租清潔',unit:'案',quote:true,priceLabel:'NT$ 3,000 起',note:'依坪數、家具與髒污程度確認'},
    {id:'post_renovation_cleaning',group:'homeclean',groupLabel:'居家清潔',label:'裝潢細清',unit:'案',quote:true,priceLabel:'NT$ 6,000 起',note:'依坪數與粉塵、膠漬狀況確認'},
    {id:'range_hood_cleaning',group:'homeclean',groupLabel:'居家清潔',label:'抽油煙機清洗',unit:'台',quote:true,priceLabel:'依機型報價',note:'請提供正面照與油垢狀況'},

    {id:'rooftop_tank',group:'water',groupLabel:'水路服務',label:'白鐵（不鏽鋼）水塔清洗',unit:'顆',price:1599,note:'目前僅承接白鐵水塔',popular:true},
    {id:'water_pipe_cleaning',group:'water',groupLabel:'水路服務',label:'水管清洗－大樓／公寓（給水管路除垢）',unit:'戶',price:3599,note:'需先確認屋齡、管材與出水點',popular:true},
    {id:'water_pipe_cleaning_house',group:'water',groupLabel:'水路服務',label:'水管清洗－透天（給水管路除垢）',unit:'戶',price:4999,note:'需先確認樓層、管材與出水點'},
    {id:'leak_inspection',group:'water',groupLabel:'漏水服務',label:'水管抓漏',unit:'案',quote:true,priceLabel:'LINE 免費初判',note:'實際檢測與修補費用依現場確認',popular:true}
  ];

  const money = new Intl.NumberFormat('zh-TW');
  function clampQuantity(value){
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0,Math.min(20,Math.floor(number))) : 0;
  }
  function calculate(quantities){
    const chosen = services.map(function(item){ return Object.assign({},item,{quantity:clampQuantity(quantities.get(item.id) || 0)}); }).filter(function(item){ return item.quantity > 0; });
    // 固定價排前面，與畫面順序一致。Bot 會用第一行「服務內容」推訂單主服務
    // （parser.ts：service = serviceLines[0].label），排序若讓待報價項目排第一，
    // 訂單標題與業主通知就會掛成需報價品項，即使客戶主要買的是固定價服務。
    const priced = chosen.filter(function(item){return !item.quote;});
    const quoted = chosen.filter(function(item){return item.quote;});
    const items = priced.concat(quoted);
    return {items:items, priced:priced, quoted:quoted, amount:priced.reduce(function(sum,item){return sum + item.price * item.quantity;},0)};
  }
  function detailLines(items){
    return items.map(function(item){ return item.label + ' × ' + item.quantity + item.unit + '（' + (item.quote ? '需專員確認報價' : '參考價 $' + money.format(item.price) + '／' + item.unit) + '）'; });
  }
  function routeForHash(hash){return ['#price-overview','#home-order-summary'].includes(hash) ? 'price' : 'knowledge';}
  function formatMessage(quantities,customer,leadId){
    const result = calculate(quantities);
    const clean = function(value){return String(value || '').replace(/[\r\n]+/g,' ').trim();};
    const lines = ['【灰汰郎 到府服務詢價】'];
    if(leadId) lines.push('線索編號：' + clean(leadId));
    if(customer.name) lines.push('姓名：' + clean(customer.name));
    if(customer.phone) lines.push('電話：' + clean(customer.phone));
    if(customer.address) lines.push('服務地址：' + clean(customer.address));
    lines.push('服務項目：多項到府服務');
    detailLines(result.items).forEach(function(line){lines.push('服務內容：' + line);});
    if(result.priced.length) lines.push('已定價項目小計：NT$ ' + money.format(result.amount));
    if(result.quoted.length) lines.push('待報價項目：需依照片或現場條件另行確認，未列入上述小計');
    if(customer.time) lines.push('希望時段：' + clean(customer.time));
    lines.push('現場狀況／備註：由首頁價格試算帶入；最終服務內容與金額以專員確認為準。');
    return lines.join('\n');
  }
  // Pure calculation / parser-contract tests can run without a browser or network.
  if(typeof module !== 'undefined' && module.exports) module.exports = {services,clampQuantity,calculate,detailLines,formatMessage,routeForHash};
  if(typeof document === 'undefined') return;
  const state = {filter:'popular', quantities:new Map(),submitting:false,
    submittedLeadId:'',
    // 上一次送出結果的訊息與當時的「內容指紋」。
    // 指紋沒變＝同一筆需求，訊息要留著（成功時鎖住送出鈕、逾時時保留警告）；
    // 指紋變了＝客戶改了內容，才視為新的一筆詢價並解鎖。
    lastStatus:'', lastSignature:''};
  const root = document.getElementById('service-hub');
  if(!root) return;

  const list = document.getElementById('home-price-list');
  const summary = document.getElementById('home-order-lines');
  const empty = document.getElementById('home-order-empty');
  const total = document.getElementById('home-order-total');
  const quoteNote = document.getElementById('home-order-quote-note');
  const status = document.getElementById('home-order-status');
  const lineButton = document.getElementById('home-order-line');

  function setRoute(route, focus, record){
    if(record !== false && location.hash !== '#' + route + '-overview') history.pushState(history.state,'','#' + route + '-overview');
    document.body.classList.toggle('home-price-active',route === 'price');
    const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
    tabs.forEach(function(tab){
      const selected = tab.dataset.route === route;
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      tab.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      if(panel) panel.hidden = !selected;
    });
    if(focus){
      const active = tabs.find(function(tab){ return tab.dataset.route === route; });
      if(active) active.focus();
    }
  }

  root.addEventListener('click', function(event){
    const routeTab = event.target.closest('[data-route]');
    if(routeTab){
      setRoute(routeTab.dataset.route, false);
      return;
    }
    const filter = event.target.closest('[data-price-filter]');
    if(filter){
      state.filter = filter.dataset.priceFilter;
      root.querySelectorAll('[data-price-filter]').forEach(function(button){
        button.setAttribute('aria-pressed', button === filter ? 'true' : 'false');
      });
      renderList();
      return;
    }
    const quantityButton = event.target.closest('[data-quantity-action]');
    if(quantityButton){
      const id = quantityButton.dataset.serviceId;
      const current = state.quantities.get(id) || 0;
      const next = clampQuantity(current + (quantityButton.dataset.quantityAction === 'add' ? 1 : -1));
      state.quantities.set(id, next);
      updateRow(id, next);
      updateSummary();
    }
  });

  root.addEventListener('input', function(event){
    if(!event.target.matches('[data-quantity-value]')) return;
    const id = event.target.dataset.quantityValue;
    const value = clampQuantity(event.target.value);
    state.quantities.set(id,value);
    // Preserve an empty input while typing; normalise on change/blur.
    if(event.target.value !== '') event.target.value = value;
    updateSummary();
    event.target.closest('[data-service-row]').dataset.active = value > 0 ? 'true' : 'false';
  });
  root.addEventListener('change',function(event){
    if(event.target.matches('[data-quantity-value]')) updateRow(event.target.dataset.quantityValue,clampQuantity(event.target.value));
  });
  // 聯絡欄位也算在指紋裡：改了姓名／電話等同新的一筆詢價，要解鎖送出鈕。
  ['home-order-name','home-order-phone','home-order-address','home-order-time'].forEach(function(id){
    document.getElementById(id).addEventListener('input', updateSummary);
  });

  root.addEventListener('keydown', function(event){
    const tab = event.target.closest('[role="tab"]');
    if(!tab || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[tabs.length-1] : tabs[(tabs.indexOf(tab) + direction + tabs.length) % tabs.length];
    setRoute(next.dataset.route, true);
  });

  document.querySelectorAll('[data-home-route-target]').forEach(function(trigger){
    trigger.addEventListener('click', function(event){
      event.preventDefault();
      setRoute(trigger.dataset.homeRouteTarget, false);
      root.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',block:'start'});
    });
  });

  function visibleServices(){
    if(state.filter === 'all') return services;
    if(state.filter === 'popular') return services.filter(function(item){ return item.popular; });
    return services.filter(function(item){ return item.group === state.filter; });
  }

  function renderList(){
    const fixed = visibleServices().filter(function(item){ return !item.quote; });
    const quoted = visibleServices().filter(function(item){ return item.quote; });
    const chunks = [];
    fixed.forEach(function(item){ chunks.push(rowHtml(item)); });
    if(quoted.length){
      chunks.push('<div class="price-quote-divider" role="presentation">需要照片或現場條件</div>');
      quoted.forEach(function(item){ chunks.push(rowHtml(item)); });
    }
    list.innerHTML = chunks.join('');
  }

  function rowHtml(item){
    const qty = state.quantities.get(item.id) || 0;
    const price = item.quote ? item.priceLabel : 'NT$ ' + money.format(item.price) + '／' + item.unit;
    return '<article class="price-item" data-service-row="' + item.id + '" data-active="' + (qty > 0) + '">' +
      '<div class="price-item-main"><div class="price-item-type">' + item.groupLabel + (item.quote ? '・專員確認' : '・固定參考價') + '</div>' +
      '<div class="price-item-name">' + item.label + '</div><div class="price-item-price">' + price + '</div><div class="price-item-note">' + item.note + '</div></div>' +
      '<div class="qty-stepper" aria-label="' + item.label + '數量">' +
      '<button class="qty-btn" type="button" data-quantity-action="subtract" data-service-id="' + item.id + '" aria-label="減少' + item.label + '數量">−</button>' +
      '<input class="qty-value" type="number" inputmode="numeric" min="0" max="20" step="1" data-quantity-value="' + item.id + '" aria-label="' + item.label + '數量" value="' + qty + '">' +
      '<button class="qty-btn" type="button" data-quantity-action="add" data-service-id="' + item.id + '" aria-label="增加' + item.label + '數量">＋</button></div></article>';
  }

  function updateRow(id, quantity){
    const row = list.querySelector('[data-service-row="' + id + '"]');
    if(!row) return;
    row.dataset.active = quantity > 0 ? 'true' : 'false';
    const output = row.querySelector('[data-quantity-value]');
    if(output) output.value = quantity;
  }

  function selectedItems(){
    return calculate(state.quantities).items;
  }

  /** 選項數量＋聯絡欄位的內容指紋；用來判斷「還是同一筆需求」。 */
  function signature(){
    const picks = selectedItems().map(function(item){ return item.id + ':' + item.quantity; }).join(',');
    return picks + '|' + ['home-order-name','home-order-phone','home-order-address','home-order-time']
      .map(function(id){ return (document.getElementById(id).value || '').trim(); }).join('|');
  }

  /** 已建案且內容沒變就鎖住送出鈕，避免手機從 LINE 切回後再按一次多建一筆線索。 */
  function isLockedAsSubmitted(){
    return Boolean(state.submittedLeadId) && signature() === state.lastSignature;
  }

  function updateSummary(){
    const selected = selectedItems();
    const priced = selected.filter(function(item){ return !item.quote; });
    const quoted = selected.filter(function(item){ return item.quote; });
    const amount = priced.reduce(function(sum,item){ return sum + item.price * item.quantity; },0);
    summary.innerHTML = selected.map(function(item){
      const amountText = item.quote ? '待確認' : 'NT$ ' + money.format(item.price * item.quantity);
      return '<div class="order-line"><span>' + item.label + ' × ' + item.quantity + item.unit + '</span><strong>' + amountText + '</strong></div>';
    }).join('');
    empty.hidden = selected.length > 0;
    summary.hidden = selected.length === 0;
    total.textContent = !priced.length && quoted.length ? '待報價' : 'NT$ ' + money.format(amount);
    document.getElementById('home-order-total-label').textContent = quoted.length ? '已定價小計' : '參考總價';
    document.getElementById('home-price-mini-total').textContent = selected.length ? total.textContent + (priced.length && quoted.length ? ' ＋ 待報價' : '') : '尚未選擇';
    quoteNote.hidden = quoted.length === 0;
    quoteNote.textContent = quoted.length ? '另有 ' + quoted.length + ' 項需要照片或現場條件確認，未計入固定小計。' : '';
    const warning = document.getElementById('home-order-warning');
    warning.hidden = selected.length <= 12;
    warning.textContent = selected.length > 12 ? '單次最多 12 種項目，請減少項目或分次詢問；每種數量可各自設定。' : '';
    const locked = isLockedAsSubmitted();
    lineButton.disabled = selected.length === 0 || state.submitting || locked;
    document.getElementById('home-order-copy').disabled = selected.length === 0 || state.submitting;
    // 指紋沒變就保留上次的成功／逾時訊息；客戶改了內容才清空並解鎖成新的一筆。
    if(state.lastStatus && signature() === state.lastSignature){
      status.textContent = state.lastStatus;
    } else {
      state.lastStatus = ''; state.lastSignature = ''; state.submittedLeadId = '';
      status.textContent = '';
    }
  }

  function customerData(requireAll){
    const data = {
      name:document.getElementById('home-order-name').value.trim(),
      phone:document.getElementById('home-order-phone').value.trim(),
      address:document.getElementById('home-order-address').value.trim(),
      time:document.getElementById('home-order-time').value.trim()
    };
    if(!requireAll) return data;
    if(!data.name || !/^09\d{8}$/.test(data.phone.replace(/[\s-]/g,''))){
      status.textContent = '請填寫稱呼與 09 開頭的十碼手機號碼；地址可以稍後補。';
      const firstMissing = !data.name ? 'home-order-name' : 'home-order-phone';
      document.getElementById(firstMissing).focus();
      return null;
    }
    data.phone = data.phone.replace(/[\s-]/g,'');
    return data;
  }

  function buildMessage(requireAll){
    const selected = selectedItems();
    if(!selected.length){ status.textContent = '請先選擇至少一項服務與數量。'; return null; }
    if(selected.length > 12){status.textContent = '單次最多整理 12 種項目，請分兩次詢問，避免明細遺漏。';return null;}
    const customer = customerData(requireAll);
    if(!customer) return null;
    return formatMessage(state.quantities,customer);
  }

  async function copyText(text){
    if(navigator.clipboard && window.isSecureContext){
      try { await navigator.clipboard.writeText(text); return; } catch(error) { /* Older webviews: try selection copy. */ }
    }
    const previousFocus = document.activeElement;
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    if(previousFocus) previousFocus.focus({preventScroll:true});
    return copied ? Promise.resolve() : Promise.reject(new Error('copy failed'));
  }

  document.getElementById('home-order-copy').addEventListener('click', function(){
    const message = buildMessage(false);
    if(!message) return;
    copyText(message).then(function(){ status.textContent = '明細已複製，可直接貼到 LINE。'; }).catch(function(){ status.textContent = '無法自動複製，請使用 LINE 按鈕帶入明細。'; });
  });

  document.getElementById('home-order-form').addEventListener('submit', async function(event){
    event.preventDefault();
    if(state.submitting || !buildMessage(true)) return;
    const customer = customerData(true);
    const quantities = new Map(state.quantities);
    const selected = calculate(quantities).items;
    state.submitting = true;
    root.querySelectorAll('input,button').forEach(function(control){control.disabled = true;});
    status.textContent = '正在安全儲存需求，請稍候…';
    try {
      if(typeof window.ldCreatePriceInquiry !== 'function') throw new Error('inquiry_unavailable');
      const serviceName = selected[0].id === 'rooftop_tank' ? '水塔清洗' : selected[0].id.startsWith('water_pipe') ? '水管清洗' : selected[0].id === 'leak_inspection' ? '漏水檢測與修補' : selected[0].groupLabel.replace('加購','清洗');
      const result = await window.ldCreatePriceInquiry({name:customer.name,phone:customer.phone,address:customer.address,preferredTime:customer.time,service:serviceName,details:detailLines(selected),note:'首頁價格試算；最終金額與服務條件需確認。'});
      const message = formatMessage(quantities,customer,result.leadId);
      let copied = true;
      try { await copyText(message); } catch(error){copied = false;}
      state.submittedLeadId = result.leadId;
      state.lastStatus = '需求 ' + result.leadId + ' 已儲存。' + (copied ? '明細已複製；' : '明細將帶入 LINE；') + '請在 LINE 按傳送，接續確認預約。改動任一欄位或數量才會視為新的一筆詢價。';
      status.textContent = state.lastStatus;
      window.location.href = result.lineBase + encodeURIComponent(message);
    } catch(error){
      // 逾時／失敗不代表伺服器一定沒寫入，訊息要留著，不能被下一次 updateSummary 清掉。
      state.lastStatus = '目前無法確認需求已儲存，未開啟 LINE。請稍後重試；也可先複製明細，再從「LINE 直接問」貼上詢問。';
      status.textContent = state.lastStatus;
    } finally {
      state.submitting = false;
      root.querySelectorAll('input,button').forEach(function(control){control.disabled = false;});
      // 記下這次送出當下的內容指紋，讓 updateSummary 判斷是否要維持鎖定與保留訊息。
      // 手機開 LINE 後切回來頁面還活著；若整組解鎖，再按一次會多一筆 D1 線索，
      // 並重複送出 generate_lead／quote_submit（後者是 Google Ads 的主要轉換）。
      state.lastSignature = signature();
      updateSummary();
    }
  });

  document.getElementById('home-price-reset').addEventListener('click', function(){
    state.quantities.clear();
    state.submittedLeadId = ''; state.lastStatus = ''; state.lastSignature = '';
    renderList();
    updateSummary();
  });

  function syncRoute(){setRoute(routeForHash(location.hash),false,false);}
  window.addEventListener('popstate',function(){if(['','#price-overview','#knowledge-overview','#home-order-summary'].includes(location.hash)) syncRoute();});
  window.addEventListener('hashchange',function(){if(['#price-overview','#knowledge-overview'].includes(location.hash)) syncRoute();});
  syncRoute();
  if(location.hash === '#price-overview') requestAnimationFrame(function(){root.scrollIntoView({block:'start'});});
  renderList();
  updateSummary();
})();
