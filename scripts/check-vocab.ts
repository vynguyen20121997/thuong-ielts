import dotenv from "dotenv";
dotenv.config({ path: "apps/web/.env.local" });

/*
  Hai thứ không kiểm được bằng cách bấm tay trên trình duyệt, nên kiểm bằng
  script — và kiểm qua ĐÚNG route HTTP thật, không gọi tắt vào SQL, để cái
  được đo là code đang chạy chứ không phải một bản chép lại.

  1. Hai tab cùng chấm một thẻ. Bấm tay không bao giờ trùng nhau tới mức đó;
     ở đây bắn N request cùng lúc. Nếu `FOR UPDATE` không giữ được thì hai
     request đọc cùng một `reviews_count` rồi cùng ghi đè — đếm sẽ hụt, và
     khoảng cách ôn tính sai theo.

  2. Chuỗi ngày học. Muốn thấy chuỗi 5 ngày thì phải có log của 5 ngày, mà
     ngồi đợi 5 ngày thì không kiểm được. Ở đây gieo thẳng `review_date` lùi
     về quá khứ rồi hỏi route thống kê.

  Chạy trên một học viên mô phỏng có sẵn và DỌN SẠCH dữ liệu từ vựng của em ấy
  ở cả đầu và cuối, để không lẫn vào dữ liệu thật của ai.
*/

const HOC_VIEN = "sim-msyuyr9l-1";
const GOC = process.env.CHECK_BASE_URL ?? "http://localhost:2000";
const SO_REQUEST_SONG_SONG = 10;

let hong = 0;
function kiem(ten: string, dat: boolean, thuc: unknown, mong: unknown) {
  if (dat) {
    console.log(`  ok   ${ten}`);
  } else {
    hong += 1;
    console.error(
      `  HỎNG ${ten}: nhận ${JSON.stringify(thuc)}, mong ${JSON.stringify(mong)}`,
    );
  }
}

