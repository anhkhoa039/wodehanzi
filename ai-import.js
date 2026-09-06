/**
 * ai-import.js — Module xử lý gọi Gemini API và nhập từ vựng mới
 * Được load bởi index.html sau data.js và app.js
 */

(function () {
  'use strict';

  const SERVER_URL = 'http://localhost:3000';
  const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  // ── State ────────────────────────────────────────────────────────
  let aiState = {
    apiKey: localStorage.getItem('tocfl_gemini_key') || '',
    lessonNum: 6,
    inputWords: '',
    generatedItems: [],
    isLoading: false,
    serverAvailable: false,
  };

  // ── Helpers ──────────────────────────────────────────────────────
  function qs(sel) { return document.querySelector(sel); }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ── Build Gemini Prompt ──────────────────────────────────────────
  function buildPrompt(words, lessonNum, existingIds) {
    const lastId = existingIds
      .filter(id => id.startsWith(`l${lessonNum}-`))
      .sort()
      .pop();
    const startIdx = lastId ? parseInt(lastId.split('-')[1]) + 1 : 1;

    return `Bạn là chuyên gia từ nguyên học chữ Hán, giảng dạy cho học sinh TOCFL X người Việt Nam.
Nhiệm vụ: Phân tích danh sách từ tiếng Trung sau và trả về JSON THUẦN (không markdown, không backtick, chỉ JSON).

Danh sách từ cần phân tích (bài ${lessonNum}):
${words}

Định dạng JSON bắt buộc — trả về MỘT mảng JSON, mỗi phần tử như sau:
{
  "id": "l${lessonNum}-XX",
  "hanzi": "từ chữ Hán",
  "pinyin": "phiên âm",
  "hanViet": "Hán Việt viết hoa mỗi chữ",
  "meaning": "Nghĩa tiếng Việt ngắn gọn",
  "lesson": ${lessonNum},
  "characters": [
    {
      "char": "chữ đơn",
      "pinyin": "phiên âm chữ đơn",
      "structure": "Mô tả cấu tạo. VÍ DỤ: Bên trái là bộ Nhân (亻 - người). Bên phải là Tá (乍). ★ 亻(Nhân): biến thể của 人 khi đứng bên trái. ★ 乍 (Tá): hình người vươn tay đột ngột.",
      "story": "Câu chuyện hình tượng về nguồn gốc của chữ, sinh động, dễ nhớ (2-3 câu).",
      "mnemonic": "Câu thần chú ngắn gọn để nhớ. VÍ DỤ: Người (亻) vươn tay đột ngột (乍) = 作 — làm, hành động."
    }
  ],
  "summary": "Câu chuyện kết nối ý nghĩa tất cả chữ trong từ lại với nhau (1-2 câu).",
  "example": {
    "hanzi": "Câu ví dụ tiếng Trung",
    "pinyin": "Phiên âm câu ví dụ",
    "meaning": "Dịch tiếng Việt"
  }
}

Yêu cầu quan trọng:
1. ID phải bắt đầu từ l${lessonNum}-${String(startIdx).padStart(2,'0')} và tăng dần
2. Trong "structure": mô tả chi tiết từng thành phần, dùng ký hiệu ★ để đánh dấu từng thành phần con
3. Phân tích theo chữ Phồn thể (Traditional Chinese) khi có thể
4. Mỗi chữ trong từ ghép phải có MỘT object trong mảng characters
5. Nếu chữ chỉ có 1 chữ (đơn âm tiết), characters vẫn phải có 1 phần tử
6. Với từ 4 chữ như 百年好合: phân tích tất cả 4 chữ
7. Trả về JSON thuần, không có \`\`\`json hay markdown
`;
  }

  // ── Call Gemini API ──────────────────────────────────────────────
  async function callGemini(prompt, apiKey) {
    const url = `${GEMINI_API_BASE}?key=${apiKey}`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(`Gemini API lỗi ${resp.status}: ${err.error?.message || resp.statusText}`);
    }

    const data = await resp.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini không trả về nội dung');
    return text;
  }

  // ── Parse AI Response ────────────────────────────────────────────
  function parseAIResponse(text) {
    // Xử lý trường hợp AI bọc trong ```json ... ```
    let clean = text.trim();
    clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');

    // Tìm mảng JSON
    const start = clean.indexOf('[');
    const end = clean.lastIndexOf(']');
    if (start === -1 || end === -1) throw new Error('Không tìm thấy mảng JSON trong kết quả AI');

    const jsonStr = clean.slice(start, end + 1);
    const items = JSON.parse(jsonStr);

    if (!Array.isArray(items)) throw new Error('Kết quả AI không phải mảng');
    return items;
  }

  // ── Check server availability ────────────────────────────────────
  async function checkServer() {
    try {
      const resp = await fetch(`${SERVER_URL}/api/check-ids`, { signal: AbortSignal.timeout(2000) });
      if (resp.ok) {
        const data = await resp.json();
        aiState.serverAvailable = true;
        return data;
      }
    } catch {
      aiState.serverAvailable = false;
    }
    return null;
  }

  // ── Save to data.js via server ───────────────────────────────────
  async function saveToDataJS(items) {
    const resp = await fetch(`${SERVER_URL}/api/append-lesson`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    const result = await resp.json();
    if (!resp.ok) throw new Error(result.error || 'Server lỗi');
    return result;
  }

  // ── Render Preview ───────────────────────────────────────────────
  function renderPreview(items) {
    const container = qs('#ai-preview-grid');
    if (!container) return;

    if (!items || items.length === 0) {
      container.innerHTML = '<div class="ai-empty">Chưa có kết quả</div>';
      return;
    }

    container.innerHTML = items.map((item, i) => {
      const charsHtml = (item.characters || []).map(c => `
        <div class="ai-char-block">
          <span class="ai-char">${escapeHtml(c.char)}</span>
          <span class="ai-char-pinyin">${escapeHtml(c.pinyin)}</span>
          <div class="ai-char-structure">${escapeHtml(c.structure || '')}</div>
          <div class="ai-char-story">${escapeHtml(c.story || '')}</div>
          <div class="ai-char-mnemonic">💡 ${escapeHtml(c.mnemonic || '')}</div>
        </div>
      `).join('');

      const exampleHtml = item.example ? `
        <div class="ai-example">
          <div class="ai-ex-hanzi">${escapeHtml(item.example.hanzi)}</div>
          <div class="ai-ex-pinyin">${escapeHtml(item.example.pinyin)}</div>
          <div class="ai-ex-meaning">${escapeHtml(item.example.meaning)}</div>
        </div>
      ` : '';

      return `
        <div class="ai-result-card" style="animation-delay: ${i * 0.06}s">
          <div class="ai-card-header">
            <span class="ai-lesson-tag">第${escapeHtml(item.lesson)}課</span>
            <span class="ai-card-id">${escapeHtml(item.id)}</span>
          </div>
          <div class="ai-card-hanzi">${escapeHtml(item.hanzi)}</div>
          <div class="ai-card-pinyin">${escapeHtml(item.pinyin)}</div>
          <div class="ai-card-hv">${escapeHtml(item.hanViet)}</div>
          <div class="ai-card-meaning">${escapeHtml(item.meaning)}</div>
          <div class="ai-chars-section">
            <div class="ai-section-label">📐 Phân tích từng chữ</div>
            ${charsHtml}
          </div>
          <div class="ai-summary">🧠 ${escapeHtml(item.summary)}</div>
          ${exampleHtml}
        </div>
      `;
    }).join('');
  }

  // ── Update UI state ──────────────────────────────────────────────
  function setLoadingState(loading, message = '') {
    aiState.isLoading = loading;
    const btn = qs('#ai-analyze-btn');
    const spinner = qs('#ai-spinner');
    const status = qs('#ai-status');

    if (btn) {
      btn.disabled = loading;
      btn.textContent = loading ? '⏳ Đang phân tích...' : '✨ Phân tích bằng AI';
    }
    if (spinner) spinner.style.display = loading ? 'flex' : 'none';
    if (status && message) {
      status.textContent = message;
      status.style.display = 'block';
    } else if (status && !loading) {
      status.style.display = 'none';
    }
  }

  function showSuccess(message) {
    const el = qs('#ai-success-msg');
    if (el) {
      el.textContent = message;
      el.style.display = 'block';
      el.className = 'ai-message ai-success';
      setTimeout(() => { el.style.display = 'none'; }, 5000);
    }
  }

  function showError(message) {
    const el = qs('#ai-success-msg');
    if (el) {
      el.textContent = '❌ ' + message;
      el.style.display = 'block';
      el.className = 'ai-message ai-error';
      setTimeout(() => { el.style.display = 'none'; }, 8000);
    }
  }

  // ── Main: Analyze button click ───────────────────────────────────
  async function handleAnalyze() {
    const apiKey = qs('#ai-api-key')?.value?.trim();
    const lessonNum = parseInt(qs('#ai-lesson-num')?.value || '6');
    const words = qs('#ai-words-input')?.value?.trim();

    if (!apiKey) { showError('Vui lòng nhập Gemini API Key'); return; }
    if (!words) { showError('Vui lòng nhập danh sách từ vựng'); return; }

    // Lưu key vào localStorage
    localStorage.setItem('tocfl_gemini_key', apiKey);
    aiState.apiKey = apiKey;
    aiState.lessonNum = lessonNum;

    setLoadingState(true, '🔍 Đang lấy danh sách ID hiện có...');

    try {
      // Kiểm tra server và lấy existing IDs
      const serverData = await checkServer();
      const existingIds = serverData?.ids || [];

      setLoadingState(true, '🤖 Đang gọi Gemini AI... (có thể mất 10-30 giây)');

      const prompt = buildPrompt(words, lessonNum, existingIds);
      const rawResponse = await callGemini(prompt, apiKey);

      setLoadingState(true, '🔄 Đang xử lý kết quả...');

      const items = parseAIResponse(rawResponse);
      aiState.generatedItems = items;

      // Render preview
      renderPreview(items);

      // Show save section
      const saveSection = qs('#ai-save-section');
      if (saveSection) saveSection.style.display = 'block';

      const countEl = qs('#ai-result-count');
      if (countEl) countEl.textContent = `✅ Đã phân tích ${items.length} từ vựng`;

      setLoadingState(false);
      showSuccess(`🎉 Phân tích xong ${items.length} từ! Xem kết quả bên dưới.`);

    } catch (err) {
      setLoadingState(false);
      showError(err.message);
      console.error('AI Error:', err);
    }
  }

  // ── Save to data.js ──────────────────────────────────────────────
  async function handleSave() {
    if (!aiState.generatedItems.length) {
      showError('Chưa có kết quả để lưu');
      return;
    }

    if (!aiState.serverAvailable) {
      showError('Server không chạy. Hãy chạy: node server.js');
      return;
    }

    const saveBtn = qs('#ai-save-btn');
    if (saveBtn) saveBtn.disabled = true;

    try {
      const result = await saveToDataJS(aiState.generatedItems);
      showSuccess(`✅ ${result.message}`);

      // Reload LESSON_DATA (cần reload trang)
      const reload = qs('#ai-reload-btn');
      if (reload) reload.style.display = 'inline-block';

    } catch (err) {
      showError('Lỗi khi ghi file: ' + err.message);
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  }

  // ── Copy JSON to clipboard ───────────────────────────────────────
  function handleCopyJson() {
    if (!aiState.generatedItems || !aiState.generatedItems.length) {
      showError('Chưa có dữ liệu để sao chép. Hãy bấm "Phân tích bằng AI" trước.');
      return;
    }
    const jsonStr = JSON.stringify(aiState.generatedItems, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(jsonStr).then(() => {
        showSuccess('📋 Đã sao chép mảng JSON vào bộ nhớ tạm!');
      }).catch(() => {
        fallbackCopy(jsonStr);
      });
    } else {
      fallbackCopy(jsonStr);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showSuccess('📋 Đã sao chép mảng JSON vào bộ nhớ tạm!');
    } catch {
      showError('Trình duyệt không cho phép tự động sao chép.');
    }
    document.body.removeChild(ta);
  }

  // ── Download JSON file ───────────────────────────────────────────
  function handleDownloadJson() {
    if (!aiState.generatedItems || !aiState.generatedItems.length) {
      showError('Chưa có dữ liệu để tải. Hãy bấm "Phân tích bằng AI" trước.');
      return;
    }
    const jsonStr = JSON.stringify(aiState.generatedItems, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lesson_${aiState.lessonNum}_vocab.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess(`📥 Đã tải file lesson_${aiState.lessonNum}_vocab.json về máy!`);
  }

  // ── Bind events for AI view ──────────────────────────────────────
  function bindAIEvents() {
    const analyzeBtn = qs('#ai-analyze-btn');
    if (analyzeBtn) analyzeBtn.addEventListener('click', handleAnalyze);

    const saveBtn = qs('#ai-save-btn');
    if (saveBtn) saveBtn.addEventListener('click', handleSave);

    const copyBtn = qs('#ai-copy-btn');
    if (copyBtn) copyBtn.addEventListener('click', handleCopyJson);

    const downloadBtn = qs('#ai-download-btn');
    if (downloadBtn) downloadBtn.addEventListener('click', handleDownloadJson);

    const reloadBtn = qs('#ai-reload-btn');
    if (reloadBtn) reloadBtn.addEventListener('click', () => location.reload());

    // Restore saved API key
    const keyInput = qs('#ai-api-key');
    if (keyInput && aiState.apiKey) keyInput.value = aiState.apiKey;

    // Toggle API key visibility
    const toggleKey = qs('#ai-toggle-key');
    if (toggleKey) {
      toggleKey.addEventListener('click', () => {
        const input = qs('#ai-api-key');
        if (!input) return;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        toggleKey.textContent = show ? '🙈' : '👁';
      });
    }

    // Check server status on load
    checkServer().then(data => {
      const statusEl = qs('#ai-server-status');
      if (statusEl) {
        if (aiState.serverAvailable) {
          const lessons = data?.lessons || [];
          statusEl.innerHTML = `<span class="status-ok">✅ Server cục bộ đang chạy</span> — Các bài đã có: ${lessons.map(l => '第' + l + '課').join(', ') || 'chưa có'}`;
        } else {
          statusEl.innerHTML = `<span class="status-warn">ℹ️ Chế độ Tĩnh (Web / GitHub Pages)</span> — Server cục bộ chưa bật. Bạn vẫn có thể phân tích bằng Gemini và sao chép/tải JSON. Để ghi trực tiếp vào data.js, hãy chạy <code>npm start</code> trên máy.`;
        }
      }
    });
  }

  // Expose bindAIEvents globally so app.js can call it
  window.bindAIEvents = bindAIEvents;

})();
