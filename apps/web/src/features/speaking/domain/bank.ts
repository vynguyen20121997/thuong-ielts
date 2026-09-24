import type { SpeakingQuestion, TopicPack } from "./types";

/*
  Bộ đề dự đoán — TẠM để trong code.

  Đúng luật của dự án là nội dung nằm ở Postgres. Để đây vì phần Speaking mới
  dựng giao diện, chưa có bảng; khi có `speaking_questions` thì
  `server/speakingRepository.ts` thay file này và UI không đổi dòng nào — UI
  chỉ nhận `SpeakingQuestion[]` qua props. Đề dưới đây là đề luyện mẫu để nhìn
  giao diện, cô sẽ thay bằng bộ dự đoán thật.
*/
export const QUESTION_BANK: SpeakingQuestion[] = [
  {
    id: "p1-hometown-1",
    part: 1,
    topic: "Hometown",
    prompt: "Where is your hometown, and what is it known for?",
    set: "Q3–Q4 2026",
  },
  {
    id: "p1-work-study-1",
    part: 1,
    topic: "Work & study",
    prompt: "Do you prefer studying in the morning or in the evening? Why?",
    set: "Q3–Q4 2026",
  },
  {
    id: "p1-weather-1",
    part: 1,
    topic: "Weather",
    prompt: "What kind of weather do you like most?",
    set: "Q3–Q4 2026",
  },
  {
    id: "p2-skill-older-person",
    part: 2,
    topic: "People",
    prompt: "Describe a skill you learned from an older person.",
    bullets: [
      "what the skill is",
      "who taught you",
      "how you learned it",
      "and explain how this skill is useful to you now",
    ],
    set: "Q3–Q4 2026",
  },
  {
    id: "p2-place-water",
    part: 2,
    topic: "Places",
    prompt: "Describe a place near water that you enjoyed visiting.",
    bullets: [
      "where it is",
      "when you went there",
      "what you did there",
      "and explain why you enjoyed it",
    ],
    set: "Q3–Q4 2026",
  },
  {
    id: "p2-app-useful",
    part: 2,
    topic: "Technology",
    prompt: "Describe an app you find useful.",
    bullets: [
      "what the app is",
      "how you found out about it",
      "how often you use it",
      "and explain why you find it useful",
    ],
    set: "Q3–Q4 2026",
  },
  {
    id: "p3-education-teachers-parents",
    part: 3,
    topic: "Education",
    prompt:
      "Do you think children learn better from teachers or from their parents?",
    set: "Q3–Q4 2026",
  },
  {
    id: "p3-technology-old-people",
    part: 3,
    topic: "Technology",
    prompt: "Why do some older people find new technology difficult to use?",
    set: "Q3–Q4 2026",
  },
  {
    id: "p3-tourism-limit",
    part: 3,
    topic: "Tourism",
    prompt:
      "Should governments limit the number of tourists visiting popular places?",
    set: "Q3–Q4 2026",
  },
];

export function questionById(id: string): SpeakingQuestion | undefined {
  return QUESTION_BANK.find((q) => q.id === id);
}

