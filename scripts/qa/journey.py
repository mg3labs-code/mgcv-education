import sys, time, json, hashlib, threading
from common import *
RUN, DATE = sys.argv[1], sys.argv[2]
FIX = len(sys.argv)>3 and sys.argv[3]=="fix"
import datetime
R={}; ok=lambda k,v,d="": (R.__setitem__(k,("PASS" if v else "FAIL")+(" "+d if d else "")), print(k, R[k]), (v or (_ for _ in ()).throw(SystemExit("STOP at "+k))))
t={w:session(w)["access_token"] for w in ["qa.t1","qa.t2","qa.s1","qa.s2","qa.s3","qa.s4"]}
T1="584d68ef-c42f-4b53-9ffa-bdce38622355"
# CP1b: schedule visibility
cal=lambda w: rest(t[w],f"calendar?select=notes&teacher_id=eq.{T1}&date=eq.{DATE}&subject=ilike.math*").json()
v={w:cal(w) for w in ["qa.s1","qa.s2","qa.s3","qa.s4"]}
ok("CP1 published schedule visible to 9A only", v["qa.s1"]==[{"notes":f"QA run {RUN}"}] and v["qa.s2"]==v["qa.s1"] and v["qa.s3"]==[] and v["qa.s4"]==[], json.dumps(v))
c=rest(t["qa.t1"],f"calendar?select=*&teacher_id=eq.{T1}&date=eq.{DATE}&subject=ilike.math*").json()[0]
body=dict(class_name=c["class_name"],subject=c["subject"],board="CBSE",section="A",schedule_date=DATE,teacher_id=T1,topic_key=c["topic_key"],topic_title=c["topic_title"],chapter_name=c["chapter_name"])
# CP2: forbidden generators, then double-tap
for w in ["qa.s1","qa.t2"]:
  ok(f"CP2 generate refused for {w}", fn(t[w],"generate-daily-homework",body).status_code in (401,403))
ok("CP2 generate refused unauthenticated", fn(K,"generate-daily-homework",body).status_code in (401,403))
res=[None]*3; t0=time.time()
def go(i): res[i]=fn(t["qa.t1"],"generate-daily-homework",body)
th=[threading.Thread(target=go,args=(i,)) for i in range(3)]; [x.start() for x in th]; [x.join() for x in th]
gen_s=round(time.time()-t0,1)
drafts=rest(t["qa.t1"],f"assignments?select=id,is_published,board,section&teacher_id=eq.{T1}&schedule_date=eq.{DATE}&source=eq.auto_homework").json()
ok("CP2 3 simultaneous requests -> 1 unpublished CBSE/A draft", len(drafts)==1 and not drafts[0]["is_published"] and drafts[0]["board"]=="CBSE" and drafts[0]["section"]=="A", f"{[r.status_code for r in res]} {gen_s}s")
A=drafts[0]["id"]; R["assignment"]=A
g=rest(t["qa.t1"],f"assignments?select=generation_status,due_date&id=eq.{A}").json()[0]
nh={h["date"] for h in rest(t["qa.t1"],"national_holidays?select=date").json()}
th={h["date"] for h in rest(t["qa.t1"],f"calendar?select=date&teacher_id=eq.{T1}&entry_type=eq.holiday&class_name=eq.{c['class_name']}").json()}
d=datetime.date.fromisoformat(DATE)+datetime.timedelta(days=1)
while d.weekday()>=5 or d.isoformat() in nh or d.isoformat() in th: d+=datetime.timedelta(days=1)
due_ist=(datetime.datetime.fromisoformat(g["due_date"])+datetime.timedelta(hours=5,minutes=30)).date() if g["due_date"] else None
ok("CP2 generation complete before review", g["generation_status"]=="complete")
ok("CP2 due date = next school day", due_ist==d, f"{DATE} -> {due_ist} (expected {d})")
qs=sorted(requests.post(f"{U}/rest/v1/rpc/get_teacher_assignment_questions",headers={"apikey":K,"Authorization":"Bearer "+t["qa.t1"]},json={"_assignment_ids":[A]}).json(),key=lambda q:q["question_number"])
layers=[(q.get("rubric") or {}).get("layer") if isinstance(q.get("rubric"),dict) else None for q in qs]
ok("CP2 five questions with hints for teacher", len(qs)==5 and all(q.get("expected_answer_hints") for q in qs), str(layers))
# CP3 draft invisibility
for w in ["qa.s1","qa.s2","qa.s3","qa.s4"]:
  a=rest(t[w],f"assignments?select=id&id=eq.{A}").json(); q=rest(t[w],f"assignment_questions?select=id,question_text&assignment_id=eq.{A}")
  ok(f"CP3 draft hidden from {w}", a==[] and (q.status_code>=400 or q.json()==[]))
