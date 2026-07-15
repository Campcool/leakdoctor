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
      toc.dataset.localCount = toc.querySelectorAll('a[href^="#"]').length;
      window.addEventListener('resize',setTocHeight,{passive:true});
    }

    initPriceTableLabels();
    initServiceLayerTabs();
  }

  function initServiceLayerTabs(){
    if(!document.body.classList.contains('service-page')) return;
    var toc = document.querySelector('.service-toc');
    if(!toc) return;
    var tocLinks = Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]'));
    if(!tocLinks.length) return;
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
    tabs.id = 'service-layer-tabs';
    tabs.hidden = true;
    tabs.setAttribute('aria-label','服務內容分頁');
    tabs.innerHTML = '<div class="service-layer-tabs-inner"><div class="service-layer-kicker">分類分支</div><div class="service-layer-tablist" role="tablist" aria-label="切換分類分支"></div></div>';
    var kicker = tabs.querySelector('.service-layer-kicker');
    var tablist = tabs.querySelector('.service-layer-tablist');
    var activeGroup = null;
    var activePanelId = '';
    var scrollRequestId = 0;

    panels.forEach(function(panel,index){
      panel.classList.add('service-layer-panel');
      if(!panel.id) panel.id = 'service-layer-panel-' + index;
    });

    var groups = tocLinks.map(function(link,index){
      var hash = link.getAttribute('href');
      var target = null;
      try { target = document.querySelector(hash); }
      catch(error) {}
      link.setAttribute('aria-controls',tabs.id);
      return {
        id:'service-group-' + index,
        link:link,
        hash:hash,
        target:target,
        role:getTocRole(link),
        panels:[]
      };
    });

    panels.forEach(function(panel){
      var directGroup = groups.find(function(group){
        return group.target && (group.target === panel || panel.contains(group.target));
      });
      var role = getPanelRole(panel);
      var group = directGroup || groups.find(function(item){ return item.role === role; });
      if(!group && role === 'difference') group = groups.find(function(item){ return item.role === 'knowledge'; });
      if(!group && role === 'knowledge') group = groups.find(function(item){ return item.role === 'content'; });
      if(!group && role === 'people') group = groups.find(function(item){ return item.role === 'cases'; });
      if(!group) group = groups.find(function(item){ return item.role === 'content'; });
      if(group) group.panels.push(panel);
    });

    pricingBlock.parentNode.insertBefore(tabs,pricingBlock.nextSibling);
    var insertionPoint = tabs;
    panels.forEach(function(panel){
      insertionPoint.parentNode.insertBefore(panel,insertionPoint.nextSibling);
      insertionPoint = panel;
    });

    function setStickyHeights(){
      document.documentElement.style.setProperty('--service-toc-h',toc.offsetHeight + 'px');
      document.documentElement.style.setProperty('--service-layer-h',tabs.hidden ? '0px' : tabs.offsetHeight + 'px');
    }

    function getStickyHeight(){
      var rootStyle = getComputedStyle(document.documentElement);
      var headerHeight = parseFloat(rootStyle.getPropertyValue('--ld-hdr-h')) || 0;
      return headerHeight + toc.offsetHeight + (tabs.hidden ? 0 : tabs.offsetHeight) + 10;
    }

    function scrollToLayerTarget(target,behavior,expectedPanel){
      if(!target) return;
      var requestId = ++scrollRequestId;
      window.requestAnimationFrame(function(){
        if(requestId !== scrollRequestId) return;
        window.requestAnimationFrame(function(){
          if(requestId !== scrollRequestId) return;
          if(expectedPanel && activePanelId !== expectedPanel.id) return;
          setStickyHeights();
          var documentTop = target.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({
            top:Math.max(0,documentTop - getStickyHeight()),
            behavior:behavior || (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth')
          });
        });
      });
    }

    function setCurrentGroup(group){
      groups.forEach(function(item){
        var active = item === group;
        item.link.classList.toggle('is-current',active);
        item.link.setAttribute('aria-expanded',active && item.panels.length ? 'true' : 'false');
        if(active) item.link.setAttribute('aria-current','location');
        else item.link.removeAttribute('aria-current');
      });
    }

    function renderGroupTabs(group){
      tablist.innerHTML = '';
      kicker.textContent = group.link.textContent.trim() + '分支';
      tablist.setAttribute('aria-label',group.link.textContent.trim() + '的細項');
      var usedLabels = {};
      group.panels.forEach(function(panel){
        var label = getLayerLabel(panel);
        if(usedLabels[label]) label = label === '內容' ? '延伸資訊' : label + ' ' + (usedLabels[label] + 1);
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
    }

    function activatePanel(panel,shouldScroll,scrollTarget){
      if(!panel || !panel.classList.contains('service-layer-panel')) return;
      activePanelId = panel.id;
      tabs.dataset.activePanel = panel.id;
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
        scrollToLayerTarget(scrollTarget || panel,undefined,panel);
      }
    }

    function panelForTarget(target){
      return target && target.closest ? target.closest('.service-layer-panel') : null;
    }

    function groupForTarget(target){
      var panel = panelForTarget(target);
      if(panel){
        return groups.find(function(group){ return group.panels.indexOf(panel) !== -1; }) || null;
      }
      return groups.find(function(group){
        return group.target && target && (group.target === target || group.target.contains(target) || target.contains(group.target));
      }) || null;
    }

    function activateGroup(group,options){
      if(!group) return;
      options = options || {};
      activeGroup = group;
      scrollRequestId++;
      setCurrentGroup(group);
      var directPanel = panelForTarget(group.target);
      var panel = options.panel || (directPanel && group.panels.indexOf(directPanel) !== -1 ? directPanel : group.panels[0]);
      if(group.role === 'price' || !group.panels.length){
        activePanelId = '';
        delete tabs.dataset.activePanel;
        tabs.hidden = true;
        tablist.innerHTML = '';
        panels.forEach(function(item){ item.setAttribute('hidden',''); item.classList.remove('is-layer-active'); });
        setStickyHeights();
        if(options.scroll !== false) scrollToLayerTarget(options.target || group.target || pricingBlock,options.behavior);
        return;
      }
      renderGroupTabs(group);
      tabs.hidden = false;
      activatePanel(panel,false);
      setStickyHeights();
      if(options.scroll !== false) scrollToLayerTarget(options.target || group.target || panel,options.behavior,panel);
    }

    tablist.addEventListener('click',function(event){
      var button = event.target.closest('.service-layer-tab');
      if(!button) return;
      event.preventDefault();
      event.stopPropagation();
      var panel = document.getElementById(button.dataset.layerTarget);
      activatePanel(panel,true);
      if(activeGroup && activeGroup.hash && location.hash !== activeGroup.hash){
        history.replaceState(null,'',activeGroup.hash);
      }
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
      activatePanel(document.getElementById(buttons[next].dataset.layerTarget),true);
    });

    groups.forEach(function(group){
      group.link.addEventListener('click',function(event){
        event.preventDefault();
        activateGroup(group,{target:group.target});
        if(group.hash && location.hash !== group.hash) history.pushState(null,'',group.hash);
      });
    });

    document.querySelectorAll('a[href^="#"]').forEach(function(link){
      if(toc.contains(link)) return;
      link.addEventListener('click',function(event){
        var hash = link.getAttribute('href');
        if(!hash || hash === '#') return;
        var target = null;
        try { target = document.querySelector(hash); }
        catch(error) { return; }
        var panel = panelForTarget(target);
        var group = groupForTarget(target);
        if(group){
          event.preventDefault();
          activateGroup(group,{panel:panel,target:target});
          if(location.hash !== hash) history.pushState(null,'',hash);
        }
      });
    });

    var hashTarget = null;
    if(location.hash){
      try {
        hashTarget = document.querySelector(location.hash);
      } catch(error) {}
    }
    var initialGroup = groupForTarget(hashTarget) || groups.find(function(group){ return group.role === 'price'; }) || groups[0];
    activateGroup(initialGroup,{panel:panelForTarget(hashTarget),target:hashTarget || initialGroup.target,scroll:!!hashTarget,behavior:'auto'});
    if(hashTarget && /^service-layer-panel-\d+$/.test(hashTarget.id || '') && initialGroup.hash){
      history.replaceState(null,'',initialGroup.hash);
    }
    setStickyHeights();

    var compactTicking = false;
    function updateCompactNav(){
      compactTicking = false;
      var shouldCompact = window.scrollY > 180;
      var changed = document.body.classList.contains('service-nav-compact') !== shouldCompact;
      document.body.classList.toggle('service-nav-compact',shouldCompact);
      if(changed) window.requestAnimationFrame(setStickyHeights);
    }
    function requestCompactNav(){
      if(compactTicking) return;
      compactTicking = true;
      window.requestAnimationFrame(updateCompactNav);
    }
    updateCompactNav();
    window.addEventListener('scroll',requestCompactNav,{passive:true});
    window.addEventListener('resize',setStickyHeights,{passive:true});
    toc.addEventListener('transitionend',setStickyHeights);
    tabs.addEventListener('transitionend',setStickyHeights);
    window.addEventListener('hashchange',function(){
      var target = null;
      try { target = location.hash ? document.querySelector(location.hash) : null; }
      catch(error) { return; }
      var panel = panelForTarget(target);
      var group = groupForTarget(target);
      if(group) activateGroup(group,{panel:panel,target:target,behavior:'auto'});
    });
  }

  function getTocRole(link){
    var value = ((link.getAttribute('href') || '') + ' ' + link.textContent).toLowerCase();
    if(/pricing|價格|費用/.test(value)) return 'price';
    if(/case|案例/.test(value)) return 'cases';
    if(/team|area|人員|地區/.test(value)) return 'people';
    if(/difference|impact|差異|機型/.test(value)) return 'difference';
    if(/flow|knowledge|知識|流程/.test(value)) return 'knowledge';
    return 'content';
  }

  function getPanelRole(panel){
    var id = (panel.id || '').toLowerCase();
    var classes = (panel.className || '').toString().toLowerCase();
    if(panel.classList.contains('service-story')) return 'content';
    if(/case|carousel/.test(id) && !/team/.test(id)) return 'cases';
    if(/team|area|consumer-protect/.test(id)) return 'people';
    if(/difference|impact|myth|instrument/.test(id) || /impact-section/.test(classes)) return 'difference';
    if(/flow|process|knowledge|faq/.test(id + ' ' + classes) || panel.querySelector('.faq-list')) return 'knowledge';
    return 'content';
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
      'faq':'FAQ',
      'washer-differences':'機型比較',
      'homeclean-difference':'清潔差異',
      'water-tank-difference':'水塔差異',
      'pipe-difference':'適用差異'
    };
    if(labelById[id]) return labelById[id];
    if(panel.classList.contains('service-story')) return '圖解';
    if(panel.classList.contains('service-flow') || /flow|process/.test(id)) return '流程';
    if(panel.classList.contains('impact-section') || /difference|impact|myth/.test(id)) return '差異';
    if(panel.classList.contains('knowledge-rail')) return '知識';
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
