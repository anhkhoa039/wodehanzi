const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '..', 'js', 'data.js');
let dataContent = fs.readFileSync(dataFile, 'utf8');

// Parse raw data.js to get the array
const matchJson = dataContent.match(/const LESSON_DATA = (\[[\s\S]*\]);/);
const jsonStr = matchJson ? matchJson[1] : '[]';
let data = JSON.parse(jsonStr);

// Read vocab
const vocabMd = fs.readFileSync(path.join(__dirname, '..', 'data', 'lessons', 'book2', '第十五課-生詞.md'), 'utf8');
const vocabLines = vocabMd.split('\n');
let l15Vocab = [];

for (let line of vocabLines) {
  const match = line.match(/^\|\s*\*\*(.+?)\*\*\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*\*\*(.+?)\*\*(.+?)\s*\|/);
  if (match) {
    let hanzi = match[1].trim();
    let pinyin = match[2].trim();
    let hanViet = match[3].trim();
    let meaning = match[4].trim() + (match[5] ? match[5].trim() : '');
    
    // Check if it already exists in data, we will just update characters later
    let existingIndex = data.findIndex(item => item.lesson === 15 && item.hanzi === hanzi);
    if (existingIndex === -1) {
       // if not in data, we push a skeleton
       const id = `l15-${String(l15Vocab.length + 1).padStart(2, '0')}`;
       data.push({
           id,
           hanzi,
           pinyin,
           hanViet,
           meaning,
           lesson: 15,
           characters: []
       });
       l15Vocab.push(data[data.length-1]);
    } else {
       l15Vocab.push(data[existingIndex]);
       data[existingIndex].characters = []; // clear old characters
    }
  }
}

// Read explain
const explainMd = fs.readFileSync('第十五課-explain.md', 'utf8');

// Split explain by "### "
const blocks = explainMd.split('### ');
for (let i = 1; i < blocks.length; i++) { // skip first part (title)
  const block = blocks[i];
  // Title could be "春節 (Xuân Tiết - Tết Nguyên Đán)" or "春節"
  const titleMatch = block.match(/^(.+?)(?:\s*\((.+?)\))?\n/);
  if (!titleMatch) continue;
  let word = titleMatch[1].trim().split(' ')[0]; // just get the word
  
  let targetItem = l15Vocab.find(item => item.hanzi === word);
  if (!targetItem) {
      // In case word is "大吉大利" but without matching in exact vocab due to spaces
      targetItem = l15Vocab.find(item => item.hanzi.replace(/\s/g, '') === word.replace(/\s/g, ''));
  }
  
  if (targetItem) {
     // Now split by "1. Chữ ", "2. Chữ ", etc.
     const charBlocks = block.split(/\n\d+\.\s+Chữ\s+/);
     for (let j = 1; j < charBlocks.length; j++) {
        const charBlock = charBlocks[j];
        
        const firstLineMatch = charBlock.match(/^(.+?)\s*(?:\((.+?)\))?\s*-\s*Cách viết \/ đọc:\s*(.+?)\n/);
        if (!firstLineMatch) continue;
        const char = firstLineMatch[1].trim();
        const pinyin = firstLineMatch[3].trim();
        
        let structure = "";
        let story = "";
        let mnemonic = "";
        
        // Extract sections
        const structMatch = charBlock.match(/📐 Cấu tạo chi tiết[\s\S]*?:(.*?)(?=\n📜|$)/s);
        if (structMatch) structure = structMatch[1].trim();
        
        const storyMatch = charBlock.match(/📜 Câu chuyện hình tượng[\s\S]*?:(.*?)(?=\nMẹo nhớ|$)/s);
        if (storyMatch) story = storyMatch[1].trim();
        
        const mnemonicMatch = charBlock.match(/Mẹo nhớ chữ .*?:(.*?)(?=\n\d+\.|\n\n|$)/s);
        if (mnemonicMatch) mnemonic = mnemonicMatch[1].replace(/"/g, '').trim();
        
        targetItem.characters.push({
            char,
            pinyin,
            structure: structure.replace(/\n/g, ' '),
            story: story.replace(/\n/g, ' '),
            mnemonic: mnemonic.replace(/\n/g, ' ')
        });
     }
  }
}

// Output formatted data
const newContent = 'const LESSON_DATA = ' + JSON.stringify(data, null, 2) + ';';
fs.writeFileSync(dataFile, newContent);
console.log("Updated data.js with new formatted explanations for Lesson 15.");
