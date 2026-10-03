ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS generation_status text NOT NULL DEFAULT 'complete'
    CHECK (generation_status IN ('generating','failed','complete')),
  ADD COLUMN IF NOT EXISTS generation_attempt uuid,
  ADD COLUMN IF NOT EXISTS generation_expires_at timestamptz;

-- Existing empty auto drafts are incomplete reservations, not reviewable homework.
UPDATE public.assignments a SET generation_status='failed'
WHERE a.source='auto_homework' AND a.is_published=false
  AND NOT EXISTS (SELECT 1 FROM public.assignment_questions q WHERE q.assignment_id=a.id);

-- Server-side guard: nothing incomplete can ever be published.
CREATE OR REPLACE FUNCTION public.block_incomplete_publish()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.is_published AND NEW.generation_status <> 'complete' THEN
    RAISE EXCEPTION 'Homework is not fully generated and cannot be published' USING ERRCODE='check_violation';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_block_incomplete_publish ON public.assignments;
CREATE TRIGGER trg_block_incomplete_publish BEFORE INSERT OR UPDATE ON public.assignments
FOR EACH ROW EXECUTE FUNCTION public.block_incomplete_publish();

-- Next school day after a date: skips Sat/Sun, national holidays and the teacher's own holidays.
CREATE OR REPLACE FUNCTION public.next_school_day(_teacher uuid, _class text, _board text, _section text, _from date)
RETURNS date LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE d date := _from + 1; i int := 0;
BEGIN
  WHILE i < 60 LOOP
    IF extract(isodow FROM d) < 6
       AND NOT EXISTS (SELECT 1 FROM national_holidays WHERE date=d)
       AND NOT EXISTS (SELECT 1 FROM calendar c WHERE c.date=d AND c.entry_type='holiday'
            AND c.teacher_id=_teacher AND c.class_name=_class
            AND (_board IS NULL OR c.board IS NULL OR c.board=_board)
            AND (_section IS NULL OR c.section IS NULL OR c.section=_section)) THEN
      RETURN d;
    END IF;
    d := d + 1; i := i + 1;
  END LOOP;
  RETURN d;
END $$;
REVOKE ALL ON FUNCTION public.next_school_day(uuid,text,text,text,date) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_school_day(uuid,text,text,text,date) TO service_role;

-- Atomic completion: only the attempt holding the reservation can write; questions + state in one transaction.
CREATE OR REPLACE FUNCTION public.complete_homework_generation(_id uuid, _attempt uuid, _title text, _description text, _due timestamptz, _questions jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE n int;
BEGIN
  PERFORM 1 FROM assignments WHERE id=_id AND generation_attempt=_attempt AND generation_status='generating' FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  DELETE FROM assignment_questions WHERE assignment_id=_id;
  INSERT INTO assignment_questions (assignment_id, question_number, question_text, max_score, rubric, expected_answer_hints)
  SELECT _id, (q->>'n')::int, q->>'text', (q->>'marks')::int, jsonb_build_object('layer', q->>'layer'), NULLIF(q->>'hint','')
  FROM jsonb_array_elements(_questions) q;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 5 THEN RAISE EXCEPTION 'expected 5 questions'; END IF;
  UPDATE assignments SET title=_title, description=_description,
    instructions='Answer each question in your own words. Show your thinking!',
    max_total_score=(SELECT sum((q->>'marks')::int) FROM jsonb_array_elements(_questions) q),
    due_date=_due, generation_status='complete', generation_expires_at=NULL, is_published=false
  WHERE id=_id;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.complete_homework_generation(uuid,uuid,text,text,timestamptz,jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_homework_generation(uuid,uuid,text,text,timestamptz,jsonb) TO service_role;