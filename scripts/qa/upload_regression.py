"""Upload regression after the JPG/PDF compatibility fix: phone photo with trailer + compressed PDF, real AI, teacher review, finalize; disguised/corrupt refused."""
import time, json, hashlib, requests
from common import session, fn, rest, U, K
t = {w: session(w)['access_token'] for w in ['qa.t1', 'qa.t2', 'qa.s1']}
H = lambda w: {"apikey": K, "Authorization": f"Bearer {t[w]}"}
R = []; ok = lambda k, v, d="": (R.append({"check": k, "pass": bool(v), "detail": str(d)}), print("PASS" if v else "FAIL", k, d))
ma = lambda w, b: fn(t[w], "manage-assignment", b)
qs = [
 {"question_text": "Is the point (1, 2) a solution to the equation x + y = 3? Give a reason based on substitution.", "max_score": 3,
  "rubric": [{"criterion": "Substitutes x=1, y=2 correctly", "points": 1}, {"criterion": "Computes LHS = 3 and compares with RHS", "points": 1}, {"criterion": "Concludes yes, it is a solution", "points": 1}]},
 {"question_text": "Apples cost Rs 5 each and oranges Rs 10 each. Rahul spent Rs 50. Write a linear equation in two variables for this.", "max_score": 3,
  "rubric": [{"criterion": "Defines variables for apples and oranges", "points": 1}, {"criterion": "Uses 5x and 10y for the costs", "points": 1}, {"criterion": "Writes 5x + 10y = 50", "points": 1}]}]
r = ma("qa.t1", {"action": "create_assignment", "title": "QA upload regression (JPG/PDF)", "class_name": "Class 9", "subject": "Mathematics", "board": "CBSE", "section": "A", "questions": qs})
A = r.json()["assignment"]["id"]; print("assignment", A)
ok("teacher publishes regression homework", ma("qa.t1", {"action": "publish_assignment", "assignment_id": A}).status_code == 200)
Q = sorted(rest(t["qa.t1"], f"assignment_questions?select=id,question_number&assignment_id=eq.{A}").json(), key=lambda q: q["question_number"])
def up(n, name, data, mt):
    return requests.post(f"{U}/functions/v1/manage-assignment", headers=H("qa.s1"), data={"action": "upload_answer", "assignment_id": A, "question_id": Q[n]["id"]}, files={"file": (name, data, mt)})
jpg = open("/tmp/up/camera_motion.jpg", "rb").read(); pdf = open("/tmp/up/scan_objstm.pdf", "rb").read()
# Refusals first (Q1), each must leave no answer behind
bad = [("program renamed as photo", "hw.jpg", b"MZ\x90\x00" + b"\x00" * 5000, "image/jpeg"),
       ("text labelled as PDF", "hw.pdf", b"just a text file pretending to be a pdf " * 50, "application/pdf"),
       ("corrupt JPG (header then junk)", "c.jpg", b"\xff\xd8" + b"\x13" * 4000, "image/jpeg"),
       ("truncated PDF", "t.pdf", pdf[: len(pdf) // 2], "application/pdf"),
       ("PDF bytes labelled as JPG", "x.jpg", pdf, "image/jpeg")]
for label, name, data, mt in bad:
    x = up(0, name, data, mt); ok(f"refused: {label}", x.status_code == 400, f"{x.status_code} {x.text[:90]}")
sub0 = rest(t["qa.t1"], f"student_submissions?select=id&assignment_id=eq.{A}").json()
ans0 = rest(t["qa.t1"], f"student_answers?select=id&submission_id=eq.{sub0[0]['id']}").json() if sub0 else []
ok("refused uploads stored no answers", ans0 == [], ans0)
a = up(0, "PXL_20261004_MP.jpg", jpg, "image/jpeg"); ok("phone motion-photo JPG accepted", a.status_code == 200, f"{a.status_code} {a.text[:90]}")
b = up(1, "scan.pdf", pdf, "application/pdf"); ok("compressed (object-stream) PDF accepted", b.status_code == 200, f"{b.status_code} {b.text[:90]}")
S = rest(t["qa.t1"], f"student_submissions?select=id&assignment_id=eq.{A}").json()[0]["id"]
start = time.time()
while time.time() - start < 180:
    rows = rest(t["qa.t1"], f"student_answers?select=id,question_id,file_url,file_type,processing_status,ai_score,ai_feedback,processing_error&submission_id=eq.{S}").json()
    if len(rows) == 2 and all(x["processing_status"] in ("success", "failed") for x in rows): break
    time.sleep(3)
by = {x["question_id"]: x for x in rows}; r1, r2 = by[Q[0]["id"]], by[Q[1]["id"]]
for lab, row, data in [("JPG", r1, jpg), ("PDF", r2, pdf)]:
    got = requests.get(f"{U}/storage/v1/object/authenticated/answer-files/{row['file_url']}", headers=H("qa.t1")).content
    ok(f"{lab} stored bytes identical", hashlib.sha256(got).hexdigest() == hashlib.sha256(data).hexdigest(), row["file_type"])
    ok(f"{lab} real-AI evaluation = 3/3", row["processing_status"] == "success" and float(row["ai_score"] or -1) == 3, f"{row['processing_status']} {row['ai_score']} {row['processing_error']} {json.dumps(row['ai_feedback'])[:200]}")
ok("student submits", ma("qa.s1", {"action": "finalize_submission", "assignment_id": A}).status_code == 200)
g = ma("qa.t1", {"action": "teacher_grade", "answer_id": r1["id"], "teacher_score": 3, "teacher_feedback": "Checked from your photo: correct."})
ok("teacher reviews JPG answer", g.status_code == 200, g.text[:80])
f = ma("qa.t1", {"action": "teacher_finalize", "submission_id": S, "teacher_remarks": "Upload regression"})
ok("teacher finalizes, total 6", f.status_code == 200 and float(f.json().get("total_score", -1)) == 6, f.text[:120])
fin = rest(t["qa.s1"], f"student_submissions?select=status,total_score&assignment_id=eq.{A}").json()
ok("student sees finalized 6", fin and fin[0]["status"] == "finalized" and float(fin[0]["total_score"]) == 6, fin)
ok("finalized answer locked against new photo", up(0, "again.jpg", jpg, "image/jpeg").status_code == 409)
json.dump({"assignment_id": A, "checks": R}, open("result_upload_regression.json", "w"), indent=2)
print(sum(c["pass"] for c in R), "/", len(R))
