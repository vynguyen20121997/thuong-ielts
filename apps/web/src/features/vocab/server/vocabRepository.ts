import "server-only";

import { pool } from "@thuong-ielts/db";

import {
  accuracyFrom,
  addDays,
  applyRating,
  dailyReviewsFrom,
  newReview,
  streakFrom,
  todayString,
} from "../domain/srs";
import type {
  Card,
  CardReview,
  Deck,
  DueCard,
  Rating,
  StudentProgress,
  StudentStats,
  TeacherStats,
} from "../domain/types";

/*
  Truy vấn cho phần từ vựng.

  Bản gốc đọc cả file JSON rồi lọc bằng `Array.filter` trong bộ nhớ. Ở đây lọc
  bằng SQL: một lớp có vài chục học sinh × vài trăm thẻ là vài chục nghìn dòng,
  kéo hết về Node mỗi lần mở trang thì chậm mà chẳng để làm gì.

  Thuật toán giãn cách KHÔNG nằm ở đây — nó ở `domain/srs.ts`, thuần và test
  được. File này chỉ đọc/ghi.
*/

type DeckRow = {
  id: string;
  name: string;
  description: string;
  topic: string;
  type: "official" | "personal";
  creator_id: string;
};

const toDeck = (r: DeckRow): Deck => ({
  id: r.id,
  name: r.name,
  description: r.description,
  topic: r.topic,
  type: r.type,
  creatorId: r.creator_id,
});

type CardRow = {
  id: string;
  deck_id: string;
  word: string;
  ipa: string;
  audio_url: string | null;
  examples: string[];
  vietnamese: string;
};

const toCard = (r: CardRow): Card => ({
  id: r.id,
  deckId: r.deck_id,
  word: r.word,
  ipa: r.ipa,
  audioUrl: r.audio_url ?? undefined,
  examples: Array.isArray(r.examples) ? r.examples : [],
  vietnamese: r.vietnamese,
});

type ReviewRow = {
  student_id: string;
  card_id: string;
  due_date: string | Date;
  difficulty_rating: Rating | null;
  last_reviewed_date: string | Date | null;
  interval: number;
  ease_factor: number;
  reviews_count: number;
};

const asDay = (v: string | Date): string =>
  typeof v === "string" ? v.slice(0, 10) : todayString(v);

const toReview = (r: ReviewRow): CardReview => ({
  studentId: r.student_id,
  cardId: r.card_id,
  dueDate: asDay(r.due_date),
  difficultyRating: r.difficulty_rating,
  lastReviewedDate: r.last_reviewed_date
    ? new Date(r.last_reviewed_date).toISOString()
    : null,
  interval: r.interval,
  easeFactor: Number(r.ease_factor),
  reviewsCount: r.reviews_count,
});

/*
  Bộ thẻ một học sinh được học: bộ tự tạo, cộng bộ cô giao riêng, cộng bộ giao
  cho cả lớp. Một câu SQL thay cho ba vòng lọc lồng nhau của bản gốc.
*/
const STUDENT_DECKS_SQL = `
  SELECT DISTINCT d.* FROM vocab_decks d
  LEFT JOIN vocab_assignments a ON a.deck_id = d.id
  WHERE (d.type = 'personal' AND d.creator_id = $1)
     OR a.student_id = $1
     OR (a.student_id IS NULL AND a.audience = 'all')
  ORDER BY d.name
`;

export async function listStudentDecks(studentId: string): Promise<Deck[]> {
  const { rows } = await pool.query<DeckRow>(STUDENT_DECKS_SQL, [studentId]);
  return rows.map(toDeck);
}

export async function listDecksByCreator(creatorId: string): Promise<Deck[]> {
  const { rows } = await pool.query<DeckRow>(
    "SELECT * FROM vocab_decks WHERE creator_id = $1 OR type = 'official' ORDER BY name",
    [creatorId],
  );
  return rows.map(toDeck);
}

export async function getDeck(deckId: string): Promise<Deck | null> {
  const { rows } = await pool.query<DeckRow>(
    "SELECT * FROM vocab_decks WHERE id = $1",
    [deckId],
  );
  return rows[0] ? toDeck(rows[0]) : null;
}