ok("CP3 T2 cannot read T1 draft questions", requests.post(f"{U}/rest/v1/rpc/get_teacher_assignment_questions",headers={"apikey":K,"Authorization":"Bearer "+t["qa.t2"]},json={"_assignment_ids":[A]}).json()==[])
# CP4 review edits (same writes the review screen makes) + approve
r1=rest(t["qa.t1"],f"assignment_questions?id=eq.{qs[1]['id']}","PATCH",{"question_text":qs[1]["question_text"]+f" (QA run {RUN} edit)"})
r2=rest(t["qa.t1"],f"assignment_questions?id=eq.{qs[2]['id']}","PATCH",{"max_score":float(qs[2]["max_score"])+1})
r3=rest(t["qa.t1"],f"assignment_questions?id=eq.{qs[4]['id']}","DELETE")
chk=sorted(requests.post(f"{U}/rest/v1/rpc/get_teacher_assignment_questions",headers={"apikey":K,"Authorization":"Bearer "+t["qa.t1"]},json={"_assignment_ids":[A]}).json(),key=lambda q:q["question_number"])
ok("CP4 edit/marks/delete saved (re-read)", all(x.status_code<300 for x in (r1,r2,r3)) and len(chk)==4 and chk[1]["question_text"].endswith(f"(QA run {RUN} edit)") and float(chk[2]["max_score"])==float(qs[2]["max_score"])+1 and qs[4]["id"] not in [q["id"] for q in chk])
if FIX:
  fx=[rest(t["qa.t1"],f"assignment_questions?id=eq.{chk[i]['id']}","PATCH",{"max_score":m}).status_code for i,m in enumerate([2,2,4,3])]
  ok("CP4 fixture maxima 2,2,4,3 set", all(x<300 for x in fx))
for i in range(2): pr=fn(t["qa.t1"],"manage-assignment",{"action":"publish_assignment","assignment_id":A})
ok("CP4 approve (twice) ok", pr.status_code==200)
asg=rest(t["qa.t1"],f"assignments?select=is_published,max_total_score&id=eq.{A}").json()[0]
qs2=sorted(requests.post(f"{U}/rest/v1/rpc/get_teacher_assignment_questions",headers={"apikey":K,"Authorization":"Bearer "+t["qa.t1"]},json={"_assignment_ids":[A]}).json(),key=lambda q:q["question_number"])
tot=sum(float(q["max_score"]) for q in qs2)
ok("CP4 published, 4 qs, total = sum", asg["is_published"] and len(qs2)==4 and float(asg["max_total_score"])==tot, f"total {tot}")
ok("CP4 still one homework for slot", len(rest(t["qa.t1"],f"assignments?select=id&teacher_id=eq.{T1}&schedule_date=eq.{DATE}&source=eq.auto_homework").json())==1)
# CP5 visibility after approval
for w,exp in [("qa.s1",4),("qa.s2",4),("qa.s3",0),("qa.s4",0)]:
  q=rest(t[w],f"assignment_questions?select=id,question_text,max_score&assignment_id=eq.{A}")
  n=len(q.json()) if q.status_code<400 else -1
  vis=len(rest(t[w],f"assignments?select=id&id=eq.{A}").json())
  ok(f"CP5 {w} sees {exp} questions", vis==(1 if exp else 0) and (n==exp or (exp==0 and n<=0)), f"q={n}")
h=rest(t["qa.s1"],f"assignment_questions?select=expected_answer_hints&assignment_id=eq.{A}")
ok("CP5 student cannot read hints", h.status_code>=400, str(h.status_code))
qd=sorted(requests.post(f"{U}/rest/v1/rpc/get_teacher_assignment_questions",headers={"apikey":K,"Authorization":"Bearer "+t["qa.t1"]},json={"_assignment_ids":[A]}).json(),key=lambda q:q["question_number"])
json.dump({"A":A,"R":R,"qs":qd},open(f"state_{RUN}.json","w"),indent=1)
print("PHASE A DONE", A)
