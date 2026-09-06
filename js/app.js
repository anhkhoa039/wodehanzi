// TOCFL X 漢字記憶 — Application Logic

(function () {
  "use strict";

  // --- State ---
  let currentView = "study";
  let currentLesson = "3_1";
  let searchQuery = "";
  let currentStatusFilter = "all"; // "all" | "unmastered" | "mastered"
  let masteredIds = JSON.parse(localStorage.getItem("tocfl_mastered") || "[]");

  // Custom Words state
  const STORAGE_KEY_CUSTOM_WORDS = "tocfl_custom_words";
  let isAddWordModalOpen = false;
  let customCharBreakdowns = [];

  // Load custom words from localStorage into in-memory LESSON_DATA
  function loadCustomWords() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_CUSTOM_WORDS) || "[]");
      if (Array.isArray(saved) && typeof LESSON_DATA !== "undefined") {
        saved.forEach(item => {
          item.isCustom = true;
          const idx = LESSON_DATA.findIndex(d => d.id === item.id);
          if (idx === -1) {
            LESSON_DATA.push(item);
          } else {
            LESSON_DATA[idx] = item;
          }
        });
      }
    } catch (e) {
      console.warn("Could not load custom words:", e);
    }
  }

  loadCustomWords();

  // Modal state
  let isModalOpen = false;
  let currentModalId = null;

  // Flashcard state
  let fcItems = [];
  let fcIndex = 0;
  let fcKnown = 0;
  let fcUnknown = 0;

  // Quiz state
  let quizItems = [];
  let quizIndex = 0;
  let quizCorrect = 0;

  // Practice State
  let practiceSelectedCard = null;
  let practiceMatchedCount = 0;
  let practiceTotalPairs = 0;
  let isPracticeLocked = false;

  // --- Helpers ---
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // --- Speech & Clipboard Helpers ---
  function speakChinese(text, lang = 'zh-TW') {
    if (!text) return;
    if (!('speechSynthesis' in window)) {
      showToast('Trình duyệt không hỗ trợ phát âm.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.85; // tốc độ chuẩn vừa phải cho người học
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang === 'zh-TW' || v.lang === 'zh-HK' || v.lang.startsWith('zh'));
    if (zhVoice) utterance.voice = zhVoice;
    window.speechSynthesis.speak(utterance);
  }

  function showToast(message) {
    const container = $("#toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 2200);
  }

  function copyToClipboard(text, message = 'Đã sao chép vào bộ nhớ tạm!') {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => showToast(message)).catch(() => {
        fallbackCopy(text, message);
      });
    } else {
      fallbackCopy(text, message);
    }
  }

  function fallbackCopy(text, message) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast(message);
    } catch (err) {
      showToast('Không thể sao chép');
    }
    document.body.removeChild(ta);
  }

  function getFilteredData() {
    let data = LESSON_DATA;
    if (currentLesson !== "all") {
      data = data.filter(d => String(d.lesson) === currentLesson);
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.trim().toLowerCase();
      data = data.filter(d => 
        d.hanzi.toLowerCase().includes(q) || 
        d.pinyin.toLowerCase().includes(q) || 
        d.hanViet.toLowerCase().includes(q) || 
        d.meaning.toLowerCase().includes(q)
      );
    }
    if (currentStatusFilter === "mastered") {
      data = data.filter(d => isMastered(d.id));
    } else if (currentStatusFilter === "unmastered") {
      data = data.filter(d => !isMastered(d.id));
    }
    return data;
  }

  function isMastered(id) {
    return masteredIds.includes(id);
  }

  function toggleMastered(id) {
    if (isMastered(id)) {
      masteredIds = masteredIds.filter(x => x !== id);
    } else {
      masteredIds.push(id);
    }
    localStorage.setItem("tocfl_mastered", JSON.stringify(masteredIds));
  }

  function updateProgressBar() {
    // Base lesson data before status filter to get accurate counts
    let baseData = LESSON_DATA;
    if (currentLesson !== "all") {
      baseData = baseData.filter(d => String(d.lesson) === currentLesson);
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.trim().toLowerCase();
      baseData = baseData.filter(d => 
        d.hanzi.toLowerCase().includes(q) || 
        d.pinyin.toLowerCase().includes(q) || 
        d.hanViet.toLowerCase().includes(q) || 
        d.meaning.toLowerCase().includes(q)
      );
    }

    const total = baseData.length;
    const done = baseData.filter(d => isMastered(d.id)).length;
    const unmastered = total - done;
    const pct = total ? Math.round((done / total) * 100) : 0;

    const progressBar = $("#progress-bar");
    if (progressBar) progressBar.style.width = pct + "%";

    const progressContainer = $("#progress-bar-container");
    if (progressContainer) progressContainer.setAttribute("aria-valuenow", pct);

    const masteryText = $("#study-mastery-text");
    if (masteryText) masteryText.textContent = `${done}/${total} từ (${pct}%)`;

    const countAll = $("#count-all");
    if (countAll) countAll.textContent = total;
    const countUnmastered = $("#count-unmastered");
    if (countUnmastered) countUnmastered.textContent = unmastered;
    const countMastered = $("#count-mastered");
    if (countMastered) countMastered.textContent = done;
  }

  function setStatusFilter(filter) {
    currentStatusFilter = filter;
    $$(".study-filter-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.filter === filter);
    });
    renderStudyGrid();
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // --- Navigation ---
  function setView(view) {
    currentView = view;
    $$(".nav-tab").forEach(t => {
      const isActive = t.dataset.view === view;
      t.classList.toggle("active", isActive);
      t.setAttribute("aria-selected", isActive ? "true" : "false");
    });
    $$(".view").forEach(v => v.classList.toggle("active", v.id === "view-" + view));

    if (view === "study") renderStudyGrid();
    if (view === "flashcard") initFlashcards();
    if (view === "quiz") initQuiz();
    if (view === "practice") initPractice();
    if (view === "ai" && typeof window.bindAIEvents === 'function') window.bindAIEvents();
  }

  function setLesson(lesson) {
    currentLesson = lesson;
    const select = $("#lesson-select");
    if (select) select.value = lesson;
    updateProgressBar();

    if (currentView === "study") renderStudyGrid();
    if (currentView === "flashcard") initFlashcards();
    if (currentView === "quiz") initQuiz();
    if (currentView === "practice") initPractice();
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tocfl_theme', theme);
    
    // Update active state in dropdown
    $$(".theme-option").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.theme === theme);
    });
  }

  // --- Study View ---
  function renderStudyGrid() {
    const grid = $("#study-grid");
    const data = getFilteredData();

    // Update title
    if (currentLesson === "all") {
      $("#study-title").textContent = "Tất cả bài học";
    } else {
      const selectEl = $("#lesson-select");
      let titleStr = selectEl?.options[selectEl.selectedIndex]?.text || `第${currentLesson}課`;
      
      if (String(currentLesson).startsWith("Mock")) {
          titleStr = `TOCFL Đề ${currentLesson.replace("Mock", "")}`;
      } else if (String(currentLesson).startsWith("A1_")) {
          let cat = currentLesson.replace("A1_", "");
          if (cat === "個人資料") cat = "Thông tin cá nhân";
          else if (cat === "健康及身體照護") cat = "Sức khỏe & Cơ thể";
          else if (cat === "其他") cat = "Các từ khác";
          else if (cat === "房屋與家庭_環境") cat = "Nhà cửa & Môi trường";
          else if (cat === "教育") cat = "Giáo dục";
          else if (cat === "旅行") cat = "Du lịch";
          else if (cat === "日常生活") cat = "Đời sống hàng ngày";
          titleStr = `TOCFL A1 (${cat})`;
      }
      $("#study-title").textContent = titleStr;
    }

    // Handle Empty State
    if (data.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon" aria-hidden="true">🔍</div>
          <h3>Không tìm thấy từ vựng nào</h3>
          <p>${searchQuery ? `Không có từ nào khớp với từ khóa "<strong>${escapeHtml(searchQuery)}</strong>".` : 'Không có từ nào trong danh mục lọc hiện tại.'}</p>
          <div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap;">
            <button class="empty-clear-btn" id="empty-clear-btn">Xóa bộ lọc & tìm kiếm</button>
            <button class="btn-primary-action btn-add-word" id="empty-add-word-btn" style="min-height:40px;padding:8px 16px;font-size:13.5px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              <span>+ Thêm từ cho bài này</span>
            </button>
          </div>
        </div>
      `;
      const clearBtn = $("#empty-clear-btn");
      if (clearBtn) {
        clearBtn.addEventListener("click", () => {
          searchQuery = "";
          const searchInput = $("#search-input");
          if (searchInput) searchInput.value = "";
          setStatusFilter("all");
        });
      }
      const emptyAddBtn = $("#empty-add-word-btn");
      if (emptyAddBtn) {
        emptyAddBtn.addEventListener("click", () => {
          openAddWordModal(currentLesson);
        });
      }
      updateProgressBar();
      return;
    }

    grid.innerHTML = data.map((item, i) => `
      <div class="study-card ${isMastered(item.id) ? 'mastered' : ''} ${item.isCustom ? 'custom-word' : ''}" 
           data-id="${item.id}" 
           tabindex="0" 
           role="button"
           aria-label="Từ: ${escapeHtml(item.hanzi)}, Pinyin: ${escapeHtml(item.pinyin)}, Nghĩa: ${escapeHtml(item.meaning)}. Nhấn để xem chi tiết."
           style="animation-delay: ${Math.min(i * 0.04, 0.5)}s">
        <button class="card-audio-btn" data-speak="${escapeHtml(item.hanzi)}" title="Phát âm ${escapeHtml(item.hanzi)}" aria-label="Phát âm ${escapeHtml(item.hanzi)}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
        </button>
        <div class="study-card-inner">
          <span class="card-lesson-tag">${String(item.lesson).startsWith("Mock") ? 'Đề ' + item.lesson.replace("Mock", "") : String(item.lesson).startsWith("A1_") ? 'A1' : String(item.lesson).startsWith("3_") ? 'B3 - 第' + item.lesson.replace("3_", "") + '課' : '第' + item.lesson + '課'}${item.isCustom ? ' <span class="badge-custom-pill">Tự thêm</span>' : ''}</span>
          <div class="card-hanzi">${item.hanzi}</div>
          <div class="card-pinyin">${item.pinyin}</div>
          <div class="card-hv">${item.hanViet}</div>
          <div class="card-meaning">${item.meaning}</div>
          <div class="card-mnemonic-preview">${item.summary}</div>
          <div class="card-expand-hint" aria-hidden="true">Nhấn để xem chi tiết →</div>
        </div>
      </div>
    `).join("");

    // Attach click and keyboard handlers
    grid.querySelectorAll(".study-card").forEach(card => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".card-audio-btn")) return;
        openModal(card.dataset.id);
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openModal(card.dataset.id);
        }
      });
    });

    // Attach audio handlers
    grid.querySelectorAll(".card-audio-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        speakChinese(btn.dataset.speak);
      });
    });

    updateProgressBar();
  }

  // --- Swipe & Touch Gesture Helper ---
  function addSwipeListener(element, onSwipeLeft, onSwipeRight, options = {}) {
    if (!element) return;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    const minDistance = options.minDistance || 40;
    const maxTime = options.maxTime || 650;

    element.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }, { passive: true });

    element.addEventListener("touchend", (e) => {
      if (!touchStartX || !touchStartTime) return;
      // Do not trigger if text is highlighted/selected
      if (window.getSelection && window.getSelection().toString().trim().length > 0) {
        touchStartX = touchStartY = touchStartTime = 0;
        return;
      }

      const deltaX = e.changedTouches[0].clientX - touchStartX;
      const deltaY = e.changedTouches[0].clientY - touchStartY;
      const deltaTime = Date.now() - touchStartTime;

      // Ensure horizontal swipe is dominant and completed within maxTime
      if (deltaTime <= maxTime && Math.abs(deltaX) >= minDistance && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
        if (deltaX < 0) {
          if (typeof onSwipeLeft === "function") onSwipeLeft();
        } else {
          if (typeof onSwipeRight === "function") onSwipeRight();
        }
      }

      touchStartX = touchStartY = touchStartTime = 0;
    }, { passive: true });
  }

  // --- Modal Navigation ---
  function getModalList() {
    const filtered = getFilteredData();
    if (filtered.some(d => d.id === currentModalId)) {
      return filtered;
    }
    const currentItem = LESSON_DATA.find(d => d.id === currentModalId);
    if (currentItem) {
      const lessonItems = LESSON_DATA.filter(d => String(d.lesson) === String(currentItem.lesson));
      if (lessonItems.some(d => d.id === currentModalId)) return lessonItems;
    }
    return LESSON_DATA;
  }

  function navigateModal(direction, animated = true) {
    if (!isModalOpen || !currentModalId) return;
    const list = getModalList();
    const currentIndex = list.findIndex(d => d.id === currentModalId);
    if (currentIndex === -1) return;

    const targetIndex = currentIndex + direction;
    if (targetIndex >= 0 && targetIndex < list.length) {
      openModal(list[targetIndex].id);
      const modalEl = $("#detail-modal");
      if (modalEl) {
        modalEl.scrollTop = 0;
        if (animated) {
          const slideClass = direction > 0 ? "slide-next" : "slide-prev";
          modalEl.classList.remove("slide-next", "slide-prev");
          void modalEl.offsetWidth; // Force reflow
          modalEl.classList.add(slideClass);
          modalEl.addEventListener("animationend", () => {
            modalEl.classList.remove(slideClass);
          }, { once: true });
        }
      }
    } else {
      showToast(direction > 0 ? "Đã đến từ cuối cùng của danh sách" : "Đã là từ đầu tiên của danh sách");
    }
  }

  // --- Modal ---
  function openModal(id) {
    const item = LESSON_DATA.find(d => d.id === id);
    if (!item) return;

    currentModalId = id;
    const modalList = getModalList();
    const currentIndex = modalList.findIndex(d => d.id === id);
    const totalCount = modalList.length;
    const currentNum = currentIndex !== -1 ? currentIndex + 1 : 1;
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex !== -1 && currentIndex < totalCount - 1;

    const content = $("#modal-content");
    let html = `
      <!-- Navigation Toolbar in Modal -->
      <div class="modal-nav-toolbar">
        <div class="modal-nav-group">
          <button class="modal-nav-btn modal-nav-prev" id="modal-prev-btn" ${!hasPrev ? 'disabled' : ''} aria-label="Từ trước (phím mũi tên trái hoặc vuốt phải)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>
            <span>Trước</span>
          </button>
          <div class="modal-nav-indicator" title="Vị trí từ trong danh sách đang học">
            <span class="modal-nav-current">${currentNum}</span>
            <span class="modal-nav-divider">/</span>
            <span class="modal-nav-total">${totalCount}</span>
          </div>
          <button class="modal-nav-btn modal-nav-next" id="modal-next-btn" ${!hasNext ? 'disabled' : ''} aria-label="Từ tiếp theo (phím mũi tên phải hoặc vuốt trái)">
            <span>Sau</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
        <div class="modal-nav-lesson-badge">Bài ${item.lesson}</div>
      </div>

      <div class="modal-hanzi" id="modal-hanzi-title">${item.hanzi}</div>
      <div class="modal-pinyin">${item.pinyin}</div>
      <div class="modal-hv">${item.hanViet}</div>
      <div class="modal-meaning">${item.meaning}</div>

      <!-- Quick Actions in Modal -->
      <div class="modal-action-bar">
        <button class="modal-action-btn" id="modal-speak-btn" aria-label="Nghe phát âm từ này">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          <span>Nghe phát âm (S)</span>
        </button>
        <button class="modal-action-btn" id="modal-copy-btn" aria-label="Sao chép chữ Hán">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span>Sao chép từ</span>
        </button>
        ${item.isCustom ? `
        <button class="btn-delete-custom-word" id="modal-delete-custom-btn" title="Xóa từ tự thêm này khỏi danh sách">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          <span>Xóa từ tự thêm</span>
        </button>
        ` : ''}
      </div>
    `;

    // Character breakdowns
    html += `<div class="modal-section">
      <div class="modal-section-title">📐 Phân tích từng chữ</div>`;

    item.characters.forEach((c) => {
      html += `
        <div class="modal-char-block">
          <div class="mcb-header">
            <span class="mcb-char">${c.char}</span>
            <span class="mcb-pinyin">${c.pinyin}</span>
            <button class="char-audio-btn" data-speak="${escapeHtml(c.char)}" title="Phát âm ${c.char}" aria-label="Phát âm ${c.char}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
            </button>
          </div>
          <div class="mcb-label"><strong>Cấu tạo:</strong> ${c.structure}</div>
          <div class="mcb-story">${c.story}</div>
          <div class="mcb-mnemonic">💡 ${c.mnemonic}</div>
        </div>
      `;
    });
    html += `</div>`;

    // Summary
    html += `
      <div class="modal-section">
        <div class="modal-section-title">🧠 Tổng kết mẹo nhớ</div>
        <div class="modal-summary">${item.summary}</div>
      </div>
    `;

    // Example with Audio & Copy
    if (item.example) {
      html += `
        <div class="modal-section">
          <div class="modal-section-title">
            <span>📖 Ví dụ ứng dụng</span>
            <div class="ex-actions">
              <button class="mini-icon-btn" id="modal-ex-speak-btn" title="Phát âm câu ví dụ" aria-label="Phát âm câu ví dụ">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
              </button>
              <button class="mini-icon-btn" id="modal-ex-copy-btn" title="Sao chép câu ví dụ" aria-label="Sao chép câu ví dụ">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </button>
            </div>
          </div>
          <div class="modal-summary" style="background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:16px;">
            <div style="font-size:18px;font-weight:700;color:var(--text-hanzi);margin-bottom:4px;font-family:var(--font-hanzi);">${item.example.hanzi}</div>
            <div style="font-size:14px;color:var(--accent-2);margin-bottom:6px;font-style:italic;">${item.example.pinyin}</div>
            <div style="font-size:14px;color:var(--text-secondary);">${item.example.meaning}</div>
          </div>
        </div>
      `;
    }

    // Mastery button
    const mastered = isMastered(id);
    html += `
      <button class="modal-mastery-btn ${mastered ? 'mastered' : ''}" data-id="${id}">
        ${mastered ? '✓ Đã thuộc — nhấn để bỏ đánh dấu' : '☐ Đánh dấu là đã thuộc'}
      </button>

      <!-- Bottom Navigation & Swipe Hint -->
      <div class="modal-swipe-footer">
        <div class="modal-footer-nav">
          <button class="modal-nav-btn modal-nav-prev" id="modal-bottom-prev-btn" ${!hasPrev ? 'disabled' : ''} aria-label="Từ trước">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>
            <span>Từ trước</span>
          </button>
          <button class="modal-nav-btn modal-nav-next" id="modal-bottom-next-btn" ${!hasNext ? 'disabled' : ''} aria-label="Từ sau">
            <span>Từ tiếp theo</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
        <div class="modal-swipe-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="7 13 2 8 7 3"></polyline><line x1="2" y1="8" x2="22" y2="8"></line><polyline points="17 11 22 16 17 21"></polyline><line x1="22" y1="16" x2="2" y2="16"></line></svg>
          <span>Vuốt trái / phải trên màn hình để chuyển từ</span>
        </div>
      </div>
    `;

    content.innerHTML = html;

    // Attach navigation buttons
    const prevBtn = $("#modal-prev-btn");
    if (prevBtn) prevBtn.addEventListener("click", () => navigateModal(-1));

    const nextBtn = $("#modal-next-btn");
    if (nextBtn) nextBtn.addEventListener("click", () => navigateModal(1));

    const bottomPrevBtn = $("#modal-bottom-prev-btn");
    if (bottomPrevBtn) bottomPrevBtn.addEventListener("click", () => navigateModal(-1));

    const bottomNextBtn = $("#modal-bottom-next-btn");
    if (bottomNextBtn) bottomNextBtn.addEventListener("click", () => navigateModal(1));

    // Attach modal buttons
    const speakBtn = $("#modal-speak-btn");
    if (speakBtn) speakBtn.addEventListener("click", () => speakChinese(item.hanzi));

    const copyBtn = $("#modal-copy-btn");
    if (copyBtn) copyBtn.addEventListener("click", () => copyToClipboard(item.hanzi, `Đã sao chép "${item.hanzi}"!`));

    content.querySelectorAll(".char-audio-btn").forEach(btn => {
      btn.addEventListener("click", () => speakChinese(btn.dataset.speak));
    });

    if (item.example) {
      const exSpeakBtn = $("#modal-ex-speak-btn");
      if (exSpeakBtn) exSpeakBtn.addEventListener("click", () => speakChinese(item.example.hanzi));
      const exCopyBtn = $("#modal-ex-copy-btn");
      if (exCopyBtn) exCopyBtn.addEventListener("click", () => copyToClipboard(item.example.hanzi, 'Đã sao chép câu ví dụ!'));
    }

    const deleteCustomBtn = $("#modal-delete-custom-btn");
    if (deleteCustomBtn) {
      deleteCustomBtn.addEventListener("click", () => deleteCustomWord(item.id));
    }

    // Mastery button handler
    content.querySelector(".modal-mastery-btn").addEventListener("click", function () {
      toggleMastered(this.dataset.id);
      const m = isMastered(this.dataset.id);
      this.classList.toggle("mastered", m);
      this.textContent = m ? '✓ Đã thuộc — nhấn để bỏ đánh dấu' : '☐ Đánh dấu là đã thuộc';
      renderStudyGrid();
    });

    // Show modal
    const overlay = $("#modal-overlay");
    overlay.style.display = "flex";
    requestAnimationFrame(() => overlay.classList.add("open"));

    // Prevent body scroll
    document.body.style.overflow = "hidden";

    isModalOpen = true;
    currentModalId = id;
  }

  function closeModal() {
    const overlay = $("#modal-overlay");
    overlay.classList.remove("open");
    setTimeout(() => {
      overlay.style.display = "none";
      document.body.style.overflow = "";
      isModalOpen = false;
      currentModalId = null;
    }, 300);
  }

  // --- Manual Word Addition Module ---
  function getCustomWords() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_CUSTOM_WORDS) || "[]");
    } catch {
      return [];
    }
  }

  function saveCustomWordLocally(newItem) {
    const list = getCustomWords();
    const existingIndex = list.findIndex(d => d.id === newItem.id);
    if (existingIndex >= 0) {
      list[existingIndex] = newItem;
    } else {
      list.push(newItem);
    }
    localStorage.setItem(STORAGE_KEY_CUSTOM_WORDS, JSON.stringify(list));

    // Also update in-memory LESSON_DATA
    const dataIndex = LESSON_DATA.findIndex(d => d.id === newItem.id);
    if (dataIndex >= 0) {
      LESSON_DATA[dataIndex] = newItem;
    } else {
      LESSON_DATA.push(newItem);
    }
  }

  function deleteCustomWord(id) {
    const item = LESSON_DATA.find(d => d.id === id);
    const hanzi = item ? item.hanzi : "";
    if (!confirm(`Bạn có chắc chắn muốn xóa từ "${hanzi}" đã thêm khỏi danh sách không?`)) {
      return;
    }

    // Remove from localStorage
    const list = getCustomWords().filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEY_CUSTOM_WORDS, JSON.stringify(list));

    // Remove from in-memory LESSON_DATA
    const idx = LESSON_DATA.findIndex(d => d.id === id);
    if (idx !== -1) {
      LESSON_DATA.splice(idx, 1);
    }

    // Also remove from masteredIds if present
    if (isMastered(id)) {
      toggleMastered(id);
    }

    closeModal();
    renderStudyGrid();
    updateProgressBar();
    showToast(`🗑️ Đã xóa từ "${hanzi}".`);
  }

  function populateAddWordLessonSelect() {
    const sourceSelect = $("#lesson-select");
    const targetSelect = $("#form-word-lesson");
    if (!sourceSelect || !targetSelect) return;

    targetSelect.innerHTML = "";
    Array.from(sourceSelect.children).forEach(child => {
      if (child.tagName === "OPTGROUP") {
        const group = document.createElement("optgroup");
        group.label = child.label;
        Array.from(child.children).forEach(opt => {
          if (opt.value !== "all") {
            const newOpt = document.createElement("option");
            newOpt.value = opt.value;
            newOpt.textContent = opt.textContent;
            group.appendChild(newOpt);
          }
        });
        if (group.children.length > 0) {
          targetSelect.appendChild(group);
        }
      } else if (child.tagName === "OPTION" && child.value !== "all") {
        const newOpt = document.createElement("option");
        newOpt.value = child.value;
        newOpt.textContent = child.textContent;
        targetSelect.appendChild(newOpt);
      }
    });

    if (currentLesson && currentLesson !== "all") {
      targetSelect.value = currentLesson;
    } else {
      targetSelect.value = "3_1";
    }
  }

  function renderCharBreakdownBlocks() {
    const container = $("#form-chars-container");
    const counterBadge = $("#form-char-counter");
    if (!container) return;

    if (counterBadge) {
      counterBadge.textContent = `${customCharBreakdowns.length} chữ`;
    }

    if (customCharBreakdowns.length === 0) {
      container.innerHTML = `
        <div class="chars-empty-hint" id="chars-empty-hint">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>Hãy nhập Chữ Hán ở Bước 1 hoặc nhấn nút "+ Thêm chữ" để bắt đầu chiết tự</span>
        </div>
      `;
      return;
    }

    container.innerHTML = customCharBreakdowns.map((c, index) => `
      <div class="char-card-block" data-char-index="${index}">
        <div class="char-card-top">
          <div class="char-card-left">
            <div class="char-card-badge">${escapeHtml(c.char || '?')}</div>
            <div class="form-field" style="margin-bottom:0;">
              <label>Ký tự</label>
              <input type="text" class="form-input-custom char-card-input-char" value="${escapeHtml(c.char || '')}" placeholder="字" maxlength="2" data-field="char" aria-label="Ký tự chữ Hán ${index + 1}">
            </div>
            <div class="form-field" style="margin-bottom:0;">
              <label>Pinyin của chữ</label>
              <input type="text" class="form-input-custom char-card-input-pinyin" value="${escapeHtml(c.pinyin || '')}" placeholder="vd: zì" data-field="pinyin" aria-label="Pinyin cho chữ ${escapeHtml(c.char || '')}">
            </div>
          </div>
          <button type="button" class="char-card-delete-btn" data-delete-index="${index}" title="Xóa phân tích chữ này" aria-label="Xóa phân tích chữ ${index + 1}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>

        <div class="form-field">
          <label>📐 Cấu tạo chi tiết & Bộ thủ</label>
          <textarea rows="2" class="form-textarea-custom" placeholder="vd: Chữ hội ý, trên là Miên (宀 - mái nhà), dưới là Tử (子 - đứa con)..." data-field="structure">${escapeHtml(c.structure || '')}</textarea>
        </div>

        <div class="form-field">
          <label>📜 Câu chuyện tượng hình / Nguồn gốc</label>
          <textarea rows="2" class="form-textarea-custom" placeholder="vd: Hình ảnh đứa trẻ dưới mái nhà được dạy học..." data-field="story">${escapeHtml(c.story || '')}</textarea>
        </div>

        <div class="form-field">
          <label>💡 Mẹo nhớ chữ</label>
          <input type="text" class="form-input-custom" value="${escapeHtml(c.mnemonic || '')}" placeholder="vd: Đứa con (子) ở dưới mái nhà (宀) thì chăm chỉ học chữ." data-field="mnemonic">
        </div>
      </div>
    `).join("");

    // Attach input sync listeners to preserve edits
    container.querySelectorAll(".char-card-block").forEach(block => {
      const idx = parseInt(block.dataset.charIndex, 10);
      block.querySelectorAll("input, textarea").forEach(field => {
        field.addEventListener("input", (e) => {
          const prop = e.target.dataset.field;
          if (prop && customCharBreakdowns[idx]) {
            customCharBreakdowns[idx][prop] = e.target.value;
            if (prop === "char") {
              const badge = block.querySelector(".char-card-badge");
              if (badge) badge.textContent = e.target.value.trim() || '?';
            }
          }
        });
      });
    });

    // Attach delete buttons
    container.querySelectorAll(".char-card-delete-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.deleteIndex, 10);
        customCharBreakdowns.splice(idx, 1);
        renderCharBreakdownBlocks();
      });
    });
  }

  function handleHanziInputAssist(hanziText) {
    if (!hanziText) {
      customCharBreakdowns = [];
      renderCharBreakdownBlocks();
      return;
    }

    const matchedChars = hanziText.match(/[\u4e00-\u9fa5\u3400-\u4dbf]/g) || [];
    const uniqueChars = Array.from(new Set(matchedChars));

    const newBreakdowns = uniqueChars.map(ch => {
      const existing = customCharBreakdowns.find(c => c.char === ch);
      if (existing) return existing;
      return {
        char: ch,
        pinyin: "",
        structure: "",
        story: "",
        mnemonic: ""
      };
    });

    customCharBreakdowns = newBreakdowns;
    renderCharBreakdownBlocks();
  }

  function openAddWordModal(targetLesson) {
    const overlay = $("#add-word-modal-overlay");
    if (!overlay) return;

    populateAddWordLessonSelect();
    if (targetLesson && targetLesson !== "all") {
      const lessonSelect = $("#form-word-lesson");
      if (lessonSelect) lessonSelect.value = targetLesson;
    }

    // Reset fields
    $("#add-word-form")?.reset();
    customCharBreakdowns = [];
    renderCharBreakdownBlocks();

    const statusEl = $("#add-word-status");
    if (statusEl) {
      statusEl.textContent = "";
      statusEl.className = "form-status-msg";
    }

    overlay.style.display = "flex";
    requestAnimationFrame(() => overlay.classList.add("open"));
    document.body.style.overflow = "hidden";
    overlay.setAttribute("aria-hidden", "false");
    isAddWordModalOpen = true;

    setTimeout(() => {
      $("#form-word-hanzi")?.focus();
    }, 150);
  }

  function closeAddWordModal() {
    const overlay = $("#add-word-modal-overlay");
    if (!overlay) return;
    overlay.classList.remove("open");
    setTimeout(() => {
      overlay.style.display = "none";
      document.body.style.overflow = "";
      overlay.setAttribute("aria-hidden", "true");
      isAddWordModalOpen = false;
    }, 300);
  }

  async function handleAddWordSubmit(e) {
    e.preventDefault();
    const statusEl = $("#add-word-status");
    const submitBtn = $("#btn-submit-add-word");
    const submitText = $("#btn-submit-text");

    const lessonVal = $("#form-word-lesson")?.value;
    const hanziVal = $("#form-word-hanzi")?.value.trim();
    const pinyinVal = $("#form-word-pinyin")?.value.trim();
    const hvVal = $("#form-word-hv")?.value.trim();
    const meaningVal = $("#form-word-meaning")?.value.trim();
    const summaryVal = $("#form-word-summary")?.value.trim();

    const exHanziVal = $("#form-word-ex-hanzi")?.value.trim();
    const exPinyinVal = $("#form-word-ex-pinyin")?.value.trim();
    const exMeaningVal = $("#form-word-ex-meaning")?.value.trim();

    let hasError = false;
    const requiredInputs = [
      { el: $("#form-word-hanzi"), val: hanziVal },
      { el: $("#form-word-pinyin"), val: pinyinVal },
      { el: $("#form-word-meaning"), val: meaningVal }
    ];

    requiredInputs.forEach(item => {
      if (!item.val) {
        if (item.el) item.el.classList.add("error");
        hasError = true;
      } else {
        if (item.el) item.el.classList.remove("error");
      }
    });

    if (hasError) {
      if (statusEl) {
        statusEl.textContent = "⚠️ Vui lòng điền đầy đủ các mục có dấu (*)";
        statusEl.className = "form-status-msg status-error";
      }
      return;
    }

    let formattedLesson = lessonVal;
    if (!isNaN(lessonVal) && !String(lessonVal).includes('_') && !String(lessonVal).startsWith('Mock') && !String(lessonVal).startsWith('A1')) {
      formattedLesson = Number(lessonVal);
    }

    const lessonPrefix = String(lessonVal).startsWith('Mock') ? lessonVal : `l${lessonVal}`;
    const newItem = {
      id: `${lessonPrefix}-custom-${Date.now().toString(36)}`,
      hanzi: hanziVal,
      pinyin: pinyinVal,
      hanViet: hvVal || "",
      meaning: meaningVal,
      lesson: formattedLesson,
      characters: customCharBreakdowns.filter(c => c.char && c.char.trim() !== ""),
      summary: summaryVal || "",
      isCustom: true
    };

    if (exHanziVal) {
      newItem.example = {
        hanzi: exHanziVal,
        pinyin: exPinyinVal || "",
        meaning: exMeaningVal || ""
      };
    }

    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.textContent = "Đang lưu...";

    saveCustomWordLocally(newItem);

    let serverSuccess = false;
    try {
      const resp = await fetch("/api/append-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: newItem })
      });
      if (resp.ok) {
        serverSuccess = true;
      }
    } catch {
      serverSuccess = false;
    }

    if (serverSuccess) {
      showToast(`🎉 Đã lưu "${newItem.hanzi}" vào Bài ${newItem.lesson} và ghi vào js/data.js!`);
    } else {
      showToast(`✅ Đã lưu "${newItem.hanzi}" vào Bài ${newItem.lesson} (lưu trên trình duyệt)!`);
    }

    closeAddWordModal();

    if (currentLesson !== "all" && String(currentLesson) !== String(lessonVal)) {
      setLesson(String(lessonVal));
    } else {
      renderStudyGrid();
      updateProgressBar();
    }

    setTimeout(() => {
      const newCard = document.querySelector(`.study-card[data-id="${newItem.id}"]`);
      if (newCard) {
        newCard.scrollIntoView({ behavior: "smooth", block: "center" });
        newCard.style.outline = "2px solid var(--accent-1)";
        setTimeout(() => newCard.style.outline = "", 2500);
      }
    }, 250);

    if (submitBtn) submitBtn.disabled = false;
    if (submitText) submitText.textContent = "Lưu từ vựng";
  }

  function handleCopyWordJson() {
    const lessonVal = $("#form-word-lesson")?.value;
    const hanziVal = $("#form-word-hanzi")?.value.trim();
    const pinyinVal = $("#form-word-pinyin")?.value.trim();
    const hvVal = $("#form-word-hv")?.value.trim();
    const meaningVal = $("#form-word-meaning")?.value.trim();
    const summaryVal = $("#form-word-summary")?.value.trim();

    const exHanziVal = $("#form-word-ex-hanzi")?.value.trim();
    const exPinyinVal = $("#form-word-ex-pinyin")?.value.trim();
    const exMeaningVal = $("#form-word-ex-meaning")?.value.trim();

    const lessonPrefix = String(lessonVal).startsWith('Mock') ? lessonVal : `l${lessonVal}`;
    const previewItem = {
      id: `${lessonPrefix}-custom-${Date.now().toString(36)}`,
      hanzi: hanziVal || "Hán tự",
      pinyin: pinyinVal || "pinyin",
      hanViet: hvVal || "",
      meaning: meaningVal || "nghĩa",
      lesson: isNaN(lessonVal) || String(lessonVal).includes('_') ? lessonVal : Number(lessonVal),
      characters: customCharBreakdowns.filter(c => c.char && c.char.trim() !== ""),
      summary: summaryVal || "",
      isCustom: true
    };

    if (exHanziVal) {
      previewItem.example = {
        hanzi: exHanziVal,
        pinyin: exPinyinVal || "",
        meaning: exMeaningVal || ""
      };
    }

    const jsonStr = JSON.stringify(previewItem, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(jsonStr).then(() => {
        showToast("📋 Đã sao chép cấu trúc JSON của từ vào bộ nhớ tạm!");
      });
    } else {
      showToast("📋 " + jsonStr.substring(0, 50) + "...");
    }
  }

  // --- Flashcards ---
  function initFlashcards() {
    fcItems = shuffle(getFilteredData());
    fcIndex = 0;
    fcKnown = 0;
    fcUnknown = 0;
    $("#score-known").textContent = "0";
    $("#score-unknown").textContent = "0";
    renderFlashcard();
  }

  function renderFlashcard() {
    if (fcItems.length === 0) return;

    const item = fcItems[fcIndex];
    $("#fc-current").textContent = fcIndex + 1;
    $("#fc-total").textContent = fcItems.length;

    // Front
    $("#fc-hanzi").textContent = item.hanzi;
    $("#fc-pinyin").textContent = item.pinyin;

    // Back
    $("#fc-meaning").textContent = `${item.hanViet} — ${item.meaning}`;
    
    // Etymology for each character
    let etymHtml = item.characters.map(c => 
      `<strong>${c.char}</strong> (${c.pinyin}): ${c.mnemonic}`
    ).join("<br><br>");
    $("#fc-etymology").innerHTML = etymHtml;
    
    $("#fc-mnemonic").textContent = item.summary;

    if (item.example) {
      $("#fc-example").innerHTML = `
        <div class="fc-ex-hanzi">${item.example.hanzi}</div>
        <div class="fc-ex-pinyin">${item.example.pinyin}</div>
        <div class="fc-ex-meaning">${item.example.meaning}</div>
      `;
      $("#fc-example").style.display = "block";
    } else {
      $("#fc-example").style.display = "none";
    }

    // Apply Toggles
    const pinyinVis = $("#toggle-pinyin") && $("#toggle-pinyin").checked ? "visible" : "hidden";
    const meaningVis = $("#toggle-meaning") && $("#toggle-meaning").checked ? "visible" : "hidden";
    
    $("#fc-pinyin").style.visibility = pinyinVis;
    $("#fc-meaning").style.visibility = meaningVis;
    
    if (item.example) {
      const exP = $(".fc-ex-pinyin");
      if (exP) exP.style.visibility = pinyinVis;
      
      const exM = $(".fc-ex-meaning");
      if (exM) exM.style.visibility = meaningVis;
    }

    // Audio Button on Front
    const fcAudioFront = $("#fc-audio-front");
    if (fcAudioFront) {
      fcAudioFront.onclick = (e) => {
        e.stopPropagation();
        speakChinese(item.hanzi);
      };
    }

    // Unflip
    const fc = $("#flashcard");
    fc.classList.remove("flipped");
  }

  function flipCard() {
    $("#flashcard").classList.toggle("flipped");
  }

  // --- Quiz ---
  function initQuiz() {
    const data = getFilteredData();
    if (data.length < 4) return;

    const countSelect = $("#quiz-count-select");
    let count = 10;
    if (countSelect) {
      if (countSelect.value === "all") count = data.length;
      else count = parseInt(countSelect.value) || 10;
    }

    quizItems = shuffle(data).slice(0, Math.min(data.length, count));
    quizIndex = 0;
    quizCorrect = 0;

    $("#quiz-correct").textContent = "0";
    $("#quiz-total-q").textContent = quizItems.length;
    $("#quiz-card").style.display = "block";
    $("#quiz-complete").style.display = "none";

    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    if (quizIndex >= quizItems.length) {
      showQuizComplete();
      return;
    }

    const item = quizItems[quizIndex];
    const allData = getFilteredData();

    // Generate question type randomly
    const qType = Math.random() < 0.5 ? "hanzi-to-meaning" : "meaning-to-hanzi";

    let questionHtml = "";
    let correctAnswer = "";
    let options = [];

    if (qType === "hanzi-to-meaning") {
      questionHtml = `<span class="q-hanzi">${item.hanzi}</span>Chữ trên có nghĩa là gì?`;
      correctAnswer = `${item.hanViet} — ${item.meaning}`;

      // Get 3 wrong options
      const wrongItems = shuffle(allData.filter(d => d.id !== item.id)).slice(0, 3);
      options = shuffle([
        { text: correctAnswer, correct: true },
        ...wrongItems.map(w => ({ text: `${w.hanViet} — ${w.meaning}`, correct: false }))
      ]);
    } else {
      questionHtml = `Nghĩa: <strong>"${item.hanViet} — ${item.meaning}"</strong><br>Chữ Hán nào dưới đây là đúng?`;
      correctAnswer = item.hanzi;

      const wrongItems = shuffle(allData.filter(d => d.id !== item.id)).slice(0, 3);
      options = shuffle([
        { text: item.hanzi, correct: true },
        ...wrongItems.map(w => ({ text: w.hanzi, correct: false }))
      ]);
    }

    $("#quiz-question").innerHTML = questionHtml;
    const optContainer = $("#quiz-options");
    optContainer.innerHTML = options.map((o, i) => `
      <button class="quiz-option" data-correct="${o.correct}" data-index="${i}">
        ${qType === "meaning-to-hanzi" ? `<span style="font-family:var(--font-hanzi);font-size:24px;font-weight:700;">${o.text}</span>` : o.text}
      </button>
    `).join("");

    // Attach handlers
    optContainer.querySelectorAll(".quiz-option").forEach(btn => {
      btn.addEventListener("click", handleQuizAnswer);
    });

    $("#quiz-next-btn").style.display = "none";
  }

  function handleQuizAnswer(e) {
    const btn = e.currentTarget;
    const correct = btn.dataset.correct === "true";
    const allBtns = $$(".quiz-option");

    // Disable all buttons
    allBtns.forEach(b => {
      b.classList.add("disabled");
      b.removeEventListener("click", handleQuizAnswer);
      if (b.dataset.correct === "true") {
        b.classList.add("correct");
      }
    });

    if (correct) {
      quizCorrect++;
      $("#quiz-correct").textContent = quizCorrect;
    } else {
      btn.classList.add("wrong");
    }

    $("#quiz-next-btn").style.display = "block";
  }

  function showQuizComplete() {
    $("#quiz-card").style.display = "none";
    $("#quiz-complete").style.display = "block";

    const pct = Math.round((quizCorrect / quizItems.length) * 100);
    let msg = "";
    if (pct === 100) msg = "🌟 Hoàn hảo! Bạn đã nắm vững tất cả!";
    else if (pct >= 80) msg = "👏 Rất tốt! Chỉ cần ôn lại một chút nữa thôi.";
    else if (pct >= 60) msg = "📚 Khá tốt! Hãy tiếp tục luyện tập nhé.";
    else msg = "💪 Cố gắng thêm nhé! Dùng Flashcard để ôn tập.";

    $("#quiz-result-text").textContent = `${quizCorrect}/${quizItems.length} câu đúng (${pct}%). ${msg}`;
  }

  
  // --- Practice (Matching Game) ---
  function initPractice() {
    const data = getFilteredData();
    if (data.length < 4) return;
    
    // Choose 6 random items or all if less than 6
    const items = shuffle(data).slice(0, Math.min(data.length, 6));
    practiceTotalPairs = items.length;
    practiceMatchedCount = 0;
    practiceSelectedCard = null;
    isPracticeLocked = false;
    
    $("#practice-score").textContent = practiceMatchedCount;
    $("#practice-total").textContent = practiceTotalPairs;
    $("#practice-complete").style.display = "none";
    $("#matching-grid").style.display = "grid";
    
    // Create 2 cards per item (Hanzi and Meaning)
    const cards = [];
    items.forEach(item => {
      cards.push({ type: 'hanzi', text: item.hanzi, id: item.id });
      cards.push({ type: 'meaning', text: item.meaning, id: item.id });
    });
    
    const shuffledCards = shuffle(cards);
    const grid = $("#matching-grid");
    
    grid.innerHTML = shuffledCards.map((card, i) => `
      <div class="match-card" data-id="${card.id}" data-type="${card.type}" data-index="${i}" tabindex="0" role="button" aria-label="Thẻ ghép từ: ${escapeHtml(card.text)}">
        <span class="card-text">${card.text}</span>
      </div>
    `).join('');
    
    // Add event listeners to cards
    grid.querySelectorAll('.match-card').forEach(card => {
      card.addEventListener('click', handleCardClick);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick({ currentTarget: card });
        }
      });
    });
  }
  
  function handleCardClick(e) {
    if (isPracticeLocked) return;
    const clickedCard = e.currentTarget;
    if (clickedCard.classList.contains('matched') || clickedCard.classList.contains('selected')) return;
    
    clickedCard.classList.add('selected');
    
    if (!practiceSelectedCard) {
      // First card selected
      practiceSelectedCard = clickedCard;
    } else {
      // Second card selected, check match
      isPracticeLocked = true;
      const id1 = practiceSelectedCard.dataset.id;
      const id2 = clickedCard.dataset.id;
      const type1 = practiceSelectedCard.dataset.type;
      const type2 = clickedCard.dataset.type;
      
      if (id1 === id2 && type1 !== type2) {
        // Match!
        setTimeout(() => {
          practiceSelectedCard.classList.remove('selected');
          clickedCard.classList.remove('selected');
          practiceSelectedCard.classList.add('matched');
          clickedCard.classList.add('matched');
          
          practiceMatchedCount++;
          $("#practice-score").textContent = practiceMatchedCount;
          
          if (practiceMatchedCount === practiceTotalPairs) {
            setTimeout(() => {
              $("#matching-grid").style.display = "none";
              $("#practice-complete").style.display = "block";
            }, 600);
          }
          
          practiceSelectedCard = null;
          isPracticeLocked = false;
        }, 300);
      } else {
        // No match
        clickedCard.classList.add('error');
        practiceSelectedCard.classList.add('error');
        
        setTimeout(() => {
          clickedCard.classList.remove('selected', 'error');
          practiceSelectedCard.classList.remove('selected', 'error');
          practiceSelectedCard = null;
          isPracticeLocked = false;
        }, 800);
      }
    }
  }


  // --- Event Listeners ---
  function bindEvents() {
    // Nav tabs
    $$(".nav-tab").forEach(tab => {
      tab.addEventListener("click", () => setView(tab.dataset.view));
    });

    // Study status filter buttons
    $$(".study-filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        setStatusFilter(btn.dataset.filter);
      });
    });

    // Lesson select change event
    const lessonSelect = $("#lesson-select");
    if (lessonSelect) {
      lessonSelect.addEventListener("change", (e) => setLesson(e.target.value));
    }

    // Theme Switcher
    const themeSwitcher = $("#theme-switcher");
    const themeToggleBtn = $("#theme-toggle-btn");
    
    themeToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = themeSwitcher.classList.toggle("open");
      themeToggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    document.addEventListener("click", (e) => {
      if (!themeSwitcher.contains(e.target)) {
        themeSwitcher.classList.remove("open");
        themeToggleBtn.setAttribute("aria-expanded", "false");
      }
    });

    $$(".theme-option").forEach(btn => {
      btn.addEventListener("click", () => {
        const theme = btn.dataset.theme;
        setTheme(theme);
        themeSwitcher.classList.remove("open");
        themeToggleBtn.setAttribute("aria-expanded", "false");
      });
    });

    // Modal close
    $("#modal-close").addEventListener("click", closeModal);
    $("#modal-overlay").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeModal();
    });

    // Swipe gestures on modal (mobile word navigation)
    const detailModal = $("#detail-modal");
    if (detailModal) {
      addSwipeListener(detailModal, () => {
        if (isModalOpen) navigateModal(1);
      }, () => {
        if (isModalOpen) navigateModal(-1);
      });
    }

    const modalOverlay = $("#modal-overlay");
    if (modalOverlay) {
      addSwipeListener(modalOverlay, () => {
        if (isModalOpen) navigateModal(1);
      }, () => {
        if (isModalOpen) navigateModal(-1);
      });
    }

    // Swipe gestures on flashcard (mobile card navigation)
    const fcWrapper = $("#flashcard-wrapper");
    if (fcWrapper) {
      addSwipeListener(fcWrapper, () => {
        if (currentView === "flashcard") {
          if (fcIndex < fcItems.length - 1) {
            fcIndex++;
            renderFlashcard();
          } else {
            showToast("Đã xem hết các thẻ flashcard!");
          }
        }
      }, () => {
        if (currentView === "flashcard") {
          if (fcIndex > 0) {
            fcIndex--;
            renderFlashcard();
          } else {
            showToast("Đã là thẻ flashcard đầu tiên!");
          }
        }
      });
    }

    // Flashcard interactions
    const fc = $("#flashcard");
    if (fc) {
      fc.addEventListener("click", flipCard);
      fc.addEventListener("keydown", (e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          flipCard();
        }
      });
    }

    $("#fc-prev").addEventListener("click", () => {
      if (fcIndex > 0) { fcIndex--; renderFlashcard(); }
    });
    $("#fc-next").addEventListener("click", () => {
      if (fcIndex < fcItems.length - 1) { fcIndex++; renderFlashcard(); }
    });
    $("#fc-know").addEventListener("click", () => {
      fcKnown++;
      $("#score-known").textContent = fcKnown;
      if (fcIndex < fcItems.length - 1) { fcIndex++; renderFlashcard(); }
      else showToast('Đã xem hết các thẻ flashcard!');
    });
    $("#fc-dunno").addEventListener("click", () => {
      fcUnknown++;
      $("#score-unknown").textContent = fcUnknown;
      // Push to end for review later
      fcItems.push(fcItems[fcIndex]);
      $("#fc-total").textContent = fcItems.length;
      if (fcIndex < fcItems.length - 1) { fcIndex++; renderFlashcard(); }
    });

    // Flashcard Toggles
    const togglePinyin = $("#toggle-pinyin");
    if (togglePinyin) {
      togglePinyin.addEventListener("change", (e) => {
        const vis = e.target.checked ? "visible" : "hidden";
        $("#fc-pinyin").style.visibility = vis;
        const exP = $(".fc-ex-pinyin");
        if (exP) exP.style.visibility = vis;
      });
    }
    const toggleMeaning = $("#toggle-meaning");
    if (toggleMeaning) {
      toggleMeaning.addEventListener("change", (e) => {
        const vis = e.target.checked ? "visible" : "hidden";
        $("#fc-meaning").style.visibility = vis;
        const exM = $(".fc-ex-meaning");
        if (exM) exM.style.visibility = vis;
      });
    }

    // Quiz
    $("#quiz-next-btn").addEventListener("click", () => {
      quizIndex++;
      renderQuizQuestion();
    });
    $("#quiz-restart-btn").addEventListener("click", initQuiz);
    $("#practice-restart-btn").addEventListener("click", initPractice);
    const quizCountSelect = $("#quiz-count-select");
    if (quizCountSelect) {
      quizCountSelect.addEventListener("change", initQuiz);
    }

    // --- Manual Add Word Modal Events ---
    const btnOpenAddWord = $("#btn-open-add-word");
    if (btnOpenAddWord) {
      btnOpenAddWord.addEventListener("click", () => openAddWordModal(currentLesson));
    }

    const navQuickAddBtn = $("#nav-quick-add-btn");
    if (navQuickAddBtn) {
      navQuickAddBtn.addEventListener("click", () => openAddWordModal(currentLesson));
    }

    const btnAiOpenManual = $("#btn-ai-open-manual");
    if (btnAiOpenManual) {
      btnAiOpenManual.addEventListener("click", () => openAddWordModal(currentLesson));
    }

    const addWordCloseBtn = $("#add-word-close-btn");
    if (addWordCloseBtn) {
      addWordCloseBtn.addEventListener("click", closeAddWordModal);
    }

    const btnCancelAddWord = $("#btn-cancel-add-word");
    if (btnCancelAddWord) {
      btnCancelAddWord.addEventListener("click", closeAddWordModal);
    }

    const addWordOverlay = $("#add-word-modal-overlay");
    if (addWordOverlay) {
      addWordOverlay.addEventListener("click", (e) => {
        if (e.target === e.currentTarget) closeAddWordModal();
      });
    }

    const formWordHanzi = $("#form-word-hanzi");
    if (formWordHanzi) {
      formWordHanzi.addEventListener("input", (e) => {
        handleHanziInputAssist(e.target.value.trim());
      });
    }

    const btnAddCharManual = $("#btn-add-char-manual");
    if (btnAddCharManual) {
      btnAddCharManual.addEventListener("click", () => {
        customCharBreakdowns.push({
          char: "",
          pinyin: "",
          structure: "",
          story: "",
          mnemonic: ""
        });
        renderCharBreakdownBlocks();
        const inputs = $$(".char-card-input-char");
        if (inputs.length > 0) {
          inputs[inputs.length - 1].focus();
        }
      });
    }

    const btnCopyWordJson = $("#btn-copy-word-json");
    if (btnCopyWordJson) {
      btnCopyWordJson.addEventListener("click", handleCopyWordJson);
    }

    const addWordForm = $("#add-word-form");
    if (addWordForm) {
      addWordForm.addEventListener("submit", handleAddWordSubmit);
    }

    // Global Keyboard Navigation
    document.addEventListener("keydown", (e) => {
      // Add Word Modal Escape & key isolation
      if (isAddWordModalOpen) {
        if (e.key === "Escape") {
          closeAddWordModal();
        }
        return;
      }

      const isInputActive = document.activeElement && (
        document.activeElement.tagName === "INPUT" || 
        document.activeElement.tagName === "TEXTAREA"
      );

      // Shortcut: Cmd+K or Ctrl+K or '/' to focus search
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !isInputActive)) {
        e.preventDefault();
        const searchInput = $("#search-input");
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // Modal Navigation
      if (isModalOpen) {
        if (e.key === "Escape") { closeModal(); return; }
        
        if (e.key === "ArrowLeft") {
          navigateModal(-1);
        } else if (e.key === "ArrowRight") {
          navigateModal(1);
        } else if (e.key.toLowerCase() === "s" || e.key.toLowerCase() === "p") {
          const item = LESSON_DATA.find(d => d.id === currentModalId);
          if (item) speakChinese(item.hanzi);
        } else if (e.key.toLowerCase() === "m") {
          toggleMastered(currentModalId);
          const m = isMastered(currentModalId);
          const mBtn = $(".modal-mastery-btn");
          if (mBtn) {
            mBtn.classList.toggle("mastered", m);
            mBtn.textContent = m ? '✓ Đã thuộc — nhấn để bỏ đánh dấu' : '☐ Đánh dấu là đã thuộc';
          }
          renderStudyGrid();
        }
        return;
      }

      // Escape to blur search
      if (e.key === "Escape" && document.activeElement === $("#search-input")) {
        $("#search-input").blur();
        return;
      }
      
      // Flashcard Navigation
      if (currentView === "flashcard" && !isInputActive) {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); flipCard(); }
        if (e.key === "ArrowLeft") { if (fcIndex > 0) { fcIndex--; renderFlashcard(); } }
        if (e.key === "ArrowRight") { if (fcIndex < fcItems.length - 1) { fcIndex++; renderFlashcard(); } }
        if (e.key === "1") { $("#fc-know")?.click(); }
        if (e.key === "2") { $("#fc-dunno")?.click(); }
        if (e.key.toLowerCase() === "s" || e.key.toLowerCase() === "p") {
          if (fcItems[fcIndex]) speakChinese(fcItems[fcIndex].hanzi);
        }
      }
    });

    // Search logic
    const searchInput = $("#search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value;
        updateProgressBar();
        if (currentView === "study") renderStudyGrid();
        if (currentView === "flashcard") initFlashcards();
        if (currentView === "quiz") initQuiz();
        if (currentView === "practice") initPractice();
      });
    }
  }

  // --- Init ---
  function init() {
    bindEvents();
    
    // Load saved theme
    const savedTheme = localStorage.getItem('tocfl_theme') || 'light';
    setTheme(savedTheme);

    const lessonSelect = $("#lesson-select");
    if (lessonSelect) {
      currentLesson = lessonSelect.value || "3_1";
    }

    // Preload speech synthesis voices
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }

    renderStudyGrid();
    updateProgressBar();
  }

  // Run when DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
