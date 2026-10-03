import concurrent.futures
import json
import statistics
import time

from common import fn, rest, session

A = json.load(open("state_rc.json"))["A"]
USERS = ["qa.s1", "qa.s2"]
QUESTIONS = json.load(open("state_rc.json"))["qs"]
TOKENS = {who: session(who)["access_token"] for who in ["qa.admin", "qa.t1", *USERS]}
UIDS = {who: session(who)["user"]["id"] for who in USERS}


def timed(label, call):
    started = time.perf_counter()
    response = call()
    return {
        "label": label,
        "status": response.status_code,
        "seconds": round(time.perf_counter() - started, 3),
        "body": response.text[:300],
    }


def reset():
    response = fn(TOKENS["qa.admin"], "qa-reset", {"assignment_ids": [A], "dry_run": False})
    if response.status_code != 200:
        raise RuntimeError(f"QA reset failed: {response.status_code} {response.text[:300]}")
    payload = response.json()
    if payload.get("unrelated_unchanged") is not True:
        raise RuntimeError(f"QA reset guard failed: {payload}")
    return payload


def answer_rows():
    return rest(
        TOKENS["qa.t1"],
        f"student_answers?select=id,student_id,question_id,processing_status,ai_score,processing_error,created_at,updated_at&submission_id=in.(select)",
    )


def scoped_rows():
    submissions = rest(
        TOKENS["qa.t1"],
        f"student_submissions?select=id,student_id,status&assignment_id=eq.{A}",
    ).json()
    submission_ids = [row["id"] for row in submissions]
    answers = []
    if submission_ids:
        answers = rest(
            TOKENS["qa.t1"],
            "student_answers?select=id,submission_id,student_id,question_id,processing_status,ai_score,processing_error,created_at,updated_at"
            + "&submission_id=in.(" + ",".join(submission_ids) + ")",
        ).json()
    return submissions, answers


def wait_for_answers(expected, timeout=150):
    started = time.perf_counter()
    last = ([], [])
    while time.perf_counter() - started < timeout:
        last = scoped_rows()
        if len(last[1]) == expected and all(row["processing_status"] in ("success", "failed") for row in last[1]):
            return last, round(time.perf_counter() - started, 3)
        time.sleep(1)
    return last, round(time.perf_counter() - started, 3)


def upload_mock(who, index):
    score = [2, 1, 3, 2][index]
    text = "QAMOCK " + json.dumps({"score": score, "score_delay_ms": 750})
    return timed(
        f"{who}-q{index + 1}",
        lambda: fn(TOKENS[who], "manage-assignment", {
            "action": "upload_answer",
            "assignment_id": A,
            "question_id": QUESTIONS[index]["id"],
            "extracted_text": text,
        }),
    )


def submit(who):
    return timed(
        f"{who}-submit",
        lambda: fn(TOKENS[who], "manage-assignment", {
            "action": "finalize_submission",
            "assignment_id": A,
        }),
    )


def run_mocked():
    before = reset()
    started = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        uploads = list(pool.map(lambda item: upload_mock(*item), [(u, q) for u in USERS for q in range(4)]))
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        submissions = list(pool.map(submit, USERS))
    (stored_submissions, answers), settle_seconds = wait_for_answers(8)
    elapsed = round(time.perf_counter() - started, 3)
    pairs = [(row["student_id"], row["question_id"]) for row in answers]
    result = {
        "cohort": {"requested": 40, "eligible_allowlisted": len(USERS), "accounts": USERS},
        "uploads": uploads,
        "submissions": submissions,
        "elapsed_seconds": elapsed,
        "settle_seconds": settle_seconds,
        "latency_seconds": {
            "min": min(row["seconds"] for row in uploads),
            "median": round(statistics.median(row["seconds"] for row in uploads), 3),
            "max": max(row["seconds"] for row in uploads),
        },
        "stored": {
            "submissions": len(stored_submissions),
            "answers": len(answers),
            "successful": sum(row["processing_status"] == "success" for row in answers),
            "failed": sum(row["processing_status"] == "failed" for row in answers),
            "processing": sum(row["processing_status"] == "processing" for row in answers),
            "duplicate_student_question_pairs": len(pairs) - len(set(pairs)),
        },
        "pass": (
            all(row["status"] == 200 for row in uploads + submissions)
            and len(stored_submissions) == 2
            and len(answers) == 8
            and all(row["processing_status"] == "success" for row in answers)
            and len(pairs) == len(set(pairs))
        ),
        "reset_before": before,
    }
    result["reset_after"] = reset()
    return result


def upload_real(index):
    answers = [
        "0 is rational because 0 = 0/1. sqrt 2 is irrational and cannot be written as p/q.",
        "Use a common denominator: 2 = 8/4 and 3 = 12/4, so 9/4, 10/4 and 11/4 are three rational numbers between them.",
        "8 = 2 x 2 x 2, so it only has factors 2 and can make a power-of-ten denominator, so 7/8 terminates. The denominator 3 has another prime factor, so 1/3 repeats.",
        "x = 0.666..., 10x = 6.666..., subtracting gives 9x = 6.",
    ]
    return timed(
        f"qa.s1-real-q{index + 1}",
        lambda: fn(TOKENS["qa.s1"], "manage-assignment", {
            "action": "upload_answer",
            "assignment_id": A,
            "question_id": QUESTIONS[index]["id"],
            "extracted_text": answers[index],
        }),
    )


def run_real_sample():
    reset()
    started = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        uploads = list(pool.map(upload_real, range(4)))
    submission = submit("qa.s1")
    (submissions, answers), settle_seconds = wait_for_answers(4, timeout=240)
    ordered = sorted(answers, key=lambda row: next(q["question_number"] for q in QUESTIONS if q["id"] == row["question_id"]))
    result = {
        "sample_students": 1,
        "answers": 4,
        "uploads": uploads,
        "submission": submission,
        "elapsed_seconds": round(time.perf_counter() - started, 3),
        "settle_seconds": settle_seconds,
        "stored_scores": [row["ai_score"] for row in ordered],
        "stored_statuses": [row["processing_status"] for row in ordered],
        "pass": (
            all(row["status"] == 200 for row in uploads)
            and submission["status"] == 200
            and len(submissions) == 1
            and len(answers) == 4
            and all(row["processing_status"] == "success" for row in answers)
        ),
    }
    result["reset_after"] = reset()
    return result


if __name__ == "__main__":
    output = {
        "mocked_limited_load": run_mocked(),
        "real_ai_sample": run_real_sample(),
    }
    with open("result_batch2_load.json", "w") as handle:
        json.dump(output, handle, indent=2)
    print(json.dumps(output, indent=2))