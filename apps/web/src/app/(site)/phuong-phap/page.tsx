import Link from "next/link";
import { BookOpen, Headphones, PenLine, Mic, ArrowDown, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import NavigationButtonLabel from "../../../components/NavigationButtonLabel";


import PageArch from "../../../components/PageArch";

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
        title: "Hiểu cấu trúc đề và từng dạng bài",
        paras: [
          "Học sinh trước hết được làm quen với cấu trúc bài thi IELTS Listening, đặc điểm của từng section và các dạng câu hỏi thường gặp như Gap Filling, Multiple Choice, Matching, Map/Plan Labelling,...",
          "Với mỗi dạng bài, học sinh được hướng dẫn cách:",
        ],
        bullets: [
          "đọc và phân tích câu hỏi trước khi nghe;",
          "dự đoán loại thông tin cần nghe;",
          "nhận diện cách thông tin thường được diễn đạt và paraphrase trong audio;",
          "lựa chọn cách tiếp cận phù hợp để xử lý bài nhanh nhưng vẫn chính xác.",
        ],
      },
      {
        title: "Nói không với “tips & tricks” và nghe bắt keyword",
        paras: [
          "Listening không được dạy theo hướng chỉ chờ nghe đúng một keyword rồi chọn đáp án. Trong bài thi thật, từ trong câu hỏi thường được paraphrase, thông tin có thể được sửa lại giữa chừng và nhiều từ khóa gây nhiễu cũng xuất hiện trong audio.",
          "Vì vậy, trọng tâm của lớp học là nghe hiểu nội dung thực sự.",
          "Tùy vào trình độ và lỗi của học sinh, các hoạt động như take notes, nghe chép chính tả (dictation), nghe lại từng đoạn ngắn và đối chiếu transcript được sử dụng để kiểm tra xem học sinh thực sự nghe được bao nhiêu.",
          "Qua đó, học sinh dần xác định chính xác nguyên nhân mất điểm, ví dụ:",
        ],
        bullets: [
          "không nhận ra từ dù đã biết từ đó;",
          "không theo kịp tốc độ nói;",
          "bỏ lỡ paraphrase;",
          "nghe sai số, tên riêng hoặc spelling;",
          "mất tập trung khi audio chuyển sang thông tin tiếp theo.",
        ],
      },
      {
        title: "Xây dựng Vocabulary và Background Knowledge",
        paras: [
          "Trước hoặc trong bài học, giáo viên sẽ chọn lọc những blocking vocabulary – những từ thực sự cản trở việc hiểu bài – để pre-teach thay vì yêu cầu học sinh học toàn bộ từ mới trong transcript.",
          "Vocabulary được củng cố thông qua các hoạt động như matching, vocabulary games, paraphrase practice và review lại từ trong ngữ cảnh.",
          "Các hoạt động lead-in và discussion ngắn cũng được sử dụng để cung cấp background knowledge về những chủ đề thường xuất hiện trong IELTS như education, travel, environment, university life hay workplace. Khi đã quen với chủ đề và cách các ý thường được diễn đạt, học sinh sẽ dễ dự đoán và xử lý thông tin khi nghe hơn.",
        ],
      },
      {
        title: "Luyện tập từ từng dạng bài đến Full Listening Test",
        paras: [
          "Ở các lớp beginner, mỗi bài học thường tập trung vào một dạng câu hỏi hoặc một nhóm kỹ năng cụ thể, giúp học sinh có đủ thời gian nhận diện dạng bài, hiểu lỗi sai và luyện tập lặp lại cho đến khi hình thành cách xử lý ổn định.",
          "Khi lên level intermediate trở lên và đã quen với các dạng câu hỏi, học sinh sẽ chuyển sang luyện full section và full Listening test, nơi nhiều dạng bài xuất hiện liên tục giống bài thi thật.",
          "Bài tập về nhà cũng được giao xuyên suốt khóa học và bổ sung theo năng lực của từng học sinh, giúp duy trì tần suất nghe thường xuyên thay vì chỉ luyện Listening trong giờ học.",
        ],
      },
      {
        title: "Theo dõi tiến bộ bằng điểm số và lỗi sai",
        paras: [
          "Tiến bộ của học sinh được theo dõi không chỉ bằng band score mà còn thông qua hệ thống track số câu đúng – sai và các nhóm lỗi thường gặp.",
          "Sau mỗi bài luyện, giáo viên có thể xác định học sinh đang mất điểm chủ yếu vì:",
        ],
        bullets: [
          "vocabulary;",
          "spelling;",
          "paraphrase;",
          "tốc độ xử lý;",
          "mất tập trung;",
          "không nhận diện được âm;",
          "hoặc chưa nắm chiến thuật của dạng bài.",
        ],
        after: [
          "Dữ liệu này được sử dụng để điều chỉnh bài tập và bổ sung practice phù hợp, thay vì để học sinh làm nhiều đề một cách ngẫu nhiên.",
          "Các bài Mock Test được tổ chức định kỳ và mô phỏng bài thi thật sát nhất có thể, giúp theo dõi sự tiến bộ qua từng giai đoạn và kiểm tra khả năng áp dụng kỹ năng dưới áp lực thời gian.",
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
          "Học sinh không được yêu cầu viết một bài hoàn chỉnh ngay khi chưa kiểm soát tốt những đơn vị nhỏ hơn.",
          "Quá trình học đi từ:",
          "Sentence → Idea → Paragraph → Full Response",
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
        title: "Framework là nền tảng, không phải bài học thuộc",
        paras: [
          "Với cả Task 1 và Task 2, học sinh được hướng dẫn rõ yêu cầu từng dạng bài, cách phân tích đề, tổ chức thông tin, cấu trúc paragraph và các cấu trúc ngôn ngữ phù hợp.",
          "Ở level beginner, giáo viên có thể cung cấp framework và sentence frame khá cụ thể để học sinh làm quen với logic của bài viết. Khi trình độ tăng lên, mức độ hỗ trợ sẽ giảm dần.",
          "Mục tiêu không phải để học sinh học thuộc một khuôn mẫu cố định, mà để các em dần biết tự lựa chọn cấu trúc, cách diễn đạt và phát triển ý phù hợp, từ đó hình thành writing style riêng.",
        ],
      },
      {
        title: "Phát triển Critical Thinking qua cách đào sâu luận điểm",
        paras: [
          "Học sinh được hướng dẫn cách phát triển một luận điểm theo logic rõ ràng, thay vì đưa ra nhiều ý nhưng chỉ giải thích sơ sài.",
          "Trọng tâm là học cách trả lời các câu hỏi như Why? How? So what?, từ đó giải thích nguyên nhân, cơ chế, hệ quả và ví dụ một cách mạch lạc. Mục tiêu là giúp học sinh hình thành tư duy lập luận tốt hơn và viết những body paragraphs có chiều sâu.",
        ],
      },
      {
        title: "Ưu tiên ngôn ngữ đơn giản, chính xác và tự nhiên",
        paras: [
          "Học sinh không bị đặt áp lực phải sử dụng thật nhiều advanced vocabulary hay cấu trúc phức tạp để đạt điểm cao. Thay vào đó, ưu tiên là dùng từ và ngữ pháp đúng, rõ ràng, tự nhiên và phù hợp với ý muốn diễn đạt.",
          "Bên cạnh đó, học sinh vẫn được bổ sung topical vocabulary, collocations và cách paraphrase theo từng chủ đề để mở rộng vốn từ một cách có chọn lọc và ứng dụng được vào bài viết.",
        ],
      },
      {
        title: "Chấm bài theo đúng 4 tiêu chí IELTS",
        paras: [
          "Mỗi bài viết được đánh giá dựa trên:",
        ],
        bullets: [
          "Task Achievement / Task Response",
          "Coherence & Cohesion",
          "Lexical Resource",
          "Grammatical Range & Accuracy",
        ],
        after: [
          "Học sinh không chỉ nhận một band score tổng thể mà còn cần hiểu:",
          "Điểm của mình đang bị giới hạn ở đâu?",
        ],
      },
      {
        title: "Tập trung sửa lỗi và giảm lỗi lặp lại",
        paras: [
          "Feedback không chỉ để chỉ ra bài viết sai ở đâu, mà quan trọng hơn là giúp học sinh hiểu lỗi, sửa được lỗi và tránh lặp lại trong những bài sau.",
          "Quá trình được thực hiện theo vòng:",
          "Write → Feedback → Identify recurring errors → Correct → Rewrite → Apply in next task",
          "Các lỗi thường xuyên xuất hiện như article, subject–verb agreement, word form, collocation, sentence structure hay development of ideas được theo dõi qua nhiều bài viết.",
        ],
        after: [
          "Mục tiêu là giúp học sinh nhận ra pattern lỗi cá nhân và giảm dần recurring errors, thay vì để giáo viên phải sửa đi sửa lại cùng một lỗi ở mỗi bài.",
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
        title: "Ưu tiên phát triển ý sâu hơn là dùng vocabulary “khủng”",
        paras: [
          "Một câu trả lời Speaking tốt không cần quá nhiều idiom, từ hiếm hay vocabulary quá “advanced”. Trọng tâm là giúp học sinh diễn giải một ý rõ ràng, chi tiết và có logic.",
          "Học sinh được hướng dẫn mở rộng câu trả lời, thay vì chỉ đưa ra nhiều ý ngắn nhưng không phát triển.",
          "Ưu tiên sẽ là:",
          "ý rõ → phát triển đủ sâu → diễn đạt tự nhiên → vocabulary phù hợp → grammar linh hoạt",
          "Vocabulary vẫn được nâng cấp theo từng topic, nhưng phải là những từ thực sự ứng dụng được vào câu trả lời, thay vì học để “show off” từ vựng.",
        ],
      },
      {
        title: "Không chỉ có một cách phát triển câu trả lời",
        paras: ["Học sinh được cung cấp nhiều cách mở rộng ý, ví dụ:"],
        bullets: [
          "Answer → Reason",
          "Answer → Example",
          "Past → Present",
          "General idea → Personal experience",
        ],
        after: [
          "Sau đó học sinh tự chọn cấu trúc phù hợp với câu hỏi và cách tư duy của mình.",
          "Mục tiêu không phải để cả lớp trả lời giống nhau mà là giúp mỗi học sinh xây dựng một hệ thống phát triển ý của riêng mình.",
        ],
      },
      {
        title: "Input phải tạo ra output",
        paras: [
          "Trong Speaking, học sinh được tiếp xúc với authentic English materials qua các hoạt động nghe và đọc để rút ra cách diễn đạt, vocabulary và ideas có thể sử dụng trong từng chủ đề.",
          "Phần input này không dừng ở việc “học từ mới”, mà được thiết kế để:",
        ],
        bullets: [
          "bổ sung topic-specific vocabulary có tính ứng dụng cao;",
          "mở rộng background knowledge về các chủ đề thường gặp;",
          "giúp học sinh quan sát cách người bản ngữ diễn đạt ý tự nhiên.",
        ],
        after: [
          "Sau đó, ngôn ngữ và ý tưởng mới được đưa ngay vào các bài tập liên quan theo chu trình:",
          "Input → Guided Practice → Speaking → Feedback → Speak Again",
          "Mục tiêu là để học sinh không chỉ nhận biết kiến thức mới mà có thể chủ động sử dụng chúng trong câu trả lời Speaking của mình.",
        ],
      },
      {
        title: "Feedback ngay tại lớp",
        paras: [
          "Trong quá trình luyện Speaking, các vấn đề quan trọng về pronunciation, grammar, vocabulary, fluency và idea development được chỉ ra ngay tại lớp.",
          "Sau feedback, học sinh được yêu cầu thử lại câu trả lời để trực tiếp tạo ra output tốt hơn, thay vì chỉ nghe và hiểu lỗi.",
          "Các lỗi thường xuyên xuất hiện cũng được ghi nhận trong hệ thống theo dõi lỗi, giúp giáo viên và học sinh nhận diện recurring mistakes qua nhiều buổi học và tập trung sửa những vấn đề ảnh hưởng nhiều nhất đến điểm Speaking.",
          "Mục tiêu là để lỗi được sửa, luyện lại và giảm dần theo thời gian, thay vì lặp lại từ buổi này sang buổi khác.",
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
      <PageArch />
      <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-8">
        {/* Mở đầu */}
        <div className="mb-14 text-left">
          <span className="text-sm font-bold uppercase tracking-[0.12em] text-brand block mb-4">
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
                      <NavigationButtonLabel>Phương pháp Dạy {section.name}</NavigationButtonLabel>
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
            <NavigationButtonLabel>Đăng Ký Học</NavigationButtonLabel>
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