export async function listCards(deckId: string): Promise<Card[]> {
  const { rows } = await pool.query<CardRow>(
    "SELECT * FROM vocab_cards WHERE deck_id = $1 ORDER BY position, created_at",
    [deckId],
  );
  return rows.map(toCard);
}

/**
 * Tạo lịch ôn cho những thẻ học sinh chưa từng gặp.
 *
 * Bản gốc gọi `ensureStudentReviews` ở đầu mỗi endpoint. Giữ nguyên ý đó,
 * nhưng làm bằng một câu `INSERT ... SELECT ... ON CONFLICT DO NOTHING` — chạy
 * song song hai tab cũng không sinh hai dòng.
 */
export async function ensureReviews(studentId: string): Promise<void> {
  await pool.query(
    `INSERT INTO vocab_reviews (student_id, card_id, due_date)
     SELECT $1, c.id, CURRENT_DATE
     FROM vocab_cards c
     WHERE c.deck_id IN (
       SELECT DISTINCT d.id FROM vocab_decks d
       LEFT JOIN vocab_assignments a ON a.deck_id = d.id
       WHERE (d.type = 'personal' AND d.creator_id = $1)
          OR a.student_id = $1
          OR (a.student_id IS NULL AND a.audience = 'all')
     )
     ON CONFLICT DO NOTHING`,
    [studentId],
  );
}

/** Thẻ đến hạn hôm nay, kèm thẻ và bộ để hiện trong lúc ôn. */
export async function listDueCards(
  studentId: string,
  deckId?: string,
): Promise<DueCard[]> {
  await ensureReviews(studentId);
  const { rows } = await pool.query(
    `SELECT r.*, c.*, d.id AS d_id, d.name AS d_name, d.description AS d_description,
            d.topic AS d_topic, d.type AS d_type, d.creator_id AS d_creator_id
     FROM vocab_reviews r
     JOIN vocab_cards c ON c.id = r.card_id
     JOIN vocab_decks d ON d.id = c.deck_id
     WHERE r.student_id = $1 AND r.due_date <= CURRENT_DATE
       AND ($2::text IS NULL OR c.deck_id = $2)
     ORDER BY r.due_date, c.position`,
    [studentId, deckId ?? null],
  );
  return rows.map((r) => ({
    card: toCard(r as CardRow),
    deck: toDeck({
      id: r.d_id,
      name: r.d_name,
      description: r.d_description,
      topic: r.d_topic,
      type: r.d_type,
      creator_id: r.d_creator_id,
    }),
    review: toReview(r as ReviewRow),
  }));
}

/**
 * Chấm một thẻ. Trả về lịch mới để giao diện hiện "hỏi lại sau N ngày".
 *
 * Đọc — tính — ghi trong MỘT transaction có `FOR UPDATE`: hai tab cùng chấm
 * một thẻ mà không khoá thì lượt sau ghi đè lượt trước và `reviewsCount` đếm
 * thiếu, kéo theo khoảng cách tính sai.
 */
