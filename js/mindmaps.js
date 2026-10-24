/**
 * mindmaps.js — Bảng chia chủ đề cho màn hình "Sơ đồ" (mindmap) theo từng bài.
 * Khóa là giá trị `lesson` trong LESSON_DATA; `ids` là id từ vựng trong data.js.
 * Thêm sơ đồ cho bài mới chỉ cần thêm một mục vào đây, không phải sửa code.
 */
window.LESSON_MINDMAPS = {
  "3_7": {
    title: "第七課",
    subtitle: "我最親的家「人」",
    branches: [
      {
        label: "Thú cưng & chăm sóc", icon: "🐶",
        ids: ["b3_7-04", "b3_7-10", "b3_7-13", "b3_7-29", "b3_7-09", "b3_7-16", "b3_7-15", "b3_7-14",
              "b3_7-24", "b3_7-25", "b3_7-26", "b3_7-31", "b3_7-34", "b3_7-18", "b3_7-05", "b3_7-17"]
      },
      {
        label: "Người trong nhà", icon: "👵",
        ids: ["b3_7-01", "b3_7-02", "b3_7-07", "b3_7-46", "b3_7-42", "b3_7-43", "b3_7-03", "b3_7-59"]
      },
      {
        label: "Kiểu gia đình", icon: "🏠",
        ids: ["b3_7-35", "b3_7-30", "b3_7-49", "b3_7-60", "b3_7-61", "b3_7-28", "b3_7-41", "b3_7-68",
              "b3_7-50", "b3_7-51"]
      },
      {
        label: "Trách nhiệm & giá trị", icon: "⚖️",
        ids: ["b3_7-63", "b3_7-64", "b3_7-62", "b3_7-66", "b3_7-69", "b3_7-67", "b3_7-36"]
      },
      {
        label: "Cảm xúc & trạng thái", icon: "💭",
        ids: ["b3_7-11", "b3_7-12", "b3_7-21", "b3_7-37", "b3_7-22", "b3_7-52", "b3_7-54", "b3_7-55",
              "b3_7-57"]
      },
      {
        label: "Hành động & sinh hoạt", icon: "🤝",
        ids: ["b3_7-19", "b3_7-20", "b3_7-23", "b3_7-27", "b3_7-32", "b3_7-33", "b3_7-38", "b3_7-44",
              "b3_7-45", "b3_7-48", "b3_7-53", "b3_7-56"]
      },
      {
        label: "Hư từ & cụm cố định", icon: "💬",
        ids: ["b3_7-06", "b3_7-08", "b3_7-39", "b3_7-40", "b3_7-47", "b3_7-58", "b3_7-70", "b3_7-65",
              "b3_7-75"]
      },
      {
        label: "Tên riêng", icon: "⭐",
        ids: ["b3_7-71", "b3_7-72", "b3_7-73", "b3_7-74"]
      }
    ]
  }
};
