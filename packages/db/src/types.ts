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
