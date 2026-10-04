"""Checkpoint 9: a student's Day-2 explanation is visible to the 9A Maths teacher only."""
import json, requests
from common import session, rest, U, K
s = {w: session(w) for w in ['qa.t1', 'qa.t2', 'qa.s1', 'qa.s2']}; t = {w: v['access_token'] for w, v in s.items()}
SID = s['qa.s1']['user']['id']; R = []
ok = lambda k, v, d="": (R.append({"check": k, "pass": bool(v), "detail": str(d)}), print("PASS" if v else "FAIL", k, d))
EX = "QA-CP9: rational numbers can be written as p/q, so 0.5 = 1/2."
row = {"user_id": SID, "chapter_id": "ch1-real-numbers", "episode_id": "qa-cp9", "layer_scores": {"day2_explanation": EX, "day2_completed_at": "2026-10-04T17:00:00Z"}}
w = rest(t['qa.s1'], "episode_progress", "POST", row, prefer="return=representation"); ok("student saves Day-2 explanation", w.status_code in (200, 201), w.status_code)
rpc = lambda tok, b, g, sec: requests.post(f"{U}/rest/v1/rpc/get_teacher_explanations", headers={"apikey": K, "Authorization": f"Bearer {tok}", "Content-Type": "application/json"}, json={"_board": b, "_grade": g, "_section": sec, "_subject": "Mathematics"})
has = lambda r: r.status_code == 200 and any(x.get('explanation') == EX for x in r.json())
ok("T1 (9A Maths) sees it", has(rpc(t['qa.t1'], "CBSE", 9, "A")))
r = rpc(t['qa.t2'], "CBSE", 9, "A"); ok("T2 (9B) asking for 9A gets nothing", r.status_code == 200 and r.json() == [], r.text[:80])
ok("T2 own 9B list excludes it", not has(rpc(t['qa.t2'], "CBSE", 9, "B")))
r = rpc(t['qa.t1'], "ICSE", 9, "A"); ok("T1 with another board gets nothing", r.status_code == 200 and r.json() == [], r.text[:80])
r = rpc(t['qa.s2'], "CBSE", 9, "A"); ok("classmate student gets nothing", r.status_code == 200 and r.json() == [], r.text[:80])
r = rpc(K, "CBSE", 9, "A"); ok("signed-out request gets nothing", r.status_code != 200 or r.json() == [], r.status_code)
d = rest(t['qa.s2'], f"episode_progress?select=id&user_id=eq.{SID}"); ok("classmate cannot read the row directly", d.json() == [], d.text[:60])
x = rest(t['qa.s1'], f"episode_progress?user_id=eq.{SID}&episode_id=eq.qa-cp9", "DELETE"); print("cleanup", x.status_code)
json.dump(R, open("result_cp9.json", "w"), indent=2); print(sum(c['pass'] for c in R), "/", len(R))
