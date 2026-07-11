(function(){
  'use strict';

  const state = { housing: '', age: '', symptom: '' };
  let guide = null;
  let cases = [];

  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));
  const byId = (id) => document.getElementById(id);

  function escapeHtml(value){
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function optionButton(item, group, extra){
    const selected = state[group] === item.id;
    return `<button type="button" class="lg-option${selected ? ' is-selected' : ''}" data-group="${group}" data-value="${escapeHtml(item.id)}" aria-pressed="${selected}">
      <span class="lg-option-title">${escapeHtml(item.label)}</span>
      <span class="lg-option-hint">${escapeHtml(extra || item.hint || item.note || '')}</span>
    </button>`;
  }

  function renderOptions(){
    byId('lg-housing-options').innerHTML = guide.housing_types.map((item) => optionButton(item, 'housing')).join('');
    byId('lg-age-options').innerHTML = guide.age_bands.map((item) => optionButton(item, 'age')).join('');
    byId('lg-symptom-options').innerHTML = guide.symptoms.map((item) => optionButton(item, 'symptom')).join('');
    updateNextButtons();
  }

  function updateNextButtons(){
    byId('lg-next-1').disabled = !(state.housing && state.age);
    byId('lg-next-2').disabled = !state.symptom;
  }

  function setStep(number){
    $$('.lg-step').forEach((step) => step.hidden = Number(step.dataset.step) !== number);
    $$('.lg-progress-item').forEach((item) => {
      const itemStep = Number(item.dataset.progress);
      item.classList.toggle('is-active', itemStep === number);
      item.classList.toggle('is-done', itemStep < number);
    });
    byId('lg-progress-label').textContent = `步驟 ${number}／3`;
    if(number === 3) renderResult();
    const tool = byId('leak-guide-tool');
    if(tool) tool.scrollIntoView({behavior:'smooth', block:'start'});
  }

  function list(items, className){
    return `<ul class="${className || 'lg-list'}">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
  }

  function renderMethods(ids){
    return ids.map((id, index) => {
      const item = guide.methods[id];
      if(!item) return '';
      return `<article class="lg-method-card">
        <div class="lg-order">${index + 1}</div>
        <div><h4>${escapeHtml(item.label)}</h4><p>${escapeHtml(item.best_for)}</p><div class="lg-limit">限制：${escapeHtml(item.limit)}</div></div>
      </article>`;
    }).join('');
  }

  function renderRepairs(ids){
    return ids.map((id) => {
      const item = guide.repairs[id];
      if(!item) return '';
      return `<article class="lg-repair-card"><h4>${escapeHtml(item.label)}</h4><p>${escapeHtml(item.fit)}</p><div class="lg-warning">先確認：${escapeHtml(item.warning)}</div></article>`;
    }).join('');
  }

  function matchedCases(housing, symptom){
    const typeMatches = housing.case_types || [];
    let result = cases.filter((item) => typeMatches.includes(item.type) && symptom.case_locs.includes(item.loc));
    if(result.length < 3){
      const fallback = cases.filter((item) => symptom.case_locs.includes(item.loc) && !result.some((r) => r.id === item.id));
      result = result.concat(fallback);
    }
    if(result.length < 3){
      result = result.concat(cases.filter((item) => !result.some((r) => r.id === item.id)));
    }
    return result.slice(0, 3);
  }

  function renderCases(items){
    return items.map((item) => `<article class="lg-case-card">
      <div class="lg-case-meta">案例 ${escapeHtml(item.id)}・${escapeHtml(item.location)}</div>
      <h4>${escapeHtml(item.title)}</h4>
      <dl><div><dt>成因／判讀</dt><dd>${escapeHtml(item.diagnosis)}</dd></div><div><dt>採用方式</dt><dd>${escapeHtml(item.method)}</dd></div></dl>
      <a href="cases.html" aria-label="查看更多施工案例">查看案例庫 →</a>
    </article>`).join('');
  }

  function renderResult(){
    const housing = guide.housing_types.find((item) => item.id === state.housing);
    const age = guide.age_bands.find((item) => item.id === state.age);
    const symptom = guide.symptoms.find((item) => item.id === state.symptom);
    if(!housing || !age || !symptom) return;

    byId('lg-result-summary').innerHTML = `<div><span>住宅</span><strong>${escapeHtml(housing.label)}</strong></div><div><span>屋齡</span><strong>${escapeHtml(age.label)}</strong></div><div><span>表現</span><strong>${escapeHtml(symptom.label)}</strong></div>`;
    byId('lg-layout').innerHTML = `<h3>${escapeHtml(housing.label)}常見管線路徑</h3>${list(housing.layout)}<div class="lg-watch"><strong>優先留意</strong>${housing.watch.map(escapeHtml).join('・')}</div>`;
    byId('lg-age-note').innerHTML = `<strong>${escapeHtml(age.label)}屋齡提示</strong><p>${escapeHtml(age.note)}</p><small>${escapeHtml(guide.era_note)}</small>`;
    byId('lg-causes').innerHTML = list(symptom.causes, 'lg-cause-list');
    byId('lg-methods').innerHTML = renderMethods(symptom.tests);
    byId('lg-repairs').innerHTML = renderRepairs(symptom.repairs);
    byId('lg-cases').innerHTML = renderCases(matchedCases(housing, symptom));

    const summary = `住宅：${housing.label}；屋齡：${age.label}；漏水表現：${symptom.label}（${symptom.hint}）`;
    window.ldLeakGuideSummary = summary;
    byId('lg-copy').dataset.summary = summary;
    if(window.ldTrack) window.ldTrack('leak_guide_complete', {housing:state.housing, age:state.age, symptom:state.symptom});
  }

  function bindEvents(){
    document.addEventListener('click', async (event) => {
      const option = event.target.closest('.lg-option');
      if(option){
        state[option.dataset.group] = option.dataset.value;
        renderOptions();
        return;
      }
      const nav = event.target.closest('[data-go-step]');
      if(nav){ setStep(Number(nav.dataset.goStep)); return; }
      if(event.target.closest('#lg-book')){
        if(window.ldOpenQuote) window.ldOpenQuote('leak-repair');
        return;
      }
      const copy = event.target.closest('#lg-copy');
      if(copy){
        try{
          await navigator.clipboard.writeText(copy.dataset.summary || '');
          copy.textContent = '已複製判讀摘要';
          setTimeout(() => copy.textContent = '複製判讀摘要', 1800);
        }catch(_error){
          copy.textContent = '請截圖保存結果';
        }
      }
    });
  }

  async function init(){
    const status = byId('lg-loading');
    try{
      const [guideResponse, casesResponse] = await Promise.all([
        fetch('data/leak-guide.json'),
        fetch('cases.json')
      ]);
      if(!guideResponse.ok || !casesResponse.ok) throw new Error('data_load_failed');
      guide = await guideResponse.json();
      cases = await casesResponse.json();
      status.hidden = true;
      byId('lg-app').hidden = false;
      renderOptions();
      bindEvents();
    }catch(_error){
      status.innerHTML = '互動指南暫時無法載入，請改用 <a href="knowledge.html">完整漏水百科</a> 或 LINE 諮詢。';
      status.classList.add('is-error');
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
