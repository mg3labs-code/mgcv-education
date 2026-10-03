import sys, time, json, hashlib, threading
from common import *
RUN, DATE = sys.argv[1], sys.argv[2]
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
# CP6 submission
def up(w,qid,text=None,file=None):
  if file:
    mt="image/png" if file.endswith("png") else "application/pdf"
    # pdf file is actually png bytes renamed? build real pdf
    return requests.post(f"{U}/functions/v1/manage-assignment",headers={"apikey":K,"Authorization":"Bearer "+t[w]},data={"action":"upload_answer","assignment_id":A,"question_id":qid},files={"file":(file,open(file,"rb"),mt)})
  return fn(t[w],"manage-assignment",{"action":"upload_answer","assignment_id":A,"question_id":qid,"extracted_text":text})
ok("CP6 S3 (9B) upload refused", up("qa.s3",qs2[0]["id"],"x").status_code==403)
ts=time.time()
rs=[up("qa.s1",qs2[0]["id"],"A natural number is a counting number 1,2,3...; whole numbers add 0. Zero is whole but not natural."),
    up("qa.s1",qs2[1]["id"],file="ans.png"), up("qa.s1",qs2[2]["id"],file="ans.pdf"),
    up("qa.s1",qs2[3]["id"],"Example: -3/4 is rational since it is p/q with q not 0; sqrt(5) is irrational; so the sum is irrational.")]
ok("CP6 4 answers accepted", all(r.status_code==200 for r in rs), str([r.status_code for r in rs]))
f=fn(t["qa.s1"],"manage-assignment",{"action":"finalize_submission","assignment_id":A})
ok("CP6 submit", f.status_code==200)
sub=rest(t["qa.s1"],f"student_submissions?select=id,status&assignment_id=eq.{A}").json()
ok("CP6 one submission, submitted", len(sub)==1 and sub[0]["status"]=="submitted"); SID=sub[0]["id"]
# CP7 AI evaluation
times={}
while time.time()-ts<300:
  an=rest(t["qa.t1"],f"student_answers?select=id,question_id,processing_status,ai_score,ai_feedback,updated_at,created_at&submission_id=eq.{SID}").json()
  for a in an:
    if a["processing_status"] in("success","failed") and a["id"] not in times: times[a["id"]]=round(time.time()-ts)
  if len(an)==4 and all(a["processing_status"] in("success","failed") for a in an): break
  time.sleep(5)
mx={q["id"]:float(q["max_score"]) for q in qs2}
order={q["id"]:q["question_number"] for q in qs2}
summ=sorted([(order[a["question_id"]],a["processing_status"],a["ai_score"],mx[a["question_id"]],times.get(a["id"])) for a in an])
ok("CP7 all 4 evaluated, valid scores + feedback", len(an)==4 and all(a["processing_status"]=="success" and a["ai_feedback"] and 0<=float(a["ai_score"])<=mx[a["question_id"]] for a in an), str(summ))
R["eval"]=summ
# CP8 forbidden writes before grading
s1a=[a for a in an if order[a["question_id"]]==1][0]
p=rest(t["qa.s1"],f"student_submissions?id=eq.{SID}","PATCH",{"total_score":99,"status":"finalized"},"return=representation")
ok("CP8 S1 direct total/status change saves nothing", p.status_code>=400 or p.json()==[])
p=rest(t["qa.s1"],f"student_answers?id=eq.{s1a['id']}","PATCH",{"teacher_score":2},"return=representation")
ok("CP8 S1 direct mark change saves nothing", p.status_code>=400 or p.json()==[])
for w in ["qa.s1","qa.s2","qa.t2"]:
  ok(f"CP8 teacher_grade refused for {w}", fn(t[w],"manage-assignment",{"action":"teacher_grade","answer_id":s1a["id"],"teacher_score":0,"teacher_feedback":"x"}).status_code==403)
  ok(f"CP8 teacher_finalize refused for {w}", fn(t[w],"manage-assignment",{"action":"teacher_finalize","submission_id":SID}).status_code==403)
ok("CP8 over-max mark refused", fn(t["qa.t1"],"manage-assignment",{"action":"teacher_grade","answer_id":s1a["id"],"teacher_score":mx[s1a["question_id"]]+1}).status_code==400)
# CP9 override + finalize
ok("CP9 T1 sets Q1=0 'QA override'", fn(t["qa.t1"],"manage-assignment",{"action":"teacher_grade","answer_id":s1a["id"],"teacher_score":0,"teacher_feedback":"QA override"}).status_code==200)
fz=fn(t["qa.t1"],"manage-assignment",{"action":"teacher_finalize","submission_id":SID,"total_score":999}).json()
exp=round(sum(float(a["ai_score"]) for a in an if a["id"]!=s1a["id"]),2)
fz2=fn(t["qa.t1"],"manage-assignment",{"action":"teacher_finalize","submission_id":SID}).json()
ok("CP9 server total ignores 999, repeat finalize idempotent", float(fz["total_score"])==exp and fz2.get("already_finalized") and float(fz2["total_score"])==exp, f"total {exp}")
R["total"]=exp
# CP10 post-final locks + S2 isolation + file integrity
files=rest(t["qa.s1"],f"student_answers?select=file_url&submission_id=eq.{SID}&file_url=not.is.null").json()
def dl(w,path): return requests.get(f"{U}/storage/v1/object/authenticated/answer-files/{path}",headers={"apikey":K,"Authorization":"Bearer "+t[w]})
hb={f["file_url"]:hashlib.sha256(dl("qa.s1",f["file_url"]).content).hexdigest() for f in files}
ok("CP10 S1 app replace refused", up("qa.s1",qs2[1]["id"],file="ans.png").status_code in (400,409) and up("qa.s1",qs2[0]["id"],"new").status_code in (400,409))
pth=files[0]["file_url"]
r=requests.post(f"{U}/storage/v1/object/answer-files/{pth}",headers={"apikey":K,"Authorization":"Bearer "+t["qa.s1"],"x-upsert":"true","Content-Type":"image/png"},data=b"tamper")
r2=requests.delete(f"{U}/storage/v1/object/answer-files/{pth}",headers={"apikey":K,"Authorization":"Bearer "+t["qa.s1"]})
r3=requests.post(f"{U}/storage/v1/object/answer-files/{pth.rsplit('/',1)[0]}/qa-new.png",headers={"apikey":K,"Authorization":"Bearer "+t["qa.s1"],"Content-Type":"image/png"},data=b"x")
ha={k:hashlib.sha256(dl("qa.s1",k).content).hexdigest() for k in hb}
ok("CP10 direct storage overwrite/delete/add refused, bytes unchanged", r.status_code>=400 and r3.status_code>=400 and ha==hb and all(dl("qa.t1",k).status_code==200 for k in hb), f"{r.status_code}/{r2.status_code}/{r3.status_code}")
s2=[rest(t["qa.s2"],f"student_submissions?select=id&id=eq.{SID}").json(), rest(t["qa.s2"],f"student_answers?select=id&submission_id=eq.{SID}").json()]
ok("CP10 S2 cannot read S1 rows or files", s2==[[],[]] and all(dl("qa.s2",k).status_code>=400 for k in hb))
fin=rest(t["qa.s1"],f"student_submissions?select=status,total_score&id=eq.{SID}").json()[0]
ok("CP10 S1 reads finalized total", fin["status"]=="finalized" and float(fin["total_score"])==exp, str(fin))
print("RESULT", json.dumps(R))
