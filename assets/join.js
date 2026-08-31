(function(){
  'use strict';
  var API='https://leakdoctor-bot.a0920077473.workers.dev/api/partner-applications';
  var form=document.getElementById('partner-application'),submit=document.getElementById('join-submit'),result=document.getElementById('join-result');
  var categories=[],ready=false,busy=false,lastPayload='',requestId='';
  function check(value,label,name){var el=document.createElement('label');el.className='join-check';var input=document.createElement('input');input.type='checkbox';input.name=name;input.value=value;var span=document.createElement('span');span.textContent=label;el.append(input,span);return el;}
  async function loadOptions(){
    ready=false;submit.disabled=true;document.getElementById('join-retry').hidden=true;
    try{
      var response=await fetch(API,{credentials:'omit',signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error('load');
      var data=await response.json();if(!Array.isArray(data.categories)||!data.categories.length||!Array.isArray(data.cities))throw new Error('options');
      categories=data.categories;var regions=document.getElementById('join-regions'),services=document.getElementById('join-services');regions.replaceChildren();services.replaceChildren();
      data.cities.forEach(function(city){regions.append(check(city,city,'regions'));});
      categories.forEach(function(c){var box=document.createElement('div');box.className='join-category';var parent=check(c.id,c.label,'categories'),input=parent.querySelector('input'),items=document.createElement('div');items.id='join-items-'+c.id;items.className='join-items';items.hidden=true;input.setAttribute('aria-controls',items.id);input.setAttribute('aria-expanded','false');
        c.items.forEach(function(i){items.append(check(i.id,i.label,'services'));});
        input.addEventListener('change',function(){items.hidden=!input.checked;input.setAttribute('aria-expanded',String(input.checked));if(!input.checked)items.querySelectorAll('input').forEach(function(i){i.checked=false;});});
        box.append(parent,items);services.append(box);
      });ready=true;submit.disabled=false;document.getElementById('join-options-status').textContent='可複選；取消大項會一併清除該項的小項。';
    }catch{document.getElementById('join-options-status').textContent='選項暫時無法載入，請重試；尚未送出任何資料。';document.getElementById('join-retry').hidden=false;}
  }
  document.getElementById('join-retry').addEventListener('click',loadOptions);
  form.addEventListener('submit',async function(event){
    event.preventDefault();if(busy||!ready)return;
    var fd=new FormData(form),body={};fd.forEach(function(value,key){if(!['regions','services','categories','consent'].includes(key))body[key]=String(value).trim();});body.regions=fd.getAll('regions');body.services=fd.getAll('services');body.consent=fd.has('consent');
    function fail(message){result.dataset.state='error';result.textContent=message;result.focus();}
    if(!body.regions.length)return fail('請至少勾選一個可服務縣市。');
    if(!body.services.length)return fail('請勾選服務大項及至少一個小項。');
    var empty=categories.find(function(c){return fd.getAll('categories').includes(c.id)&&!c.items.some(function(i){return body.services.includes(i.id);});});
    if(empty)return fail('「'+empty.label+'」尚未勾選小項，請選擇或取消該大項。');
    if(body.phone.replace(/\D/g,'').length<8)return fail('請確認聯絡電話至少包含 8 位數字。');
    var payload=JSON.stringify(body);if(payload!==lastPayload){requestId=crypto.randomUUID();lastPayload=payload;}body.requestId=requestId;
    busy=true;var controls=Array.from(form.querySelectorAll('input,select,textarea,button'));controls.forEach(function(el){el.disabled=true;});result.dataset.state='';result.textContent='正在儲存申請，請稍候…';
    try{var response=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});var saved=await response.json();
      if(!response.ok||!saved.ok){if(response.status===429)throw new Error('送出次數較多，請稍後再試或透過官方 LINE 聯絡。');if(response.status===400)throw new Error('資料未通過驗證，請檢查電話、統編、網址及必填欄位。');throw new Error('暫時無法確認儲存結果，請保留資料後重試。');}
      result.dataset.state='success';result.textContent='申請已存檔，待專員審核聯繫。\n申請編號：'+saved.applicationId+'\n此申請不會自動啟用派工。';result.focus();form.querySelectorAll('input,select,textarea,button').forEach(function(el){el.disabled=true;});
    }catch(error){controls.forEach(function(el){el.disabled=false;});fail(error.name==='TimeoutError'?'連線逾時，尚無法確認結果；資料已保留，請再按一次送出，系統會防止重複建檔。':error.message||'送出失敗，請重試。');}finally{busy=false;}
  });
  loadOptions();
})();
