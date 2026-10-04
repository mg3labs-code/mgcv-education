"""Batch 2 varied-question marking (real AI). QA students on a fresh QA-teacher homework set."""
import time, json
from common import session, fn, rest
A = 'a18d21e2-c627-426e-b90a-83e7903cad2e'
t = {w: session(w)['access_token'] for w in ['qa.t1', 'qa.s1', 'qa.s2']}
qs = sorted(rest(t['qa.t1'], f'assignment_questions?select=id,question_number,max_score&assignment_id=eq.{A}').json(), key=lambda q: q['question_number'])
# Teacher-approved expectations (max 1,2,3,3,3): S1 fully correct, S2 wrong. S1 Q4 is partial (equation only).
ANS = {
 'qa.s1': [
  'Option c: 3x - 4y = 10. It has x and y, each with power 1. Option a has only one variable, and option b has x squared.',
  'Put x=2 and y=1: 2(2)+5(1)=4+5=9, which equals the right side, so (2,1) is a solution.',
  'Infinitely many. For every real x, y = 5 - x gives a matching y, e.g. (1,4), (2.5,2.5), (-1,6). Since x can be any real number there are infinitely many pairs.',
  'Let x be the cost of a pen and y the cost of a notebook: 2x + 3y = 120.',
  'Rahul is wrong. x = 5 can be written as 1x + 0y - 5 = 0, so it is a linear equation in two variables with the y coefficient zero.'],
 'qa.s2': [
  'Option a because it has numbers.',
  '2 plus 1 is 3, so no.',
  'Only five solutions because the answer is 5.',
  '2+3=5 so each item costs 24 rupees.',
  'Rahul is correct because y is missing.']}
EXPECT = {'qa.s1': [1, 2, 3, 1, 3], 'qa.s2': [0, 0, 0, 0, 0]}
log = {}
for w in ANS:
    log[w] = [fn(t[w], 'manage-assignment', {'action': 'upload_answer', 'assignment_id': A, 'question_id': q['id'], 'extracted_text': a}).status_code for q, a in zip(qs, ANS[w])]
    log[w].append(fn(t[w], 'manage-assignment', {'action': 'finalize_submission', 'assignment_id': A}).status_code)
print('http', log)
num = {q['id']: q['question_number'] for q in qs}
start = time.time(); rows = []
while time.time() - start < 240:
    subs = rest(t['qa.t1'], f'student_submissions?select=id&assignment_id=eq.{A}').json()
    ids = [s['id'] for s in subs]
    rows = rest(t['qa.t1'], 'student_answers?select=student_id,question_id,processing_status,ai_score,ai_feedback&submission_id=in.(' + ','.join(ids) + ')').json() if ids else []
    if len(rows) == 10 and all(r['processing_status'] in ('success', 'failed') for r in rows): break
    time.sleep(3)
SID = {'e7367856-41e7-47eb-9fdf-4ef8a814c350': 'qa.s1', '1f2cd957-7a8f-49d2-90a7-cd38673c5bb7': 'qa.s2'}
res = []
for r in sorted(rows, key=lambda r: (SID[r['student_id']], num[r['question_id']])):
    w = SID[r['student_id']]; n = num[r['question_id']]
    exp = EXPECT[w][n - 1]; got = None if r['ai_score'] is None else float(r['ai_score'])
    res.append({'student': w, 'q': n, 'status': r['processing_status'], 'expected': exp, 'got': got, 'pass': got == exp, 'feedback': r['ai_feedback']})
out = {'elapsed_s': round(time.time() - start, 1), 'http': log, 'pass_count': sum(x['pass'] for x in res), 'total': len(res), 'rows': res}
json.dump(out, open('result_batch2_varied.json', 'w'), indent=2)
for x in res: print(x['student'], x['q'], x['status'], 'exp', x['expected'], 'got', x['got'], 'PASS' if x['pass'] else 'FAIL')
print('pass', out['pass_count'], '/', out['total'], 'elapsed', out['elapsed_s'])
