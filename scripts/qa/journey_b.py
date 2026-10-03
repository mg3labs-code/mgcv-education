import sys, time, json, hashlib, threading
from common import *
RUN = sys.argv[1]; FIX = len(sys.argv)>2 and sys.argv[2]=="fix"
st=json.load(open(f"state_{RUN}.json")); A=st["A"]; R=st["R"]
F=json.load(open(f"fixture_{RUN}.json"))
ok=lambda k,v,d="": (R.__setitem__(k,("PASS" if v else "FAIL")+(" "+d if d else "")), print(k, R[k]), (v or (_ for _ in ()).throw(SystemExit("STOP at "+k))))
t={w:session(w)["access_token"] for w in ["qa.t1","qa.t2","qa.s1","qa.s2","qa.s3","qa.s4"]}
qs2=sorted(requests.post(f"{U}/rest/v1/rpc/get_teacher_assignment_questions",headers={"apikey":K,"Authorization":"Bearer "+t["qa.t1"]},json={"_assignment_ids":[A]}).json(),key=lambda q:q["question_number"])
# CP6 submission
def up(w,qid,text=None,file=None):
  if file:
    mt="image/png" if file.endswith("png") else "application/pdf"
    # pdf file is actually png bytes renamed? build real pdf
    return requests.post(f"{U}/functions/v1/manage-assignment",headers={"apikey":K,"Authorization":"Bearer "+t[w]},data={"action":"upload_answer","assignment_id":A,"question_id":qid},files={"file":(file,open(file,"rb"),mt)})
  return fn(t[w],"manage-assignment",{"action":"upload_answer","assignment_id":A,"question_id":qid,"extracted_text":text})
ok("CP6 S3 (9B) upload refused", up("qa.s3",qs2[0]["id"],"x").status_code==403)
ts=time.time()
def send(w,spec):
  return [up(w,qs2[i]["id"],file=x["file"]) if "file" in x else up(w,qs2[i]["id"],x["text"]) for i,x in enumerate(spec)]
rs=send("qa.s1",F["s1"])
ok("CP6 4 answers accepted", all(r.status_code==200 for r in rs), str([r.status_code for r in rs]))
f=fn(t["qa.s1"],"manage-assignment",{"action":"finalize_submission","assignment_id":A})
ok("CP6 submit", f.status_code==200)
sub=rest(t["qa.s1"],f"student_submissions?select=id,status&assignment_id=eq.{A}").json()
ok("CP6 one submission, submitted", len(sub)==1 and sub[0]["status"]=="submitted"); SID=sub[0]["id"]
rs2=send("qa.s2",F["s2"]); f2=fn(t["qa.s2"],"manage-assignment",{"action":"finalize_submission","assignment_id":A})
ok("CP6 S2 answers + submit", all(r.status_code==200 for r in rs2) and f2.status_code==200)
SID2=rest(t["qa.s2"],f"student_submissions?select=id&assignment_id=eq.{A}").json()[0]["id"]
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
while time.time()-ts<400:
  an2=rest(t["qa.t1"],f"student_answers?select=id,question_id,processing_status,ai_score,ai_feedback&submission_id=eq.{SID2}").json()
  if len(an2)==4 and all(a["processing_status"] in("success","failed") for a in an2): break
  time.sleep(5)
# Marking quality: teacher-defined expected ranges (fraction of max) per answer
qual=[]
for who,rows in [("s1",an),("s2",an2)]:
  for a in rows:
    n=order[a["question_id"]]; lo,hi=F[who][n-1]["range"]; frac=float(a["ai_score"] or 0)/mx[a["question_id"]]
    qual.append((who,n,F[who][n-1]["kind"],a["ai_score"],mx[a["question_id"]],[lo,hi], lo<=frac<=hi and a["processing_status"]=="success"))
print("QUALITY", json.dumps(qual))
ok("CP7 marking within expected ranges (correct/partial/incorrect)", all(q[-1] for q in qual), str([(q[0],q[1],q[2],q[3],q[4]) for q in qual if not q[-1]]))
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
if FIX:
  an2s={order[a["question_id"]]:a for a in an2}
  g4=[fn(t["qa.t1"],"manage-assignment",{"action":"teacher_grade","answer_id":an2s[i+1]["id"],"teacher_score":v,"teacher_feedback":"QA controlled score"}).status_code for i,v in enumerate([2,1,4,3])]
  ov=fn(t["qa.t1"],"manage-assignment",{"action":"teacher_grade","answer_id":an2s[1]["id"],"teacher_score":0,"teacher_feedback":"QA override"}).status_code
  totals=[fn(t["qa.t1"],"manage-assignment",{"action":"teacher_finalize","submission_id":SID2}).json().get("total_score") for _ in range(3)]
  ok("TOTAL controlled S2 2,1,4,3 then Q1->0 = 8, stable over 3 finalizes", all(x==200 for x in g4+[ov]) and all(float(x)==8 for x in totals), str(totals))
if False:
  fz3=fn(t["qa.t1"],"manage-assignment",{"action":"teacher_finalize","submission_id":SID}).json()
  ok("CP9 controlled total = 8, unchanged after 3 finalizes", exp==8 and float(fz3["total_score"])==8, f"{fz['total_score']}/{fz2['total_score']}/{fz3['total_score']}")
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
json.dump(R,open(f"result_{RUN}.json","w"),indent=1); print("RESULT", json.dumps(R))
