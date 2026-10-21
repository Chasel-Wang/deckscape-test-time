(function () {
  'use strict';
  const puzzles = {};
  const definitions = [
    [6, '你要按下哪一個按鈕？', ['red|紅色', 'purple|紫色', 'blue|藍色'], ['purple','紫','紫色'], '00-開場/008-題目1提示.jpg', '紫色由藍色和紅色混合而成。按下紫色按鈕即可點亮三種顏色。'],
    [12, '你打算如何行動？', null, ['x','×','*','乘號','乘法鍵','按x','按下x','按乘號','計算機的乘號','計算器的乘號'], '01-黃色帷幕/002-001通關.jpg', '13 號卡明確記載：按下計算器上的 X 號，黑板便滑開。'],
    [14, '哪個數字標記的映像有誤？', ['1|1','2|2','3|3','4|4','5|5','6|6','7|7','8|8','9|9','0|0'], ['6'], '使用者確認', '映像有誤的數字標記是 6。'],
    [15, '請選擇方塊座標。', null, ['C3','3C'], '使用者確認', '正確方塊的座標是 C3。'],
    [17, '輸入工具箱的三位數密碼。', null, ['237'], '使用者確認', '工具箱的密碼是 237。'],
    [19, '密碼中的 X 是哪個數字？', ['1|1','2|2','3|3','4|4','5|5','6|6','7|7','8|8','9|9','0|0'], ['7'], '使用者確認', 'X 代表 7。'],
    [20, '輸入五位數密碼。', null, ['14270'], '使用者確認', '五位數密碼是 14270。', ['circuit']],
    [23, '哪一把鑰匙能打開衣櫃？請選擇鑰匙圖片上的字母。', ['A|A','B|B','C|C','D|D','E|E','F|F','G|G'], ['A'], '使用者確認', '正確的鑰匙是 A。', ['keys']],
    [24, '破譯衣櫃中的單詞。', null, ['einstein','愛因斯坦','爱因斯坦'], '02-綠色帷幕/003-002通關.jpg', '25 號卡明確記載：說出 Einstein 後，衣櫃的活動底板打開。'],
    [26, '你要關閉哪一台顯示器？請輸入字母或城市名稱。', null, ['A','巴黎','Paris','Parris'], '使用者確認', '關閉 A，也就是巴黎（Paris）的顯示器。'],
    [27, '你要選哪一個體位？', ['1|1','2|2','3|3','4|4'], ['2'], '使用者確認', '正確體位是 2。'],
    [28, '放什麼物品？', null, ['prism','三稜鏡','三棱鏡'], '使用者確認', '放入三稜鏡。'],
    [30, '哪一把才是正確的鑰匙？請選擇圖片上的字母。', ['A|A','B|B','C|C','D|D','E|E','F|F','G|G','H|H','I|I'], ['G'], '使用者確認', '正確的鑰匙是 G。'],
    [31, '你要打開哪一把鎖？', ['1|第一把 · I','2|第二把 · II','3|第三把 · III'], ['3','第三把','III'], '使用者確認', '將鑰匙插入第三把鎖並轉動。'],
    [34, '請選擇方塊座標。', null, ['2D','D2'], '使用者確認', '正確方塊的座標是 D2。'],
    [36, '哪一粒膠囊是特殊的？請選擇圖片上的字母。', ['A|A','B|B','C|C','D|D','E|E','F|F','G|G','H|H','I|I','J|J','K|K','L|L','M|M','N|N','O|O','P|P','Q|Q','R|R','S|S','T|T'], ['H'], '使用者確認', '特殊的膠囊是 H。'],
    [38, '哪一個符號代表六？請選擇圖片上的字母。', ['A|A','B|B','C|C','D|D','E|E'], ['D'], '使用者確認', '代表六的符號是 D。'],
    [40, '要把膠囊放進哪個燒瓶？請選擇圖片上的字母。', ['A|A','B|B','C|C','D|D'], ['B'], '使用者確認', '把膠囊放進 B 燒瓶。', ['capsule']],
    [42, '缺少的芯片是哪一塊？', ['2|2','3|3','4|4','6|6','8|8','9|9'], ['2'], '使用者確認', '缺少的是 2 號芯片。'],
    [45, '你要拿出哪一本書？請選擇圖片上的字母。', ['A|A','B|B','C|C','D|D','E|E','F|F','G|G'], ['D'], '使用者確認', '選擇 D 書本。'],
    [46, '選擇要插入的物品，再選擇卡片方向。', null, ['electronic:180'], '使用者確認', '使用電子卡，並旋轉 180 度。', ['electronic']],
    [48, '請依序點選按鈕的字母，可重複選擇。', null, ['LHFHK'], '使用者確認', '正確順序是 L → H → F → H → K。', ['disc']],
    [49, '應朝哪個方向轉動轉盤？', ['clockwise|順時針','counterclockwise|逆時針'], ['counterclockwise','逆時針','逆'], '使用者確認', '朝逆時針方向轉動。'],
    [50, '請選擇符號的座標。', null, ['B2','2B'], '使用者確認', '正確座標是 B2。'],
    [52, '藍色電極應插在哪裡？請選擇圖片上的字母。', ['A|A','B|B','C|C','D|D','E|E','F|F','G|G','H|H','I|I','J|J','K|K','L|L','M|M','N|N'], ['A'], '使用者確認', '將藍色電極插入 A。', ['electrode']],
    [53, '', ['左側開關未打開|左側開關未打開','插頭沒插好|插頭沒插好','右下方電線接錯|右下方電線接錯','中央儀表旋鈕未調好|中央儀表旋鈕未調好'], ['插頭沒插好'], '使用者確認', '機器的插頭沒有插上。']
  ];
  definitions.forEach(([n, prompt, choices, answers, source, explanation, required = []]) => {
    const id = 'p' + n;
    puzzles[id] = { id, number: n, prompt, choices: choices?.map(s => { const [value,label] = s.split('|'); return { value,label }; }),
      answers: answers || null, source: source || null, explanation: explanation || null, required,
      verification: source === '使用者確認' ? 'user-confirmed' : answers ? 'source-confirmed' : 'physical-solution-required' };
  });
  puzzles.p15.answerFormat = 'coordinate';
  puzzles.p15.inputType = 'coordinate-select';
  puzzles.p15.coordinateOptions = { columns: ['A','B','C','D','E','F'], rows: ['1','2','3','4','5','6'] };
  puzzles.p34.answerFormat = 'coordinate';
  puzzles.p34.inputType = 'coordinate-select';
  puzzles.p34.coordinateOptions = { columns: ['A','B','C','D'], rows: ['1','2','3','4'] };
  puzzles.p50.answerFormat = 'coordinate';
  puzzles.p50.inputType = 'coordinate-select';
  puzzles.p50.coordinateOptions = { columns: ['A','B','C','D'], rows: ['1','2','3','4','5'] };
  puzzles.p48.answerFormat = 'sequence';
  puzzles.p48.inputType = 'sequence-buttons';
  puzzles.p48.letters = [...'ABCDEFGHIJKLMN'];
  puzzles.p28.inputType = 'inventory';
  puzzles.p46.inputType = 'item-orientation';
  puzzles.p17.answerRequires = ['card777'];
  puzzles.p20.answerRequires = ['circuit'];
  puzzles.p23.answerRequires = ['keys'];
  puzzles.p24.answerRequires = ['cipher'];
  puzzles.p26.answerRequires = ['flashlight','batteries'];
  puzzles.p34.answerRequires = ['note'];
  puzzles.p48.answerRequires = ['disc'];
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
      const canonical = ['coordinate','sequence'].includes(p.answerFormat) ? input => normalize(input).replace(/[\p{P}\p{S}]/gu, '') : normalize;
      return p.answers ? p.answers.some(a => canonical(a) === canonical(answer)) : null;
    }
  };
})();
