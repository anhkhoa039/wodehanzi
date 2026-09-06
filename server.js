/**
 * TOCFL X — Local Dev Server
 * Chạy: node server.js
 * Mở website tại: http://localhost:3000
 * Nhận POST /api/append-lesson → ghi thêm bài học mới vào data.js
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.js');

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));

// ── GET / → serve index.html ──────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── POST /api/append-lesson → thêm bài học mới vào data.js ────────
app.post('/api/append-lesson', (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items phải là mảng không rỗng' });
    }

    // Đọc data.js hiện tại
    let content = fs.readFileSync(DATA_FILE, 'utf8');

    // Kiểm tra ID trùng lặp
    const existingIds = [...content.matchAll(/id:\s*["']([^"']+)["']/g)].map(m => m[1]);
    const duplicates = items.filter(item => existingIds.includes(item.id));
    if (duplicates.length > 0) {
      return res.status(409).json({
        error: 'ID trùng lặp',
        duplicates: duplicates.map(d => d.id)
      });
    }

    // Lấy lesson number để thêm comment header
    const lessonNum = items[0].lesson;

    // Tạo code JS cho các items mới
    const newCode = items.map(item => JSON.stringify(item, null, 2)).join(',\n');

    // Thêm vào trước dấu ]; cuối file
    const insertMarker = '];';
    const insertPos = content.lastIndexOf(insertMarker);
    if (insertPos === -1) {
      return res.status(500).json({ error: 'Không tìm thấy marker ]; trong data.js' });
    }

    const lessonComment = `  // ====== 第${toChineseNum(lessonNum)}課 ======\n`;
    const insertContent = `,\n${lessonComment}${newCode.split('\n').map(l => '  ' + l).join('\n')}\n`;

    const newContent = content.slice(0, insertPos) + insertContent + insertMarker + content.slice(insertPos + insertMarker.length);

    fs.writeFileSync(DATA_FILE, newContent, 'utf8');

    res.json({
      success: true,
      message: `Đã thêm ${items.length} từ vựng bài ${lessonNum} vào data.js`,
      added: items.map(i => i.hanzi)
    });

  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/check-ids → kiểm tra IDs đã tồn tại ─────────────────
app.get('/api/check-ids', (req, res) => {
  try {
    const content = fs.readFileSync(DATA_FILE, 'utf8');
    const ids = [...content.matchAll(/id:\s*["']([^"']+)["']/g)].map(m => m[1]);
    const lessons = [...new Set(ids.map(id => id.split('-')[0].replace('l', '')))];
    res.json({ ids, lessons });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Helper: số → chữ Hán ─────────────────────────────────────────
function toChineseNum(n) {
  const map = { 1:'一',2:'二',3:'三',4:'四',5:'五',6:'六',7:'七',8:'八',9:'九',10:'十' };
  return map[n] || n;
}

app.listen(PORT, () => {
  console.log(`\n🀄  TOCFL X Server chạy tại: http://localhost:${PORT}`);
  console.log(`📂  Serving từ: ${__dirname}`);
  console.log(`✏️   Ghi vào: ${DATA_FILE}`);
  console.log(`\n💡  Mở trình duyệt và vào: http://localhost:${PORT}\n`);
});
