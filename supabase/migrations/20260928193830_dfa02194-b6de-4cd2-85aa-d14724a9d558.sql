WITH ch(subject, chapter_id, chapter_name, color, topics) AS (VALUES
 ('Mathematics','cbse9-math-ch1','Real Numbers','#2563eb', ARRAY['Irrational Numbers','Real Numbers and Decimal Expansions','Representing Real Numbers on the Number Line','Operations on Real Numbers','Laws of Exponents for Real Numbers']),
 ('Physics','cbse9-phy-ch1','Motion','#7c3aed', ARRAY['Describing Motion','Distance and Displacement','Uniform and Non-uniform Motion','Speed and Velocity','Acceleration','Distance-Time and Velocity-Time Graphs','Equations of Motion','Uniform Circular Motion']),
 ('Chemistry','cbse9-chem-ch1','Matter in Our Surroundings','#059669', ARRAY['Physical Nature of Matter','Characteristics of Particles of Matter','States of Matter','Can Matter Change its State?','Evaporation']),
 ('Biology','cbse9-bio-ch1','The Fundamental Unit of Life','#16a34a', ARRAY['Discovery of the Cell','Plasma Membrane','Cell Wall','Nucleus','Cytoplasm','Cell Organelles']),
 ('English','cbse9-eng-ch1','The Fun They Had','#db2777', ARRAY['Reading: The Fun They Had','Thinking about the Text','Vocabulary and Language Use','Poem: The Road Not Taken','Writing Task']),
 ('Hindi','cbse9-hin-ch1','दो बैलों की कथा','#ea580c', ARRAY['पाठ परिचय और लेखक','कथा पठन भाग 1','कथा पठन भाग 2','प्रश्न-अभ्यास','भाषा अध्ययन']),
 ('Sanskrit','cbse9-san-ch1','भारतीवसन्तगीतिः','#ca8a04', ARRAY['पाठ परिचय','श्लोक पठन और अर्थ','शब्दार्थ','अभ्यास प्रश्न']),
 ('Social Science','cbse9-sst-ch1','The French Revolution','#0891b2', ARRAY['French Society in the Late 18th Century','The Outbreak of the Revolution','France Abolishes Monarchy and Becomes a Republic','Did Women Have a Revolution?','The Abolition of Slavery','The Revolution and Everyday Life'])
),
days AS (
 SELECT d::date AS date, row_number() OVER (ORDER BY d) - 1 AS n
 FROM generate_series('2026-09-01'::date,'2026-10-05'::date,'1 day') d
 WHERE extract(isodow FROM d) < 7 AND d::date <> '2026-10-02'
)
INSERT INTO public.calendar (teacher_id, class_name, board, subject, date, entry_type, chapter_id, chapter_name, chapter_color, topic_key, topic_title, is_national_holiday)
SELECT 'a34cf097-2ec5-4e93-9e5f-bf035ff116ad', 'Class 9', 'CBSE', ch.subject, days.date,
  CASE WHEN days.n % (array_length(ch.topics,1)+1) = array_length(ch.topics,1) THEN 'practice' ELSE 'topic' END,
  ch.chapter_id, ch.chapter_name, ch.color, ch.chapter_id,
  CASE WHEN days.n % (array_length(ch.topics,1)+1) = array_length(ch.topics,1) THEN 'Practice & Revision'
       ELSE ch.topics[(days.n % (array_length(ch.topics,1)+1)) + 1] END,
  false
FROM ch CROSS JOIN days
WHERE NOT EXISTS (SELECT 1 FROM public.calendar c WHERE c.class_name='Class 9' AND c.subject=ch.subject AND c.date=days.date)
ON CONFLICT DO NOTHING;

INSERT INTO public.calendar (teacher_id, class_name, board, subject, date, entry_type, label, is_national_holiday)
SELECT 'a34cf097-2ec5-4e93-9e5f-bf035ff116ad','Class 9','CBSE', s, '2026-10-02','holiday','Gandhi Jayanti', true
FROM unnest(ARRAY['Mathematics','Physics','Chemistry','Biology','English','Hindi','Sanskrit','Social Science']) s
WHERE NOT EXISTS (SELECT 1 FROM public.calendar c WHERE c.class_name='Class 9' AND c.subject=s AND c.date='2026-10-02')
ON CONFLICT DO NOTHING;