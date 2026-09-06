const fs = require('fs');

const dataFile = 'data.js';
let dataContent = fs.readFileSync(dataFile, 'utf8');

// Parse raw data.js to get the array
const matchJson = dataContent.match(/const LESSON_DATA = (\[[\s\S]*\]);/);
const jsonStr = matchJson ? matchJson[1] : '[]';
let data = JSON.parse(jsonStr);

// Read vocab
const vocabMd = fs.readFileSync('MockTest2_BandA_生詞.md', 'utf8');
const vocabLines = vocabMd.split('\n');
let mt2Vocab = [];

for (let line of vocabLines) {
  if (line.trim() === '' || line.startsWith('#')) continue;
  const parts = line.split('\t');
  if (parts.length >= 4) {
    let hanzi = parts[1].trim();
    let pinyin = parts[2].trim();
    let meaning = parts[3].trim() + (parts[4] ? ' ' + parts[4].trim() : '');
    
    // Check if it already exists in data under lesson Mock2
    let existingIndex = data.findIndex(item => item.lesson === 'Mock2' && item.hanzi === hanzi);
    if (existingIndex === -1) {
       const id = `Mock2-${String(mt2Vocab.length + 1).padStart(2, '0')}`;
       data.push({
           id,
           hanzi,
           pinyin,
           hanViet: "", // No hanViet provided in this test list
           meaning,
           lesson: 'Mock2',
           characters: []
       });
       mt2Vocab.push(data[data.length-1]);
    } else {
       mt2Vocab.push(data[existingIndex]);
       data[existingIndex].characters = []; // clear old characters
    }
  }
}

// Read explain
const explainMd = fs.readFileSync('MockTest2_BandA_explain.md', 'utf8');

// Split explain by "### "
const blocks = explainMd.split('### ');
for (let i = 1; i < blocks.length; i++) {
  const block = blocks[i];
  const titleMatch = block.match(/^(.+?)(?:\s*\((.+?)\))?\n/);
  if (!titleMatch) continue;
  let word = titleMatch[1].trim().split(' ')[0]; // just get the word
  
  let targetItem = mt2Vocab.find(item => item.hanzi === word);
  if (!targetItem) {
      targetItem = mt2Vocab.find(item => item.hanzi.replace(/\s/g, '') === word.replace(/\s/g, ''));
  }
  
  if (targetItem) {
     if (titleMatch[2]) {
         const hanVietMatch = titleMatch[2].split(' - ')[0];
         if (hanVietMatch) targetItem.hanViet = hanVietMatch.trim();
     }
     
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
console.log("Updated data.js with new formatted explanations for Mock Test 2.");
