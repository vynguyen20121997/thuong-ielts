export interface ExtendedTestimonialItem {
  id: string;
  studentName: string;
  score: string;
  comment?: string;
  schoolOrJob: string;
  avatarUrl: string;
  courseId: string;
  courseName: string;
  beforeScore?: string;
  afterScore?: string;
  date: string;
  rating: number;
  helpfulCount: number;
  proofUrl?: string[];
  subScores?: {
    listening: string;
    reading: string;
    writing: string;
    speaking: string;
  };
}

export interface FeedbackItem {
  id: string;
  subject: string;
  imageUrl: string;
  date: string;
  isClassSummary?: boolean;
}

export interface HeroContent {
  portraitUrl: string;
  titleLine1: string;
  titleLine2: string;
  quote: string;
  bio: string;
  closingLine: string;
}
export interface FeaturedContent {
  testimonialIds: string[];
  feedbackIds: string[];
}

export const DEFAULT_HERO_CONTENT: HeroContent = {
  portraitUrl: "/images/ho-ngoc-thuong-hero.webp",
  titleLine1: "HỒ NGỌC THƯƠNG",
  titleLine2: "Chuyên Gia IELTS Master",
  quote:
    "Chuyên gia Luyện thi IELTS và Phát triển Tư duy Biện chứng",
  bio: "Cử nhân xuất sắc Đại học Ngoại Thương (FTU), chứng chỉ giảng dạy CELTA do Cambridge cấp, IELTS Overall 8.5 (Listening & Reading tuyệt đối 9.0). Hơn 4 năm trực tiếp đứng lớp, dẫn dắt nhiều học viên đạt điểm cao bằng phương pháp sơ đồ hóa tư duy logic.",
  closingLine:
    "Theo đuổi IELTS vì đam mê, và sau khi chạm mốc 8.5 Overall thì chọn con đường giảng dạy để giúp người khác đi nhanh hơn con đường mình từng đi.",
};