async function main() {
  const { pool } = await import("@thuong-ielts/db");
  const { encode } = await import("@auth/core/jwt");

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.error("Thiếu AUTH_SECRET trong apps/web/.env.local");
    process.exit(1);
  }

  /*
    Vé phiên ký bằng đúng khoá của trang, vì mọi route từ vựng đều lấy danh
    tính từ phiên chứ không nhận id do client gửi — chốt ấy là cố ý, nên bài
    kiểm tra phải đi qua nó chứ không được lách.
  */
  const token = await encode({
    token: { sub: HOC_VIEN, studentId: HOC_VIEN },
    secret,
    salt: "authjs.session-token",
    maxAge: 3600,
  });
  const cookie = `authjs.session-token=${token}`;

  const don = () =>
    pool
      .query("DELETE FROM vocab_logs WHERE student_id=$1", [HOC_VIEN])
      .then(() =>
        pool.query("DELETE FROM vocab_reviews WHERE student_id=$1", [HOC_VIEN]),
      );
  await don();

  /* Thẻ dùng để thử — phải có nghĩa, vì thẻ rỗng nghĩa cố ý đứng ngoài lịch. */
  const { rows: the } = await pool.query<{ id: string }>(
    "SELECT id FROM vocab_cards WHERE btrim(vietnamese) <> '' ORDER BY position LIMIT 1",
  );
  if (!the.length) {
    console.error("Chưa có thẻ từ vựng nào trong DB — chạy phần seed trước.");
    process.exit(1);
  }
  const cardId = the[0].id;

  console.log(`\n1) ${SO_REQUEST_SONG_SONG} lượt chấm CÙNG LÚC trên một thẻ`);

  /* Gọi một lần cho `ensureReviews` kịp tạo dòng lịch trước khi bắn song song. */
  await fetch(`${GOC}/api/vocab/due`, { headers: { cookie } });

  const batDau = Date.now();
  const ketQua = await Promise.all(
    Array.from({ length: SO_REQUEST_SONG_SONG }, () =>
      fetch(`${GOC}/api/vocab/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify({ cardId, rating: "good" }),
      }).then((r) => r.status),
    ),
  );
  const giay = ((Date.now() - batDau) / 1000).toFixed(1);

  kiem(
    "mọi request đều 200",
    ketQua.every((s) => s === 200),
    ketQua,
    "tất cả 200",
  );

  const { rows: sauKhiBan } = await pool.query<{ reviews_count: number }>(
    "SELECT reviews_count FROM vocab_reviews WHERE student_id=$1 AND card_id=$2",
    [HOC_VIEN, cardId],
  );
  const { rows: demLog } = await pool.query<{ n: string }>(
    "SELECT COUNT(*) n FROM vocab_logs WHERE student_id=$1 AND card_id=$2",
    [HOC_VIEN, cardId],
  );

  /*
    Đây là chỗ `FOR UPDATE` phải chứng minh mình có tác dụng: N request chạy
    chồng nhau nhưng mỗi cái phải thấy được kết quả của cái trước, nên số lần
    ôn đúng bằng N. Thiếu khoá thì vài request đọc cùng một con số cũ rồi cùng
    ghi đè — đếm hụt, và đó là lỗi im lặng, không ai thấy cho tới khi lịch ôn
    của học sinh lệch.
  */
  kiem(
    `reviews_count = ${SO_REQUEST_SONG_SONG} (không mất lượt nào)`,
    sauKhiBan[0]?.reviews_count === SO_REQUEST_SONG_SONG,
    sauKhiBan[0]?.reviews_count,
    SO_REQUEST_SONG_SONG,
  );
  kiem(
    `nhật ký ghi đủ ${SO_REQUEST_SONG_SONG} dòng`,
    Number(demLog[0].n) === SO_REQUEST_SONG_SONG,
    Number(demLog[0].n),
    SO_REQUEST_SONG_SONG,
  );
  console.log(`  (chạy hết ${giay}s)`);

  console.log("\n2) Chuỗi ngày học, gieo dữ liệu lùi về quá khứ");

  const gieo = async (luiNgay: number[]) => {
    await don();
    for (const n of luiNgay) {
      await pool.query(
        `INSERT INTO vocab_logs (student_id, card_id, review_date, rating, interval)
         VALUES ($1,$2, (CURRENT_DATE - $3::int)::timestamptz + interval '10 hours', 'good', 3)`,
        [HOC_VIEN, cardId, n],
      );
    }
  };

  const chuoi = async () => {
    const res = await fetch(`${GOC}/api/vocab/stats`, { headers: { cookie } });
    const data = (await res.json()) as { stats: { streak: number } };
    return data.stats.streak;
  };

  await gieo([0, 1, 2, 3, 4]);
  kiem(
    "ôn 5 ngày liền tính tới hôm nay -> 5",
    (await chuoi()) === 5,
    await chuoi(),
    5,
  );

  /*
    Hôm nay chưa ôn nhưng hôm qua có: chuỗi VẪN còn. Không có luật này thì cứ
    mỗi sáng mở trang ra là thấy chuỗi về 0 dù tối qua vừa học — và đó là thứ
    làm người ta bỏ giữa chừng.
  */
  await gieo([1, 2, 3]);
  kiem(
    "hôm nay chưa ôn, hôm qua có -> 3",
    (await chuoi()) === 3,
    await chuoi(),
    3,
  );

  /* Đứt một ngày ở giữa thì chỉ đếm tới chỗ đứt. */
  await gieo([0, 1, 3, 4, 5]);
  kiem("đứt ngày thứ ba -> 2", (await chuoi()) === 2, await chuoi(), 2);

  /* Nghỉ hai ngày là mất chuỗi hẳn, không phải "giữ hộ". */
  await gieo([2, 3, 4]);
  kiem(
    "lần ôn gần nhất cách 2 ngày -> 0",
    (await chuoi()) === 0,
    await chuoi(),
    0,
  );

  await gieo([]);
  kiem("chưa ôn lần nào -> 0", (await chuoi()) === 0, await chuoi(), 0);

  await don();

  if (hong) {
    console.error(`\n${hong} mục HỎNG.`);
    process.exit(1);
  }
  console.log("\nKhoá hàng chống mất lượt và chuỗi ngày học đều đúng.");
  process.exit(0);
}

void main();
