(function(){
  'use strict';
  document.documentElement.classList.add('craft-js');

  function init(){
    var revealTargets = document.querySelectorAll('.svc-card,.process-card,.service-step,.promise-item,.impact-card,.item-card,.knowledge-card,.craft-case,.scope-card,.quote-method-grid>div');
    revealTargets.forEach(function(el,index){
      el.setAttribute('data-craft-reveal','');
      el.style.transitionDelay = Math.min(index % 4,3) * 70 + 'ms';
    });

    if('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      var observer = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){
            entry.target.classList.add('craft-visible');
            observer.unobserve(entry.target);
          }
        });
      },{rootMargin:'0px 0px -8% 0px',threshold:.08});
      revealTargets.forEach(function(el){ observer.observe(el); });
    }else{
      revealTargets.forEach(function(el){ el.classList.add('craft-visible'); });
    }

    document.querySelectorAll('.craft-compare').forEach(function(compare){
      var range = compare.querySelector('.craft-compare-range');
      if(!range) return;
      function update(){ compare.style.setProperty('--compare',range.value + '%'); }
      range.addEventListener('input',update,{passive:true});
      range.addEventListener('change',update,{passive:true});
      update();
    });

    var toc = document.querySelector('.service-toc');
    if(toc){
      function setTocHeight(){
        document.documentElement.style.setProperty('--service-toc-h',toc.offsetHeight + 'px');
      }
      setTocHeight();
      var tocLinks = Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]'));
      var tocTargets = tocLinks.map(function(link){
        try { return document.querySelector(link.getAttribute('href')); }
        catch(error) { return null; }
      });
      function setCurrentToc(){
        var offset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ld-hdr-h')) || 100;
        var marker = window.scrollY + offset + toc.offsetHeight + 28;
        var current = -1;
        var currentOffset = -1;
        tocTargets.forEach(function(target,index){
          if(target && target.offsetTop <= marker && target.offsetTop >= currentOffset){
            current = index;
            currentOffset = target.offsetTop;
          }
        });
        tocLinks.forEach(function(link,index){
          var active = index === current;
          link.classList.toggle('is-current',active);
          if(active) link.setAttribute('aria-current','location');
          else link.removeAttribute('aria-current');
        });
      }
      var tocTicking = false;
      function requestTocUpdate(){
        if(tocTicking) return;
        tocTicking = true;
        window.requestAnimationFrame(function(){ tocTicking=false; setCurrentToc(); });
      }
      window.addEventListener('scroll',requestTocUpdate,{passive:true});
      window.addEventListener('resize',function(){ setTocHeight(); requestTocUpdate(); },{passive:true});
      tocLinks.forEach(function(link){
        link.addEventListener('click',function(){
          tocLinks.forEach(function(item){ item.classList.remove('is-current'); item.removeAttribute('aria-current'); });
          link.classList.add('is-current');
          link.setAttribute('aria-current','location');
        });
      });
      setCurrentToc();
    }

    initPriceTableLabels();
    initServiceLayerTabs();
  }

  function initServiceLayerTabs(){
    if(!document.body.classList.contains('service-page')) return;
    var cta = document.querySelector('#cta-bottom');
    var bodyChildren = Array.prototype.slice.call(document.body.children);
    var blocks = bodyChildren.filter(function(el){
      if(!(el.matches('section') || el.classList.contains('service-story'))) return false;
      if(el.id === 'page-hero' || el.id === 'hero' || el.id === 'cta-bottom') return false;
      if(cta && el.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_PRECEDING) return false;
      return true;
    });
    if(blocks.length < 4) return;

    var decisionIndex = blocks.findIndex(function(el){
      return /pricing/.test(el.id || '') || !!el.querySelector('[id$="-pricing"],#pricing,.pricing-block,.price-table');
    });
    if(decisionIndex < 0) return;

    var pricingBlock = blocks[decisionIndex];
    var panels = blocks.filter(function(el,index){
      if(index === decisionIndex) return false;
      if(el.id === 'cta-bottom') return false;
      if(el.classList.contains('service-layer-tabs')) return false;
      return getLayerLabel(el) !== '';
    });
    if(panels.length < 2 || document.querySelector('.service-layer-tabs')) return;

    var tabs = document.createElement('section');
    tabs.className = 'service-layer-tabs';
    tabs.setAttribute('aria-label','服務內容分頁');
    tabs.innerHTML = '<div class="service-layer-tabs-inner"><div class="service-layer-kicker">深入了解</div><div class="service-layer-tablist" role="tablist" aria-label="切換服務內容"></div></div>';
    var tablist = tabs.querySelector('.service-layer-tablist');

    var usedLabels = {};
    panels.forEach(function(panel,index){
      panel.classList.add('service-layer-panel');
      if(!panel.id) panel.id = 'service-layer-panel-' + index;
      var label = getLayerLabel(panel);
      if(usedLabels[label]){
        label = label === '內容' ? '延伸' : label + ' ' + (usedLabels[label] + 1);
      }
      usedLabels[label] = (usedLabels[label] || 0) + 1;
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'service-layer-tab';
      button.setAttribute('role','tab');
      button.setAttribute('aria-controls',panel.id);
      button.dataset.layerTarget = panel.id;
      button.textContent = label;
      tablist.appendChild(button);
    });

    pricingBlock.parentNode.insertBefore(tabs,pricingBlock.nextSibling);
    var insertionPoint = tabs;
    panels.forEach(function(panel){
      insertionPoint.parentNode.insertBefore(panel,insertionPoint.nextSibling);
      insertionPoint = panel;
    });

    function setLayerHeight(){
      document.documentElement.style.setProperty('--service-layer-h',tabs.offsetHeight + 'px');
    }

    function getLayerStickyTop(){
      var top = parseFloat(getComputedStyle(tabs).top);
      if(Number.isFinite(top)) return top;
      var rootStyle = getComputedStyle(document.documentElement);
      var headerHeight = parseFloat(rootStyle.getPropertyValue('--ld-hdr-h')) || 0;
      var tocHeight = parseFloat(rootStyle.getPropertyValue('--service-toc-h')) || 0;
      return headerHeight + tocHeight;
    }

    function scrollToLayerTarget(target,behavior){
      if(!target) return;
      window.requestAnimationFrame(function(){
        window.requestAnimationFrame(function(){
          setLayerHeight();
          var documentTop = target.getBoundingClientRect().top + window.pageYOffset;
          var stickyHeight = getLayerStickyTop() + tabs.offsetHeight + 10;
          window.scrollTo({
            top:Math.max(0,documentTop - stickyHeight),
            behavior:behavior || (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth')
          });
        });
      });
    }

    function activatePanel(panel,shouldScroll,scrollTarget){
      if(!panel || !panel.classList.contains('service-layer-panel')) return;
      panels.forEach(function(item){
        var active = item === panel;
        item.classList.toggle('is-layer-active',active);
        if(active) item.removeAttribute('hidden');
        else item.setAttribute('hidden','');
      });
      tablist.querySelectorAll('.service-layer-tab').forEach(function(button){
        var active = button.dataset.layerTarget === panel.id;
        button.classList.toggle('is-active',active);
        button.setAttribute('aria-selected',active ? 'true' : 'false');
        button.tabIndex = active ? 0 : -1;
      });
      if(shouldScroll){
        scrollToLayerTarget(scrollTarget || panel);
      }
    }

    tablist.addEventListener('click',function(event){
      var button = event.target.closest('.service-layer-tab');
      if(!button) return;
      activatePanel(document.getElementById(button.dataset.layerTarget),true);
    });

    tablist.addEventListener('keydown',function(event){
      if(event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      var buttons = Array.prototype.slice.call(tablist.querySelectorAll('.service-layer-tab'));
      var current = buttons.indexOf(document.activeElement);
      if(current < 0) return;
      event.preventDefault();
      var next = event.key === 'ArrowRight' ? current + 1 : current - 1;
      if(next < 0) next = buttons.length - 1;
      if(next >= buttons.length) next = 0;
      buttons[next].focus();
      activatePanel(document.getElementById(buttons[next].dataset.layerTarget),false);
    });

    document.querySelectorAll('a[href^="#"]').forEach(function(link){
      link.addEventListener('click',function(event){
        var hash = link.getAttribute('href');
        if(!hash || hash === '#') return;
        var target = null;
        try { target = document.querySelector(hash); }
        catch(error) { return; }
        var panel = target && target.closest('.service-layer-panel');
        if(panel){
          event.preventDefault();
          activatePanel(panel,true,target);
          if(location.hash !== hash) history.pushState(null,'',hash);
        }
      });
    });

    var initialPanel = null;
    if(location.hash){
      try {
        var hashTarget = document.querySelector(location.hash);
        initialPanel = hashTarget && hashTarget.closest('.service-layer-panel');
      } catch(error) {}
    }
    var activePanel = initialPanel || panels[0];
    activatePanel(activePanel,false);
    setLayerHeight();
    if(location.hash && initialPanel){
      scrollToLayerTarget(hashTarget,'auto');
    }
    window.addEventListener('resize',setLayerHeight,{passive:true});
    window.addEventListener('hashchange',function(){
      var target = null;
      try { target = location.hash ? document.querySelector(location.hash) : null; }
      catch(error) { return; }
      var panel = target && target.closest('.service-layer-panel');
      if(panel){
        activatePanel(panel,false);
        scrollToLayerTarget(target,'auto');
      }
    });
  }

  function initPriceTableLabels(){
    document.querySelectorAll('.price-table').forEach(function(table){
      var headers = Array.prototype.slice.call(table.querySelectorAll('tr:first-child th')).map(function(th){
        return th.textContent.trim();
      });
      if(!headers.length){
        var firstRowCells = table.querySelectorAll('tr:first-child td');
        headers = firstRowCells.length > 2 ? ['服務項目','內容','價格'] : ['服務項目','價格'];
      }
      table.querySelectorAll('tr').forEach(function(row,rowIndex){
        if(rowIndex === 0 && row.querySelector('th')) return;
        Array.prototype.slice.call(row.children).forEach(function(cell,index){
          if(cell.tagName.toLowerCase() === 'td' && !cell.hasAttribute('data-label')){
            cell.setAttribute('data-label',headers[index] || '');
          }
        });
      });
      var dataRows = Array.prototype.slice.call(table.querySelectorAll('tr')).filter(function(row){
        return row.querySelector('td');
      });
      if(dataRows.length > 4 && !(table.nextElementSibling && table.nextElementSibling.classList && table.nextElementSibling.classList.contains('price-expand-btn'))){
        table.classList.add('is-price-collapsed');
        dataRows.slice(4).forEach(function(row){ row.classList.add('is-price-extra'); });
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'price-expand-btn';
        button.textContent = '看完整報價項目';
        button.addEventListener('click',function(){
          var open = table.classList.toggle('is-price-open');
          button.textContent = open ? '收合報價項目' : '看完整報價項目';
        });
        table.insertAdjacentElement('afterend',button);
      }
    });
  }

  function getLayerLabel(panel){
    var id = panel.id || '';
    var labelById = {
      'pain':'痛點',
      'promises':'服務',
      'cases-carousel':'案例',
      'team-carousel':'師傅',
      'myths':'迷思',
      'instruments':'工具',
      'service-area':'地區',
      'consumer-protect':'保障',
      'process':'預約',
      'faq':'FAQ'
    };
    if(labelById[id]) return labelById[id];
    if(panel.classList.contains('service-story')) return '圖解';
    if(panel.classList.contains('service-flow') || /flow|process/.test(id)) return '流程';
    if(panel.classList.contains('knowledge-rail')) return '知識';
    if(panel.classList.contains('impact-section') || /difference|impact|myth/.test(id)) return '差異';
    if(/case|carousel/.test(id)) return '案例';
    if(/area/.test(id)) return '地區';
    if(panel.querySelector('.faq-list')) return 'FAQ';
    if(/content|service/.test(id)) return '內容';
    var heading = panel.querySelector('h2,.h');
    return heading ? heading.textContent.trim().slice(0,8) : '';
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
