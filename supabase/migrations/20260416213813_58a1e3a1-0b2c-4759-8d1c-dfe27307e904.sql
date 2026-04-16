
-- ========= 1. Insert Biology subject =========
INSERT INTO public.subjects (name, board, grade, color, icon, sort_order)
VALUES ('Biology', 'Telangana', 10, '#16A34A', '🧬', 6)
ON CONFLICT DO NOTHING;

-- ========= 2. Insert Biology chapters (Class 10 Telangana Board) =========
WITH bio AS (SELECT id FROM public.subjects WHERE name = 'Biology' LIMIT 1)
INSERT INTO public.tb_chapters (subject_id, number, slug, title, subtitle, color, periods, page_range, sort_order, is_published)
SELECT bio.id, c.number, c.slug, c.title, c.subtitle, '#16A34A', c.periods, c.page_range, c.number, true
FROM bio, (VALUES
  (1, 'bio-ch1', 'Nutrition – Food Supplying System', 'How living things get and use food', 12, '1-22'),
  (2, 'bio-ch2', 'Respiration – The Energy Releasing System', 'How cells convert food into energy', 10, '23-42'),
  (3, 'bio-ch3', 'Transportation – The Circulatory System', 'How nutrients and gases move in the body', 11, '43-66'),
  (4, 'bio-ch4', 'Excretion – The Wastage Disposing System', 'How the body removes waste', 9, '67-86'),
  (5, 'bio-ch5', 'Coordination – The Linking System', 'How nervous and hormonal systems work', 12, '87-110'),
  (6, 'bio-ch6', 'Reproduction – The Generating System', 'How life continues across generations', 11, '111-134')
) AS c(number, slug, title, subtitle, periods, page_range)
ON CONFLICT DO NOTHING;

-- ========= 3. Insert 3 episodes for Biology Chapter 1 =========
WITH ch AS (SELECT id FROM public.tb_chapters WHERE slug = 'bio-ch1' LIMIT 1)
INSERT INTO public.tb_episodes (chapter_id, number, slug, title, subtitle, duration, type, sort_order, is_published)
SELECT ch.id, e.number, e.slug, e.title, e.subtitle, e.duration, e.type, e.number, true
FROM ch, (VALUES
  (1, 'bio-ch1-ep1', 'What is Nutrition?', 'Modes of nutrition in living organisms', '8 min', 'Concept'),
  (2, 'bio-ch1-ep2', 'Photosynthesis – Food from Sunlight', 'How plants prepare their own food', '10 min', 'Deep Dive'),
  (3, 'bio-ch1-ep3', 'Human Digestive System', 'The journey of food inside us', '10 min', 'Application')
) AS e(number, slug, title, subtitle, duration, type)
ON CONFLICT DO NOTHING;

-- ========= 4. Insert 3 episodes for each Physics Chapter 2-6 =========
WITH ch AS (SELECT id FROM public.tb_chapters WHERE slug = 'phy-ch2' LIMIT 1)
INSERT INTO public.tb_episodes (chapter_id, number, slug, title, subtitle, duration, type, sort_order, is_published)
SELECT ch.id, e.number, e.slug, e.title, e.subtitle, e.duration, e.type, e.number, true
FROM ch, (VALUES
  (1, 'phy-ch2-ep1', 'Magnetic Field Around a Conductor', 'How current creates magnetism', '9 min', 'Concept'),
  (2, 'phy-ch2-ep2', 'Electromagnetic Induction', 'How magnetism creates current', '10 min', 'Deep Dive'),
  (3, 'phy-ch2-ep3', 'Motors and Generators', 'Real-world electromagnetic devices', '8 min', 'Application')
) AS e(number, slug, title, subtitle, duration, type)
ON CONFLICT DO NOTHING;

WITH ch AS (SELECT id FROM public.tb_chapters WHERE slug = 'phy-ch3' LIMIT 1)
INSERT INTO public.tb_episodes (chapter_id, number, slug, title, subtitle, duration, type, sort_order, is_published)
SELECT ch.id, e.number, e.slug, e.title, e.subtitle, e.duration, e.type, e.number, true
FROM ch, (VALUES
  (1, 'phy-ch3-ep1', 'Conventional Sources of Energy', 'Coal, oil, and natural gas', '8 min', 'Concept'),
  (2, 'phy-ch3-ep2', 'Renewable Energy Sources', 'Solar, wind, and hydro power', '10 min', 'Deep Dive'),
  (3, 'phy-ch3-ep3', 'Nuclear Energy', 'How atoms power our world', '9 min', 'Application')
) AS e(number, slug, title, subtitle, duration, type)
ON CONFLICT DO NOTHING;

WITH ch AS (SELECT id FROM public.tb_chapters WHERE slug = 'phy-ch4' LIMIT 1)
INSERT INTO public.tb_episodes (chapter_id, number, slug, title, subtitle, duration, type, sort_order, is_published)
SELECT ch.id, e.number, e.slug, e.title, e.subtitle, e.duration, e.type, e.number, true
FROM ch, (VALUES
  (1, 'phy-ch4-ep1', 'Refraction Through Curved Surfaces', 'How light bends through lenses', '9 min', 'Concept'),
  (2, 'phy-ch4-ep2', 'Image Formation by Lenses', 'Convex and concave lens behavior', '10 min', 'Deep Dive'),
  (3, 'phy-ch4-ep3', 'The Human Eye and Lens Defects', 'How we see and what goes wrong', '10 min', 'Application')
) AS e(number, slug, title, subtitle, duration, type)
ON CONFLICT DO NOTHING;

WITH ch AS (SELECT id FROM public.tb_chapters WHERE slug = 'phy-ch5' LIMIT 1)
INSERT INTO public.tb_episodes (chapter_id, number, slug, title, subtitle, duration, type, sort_order, is_published)
SELECT ch.id, e.number, e.slug, e.title, e.subtitle, e.duration, e.type, e.number, true
FROM ch, (VALUES
  (1, 'phy-ch5-ep1', 'Ecosystems and Their Components', 'Living and non-living parts working together', '8 min', 'Concept'),
  (2, 'phy-ch5-ep2', 'Food Chains and Food Webs', 'Energy flow in nature', '9 min', 'Deep Dive'),
  (3, 'phy-ch5-ep3', 'Environmental Issues – Ozone & Waste', 'Human impact on the environment', '10 min', 'Application')
) AS e(number, slug, title, subtitle, duration, type)
ON CONFLICT DO NOTHING;

WITH ch AS (SELECT id FROM public.tb_chapters WHERE slug = 'phy-ch6' LIMIT 1)
INSERT INTO public.tb_episodes (chapter_id, number, slug, title, subtitle, duration, type, sort_order, is_published)
SELECT ch.id, e.number, e.slug, e.title, e.subtitle, e.duration, e.type, e.number, true
FROM ch, (VALUES
  (1, 'phy-ch6-ep1', 'Why Manage Resources?', 'The need for sustainable use', '8 min', 'Concept'),
  (2, 'phy-ch6-ep2', 'Forests, Water, and Coal', 'Conserving what nature gives us', '10 min', 'Deep Dive'),
  (3, 'phy-ch6-ep3', 'The Three Rs in Action', 'Reduce, reuse, recycle in daily life', '9 min', 'Application')
) AS e(number, slug, title, subtitle, duration, type)
ON CONFLICT DO NOTHING;
