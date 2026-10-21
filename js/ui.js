(function () {
  'use strict';
  const D = window.DeckData, E = window.GameEngine, P = window.PuzzleData;
  const app = document.getElementById('app'), modal = document.getElementById('modal'), modalContent = document.getElementById('modal-content');
  const query = new URLSearchParams(location.search), dev = query.get('dev') === '1', testing = query.get('test') === '1';
  const memory = new Map();
  let storage;
  let state = null, onHome = true, saveIssue = '', loadIssue = '', toastTimer, comparison = null;
  let rulesAcknowledged = false, rulesReview = null;
  try { storage = testing ? { getItem: k => memory.get(k) ?? null, setItem: (k,v) => memory.set(k,v) } : localStorage; state = E.load(storage); }
  catch (error) { loadIssue = error.message; }
  const esc = text => String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const asset = path => path.split('/').map(encodeURIComponent).join('/');
  const time = ms => { const s = Math.floor(ms / 1000); return [Math.floor(s/3600),Math.floor(s/60)%60,s%60].map(n => String(n).padStart(2,'0')).join(':'); };
  function button(label, action, secondary = false, extra = '') { return `<button class="button${secondary ? ' secondary' : ''}" data-action="${action}" ${extra}>${label}</button>`; }
  function persist() {
    if (!state) return;
    try { if (!storage) throw new Error('儲存空間無法使用'); E.save(state, storage); saveIssue = ''; }
    catch { saveIssue = '瀏覽器無法保存進度。請勿關閉此頁；可使用「匯出紀錄」保留作答內容。'; toast(saveIssue); }
  }
  function toast(message) {
    const el = document.getElementById('toast'); el.textContent = message; el.classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 4200);
  }
  function showModal(title, html, wide = false) {
    comparison?.observer.disconnect(); comparison = null;
    clearRulesReview();
    if (modal.open) modal.close();
    document.getElementById('modal-title').textContent = title;
    modal.style.width = wide ? '940px' : '650px'; modalContent.innerHTML = html; modal.showModal();
  }
  function clearRulesReview() { rulesReview?.observer?.disconnect(); rulesReview=null; }
  function closeModal() { clearRulesReview(); modal.close(); }
  function rules(forStart=false) {
    const required=forStart;
    const automaticCount=Object.values(P.puzzles).filter(p=>p.answers).length;
    const manualCount=Object.keys(P.puzzles).length-automaticCount;
    showModal('進入實驗室之前', `${required?'<p class="rules-intro">開始前，請先閱讀完整遊玩規則，再確認已閱讀。</p>':''}<div id="rules-reader" class="rules-reader" tabindex="0" role="region" aria-label="完整遊玩規則"><p class="eyebrow">HOW TO PLAY</p><ol class="rule-list">${D.rulesText.map(t=>`<li>${esc(t)}</li>`).join('')}</ol>
      <div class="notice">${manualCount?`已確認答案的 ${automaticCount} 題會自動判定，其餘 ${manualCount} 題需搭配實體解答核對。`:`全部 ${automaticCount} 題皆會自動判定。有物品解鎖條件的卡牌，須先取得指定物品才能作答或公開。`}</div>
      <p class="muted">使用方式：點擊卡牌可放大或旋轉；「物品比對」可直接拖曳兩張卡牌，點選後各自旋轉、縮放或調整透明度。進度會自動保存於這個瀏覽器。</p></div>${required?'<p id="rules-progress" class="rules-progress" role="status">請向下捲動，閱讀完整規則。</p><div class="modal-actions">'+button('我已閱讀並了解規則','rules-accept',false,'disabled aria-describedby="rules-progress"')+'</div>':'<div class="modal-actions">'+button('了解了', 'close')+'</div>'}`);
    if(!required)return;
    const reader=document.getElementById('rules-reader');
    const review={reader,complete:false,observer:null};rulesReview=review;
    const checkRead=()=>{
      if(rulesReview!==review||!modal.open||!reader.clientHeight)return;
      if(reader.scrollTop+reader.clientHeight>=reader.scrollHeight-2)review.complete=true;
      document.querySelector('[data-action="rules-accept"]').disabled=!review.complete;
      document.getElementById('rules-progress').textContent=review.complete?'已顯示完整規則，請確認已閱讀。':'請向下捲動，閱讀完整規則。';
    };
    reader.addEventListener('scroll',checkRead,{passive:true});
    review.observer=new ResizeObserver(checkRead);review.observer.observe(reader);checkRead();
  }
  function home() {
    const progress = state ? E.stats(state) : null;
    app.innerHTML = `${dev ? '<div class="developer-bar">開發測試模式 · 所有卡牌檢視可能包含劇透 <button data-action="catalog">素材清單</button></div>' : ''}
      <section class="home"><div class="hero"><div><p class="eyebrow">THE EXPERIMENT BEGINS</p><h1>口袋密室<span>時間測試</span></h1>
        <p class="hero-description">一間封閉的實驗室，一位神祕的博士。<br>線索藏在卡牌之間，出口等待你的發現。<br>準備好，接受這場關於時間的測試。</p>
        <div class="hero-actions">${state ? button(state.phase === 'ending' ? '查看遊戲結算 <span>↗</span>' : '繼續探索 <span>→</span>', 'continue') + button('開始新遊戲', 'new', true) : button('進入實驗室 <span>→</span>', 'new')}
        <button class="text-button" data-action="rules">閱讀遊玩規則 ↗</button></div>
        <p class="rules-home-status">開始新遊戲會先顯示遊玩規則，確認後才進入。</p>
        <p class="hero-fineprint">${state ? `已保存進度 · ${progress.answered} 題作答 · ${state.phase === 'intro' ? '開場尚未計時' : '經過 ' + time(progress.elapsed)}` : '無需安裝 · 自動存檔 · 隨時繼續'}</p></div>
        <div class="art" aria-hidden="true"><span class="art-label">CASE FILE / 001</span><div class="art-circle"></div><div class="cover-card back-one"></div><div class="cover-card back-two"></div><div class="cover-card main"><div class="tiny">DECKSCAPE · TEST TIME</div><div class="clock-face"></div><div class="cover-name">口袋密室</div><div class="cover-sub">時間測試</div></div><span class="art-bottom">OBSERVE. CONNECT. ESCAPE.</span></div></div>
        <div class="home-meta"><span><strong>單人或同桌協作</strong>一起觀察，共同解謎</span><span><strong>4 組探索牌堆</strong>自由切換，串聯線索</span><span><strong>你的時間，正在流動</strong>依原版規則計時與結算</span></div>
        <div class="section-top"><h2>四道帷幕，一場測試</h2><span>循著線索，逐步揭開</span></div><div class="curtain-grid">${Object.values(D.decks).map(d=>`<div class="curtain-tile" style="--deck-color:${d.color}"><span class="swatch"></span><div><small>CHAPTER ${d.label}</small><h3>${d.name}</h3></div><span class="tile-end">↗</span></div>`).join('')}</div>
        <div class="notice">26 道謎題自動核對。探索四道帷幕、取得關鍵物品，解開相互連結的線索。</div>
        ${loadIssue ? `<div class="notice warning">${esc(loadIssue)}</div>` : ''}${saveIssue ? `<div class="notice warning">${esc(saveIssue)}</div>` : ''}</section>`;
  }
  function start() {
    rulesAcknowledged=false;rules(true);
  }
  function finishStart() {
    if(!rulesAcknowledged){start();return;}
    if (state || loadIssue) {
      showModal('重新開始這場測試？', '<p>目前的遊戲進度、筆記與作答紀錄將被新的遊戲覆寫。</p><div class="modal-actions">' + button('保留目前進度', 'close', true) + button('確認重新開始', 'reset-confirm') + '</div>');
    } else begin();
  }
  function begin() {
    if(!rulesAcknowledged){start();return;}
    state=E.fresh();onHome=false;loadIssue='';rulesAcknowledged=false;closeModal();persist();render();
  }
  function render() {
    if (onHome || !state) return home();
    if (state.phase === 'ending') return summary();
    const c = E.current(state), stats = E.stats(state), intro = state.phase === 'intro';
    const d = D.decks[state.activeDeck], revealed=c&&E.canReveal(state,c.id);
    app.innerHTML = `${dev ? '<div class="developer-bar">開發測試模式 <button data-action="catalog">素材清單</button></div>' : ''}<section class="game">
      <div class="game-top"><div><h1>${intro ? '實驗開始之前' : '崔姆博士的實驗室'}</h1><p>${intro ? '閱讀卡牌，跟隨博士的指引。' : '觀察每個細節，讓線索彼此連結。'}</p></div>
      <div class="metrics"><div class="metric timer"><span>${intro ? '等待開始' : '探索時間'}</span><strong id="timer">${time(stats.elapsed)}</strong></div><div class="metric"><span>錯誤 X</span><strong>${stats.errors}</strong></div><div class="metric"><span>已用提示</span><strong>${stats.hints}</strong></div></div></div>
      ${saveIssue ? `<div class="notice warning">${esc(saveIssue)}</div>` : ''}<div class="game-layout"><aside class="left-sidebar">
      <h2 class="side-heading">${intro ? 'PROLOGUE / 序章' : 'EXPLORE / 探索'}</h2>${intro ? `<div class="intro-progress">先了解遊戲與操作方式，再一同揭開帷幕。<div class="intro-dots">${D.intro.map((id,i)=>`<i class="${i<=state.introIndex?'done':''}"></i>`).join('')}</div>第 ${state.introIndex+1} / ${D.intro.length} 張開場卡<br>正式探索才開始計時。</div>` : `<div class="deck-list">${Object.values(D.decks).map(deck=>`<button class="deck-button ${state.activeDeck===deck.id?'active':''}" data-action="deck" data-deck="${deck.id}" style="--deck-color:${deck.color}" aria-pressed="${state.activeDeck===deck.id}"><span class="deck-number">CHAPTER ${deck.label}</span><span class="deck-name">${deck.name}</span><small>${state.deckPositions[deck.id]===deck.cards.length?'探索完畢':`進度 ${state.deckPositions[deck.id]} / ${deck.cards.length}`}</small><div class="deck-progress"><span style="width:${100*state.deckPositions[deck.id]/deck.cards.length}%"></span></div></button>`).join('')}</div>`}
      <div class="side-tools">${state.visited.includes('lab') ? '<button data-action="view" data-card="lab">◈　實驗室全景</button>' : ''}<button data-action="history">▤　已讀卡牌</button><button data-action="log">↳　作答紀錄</button><button data-action="home">⌂　回到首頁</button></div><p class="help-note">${intro ? '物品會隨著探索加入右側。' : '切換牌堆或回到首頁，計時會持續。'}<br>每次操作自動保存。</p></aside>
      <div class="center-column">${c ? `<div class="card-table"><div class="card-topline"><span>${intro?'PROLOGUE':d.name}</span><span>NO. ${String(c.number).padStart(2,'0')} · ${c.cardType==='puzzle'?'謎題':c.cardType==='item'?'物品':'故事'}</span></div><div class="card-holder">${revealed?`<img class="game-card" src="${asset(c.frontImage)}" alt="${esc(c.title)}，卡號 ${c.number}" data-action="view" data-card="${c.id}" tabindex="0" role="button" aria-label="放大${esc(c.title)}">`:'<div class="locked-card"><span aria-hidden="true">◇</span>卡牌尚未公開</div>'}</div>${revealed?`<div class="card-controls"><button data-action="view" data-card="${c.id}">＋ 放大 / 旋轉</button>${state.inventory.length ? '<button data-action="compare">⇄ 物品比對</button>' : ''}${(c.cardType==='choice' || c.cardType==='puzzle' && D.hintColumns.some(col=>col.includes(c.number))) ? '<button data-action="hint">原版提示 ↗</button>' : ''}</div>`:''}</div>${interaction(c)}` : `<div class="card-table complete-deck"><strong>✓</strong><h2>這道帷幕已探索完畢</h2><p>帶著找到的物品，繼續探索其他牌堆。</p></div>`}</div>
      <aside class="right-sidebar"><section class="inventory hint-area" aria-labelledby="hint-area-title"><div class="inventory-header"><h2 id="hint-area-title">提示區</h2><span>隨時可查看</span></div><div class="hint-card-grid">${D.hintCards.map((hint,i)=>`<button class="item-button" data-action="hint-card" data-card="${hint.id}" aria-label="查看${hint.title}"><span class="hint-card-preview" style="background-image:url('${asset(hint.frontImage)}');background-position:${i===0?'left':'right'} center" aria-hidden="true"></span><span>${hint.number} 號提示卡</span></button>`).join('')}</div></section><section class="inventory"><div class="inventory-header"><h2>隨身物品</h2><span>${String(state.inventory.length).padStart(2,'0')} ITEMS</span></div>${state.inventory.length ? `<div class="inventory-grid">${state.inventory.map(id=>{const item=D.items[id],ic=E.itemCard(state,id);return `<button class="item-button" data-action="item" data-item="${id}"><img src="${asset(ic.frontImage)}" alt=""><span>${esc(item.name)}${id==='flashlight'&&!state.inventory.includes('batteries')?' · 未通電':''}</span></button>`;}).join('')}</div>` : '<div class="empty-inventory"><b>◇</b>等待你的第一個發現<br>取得的物品會保留在這裡</div>'}</section><div class="notebook"><label for="notes">探索筆記 <small>自動保存</small></label><textarea id="notes" maxlength="10000" placeholder="記下數字、線索，或還沒想通的地方……">${esc(state.notes)}</textarea></div><p class="help-note">每題只有一次作答機會。<br>還沒準備好時，可以先探索其他牌堆。</p></aside></div></section>`;
  }
  function itemOptions() {
    return '<option value="" disabled selected>選擇已取得的物品</option>'+state.inventory.map(id=>`<option value="${id}">${esc(D.items[id].name)}</option>`).join('');
  }
  function answerLabel(id,answer) {
    const type=P.puzzles[id]?.inputType;
    if(type==='inventory'&&D.items[answer])return D.items[answer].name;
    const selection=type==='item-orientation'&&/^([a-z0-9-]+):(0|90|180|270)$/.exec(answer);
    return selection&&D.items[selection[1]]?`${D.items[selection[1]].name} · ${selection[2]==='0'?'原方向':`旋轉 ${selection[2]} 度`}`:answer;
  }
  function answerFields(p) {
    if(p.inputType==='inventory')return `<select class="answer-field" id="answer" name="answer" required>${itemOptions()}</select>`;
    if(p.inputType==='item-orientation')return `<select class="answer-field" id="answer-item" name="selectedItem" required aria-label="選擇物品卡">${itemOptions()}</select><div id="orientation-options" class="orientation-options" role="radiogroup" aria-label="選擇卡片方向"><p class="muted">選擇物品後，會顯示該卡片的四種方向。</p></div>`;
    if(p.choices)return `<fieldset class="answer-options" aria-label="選擇答案">${p.choices.map((option,i)=>`<label><input ${i===0?'id="answer"':''} type="radio" name="answer" value="${esc(option.value)}" required>${esc(option.label)}</label>`).join('')}</fieldset>`;
    return '<input class="answer-field" id="answer" name="answer" autocomplete="off" maxlength="1200" placeholder="先思考，再送出你的答案" required>';
  }
  function updateOrientationOptions() {
    const picker=document.getElementById('answer-item'),container=document.getElementById('orientation-options');
    if(!picker||!container||!state.inventory.includes(picker.value))return;
    const card=E.itemCard(state,picker.value);
    container.innerHTML=[0,90,180,270].map(angle=>`<label class="orientation-choice"><input type="radio" name="rotation" value="${angle}" required><span class="orientation-preview"><img src="${asset(card.frontImage)}" alt="${esc(D.items[picker.value].name)}，${angle===0?'原方向':`旋轉 ${angle} 度`}" style="transform:rotate(${angle}deg)" draggable="false"></span><span>${angle===0?'原方向':`旋轉 ${angle} 度`}</span></label>`).join('');
  }
  function interaction(c) {
    if(!E.canReveal(state,c.id))return `<section class="interaction"><h2>等待公開</h2><p>先取得${E.revealBlockers(state,c.id).map(id=>`「${esc(D.items[id].name)}」`).join('、')}，再回來查看這張卡牌。</p></section>`;
    if (c.cardType === 'puzzle') {
      const p = P.puzzles[c.id], record = state.answers[c.id];
      const blockers=E.answerBlockers(state,c.id);
      if(!record&&blockers.length)return `<section class="interaction"><h2>尚未解鎖作答</h2><p>請先取得${blockers.map(id=>`「${esc(D.items[id].name)}」`).join('、')}，再回來解開這道謎題。</p></section>`;
      if (!record) return `<section class="interaction"><form id="answer-form"><h2>你的解答</h2>${p.prompt?`<label class="input-label" for="${p.inputType==='item-orientation'?'answer-item':'answer'}">${esc(p.prompt)}</label>`:''}${answerFields(p)}<div class="answer-row"><button class="button" type="submit">確認作答 <span>→</span></button><small>每題只可送出一次</small></div></form></section>`;
      if (record.status === 'pending') return `<section class="interaction"><span class="result-tag pending">答案已鎖定 · 等待核對</span><div class="recorded-answer">${esc(record.answer)}</div><p>本題的原版解答背面尚未提供。請對照實體解答，再記錄結果；若沒有解答，請保留為「待核對」。</p><label class="check-label"><input type="checkbox" id="missing-item">核對後確認：作答時缺少必需物品（記錄 2 個 X）</label><div class="manual-actions">${button('已核對，正確', 'adjudicate', false, 'data-verdict="correct"')}${button('已核對，錯誤', 'adjudicate', true, 'data-verdict="incorrect"')}${button('保留待核對，繼續', 'adjudicate', true, 'data-verdict="unverified"')}</div>${record.missing.length ? '<p>依卡牌已確認缺少必需物品，本題記錄 2 個 X。</p>' : ''}</section>`;
      const label = record.status==='unverified' ? '待核對 · 成績暫定' : record.correct ? '已核對 · 解答正確' : '已核對 · 解答有誤';
      return `<section class="interaction"><span class="result-tag ${record.status==='unverified'?'pending':!record.correct?'wrong':''}">${label}</span><div class="recorded-answer">${esc(answerLabel(c.id,record.answer))}</div>${p.explanation ? `<p>${esc(p.explanation)}</p>` : ''}${record.penalty ? `<p>本題記錄 ${record.penalty} 個 X${record.penalty===2?'（缺少必需物品）':''}。仍依卡牌指示繼續。</p>` : ''}<div class="answer-row">${button('依指示繼續 <span>→</span>', 'advance')}${c.backImage ? button('查看解答背面', 'solution', true) : ''}</div></section>`;
    }
    if (c.cardType === 'choice') return `<section class="interaction"><h2>你想留下什麼？</h2><p>選擇一件隨身物品，留給過去的博士。確認後即決定這場測試的結局。</p><form id="ending-form"><div class="ending-choice">${state.inventory.map(id=>`<label><input type="radio" name="leftItem" value="${id}" required> ${esc(D.items[id].name)}</label>`).join('')}</div><button type="submit" class="button">做出最後的選擇 <span>→</span></button></form></section>`;
    let label = c.cardType==='item' ? '收好物品，繼續' : '依指示繼續';
    if (c.id === 'curtain-b') label = '揭開四道帷幕，開始計時';
    return `<section class="interaction"><h2>${esc(c.title)}</h2>${c.id==='blue-003'&&!state.inventory.includes('batteries')?'<p>已收好手電筒。取得電池後，才可查看它的另一面。</p>':''}${button(label + ' <span>→</span>', 'advance')}</section>`;
  }
  function summary() {
    const s = E.stats(state), ending = D.endings[state.ending], c = D.cards[ending.cardId];
    app.innerHTML = `<section class="summary"><p class="eyebrow">EXPERIMENT COMPLETE</p><h1>測試結束，時間揭曉。</h1><p class="muted">你留下了「${esc(D.items[state.leftItem].name)}」，抵達結局 ${state.ending}。</p><div class="summary-layout"><div><span class="result-tag ${s.unresolved?'pending':''}">${s.unresolved?`暫定成績 · ${s.unresolved} 題尚待核對`:'遊戲結算'}</span><div class="summary-stats"><div><span>實際探索時間</span><strong>${time(s.elapsed)}</strong></div><div><span>原始錯誤 X</span><strong>${s.errors}</strong></div><div><span>結局抵銷 X</span><strong>− ${Math.min(s.errors,s.discount)}</strong></div><div><span>錯誤加時</span><strong>+ ${s.remaining*5} 分</strong></div></div><h2>最終計分時間</h2><div class="summary-rating">${time(s.total)}<br>${s.unresolved?'暫定評價：':''}${s.rating}</div><p class="help-note">${s.hints} 題查看提示 · ${s.answered} 題已作答<br>評級按原版分鐘欄位計算，秒數捨去。</p>${s.unresolved?'<div class="notice warning">尚未核對的作答沒有被當成答對。這是暫定下限，補上核對結果後，錯誤加時和評級可能改變。</div>':''}<div class="summary-actions">${button('查看作答紀錄','log')}${button('匯出紀錄','export',true)}${button('回到首頁','home',true)}</div></div><img class="summary-card" src="${asset(c.frontImage)}" alt="結局 ${state.ending}" data-action="view" data-card="${c.id}" tabindex="0" role="button"></div><div class="summary-actions">${button('查看遊戲結束卡','view',true,`data-card="${D.finalCard}"`)}${button('開始新遊戲','new',true)}</div></section>`;
  }
  function view(id) {
    if (!state || !E.canView(state,id)) throw new Error('這張卡牌尚未解鎖。');
    viewer(D.cards[id]);
  }
  function viewer(c) {
    const media=c.crop ? `<canvas id="viewer-image" role="img" aria-label="${esc(c.title)}" data-rotation="0"></canvas>` : `<img id="viewer-image" src="${asset(c.frontImage)}" alt="${esc(c.title)}" data-rotation="0">`;
    showModal(c.title, `<div class="viewer-tools"><button data-action="rotate" data-angle="-90">↶ 左轉</button><button data-action="rotate" data-angle="90">↷ 右轉</button><button data-action="zoom">＋ 原尺寸 / 縮小</button><button data-action="view-reset">重設</button></div><div class="viewer-viewport" id="viewer"><div id="viewer-stage">${media}</div></div>`,true);
    const img=document.getElementById('viewer-image');
    if(c.crop){
      const source=new Image();
      source.onload=()=>{if(!img.isConnected)return;const [x,y,w,h]=c.crop;img.width=Math.round(source.naturalWidth*w);img.height=Math.round(source.naturalHeight*h);img.getContext('2d').drawImage(source,source.naturalWidth*x,source.naturalHeight*y,source.naturalWidth*w,source.naturalHeight*h,0,0,img.width,img.height);updateViewer();};
      source.onerror=()=>toast('提示卡圖片無法載入，請確認原始素材仍在資料夾中。');
      source.src=asset(c.frontImage);
    }else{img.onload=updateViewer;if(img.complete)updateViewer();}
  }
  function updateViewer() {
    const img=document.getElementById('viewer-image'),stage=document.getElementById('viewer-stage'),viewport=document.getElementById('viewer');
    const width=img?.tagName==='CANVAS'?img.width:img?.naturalWidth,height=img?.tagName==='CANVAS'?img.height:img?.naturalHeight;
    if(!width||!height||!stage||!viewport)return;
    const angle=Number(img.dataset.rotation),swap=Math.abs(angle%180)===90;
    const rw=swap?height:width,rh=swap?width:height;
    const scale=viewport.classList.contains('zoomed')?1:Math.min(1,viewport.clientWidth/rw,(innerHeight*.63)/rh);
    stage.style.cssText=`position:relative;margin:auto;width:${rw*scale}px;height:${rh*scale}px;`;
    img.style.cssText=`position:absolute;left:50%;top:50%;max-width:none;max-height:none;width:${width*scale}px;height:${height*scale}px;transform:translate(-50%,-50%) rotate(${angle}deg);`;
  }
  function showHint() {
    const c = E.current(state); E.hint(state); persist(); render();
    const number=c.cardType==='choice'?55:c.number;
    const col = D.hintColumns.findIndex(list=>list.includes(number)), row = D.hintColumns[col].indexOf(number);
    showModal(`第 ${number} 號卡 · 原版提示`, '<p>只顯示這張卡的原版提示列。可旋轉查看；每題重複查看只記錄一次，不額外扣分。</p><div class="viewer-tools"><button data-action="hint-rotate">旋轉 180°</button></div><canvas class="hint-canvas" id="hint-canvas" width="1040" height="88" aria-label="原版卡牌提示列"></canvas>');
    const img = new Image(); img.onload = () => {
      const canvas = document.getElementById('hint-canvas'); if (!canvas) return;
      const sx = col===0?55:644, sy=187+row*38.15, sw=col===0?496:494;
      canvas.getContext('2d').drawImage(img,sx/1167*img.width,sy/748*img.height,sw/1167*img.width,35/748*img.height,0,0,1040,88);
    }; img.src = asset(D.hintsImage);
  }
  function compare() {
    const current = E.current(state);
    const cards = [current, ...state.inventory.map(id=>E.itemCard(state,id)), ...(state.visited.includes('lab')?[D.cards.lab]:[])].filter(c=>c&&E.canReveal(state,c.id));
    const unique = Array.from(new Map(cards.map(c=>[c.id,c])).values());
    const options = chosen => unique.map(c=>`<option value="${c.id}" ${c.id===chosen?'selected':''}>${esc(c.title)}</option>`).join('');
    showModal('桌上比對', `<p class="compare-instructions">按住卡牌直接拖曳，點選後調整旋轉、縮放與透明度。重疊時，也可用下方 A／B 按鈕選取被遮住的卡牌。</p><div class="compare-pickers"><label>A · 卡牌<select id="compare-a">${options(current?.id)}</select></label><label>B · 比對物品<select id="compare-b">${options(unique[1]?.id)}</select></label></div><div class="viewer-tools compare-toolbar"><button data-action="compare-layout" data-layout="side">並排排列</button><button data-action="compare-layout" data-layout="overlay">重疊排列</button><button data-action="compare-front">選取物品移到最上層</button><button data-action="compare-reset">重設桌面</button></div><div id="comparison" class="compare-stage" aria-label="物品比對畫布">${['a','b'].map(key=>`<div id="compare-object-${key}" class="compare-object" data-layer="${key}" data-action="compare-select" role="button" tabindex="0"><img id="compare-image-${key}" alt="" draggable="false"></div>`).join('')}</div><div class="compare-selection" role="group" aria-label="選取要調整的卡牌"><button id="compare-select-a" data-action="compare-select" data-layer="a">A · 卡牌</button><button id="compare-select-b" data-action="compare-select" data-layer="b">B · 比對物品</button><span class="muted">方向鍵微調 · Shift 加速</span></div><div id="compare-controls" class="compare-controls"><label for="compare-rotation">旋轉 <output id="compare-rotation-value"></output><input id="compare-rotation" type="range" min="-180" max="180" step="1" value="0"></label><label for="compare-scale">縮放 <output id="compare-scale-value"></output><input id="compare-scale" type="range" min="20" max="250" value="100"></label><label for="compare-opacity">透明度 <output id="compare-opacity-value"></output><input id="compare-opacity" type="range" min="10" max="100" value="100"></label></div>`,true);
    const stage=document.getElementById('comparison');
    comparison={ selected:'b', layout:'side', drag:null, layers:{a:{x:26,y:50,rotation:0,scale:100,opacity:100,z:1},b:{x:74,y:50,rotation:0,scale:100,opacity:100,z:2}}, observer:new ResizeObserver(()=>updateCompare()) };
    comparison.observer.observe(stage);
    ['a','b'].forEach(key=>{
      const img=document.getElementById(`compare-image-${key}`);
      img.onload=()=>{if(img.isConnected)updateCompare();};
      loadCompareCard(key);
    });
    stage.addEventListener('pointerdown',event=>{
      const object=event.target.closest('.compare-object');
      if(!object||!comparison||comparison.drag||!event.isPrimary||event.button!==0)return;
      event.preventDefault(); selectCompare(object.dataset.layer); object.focus({preventScroll:true});
      const layer=comparison.layers[comparison.selected];
      comparison.drag={pointerId:event.pointerId,key:comparison.selected,clientX:event.clientX,clientY:event.clientY,x:layer.x,y:layer.y};
      if(event.isTrusted)stage.setPointerCapture(event.pointerId);
      object.classList.add('dragging');
    });
    stage.addEventListener('pointermove',event=>{
      const drag=comparison?.drag;if(!drag||drag.pointerId!==event.pointerId)return;
      event.preventDefault();const layer=comparison.layers[drag.key];
      layer.x=drag.x+(event.clientX-drag.clientX)/stage.clientWidth*100;
      layer.y=drag.y+(event.clientY-drag.clientY)/stage.clientHeight*100;
      updateCompare();
    });
    const finishDrag=event=>{
      if(comparison?.drag?.pointerId!==event.pointerId)return;
      document.getElementById(`compare-object-${comparison.drag.key}`).classList.remove('dragging');
      comparison.drag=null;
      if(stage.hasPointerCapture(event.pointerId))stage.releasePointerCapture(event.pointerId);
    };
    ['pointerup','pointercancel','lostpointercapture'].forEach(type=>stage.addEventListener(type,finishDrag));
    stage.addEventListener('keydown',event=>{
      const object=event.target.closest('.compare-object');if(!object||!comparison)return;
      if(event.key==='Enter'||event.key===' '){event.preventDefault();selectCompare(object.dataset.layer);return;}
      const moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]},move=moves[event.key];if(!move)return;
      event.preventDefault();selectCompare(object.dataset.layer);
      const layer=comparison.layers[comparison.selected],step=event.shiftKey?10:1;
      layer.x+=move[0]*step/stage.clientWidth*100;layer.y+=move[1]*step/stage.clientHeight*100;updateCompare();
    });
    updateCompare();
  }
  function loadCompareCard(key) {
    const id=document.getElementById(`compare-${key}`).value;
    if(!E.canView(state,id)&&!state.inventory.some(item=>E.itemCard(state,item).id===id))throw new Error('無法查看未解鎖物品。');
    const card=D.cards[id];document.getElementById(`compare-image-${key}`).src=asset(card.frontImage);
    document.getElementById(`compare-object-${key}`).setAttribute('aria-label',`${key.toUpperCase()} · ${card.title}，可拖曳或用方向鍵移動`);
    document.getElementById(`compare-select-${key}`).textContent=`${key.toUpperCase()} · ${card.title}`;
  }
  function selectCompare(key) {
    if(!comparison?.layers[key])return;comparison.selected=key;updateCompare();
  }
  function arrangeCompare(layout,reset=false) {
    if(!comparison)return;comparison.layout=layout;
    ['a','b'].forEach(key=>{
      const layer=comparison.layers[key];
      layer.x=layout==='overlay'?50:key==='a'?26:74;layer.y=50;
      layer.opacity=layout==='overlay'&&key==='b'?60:100;layer.z=key==='a'?1:2;
      if(reset){layer.rotation=0;layer.scale=100;}
    });updateCompare();
  }
  function updateCompare() {
    const stage=document.getElementById('comparison');if(!comparison||!stage)return;
    const width=stage.clientWidth,height=stage.clientHeight;if(!width||!height)return;
    stage.classList.toggle('overlay-mode',comparison.layout==='overlay');
    ['a','b'].forEach(key=>{
      const layer=comparison.layers[key],object=document.getElementById(`compare-object-${key}`),img=document.getElementById(`compare-image-${key}`);
      const ratio=img.naturalWidth&&img.naturalHeight?img.naturalHeight/img.naturalWidth:1.4;
      const objectWidth=Math.min(width*.43,height*.82/ratio),objectHeight=objectWidth*ratio;
      // Keep each card's center inside the canvas so it stays reachable at any angle or scale.
      layer.x=Math.max(24/width*100,Math.min((width-24)/width*100,layer.x));
      layer.y=Math.max(24/height*100,Math.min((height-24)/height*100,layer.y));
      object.style.cssText=`left:${layer.x}%;top:${layer.y}%;width:${objectWidth}px;height:${objectHeight}px;z-index:${layer.z};transform:translate(-50%,-50%) rotate(${layer.rotation}deg) scale(${layer.scale/100});`;
      img.style.opacity=layer.opacity/100;
      const selected=key===comparison.selected;
      object.classList.toggle('selected',selected);object.setAttribute('aria-pressed',selected);
      document.getElementById(`compare-select-${key}`).setAttribute('aria-pressed',selected);
    });
    const selected=comparison.layers[comparison.selected];
    ['rotation','scale','opacity'].forEach(property=>{
      document.getElementById(`compare-${property}`).value=selected[property];
      document.getElementById(`compare-${property}-value`).textContent=selected[property]+(property==='rotation'?'°':'%');
    });
  }
  function log() {
    showModal('作答與提示紀錄', `<p>錯誤 X 會在結算時轉換成每個 5 分鐘。原始作答會保留，已核對的題目不能重答。</p>${Object.entries(state.answers).map(([id,r])=>`<div class="log-entry"><strong>第 ${D.cards[id].number} 號 · ${esc(D.cards[id].title)}</strong><p>${esc(answerLabel(id,r.answer))}</p><span class="muted">${r.status==='verified'?(r.correct?'正確':'錯誤'):'待核對'} · ${r.penalty} X · ${r.mode==='automatic'?'原文判定':'人工核對'}${state.hints.includes(id)?' · 已看提示':''}</span>${r.status==='unverified'?`<p>${button('補上核對結果','review',true,`data-card="${id}"`)}</p>`:''}</div>`).join('') || '<p class="muted">還沒有作答紀錄。</p>'}<div class="modal-actions">${button('匯出紀錄','export',true)}${button('關閉','close')}</div>`);
  }
  function review(id) {
    const r=state.answers[id]; if (!r || r.status!=='unverified') return;
    showModal(`補核對 · 第 ${D.cards[id].number} 號`, `<p>原始作答：${esc(answerLabel(id,r.answer))}</p><p>請對照實體解答後記錄結果；作答內容與作答時間不會更改。</p><label class="check-label"><input type="checkbox" id="review-missing" ${r.declaredMissing?'checked':''}>當時缺少必需物品（2 個 X）</label><div class="modal-actions">${button('核對為正確','review-result',false,`data-card="${id}" data-correct="true"`)}${button('核對為錯誤','review-result',true,`data-card="${id}" data-correct="false"`)}</div>`);
  }
  function exportLog() {
    const lines = ['口袋密室：時間測試 — 遊戲紀錄',`匯出時間：${new Date().toLocaleString('zh-TW')}`,`探索時間：${time(E.stats(state).elapsed)}`,`錯誤 X：${E.stats(state).errors}`,`待核對：${E.stats(state).unresolved}`,`結局：${state.ending || '尚未結束'}`,'',...Object.entries(state.answers).map(([id,r])=>`${D.cards[id].number} ${D.cards[id].title}\n作答：${answerLabel(id,r.answer)}\n結果：${r.status==='verified'?(r.correct?'正確':'錯誤'):'待核對'} / ${r.penalty} X`),'','探索筆記：',state.notes];
    const blob=new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/plain;charset=utf-8'}), url=URL.createObjectURL(blob), link=document.createElement('a');
    link.href=url;link.download='口袋密室-遊戲紀錄.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function history() {
    const cards=state.visited.map(id=>D.cards[id]).filter(c=>c && E.canView(state,c.id));
    showModal('已讀卡牌',`<p>只保留已解鎖的卡牌；尚未到達的內容不會出現。</p><div class="history-grid">${cards.map(c=>`<button data-action="view" data-card="${c.id}"><img src="${asset(c.frontImage)}" alt="" loading="lazy">${esc(c.title)}</button>`).join('')}</div>`,true);
  }
  function catalog() {
    if (!dev) return;
    showModal('開發素材檢視 · 包含劇透',`<div class="notice warning">這個清單只在網址帶有 ?dev=1 時開啟。正式遊玩請移除網址參數。</div><div class="history-grid">${Object.values(D.cards).map(c=>`<button data-action="dev-view" data-card="${c.id}"><img src="${asset(c.frontImage)}" alt="" loading="lazy">${esc(c.title)} (${c.id})</button>`).join('')}</div>`,true);
  }
  function act(action,target) {
    switch(action) {
      case 'rules':rules();break;
      case 'rules-accept':if(modal.open&&rulesReview?.complete){rulesAcknowledged=true;closeModal();finishStart();}break;
      case 'new':start();break;
      case 'reset-confirm':begin();break;
      case 'continue':onHome=false;render();break;
      case 'home':onHome=true;persist();closeModal();render();break;
      case 'close':closeModal();break;
      case 'deck':E.selectDeck(state,target.dataset.deck);persist();render();break;
      case 'advance':E.advance(state);persist();render();break;
      case 'confirm-answer':{const answer=target.dataset.answer;E.submit(state,answer);closeModal();persist();render();break;}
      case 'adjudicate':E.adjudicate(state,target.dataset.verdict,document.getElementById('missing-item')?.checked);persist();render();break;
      case 'view':view(target.dataset.card);break;
      case 'item':viewer(E.itemCard(state,target.dataset.item));break;
      case 'solution':{const c=E.current(state);if(c.backImage&&state.answers[c.id]&&state.answers[c.id].status!=='pending')viewer({...c,title:'解決方案',frontImage:c.backImage});break;}
      case 'rotate':{const img=document.getElementById('viewer-image');img.dataset.rotation=Number(img.dataset.rotation)+Number(target.dataset.angle);updateViewer();break;}
      case 'zoom':document.getElementById('viewer').classList.toggle('zoomed');updateViewer();break;
      case 'view-reset':{const img=document.getElementById('viewer-image');img.dataset.rotation='0';document.getElementById('viewer').classList.remove('zoomed');updateViewer();break;}
      case 'hint':showHint();break;
      case 'hint-card':{const card=D.hintCards.find(c=>c.id===target.dataset.card);if(state&&card)viewer(card);break;}
      case 'hint-rotate':{const canvas=document.getElementById('hint-canvas');canvas.style.transform=canvas.style.transform?'':'rotate(180deg)';break;}
      case 'compare':compare();break;
      case 'compare-select':selectCompare(target.dataset.layer);document.getElementById(`compare-object-${target.dataset.layer}`)?.focus({preventScroll:true});break;
      case 'compare-layout':arrangeCompare(target.dataset.layout);break;
      case 'compare-front':if(comparison){comparison.layers[comparison.selected].z=2;comparison.layers[comparison.selected==='a'?'b':'a'].z=1;updateCompare();}break;
      case 'compare-reset':arrangeCompare('side',true);break;
      case 'history':history();break;
      case 'log':log();break;
      case 'review':review(target.dataset.card);break;
      case 'review-result':{const r=state.answers[target.dataset.card];if(r?.status!=='unverified')break;r.correct=target.dataset.correct==='true';r.status='verified';r.declaredMissing=!!document.getElementById('review-missing')?.checked;r.penalty=r.missing.length||r.declaredMissing?2:r.correct?0:1;persist();closeModal();render();toast('已更新核對結果與成績。');break;}
      case 'export':exportLog();break;
      case 'finish-confirm':E.finish(state,target.dataset.item);closeModal();persist();render();break;
      case 'catalog':catalog();break;
      case 'dev-view':if(dev)viewer(D.cards[target.dataset.card]);break;
    }
  }
  document.addEventListener('click',event=>{const target=event.target.closest('[data-action]');if(!target)return;try{act(target.dataset.action,target);}catch(error){toast(error.message);}});
  document.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('img[role="button"]')){event.preventDefault();event.target.click();}});
  document.addEventListener('submit',event=>{
    if(event.target.id==='answer-form'){
      event.preventDefault();const c=E.current(state),data=new FormData(event.target);if(!c)return;
      let answer=data.get('answer');
      if(P.puzzles[c.id].inputType==='item-orientation'){
        const item=data.get('selectedItem'),angle=data.get('rotation');
        if(!state.inventory.includes(item)||!['0','90','180','270'].includes(angle)){toast('請選擇已取得的物品與卡片方向。');return;}
        answer=`${item}:${angle}`;
      }
      if(!String(answer??'').trim())return;
      if(E.answerBlockers(state,c.id).length){toast('請先取得關鍵物品，再作答。');return;}
      showModal('確定送出這個解答？',`<p>送出後答案即鎖定，無法重答。</p><div class="recorded-answer">${esc(answerLabel(c.id,answer))}</div><div class="modal-actions">${button('再想一想','close',true)}${button('確定作答','confirm-answer',false,`data-answer="${esc(answer)}"`)}</div>`);
    }else if(event.target.id==='ending-form'){
      event.preventDefault();const id=new FormData(event.target).get('leftItem');if(!D.items[id])return;
      showModal('做出最後的選擇',`<p>確定將「${esc(D.items[id].name)}」留在過去嗎？確認後結束計時並揭曉結局。</p><div class="modal-actions">${button('再想一想','close',true)}${button('留下物品，回到未來','finish-confirm',false,`data-item="${id}"`)}</div>`);
    }
  });
  document.addEventListener('input',event=>{
    if(event.target.id==='notes'){state.notes=event.target.value;persist();}
    const property=event.target.id.replace('compare-','');
    if(comparison&&['rotation','scale','opacity'].includes(property)){comparison.layers[comparison.selected][property]=Number(event.target.value);updateCompare();}
  });
  document.addEventListener('change',event=>{
    if(event.target.id==='answer-item')updateOrientationOptions();
    if(comparison&&['compare-a','compare-b'].includes(event.target.id)){const key=event.target.id.slice(-1);loadCompareCard(key);selectCompare(key);}
  });
  document.getElementById('rules-button').addEventListener('click',()=>rules());
  document.getElementById('home-link').addEventListener('click',event=>{event.preventDefault();onHome=true;persist();render();});
  document.getElementById('modal-close').addEventListener('click',closeModal);
  modal.addEventListener('click',event=>{if(event.target===modal){const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeModal();}});
  modal.addEventListener('close',()=>{if(!modal.open){clearRulesReview();comparison?.observer.disconnect();comparison=null;}});
  window.addEventListener('pagehide',persist);
  window.addEventListener('resize',updateViewer);
  window.addEventListener('storage',event=>{if(event.key!==E.SAVE_KEY||testing)return;try{state=E.load(storage);closeModal();render();toast('已同步另一個分頁的遊戲進度。');}catch(error){toast(error.message);}});
  setInterval(()=>{if(!state)return;const timer=document.getElementById('timer');if(timer)timer.textContent=time(E.stats(state).elapsed);},1000);
  if(testing)window.GameTest={getState:()=>E.clone(state),setState:value=>{if(!E.valid(value))throw new Error('Invalid fixture');state=E.clone(value);onHome=false;render();},save:()=>persist(),reload:()=>{state=E.load(storage);onHome=false;render();},render};
  render();
})();
