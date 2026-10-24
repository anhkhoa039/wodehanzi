/**
 * mindmap.js — Màn hình "Sơ đồ": vẽ mindmap toả tròn (SVG thuần) cho bài đang chọn.
 * Đọc cách chia chủ đề từ window.LESSON_MINDMAPS (js/mindmaps.js), dữ liệu từ LESSON_DATA.
 * Được load sau app.js; app.js gọi window.initMindmap(lesson) khi mở tab hoặc đổi bài.
 */

(function () {
  'use strict';

  // ── Kích thước bố cục (đơn vị SVG) ───────────────────────────────
  const CENTER_R = 78;
  const BRANCH_RING = 260;
  const WORD_RING = 330;   // khoảng cách khởi điểm của cụm từ, sẽ lùi ra nếu chạm
  const NODE_W = 112;
  const NODE_H = 54;
  const NODE_GAP = 12;
  const BRANCH_W = 150;
  const BRANCH_H = 52;
  const SECTOR_PAD = 1.4;   // khoảng trống giữa các nhánh, tính theo "số từ"
  const MIN_ZOOM_W = 300;   // viewBox hẹp nhất (phóng to tối đa)
  const MAX_ZOOM_W = 6000;  // viewBox rộng nhất (thu nhỏ tối đa)

  // Màu đủ đậm để chữ trắng đọc được trên nút nhánh, ở cả 4 giao diện.
  const BRANCH_COLORS = ['#0f766e', '#b45309', '#7c3aed', '#be123c', '#1d4ed8', '#4d7c0f', '#c2410c', '#475569'];

  let state = null;

  function $(sel) { return document.querySelector(sel); }

  function escapeXml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Từ dài (vd 高級管理人員工商碩士) thu nhỏ cỡ chữ Hán cho vừa ô; tối thiểu 10px.
  // HANZI_FONT phải bằng font-size của .mm-word-hanzi trong css/style.css.
  const HANZI_FONT = 20;
  function hanziFontStyle(hanzi) {
    const fit = Math.floor((NODE_W - 12) / [...hanzi].length);
    return fit < HANZI_FONT ? ` style="font-size:${Math.max(10, fit)}px"` : '';
  }

  // Nghĩa ngắn: phần trước dấu phẩy/chấm phẩy/ngoặc đầu tiên, tối đa 16 ký tự.
  function shortMeaning(meaning) {
    const first = String(meaning || '').split(/[,;(（，；]/)[0].trim();
    return first.length > 16 ? first.slice(0, 15).trim() + '…' : first;
  }

  function polar(r, theta) { return { x: r * Math.cos(theta), y: r * Math.sin(theta) }; }

  // ── Tính bố cục ───────────────────────────────────────────────────
  function computeLayout(config) {
    const branches = config.branches.map((b, i) => {
      const words = b.ids.map(id => {
        const word = LESSON_DATA.find(d => d.id === id);
        if (!word) console.warn(`[mindmap] Không tìm thấy từ "${id}" (nhánh "${b.label}")`);
        return word;
      }).filter(Boolean);
      return { label: b.label, icon: b.icon, color: BRANCH_COLORS[i % BRANCH_COLORS.length], words };
    }).filter(b => b.words.length);

    const totalWeight = branches.reduce((sum, b) => sum + b.words.length + SECTOR_PAD, 0);
    const unitAngle = Math.PI * 2 / totalWeight;
    let angle = -Math.PI / 2; // nhánh đầu tiên bắt đầu ở đỉnh

    // Hộp đã đặt; mỗi nút mới được đẩy ra xa theo bán kính cho đến khi không chạm hộp nào.
    const placed = [{ x: 0, y: 0, w: CENTER_R * 2, h: CENTER_R * 2 }];
    const place = (r, theta, w, h) => {
      let pos = polar(r, theta);
      while (placed.some(p => overlaps(p, { x: pos.x, y: pos.y, w, h }))) {
        r += 6;
        pos = polar(r, theta);
      }
      placed.push({ x: pos.x, y: pos.y, w, h });
      return pos;
    };

    branches.forEach(b => {
      const span = (b.words.length + SECTOR_PAD) * unitAngle;
      b.a0 = angle + (SECTOR_PAD / 2) * unitAngle;
      b.a1 = angle + span - (SECTOR_PAD / 2) * unitAngle;
      b.mid = (b.a0 + b.a1) / 2;
      b.width = Math.max(BRANCH_W, b.label.length * 7.4 + 44);
      angle += span;
      Object.assign(b, place(BRANCH_RING, b.mid, b.width, BRANCH_H));
    });

    // Từ của mỗi nhánh gom thành một cụm lưới nằm ngoài nút nhánh, theo hướng của nhánh,
    // để các nhóm không lẫn vào nhau.
    branches.forEach(b => {
      const n = b.words.length;
      const cols = n <= 4 ? 2 : n <= 9 ? 3 : 4;
      const rows = Math.ceil(n / cols);
      const w = cols * NODE_W + (cols - 1) * NODE_GAP;
      const h = rows * NODE_H + (rows - 1) * NODE_GAP;
      const c = place(WORD_RING, b.mid, w, h);
      b.nodes = b.words.map((word, i) => {
        const row = Math.floor(i / cols);
        const inRow = Math.min(cols, n - row * cols); // hàng cuối có thể thiếu, căn giữa
        const col = i % cols;
        return {
          word,
          x: c.x + (col - (inRow - 1) / 2) * (NODE_W + NODE_GAP),
          y: c.y + (row - (rows - 1) / 2) * (NODE_H + NODE_GAP),
        };
      });
    });

    return branches;
  }

  // Hai hộp (toạ độ tâm) có chạm nhau không, chừa khoảng cách NODE_GAP.
  function overlaps(a, b) {
    return Math.abs(a.x - b.x) < (a.w + b.w) / 2 + NODE_GAP
        && Math.abs(a.y - b.y) < (a.h + b.h) / 2 + NODE_GAP;
  }

  // ── Vẽ SVG ────────────────────────────────────────────────────────
  function curve(x1, y1, x2, y2) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    // Uốn nhẹ đường nối bằng điểm điều khiển kéo về phía tâm.
    return `M${x1.toFixed(1)},${y1.toFixed(1)} Q${(mx * 0.9).toFixed(1)},${(my * 0.9).toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
  }

  function renderSvg(config, branches) {
    let edges = '';
    let nodes = '';

    branches.forEach((b, bi) => {
      edges += `<path class="mm-edge mm-edge-main" d="${curve(0, 0, b.x, b.y)}" style="--mm-c:${b.color}"/>`;

      let wordEdges = '';
      let wordNodes = '';
      b.nodes.forEach(n => {
        const w = n.word;
        wordEdges += `<path class="mm-edge" d="${curve(b.x, b.y, n.x, n.y)}"/>`;
        wordNodes += `
          <g class="mm-word" data-id="${escapeXml(w.id)}" tabindex="0" role="button"
             aria-label="${escapeXml(`${w.hanzi} — ${w.pinyin} — ${w.hanViet}: ${w.meaning}`)}"
             transform="translate(${n.x.toFixed(1)},${n.y.toFixed(1)})">
            <rect x="${-NODE_W / 2}" y="${-NODE_H / 2}" width="${NODE_W}" height="${NODE_H}" rx="12"/>
            <text class="mm-word-hanzi" y="-4"${hanziFontStyle(w.hanzi)}>${escapeXml(w.hanzi)}</text>
            <text class="mm-word-meaning" y="16">${escapeXml(shortMeaning(w.meaning))}</text>
          </g>`;
      });

      // Đường nối vẽ dưới nút nhánh; nút nhánh đứng trước các từ trong DOM để phím Tab
      // tới nút thu gọn trước rồi mới đến các từ của nhánh.
      nodes += `
        <g class="mm-branch-group" data-branch="${bi}" style="--mm-c:${b.color}">
          <g class="mm-branch-words">${wordEdges}</g>
          <g class="mm-branch" data-branch="${bi}" tabindex="0" role="button" aria-expanded="true"
             aria-label="${escapeXml(`Nhánh ${b.label}, ${b.words.length} từ. Bấm để thu gọn hoặc mở`)}"
             transform="translate(${b.x.toFixed(1)},${b.y.toFixed(1)})">
            <rect x="${-b.width / 2}" y="${-BRANCH_H / 2}" width="${b.width}" height="${BRANCH_H}" rx="${BRANCH_H / 2}"/>
            <text class="mm-branch-label" y="-3">${escapeXml(`${b.icon} ${b.label}`)}</text>
            <text class="mm-branch-count" y="15">${b.words.length} từ</text>
          </g>
          <g class="mm-branch-words">${wordNodes}</g>
        </g>`;
    });

    const center = `
      <g class="mm-center">
        <circle r="${CENTER_R}"/>
        <text class="mm-center-title" y="${config.subtitle ? -6 : 8}">${escapeXml(config.title)}</text>
        ${config.subtitle ? `<text class="mm-center-subtitle" y="20">${escapeXml(config.subtitle)}</text>` : ''}
      </g>`;

    return `<g class="mm-edges">${edges}</g>${nodes}${center}`;
  }

  // Khung bao toàn bộ nút để "Vừa màn hình".
  function computeBounds(branches) {
    let minX = -CENTER_R, maxX = CENTER_R, minY = -CENTER_R, maxY = CENTER_R;
    branches.forEach(b => {
      minX = Math.min(minX, b.x - b.width / 2); maxX = Math.max(maxX, b.x + b.width / 2);
      minY = Math.min(minY, b.y - BRANCH_H / 2); maxY = Math.max(maxY, b.y + BRANCH_H / 2);
      b.nodes.forEach(n => {
        minX = Math.min(minX, n.x - NODE_W / 2); maxX = Math.max(maxX, n.x + NODE_W / 2);
        minY = Math.min(minY, n.y - NODE_H / 2); maxY = Math.max(maxY, n.y + NODE_H / 2);
      });
    });
    const pad = 24;
    return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
  }

  // ── Kéo / phóng to ────────────────────────────────────────────────
  function applyViewBox() {
    const v = state.view;
    state.svg.setAttribute('viewBox', `${v.x} ${v.y} ${v.w} ${v.h}`);
  }

  function fitToScreen() {
    if (!state) return;
    state.view = Object.assign({}, state.bounds);
    applyViewBox();
  }

  // Đổi toạ độ màn hình sang toạ độ SVG.
  function toSvgPoint(clientX, clientY) {
    const pt = state.svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(state.svg.getScreenCTM().inverse());
  }

  // factor < 1 là phóng to; giữ nguyên điểm (cx, cy) dưới tay người dùng.
  function zoomAt(factor, cx, cy) {
    const v = state.view;
    const newW = Math.min(MAX_ZOOM_W, Math.max(MIN_ZOOM_W, v.w * factor));
    const f = newW / v.w;
    v.x = cx - (cx - v.x) * f;
    v.y = cy - (cy - v.y) * f;
    v.w *= f;
    v.h *= f;
    applyViewBox();
  }

  function zoomCenter(factor) {
    if (!state) return;
    const v = state.view;
    zoomAt(factor, v.x + v.w / 2, v.y + v.h / 2);
  }

  function bindPanZoom(svg) {
    const pointers = new Map();
    let pinchDist = 0;

    // Mức phóng tỷ lệ với độ lớn của lần cuộn, để trackpad (nhiều sự kiện nhỏ) không nhảy vọt.
    svg.addEventListener('wheel', e => {
      e.preventDefault();
      if (!e.deltaY) return;
      const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1);
      const p = toSvgPoint(e.clientX, e.clientY);
      hideTooltip();
      zoomAt(Math.exp(Math.max(-100, Math.min(100, delta)) * 0.0015), p.x, p.y);
    }, { passive: false });

    svg.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return; // chỉ kéo bằng chuột trái
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      state.dragDistance = 0;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      }
    });

    svg.addEventListener('pointermove', e => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      // Nhả chuột ở ngoài sơ đồ trước khi kịp capture: kết thúc thao tác kéo.
      if (e.pointerType === 'mouse' && e.buttons === 0) return endPointer(e);
      const cur = { x: e.clientX, y: e.clientY };
      pointers.set(e.pointerId, cur);

      if (pointers.size === 1) {
        const dx = cur.x - prev.x;
        const dy = cur.y - prev.y;
        state.dragDistance += Math.abs(dx) + Math.abs(dy);
        if (state.dragDistance > 6 && !svg.hasPointerCapture(e.pointerId)) {
          svg.setPointerCapture(e.pointerId);
          svg.classList.add('is-dragging');
          hideTooltip();
        }
        if (state.dragDistance > 6) {
          const ctm = svg.getScreenCTM();
          state.view.x -= dx / ctm.a;
          state.view.y -= dy / ctm.d;
          applyViewBox();
        }
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDist > 0 && dist > 0) {
          const mid = toSvgPoint((a.x + b.x) / 2, (a.y + b.y) / 2);
          zoomAt(pinchDist / dist, mid.x, mid.y);
        }
        pinchDist = dist;
        state.dragDistance = 999; // chụm không được tính là bấm
      }
    });

    function endPointer(e) {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchDist = 0;
      if (!pointers.size) svg.classList.remove('is-dragging');
    }
    svg.addEventListener('pointerup', endPointer);
    svg.addEventListener('pointercancel', endPointer);
    svg.addEventListener('lostpointercapture', endPointer);
    svg.addEventListener('pointerleave', e => {
      if (!svg.hasPointerCapture(e.pointerId)) endPointer(e);
    });
  }

  // ── Tooltip pinyin + Hán-Việt ─────────────────────────────────────
  function showTooltip(node) {
    const tip = $('#mindmap-tooltip');
    const item = LESSON_DATA.find(d => d.id === node.dataset.id);
    if (!tip || !item) return;
    tip.innerHTML = `<span class="mm-tip-pinyin">${escapeXml(item.pinyin)}</span>`
      + `<span class="mm-tip-hanviet">${escapeXml(item.hanViet)}</span>`
      + `<span class="mm-tip-hint">Bấm để xem chi tiết</span>`;
    const box = node.getBoundingClientRect();
    const host = $('#mindmap-stage').getBoundingClientRect();
    // Sát mép trên khung thì hiện tooltip bên dưới nút để không bị cắt.
    const below = box.top - host.top < tip.offsetHeight + 16;
    tip.classList.toggle('below', below);
    tip.style.left = `${Math.min(Math.max(box.left - host.left + box.width / 2, 80), host.width - 80)}px`;
    tip.style.top = `${(below ? box.bottom : box.top) - host.top}px`;
    tip.classList.add('visible');
  }

  function hideTooltip() {
    const tip = $('#mindmap-tooltip');
    if (tip) tip.classList.remove('visible');
  }

  // Nút được focus bằng bàn phím mà nằm ngoài khung nhìn thì dời khung tới nó.
  function revealNode(node) {
    const m = node.transform.baseVal.consolidate().matrix;
    const v = state.view;
    const margin = NODE_W;
    if (m.e < v.x + margin || m.e > v.x + v.w - margin || m.f < v.y + margin || m.f > v.y + v.h - margin) {
      v.x = m.e - v.w / 2;
      v.y = m.f - v.h / 2;
      applyViewBox();
    }
  }

  // ── Tương tác nút ─────────────────────────────────────────────────
  function toggleBranch(branchNode) {
    const group = branchNode.closest('.mm-branch-group');
    const collapsed = group.classList.toggle('collapsed');
    branchNode.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  }

  function openWord(wordNode) {
    hideTooltip();
    if (typeof window.openModal === 'function') window.openModal(wordNode.dataset.id);
  }

  function bindNodeEvents(svg) {
    svg.addEventListener('click', e => {
      if (state.dragDistance > 6) return; // vừa kéo/chụm, không tính là bấm
      const word = e.target.closest('.mm-word');
      if (word) return openWord(word);
      const branch = e.target.closest('.mm-branch');
      if (branch) toggleBranch(branch);
    });

    svg.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (document.querySelector('#modal-overlay.open')) return; // modal đang mở phía trên
      const word = e.target.closest('.mm-word');
      const branch = e.target.closest('.mm-branch');
      if (!word && !branch) return;
      e.preventDefault();
      if (word) openWord(word);
      else toggleBranch(branch);
    });

    svg.addEventListener('pointerover', e => {
      if (e.pointerType !== 'mouse') return;
      const word = e.target.closest('.mm-word');
      if (word) showTooltip(word);
    });
    svg.addEventListener('pointerout', e => {
      const word = e.target.closest('.mm-word');
      if (word && !word.contains(e.relatedTarget)) hideTooltip();
    });
    svg.addEventListener('focusin', e => {
      const node = e.target.closest('.mm-word, .mm-branch');
      if (!node) return;
      revealNode(node);
      if (node.classList.contains('mm-word')) showTooltip(node);
    });
    svg.addEventListener('focusout', hideTooltip);
  }

  // ── Khởi tạo ──────────────────────────────────────────────────────
  function renderEmpty(container) {
    // Khóa dạng "3_7" = Book 3, bài 7; gom tên bài theo từng quyển.
    const byBook = {};
    for (const [key, m] of Object.entries(window.LESSON_MINDMAPS || {})) {
      const book = key.includes('_') ? key.split('_')[0] : '';
      (byBook[book] = byBook[book] || []).push(m.title);
    }
    const available = Object.entries(byBook)
      .map(([book, titles]) => `${book ? `Book ${book} ` : ''}${titles.join('、')}`).join('; ');
    const hint = available
      ? `Hiện có sơ đồ từ vựng cho ${escapeXml(available)}. Hãy chọn một bài trong mục “Bài học”.`
      : 'Hiện chưa có sơ đồ từ vựng nào.';
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon" aria-hidden="true">🗺️</div>
        <h3>Chưa có sơ đồ cho bài này</h3>
        <p>${hint}</p>
      </div>`;
  }

  function initMindmap(lesson) {
    const container = $('#mindmap-container');
    if (!container) return;
    hideTooltip();

    const config = (window.LESSON_MINDMAPS || {})[String(lesson)];
    if (!config) {
      state = null;
      renderEmpty(container);
      return;
    }

    // Đã vẽ bài này rồi thì giữ nguyên vị trí kéo/phóng và trạng thái thu gọn.
    if (state && state.lesson === String(lesson) && container.contains(state.svg)) return;

    const branches = computeLayout(config);
    container.innerHTML = `
      <div class="mindmap-stage" id="mindmap-stage">
        <svg class="mindmap-svg" id="mindmap-svg" role="group" xmlns="http://www.w3.org/2000/svg"
             aria-label="${escapeXml(`Sơ đồ từ vựng ${config.title} ${config.subtitle || ''}`)}"
             preserveAspectRatio="xMidYMid meet">${renderSvg(config, branches)}</svg>
        <div class="mindmap-tooltip" id="mindmap-tooltip" role="tooltip"></div>
      </div>`;

    const svg = $('#mindmap-svg');
    state = { lesson: String(lesson), svg, bounds: computeBounds(branches), view: null, dragDistance: 0 };
    fitToScreen();
    bindPanZoom(svg);
    bindNodeEvents(svg);
  }

  function bindControls() {
    const fit = $('#mindmap-fit-btn');
    const zoomIn = $('#mindmap-zoom-in-btn');
    const zoomOut = $('#mindmap-zoom-out-btn');
    if (fit) fit.addEventListener('click', () => { hideTooltip(); fitToScreen(); });
    if (zoomIn) zoomIn.addEventListener('click', () => { hideTooltip(); zoomCenter(1 / 1.25); });
    if (zoomOut) zoomOut.addEventListener('click', () => { hideTooltip(); zoomCenter(1.25); });
  }

  window.initMindmap = initMindmap;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindControls);
  } else {
    bindControls();
  }
})();
