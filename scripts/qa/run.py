import sys, subprocess, json
from common import *
RUN, DATE = sys.argv[1], sys.argv[2]; FIX = sys.argv[3:] and sys.argv[3]
adm=session("qa.admin")["access_token"]; t1=session("qa.t1")["access_token"]
ids=[a["id"] for a in rest(t1,"assignments?select=id&teacher_id=eq.584d68ef-c42f-4b53-9ffa-bdce38622355&source=eq.auto_homework&is_published=eq.true").json()]
drafts_before=rest(t1,"assignments?select=id,generation_status&teacher_id=eq.584d68ef-c42f-4b53-9ffa-bdce38622355&is_published=eq.false").json()
dry=fn(adm,"qa-reset",{"assignment_ids":ids,"dry_run":True}).json()
real=fn(adm,"qa-reset",{"assignment_ids":ids,"dry_run":False}).json()
drafts_after=rest(t1,"assignments?select=id,generation_status&teacher_id=eq.584d68ef-c42f-4b53-9ffa-bdce38622355&is_published=eq.false").json()
print("RESET dry", json.dumps({k:(len(v) if isinstance(v,list) else v) for k,v in dry.items()}))
print("RESET real", json.dumps(real)[:900])
print("RESET generation-test drafts untouched:", sorted(map(str,drafts_before))==sorted(map(str,drafts_after)), len(drafts_after))
