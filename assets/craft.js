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
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
