(async function () {
  'use strict';
  const E=GameEngine,D=DeckData,P=PuzzleData, output=document.getElementById('results');
  const results=[];let failed=0;
  function assert(condition,message='Assertion failed'){if(!condition)throw new Error(message);}
  function throws(fn){let did=false;try{fn();}catch{did=true;}assert(did,'Expected rejection');}
  function test(name,fn){try{fn();results.push('PASS '+name);}catch(error){failed++;results.push('FAIL '+name+': '+error.message);}output.textContent=results.join('\n')+'\nRUNNING';}
  async function testAsync(name,fn){try{await fn();results.push('PASS '+name);}catch(error){failed++;results.push('FAIL '+name+': '+error.message);}output.textContent=results.join('\n')+'\nRUNNING';}
  function solve(state,manual='correct'){
    const c=E.current(state),p=P.puzzles[c.id]; E.submit(state,p.answers?.[0]||'測試作答',2000);
    if(state.answers[c.id].status==='pending')E.adjudicate(state,manual);
  }
  function playing(){const s=E.fresh(1000);while(s.phase==='intro'){if(E.current(s).cardType==='puzzle')solve(s);E.advance(s,2000);}return s;}
  function atPuzzle(id,unlocked=true){const s=playing();const c=D.cards[id];s.activeDeck=c.deck;s.deckPositions[c.deck]=D.decks[c.deck].cards.indexOf(id);s.visited.push(id);if(unlocked)s.inventory.push(...E.answerBlockers(s,id));return s;}
  test('所有卡牌 ID 唯一，牌堆與謎題資料可相互對應',()=>{
    const ids=Object.values(D.decks).flatMap(d=>d.cards);assert(new Set(ids).size===ids.length);
    ids.forEach(id=>assert(D.cards[id]));Object.keys(P.puzzles).forEach(id=>assert(D.cards[id]?.puzzleId===id));
    assert(Object.keys(P.puzzles).length===26);assert(Object.values(P.puzzles).filter(p=>p.answers).length===26);
  });
  test('所有 14 件物品都且只對應一個結局',()=>{Object.keys(D.items).forEach(id=>assert(Object.values(D.endings).filter(e=>e.items.includes(id)).length===1));assert(Object.keys(D.items).length===14);});
  test('初始只解鎖第一張開場卡',()=>{const s=E.fresh();assert(E.canView(s,'intro-3'));assert(!E.canView(s,'p12'));assert(!E.canView(s,'ending-D'));});
  test('開場不能切換牌堆或提前結局',()=>{const s=E.fresh();throws(()=>E.selectDeck(s,'blue'));throws(()=>E.finish(s,'score'));});
  test('教學正確作答與解答背面',()=>{const s=E.fresh();while(E.current(s).id!=='p6')E.advance(s);E.submit(s,'紫色');assert(s.answers.p6.correct===true);assert(E.current(s).backImage);});
  test('教學答錯只記一次 X 並可以繼續',()=>{const s=E.fresh();while(E.current(s).id!=='p6')E.advance(s);E.submit(s,'red');assert(E.stats(s).errors===1);throws(()=>E.submit(s,'purple'));E.advance(s);assert(E.current(s).id==='light');});
  test('未作答無法翻越謎題',()=>{const s=atPuzzle('p14');throws(()=>E.advance(s));throws(()=>E.submit(s,'  '));});
  test('藍色帷幕完成設置才開始計時',()=>{const s=E.fresh(10);assert(E.stats(s,10000).elapsed===0);const p=playing();assert(p.startedAt===2000);assert(E.stats(p,62000).elapsed===60000);});
  test('全形字與英文大小寫正規化',()=>{assert(P.check('p24',' Ｅｉｎｓｔｅｉｎ ')===true);assert(P.check('p12','Ｘ')===true);});
  test('14 號以 6 自動判定並推進到新版 15 號圖片',()=>{const s=atPuzzle('p14');E.submit(s,'6');assert(s.answers.p14.correct&&s.answers.p14.status==='verified');assert(E.stats(s).errors===0);E.advance(s);assert(E.current(s).id==='p15');assert(E.current(s).frontImage.endsWith('005-箭頭方向-題目3_改.png'));const wrong=atPuzzle('p14');E.submit(wrong,'4');assert(wrong.answers.p14.correct===false&&E.stats(wrong).errors===1);});
  test('15、34 號座標忽略標點、空白與全半形，錯誤或多個座標仍計一次錯誤',()=>{
    const cases=[['p15',['C3','3C','c3','3c','Ｃ３','C,3','C.3','C3.','C3。','C/3','C-3','C：3','(C3)','「C3」','C_3','C 3','3 C','Ｃ，３。','（３　ｃ）','C＋3'],['C4','3B','C3/D2','C3C3','3C4','---']],['p34',['2D','D2','d2','２Ｄ','D,2','2 D','Ｄ，２。','（２　ｄ）','D/2','2＋D'],['D3','2C','D2/C3','D2D2','2D3','---']]];
    for(const [id,correct,incorrect] of cases){
      for(const answer of correct){const s=atPuzzle(id);E.submit(s,answer);assert(s.answers[id].correct===true,id+': '+answer);assert(E.stats(s).errors===0);assert(s.answers[id].answer===answer,'Original answer must be preserved');}
      for(const answer of incorrect){const s=atPuzzle(id);E.submit(s,answer);assert(s.answers[id].correct===false,id+': '+answer);assert(E.stats(s).errors===1);throws(()=>E.submit(s,correct[0]));}
    }
  });
  test('新答案能核對舊存檔的未核對作答，保留答案與進度',()=>{const s=atPuzzle('p14');s.answers.p14={answer:'6',at:2100,correct:null,status:'pending',mode:'manual',missing:[],penalty:0};s.answers.p15={answer:'3.C',at:2200,correct:null,status:'unverified',mode:'manual',missing:[],penalty:0};const old=JSON.stringify(s),loaded=E.load({getItem:()=>old});assert(loaded.answers.p14.correct===true&&loaded.answers.p14.status==='verified');assert(loaded.answers.p15.correct===true&&loaded.answers.p15.penalty===0);assert(loaded.answers.p15.answer==='3.C'&&loaded.answers.p15.at===2200);assert(JSON.stringify(loaded.deckPositions)===JSON.stringify(s.deckPositions));s.answers.p14.correct=false;s.answers.p14.status='verified';s.answers.p14.penalty=1;assert(E.load({getItem:()=>JSON.stringify(s)}).answers.p14.correct===false);});
  test('舊存檔自動判錯的正確座標重新核對，保留進度時間、人工核對及缺件扣分',()=>{
    for(const [id,answer] of [['p15','C,3'],['p15','C3。'],['p15','C 3'],['p34','D,2'],['p34','２　Ｄ']]){
      const s=atPuzzle(id);s.notes='保留筆記';s.answers[id]={answer,at:2300,correct:false,status:'verified',mode:'automatic',missing:[],penalty:1};
      const loaded=E.load({getItem:()=>JSON.stringify(s)});assert(loaded.answers[id].correct===true&&E.stats(loaded).errors===0);assert(loaded.answers[id].answer===answer&&loaded.answers[id].at===2300);
      assert(JSON.stringify({...loaded,answers:{}})===JSON.stringify({...s,answers:{}}),'Progress, timing and notes must stay unchanged');
      assert(JSON.stringify(E.load({getItem:()=>JSON.stringify(loaded)}))===JSON.stringify(loaded),'Reload must be idempotent');
      s.answers[id].mode='manual';assert(E.load({getItem:()=>JSON.stringify(s)}).answers[id].correct===false);
      s.answers[id].mode='automatic';s.answers[id].declaredMissing=true;s.answers[id].penalty=2;const missing=E.load({getItem:()=>JSON.stringify(s)});assert(missing.answers[id].correct===true&&missing.answers[id].penalty===2);
      s.answers[id].answer='C4';s.answers[id].declaredMissing=false;s.answers[id].penalty=1;assert(E.load({getItem:()=>JSON.stringify(s)}).answers[id].correct===false);
    }
  });
  test('新增答案及別名自動核對，包括巴黎、Parris、III、逆及 B2 座標',()=>{
    const cases={p17:['237'],p19:['7'],p20:['14270'],p26:['A','巴黎','Parris','Paris','ａ'],p27:['2'],p30:['G'],p31:['3','III','iii'],p38:['D'],p40:['B'],p42:['2'],p45:['D'],p48:['LHFHK','ｌ ｈ ｆ ｈ ｋ','L-H-F-H-K'],p49:['逆時針','逆','counterclockwise'],p50:['B2','2B','Ｂ，２。','2 b'],p52:['A'],p53:['插頭沒插']};
    for(const [id,answers] of Object.entries(cases))for(const answer of answers){const s=atPuzzle(id);s.inventory=[...new Set([...s.inventory,...P.puzzles[id].required])];E.submit(s,answer);assert(s.answers[id].correct&&s.answers[id].mode==='automatic',id+': '+answer);assert(E.stats(s).errors===0);}
    assert(!P.check('p48','LHFH'));assert(!P.check('p48','LHHFK'));assert(!P.check('p50','B3'));assert(!P.check('p50','B2 C3'));
  });
  test('自動判錯只記一次並鎖定答案，可依指示繼續',()=>{const s=atPuzzle('p17');E.submit(s,'test');assert(s.answers.p17.correct===false&&E.stats(s).errors===1);throws(()=>E.adjudicate(s,'correct'));throws(()=>E.submit(s,'237'));E.advance(s);assert(E.current(s).id==='yellow-009');});
  test('17、20、24、34 缺關鍵物品時禁止作答，不扣分、不留下答案',()=>{
    for(const [id,item] of [['p17','card777'],['p20','circuit'],['p24','cipher'],['p34','note']]){const s=atPuzzle(id,false),before=JSON.stringify(s);assert(E.canReveal(s,id));throws(()=>E.submit(s,P.puzzles[id].answers[0]));assert(JSON.stringify(s)===before);throws(()=>E.advance(s));s.inventory.push(item);E.submit(s,P.puzzles[id].answers[0]);assert(s.answers[id].correct&&E.stats(s).errors===0);}
  });
  test('26 取得手電筒前禁止公開、查看、作答、提示及前進，已讀舊紀錄也不能繞過',()=>{
    const s=atPuzzle('p26',false),before=JSON.stringify(s);assert(!E.canReveal(s,'p26')&&!E.canView(s,'p26'));throws(()=>E.submit(s,'A'));throws(()=>E.hint(s));throws(()=>E.advance(s));assert(JSON.stringify(s)===before);
    s.inventory.push('flashlight');assert(E.canReveal(s,'p26')&&E.canView(s,'p26'));E.submit(s,'巴黎');assert(s.answers.p26.correct&&E.stats(s).errors===0);
  });
  test('不憑推測增加物品限制，並接受合理中文表述',()=>{const s=atPuzzle('p24');E.submit(s,'Einstein');assert(E.stats(s).errors===0);assert(P.check('p12','按下計算機上的 X 鍵'));});
  test('其他題目保留明確物品缺件的 2 X',()=>{for(const answer of ['A','B']){const s=atPuzzle('p23');E.submit(s,answer);assert(E.stats(s).errors===2);}});
  test('28 僅接受已取得物品，三稜鏡正確，其他物品錯誤',()=>{
    const s=atPuzzle('p28');throws(()=>E.submit(s,'prism'));assert(!s.answers.p28);s.inventory.push('prism');E.submit(s,'prism');assert(s.answers.p28.correct&&E.stats(s).errors===0);
    const wrong=atPuzzle('p28');E.submit(wrong,'score');assert(!wrong.answers.p28.correct&&E.stats(wrong).errors===1);
  });
  test('46 必須選已取得的電子卡與 180 度，其他物品或角度均不正確',()=>{
    const locked=atPuzzle('p46');throws(()=>E.submit(locked,'electronic:180'));throws(()=>E.submit(locked,'score:360'));assert(!locked.answers.p46);
    for(const answer of ['electronic:0','electronic:90','electronic:180','electronic:270','note:180']){const s=atPuzzle('p46');s.inventory.push('electronic','note');E.submit(s,answer);assert(s.answers.p46.correct===(answer==='electronic:180'),answer);assert(E.stats(s).errors===(answer==='electronic:180'?0:1));}
  });
  test('新增解答能核對舊存檔中的待核對文字，不重置任何牌堆進度',()=>{
    const s=playing();s.answers.p17={answer:'237',at:2500,status:'unverified',correct:null,mode:'manual',missing:[],penalty:0};s.answers.p26={answer:'Paris',at:2600,status:'pending',correct:null,mode:'manual',missing:[],penalty:0};s.answers.p28={answer:'三稜鏡',at:2700,status:'unverified',correct:null,mode:'manual',missing:[],penalty:0};
    const loaded=E.load({getItem:()=>JSON.stringify(s)});for(const id of ['p17','p26','p28']){assert(loaded.answers[id].correct===true&&loaded.answers[id].mode==='automatic');assert(loaded.answers[id].answer===s.answers[id].answer&&loaded.answers[id].at===s.answers[id].at);}
    assert(JSON.stringify(loaded.deckPositions)===JSON.stringify(s.deckPositions));assert(E.stats(loaded).unresolved===0);
  });
  test('提示只累計一次，不扣分',()=>{const s=atPuzzle('p14');E.hint(s);E.hint(s);assert(E.stats(s).hints===1);assert(E.stats(s).errors===0);});
  test('未取得的物品無法查看',()=>{const s=playing();throws(()=>E.itemCard(s,'circuit'));assert(!E.canView(s,'flashlight-lit'));});
  test('手電筒需取得電池才能翻面',()=>{const s=playing();s.inventory.push('flashlight');assert(E.itemCard(s,'flashlight').id==='blue-003');assert(!E.canView(s,'flashlight-lit'));s.inventory.push('batteries');assert(E.itemCard(s,'flashlight').id==='flashlight-lit');assert(E.canView(s,'flashlight-lit'));});
  test('牌堆進度相互獨立且共用物品',()=>{const s=playing();solve(s);E.advance(s);E.advance(s);E.advance(s);assert(s.inventory.includes('note'));assert(E.current(s).id==='p14');E.selectDeck(s,'red');assert(E.current(s).id==='p34');assert(s.inventory.includes('note'));E.selectDeck(s,'yellow');assert(E.current(s).id==='p14');});
  test('跨頁面存讀檔、作答和筆記完整保存',()=>{const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};const s=atPuzzle('p14');s.notes='測試 <script> & notes';E.submit(s,'測試');E.save(s,storage);assert(JSON.stringify(E.load(storage))===JSON.stringify(s));assert(E.stats(E.load(storage),62000).elapsed===60000);});
  test('實際瀏覽器 localStorage 可寫入與讀回中文存檔',()=>{const key='deckscape-qa-'+Date.now(),adapter={getItem:()=>localStorage.getItem(key),setItem:(_,v)=>localStorage.setItem(key,v)};try{const s=playing();s.notes='中文存檔';E.save(s,adapter);assert(E.load(adapter).notes==='中文存檔');}finally{localStorage.removeItem(key);}});
  test('損壞與不完整存檔不靜默覆寫',()=>{throws(()=>E.load({getItem:()=>'{bad'}));throws(()=>E.load({getItem:()=>'{"version":1}'}));const s=playing();s.deckPositions.blue=-1;assert(!E.valid(s));});
  test('禁止輸入非法牌堆',()=>{throws(()=>E.selectDeck(playing(),'nonexistent'));});
  test('所有路線能抵達最後選擇並取得全部物品',()=>{
    const s=playing();let rounds=0;
    while(!Object.keys(D.decks).every(deck=>!E.current(s,deck)||E.current(s,deck).cardType==='choice')){
      const before=JSON.stringify(s.deckPositions);
      for(const deck of Object.keys(D.decks)){E.selectDeck(s,deck);while(E.current(s)&&E.current(s).cardType!=='choice'){
        const c=E.current(s),p=P.puzzles[c.id];
        if(!E.canReveal(s,c.id)||E.answerBlockers(s,c.id).length||p?.required.some(id=>!s.inventory.includes(id))||(p?.inputType==='inventory'&&!s.inventory.includes(p.answers[0])))break;
        if(c.cardType==='puzzle')solve(s);E.advance(s,3000);
      }}
      assert(JSON.stringify(s.deckPositions)!==before,'Dependency deadlock');assert(++rounds<20);
    }
    E.selectDeck(s,'blue');assert(E.current(s).cardType==='choice');assert(s.inventory.length===14);assert(Object.keys(s.answers).length===26);assert(E.valid(s));assert(E.stats(s).errors===0&&E.stats(s).unresolved===0);
    window.completeFixture=E.clone(s);
  });
  ['A','B','C','D'].forEach(id=>test('結局 '+id+' 分流與評分正確',()=>{const s=E.clone(window.completeFixture),end=D.endings[id];E.finish(s,end.items[0],62000);const stat=E.stats(s,999999);assert(s.ending===id);assert(stat.elapsed===60000);assert(stat.remaining===Math.max(0,stat.errors-end.discount));assert(stat.total===60000+stat.remaining*300000);assert(E.canView(s,end.cardId));assert(!E.canView(s,D.endings[id==='A'?'B':'A'].cardId));assert(E.valid(s));throws(()=>E.finish(s,end.items[0]));}));
  test('結局抵銷不會產生負分或負加時',()=>{const s=E.clone(window.completeFixture);Object.values(s.answers).forEach(r=>r.penalty=0);E.finish(s,'electrode',3000);assert(E.stats(s).remaining===0);});
  test('評級 60、61、90、91 分鐘邊界',()=>{const s=playing();const base=s.startedAt;assert(E.stats(s,base+60*60000).rating.startsWith('真正'));assert(E.stats(s,base+61*60000).rating==='任務完成！');assert(E.stats(s,base+90*60000).rating==='任務完成！');assert(E.stats(s,base+91*60000).rating.startsWith('亡羊'));});
  test('選擇未取得物品與提前結局均被阻止',()=>{const s=E.clone(window.completeFixture);s.inventory=s.inventory.filter(id=>id!=='electrode');throws(()=>E.finish(s,'electrode'));throws(()=>E.finish(playing(),'note'));});
  test('最後選擇可查看 55 號原版提示，且存檔有效',()=>{const s=E.clone(window.completeFixture);E.hint(s);assert(s.hints.includes('ending-choice'));assert(E.valid(s));});
  test('後退的系統時鐘不會產生負時間',()=>{assert(E.stats(playing(),0).elapsed===0);});
  const frame=document.getElementById('ui');
  const ready=()=>new Promise((resolve,reject)=>{let count=0;const timer=setInterval(()=>{try{if(frame.contentWindow.GameTest){clearInterval(timer);resolve();}else if(count++>100){clearInterval(timer);reject(new Error('UI did not initialize'));}}catch(e){clearInterval(timer);reject(e);}},50);});
  await testAsync('首頁進入實驗室在閱讀規則前鎖定，保留原閱讀按鈕',async()=>{
    await ready();const win=frame.contentWindow,doc=frame.contentDocument;assert(doc.title.includes('口袋密室'));
    assert(doc.querySelector('[data-action="new"]').disabled);assert(doc.querySelector('[data-action="rules"]'));assert(doc.getElementById('rules-button'));
    doc.querySelector('[data-action="new"]').click();assert(win.GameTest.getState()===null);assert(!doc.getElementById('modal').open);
  });
  test('兩個閱讀規則入口都要求確認，關閉視窗不解鎖也不產生存檔',()=>{
    const win=frame.contentWindow,doc=frame.contentDocument;
    for(const selector of ['[data-action="rules"]','#rules-button']){
      doc.querySelector(selector).click();const reader=doc.getElementById('rules-reader'),accept=doc.querySelector('[data-action="rules-accept"]');
      assert(reader.querySelectorAll('.rule-list li').length===D.rulesText.length);assert(reader.scrollHeight>reader.clientHeight);assert(accept.disabled);
      accept.click();assert(win.GameTest.getState()===null&&doc.getElementById('modal').open);
      if(selector==='#rules-button')doc.getElementById('modal').close();else doc.getElementById('modal-close').click();
      assert(doc.querySelector('[data-action="new"]').disabled);assert(win.GameTest.getState()===null);
    }
  });
  test('直接觸發開始仍要求閱讀，捲到底但未確認也不能開始',()=>{
    const win=frame.contentWindow,doc=frame.contentDocument,trigger=doc.createElement('button');trigger.dataset.action='new';doc.body.append(trigger);trigger.click();trigger.remove();
    assert(doc.getElementById('modal').open&&win.GameTest.getState()===null);const reader=doc.getElementById('rules-reader');reader.scrollTop=reader.scrollHeight;reader.dispatchEvent(new win.Event('scroll'));
    assert(!doc.querySelector('[data-action="rules-accept"]').disabled);doc.getElementById('modal-close').click();assert(doc.querySelector('[data-action="new"]').disabled);assert(win.GameTest.getState()===null);
  });
  await testAsync('桌面及手機規則可完整閱讀，確認只解鎖入口，點進入才開始',async()=>{
    const win=frame.contentWindow,doc=frame.contentDocument;
    for(const width of [390,320,1280]){
      frame.style.width=width+'px';doc.querySelector('[data-action="rules"]').click();await new Promise(resolve=>setTimeout(resolve,100));
      const reader=doc.getElementById('rules-reader'),accept=doc.querySelector('[data-action="rules-accept"]'),rect=accept.getBoundingClientRect();
      assert(doc.getElementById('modal-content').scrollWidth<=doc.getElementById('modal-content').clientWidth,'Rules overflow at '+width);
      assert(rect.top>=0&&rect.bottom<=win.innerHeight,'Rules confirmation must stay visible');
      reader.scrollTop=reader.scrollHeight;reader.dispatchEvent(new win.Event('scroll'));assert(!accept.disabled);
      if(width!==1280){doc.getElementById('modal-close').click();assert(doc.querySelector('[data-action="new"]').disabled);}else accept.click();
    }
    assert(win.GameTest.getState()===null);assert(!doc.querySelector('[data-action="new"]').disabled);assert(!doc.getElementById('modal').open);
    doc.querySelector('[data-action="new"]').click();assert(win.GameTest.getState().phase==='intro');assert(doc.querySelector('.game-card'));assert(!doc.querySelector('[data-action="catalog"]'));
  });
  test('未解鎖卡牌不出現在正式畫面的圖片路徑',()=>{const doc=frame.contentDocument;assert(!doc.body.innerHTML.includes(encodeURIComponent('結局D')));assert(!doc.body.innerHTML.includes(encodeURIComponent('光盤-物品6')));});
  test('作答確認取消不記錄答案，確認才鎖定',()=>{
    const win=frame.contentWindow,doc=frame.contentDocument;const s=E.fresh();while(E.current(s).id!=='p6')E.advance(s);win.GameTest.setState(s);
    doc.querySelector('input[value="purple"]').checked=true;doc.getElementById('answer-form').requestSubmit();assert(doc.getElementById('modal').open);doc.querySelector('#modal [data-action="close"]').click();assert(!win.GameTest.getState().answers.p6);
    doc.getElementById('answer-form').requestSubmit();doc.querySelector('[data-action="confirm-answer"]').click();assert(win.GameTest.getState().answers.p6.correct);assert(!doc.querySelector('#answer-form'));
  });
  test('UI 物品限制擋住表單，26 在主畫面、歷史及比對均不提前公開',()=>{
    const win=frame.contentWindow,doc=frame.contentDocument;
    for(const [id,item] of [['p17','card777'],['p20','circuit'],['p24','cipher'],['p34','note']]){const s=atPuzzle(id,false);win.GameTest.setState(s);assert(doc.querySelector('.game-card'));assert(!doc.querySelector('#answer-form'));assert(doc.querySelector('.interaction').textContent.includes(D.items[item].name));s.inventory.push(item);win.GameTest.setState(s);assert(doc.querySelector('#answer-form'));}
    const s=atPuzzle('p26',false);win.GameTest.setState(s);const source=encodeURIComponent('005-關閉顯示器-題目3_改.png');assert(!doc.querySelector('.game-card')&&!doc.querySelector('#answer-form')&&!doc.body.innerHTML.includes(source));
    doc.querySelector('[data-action="history"]').click();assert(!doc.querySelector('#modal [data-card="p26"]'));doc.getElementById('modal-close').click();
    const compare=doc.createElement('button');compare.dataset.action='compare';doc.body.append(compare);compare.click();assert(!doc.querySelector('#compare-a option[value="p26"]'));assert(!doc.querySelector('#compare-b option[value="p26"]'));assert(!doc.getElementById('modal-content').innerHTML.includes(source));doc.getElementById('modal-close').click();compare.remove();
    s.inventory.push('flashlight');win.GameTest.setState(s);assert(doc.querySelector('.game-card').src.includes(source));assert(doc.querySelector('#answer-form'));assert(!doc.body.innerHTML.includes(encodeURIComponent('004-手電筒-物品13.jpg')));
  });
  test('UI 28 選單只列已取得物品，顯示物品名稱並以三稜鏡正確核對',()=>{
    const win=frame.contentWindow,doc=frame.contentDocument,s=atPuzzle('p28');s.inventory.push('prism','note');win.GameTest.setState(s);
    const select=doc.getElementById('answer');assert(select.tagName==='SELECT');assert(doc.querySelector('.input-label').textContent==='放什麼物品？');assert([...select.options].filter(o=>o.value).map(o=>o.value).join()===s.inventory.join());assert(!doc.querySelector('option[value="electronic"]'));
    select.value='prism';doc.getElementById('answer-form').requestSubmit();assert(doc.querySelector('#modal .recorded-answer').textContent==='三稜鏡');doc.querySelector('[data-action="confirm-answer"]').click();assert(win.GameTest.getState().answers.p28.correct);assert(doc.querySelector('.recorded-answer').textContent==='三稜鏡');
  });
  test('UI 46 依所選物品更新四張方向圖，必須選方向且確認可取消',()=>{
    const win=frame.contentWindow,doc=frame.contentDocument,s=atPuzzle('p46');s.inventory.push('electronic','note');win.GameTest.setState(s);
    const select=doc.getElementById('answer-item');assert(!doc.querySelector('option[value="prism"]'));assert(!doc.querySelector('.orientation-preview'));
    select.value='note';select.dispatchEvent(new win.Event('change',{bubbles:true}));assert(doc.querySelectorAll('.orientation-preview img').length===4);assert([...doc.querySelectorAll('.orientation-preview img')].every(img=>img.src.includes(encodeURIComponent('003-便條-物品1.jpg'))));
    doc.querySelector('input[name="rotation"][value="90"]').checked=true;select.value='electronic';select.dispatchEvent(new win.Event('change',{bubbles:true}));assert(!doc.querySelector('input[name="rotation"]:checked'));assert([...doc.querySelectorAll('.orientation-preview img')].every(img=>img.src.includes(encodeURIComponent('004-電子卡-物品5.jpg'))));
    doc.getElementById('answer-form').requestSubmit();assert(!doc.getElementById('modal').open);doc.querySelector('input[name="rotation"][value="180"]').checked=true;doc.getElementById('answer-form').requestSubmit();assert(doc.querySelector('#modal .recorded-answer').textContent.includes('電子卡 · 旋轉 180 度'));
    doc.querySelector('#modal [data-action="close"]').click();assert(!win.GameTest.getState().answers.p46);doc.getElementById('answer-form').requestSubmit();doc.querySelector('[data-action="confirm-answer"]').click();assert(win.GameTest.getState().answers.p46.answer==='electronic:180'&&win.GameTest.getState().answers.p46.correct);assert(doc.querySelector('.recorded-answer').textContent==='電子卡 · 旋轉 180 度');
  });
  test('UI 53 不加題目文字，四個選項只接受插頭沒插',()=>{
    const win=frame.contentWindow,doc=frame.contentDocument;assert(P.puzzles.p53.prompt==='');assert(P.puzzles.p53.choices.length===4);
    for(const answer of ['左側開關未打開','插頭沒插']){win.GameTest.setState(atPuzzle('p53'));assert(!doc.querySelector('.input-label'));assert(doc.querySelectorAll('input[name="answer"]').length===4);assert(!doc.querySelector('input[name="answer"]:checked'));doc.querySelector(`input[value="${answer}"]`).checked=true;doc.getElementById('answer-form').requestSubmit();doc.querySelector('[data-action="confirm-answer"]').click();assert(win.GameTest.getState().answers.p53.correct===(answer==='插頭沒插'));}
  });
  await testAsync('28、46、53 新作答區在桌面、390px 與 320px 不溢出，方向圖片完整顯示',async()=>{
    const win=frame.contentWindow,doc=frame.contentDocument;
    for(const width of [1280,390,320])for(const id of ['p28','p46','p53']){
      frame.style.width=width+'px';const s=atPuzzle(id);s.inventory.push('electronic','prism','note');win.GameTest.setState(s);
      if(id==='p46'){const select=doc.getElementById('answer-item');select.value='electronic';select.dispatchEvent(new win.Event('change',{bubbles:true}));}
      await new Promise(resolve=>setTimeout(resolve,100));assert(doc.documentElement.scrollWidth<=win.innerWidth,id+' overflow at '+width);
      for(const img of doc.querySelectorAll('.orientation-preview img')){const rect=img.getBoundingClientRect(),box=img.parentElement.getBoundingClientRect();assert(img.naturalWidth>0);assert(rect.left>=box.left-1&&rect.right<=box.right+1&&rect.top>=box.top-1&&rect.bottom<=box.bottom+1,'Rotated image must fit preview');}
    }frame.style.width='1280px';
  });
  test('UI 新答案自動核對，不再要求人工選擇正誤',()=>{const win=frame.contentWindow,doc=frame.contentDocument;win.GameTest.setState(atPuzzle('p17'));doc.getElementById('answer').value='237';doc.getElementById('answer-form').requestSubmit();doc.querySelector('[data-action="confirm-answer"]').click();assert(win.GameTest.getState().answers.p17.correct&&win.GameTest.getState().answers.p17.mode==='automatic');assert(!doc.querySelector('[data-action="adjudicate"]'));doc.querySelector('[data-action="advance"]').click();assert(E.current(win.GameTest.getState()).id==='yellow-009');});
  test('筆記與答案以純文字呈現，存檔可恢復',()=>{const win=frame.contentWindow,doc=frame.contentDocument;const notes=doc.getElementById('notes');notes.value='<img src=x onerror=alert(1)>';notes.dispatchEvent(new Event('input',{bubbles:true}));win.GameTest.reload();assert(doc.getElementById('notes').value===notes.value);assert(!doc.querySelector('img[src="x"]'));});
  test('舊存檔可直接繼續，開始新局須重讀規則，取消重開仍保留進度',()=>{
    const win=frame.contentWindow,doc=frame.contentDocument,before=JSON.stringify(win.GameTest.getState());doc.querySelector('[data-action="home"]').click();assert(doc.querySelector('[data-action="new"]').disabled);
    doc.querySelector('[data-action="continue"]').click();assert(!doc.getElementById('modal').open&&JSON.stringify(win.GameTest.getState())===before);
    doc.querySelector('[data-action="home"]').click();doc.querySelector('[data-action="rules"]').click();const reader=doc.getElementById('rules-reader');reader.scrollTop=reader.scrollHeight;reader.dispatchEvent(new win.Event('scroll'));doc.querySelector('[data-action="rules-accept"]').click();assert(JSON.stringify(win.GameTest.getState())===before);
    doc.querySelector('[data-action="new"]').click();assert(doc.querySelector('[data-action="reset-confirm"]'));doc.querySelector('#modal [data-action="close"]').click();assert(JSON.stringify(win.GameTest.getState())===before);
  });
  test('結局畫面明確標示未核對成績',()=>{const s=E.clone(window.completeFixture);s.answers.p17.correct=null;s.answers.p17.status='unverified';E.finish(s,'electrode',62000);frame.contentWindow.GameTest.setState(s);assert(frame.contentDocument.querySelector('.summary').textContent.includes('暫定成績'));});
  test('待核對作答可以在結算補核對並更新成績',()=>{const doc=frame.contentDocument;doc.querySelector('[data-action="log"]').click();doc.querySelector('[data-action="review"]').click();doc.querySelector('[data-action="review-result"][data-correct="false"]').click();assert(frame.contentWindow.GameTest.getState().answers.p17.correct===false);assert(!doc.querySelector('.summary').textContent.includes('暫定成績'));});
  await testAsync('比對工具只提供已解鎖卡，兩張卡可並排或重疊排列',async()=>{
    const win=frame.contentWindow,doc=frame.contentDocument,s=atPuzzle('p14');s.inventory.push('note');s.visited.push('yellow-003');win.GameTest.setState(s);
    doc.querySelector('[data-action="compare"]').click();assert(!doc.querySelector('#compare-b option[value="flashlight-lit"]'));
    await Promise.all(['a','b'].map(key=>new Promise((resolve,reject)=>{const img=doc.getElementById('compare-image-'+key);if(img.complete&&img.naturalWidth)resolve();else{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',()=>reject(new Error('Comparison image failed to load')),{once:true});}})));
    const a=doc.getElementById('compare-object-a'),b=doc.getElementById('compare-object-b');assert(a.getBoundingClientRect().right<b.getBoundingClientRect().left);
    doc.querySelector('[data-layout="overlay"]').click();assert(doc.getElementById('comparison').classList.contains('overlay-mode'));assert(a.style.left===b.style.left);
    const rotation=doc.getElementById('compare-rotation');rotation.value='90';rotation.dispatchEvent(new win.Event('input',{bubbles:true}));assert(b.style.transform.includes('90deg'));assert(!a.style.transform.includes('90deg'));
  });
  test('旋轉縮放後仍能以滑鼠或觸控獨立拖曳兩張卡，切換選取保留設定',()=>{
    const win=frame.contentWindow,doc=frame.contentDocument,stage=doc.getElementById('comparison');
    const input=(property,value)=>{const el=doc.getElementById('compare-'+property);el.value=value;el.dispatchEvent(new win.Event('input',{bubbles:true}));};
    const drag=(key,pointerType,dx,dy)=>{
      const object=doc.getElementById('compare-object-'+key),rect=stage.getBoundingClientRect();
      const x=parseFloat(object.style.left),y=parseFloat(object.style.top),other=doc.getElementById('compare-object-'+(key==='a'?'b':'a')).style.cssText;
      const init={bubbles:true,pointerId:5,pointerType,isPrimary:true,button:0,clientX:rect.left+stage.clientWidth*x/100,clientY:rect.top+stage.clientHeight*y/100};
      object.dispatchEvent(new win.PointerEvent('pointerdown',init));stage.dispatchEvent(new win.PointerEvent('pointermove',{...init,clientX:init.clientX+dx,clientY:init.clientY+dy}));stage.dispatchEvent(new win.PointerEvent('pointerup',init));
      assert(Math.abs((parseFloat(object.style.left)-x)*stage.clientWidth/100-dx)<.1,'Horizontal movement must match pointer distance');
      assert(Math.abs((parseFloat(object.style.top)-y)*stage.clientHeight/100-dy)<.1,'Vertical movement must match pointer distance');
      assert(doc.getElementById('compare-object-'+(key==='a'?'b':'a')).style.cssText===other,'Other card must stay in place');
    };
    input('scale',150);drag('b','mouse',37,-22);
    doc.getElementById('compare-select-a').click();input('rotation',-30);input('scale',80);input('opacity',40);drag('a','touch',-25,31);
    doc.getElementById('compare-select-b').click();assert(doc.getElementById('compare-rotation').value==='90');assert(doc.getElementById('compare-scale').value==='150');assert(doc.getElementById('compare-opacity').value==='60');
    doc.getElementById('compare-select-a').click();assert(doc.getElementById('compare-opacity').value==='40');
  });
  test('重疊時可選取下層、移到最上層、鍵盤微調及重設，取消拖曳不再移動',()=>{
    const win=frame.contentWindow,doc=frame.contentDocument,stage=doc.getElementById('comparison'),a=doc.getElementById('compare-object-a');
    doc.querySelector('[data-action="compare-front"]').click();assert(Number(a.style.zIndex)>Number(doc.getElementById('compare-object-b').style.zIndex));
    const x=parseFloat(a.style.left);a.dispatchEvent(new win.KeyboardEvent('keydown',{key:'ArrowRight',shiftKey:true,bubbles:true}));assert(Math.abs((parseFloat(a.style.left)-x)*stage.clientWidth/100-10)<.1);
    const init={bubbles:true,pointerId:7,pointerType:'touch',isPrimary:true,button:0,clientX:100,clientY:100};
    a.dispatchEvent(new win.PointerEvent('pointerdown',init));stage.dispatchEvent(new win.PointerEvent('pointercancel',init));const before=a.style.cssText;
    stage.dispatchEvent(new win.PointerEvent('pointermove',{...init,clientX:140}));assert(a.style.cssText===before);assert(!a.classList.contains('dragging'));
    doc.querySelector('[data-action="compare-reset"]').click();assert(!stage.classList.contains('overlay-mode'));assert(doc.getElementById('compare-rotation').value==='0');assert(doc.getElementById('compare-scale').value==='100');assert(doc.getElementById('compare-opacity').value==='100');
    const picker=doc.getElementById('compare-b');picker.value='p14';picker.dispatchEvent(new win.Event('change',{bubbles:true}));assert(doc.getElementById('compare-image-b').src===doc.getElementById('compare-image-a').src);
    assert(doc.getElementById('compare-select-b').getAttribute('aria-pressed')==='true');
  });
  await testAsync('比對畫布在 390px 及 320px 可拖曳，物品不會完全移出畫布',async()=>{
    const win=frame.contentWindow,doc=frame.contentDocument;
    for(const width of [390,320]){
      frame.style.width=width+'px';await new Promise(resolve=>setTimeout(resolve,100));
      const stage=doc.getElementById('comparison'),b=doc.getElementById('compare-object-b'),bounds=stage.getBoundingClientRect();
      assert(bounds.width>200);assert(doc.getElementById('modal-content').scrollWidth<=doc.getElementById('modal-content').clientWidth,'Comparison overflow at '+width);
      doc.querySelector('[data-layout="overlay"]').click();
      const rotation=doc.getElementById('compare-rotation');rotation.value='45';rotation.dispatchEvent(new win.Event('input',{bubbles:true}));
      const scale=doc.getElementById('compare-scale');scale.value='20';scale.dispatchEvent(new win.Event('input',{bubbles:true}));
      const init={bubbles:true,pointerId:9,pointerType:'touch',isPrimary:true,button:0,clientX:bounds.left+bounds.width/2,clientY:bounds.top+bounds.height/2};
      b.dispatchEvent(new win.PointerEvent('pointerdown',init));stage.dispatchEvent(new win.PointerEvent('pointermove',{...init,clientX:5000,clientY:5000}));stage.dispatchEvent(new win.PointerEvent('pointerup',init));
      const card=b.getBoundingClientRect();assert(card.left<bounds.right-20&&card.top<bounds.bottom-20,'Card must remain reachable');
      assert((card.left+card.right)/2<=bounds.right-20&&(card.top+card.bottom)/2<=bounds.bottom-20,'Rotated card center must stay inside the canvas');
      doc.querySelector('[data-action="compare-reset"]').click();
    }
    frame.style.width='1280px';doc.getElementById('modal-close').click();
  });
  await testAsync('提示只顯示該題圖片列且可重複查看',async()=>{const doc=frame.contentDocument;doc.querySelector('[data-action="hint"]').click();await new Promise(resolve=>setTimeout(resolve,100));assert(doc.getElementById('hint-canvas').width===1040);assert(!doc.querySelector('#modal img'));doc.querySelector('[data-action="hint-rotate"]').click();assert(doc.getElementById('hint-canvas').style.transform==='rotate(180deg)');assert(frame.contentWindow.GameTest.getState().hints.length===1);doc.getElementById('modal-close').click();});
  await testAsync('卡牌放大旋轉後完整置於可視範圍',async()=>{const doc=frame.contentDocument;doc.querySelector('.game-card').click();await new Promise(resolve=>setTimeout(resolve,100));doc.querySelector('[data-action="rotate"][data-angle="90"]').click();const stage=doc.getElementById('viewer-stage').getBoundingClientRect(),viewport=doc.getElementById('viewer').getBoundingClientRect();assert(stage.width<=viewport.width+1);assert(stage.height<=frame.contentWindow.innerHeight*.64);assert(doc.getElementById('viewer-image').style.transform.includes('90deg'));doc.getElementById('modal-close').click();});
  await testAsync('手機 390px 與 320px 畫面不水平溢出',async()=>{const doc=frame.contentDocument;for(const width of [390,320]){frame.style.width=width+'px';await new Promise(resolve=>setTimeout(resolve,100));assert(doc.documentElement.scrollWidth<=frame.contentWindow.innerWidth,'Overflow at '+width+': '+doc.documentElement.scrollWidth);doc.querySelector('[data-action="home"]').click();assert(doc.documentElement.scrollWidth<=frame.contentWindow.innerWidth,'Home overflow at '+width);doc.querySelector('[data-action="continue"]').click();}frame.style.width='1280px';});
  await testAsync('77 張來源圖像均可在瀏覽器成功載入',async()=>{
    const sources=new Set(Object.values(D.cards).flatMap(c=>[c.frontImage,c.backImage].filter(Boolean)));sources.add(D.hintsImage);assert(sources.size===77,'Expected 77 assets, got '+sources.size);
    await Promise.all([...sources].map(src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>img.naturalWidth>0?resolve():reject(new Error(src));img.onerror=()=>reject(new Error(src));img.src='../'+src.split('/').map(encodeURIComponent).join('/');})));
  });
  output.textContent=results.join('\n')+'\n\n'+(failed?'FAIL':'PASS')+`: ${results.length-failed}/${results.length}`;
  document.title=failed?'FAIL':'PASS';document.body.dataset.testResult=failed?'fail':'pass';
  frame.contentWindow.GameTest.setState(playing());
  const preview=new URLSearchParams(location.search).get('preview');
  if(preview){
    const isCompare=preview.startsWith('compare'),puzzle=/^(p28|p46|p53|p26)/.exec(preview)?.[1],previewState=puzzle?atPuzzle(puzzle,puzzle!=='p26'):isCompare?atPuzzle('p14'):playing();
    if(isCompare){previewState.inventory.push('note');previewState.visited.push('yellow-003');}
    if(puzzle&&puzzle!=='p26')previewState.inventory.push('electronic','prism','note');
    previewState.startedAt=Date.now()-738000;frame.contentWindow.GameTest.setState(previewState);document.querySelector('h1').style.display='none';output.style.display='none';document.body.style.margin='0';frame.style.width=preview.includes('mobile')?'390px':'1440px';frame.style.height=puzzle?(preview.includes('mobile')?'1000px':'1800px'):'1100px';
    if(isCompare)frame.contentDocument.querySelector('[data-action="compare"]').click();
    if(puzzle==='p46'){const select=frame.contentDocument.getElementById('answer-item');select.value='electronic';select.dispatchEvent(new frame.contentWindow.Event('change',{bubbles:true}));}
    if(puzzle&&preview.includes('mobile')){frame.contentWindow.scrollTo(0,frame.contentDocument.querySelector('.interaction').getBoundingClientRect().top+frame.contentWindow.scrollY-12);window.scrollTo(0,0);}
  }
})();