export async function rateCard(
  studentId: string,
  cardId: string,
  rating: Rating,
): Promise<CardReview> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const found = await client.query<ReviewRow>(
      "SELECT * FROM vocab_reviews WHERE student_id = $1 AND card_id = $2 FOR UPDATE",
      [studentId, cardId],
    );
    const today = todayString();
    const current = found.rows[0]
      ? toReview(found.rows[0])
      : newReview(studentId, cardId, today);
    const next = applyRating(current, rating, today);

    await client.query(
      `INSERT INTO vocab_reviews
         (student_id, card_id, due_date, difficulty_rating, last_reviewed_date, interval, ease_factor, reviews_count)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (student_id, card_id) DO UPDATE SET
         due_date = EXCLUDED.due_date,
         difficulty_rating = EXCLUDED.difficulty_rating,
         last_reviewed_date = EXCLUDED.last_reviewed_date,
         interval = EXCLUDED.interval,
         ease_factor = EXCLUDED.ease_factor,
         reviews_count = EXCLUDED.reviews_count`,
      [
        studentId,
        cardId,
        next.dueDate,
        next.difficultyRating,
        next.lastReviewedDate,
        next.interval,
        next.easeFactor,
        next.reviewsCount,
      ],
    );
    await client.query(
      "INSERT INTO vocab_logs (student_id, card_id, rating, interval) VALUES ($1,$2,$3,$4)",
      [studentId, cardId, rating, next.interval],
    );
    await client.query("COMMIT");
    return next;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function studentStats(studentId: string): Promise<StudentStats> {
  await ensureReviews(studentId);
  const today = todayString();

  const decks = await listStudentDecks(studentId);
  const deckIds = decks.map((d) => d.id);

  const counts = await pool.query<{ due: string; learned: string }>(
    `SELECT
       COUNT(*) FILTER (WHERE due_date <= CURRENT_DATE) AS due,
       COUNT(*) FILTER (WHERE reviews_count > 0 AND difficulty_rating <> 'again') AS learned
     FROM vocab_reviews WHERE student_id = $1`,
    [studentId],
  );

  const perDeck = deckIds.length
    ? await pool.query<{ deck_id: string; total: string; learned: string }>(
        `SELECT c.deck_id,
                COUNT(*) AS total,
                COUNT(r.card_id) FILTER (WHERE r.reviews_count > 0) AS learned
         FROM vocab_cards c
         LEFT JOIN vocab_reviews r ON r.card_id = c.id AND r.student_id = $1
         WHERE c.deck_id = ANY($2)
         GROUP BY c.deck_id`,
        [studentId, deckIds],
      )
    : { rows: [] as { deck_id: string; total: string; learned: string }[] };

  const progressDecks = decks.map((deck) => {
    const row = perDeck.rows.find((r) => r.deck_id === deck.id);
    const totalCards = Number(row?.total ?? 0);
    const learnedCount = Number(row?.learned ?? 0);
    return {
      deck,
      totalCards,
      learnedCount,
      percentage: totalCards
        ? Math.round((learnedCount / totalCards) * 100)
        : 0,
    };
  });

  /*
    Chuỗi ngày và tỉ lệ nhớ tính từ NHẬT KÝ, không từ trạng thái hiện tại.
    Chỉ lấy 120 ngày gần nhất: chuỗi dài hơn thế thì con số đã đủ để tự hào,
    mà kéo cả lịch sử về chỉ để đếm là phí.
  */
  const logs = await pool.query<{ day: string; rating: Rating }>(
    `SELECT to_char(review_date AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day, rating
     FROM vocab_logs
     WHERE student_id = $1 AND review_date > now() - interval '120 days'
     ORDER BY review_date DESC`,
    [studentId],
  );
  const days = logs.rows.map((r) => r.day);

  const total = await pool.query<{ n: string }>(
    "SELECT COUNT(*) AS n FROM vocab_logs WHERE student_id = $1",
    [studentId],
  );

  return {
    dueCount: Number(counts.rows[0]?.due ?? 0),
    learnedCount: Number(counts.rows[0]?.learned ?? 0),
    streak: streakFrom(days, today),
    accuracy: accuracyFrom(logs.rows),
    progressDecks,
    totalLogsCount: Number(total.rows[0]?.n ?? 0),
    dailyReviews: dailyReviewsFrom(days, today),
  };
}

/* ── Phía giáo viên ──────────────────────────────────────────────────────── */

