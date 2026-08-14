"""
Cho persona học sinh (TinyTroupe) nhận xét về app, dựa trên bằng chứng Playwright đã thu.

Nguyên tắc thiết kế quan trọng nhất ở đây: persona KHÔNG được tự bịa chuyện đã xảy ra.
Nó chỉ nhận đúng những gì Playwright quan sát được rồi phản ứng như một học sinh thật.
Nếu để model tự "dùng thử" trong tưởng tượng, nó sẽ tả một app không tồn tại — và các
nghiên cứu 2026 về LLM đóng vai người dùng đều cảnh báo là model rất hay gật gù, khen
cho xong. Neo vào bằng chứng là cách chặn chuyện đó.

Cần biến môi trường OPENAI_API_KEY (hoặc cấu hình Azure của TinyTroupe).

    pip install -r requirements.txt
    python feedback.py            # dùng file evidence mới nhất
    python feedback.py evidence/run-2026-08-14.json
"""

from __future__ import annotations

import glob
import json
import os
import sys
from pathlib import Path

# Console Windows mặc định không phải UTF-8, tiếng Việt in ra sẽ thành \uXXXX.
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8", errors="replace")

HERE = Path(__file__).parent


def latest_evidence() -> Path:
    files = sorted(glob.glob(str(HERE / "evidence" / "run-*.json")))
    if not files:
        sys.exit("Chưa có file bằng chứng nào trong evidence/. Chạy Playwright trước.")
    return Path(files[-1])


def build_person(spec: dict):
    """Dựng một TinyPerson từ mô tả trong personas.json."""
    from tinytroupe.agent import TinyPerson

    person = TinyPerson(spec["name"])
    person.define("age", spec["age"])
    person.define("nationality", "Vietnamese")
    person.define("occupation", f"Học sinh/sinh viên đang luyện thi IELTS ({spec['level']})")
    person.define("behaviors", spec["bio"])
    # Nói tiếng Việt, và quan trọng: được phép chê.
    person.define(
        "personality_traits",
        [
            {"trait": "Nói tiếng Việt tự nhiên, đúng giọng học sinh, không dùng từ chuyên ngành UX."},
            {"trait": "Thẳng thắn. Nếu thấy khó chịu thì nói khó chịu, không khen xã giao."},
            {"trait": "Chỉ nói về những gì thực sự đã xảy ra với mình, không suy diễn thêm."},
        ],
    )
    return person


def evidence_for(persona_id: str, evidence: dict) -> list[dict]:
    return [o for o in evidence["quanSat"] if o["persona"] == persona_id]


def main() -> None:
    if not os.getenv("OPENAI_API_KEY") and not os.getenv("AZURE_OPENAI_KEY"):
        sys.exit(
            "Thiếu OPENAI_API_KEY (hoặc AZURE_OPENAI_KEY).\n"
            "TinyTroupe cần một model để chạy persona. Đặt biến môi trường rồi chạy lại."
        )

    evidence_path = Path(sys.argv[1]) if len(sys.argv) > 1 else latest_evidence()
    evidence = json.loads(evidence_path.read_text(encoding="utf-8"))
    personas = json.loads((HERE / "personas.json").read_text(encoding="utf-8"))["personas"]

    print(f"Bằng chứng: {evidence_path.name}\n")
    ket_qua = []

    for spec in personas:
        quan_sat = evidence_for(spec["id"], evidence)
        if not quan_sat:
            print(f"— Bỏ qua {spec['name']}: chưa có bằng chứng cho persona này.")
            continue

        person = build_person(spec)

        ke_lai = "\n".join(
            f"- {o['suKien']} (số liệu: {json.dumps(o['doDo'], ensure_ascii=False)})"
            for o in quan_sat
        )
        person.listen(
            f"Bạn vừa vào web luyện IELTS của cô Thương để {spec['goal']}\n"
            f"Đây là đúng những gì đã xảy ra với bạn:\n{ke_lai}\n\n"
            "Hãy kể lại cảm giác của bạn bằng tiếng Việt: chỗ nào làm bạn bực hay bối rối "
            "nhất, và bạn mong web sửa gì trước tiên. Chỉ nói về những việc kể trên, "
            "đừng bịa thêm chuyện chưa xảy ra."
        )
        person.act()

        ket_qua.append({
            "persona": spec["name"],
            "scenario": spec["scenario"],
            "soQuanSat": len(quan_sat),
            "nhanXet": person.pop_actions_and_get_contents_for("TALK", False),
        })

    out = HERE / "evidence" / f"feedback-{evidence['chayLuc']}.json"
    out.write_text(json.dumps(ket_qua, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nĐã ghi nhận xét vào {out}")


if __name__ == "__main__":
    main()
