"""Batch 2 varied-question marking (real AI). QA students on a fresh QA-teacher homework set."""
import time, json
from common import session, fn, rest
A = '7a2df959-46fa-477b-acbb-3d9a1b6a1d2d'
t = {w: session(w)['access_token'] for w in ['qa.t1', 'qa.s1', 'qa.s2']}
qs = sorted(rest(t['qa.t1'], f'assignment_questions?select=id,question_number,max_score&assignment_id=eq.{A}').json(), key=lambda q: q['question_number'])
# Expected marks set from the actual generated questions before testing.
# Maxima are 2,2,3,3,4. S1 is correct except Q2 partial; S2 is wrong.
ANS = {
 'qa.s1': [
  'Option b, 3x - 4y = 10, because it contains two variables x and y, both to power one. Option a is linear but has only one variable x, so it is not in two variables.',
  'Substitute x=2: 2(2)+y=7, so 4+y=7.',
  'Yes. Substitute x=1 and y=2: the left side is 1+2=3, equal to the right side, so (1,2) is a solution.',
  'Let x be the number of apples and y the number of oranges. Their costs give 5x + 10y = 50.',
  'The claim is wrong. (2,3) works, but so do (0,5), (1,4), (5,0), and infinitely many real pairs. For every real x, y=5-x, so there is not only one solution.'],
 'qa.s2': [
  'Option a because it has numbers.',
  'y is 7 because that is the answer.',
  'No, because one and two are different numbers.',
  'x + y = 50.',
  'The claim is correct because two plus three is five.']}
EXPECT = {'qa.s1': [2, 1, 3, 3, 4], 'qa.s2': [0, 0, 0, 0, 0]}
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
