import { teacherHienTai } from "../../../../lib/phien";
import { luuTaiKhoan } from "../../../../lib/hocVienGhi";
import { chay, docBody } from "../_tra";

/**
 * Tài khoản nhận học phí.
 *
 * Cô tự nhập. Không hardcode số tài khoản của ai vào code — và cũng không đọc
 * từ biến môi trường: đây là dữ liệu cô sửa được bất cứ lúc nào, không phải
 * cấu hình triển khai.
 */
export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  return chay(async () => {
    const teacherId = await teacherHienTai();
    await luuTaiKhoan(teacherId, await docBody(request));
    return null;
  });
}
