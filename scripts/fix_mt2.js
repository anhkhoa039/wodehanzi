const fs = require('fs');
const path = require('path');
const targetFile = path.join(__dirname, '..', 'data', 'mock-tests', 'MockTest2_BandA_explain.md');
let content = fs.readFileSync(targetFile, 'utf8');

const replacements = [
[`1. Chữ 毛 (Mao) - Cách viết / đọc: máo
Chữ 毛 nghĩa là lông, tóc. Tượng hình một sợi lông có nhiều nhánh tơ hoặc đuôi của thú vật.`, 
`1. Chữ 毛 (Mao) - Cách viết / đọc: máo
Chữ 毛 nghĩa là lông, tóc. 

📐 Cấu tạo chi tiết:
Tượng hình một sợi lông có nhiều nhánh tơ hoặc đuôi của thú vật.

📜 Câu chuyện hình tượng:
Hình ảnh gốc: Chữ 毛 phỏng theo hình dáng của những sợi lông tơ mềm mại đan chéo nhau, giống như lông trên cơ thể động vật hoặc tóc người.

Mẹo nhớ chữ 毛:
"Nhìn chữ 毛 uốn lượn như sợi lông thú mềm mại."`],

[`2. Chữ 衣 (Y) - Cách viết / đọc: yī
Chữ 衣 nghĩa là cái áo, quần áo. Tượng hình cái áo mở cổ, hai tay áo và vạt áo buông xuống.`,
`2. Chữ 衣 (Y) - Cách viết / đọc: yī
Chữ 衣 nghĩa là cái áo, quần áo. 

📐 Cấu tạo chi tiết:
Tượng hình cái áo mở cổ, hai tay áo và vạt áo buông xuống.

📜 Câu chuyện hình tượng:
Hình ảnh gốc: Chữ Y (衣) nguyên thủy vẽ hình một chiếc áo giao lĩnh (áo cổ chéo) của người Hán xưa, với cổ áo, tay áo và vạt áo rõ ràng.

Mẹo nhớ chữ 衣:
"Chữ 衣 trông y hệt một chiếc áo cổ chéo treo trên giá."`],

[`1. Chữ 牛 (Ngưu) - Cách viết / đọc: niú
Tượng hình cái đầu trâu/bò với hai cái sừng. Nghĩa là con bò.`,
`1. Chữ 牛 (Ngưu) - Cách viết / đọc: niú
Chữ 牛 nghĩa là con bò.

📐 Cấu tạo chi tiết:
Tượng hình cái đầu trâu/bò với hai cái sừng. 

📜 Câu chuyện hình tượng:
Hình ảnh gốc: Vẽ hình một cái đầu bò nhìn thẳng, với hai cái sừng vểnh lên và hai cái tai đưa ngang. 

Mẹo nhớ chữ 牛:
"Nhìn chữ 牛 giống hệt cái đầu con bò có hai sừng."`],

[`2. Chữ 仔 (Tử) - Cách viết / đọc: zǎi
Chữ 仔 gồm bộ Nhân (亻 - người) và chữ Tử (子 - đứa trẻ). Chỉ người trẻ tuổi. 牛仔 (Ngưu tử) = Cao bồi (Cowboy).`,
`2. Chữ 仔 (Tử) - Cách viết / đọc: zǎi
Chữ 仔 nghĩa là người trẻ, con non, chăm chỉ.

📐 Cấu tạo chi tiết:
Bên trái: Bộ Nhân (亻 - người).
Bên phải: Chữ Tử (子 - đứa trẻ).

📜 Câu chuyện hình tượng:
Hình ảnh gốc: Một người (亻) đang ôm một đứa trẻ (子) hoặc một người đang ở độ tuổi trẻ con (子). 牛仔 (Ngưu tử) chỉ những chàng trai trẻ cưỡi bò/ngựa (Cao bồi).

Mẹo nhớ chữ 仔:
"Người (亻) giống như một đứa trẻ (子) là chàng trai trẻ, cao bồi (仔)."`],

[`2. Chữ 公 (Công) - Cách viết / đọc: gōng
Chữ Công nghĩa là công cộng, việc chung, công bằng. Gồm Bát (八 - chia ra) và Tư (厶 - việc riêng). Chia đều lợi ích không giữ làm của riêng là Công bằng, việc Công.`,
`2. Chữ 公 (Công) - Cách viết / đọc: gōng
Chữ Công nghĩa là công cộng, việc chung, công bằng.

📐 Cấu tạo chi tiết:
Phần trên: Chữ Bát (八 - chia ra).
Phần dưới: Chữ Tư (厶 - việc riêng, lợi ích cá nhân).

📜 Câu chuyện hình tượng:
Hình ảnh gốc: Đem những lợi ích cá nhân (厶) chia đều (八) ra cho mọi người, không giữ làm của riêng. Đó là Công bằng, việc Công cộng.

Mẹo nhớ chữ 公:
"Chia đều (八) đồ riêng tư (厶) cho mọi người là việc Công (公)."`],

[`2. Chữ 事 (Sự) - Cách viết / đọc: shì
Chữ 事 nghĩa là sự việc, công việc. Hình ảnh bàn tay (móc ngang) đang cầm một cây cờ (hoặc dụng cụ) để làm việc.`,
`2. Chữ 事 (Sự) - Cách viết / đọc: shì
Chữ 事 nghĩa là sự việc, công việc. 

📐 Cấu tạo chi tiết:
Bao gồm bộ Cổn (丨), Khẩu (口) và Ký (彐 - bàn tay).

📜 Câu chuyện hình tượng:
Hình ảnh gốc: Tượng hình một bàn tay đang cầm một cây cờ (hoặc bút/dụng cụ) để làm việc hoặc ghi chép sự kiện.

Mẹo nhớ chữ 事:
"Tay cầm cờ đi làm Sự (事) việc."`],

[`1. Chữ 電 (Điện) - Cách viết / đọc: diàn
Bộ Vũ (雨 - mưa) bên trên + tia chớp đánh ngoằn ngoèo bên dưới. Điện = sấm sét, dòng điện.`,
`1. Chữ 電 (Điện) - Cách viết / đọc: diàn
Chữ 電 nghĩa là sấm sét, dòng điện.

📐 Cấu tạo chi tiết:
Phần trên: Bộ Vũ (雨 - mưa).
Phần dưới: Chữ Thân (申 - tia chớp).

📜 Câu chuyện hình tượng:
Hình ảnh gốc: Dưới đám mây đen đang đổ mưa (雨), một tia chớp ngoằn ngoèo đánh thẳng xuống (申). Đó chính là tia Sét, tia Điện.

Mẹo nhớ chữ 電:
"Mưa (雨) trút xuống kèm theo tia chớp (申) là có Điện (電)."`],

[`2. Chữ 子 (Tử) - Đuôi danh từ chỉ đồ vật.`,
`2. Chữ 子 (Tử) - Cách viết / đọc: zǐ
Chữ 子 nghĩa là đứa trẻ, hoặc làm đuôi danh từ.

📐 Cấu tạo chi tiết:
Tượng hình đứa bé chập chững (2 tay dang ra).

📜 Câu chuyện hình tượng:
Hình ảnh gốc: Đứa trẻ sơ sinh bị quấn tã, dang hai tay ra. Sau này được mượn làm đuôi danh từ.

Mẹo nhớ chữ 子:
"Đứa trẻ (子) dang tay."`],

[`2. Chữ 到 (Đáo) - Cách viết / đọc: dào
Chữ 到 nghĩa là đến nơi.

📐 Cấu tạo chi tiết:
Bên trái: Chữ Chí (至 - đi đến).
Bên phải: Bộ Đao (刂 - con dao). Bỏ dao xuống khi đã đến nơi an toàn.`,
`2. Chữ 到 (Đáo) - Cách viết / đọc: dào
Chữ 到 nghĩa là đến nơi.

📐 Cấu tạo chi tiết:
Bên trái: Chữ Chí (至 - đi đến).
Bên phải: Bộ Đao (刂 - con dao). 

📜 Câu chuyện hình tượng:
Hình ảnh gốc: Một người đi đến nơi an toàn (至) và bỏ vũ khí là con dao (刂) xuống để nghỉ ngơi. Nghĩa là Đáo (đến nơi).

Mẹo nhớ chữ 到:
"Đi đến (至) nơi thì bỏ dao (刂) xuống."`],

[`2. Chữ 天 (Thiên) - Bầu trời, ông trời.`,
`2. Chữ 天 (Thiên) - Cách viết / đọc: tiān
Chữ 天 nghĩa là bầu trời.

📐 Cấu tạo chi tiết:
Chữ Nhất (一 - số một, bầu trời) ở trên chữ Đại (大 - người).

📜 Câu chuyện hình tượng:
Hình ảnh gốc: Một con người (大) to lớn đứng dang tay, bên trên đầu là một bầu trời bao la rộng lớn (一).

Mẹo nhớ chữ 天:
"Trở thành người lớn (大) để đội một (一) Bầu trời (天)."`],

[`2. Chữ 衣 (Y) - Áo, quần áo.
3. Chữ 機 (Cơ) - Cách viết / đọc: jī
Chữ 機 nghĩa là cái máy, cơ giới, cơ hội. (Bên trái: Mộc 木 - gỗ, Bên phải: Cơ 幾 - nhỏ bé/nhiều). Máy móc thời xưa làm bằng gỗ có nhiều chi tiết nhỏ xíu.`,
`2. Chữ 衣 (Y) - Cách viết / đọc: yī
Chữ 衣 nghĩa là cái áo, quần áo. (Đã phân tích).

📐 Cấu tạo chi tiết:
Tượng hình cái áo cổ chéo.

📜 Câu chuyện hình tượng:
Hình ảnh chiếc áo mở cổ vạt xéo truyền thống.

Mẹo nhớ chữ 衣:
"Chữ Y (衣) hình cái áo."

3. Chữ 機 (Cơ) - Cách viết / đọc: jī
Chữ 機 nghĩa là cái máy, cơ giới, cơ hội. 

📐 Cấu tạo chi tiết:
Bên trái: Bộ Mộc (木 - gỗ).
Bên phải: Chữ Kỷ/Cơ (幾 - rất nhỏ / bao nhiêu).

📜 Câu chuyện hình tượng:
Hình ảnh gốc: Máy móc thời xưa như máy dệt hay nỏ được làm bằng gỗ (木) nhưng có cấu tạo bởi rất nhiều các chi tiết nhỏ xíu (幾) lắp ráp lại với nhau.

Mẹo nhớ chữ 機:
"Máy làm bằng gỗ (木) có nhiều chi tiết nhỏ (幾) gọi là Cơ (機) khí."`],

[`1. Chữ 學 (Học) - Đã học. Cấu tạo (Thằng bé 子 dưới mái nhà trùm khăn 冂 cầm 2 con dao 爻 tập võ bằng hai tay 𦥯).`,
`1. Chữ 學 (Học) - Cách viết / đọc: xué
Chữ 學 nghĩa là học tập.

📐 Cấu tạo chi tiết:
Bên trên: Bộ Cữu (𦥯 - hai bàn tay đang thao tác) và Hào (爻 - đan chéo).
Ở giữa: Bộ Mịch (冖 - mái nhà).
Bên dưới: Chữ Tử (子 - đứa trẻ).

📜 Câu chuyện hình tượng:
Hình ảnh gốc: Dưới mái nhà (冖), một đứa trẻ (子) đang dùng hai tay thao tác, học hỏi đan chéo (爻) những que tính. 

Mẹo nhớ chữ 學:
"Đứa trẻ (子) trong nhà (冖) dùng tay cầm thanh gỗ chéo (爻) để Học (學)."`]
];

for (const [oldStr, newStr] of replacements) {
    content = content.replace(oldStr, newStr);
}

fs.writeFileSync(targetFile, content);
console.log("Fixed missing structured explanations in MT2.");
