import sys,json
from common import *
A=sys.argv[1]; adm=session("qa.admin")["access_token"]; t1=session("qa.t1")["access_token"]
dr=lambda: sorted(json.dumps(x) for x in rest(t1,"assignments?select=id,generation_status&teacher_id=eq.584d68ef-c42f-4b53-9ffa-bdce38622355&is_published=eq.false").json())
qq=lambda: rest(t1,f"assignment_questions?select=id,question_text,max_score&assignment_id=eq.{A}").json()
d0,q0=dr(),qq()
r=fn(adm,"qa-reset",{"assignment_ids":[A],"dry_run":False}).json()
print("RESET",json.dumps(r["report"]),"unrelated_unchanged",r["unrelated_unchanged"],"| homework questions unchanged",q0==qq(),"| drafts unchanged",d0==dr(),len(d0))
