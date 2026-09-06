const fs = require('fs');
const path = require('path');

const dir = 'A1_Vocab';
const files = fs.readdirSync(dir).filter(f => f.startsWith('A1_') && f.endsWith('.md'));

// Explicit map for the tricky slashes to simplify both Word and Pinyin
// Format: "Original Word": ["Clean Word", "Clean Pinyin"]
const cleanupMap = {
    "城市/城": ["城市", "chéngshì"],
    "剛剛/剛": ["剛剛", "gānggāng"],
    "一會兒/一會": ["一會兒", "yīhuĭr"],
    "春天/春": ["春天", "chūntiān"],
    "夏天/夏": ["夏天", "xiàtiān"],
    "秋天/秋": ["秋天", "qiūtiān"],
    "冬天/冬": ["冬天", "dōngtiān"],
    "計畫/計劃": ["計畫", "jìhuà"],
    "華語/華文": ["華語", "huáyǔ"],
    "部分(˙ㄈㄣ)/部份(˙ㄈㄣ)": ["部分", "bùfen"],
    "部分/部份(˙ㄈㄣ)": ["部分", "bùfen"],
    "部分": ["部分", "bùfen"], // Already edited by user
    "洗手間/廁所": ["洗手間", "xĭshŏujiān"],
    "窗(子)/窗戶(˙ㄏㄨ)": ["窗戶", "chuānghu"],
    "盒/盒(子)": ["盒子", "hézi"],
    "有空/有空兒": ["有空", "yŏukòng"],
    "跑/跑步": ["跑步", "păobù"],
    "腳踏車/自行車": ["腳踏車", "jiăotàchē"],
    "照片/相片/相片兒": ["照片", "zhàopiàn"],
    "照相機/相機": ["照相機", "zhàoxiàngjī"],
    "頭髮/髮": ["頭髮", "tóufă"],
    "手指(頭)/指頭": ["手指頭", "shŏuzhĭtou"],
    "超級市場/超市": ["超市", "chāoshì"],
    "手錶/手表/錶/表": ["手錶", "shŏubiăo"],
    "其他/其它": ["其他", "qítā"],
    "聲音/聲": ["聲音", "shēngyīn"],
    "盤/盤(子)": ["盤子", "pánzi"],
    "瓶/瓶(子)": ["瓶子", "píngzi"],
    "一半/一半兒": ["一半", "yībàn"],
    "飛機場/機場": ["機場", "jīchăng"],
    "有時候(˙ㄏㄡ)/有時": ["有時候", "yŏushíhou"]
};

for (const file of files) {
    if (file === 'A1-生詞.md') continue; // Skip the combined one
    
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const newLines = [];
    let changed = false;

    for (let line of lines) {
        if (!line.trim()) {
            newLines.push(line);
            continue;
        }

        const parts = line.split('\t');
        if (parts.length >= 4) { // At least Word, Meaning, Pinyin, POS
            let word = parts[0].trim();
            let pinyin = parts[2].trim();

            if (cleanupMap[word]) {
                word = cleanupMap[word][0];
                pinyin = cleanupMap[word][1];
                changed = true;
            } else {
                // Generic cleanups for Zhuyin and optional characters
                const originalWord = word;
                
                // Keep the character inside if it's (子), (頭), (機)
                word = word.replace(/\(子\)/g, '子');
                word = word.replace(/\(頭\)/g, '頭');
                word = word.replace(/\(機\)/g, '機');

                // Remove zhuyin like (˙ㄈㄣ), (˙ㄏㄡ)
                word = word.replace(/\(˙[^\)]+\)/g, '');
                word = word.replace(/\([ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙㄧㄨㄩㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ]+(ˊ|ˇ|ˋ|˙)?\)/g, '');
                
                if (word !== originalWord) {
                    changed = true;
                }
            }
            
            parts[0] = word;
            parts[2] = pinyin;
            newLines.push(parts.join('\t'));
        } else {
            newLines.push(line);
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, newLines.join('\n'));
        console.log(`Cleaned up ${file}`);
    }
}

// Remove the old combined file since it's no longer necessary
if (fs.existsSync(path.join(dir, 'A1-生詞.md'))) {
    fs.unlinkSync(path.join(dir, 'A1-生詞.md'));
    console.log('Removed A1-生詞.md');
}
