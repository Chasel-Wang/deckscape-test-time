(function () {
  'use strict';
  const D = window.DeckData, P = window.PuzzleData;
  const SAVE_KEY = 'deckscape-test-time-v1';
  const deckIds = Object.keys(D.decks);
  const clone = object => JSON.parse(JSON.stringify(object));
  function fresh(now = Date.now()) {
    return { version: 1, createdAt: now, startedAt: null, finishedAt: null, phase: 'intro', introIndex: 0,
      deckPositions: Object.fromEntries(deckIds.map(id => [id, 0])), activeDeck: 'yellow', visited: ['intro-3'],
      inventory: [], answers: {}, hints: [], notes: '', ending: null, leftItem: null };
  }
  function current(state, deck = state.activeDeck) {
    if (state.phase === 'intro') return D.cards[D.intro[state.introIndex]];
    if (state.phase === 'ending') return D.cards[D.endings[state.ending].cardId];
    return D.cards[D.decks[deck].cards[state.deckPositions[deck]]] || null;
  }
  function visit(state, id) { if (id && !state.visited.includes(id)) state.visited.push(id); }
  function revealBlockers(state, id) {
    const required=id==='flashlight-lit'?['flashlight','batteries']:D.cards[id]?.revealRequires||[];
    return required.filter(item=>!state.inventory.includes(item));
  }
  function canReveal(state, id) { return !!D.cards[id] && revealBlockers(state,id).length===0; }
  function answerBlockers(state, id=current(state)?.id) {
    return [...new Set([...revealBlockers(state,id),...(P.puzzles[id]?.answerRequires||[])])].filter(item=>!state.inventory.includes(item));
  }
  function enter(state) {
    const c = current(state);
    if (c && canReveal(state,c.id)) { visit(state, c.id); if (c.grants && !state.inventory.includes(c.grants)) state.inventory.push(c.grants); }
  }
  function selectDeck(state, id) {
    if (state.phase !== 'playing' || !deckIds.includes(id)) throw new Error('目前無法切換牌堆。');
    state.activeDeck = id;
    enter(state);
  }
  function advance(state, now = Date.now()) {
    if (state.phase === 'ending') throw new Error('遊戲已結束。');
    const c = current(state);
    if (!c) throw new Error('這組牌堆已探索完畢。');
    if (!canReveal(state,c.id)) throw new Error('請先取得關鍵物品，再公開這張卡牌。');
    if (c.cardType === 'puzzle' && (!state.answers[c.id] || state.answers[c.id].status === 'pending')) throw new Error('請先完成作答與核對。');
    if (c.cardType === 'choice') throw new Error('請先選擇要留下的物品。');
    if (c.itemId && !state.inventory.includes(c.itemId)) state.inventory.push(c.itemId);
    if (state.phase === 'intro') {
      if (state.introIndex === D.intro.length - 1) {
        state.phase = 'playing'; state.startedAt = now;
        deckIds.forEach(id => visit(state, D.decks[id].cards[0]));
      } else state.introIndex++;
    } else state.deckPositions[state.activeDeck]++;
    enter(state);
  }
  function submit(state, answer, now = Date.now()) {
    const c = current(state);
    if (!c || c.cardType !== 'puzzle' || state.answers[c.id]) throw new Error('這題無法再次作答。');
    const blockers=answerBlockers(state,c.id);
    if(blockers.length)throw new Error(`請先取得${blockers.map(id=>D.items[id].name).join('、')}，才能作答。`);
    if (!String(answer).trim()) throw new Error('請先填寫你的答案。');
    const p = P.puzzles[c.id], missing = p.required.filter(id => !state.inventory.includes(id));
    if(p.inputType==='inventory'&&!state.inventory.includes(String(answer).trim()))throw new Error('只能選擇當下已取得的物品。');
    if(p.inputType==='item-orientation'){
      const selection=/^([a-z0-9-]+):(0|90|180|270)$/.exec(String(answer).trim());
      if(!selection||!state.inventory.includes(selection[1]))throw new Error('請從已取得的物品選擇卡片和方向。');
    }
    const correct = P.check(c.id, answer);
    state.answers[c.id] = { answer: String(answer).trim().slice(0, 1200), at: now, correct,
      status: correct === null ? 'pending' : 'verified', mode: correct === null ? 'manual' : 'automatic', missing,
      penalty: missing.length ? 2 : correct === false ? 1 : 0 };
    return state.answers[c.id];
  }
  function adjudicate(state, verdict, missingItem = false) {
    const c = current(state), record = c && state.answers[c.id];
    if (!record || record.status !== 'pending' || !['correct','incorrect','unverified'].includes(verdict)) throw new Error('目前沒有待核對的作答。');
    record.correct = verdict === 'unverified' ? null : verdict === 'correct';
    record.status = verdict === 'unverified' ? 'unverified' : 'verified';
    record.declaredMissing = !!missingItem;
    record.penalty = record.missing.length || missingItem ? 2 : verdict === 'incorrect' ? 1 : 0;
  }
  function hint(state) {
    const c = current(state);
    const number = c?.cardType === 'choice' ? 55 : c?.number;
    if(c&&!canReveal(state,c.id))throw new Error('這張卡尚未公開。');
    if (!c || !['puzzle','choice'].includes(c.cardType) || !D.hintColumns.some(col => col.includes(number))) throw new Error('這張卡沒有提供原版提示。');
    const id = c.cardType === 'choice' ? 'ending-choice' : c.id;
    if (!state.hints.includes(id)) state.hints.push(id);
  }
  function itemCard(state, id) {
    if (!state.inventory.includes(id)) throw new Error('尚未取得這個物品。');
    const item = D.items[id];
    return D.cards[id === 'flashlight' && !state.inventory.includes('batteries') ? item.unlitCardId : item.cardId];
  }
  function canView(state, id) {
    if(!canReveal(state,id))return false;
    if (id === 'flashlight-lit') return state.inventory.includes('flashlight') && state.inventory.includes('batteries');
    if (id.startsWith('ending-') && id !== 'ending-cover') return state.phase === 'ending' && id === D.endings[state.ending].cardId;
    if (id === 'ending-cover' || id === 'game-over') return state.phase === 'ending';
    return state.visited.includes(id);
  }
  function finish(state, itemId, now = Date.now()) {
    if (state.phase !== 'playing' || current(state)?.cardType !== 'choice') throw new Error('還沒到最後的選擇。');
    if (!state.inventory.includes(itemId)) throw new Error('只能選擇已取得的物品。');
    const ending = Object.values(D.endings).find(e => e.items.includes(itemId));
    if (!ending) throw new Error('物品沒有對應的結局。');
    state.leftItem = itemId; state.ending = ending.id; state.finishedAt = now; state.phase = 'ending';
    visit(state, ending.cardId); visit(state, D.endingCover); visit(state, D.finalCard);
  }
  function stats(state, now = Date.now()) {
    const records = Object.values(state.answers);
    const errors = records.reduce((sum, record) => sum + record.penalty, 0);
    const discount = state.ending ? D.endings[state.ending].discount : 0;
    const remaining = Math.max(0, errors - discount);
    const elapsed = state.startedAt === null ? 0 : Math.max(0, (state.finishedAt ?? now) - state.startedAt);
    const total = elapsed + remaining * 300000;
    const minutes = Math.floor(total / 60000);
    return { errors, discount, remaining, elapsed, total, minutes, hints: state.hints.length,
      unresolved: records.filter(r => r.status !== 'verified').length,
      answered: records.filter(r => r.status !== 'pending').length,
      rating: minutes <= 60 ? '真正的天才！幹得好！' : minutes <= 90 ? '任務完成！' : '亡羊補牢，猶未晚也！' };
  }
  function valid(value) {
    if (!value || value.version !== 1 || !['intro','playing','ending'].includes(value.phase)) return false;
    if (!Number.isInteger(value.introIndex) || value.introIndex < 0 || value.introIndex >= D.intro.length || !deckIds.includes(value.activeDeck)) return false;
    if (!value.deckPositions || !deckIds.every(id => Number.isInteger(value.deckPositions[id]) && value.deckPositions[id] >= 0 && value.deckPositions[id] <= D.decks[id].cards.length)) return false;
    if (!Array.isArray(value.visited) || !value.visited.every(id => D.cards[id]) || !Array.isArray(value.inventory) || !value.inventory.every(id => D.items[id])) return false;
    if (!Array.isArray(value.hints) || !value.hints.every(id => P.puzzles[id] || id === 'ending-choice') || typeof value.notes !== 'string' || value.notes.length > 10000) return false;
    if (!Number.isFinite(value.createdAt) || !(value.startedAt === null || Number.isFinite(value.startedAt)) || !(value.finishedAt === null || Number.isFinite(value.finishedAt))) return false;
    if (value.phase !== 'intro' && value.startedAt === null) return false;
    if (value.phase === 'ending' && (!D.endings[value.ending] || !D.endings[value.ending].items.includes(value.leftItem) || value.finishedAt === null)) return false;
    if (!value.answers || typeof value.answers !== 'object' || Array.isArray(value.answers)) return false;
    return Object.entries(value.answers).every(([id,r]) => P.puzzles[id] && r && typeof r.answer === 'string' && r.answer.length <= 1200 &&
      ['pending','verified','unverified'].includes(r.status) && [true,false,null].includes(r.correct) && [0,1,2].includes(r.penalty) &&
      Array.isArray(r.missing) && r.missing.every(item => D.items[item]));
  }
  function save(state, storage = localStorage) { storage.setItem(SAVE_KEY, JSON.stringify(state)); }
  function load(storage = localStorage) {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return null;
    let parsed; try { parsed = JSON.parse(raw); } catch { throw new Error('存檔內容損壞。原始存檔仍保留，開始新遊戲將覆寫它。'); }
    if (!valid(parsed)) throw new Error('存檔格式不相容或不完整。開始新遊戲將覆寫它。');
    // New answers resolve pending records; relaxed coordinate formatting also repairs old automatic format errors.
    Object.entries(parsed.answers).forEach(([id, record]) => {
      const puzzle=P.puzzles[id];if(!puzzle.answers)return;
      const correct=P.check(id, record.answer);
      if(record.status==='verified'&&!(puzzle.answerFormat==='coordinate'&&record.mode==='automatic'&&record.correct===false&&correct===true))return;
      record.correct = correct;
      record.status = 'verified';
      record.mode = 'automatic';
      record.penalty = record.missing.length || record.declaredMissing ? 2 : record.correct ? 0 : 1;
    });
    return parsed;
  }
  window.GameEngine = { SAVE_KEY, fresh, current, revealBlockers, canReveal, answerBlockers, selectDeck, advance, submit, adjudicate, hint, itemCard, canView, finish, stats, valid, save, load, clone };
})();
