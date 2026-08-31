import Link from "next/link";
import { BookOpen, Headphones, PenLine, Mic, ArrowDown, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";


/**
 * Trang Phương pháp giảng dạy — nội dung nguyên văn theo Google Doc cấu trúc
 * website (phần "Giảng dạy > Phương pháp giảng dạy"). Server component tĩnh.
 */

export const metadata = {
  title: "Phương Pháp Giảng Dạy | HNT IELTS",
  description:
    "Phương pháp giảng dạy IELTS của cô Hồ Ngọc Thương: Hiểu → Làm có hướng dẫn → Phân tích lỗi → Luyện tập → Áp dụng độc lập, chi tiết cho từng kỹ năng.",
};

type MethodItem = {
  title: string;
  paras?: ReactNode[];
  bullets?: ReactNode[];
  after?: ReactNode[];
};

type SkillSection = {
  id: string;
  name: string;
  icon: typeof BookOpen;
  items: MethodItem[];
};

export const SKILL_SECTIONS: SkillSection[] = [
  {
    id: "reading",
    name: "Reading",
    icon: BookOpen,
    items: [
      {
        title: "Hiểu cấu trúc đề và làm quen với các dạng bài thường gặp",
        paras: [
          <>Trước khi luyện đề, học sinh cần hiểu cấu trúc IELTS Reading và đặc điểm của từng dạng câu hỏi như True/False/Not Given, Matching Headings, Matching Information, Multiple Choice, Summary Completion...</>,
          <>Với mỗi dạng, học sinh được hướng dẫn:</>,
        ],
        bullets: [
          "dạng bài đang kiểm tra kỹ năng gì;",
          "thông tin cần tìm nằm ở đâu;",
          "paraphrase thường xuất hiện như thế nào;",
          "những lỗi nào dễ mắc;",
          "và cách xử lý dạng bài phù hợp.",
        ],
      },
      {
        title: "Học chiến thuật làm bài nhanh, hiệu quả và phù hợp với từng level",
        paras: [
          <>Học sinh được hướng dẫn cách <strong>xác định nhanh vị trí thông tin, phân bổ thời gian, xử lý câu khó và kiểm soát tốc độ đọc</strong>.</>,
          <>Chiến thuật không được áp dụng máy móc cho tất cả học sinh. Tùy trình độ, điểm mạnh và điểm yếu, thứ tự làm bài hoặc cách xử lý từng dạng có thể được điều chỉnh.</>,
        ],
        after: [
          <>Mục tiêu không phải học thuộc một “công thức Reading”, mà là xây dựng <strong>chiến thuật phù hợp với năng lực của chính mình</strong>.</>,
        ],
      },
      {
        title: "Không học Reading bằng tips & tricks hay chỉ bắt keyword",
        paras: [
          <>IELTS Reading thường sử dụng <strong>paraphrase, từ đồng nghĩa, phủ định, so sánh, cách diễn đạt gián tiếp và distractor</strong>, nên học sinh cần hiểu chính xác ý của câu thay vì chỉ tìm những từ giống nhau.</>,
          <>Khi cần thiết, học sinh sẽ được hướng dẫn <strong>dịch câu khó, phân tích cấu trúc câu, vocabulary trong ngữ cảnh và mối quan hệ logic giữa các ý</strong>.</>,
        ],
      },
      {
        title: "Chọn đáp án bằng evidence và biết loại trừ đáp án sai",
        paras: [
          <>Học sinh không chỉ cần biết đáp án nào đúng mà còn phải giải thích được <strong>vì sao đúng và vì sao những đáp án khác sai</strong>.</>,
          <>Quy trình làm bài thường được hướng dẫn theo:</>,
          <strong>Question → Location → Paraphrase → Evidence → Analyse options → Eliminate → Answer</strong>,
          <>Học sinh được rèn cách tìm evidence trong passage và nhận diện các distractor như <strong>ý bị đảo ngược, sai đối tượng, thông tin chỉ đúng một phần hoặc dùng cùng keyword nhưng khác nghĩa</strong>.</>,
        ],
        after: [
          <>Nhờ đó, Reading trở thành quá trình <strong>đọc hiểu – đối chiếu – loại trừ có căn cứ</strong>, thay vì đoán đáp án.</>,
        ],
      },
      {
        title: "Xây dựng Vocabulary và Background Knowledge",
        paras: [
          <strong>Vocabulary</strong>,
          <>Trước mỗi passage, GV chỉ <strong>pre-teach những blocking vocabulary thực sự cần thiết</strong> để học sinh có thể theo được nội dung và thực hiện nhiệm vụ đọc.</>,
          <>Từ vựng sau đó được củng cố qua các hoạt động ngắn như <strong>matching, guessing games, recall hoặc paraphrase games</strong>. Trong quá trình chữa bài, học sinh tiếp tục được bổ sung academic vocabulary, collocations và các cách paraphrase đáng học.</>,
          <strong>Background Knowledge</strong>,
          <>Kiến thức nền được xây dựng thông qua <strong>lead-in, câu hỏi gợi mở và discussion ngắn</strong> trước khi đọc.</>,
          <>Học sinh được khuyến khích chia sẻ những gì đã biết, dự đoán nội dung và làm quen với các khái niệm quan trọng của chủ đề.</>,
        ],
        after: [
          <>Nhờ đó, vocabulary và background knowledge được <strong>tích hợp trực tiếp vào bài Reading</strong>, giúp học sinh tiếp cận passage nhanh và tự tin hơn.</>,
        ],
      },
      {
        title: "Luyện tập từ dạng bài riêng lẻ đến Full Reading Test",
        paras: [
          <>Quá trình luyện tập đi theo:</>,
          <strong>Dạng bài riêng lẻ → Passage hoàn chỉnh → Full Reading Test</strong>,
          <strong>Ở level Beginner</strong>,
          <>Mỗi unit Reading thường tập trung vào <strong>một dạng câu hỏi chính</strong> và được luyện lặp lại qua nhiều bài tập để học sinh hình thành quy trình làm bài và giảm các lỗi đặc trưng của dạng đó.</>,
          <strong>Ở level Intermediate trở lên</strong>,
          <>Khi đã quen với các dạng bài, học sinh được hướng dẫn xử lý <strong>một passage hoàn chỉnh gồm nhiều dạng câu hỏi</strong>, tập trung vào thứ tự làm bài, phân bổ thời gian và duy trì độ chính xác.</>,
          <strong>Bài tập về nhà và tài liệu bổ sung</strong>,
          <>Homework được giao thường xuyên xuyên suốt khóa học và đi cùng định hướng trên lớp: <strong>Beginner củng cố từng dạng bài; Intermediate trở lên luyện passage hoàn chỉnh và áp dụng chiến thuật độc lập</strong>.</>,
          <>Tài liệu bổ sung cũng được điều chỉnh dựa trên tiến độ và lỗi sai của học sinh.</>,
          <strong>Mock Test định kỳ</strong>,
        ],
        after: [
          <>Mock Test được tổ chức định kỳ trong điều kiện <strong>mô phỏng gần với kỳ thi thật nhất có thể</strong>, giúp kiểm tra khả năng áp dụng toàn bộ kỹ năng và điều chỉnh phần luyện tập tiếp theo.</>,
        ],
      },
      {
        title: "Theo dõi tiến bộ bằng hệ thống track điểm và lỗi sai",
        paras: [
          <>Kết quả Reading được theo dõi xuyên suốt quá trình học, bao gồm <strong>số câu đúng, band score, dạng bài thường sai, loại lỗi lặp lại và xu hướng tiến bộ</strong>.</>,
          <>Lỗi sai cũng được phân loại theo nguyên nhân như: <strong>Thiếu vocab, Hiểu sai Grammar, Tìm evidence sai chỗ, Không nhận ra paraphrase, Bị đề lừa, Quản lý thời gian không hiệu quả, Mất tập trung</strong></>,
          <>Từ dữ liệu này, phần luyện tập tiếp theo có thể được điều chỉnh đúng vào vấn đề của từng học sinh.</>,
          <>Ví dụ: thường sai <strong>Matching Headings</strong> → luyện thêm main idea; không nhận ra <strong>paraphrase</strong> → tăng bài tập paraphrase; đọc hiểu tốt nhưng thiếu thời gian → tập trung vào tốc độ và chiến thuật.</>,
        ],
        after: [
          <>Nhờ đó, bài tập không chỉ đi theo syllabus cố định mà còn được <strong>cá nhân hóa dựa trên lỗi sai thực tế</strong>.</>,
        ],
      },
      {
        title: "Mục tiêu cuối cùng",
        paras: [
          <>Sau quá trình học, học sinh cần có khả năng:</>,
          <strong>Hiểu đề → Chọn chiến thuật → Đọc hiểu → Tìm evidence → Phân tích & loại trừ → Kiểm soát thời gian → Tự nhận diện lỗi</strong>,
        ],
        after: [
          <>Mục tiêu không chỉ là tăng số câu đúng trong bài luyện tập, mà là xây dựng khả năng làm Reading <strong>ổn định, có căn cứ và có thể áp dụng độc lập trong phòng thi thật</strong>.</>,
        ],
      },
    ],
  },
  {
    id: "listening",
    name: "Listening",
    icon: Headphones,
    items: [
      {
        title: "Hiểu từng dạng câu hỏi trước khi nghe",
        paras: [
          "Listening có nhiều dạng bài khác nhau và mỗi dạng yêu cầu học sinh tập trung vào một loại thông tin khác nhau. Học sinh được hướng dẫn cách xử lý từng dạng từ dễ đến khó, bao gồm:",
        ],
        bullets: [
          "đọc câu hỏi trước khi nghe;",
          "dự đoán loại thông tin cần nghe;",
          "xác định keyword;",
          "nhận diện distractor;",
          "theo dõi sự thay đổi của người nói;",
          "và chuyển sự chú ý sang câu tiếp theo đúng thời điểm.",
        ],
      },
      {
        title: "Không nghe theo kiểu “bắt keyword”",
        paras: [
          "Một lỗi phổ biến là học sinh cố chờ nghe đúng từ xuất hiện trong câu hỏi. Trong IELTS Listening, câu hỏi và audio thường sử dụng paraphrase, nên việc chỉ chờ một keyword cụ thể dễ khiến học sinh bỏ lỡ đáp án.",
          "Vì vậy, trọng tâm là giúp học sinh: nghe để hiểu ý → nhận diện thông tin tương đương → chọn đáp án, thay vì: thấy keyword → chờ keyword trong audio.",
        ],
      },
      {
        title: "Mỗi câu sai phải có một nguyên nhân",
        paras: [
          "Sai Listening không phải lúc nào cũng vì “nghe yếu”. Một câu sai có thể đến từ nhiều nguyên nhân:",
        ],
        bullets: [
          "Không nghe được âm → vấn đề pronunciation / connected speech.",
          "Nghe được nhưng không hiểu → vocabulary hoặc grammar.",
          "Hiểu nhưng không nhận ra đáp án → paraphrase.",
          "Biết đáp án nhưng bỏ lỡ câu tiếp theo → concentration.",
          "Bị distractor đánh lừa → question strategy.",
        ],
        after: [
          "Việc phân loại lỗi giúp học sinh biết chính xác kỹ năng nào cần cải thiện, thay vì chỉ nghe đi nghe lại toàn bộ bài.",
        ],
      },
      {
        title: "Phát triển khả năng nghe ngôn ngữ thực tế",
        paras: ["Bên cạnh luyện đề, học sinh được tiếp xúc với:"],
        bullets: [
          "pronunciation;",
          "connected speech;",
          "những cách diễn đạt phổ biến;",
          "từ vựng theo topic;",
          "và các dạng paraphrase thường gặp.",
        ],
        after: [
          "Mục tiêu là cải thiện khả năng nghe tiếng Anh, chứ không chỉ tăng số câu đúng trong một bài test.",
        ],
      },
    ],
  },
  {
    id: "writing",
    name: "Writing",
    icon: PenLine,
    items: [
      {
        title: "Học Writing theo từng tầng",
        paras: [
          "Học sinh không được yêu cầu viết một bài hoàn chỉnh ngay khi chưa kiểm soát tốt những đơn vị nhỏ hơn. Quá trình học đi từ: Sentence → Idea → Paragraph → Full Response.",
          "Tùy trình độ, học sinh có thể bắt đầu từ:",
        ],
        bullets: [
          "viết câu đúng ngữ pháp;",
          "sử dụng cấu trúc so sánh;",
          "viết câu mô tả số liệu;",
          "phát triển một idea;",
          "viết một body paragraph;",
          "rồi mới tiến tới full Task 1 hoặc Task 2.",
        ],
        after: [
          "Cách này giúp hạn chế tình trạng học sinh học thuộc cả bài mẫu nhưng không tự tạo được câu của riêng mình.",
        ],
      },
      {
        title: "Mỗi dạng bài có một cấu trúc rõ ràng",
        paras: ["Với cả Task 1 và Task 2, học sinh được hướng dẫn:"],
        bullets: [
          "yêu cầu của từng dạng bài;",
          "cách phân tích đề;",
          "cách tổ chức thông tin;",
          "cấu trúc từng paragraph;",
          "và các cấu trúc ngôn ngữ có thể sử dụng.",
        ],
        after: [
          "Ở level beginner, học sinh có thể được cung cấp mẫu và sentence frame khá rõ để làm quen. Khi trình độ tăng lên, mức độ hỗ trợ giảm dần để học sinh có thể tự lựa chọn cấu trúc phù hợp.",
        ],
      },
      {
        title: "Framework là điểm bắt đầu, không phải bài học thuộc",
        paras: [
          "Mẫu câu và framework được sử dụng để giúp học sinh hiểu logic của bài viết. Tuy nhiên, mục tiêu không phải để tất cả học sinh viết một bài giống nhau. Khi đã quen với cấu trúc cơ bản, học sinh được khuyến khích:",
        ],
        bullets: [
          "thay đổi cách diễn đạt;",
          "lựa chọn cấu trúc phù hợp với ý của mình;",
          "phát triển luận điểm khác nhau;",
          "và dần hình thành writing style riêng.",
        ],
      },
      {
        title: "Chấm bài theo đúng 4 tiêu chí IELTS",
        paras: ["Mỗi bài viết được đánh giá dựa trên:"],
        bullets: [
          "Task Achievement / Task Response",
          "Coherence & Cohesion",
          "Lexical Resource",
          "Grammatical Range & Accuracy",
        ],
        after: [
          "Học sinh không chỉ nhận một band score tổng thể mà còn cần hiểu: điểm của mình đang bị giới hạn ở đâu? Ví dụ: một học sinh có idea tốt nhưng grammar chưa ổn sẽ cần một hướng cải thiện khác với một học sinh viết chính xác nhưng phát triển ý quá sơ sài.",
        ],
      },
      {
        title: "Feedback không kết thúc khi bài được chữa",
        paras: [
          "Một bài Writing chỉ thực sự có giá trị khi lỗi trong bài đó giúp học sinh viết tốt hơn ở bài tiếp theo. Vì vậy, feedback được sử dụng theo một vòng: Write → Feedback → Identify recurring errors → Correct → Rewrite → Apply in next task.",
          "Các lỗi cá nhân thường xuyên xuất hiện được theo dõi để học sinh biết mình đang có pattern nào, chẳng hạn:",
        ],
        bullets: [
          "article;",
          "subject–verb agreement;",
          "word form;",
          "collocation;",
          "sentence structure;",
          "comparative structures;",
          "development of ideas.",
        ],
        after: [
          "Mục tiêu là giảm dần recurring errors, thay vì để giáo viên sửa cùng một lỗi hết bài này đến bài khác.",
        ],
      },
      {
        title: "Rewrite là một phần của quá trình học",
        paras: ["Sau feedback, học sinh có thể được yêu cầu:"],
        bullets: [
          "sửa lại câu sai;",
          "viết lại một đoạn;",
          "hoặc hoàn thiện lại toàn bộ bài tùy vấn đề.",
        ],
        after: [
          "Việc rewrite giúp biến feedback từ kiến thức thụ động thành kỹ năng học sinh có thể thực sự sử dụng.",
        ],
      },
      {
        title: "Vocabulary và grammar được học trong ngữ cảnh",
        paras: [
          "Thay vì học grammar và vocabulary tách biệt hoàn toàn khỏi Writing, những nội dung này được đưa vào bài học dựa trên nhu cầu thực tế.",
          "Ví dụ: nếu học sinh đang học Static Charts, grammar có thể tập trung vào comparatives, superlatives, expressing proportions. Nếu học Task 2 Problems & Solutions, vocabulary được xây dựng xoay quanh causes, consequences, stakeholders, solutions.",
          "Nhờ đó, học sinh học ngôn ngữ cùng lúc với việc học cách sử dụng nó.",
        ],
      },
    ],
  },
  {
    id: "speaking",
    name: "Speaking",
    icon: Mic,
    items: [
      {
        title: "Phát triển câu trả lời từ trải nghiệm thật",
        paras: [
          "Mình không khuyến khích học sinh học thuộc sample answers. Thay vào đó, câu trả lời được phát triển từ:",
        ],
        bullets: [
          "trải nghiệm cá nhân;",
          "quan điểm;",
          "người quen;",
          "công việc;",
          "học tập;",
          "sở thích;",
          "và những tình huống quen thuộc.",
        ],
        after: [
          "Điều này giúp câu trả lời tự nhiên hơn và quan trọng hơn là học sinh có thể ứng biến khi examiner thay đổi câu hỏi.",
        ],
      },
      {
        title: "Không ép học sinh sử dụng vocabulary “cao cấp”",
        paras: [
          "Một câu trả lời Speaking tốt không nhất thiết phải chứa nhiều idiom hay từ hiếm. Học sinh được hướng dẫn tập trung vào: ý rõ → diễn đạt tự nhiên → vocabulary phù hợp → grammar đủ linh hoạt, thay vì cố nhồi những từ mình chưa thực sự sử dụng được.",
          "Vocabulary được nâng cấp dần khi khả năng diễn đạt đã ổn định.",
        ],
      },
      {
        title: "Input phải tạo ra output",
        paras: [
          "Việc học một danh sách vocabulary hoặc xem một sample answer không đồng nghĩa với việc học sinh có thể sử dụng chúng khi Speaking. Vì vậy, kiến thức mới luôn cần được đưa vào practice.",
          "Một chu trình có thể là: Input → Guided Practice → Speaking → Feedback → Speak Again. Học sinh không chỉ nghe giáo viên sửa mà phải nói lại để áp dụng feedback ngay lập tức.",
        ],
      },
      {
        title: "Feedback ngay tại lớp",
        paras: ["Những vấn đề quan trọng về:"],
        bullets: ["pronunciation;", "grammar;", "vocabulary;", "fluency;", "idea development"],
        after: [
          "được chỉ ra trong quá trình luyện tập. Sau feedback, học sinh được yêu cầu thử lại câu trả lời để cảm nhận rõ sự khác biệt giữa lần đầu và lần sau. Điều này đặc biệt quan trọng với Speaking vì chỉ “hiểu lỗi” chưa đủ; học sinh phải tạo lại output đúng bằng miệng.",
        ],
      },
      {
        title: "Không chỉ có một cách phát triển câu trả lời",
        paras: ["Học sinh được cung cấp nhiều cách mở rộng ý, ví dụ:"],
        bullets: [
          "Answer → Reason",
          "Answer → Example",
          "Past → Present",
          "Opinion → Explanation",
          "Situation → Feeling",
          "General idea → Personal experience",
        ],
        after: [
          "Sau đó học sinh tự chọn cấu trúc phù hợp với câu hỏi và cách tư duy của mình. Mục tiêu không phải để cả lớp trả lời giống nhau mà là giúp mỗi học sinh xây dựng một hệ thống phát triển ý của riêng mình.",
        ],
      },
      {
        title: "Hướng đến khả năng luyện tập độc lập",
        paras: ["Về lâu dài, mục tiêu là để học sinh có thể:"],
        bullets: [
          "tự chọn topic;",
          "tự tạo câu hỏi;",
          "ghi âm câu trả lời;",
          "phát hiện những vấn đề thường gặp;",
          "luyện lại;",
          "và theo dõi quá trình tiến bộ.",
        ],
      },
    ],
  },
];

/**
 * Năm bước của quá trình học, nguyên văn theo Google Doc. Tách thành mảng vì
 * đây là một DANH SÁCH có thứ tự chứ không phải một câu — xem ghi chú chỗ dựng.
 */
const PROCESS = [
  { label: "Hiểu", color: "bg-[#e9f7ec]", numberColor: "text-[#5d9770]" },
  { label: "Làm có hướng dẫn", color: "bg-[#d2f0d7]", numberColor: "text-[#438d58]" },
  { label: "Phân tích lỗi", color: "bg-[#a9e3b5]", numberColor: "text-[#287542]" },
  { label: "Luyện tập", color: "bg-[#6fcf82]", numberColor: "text-[#165e30]" },
  {
    label: "Áp dụng độc lập",
    color: "bg-brand",
    numberColor: "text-white/70",
    isFinal: true,
  },
] as const;

export default function TeachingMethodPage() {
  return (
    <main className="relative z-10 pt-28 md:pt-32 pb-24 bg-white">
      <div className="max-w-4xl mx-auto px-6 md:px-8">
        {/* Mở đầu */}
        <div className="mb-14 text-left">
          <span className="text-sm font-semibold uppercase tracking-[0.1em] text-brand block mb-4">
            Giảng Dạy
          </span>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-brand leading-[1.15] mb-6">
            Phương Pháp Giảng Dạy
          </h1>
          <p className="text-brand/75 text-base leading-relaxed mb-4">
            IELTS không chỉ là một bài kiểm tra kiến thức tiếng Anh. Để đạt được band điểm mong
            muốn, học sinh cần đồng thời phát triển năng lực ngôn ngữ, kỹ năng xử lý từng dạng bài
            và khả năng nhận ra – sửa chữa lỗi của chính mình.
          </p>
          <p className="text-brand/75 text-base leading-relaxed mb-6">
            Vì vậy, các khóa học của mình không được xây dựng xoay quanh việc làm thật nhiều đề
            hay ghi nhớ càng nhiều tips càng tốt. Thay vào đó, mỗi kỹ năng đều đi theo một quá
            trình:
          </p>
          {/* Năm bước là một flowchart: mũi tên giữ mắt đi từ bước 01 tới bước 05. */}
          <ol className="mb-7 flex flex-col gap-2.5 md:flex-row md:items-stretch md:gap-2">
            {PROCESS.map((step, i) => {
              const last = i === PROCESS.length - 1;
              return (
                <li key={step.label} className="flex min-w-0 flex-1 flex-col items-center gap-2.5 md:flex-row md:gap-2">
                  <div
                    className={`flex min-h-[122px] w-full flex-1 flex-col justify-center rounded-[24px] px-6 py-5 ${step.color}`}
                  >
                    <span className={`font-mono text-xs font-bold tracking-[0.08em] ${step.numberColor}`}>
                      0{i + 1}
                    </span>
                    <span
                      className={`mt-2 text-lg font-bold leading-tight ${last ? "text-white" : "text-brand"}`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {!last && (
                    <span className="flex h-6 w-8 shrink-0 items-center justify-center text-brand/65 md:w-7">
                      <ArrowRight
                        aria-hidden="true"
                        size={22}
                        className="hidden motion-safe:animate-[flow-arrow_1.5s_ease-in-out_infinite] md:block"
                        style={{ animationDelay: `${i * 0.14}s` }}
                      />
                      <ArrowDown aria-hidden="true" size={22} className="motion-safe:animate-[flow-arrow-down_1.5s_ease-in-out_infinite] md:hidden" style={{ animationDelay: `${i * 0.14}s` }} />
                    </span>
                  )}
                  {last && <span aria-hidden="true" className="hidden h-6 w-7 shrink-0 md:block" />}
                </li>
              );
            })}
          </ol>
          <p className="text-brand/75 text-base leading-relaxed">
            Mục tiêu cuối cùng là để học sinh hiểu mình đang làm gì, tại sao mình làm như vậy và
            phải điều chỉnh như thế nào khi gặp một bài mới.
          </p>
        </div>

        <section aria-label="Khám phá phương pháp theo kỹ năng" className="mb-16">
          <div className="border-t-2 border-brand/15 pt-8">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand/60">Khám phá theo kỹ năng</p>
            <h2 className="mt-2 text-2xl font-bold text-brand md:text-3xl">Chọn kỹ năng bạn muốn tìm hiểu</h2>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {SKILL_SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <Link
                    key={section.id}
                    href={`/phuong-phap/${section.id}`}
                    className="group flex items-center justify-between rounded-2xl border border-brand/10 bg-mist px-5 py-5 text-brand transition-colors hover:border-brand/25 hover:bg-sage"
                  >
                    <span className="flex items-center gap-3 font-bold">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-leaf"><Icon size={19} /></span>
                      Phương pháp Dạy {section.name}
                    </span>
                    <ArrowRight size={19} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA cuối trang */}
        <div className="text-center">
          <Link
            href="/tu-van"
            className="group inline-flex items-center gap-2 px-9 py-4 bg-brand hover:bg-brand-deep text-white font-bold text-sm rounded-full transition-colors duration-300 shadow-md"
          >
            Đăng Ký Học
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </main>
  );
}
