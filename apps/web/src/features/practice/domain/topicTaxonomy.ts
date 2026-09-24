export const IELTS_TOPICS = [
  "Education",
  "Environment",
  "Science & Technology",
  "Health",
  "Society & Culture",
  "Business & Economics",
  "History & Archaeology",
  "Nature & Animals",
  "Travel & Transport",
  "Psychology",
  "Arts & Media",
] as const;

export type IeltsTopic = (typeof IELTS_TOPICS)[number];

const KEYWORDS: Record<IeltsTopic, string[]> = {
  Education: ["education", "school", "student", "teacher", "learning", "university", "giáo dục", "trẻ em"],
  Environment: ["environment", "climate", "pollution", "energy", "waste", "water", "môi trường", "khí hậu", "năng lượng"],
  "Science & Technology": ["science", "technology", "computer", "robot", "space", "engineering", "khoa học", "công nghệ", "kỹ thuật", "vũ trụ"],
  Health: ["health", "medicine", "medical", "sleep", "disease", "food", "y tế", "y học", "dược"],
  "Society & Culture": ["society", "culture", "language", "population", "social", "xã hội", "văn hoá", "văn hóa", "ngôn ngữ"],
  "Business & Economics": ["business", "economic", "marketing", "company", "work", "kinh doanh", "kinh tế", "quản trị", "lao động"],
  "History & Archaeology": ["history", "ancient", "archaeology", "roman", "museum", "lịch sử", "khảo cổ"],
  "Nature & Animals": ["animal", "plant", "forest", "bird", "marine", "biology", "nature", "động vật", "thực vật", "sinh học", "bảo tồn", "nông nghiệp"],
  "Travel & Transport": ["travel", "tour", "transport", "car", "airport", "ship", "du lịch", "giao thông", "hàng hải"],
  Psychology: ["psychology", "mind", "brain", "behaviour", "behavior", "memory", "tâm lý", "não bộ", "tư duy"],
  "Arts & Media": ["art", "music", "film", "advertising", "photography", "book", "nghệ thuật", "âm nhạc", "nhiếp ảnh", "sách"],
};

export function matchesIeltsTopic(value: string, topic: IeltsTopic): boolean {
  const normalized = value.toLocaleLowerCase("vi");
  return KEYWORDS[topic].some((keyword) => normalized.includes(keyword));
}

export function availableIeltsTopics(values: string[]): IeltsTopic[] {
  return IELTS_TOPICS.filter((topic) => values.some((value) => matchesIeltsTopic(value, topic)));
}
