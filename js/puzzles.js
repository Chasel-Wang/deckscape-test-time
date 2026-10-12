(function () {
  'use strict';
  const puzzles = {};
  const definitions = [
    [6, '你要按下哪一個按鈕？', ['red|紅色', 'purple|紫色', 'blue|藍色'], ['purple','紫','紫色'], '00-開場/008-題目1提示.jpg', '紫色由藍色和紅色混合而成。按下紫色按鈕即可點亮三種顏色。'],
    [12, '你打算如何行動？', null, ['x','×','乘號','乘法鍵','按x','按下x','按乘號','計算機的乘號','計算器的乘號'], '01-黃色帷幕/002-001通關.jpg', '13 號卡明確記載：按下計算器上的 X 號，黑板便滑開。'],
    [14, '哪個數字標記的映像有誤？', null, ['6'], '使用者確認', '映像有誤的數字標記是 6。'],
    [15, '請輸入方塊座標（字母＋數字或數字＋字母）。', null, ['C3','3C'], '使用者確認', '正確方塊的座標是 C3，也可寫成 3C。'],
    [17, '輸入工具箱的三位數密碼。'],
    [19, '密碼中的 X 是哪個數字？'],
    [20, '輸入五位數密碼。', null, null, null, null, ['circuit']],
    [23, '哪一把鑰匙能打開衣櫃？請輸入鑰匙圖片上的字母。', null, ['A'], '使用者確認', '正確的鑰匙是 A。', ['keys']],
    [24, '破譯衣櫃中的單詞。', null, ['einstein','愛因斯坦','爱因斯坦'], '02-綠色帷幕/003-002通關.jpg', '25 號卡明確記載：說出 Einstein 後，衣櫃的活動底板打開。'],
    [26, '你要關閉哪一台顯示器？', ['Paris|巴黎 Paris','London|倫敦 London','Berlin|柏林 Berlin','Rome|羅馬 Rome'], null, null, null, ['flashlight', 'batteries']],
    [27, '你要選哪一個體位？', ['1|1','2|2','3|3','4|4']],
    [28, '如何同時啟動所有光線感應器？'],
    [30, '哪一把才是正確的鑰匙？請描述位置。'],
    [31, '你要打開哪一把鎖？', ['1|第一把 · I','2|第二把 · II','3|第三把 · III'], ['3','第三把','iii'], '02-綠色帷幕/011-010通關.jpg', '32 號卡明確記載：將鑰匙插入第三把鎖並轉動，三把鎖同時打開。'],
    [34, '請輸入方塊座標（數字＋字母或字母＋數字）。', null, ['2D','D2'], '使用者確認', '正確方塊的座標是 2D，也可寫成 D2。'],
    [36, '哪一粒膠囊是特殊的？請輸入圖片上的字母。', null, ['H'], '使用者確認', '特殊的膠囊是 H。'],
    [38, '哪一個符號代表六？請描述位置。'],
    [40, '要把膠囊放進哪個燒瓶？', ['1|從左數第一個','2|從左數第二個','3|從左數第三個','4|從左數第四個'], null, null, null, ['capsule']],
    [42, '缺少的芯片是哪一塊？', ['2|2','3|3','4|4','6|6','8|8','9|9']],
    [45, '你要拿出哪一本書？'],
    [46, '描述電子卡插入的方向。', null, null, null, null, ['electronic']],
    [48, '輸入按鈕的顏色順序。', null, null, null, null, ['disc']],
    [49, '應朝哪個方向轉動轉盤？', ['clockwise|順時針','counterclockwise|逆時針']],
    [50, '四個座標所指的是哪個符號？'],
    [52, '藍色電極應插在哪裡？請描述位置。', null, null, null, null, ['electrode']],
    [53, '機器為什麼沒有開始運行？']
  ];
  definitions.forEach(([n, prompt, choices, answers, source, explanation, required = []]) => {
    const id = 'p' + n;
    puzzles[id] = { id, number: n, prompt, choices: choices?.map(s => { const [value,label] = s.split('|'); return { value,label }; }),
      answers: answers || null, source: source || null, explanation: explanation || null, required,
      verification: source === '使用者確認' ? 'user-confirmed' : answers ? 'source-confirmed' : 'physical-solution-required' };
  });
  puzzles.p15.answerFormat = 'coordinate';
  puzzles.p34.answerFormat = 'coordinate';
  // The same action has several natural Chinese spellings. Do not punish a wording variant.
  ['計算機', '計算器'].forEach(device => {
    ['', '按', '按下', '按一下'].forEach(verb => {
      ['', '的', '上的'].forEach(link => {
        ['x', 'x鍵', 'x號', '×', '×鍵', '乘號', '乘法鍵', '乘號鍵', '乘法按鈕'].forEach(key => puzzles.p12.answers.push(verb + device + link + key));
      });
    });
  });
  const normalize = input => String(input).normalize('NFKC').trim().toLowerCase().replace(/[\s，。！？、.,!?「」『』]/g, '');
  window.PuzzleData = { puzzles, normalize,
    check(id, answer) {
      const p = puzzles[id];
      // Coordinate separators and decorations do not change the indicated letter and number.
      const canonical = p.answerFormat === 'coordinate' ? input => normalize(input).replace(/[\p{P}\p{S}]/gu, '') : normalize;
      return p.answers ? p.answers.some(a => canonical(a) === canonical(answer)) : null;
    }
  };
})();
