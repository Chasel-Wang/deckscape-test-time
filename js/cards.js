(function () {
  'use strict';
  const data = { cards: {}, decks: {}, items: {}, endings: {} };
  function card(id, number, title, image, type = 'story', extra = {}) {
    data.cards[id] = { id, number, title, frontImage: image, backImage: null, cardType: type,
      initialState: id === 'intro-3' ? 'available' : 'locked', unlockConditions: ['previous-card'], ...extra };
    return id;
  }
  const opening = '00-開場/';
  data.intro = [
    card('intro-3', 3, '崔姆博士的實驗室', opening + '001.jpg'),
    card('lab', 3, '實驗室', opening + '002-實驗室的圖.jpg', 'reference', { rotation: -90 }),
    card('intro-4', 4, '崔姆博士的歡迎', opening + '003-崔姆博士.jpg'),
    card('rules', 4, '遊戲簡介', opening + '004-遊戲簡介.jpg'),
    card('intro-5', 5, '博士繼續說', opening + '005-博士說明.jpg'),
    card('dark', 5, '漆黑的實驗室', opening + '006-困境1.jpg'),
    card('p6', 6, '打開電燈', opening + '007-題目1開燈.jpg', 'puzzle', { puzzleId: 'p6', backImage: opening + '008-題目1提示.jpg' }),
    card('light', 7, '燈亮了', opening + '009-燈亮了.jpg'),
    card('score', 7, '得分表', opening + '010-得分表.jpg', 'item', { itemId: 'score' }),
    card('ready', 10, '測試將開始！', opening + '011-遊戲正式開始.jpg'),
    card('curtain-y', 11, '黃色帷幕', opening + '013-黃色帷幕.jpg'),
    card('curtain-g', 22, '綠色帷幕', opening + '014-綠色帷幕.jpg'),
    card('curtain-r', 33, '紅色帷幕', opening + '015-紅色帷幕.jpg'),
    card('curtain-b', 44, '藍色帷幕', opening + '016-藍色帷幕.jpg')
  ];
  function deck(id, name, label, color, folder, rows) {
    data.decks[id] = { id, name, label, color, cards: rows.map(([num, title, file, type, extra]) =>
      card(type === 'puzzle' ? 'p' + num : id + '-' + file.split('-')[0], num, title, folder + '/' + file, type, { deck: id, ...(type === 'puzzle' ? { puzzleId: 'p' + num } : {}), ...extra })) };
  }
  deck('yellow', '黃色帷幕', '01', '#d8b85c', '01-黃色帷幕', [
    [12, '黑板', '001-按X-題目1.jpg', 'puzzle'],
    [13, '滑開的黑板', '002-001通關.jpg', 'story'],
    [13, '便條', '003-便條-物品1.jpg', 'item', { itemId: 'note' }],
    [14, '黑板後面', '004-映像錯誤-題目2.jpg', 'puzzle'],
    [15, '打開的操作面板', '005-箭頭方向-題目3_改.png', 'puzzle'],
    [16, '保險箱裡面', '006-005通關.jpg', 'story'],
    [16, '一串鑰匙', '007-一串鑰匙-物品2_改.png', 'item', { itemId: 'keys' }],
    [17, '工具箱', '008-工具箱密碼-題目4.jpg', 'puzzle'],
    [18, '奇怪的東西', '009-008通關.jpg', 'story'],
    [18, '藍色電極', '010-藍色電極-物品3.jpg', 'item', { itemId: 'electrode' }],
    [19, '工具箱裡面', '011-遙控器密碼-題目5.jpg', 'puzzle'],
    [20, '另一塊電路板', '012-電路板密碼-題目6.jpg', 'puzzle'],
    [21, '無事發生！', '013-012通關.jpg', 'story'],
    [21, '電池', '014-電池-物品4.jpg', 'item', { itemId: 'batteries' }]
  ]);
  deck('green', '綠色帷幕', '02', '#81a887', '02-綠色帷幕', [
    [23, '衣櫃', '001-找出鑰匙-題目1.jpg', 'puzzle'],
    [24, '衣櫃裡面', '002-破譯字母-題目2.jpg', 'puzzle'],
    [25, '活動底板', '003-002通關.jpg', 'story'],
    [25, '電子卡', '004-電子卡-物品5.jpg', 'item', { itemId: 'electronic' }],
    [26, '四台顯示器', '005-關閉顯示器-題目3_改.png', 'puzzle', { revealRequires: ['flashlight'] }],
    [27, '無法關閉的顯示器', '006-正確體位-題目4.jpg', 'puzzle'],
    [28, '照向牆的光線', '006-放什麼物品-題目5.jpg', 'puzzle'],
    [29, '身體掃描', '007-006通關.jpg', 'story'],
    [29, '光盤', '008-光盤-物品6.jpg', 'item', { itemId: 'disc' }],
    [30, '行李箱的鑰匙', '009-找出鑰匙-題目6_改.png', 'puzzle'],
    [31, '三把鎖', '010-三選一-題目7_改.png', 'puzzle'],
    [32, '行李箱裡面', '011-010通關.jpg', 'story'],
    [32, '頭盔', '012-頭盔-物品7.jpg', 'item', { itemId: 'helmet' }]
  ]);
  deck('red', '紅色帷幕', '03', '#c67968', '03-紅色帷幕', [
    [34, '抽屜', '001-正確方塊-題目1_改.png', 'puzzle'],
    [35, '抽屜裡面', '002-001通關.jpg', 'story'],
    [35, '密碼條', '003-密碼條-物品8.jpg', 'item', { itemId: 'cipher' }],
    [36, '許多膠囊', '004-找出膠囊-題目2_改.png', 'puzzle'],
    [37, '特殊膠囊', '005-004通關.jpg', 'story'],
    [37, '膠囊', '006-膠囊-物品9.jpg', 'item', { itemId: 'capsule' }],
    [38, '寶箱', '007-按下六-題目3_改.png', 'puzzle'],
    [39, '寶箱裡面', '008-007通關.jpg', 'story'],
    [39, '卡片 777', '009-卡片777-物品10.jpg', 'item', { itemId: 'card777' }],
    [40, '四個燒瓶', '010-丟進燒瓶-題目4_改.png', 'puzzle'],
    [41, '化學反應', '011-010通關.jpg', 'story'],
    [41, '三稜鏡', '012-三棱鏡-物品11.jpg', 'item', { itemId: 'prism' }],
    [42, '損壞的電路板', '013-電路密碼-題目5.jpg', 'puzzle'],
    [43, '完好的電路板', '014-013通關.jpg', 'story'],
    [43, '電路板', '015-電路板-物品12.jpg', 'item', { itemId: 'circuit' }]
  ]);
  deck('blue', '藍色帷幕', '04', '#719da9', '04-藍色帷幕', [
    [45, '博士的書架', '001-找出書-題目1_改.png', 'puzzle'],
    [46, '秘密控制閘', '002-001通關.jpg', 'puzzle'],
    [47, '無法使用的手電筒', '003-不能用的手電筒.jpg', 'story', { grants: 'flashlight' }],
    [48, '機械門', '005-機械門順序-題目2_改.png', 'puzzle'],
    [49, '鎖上的門', '006-逆時針的鐘錶-題目3.jpg', 'puzzle'],
    [50, '尋找座標', '007-尋找座標-題目4_改.png', 'puzzle'],
    [51, '不可思議的冒險！', '008-007通關.jpg', 'story'],
    [51, '回到三十年前', '009-情境1.jpg', 'story'],
    [52, '另一扇機械門', '010-電極位置-題目5_改.png', 'puzzle'],
    [53, '出發！', '011-機器不動-題目6.jpg', 'puzzle'],
    [54, '留下點什麼！', '012-011通關.jpg', 'story'],
    [54, '最後的選擇', '013-結局選擇.jpg', 'choice']
  ]);
  card('flashlight-lit', 47, '手電筒', '04-藍色帷幕/004-手電筒-物品13.jpg', 'item', { itemId: 'flashlight', unlockConditions: ['flashlight', 'batteries'] });
  Object.values(data.cards).forEach(c => { if (c.itemId) data.items[c.itemId] = { id: c.itemId, name: c.title, cardId: c.id }; });
  data.items.flashlight = { id: 'flashlight', name: '手電筒', cardId: 'flashlight-lit', unlitCardId: 'blue-003' };
  data.endingCover = card('ending-cover', 55, '回到未來', '05-結局/001-結局封面.jpg', 'ending');
  const endings = [
    ['A', '002-結局A-電池-密碼條-便條-得分表-一串鑰匙-手電筒.jpg', 2, ['batteries', 'cipher', 'note', 'score', 'keys', 'flashlight']],
    ['B', '003-結局B-膠囊.jpg', 0, ['capsule']],
    ['C', '004-結局C-卡片777-電子卡-電路板-光盤-頭盔-三棱鏡.jpg', 1, ['card777', 'electronic', 'circuit', 'disc', 'helmet', 'prism']],
    ['D', '005-結局D-藍色電極.jpg', 3, ['electrode']]
  ];
  endings.forEach(([id, file, discount, items]) => { data.endings[id] = { id, discount, items, cardId: card('ending-' + id, null, '結局 ' + id, '05-結局/' + file, 'ending') }; });
  data.finalCard = card('game-over', 60, '遊戲結束', '05-結局/006-遊戲結束.jpg', 'ending');
  data.hintsImage = opening + '012-關卡提示.jpg';
  // The supplied scan contains the backs of hint cards 8 and 9, side by side.
  data.hintCards = [
    { id: 'hint-8', number: 8, title: '8 號提示卡 · 背面', frontImage: data.hintsImage, crop: [0, 0, 0.5, 1] },
    { id: 'hint-9', number: 9, title: '9 號提示卡 · 背面', frontImage: data.hintsImage, crop: [0.5, 0, 0.5, 1] }
  ];
  data.hintColumns = [[17,48,27,53,38,14,31,46,24,42,50,20,28], [12,23,34,45,19,30,55,40,26,49,36,52,15]];
  data.rulesText = [
    '閱讀開場，依卡牌指示前進。藍色帷幕（44 號）完成設置後才開始計時。',
    '四組牌堆可以交替探索，每組只可查看目前頂端的卡牌。取得的物品可以多次使用。',
    '每題只有一次作答機會。送出前先討論；答錯記錄 X，仍依卡牌指示繼續。有物品解鎖條件的題目，須先取得關鍵物品才能作答或公開。其他明確要求物品的題目，缺件作答記錄 2 個 X。',
    '可在物品欄隨時查看已取得的卡牌。',
    '8、9 號卡背是提示卡，從開場起就放在提示區，可隨時查看。也可以查看單題提示，會記錄使用次數，但不會增加扣分。',
    '遊戲期間持續計時，回到首頁或關閉瀏覽器也不暫停。最後每個 X 增加 5 分鐘，再依結局抵銷 X。'
  ];
  window.DeckData = data;
})();
