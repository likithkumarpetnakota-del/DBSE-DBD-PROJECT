import io
import re
import csv
from typing import List, Dict, Any

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

try:
    import docx
except ImportError:
    docx = None


def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    ext = filename.lower().split(".")[-1] if "." in filename else ""

    if ext == "txt":
        return file_bytes.decode("utf-8", errors="ignore")

    elif ext == "pdf":
        if not PdfReader:
            raise ValueError("pypdf dependency is missing on backend")
        reader = PdfReader(io.BytesIO(file_bytes))
        text_pages = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text_pages.append(t)
        return "\n".join(text_pages)

    elif ext == "docx":
        if not docx:
            raise ValueError("python-docx dependency is missing on backend")
        doc = docx.Document(io.BytesIO(file_bytes))
        return "\n".join([p.text for p in doc.paragraphs if p.text])

    elif ext == "csv":
        return file_bytes.decode("utf-8", errors="ignore")

    else:
        raise ValueError(f"Unsupported file format: .{ext}. Allowed formats: .pdf, .docx, .txt, .csv")


def parse_csv_questions(file_bytes: bytes) -> List[Dict[str, Any]]:
    content = file_bytes.decode("utf-8", errors="ignore")
    reader = csv.DictReader(io.StringIO(content))
    questions = []

    for row in reader:
        norm_row = {str(k).strip().lower().replace(" ", "_"): str(v).strip() for k, v in row.items() if k}

        q_text = norm_row.get("question") or norm_row.get("question_text") or norm_row.get("q_text") or ""
        if not q_text:
            continue

        opts = []
        for opt_key in ["option_a", "option_b", "option_c", "option_d", "opt_a", "opt_b", "opt_c", "opt_d", "a", "b", "c", "d"]:
            if opt_key in norm_row and norm_row[opt_key]:
                opts.append(norm_row[opt_key])

        ans_str = norm_row.get("correct_answer") or norm_row.get("correct_option") or norm_row.get("answer") or ""
        correct_idx = 0
        if ans_str.isdigit():
            correct_idx = int(ans_str)
        elif ans_str.upper() in ["A", "B", "C", "D"]:
            correct_idx = ["A", "B", "C", "D"].index(ans_str.upper())

        missing = []
        if not opts or len(opts) < 2:
            missing.append("options")
        if not ans_str:
            missing.append("correct_option")

        questions.append({
            "question_text": q_text,
            "options": opts if len(opts) >= 2 else (opts + ["Option A", "Option B"])[:4],
            "correct_option": min(correct_idx, max(0, len(opts) - 1)),
            "marks": int(norm_row.get("marks", 1)) if str(norm_row.get("marks", "1")).isdigit() else 1,
            "difficulty": norm_row.get("difficulty", "Medium"),
            "category": norm_row.get("category", "General"),
            "missing_fields": missing
        })

    return questions


def parse_text_questions(raw_text: str) -> List[Dict[str, Any]]:
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    questions = []
    current_q = None

    for line in lines:
        q_match = re.match(r'^(?:Question\s*\d*[:.]?|\d+[\.\)])\s*(.+)', line, re.IGNORECASE)
        opt_match = re.match(r'^(?:[A-D][\.\)]|Option\s*[A-D][:.]?)\s*(.+)', line, re.IGNORECASE)
        ans_match = re.match(r'^(?:Correct\s*(?:Answer|Option)[:.]?|Answer[:.]?)\s*([A-D0-3])', line, re.IGNORECASE)

        if q_match and not opt_match and not ans_match:
            if current_q and current_q.get("question_text"):
                questions.append(current_q)
            current_q = {
                "question_text": q_match.group(1).strip(),
                "options": [],
                "correct_option": None,
                "marks": 1,
                "difficulty": "Medium",
                "category": "General",
                "missing_fields": []
            }
        elif opt_match and current_q:
            current_q["options"].append(opt_match.group(1).strip())
        elif ans_match and current_q:
            ans_val = ans_match.group(1).strip().upper()
            if ans_val in ["A", "B", "C", "D"]:
                current_q["correct_option"] = ["A", "B", "C", "D"].index(ans_val)
            elif ans_val.isdigit():
                current_q["correct_option"] = int(ans_val)
        elif current_q and not current_q["options"] and current_q["correct_option"] is None:
            current_q["question_text"] += " " + line

    if current_q and current_q.get("question_text"):
        questions.append(current_q)

    processed = []
    seen_texts = set()

    for q in questions:
        q_text = q["question_text"]
        if q_text in seen_texts:
            continue
        seen_texts.add(q_text)

        missing = []
        options = q["options"]
        if len(options) < 2:
            missing.append("options (requires at least 2)")
            while len(options) < 4:
                options.append(f"Option {chr(65 + len(options))}")

        correct_opt = q["correct_option"]
        if correct_opt is None:
            missing.append("correct_option")
            correct_opt = 0

        processed.append({
            "question_text": q_text,
            "options": options,
            "correct_option": min(max(0, correct_opt), len(options) - 1),
            "marks": q["marks"],
            "difficulty": q["difficulty"],
            "category": q["category"],
            "missing_fields": missing
        })

    return processed


def parse_question_file(file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
    ext = filename.lower().split(".")[-1] if "." in filename else ""
    if ext == "csv":
        try:
            csv_qs = parse_csv_questions(file_bytes)
            if csv_qs:
                return csv_qs
        except Exception:
            pass

    text = extract_text_from_file(file_bytes, filename)
    if not text or not text.strip():
        raise ValueError("Uploaded file contains no readable text.")

    questions = parse_text_questions(text)
    if not questions:
        raise ValueError("No questions could be extracted from file. Format questions as:\nQuestion 1: <Text>\nA. Option A\nB. Option B\nCorrect Answer: A")

    return questions
