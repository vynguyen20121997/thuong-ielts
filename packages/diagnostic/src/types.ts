export type Section = "Listening" | "Reading" | "Grammar";
export type Question = {
  id: string;
  section: Section;
  prompt: string;
  options: { value: string; label: string }[];
  limit?: string;
  evidence?: string;
};
export type Paper = {
  version: string;
  duration: number;
  questions: Question[];
  passage: string[];
  title: string;
  audio: string[];
};
export type Profile = {
  name: string;
  email: string;
  phone?: string;
  /* Trình độ tự khai; điểm IELTS cũ chỉ để giáo viên đọc, không tham gia chấm. */
  level: string;
  ieltsScore?: string;
  ieltsDate?: string;
  target: string;
  purpose: string;
  examTiming: string;
  examMonth?: string;
  /* 0 = chưa rõ, nơi dùng tự lấy mặc định của `domain/profile.ts`. */
  dailyMinutes?: number;
  consent?: boolean;
  contactOptIn?: boolean;
};
export type Workspace = {
  bookmarks: string[];
  highlights: { blockId: string; start: number; end: number }[];
  section: Section;
  audio: number[];
  audioDone: boolean[];
  scroll: Record<string, number>;
  issues: string[];
};
export type ItemResult = Question & {
  answer: string;
  expected: string;
  correct: boolean;
  explanation: string;
  review: string;
  area: string;
};
export type AreaResult = {
  id: string;
  name: string;
  section: Section;
  correct: number;
  total: number;
  level: number;
  feedback: string;
  review: { id: string; text: string; blank: boolean }[];
};
export type Report = {
  items: ItemResult[];
  areas: AreaResult[];
  scores: Record<Section, number>;
  blanks: number;
};
export type Session = {
  paper: Paper;
  profile: Profile;
  answers: Record<string, string>;
  workspace: Workspace;
  remaining: number;
  submittedAt: string | null;
  autoSubmitted: boolean;
  result: Report | null;
  progress: Record<string, boolean>;
  startedAt: string;
  rulesVersion: string | null;
  locked: boolean;
};
