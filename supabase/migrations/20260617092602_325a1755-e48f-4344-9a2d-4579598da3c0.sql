
-- 1. Schema: scope chapters per board + class
ALTER TABLE public.tb_chapters
  ADD COLUMN IF NOT EXISTS board TEXT,
  ADD COLUMN IF NOT EXISTS grade INTEGER;

-- 2. Backfill from parent subject
UPDATE public.tb_chapters c
SET board = s.board, grade = s.grade
FROM public.subjects s
WHERE c.subject_id = s.id AND (c.board IS NULL OR c.grade IS NULL);

CREATE INDEX IF NOT EXISTS idx_tb_chapters_board_grade_subject
  ON public.tb_chapters (board, grade, subject_id);

-- 3. Seed CBSE Grade 9 Physics subject + chapters + episodes
DO $$
DECLARE
  v_subject_id uuid;
  v_ch_id uuid;
BEGIN
  -- Create or fetch the CBSE / Grade 9 / Physics subject
  SELECT id INTO v_subject_id
  FROM public.subjects
  WHERE name = 'Physics' AND board = 'CBSE' AND grade = 9
  LIMIT 1;

  IF v_subject_id IS NULL THEN
    INSERT INTO public.subjects (name, board, grade, color, icon, sort_order)
    VALUES ('Physics', 'CBSE', 9, '#8B5CF6', '⚡', 7)
    RETURNING id INTO v_subject_id;
  END IF;

  -- Helper: insert a chapter + its episodes if the chapter slug is not present
  -- Chapter 1: Motion
  IF NOT EXISTS (SELECT 1 FROM public.tb_chapters WHERE slug = 'cbse9-phy-ch1') THEN
    INSERT INTO public.tb_chapters (subject_id, slug, number, title, subtitle, color, periods, board, grade, sort_order)
    VALUES (v_subject_id, 'cbse9-phy-ch1', 1, 'Motion', 'Describing how things move', '#3b82f6', 12, 'CBSE', 9, 1)
    RETURNING id INTO v_ch_id;
    INSERT INTO public.tb_episodes (chapter_id, slug, number, title, subtitle, duration, type, sort_order) VALUES
      (v_ch_id, 'cbse9-phy-ch1-ep1', 1, 'Introduction to Motion', 'Rest and motion are relative', '10 min', 'Concept', 1),
      (v_ch_id, 'cbse9-phy-ch1-ep2', 2, 'Distance and Displacement', 'Path length vs shortest distance', '10 min', 'Concept', 2),
      (v_ch_id, 'cbse9-phy-ch1-ep3', 3, 'Speed and Velocity', 'Rate of change of distance and displacement', '10 min', 'Concept', 3),
      (v_ch_id, 'cbse9-phy-ch1-ep4', 4, 'Acceleration', 'Rate of change of velocity', '10 min', 'Concept', 4),
      (v_ch_id, 'cbse9-phy-ch1-ep5', 5, 'Equations of Motion', 'Three equations for uniform acceleration', '12 min', 'Concept', 5),
      (v_ch_id, 'cbse9-phy-ch1-ep6', 6, 'Graphical Representation', 'Distance-time and velocity-time graphs', '10 min', 'Concept', 6),
      (v_ch_id, 'cbse9-phy-ch1-ep7', 7, 'Uniform Circular Motion', 'Motion along a circular path', '10 min', 'Concept', 7);
  END IF;

  -- Chapter 2: Force and Laws of Motion
  IF NOT EXISTS (SELECT 1 FROM public.tb_chapters WHERE slug = 'cbse9-phy-ch2') THEN
    INSERT INTO public.tb_chapters (subject_id, slug, number, title, subtitle, color, periods, board, grade, sort_order)
    VALUES (v_subject_id, 'cbse9-phy-ch2', 2, 'Force and Laws of Motion', 'Newton''s three laws', '#7c3aed', 12, 'CBSE', 9, 2)
    RETURNING id INTO v_ch_id;
    INSERT INTO public.tb_episodes (chapter_id, slug, number, title, subtitle, duration, type, sort_order) VALUES
      (v_ch_id, 'cbse9-phy-ch2-ep1', 1, 'Balanced and Unbalanced Forces', 'What is a force?', '10 min', 'Concept', 1),
      (v_ch_id, 'cbse9-phy-ch2-ep2', 2, 'Newton''s First Law', 'Law of inertia', '10 min', 'Concept', 2),
      (v_ch_id, 'cbse9-phy-ch2-ep3', 3, 'Inertia and Mass', 'Why mass measures inertia', '10 min', 'Concept', 3),
      (v_ch_id, 'cbse9-phy-ch2-ep4', 4, 'Newton''s Second Law', 'F = ma', '12 min', 'Concept', 4),
      (v_ch_id, 'cbse9-phy-ch2-ep5', 5, 'Newton''s Third Law', 'Action and reaction', '10 min', 'Concept', 5),
      (v_ch_id, 'cbse9-phy-ch2-ep6', 6, 'Conservation of Momentum', 'Momentum before = momentum after', '12 min', 'Concept', 6);
  END IF;

  -- Chapter 3: Gravitation
  IF NOT EXISTS (SELECT 1 FROM public.tb_chapters WHERE slug = 'cbse9-phy-ch3') THEN
    INSERT INTO public.tb_chapters (subject_id, slug, number, title, subtitle, color, periods, board, grade, sort_order)
    VALUES (v_subject_id, 'cbse9-phy-ch3', 3, 'Gravitation', 'Universal law and free fall', '#ec4899', 12, 'CBSE', 9, 3)
    RETURNING id INTO v_ch_id;
    INSERT INTO public.tb_episodes (chapter_id, slug, number, title, subtitle, duration, type, sort_order) VALUES
      (v_ch_id, 'cbse9-phy-ch3-ep1', 1, 'Universal Law of Gravitation', 'Why apples fall and moons orbit', '12 min', 'Concept', 1),
      (v_ch_id, 'cbse9-phy-ch3-ep2', 2, 'Free Fall and g', 'Acceleration due to gravity', '10 min', 'Concept', 2),
      (v_ch_id, 'cbse9-phy-ch3-ep3', 3, 'Mass vs Weight', 'Same thing? No.', '10 min', 'Concept', 3),
      (v_ch_id, 'cbse9-phy-ch3-ep4', 4, 'Thrust and Pressure', 'Force per unit area', '10 min', 'Concept', 4),
      (v_ch_id, 'cbse9-phy-ch3-ep5', 5, 'Archimedes Principle', 'Why things float', '10 min', 'Concept', 5),
      (v_ch_id, 'cbse9-phy-ch3-ep6', 6, 'Relative Density', 'Comparing densities', '10 min', 'Concept', 6);
  END IF;

  -- Chapter 4: Work and Energy
  IF NOT EXISTS (SELECT 1 FROM public.tb_chapters WHERE slug = 'cbse9-phy-ch4') THEN
    INSERT INTO public.tb_chapters (subject_id, slug, number, title, subtitle, color, periods, board, grade, sort_order)
    VALUES (v_subject_id, 'cbse9-phy-ch4', 4, 'Work and Energy', 'The currency of physics', '#10b981', 10, 'CBSE', 9, 4)
    RETURNING id INTO v_ch_id;
    INSERT INTO public.tb_episodes (chapter_id, slug, number, title, subtitle, duration, type, sort_order) VALUES
      (v_ch_id, 'cbse9-phy-ch4-ep1', 1, 'Work Done by a Force', 'When force causes displacement', '10 min', 'Concept', 1),
      (v_ch_id, 'cbse9-phy-ch4-ep2', 2, 'Kinetic Energy', 'Energy of motion', '10 min', 'Concept', 2),
      (v_ch_id, 'cbse9-phy-ch4-ep3', 3, 'Potential Energy', 'Stored energy', '10 min', 'Concept', 3),
      (v_ch_id, 'cbse9-phy-ch4-ep4', 4, 'Law of Conservation of Energy', 'Energy is never lost', '10 min', 'Concept', 4),
      (v_ch_id, 'cbse9-phy-ch4-ep5', 5, 'Power', 'Rate of doing work', '10 min', 'Concept', 5),
      (v_ch_id, 'cbse9-phy-ch4-ep6', 6, 'Commercial Unit of Energy', 'The kilowatt-hour', '8 min', 'Concept', 6);
  END IF;

  -- Chapter 5: Sound
  IF NOT EXISTS (SELECT 1 FROM public.tb_chapters WHERE slug = 'cbse9-phy-ch5') THEN
    INSERT INTO public.tb_chapters (subject_id, slug, number, title, subtitle, color, periods, board, grade, sort_order)
    VALUES (v_subject_id, 'cbse9-phy-ch5', 5, 'Sound', 'Vibrations, waves, and echoes', '#f59e0b', 10, 'CBSE', 9, 5)
    RETURNING id INTO v_ch_id;
    INSERT INTO public.tb_episodes (chapter_id, slug, number, title, subtitle, duration, type, sort_order) VALUES
      (v_ch_id, 'cbse9-phy-ch5-ep1', 1, 'Production of Sound', 'Vibrating objects', '10 min', 'Concept', 1),
      (v_ch_id, 'cbse9-phy-ch5-ep2', 2, 'Propagation of Sound', 'Sound needs a medium', '10 min', 'Concept', 2),
      (v_ch_id, 'cbse9-phy-ch5-ep3', 3, 'Characteristics of a Sound Wave', 'Pitch, loudness, quality', '10 min', 'Concept', 3),
      (v_ch_id, 'cbse9-phy-ch5-ep4', 4, 'Speed of Sound in Different Media', 'Why sound travels faster in solids', '10 min', 'Concept', 4),
      (v_ch_id, 'cbse9-phy-ch5-ep5', 5, 'Reflection of Sound and Echo', 'Hearing your own voice back', '10 min', 'Concept', 5),
      (v_ch_id, 'cbse9-phy-ch5-ep6', 6, 'Range of Hearing and Applications', 'Ultrasound and SONAR', '10 min', 'Concept', 6);
  END IF;
END $$;