/*
  Gói chủ đề cho "bốc chủ đề". Cùng lý do tạm để trong code như trên; sau này
  máy sinh theo chủ đề bốc được, qua cổng `TopicProvider`.
*/
export const TOPIC_PACKS: TopicPack[] = [
  {
    topic: "Tourism & local culture",
    part: 3,
    headline: "Vì sao du lịch làm thay đổi văn hoá địa phương",
    background:
      "Khách du lịch mang tiền nhưng cũng mang kỳ vọng. Nhà hàng đổi thực đơn cho vừa vị khách, lễ hội bị rút gọn cho vừa lịch tour, và nghề truyền thống chuyển từ phục vụ cộng đồng sang trình diễn cho người xem. Điểm để tranh luận: đó là mất mát, hay là cách để văn hoá sống được?",
    points: [
      "Ví dụ gần: phố cổ Hội An — đèn lồng vốn treo dịp rằm, nay treo cả năm.",
      "Câu hỏi Part 3 hay gặp: Should governments limit tourist numbers?",
      "Lập trường dễ nói: ủng hộ có điều kiện, kèm một ví dụ và một cái giá phải trả.",
    ],
    vocab: [
      {
        word: "commodify",
        ipa: "/kəˈmɒdɪfaɪ/",
        meaning: "biến thành hàng hoá",
      },
      { word: "authentic experience", meaning: "trải nghiệm nguyên bản" },
      { word: "overtourism", meaning: "quá tải du lịch" },
      { word: "preserve heritage", meaning: "bảo tồn di sản" },
      { word: "a double-edged sword", meaning: "lợi và hại đi cùng nhau" },
      { word: "cater to", meaning: "chiều theo" },
    ],
    questions: [
      "Should governments limit the number of tourists visiting popular places?",
      "Does tourism help or harm traditional culture?",
      "How can local people benefit more from tourism?",
    ],
  },
  {
    topic: "Work-life balance",
    part: 3,
    headline: "Làm nhiều hơn có đồng nghĩa với sống tốt hơn không",
    background:
      "Công nghệ xoá ranh giới giữa giờ làm và giờ nghỉ: email đến lúc ăn tối, họp qua điện thoại cuối tuần. Một số nước thử tuần làm bốn ngày và thấy năng suất không giảm. Điểm để tranh luận: ai chịu trách nhiệm giữ cân bằng — cá nhân, công ty, hay luật?",
    points: [
      "Ví dụ: một số công ty ở Việt Nam đã cho làm từ xa hai ngày mỗi tuần sau 2021.",
      "Câu hỏi Part 3 hay gặp: Is it the employer's job to protect employees' free time?",
      "Lập trường dễ nói: cả hai phía đều có phần, kèm một ví dụ từ chính bạn.",
    ],
    vocab: [
      { word: "burnout", ipa: "/ˈbɜːnaʊt/", meaning: "kiệt sức vì công việc" },
      { word: "switch off", meaning: "ngừng nghĩ về công việc" },
      { word: "flexible hours", meaning: "giờ làm linh hoạt" },
      { word: "be on call", meaning: "phải sẵn sàng khi được gọi" },
      { word: "productivity", ipa: "/ˌprɒdʌkˈtɪvəti/", meaning: "năng suất" },
      { word: "set boundaries", meaning: "đặt ranh giới" },
    ],
    questions: [
      "Is it the employer's responsibility to protect employees' free time?",
      "Why do some people choose to work very long hours?",
      "Will a four-day working week become common?",
    ],
  },
  {
    topic: "A memorable journey",
    part: 2,
    headline: "Kể một chuyến đi sao cho đủ 2 phút",
    background:
      "Part 2 không chấm chuyện của bạn hay tới đâu, chấm việc bạn nói liền mạch được bao lâu. Cách chắc nhất: bám đúng bốn gạch đầu dòng trên cue card, mỗi gạch hai đến ba câu, rồi dành 20 giây cuối cho câu 'and explain…'.",
    points: [
      "Một phút ghi chú: viết TỪ KHOÁ cho từng gạch đầu dòng, không viết câu.",
      "Hết ý sớm thì thêm chi tiết giác quan: thấy gì, nghe gì, mùi gì.",
      "Không cần chuyện thật. Chuyện bịa mà kể trôi vẫn được điểm cao hơn chuyện thật mà ấp úng.",
    ],
    vocab: [
      { word: "off the beaten track", meaning: "ít người lui tới" },
      { word: "a change of scenery", meaning: "đổi không khí" },
      {
        word: "breathtaking",
        ipa: "/ˈbreθteɪkɪŋ/",
        meaning: "đẹp đến nghẹt thở",
      },
      { word: "wander around", meaning: "đi lang thang" },
      { word: "it dawned on me", meaning: "tôi chợt nhận ra" },
      { word: "looking back", meaning: "nhìn lại thì" },
    ],
    questions: [
      "Describe a journey you remember well. You should say: where you went, who you went with, what you did there, and explain why you remember it.",
      "Describe a place you would like to visit again.",
    ],
  },
  {
    topic: "Daily routine",
    part: 1,
    headline: "Nói về một ngày của bạn cho tự nhiên",
    background:
      "Part 1 hỏi những việc bạn làm hằng ngày. Điểm rơi không nằm ở ý hay, mà ở việc trả lời đủ hai câu: câu đầu trả lời thẳng, câu sau thêm lý do hoặc ví dụ.",
    points: [
      "Trả lời thẳng trước, giải thích sau — không mở bài.",
      "Mỗi câu 20–30 giây là vừa; dài hơn giám khảo sẽ ngắt.",
      "Có sẵn 3 cụm thời gian: in the morning, after work, before bed.",
    ],
    vocab: [
      { word: "get up early", meaning: "dậy sớm" },
      {
        word: "commute",
        ipa: "/kəˈmjuːt/",
        meaning: "đi làm / đi học hằng ngày",
      },
      { word: "wind down", meaning: "thư giãn cuối ngày" },
      { word: "a creature of habit", meaning: "người sống theo thói quen" },
      { word: "squeeze in", meaning: "chen thêm việc vào lịch" },
    ],
    questions: [
      "What do you usually do in the morning?",
      "Do you prefer to plan your day or take it as it comes?",
      "What is the best part of your day?",
    ],
  },
];
