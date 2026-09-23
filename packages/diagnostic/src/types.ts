import type { WritingState } from "./writing";

export type Section = "Listening" | "Reading" | "Grammar";
/*
  Mục trên thanh điều hướng phòng thi. Rộng hơn `Section` đúng một giá trị:
  Writing có mặt trong bài làm nhưng không tham gia `scores`, vì nó không được
  chấm bằng số câu đúng mà bằng bốn tiêu chí band riêng.
*/
export type Tab = Section | "Writing";
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
  section: Tab;
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
  /* Bài viết phần 4, thô như học sinh gõ. Cột riêng trong DB, không nằm trong `answers`. */
  essay: string;
  /*
    `null` = chưa gọi bộ chấm lần nào. Khác hẳn `{kind:"ungraded"}` là đã gọi
    và hỏng — trang dựa vào đúng chỗ này để biết có phải hỏi chấm hay không.
  */
  writing: WritingState | null;
  progress: Record<string, boolean>;
  startedAt: string;
  rulesVersion: string | null;
  locked: boolean;
};