export async function teacherStats(): Promise<TeacherStats> {
  const { rows } = await pool.query<{
    students: string;
    decks: string;
    completed: string;
    overdue: string;
    difficult: string;
    total: string;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM students) AS students,
       (SELECT COUNT(*) FROM vocab_decks) AS decks,
       COUNT(*) FILTER (WHERE reviews_count > 0 AND difficulty_rating <> 'again') AS completed,
       COUNT(*) FILTER (WHERE due_date < CURRENT_DATE) AS overdue,
       COUNT(*) FILTER (WHERE difficulty_rating IN ('again','hard')) AS difficult,
       COUNT(*) AS total
     FROM vocab_reviews`,
  );
  const r = rows[0];
  const total = Number(r?.total ?? 0);
  const completed = Number(r?.completed ?? 0);
  return {
    studentsCount: Number(r?.students ?? 0),
    decksCount: Number(r?.decks ?? 0),
    completedCount: completed,
    overdueCount: Number(r?.overdue ?? 0),
    difficultCount: Number(r?.difficult ?? 0),
    completionRate: total ? Math.round((completed / total) * 100) : 0,
  };
}

export async function studentsProgress(): Promise<StudentProgress[]> {
  const { rows } = await pool.query<{
    id: string;
    name: string | null;
    email: string | null;
    total: string;
    completed: string;
    overdue: string;
    difficult: string;
    history: string;
  }>(
    `SELECT s.id, s.name, s.email,
            COUNT(r.card_id) AS total,
            COUNT(*) FILTER (WHERE r.reviews_count > 0 AND r.difficulty_rating <> 'again') AS completed,
            COUNT(*) FILTER (WHERE r.due_date < CURRENT_DATE) AS overdue,
            COUNT(*) FILTER (WHERE r.difficulty_rating IN ('again','hard')) AS difficult,
            (SELECT COUNT(*) FROM vocab_logs l WHERE l.student_id = s.id) AS history
     FROM students s
     LEFT JOIN vocab_reviews r ON r.student_id = s.id
     GROUP BY s.id, s.name, s.email
     ORDER BY s.name NULLS LAST`,
  );

  return rows.map((r) => {
    const total = Number(r.total);
    const completed = Number(r.completed);
    return {
      student: { id: r.id, name: r.name ?? "Học viên", email: r.email ?? "" },
      totalAssignedCards: total,
      completedCount: completed,
      overdueCount: Number(r.overdue),
      difficultCount: Number(r.difficult),
      completionRate: total ? Math.round((completed / total) * 100) : 0,
      historyCount: Number(r.history),
      recentLogs: [],
    };
  });
}

/* ── Ghi ─────────────────────────────────────────────────────────────────── */

const slug = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "deck";

export async function createDeck(input: {
  name: string;
  description: string;
  topic: string;
  type: Deck["type"];
  creatorId: string;
}): Promise<Deck> {
  const id = `${slug(input.name)}-${Date.now().toString(36)}`;
  await pool.query(
    "INSERT INTO vocab_decks (id,name,description,topic,type,creator_id) VALUES ($1,$2,$3,$4,$5,$6)",
    [
      id,
      input.name,
      input.description,
      input.topic,
      input.type,
      input.creatorId,
    ],
  );
  return { id, ...input };
}

export async function addCard(
  deckId: string,
  input: Omit<Card, "id" | "deckId">,
): Promise<Card> {
  const id = `${deckId}-${slug(input.word)}-${Date.now().toString(36)}`;
  const { rows } = await pool.query<{ next: number }>(
    "SELECT COALESCE(MAX(position), -1) + 1 AS next FROM vocab_cards WHERE deck_id = $1",
    [deckId],
  );
  await pool.query(
    `INSERT INTO vocab_cards (id,deck_id,word,ipa,audio_url,examples,vietnamese,position)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      id,
      deckId,
      input.word,
      input.ipa,
      input.audioUrl ?? null,
      JSON.stringify(input.examples),
      input.vietnamese,
      rows[0]?.next ?? 0,
    ],
  );
  return { id, deckId, ...input };
}

export async function deleteCard(cardId: string): Promise<void> {
  await pool.query("DELETE FROM vocab_cards WHERE id = $1", [cardId]);
}

export async function assignDeck(
  deckId: string,
  assignedBy: string,
  studentId?: string,
): Promise<void> {
  await pool.query(
    `INSERT INTO vocab_assignments (deck_id, student_id, audience, assigned_by)
     VALUES ($1,$2,$3,$4) ON CONFLICT (deck_id, student_id) DO NOTHING`,
    [deckId, studentId ?? null, studentId ? "student" : "all", assignedBy],
  );
}

export { addDays, todayString };
