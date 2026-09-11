const fs = require('fs');
const path = 'js/data.js';
const data = fs.readFileSync(path, 'utf8');

const updates = {
  "卡": {
    "structure": "Chữ hội ý: Phía trên là Thượng (上 - đi lên). Phía dưới là Hạ (下 - đi xuống).",
    "story": "Chữ này được ghép từ chữ Thượng (上) và chữ Hạ (下). Khi đi lên không được, đi xuống cũng không xong, biểu thị trạng thái bị mắc kẹt ở giữa. Về sau, chữ này thường được mượn âm để phiên dịch các từ ngoại lai như 'card' (tấm thẻ), 'calorie' (calo).",
    "mnemonic": "Lên (上) và xuống (下) đều bị mắc kẹt lại = Ca (卡) — mắc kẹt, thẻ."
  },
  "市": {
    "structure": "Chữ tượng hình hội ý: Kim văn vẽ hình một khu vực được khoanh vùng ranh giới, có lối đi.",
    "story": "Chữ Thị ban đầu mô tả một khu vực rộng lớn được chính quyền hoặc người dân khoanh vùng để mọi người mang đồ vật đến tụ tập buôn bán trao đổi hàng hóa. Nghĩa gốc là cái chợ, nơi giao thương buôn bán, sau mở rộng thành đô thị, thành phố.",
    "mnemonic": "Khu vực rộng lớn tụ tập buôn bán = Thị (市) — chợ búa, thành phố."
  },
  "一": {
    "structure": "Chữ chỉ sự: Một nét ngang duy nhất.",
    "story": "Biểu thị số một, sự khởi đầu, duy nhất. Trong các cụm từ (như 嚇一跳), nó diễn tả hành động xảy ra chớp nhoáng, đột ngột, dứt khoát.",
    "mnemonic": "Một nét ngang dứt khoát = số Một (一)."
  },
  "丟": {
    "structure": "Chữ hội ý: Phía trên là nét Nhất (一), phía dưới là chữ Khứ (去 - rời đi).",
    "story": "Một đồ vật (一) đã bị rời đi (去), biến mất khỏi tầm tay chủ nhân, nghĩa là bị đánh mất, ném bỏ, vứt đi.",
    "mnemonic": "Một (一) món đồ đã đi mất (去) không tìm thấy = Đâu (丟) — đánh mất, vứt bỏ."
  },
  "服": {
    "structure": "Chữ hội ý kiêm hình thanh: Bên trái là bộ Chu (舟 - chiếc thuyền, viết giống bộ Nguyệt 月). Bên phải là chữ Phục (⺋ - bàn tay đang túm gáy một người quỳ phục).",
    "story": "Nghĩa gốc của 服 là bắt phục tùng, hàng phục. Khi bị khuất phục, người đó phải tuân theo mệnh lệnh và phục vụ người khác. Mở rộng ra nghĩa phục vụ, vâng lời, và cả quần áo mặc trên người (vì áo quần phục tùng cơ thể).",
    "mnemonic": "Túm gáy bắt người ta phải cúi đầu (⺋) phục vụ mình = Phục (服) — phục vụ, y phục."
  },
  "短": {
    "structure": "Chữ hội ý kiêm hình thanh: Bên trái là bộ Thỉ (矢 - mũi tên). Bên phải là chữ Đậu (豆 - bát gỗ đựng thức ăn tế lễ) đóng vai trò biểu âm.",
    "story": "Thời cổ đại, mũi tên (矢) thường được dùng làm thước đo chiều dài tiêu chuẩn. Vật nào có chiều dài ngắn hơn một mũi tên tiêu chuẩn thì gọi là 'Đoản'. Nghĩa gốc là ngắn ngủi.",
    "mnemonic": "Mũi tên (矢) đo chiều dài ngắn bằng cái bát tế lễ (豆) = Đoản (短) — ngắn."
  },
  "打": {
    "structure": "Chữ hình thanh: Bên trái là bộ Thủ (扌- bàn tay). Bên phải là chữ Đinh (丁) đóng vai trò biểu âm.",
    "story": "Bộ Thủ (扌) chỉ những hành động liên quan đến bàn tay. Nghĩa gốc của chữ 打 là đánh, đập, hoặc dùng tay để thao tác một công cụ nào đó.",
    "mnemonic": "Tay (扌) dùng sức đập vào chiếc đinh (丁) = Đả (打) — đánh, thực hiện thao tác."
  },
  "完": {
    "structure": "Chữ hình thanh kiêm hội ý: Phía trên là bộ Miên (宀 - mái nhà). Phía dưới là chữ Nguyên (元 - gốc rễ, cội nguồn) đóng vai trò biểu âm.",
    "story": "Ngôi nhà (宀) đã được thi công xây dựng đầy đủ, xong xuôi từ gốc (元). Nghĩa gốc là hoàn thiện, trọn vẹn, kết thúc công việc.",
    "mnemonic": "Xây nhà (宀) hoàn tất từ tận gốc rễ (元) = Hoàn (完) — xong xuôi."
  },
  "物": {
    "structure": "Chữ hình thanh kiêm hội ý: Bên trái là bộ Ngưu (牛 - con trâu). Bên phải là chữ Vật (勿 - lá cờ đuôi nheo) đóng vai trò biểu âm.",
    "story": "Bên trái là Trâu (牛), đại diện cho động vật nói chung. Bên phải là Vật (勿) chỉ cờ nhiều màu, ngụ ý các loài vật có màu lông phong phú khác nhau. Nghĩa là vạn vật, muôn loài, đồ vật.",
    "mnemonic": "Trâu bò (牛) là một trong vạn vật muôn loài trên đời = Vật (物)."
  },
  "單": {
    "structure": "Chữ tượng hình: Hình vẽ một loại vũ khí đi săn thời cổ có hình dạng chĩa đôi.",
    "story": "Trong giáp cốt văn, chữ 單 mô tả hình ảnh chiếc nạng gỗ dùng trong săn bắn chim chóc, thú rừng. Vũ khí này thường chỉ trang bị cho một người hoạt động độc lập. Về sau mượn nghĩa thành đơn lẻ, tờ giấy lẻ (tờ đơn).",
    "mnemonic": "Vũ khí nạng gỗ của người thợ săn độc lập = Đơn (單) — đơn độc, tờ đơn."
  },
  "型": {
    "structure": "Chữ hình thanh kiêm hội ý: Phía trên là chữ Hình (刑 - hình dáng, khuôn khổ) biểu âm. Phía dưới là bộ Thổ (土 - đất sét).",
    "story": "Khuôn đúc bằng đất sét (土) dùng để tạo ra hình dáng (刑) chuẩn mực cho đồ vật (như đúc tiền, đúc chuông). Nghĩa là khuôn mẫu, kiểu mẫu, mô hình.",
    "mnemonic": "Lấy đất sét (土) đúc ra hình dạng (刑) chuẩn mực = Hình (型) — khuôn mẫu, kiểu dáng."
  },
  "並": {
    "structure": "Chữ hội ý: Vẽ hình hai người cùng đứng sóng vai bên nhau (从 kết hợp với 一).",
    "story": "Hai người kề vai đứng sát bên nhau ngang hàng. Nghĩa là cùng lúc, sóng vai, ngang hàng. Thường dùng làm liên từ (và, cùng) hoặc phó từ nhấn mạnh (hoàn toàn không).",
    "mnemonic": "Hai người kề vai đứng ngang hàng = Tịnh (並) — đồng thời, cùng."
  },
  "折": {
    "structure": "Chữ hội ý: Bên trái là bộ Thủ (扌- bàn tay). Bên phải là chữ Cân (斤 - cái rìu búa).",
    "story": "Bàn tay (扌) cầm búa (斤) chặt đứt, bẻ gãy một vật. Trong thương mại, bẻ gãy bớt một phần giá gốc niêm yết thì gọi là bẻ giá, tức là chiết khấu, giảm giá.",
    "mnemonic": "Tay (扌) cầm búa rìu (斤) chặt gãy bớt một phần giá = Chiết (折) — bẻ gãy, giảm giá."
  },
  "吃": {
    "structure": "Chữ hình thanh kiêm hội ý: Bên trái là bộ Khẩu (口 - cái miệng). Bên phải là chữ Khất (乞 - xin ăn, cầu xin) đóng vai trò biểu âm.",
    "story": "Dùng miệng (口) để nhai nuốt thức ăn. Chữ này phổ biến được dùng như chữ 喫 (cắn, ăn), diễn tả hành động đưa thức ăn vào mồm tiêu thụ.",
    "mnemonic": "Cái miệng (口) xin xỏ (乞) đồ để ăn = Cật (吃) — ăn uống."
  },
  "法": {
    "structure": "Chữ hội ý: Chữ cổ gồm bộ Thủy (氵- nước), chữ Khứ (去) và chữ Trĩ (廌 - thần thú biết phân biệt đúng sai).",
    "story": "Pháp luật phải công bằng, phẳng lặng như mặt nước (氵), nhằm trừng phạt và loại bỏ điều sai trái ác độc (去). Về sau chữ được giản lược bỏ thần thú Trĩ. Nghĩa là pháp luật, phương pháp, phép tắc.",
    "mnemonic": "Phép tắc phải công bằng như nước (氵) để loại bỏ (去) cái xấu = Pháp (法)."
  },
  "店": {
    "structure": "Chữ hình thanh kiêm hội ý: Phía trên là bộ Nghiễm (广 - mái hiên). Phía dưới là chữ Chiếm (占 - bói toán, chiếm giữ) biểu âm.",
    "story": "Người xưa dựng một mái che, hiên nhà (广) rồi chiếm giữ một vị trí cố định (占) để bày hàng hóa mua bán thường xuyên. Nghĩa là cửa tiệm, cửa hàng.",
    "mnemonic": "Cất mái hiên (广) chiếm chỗ (占) buôn bán = Điếm (店) — cửa hàng."
  }
};

let match = data.match(/const LESSON_DATA = (\[[\s\S]*\]);?/);
if (!match) {
  console.log('Cannot find LESSON_DATA');
  process.exit(1);
}

let arr = eval(match[1]);
let updatedCount = 0;

arr.forEach(item => {
  if (item.lesson === '3_2' || item.lesson === 'l3_2' || item.id.includes('b3_2')) {
    item.characters.forEach(c => {
      if (updates[c.char]) {
        c.structure = updates[c.char].structure;
        c.story = updates[c.char].story;
        c.mnemonic = updates[c.char].mnemonic;
        updatedCount++;
      }
    });
  }
});

const newArrStr = JSON.stringify(arr, null, 2);
const newData = data.replace(match[1], newArrStr);
fs.writeFileSync(path, newData, 'utf8');

console.log('Updated ' + updatedCount + ' character explanations in lesson 3_2.');
