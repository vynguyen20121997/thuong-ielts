import Link from "next/link";
import { BookOpen, Headphones, PenLine, Mic, ArrowRight, Sparkles } from "lucide-react";

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
  paras?: string[];
  bullets?: string[];
  after?: string[];
};

type SkillSection = {
  id: string;
  name: string;
  icon: typeof BookOpen;
  items: MethodItem[];
};

const SKILL_SECTIONS: SkillSection[] = [
  {
    id: "reading",
    name: "Reading",
    icon: BookOpen,
    items: [
      {
        title: "Hiểu rõ từng dạng bài trước khi luyện đề",
        paras: [
          "Reading không chỉ là “đọc bài rồi tìm đáp án”. Mỗi dạng câu hỏi yêu cầu một cách xử lý thông tin khác nhau. Vì vậy, học sinh trước tiên được hướng dẫn:",
        ],
        bullets: [
          "đặc điểm của từng dạng bài;",
          "dạng bài đang kiểm tra kỹ năng gì;",
          "thông tin thường xuất hiện ở đâu;",
          "thứ tự câu hỏi có đi theo bài đọc hay không;",
          "và cách tiếp cận phù hợp với từng dạng.",
        ],
        after: [
          "Các dạng bài được sắp xếp theo mức độ từ dễ đến khó để học sinh có thời gian làm quen với từng kỹ năng trước khi kết hợp chúng trong một bài Reading hoàn chỉnh.",
          "Mục tiêu: học sinh không nhìn một bài Reading như một khối văn bản dài, mà có thể nhanh chóng xác định — đây là dạng gì → mình cần tìm loại thông tin nào → mình nên đọc phần nào trước.",
        ],
      },
      {
        title: "Không học Reading bằng tips & tricks",
        paras: [
          "Một số chiến thuật có thể giúp học sinh làm bài nhanh hơn, nhưng chiến thuật chỉ có ích khi người học thực sự hiểu nội dung đang đọc. Vì vậy, mình không khuyến khích cách học dựa hoàn toàn vào:",
        ],
        bullets: [
          "bắt keyword;",
          "đoán vị trí đáp án;",
          "tìm từ giống hệt trong bài;",
          "hoặc áp dụng một “mẹo” cố định cho mọi câu hỏi.",
        ],
        after: [
          "Thay vào đó, học sinh được rèn khả năng xử lý câu hỏi theo một quy trình rõ ràng: Question → Location → Paraphrase → Evidence → Analyse options → Eliminate wrong answers → Answer.",
          "Học sinh không chỉ cần xác định bằng chứng nào trong bài đọc hỗ trợ đáp án đúng, mà còn phải biết phân tích từng lựa chọn, nhận ra điểm không khớp và giải thích vì sao các đáp án còn lại sai. Mục tiêu là trả lời được hai câu hỏi: Vì sao đáp án này đúng? Vì sao những đáp án còn lại sai?",
          "Nhờ đó, việc làm Reading không còn dựa vào cảm giác hay đoán đáp án, mà trở thành một quá trình đọc hiểu, đối chiếu thông tin, phân tích và loại trừ có căn cứ.",
        ],
      },
      {
        title: "Chữa bài để hiểu tại sao mình sai",
        paras: [
          "Khi chữa Reading, mục tiêu không chỉ là đổi một đáp án sai thành đáp án đúng. Học sinh cần xác định nguyên nhân của lỗi sai, chẳng hạn:",
        ],
        bullets: [
          "không hiểu câu hỏi;",
          "xác định sai vị trí thông tin;",
          "không nhận ra paraphrase;",
          "hiểu sai một từ hoặc một cấu trúc ngữ pháp;",
          "đọc thiếu chi tiết;",
          "suy diễn quá mức;",
          "hoặc sử dụng sai chiến thuật.",
        ],
        after: ["Việc hiểu nguyên nhân giúp học sinh tránh lặp lại cùng một lỗi ở bài tiếp theo."],
      },
      {
        title: "Xây dựng vocabulary và background knowledge",
        paras: [
          "Vocabulary Reading không được học như những danh sách từ rời rạc. Trong quá trình học, học sinh được bổ sung:",
        ],
        bullets: [
          "từ vựng theo những chủ đề thường gặp;",
          "paraphrase thường xuất hiện trong bài đọc;",
          "word family;",
          "collocation;",
          "và những kiến thức nền cần thiết để đọc nhanh hơn.",
        ],
        after: [
          "Mục tiêu là giúp học sinh vừa cải thiện điểm Reading, vừa phát triển năng lực đọc tiếng Anh thực tế.",
        ],
      },
      {
        title: "Phát triển khả năng đọc độc lập",
        paras: ["Ở giai đoạn sau, học sinh được yêu cầu:"],
        bullets: [
          "tự giải thích tại sao mình chọn đáp án;",
          "chỉ ra evidence;",
          "nhận diện paraphrase;",
          "và tự sửa những câu sai trước khi xem lời giải.",
        ],
        after: [
          "Khi học sinh có thể tự làm được những bước này, việc luyện đề mới thực sự có giá trị.",
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
          <p className="inline-block bg-leaf text-brand font-bold text-sm md:text-base px-6 py-3 rounded-full mb-6">
            Hiểu → Làm có hướng dẫn → Phân tích lỗi → Luyện tập → Áp dụng độc lập
          </p>
          <p className="text-brand/75 text-base leading-relaxed">
            Mục tiêu cuối cùng là để học sinh hiểu mình đang làm gì, tại sao mình làm như vậy và
            phải điều chỉnh như thế nào khi gặp một bài mới.
          </p>
        </div>

        {/* Menu nhảy nhanh 4 kỹ năng */}
        <div className="flex flex-wrap gap-3 mb-16">
          {SKILL_SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-black/10 hover:border-brand text-brand font-semibold text-sm rounded-full transition-colors"
              >
                <Icon size={16} className="text-brand" />
                {s.name}
              </a>
            );
          })}
        </div>

        {/* 4 kỹ năng */}
        {SKILL_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <section key={section.id} id={section.id} className="mb-16 scroll-mt-28">
              <div className="flex items-center gap-3 mb-8">
                <span className="h-12 w-12 rounded-full bg-leaf flex items-center justify-center shrink-0">
                  <Icon size={22} className="text-brand" />
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-brand">{section.name}</h2>
              </div>

              <div className="space-y-6">
                {section.items.map((item, i) => (
                  <article key={item.title} className="bg-white rounded-[24px] p-7 md:p-8 shadow-sm">
                    <h3 className="text-lg md:text-xl font-bold text-brand mb-4">
                      <span className="text-brand mr-2">{i + 1}.</span>
                      {item.title}
                    </h3>
                    {item.paras?.map((p) => (
                      <p key={p} className="text-brand/75 text-sm md:text-base leading-relaxed mb-3">
                        {p}
                      </p>
                    ))}
                    {item.bullets && (
                      <ul className="list-disc pl-5 space-y-1.5 mb-3 text-brand/75 text-sm md:text-base leading-relaxed marker:text-brand">
                        {item.bullets.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    )}
                    {item.after?.map((p) => (
                      <p key={p} className="text-brand/75 text-sm md:text-base leading-relaxed mb-3 last:mb-0">
                        {p}
                      </p>
                    ))}
                  </article>
                ))}
              </div>
            </section>
          );
        })}

        {/* Hệ thống Speaking với AI */}
        <div className="bg-brand rounded-[28px] p-8 md:p-10 mb-16">
          <span className="inline-flex items-center gap-2 text-leaf text-sm font-bold mb-3">
            <Sparkles size={16} />
            Hệ thống Speaking với AI
          </span>
          <p className="text-white/80 text-sm md:text-base leading-relaxed">
            Một hệ thống luyện tập Speaking hỗ trợ bởi AI đang được phát triển nhằm giúp học sinh
            có thêm cơ hội luyện tập ngoài giờ học, nhận diện những điểm cần cải thiện và duy trì
            tần suất speaking thường xuyên.
          </p>
        </div>

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
