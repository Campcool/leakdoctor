(function(){
  'use strict';
  document.documentElement.classList.add('craft-js');

  function init(){
    var revealTargets = document.querySelectorAll('.svc-card,.process-card,.service-step,.promise-item,.impact-card,.item-card,.knowledge-card,.craft-case');
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
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
