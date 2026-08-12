export interface StatItem {
  id: string;
  value: number;
  suffix: string;
  label: string;
  description: string;
}

export interface CourseItem {
  id: string;
  title: string;
  duration: string;
  target: string;
  focus: string;
  description: string;
  highlights: string[];
}

export interface TestimonialItem {
  id: string;
  studentName: string;
  score: string;
  comment: string;
  schoolOrJob: string;
  avatarUrl: string;
}
