
-- Insert 3 episodes for Chapter 1 of each subject

-- Mathematics Ch1: Real Numbers
INSERT INTO tb_episodes (chapter_id, number, slug, title, subtitle, type, sort_order, is_published) VALUES
('70b3989e-cf6f-4440-ac91-d8e4b6b3f896', 1, 'ch1-ep1', 'Introduction to Real Numbers', 'What are real numbers and why do they matter?', 'learn', 1, true),
('70b3989e-cf6f-4440-ac91-d8e4b6b3f896', 2, 'ch1-ep2', 'Euclid''s Division Lemma', 'The foundation of number theory', 'learn', 2, true),
('70b3989e-cf6f-4440-ac91-d8e4b6b3f896', 3, 'ch1-ep3', 'Fundamental Theorem of Arithmetic', 'Every number has a unique prime factorization', 'learn', 3, true);

-- Science Ch1: Chemical Reactions and Equations
INSERT INTO tb_episodes (chapter_id, number, slug, title, subtitle, type, sort_order, is_published) VALUES
('62223948-52b6-4305-b9ff-bfac584a4191', 1, 'sci-ch1-ep1', 'What is a Chemical Reaction?', 'Signs that tell us a reaction has happened', 'learn', 1, true),
('62223948-52b6-4305-b9ff-bfac584a4191', 2, 'sci-ch1-ep2', 'Writing Chemical Equations', 'Symbols, formulas and balancing', 'learn', 2, true),
('62223948-52b6-4305-b9ff-bfac584a4191', 3, 'sci-ch1-ep3', 'Types of Chemical Reactions', 'Combination, decomposition, displacement and more', 'learn', 3, true);

-- English Ch1: A Letter to God
INSERT INTO tb_episodes (chapter_id, number, slug, title, subtitle, type, sort_order, is_published) VALUES
('036e9c0b-a0b4-4e7f-8b8e-57888e8c795b', 1, 'eng-ch1-ep1', 'The Story Unfolds', 'Meet Lencho and his unshakeable faith', 'learn', 1, true),
('036e9c0b-a0b4-4e7f-8b8e-57888e8c795b', 2, 'eng-ch1-ep2', 'Themes and Characters', 'Faith, irony and human kindness', 'learn', 2, true),
('036e9c0b-a0b4-4e7f-8b8e-57888e8c795b', 3, 'eng-ch1-ep3', 'Language and Comprehension', 'Vocabulary, grammar and deeper meaning', 'learn', 3, true);

-- Social Science Ch1: The Rise of Nationalism in Europe
INSERT INTO tb_episodes (chapter_id, number, slug, title, subtitle, type, sort_order, is_published) VALUES
('ba1ed6d1-5b07-4350-b1f9-08ead5eb29c0', 1, 'soc-ch1-ep1', 'The French Revolution and Nationalism', 'How a revolution sparked the idea of a nation', 'learn', 1, true),
('ba1ed6d1-5b07-4350-b1f9-08ead5eb29c0', 2, 'soc-ch1-ep2', 'Making of Nationalism in Europe', 'Culture, language and the rise of nation-states', 'learn', 2, true),
('ba1ed6d1-5b07-4350-b1f9-08ead5eb29c0', 3, 'soc-ch1-ep3', 'Unification of Italy and Germany', 'How two nations were forged through struggle', 'learn', 3, true);

-- Telugu Ch1
INSERT INTO tb_episodes (chapter_id, number, slug, title, subtitle, type, sort_order, is_published) VALUES
('77d35b06-9554-4bdd-9405-75de7ac127b7', 1, 'tel-ch1-ep1', 'కవిత్వ పరిచయం', 'కవిత్వం అంటే ఏమిటి?', 'learn', 1, true),
('77d35b06-9554-4bdd-9405-75de7ac127b7', 2, 'tel-ch1-ep2', 'పద్య విశ్లేషణ', 'పద్యాన్ని అర్థం చేసుకుందాం', 'learn', 2, true),
('77d35b06-9554-4bdd-9405-75de7ac127b7', 3, 'tel-ch1-ep3', 'భావ విస్తరణ', 'కవి భావాలను విస్తరించడం', 'learn', 3, true);

-- Hindi Ch1
INSERT INTO tb_episodes (chapter_id, number, slug, title, subtitle, type, sort_order, is_published) VALUES
('5ecaec9b-e13c-4243-9c3b-b11ce53ea5ca', 1, 'hin-ch1-ep1', 'सूरदास का परिचय', 'कवि और उनका समय', 'learn', 1, true),
('5ecaec9b-e13c-4243-9c3b-b11ce53ea5ca', 2, 'hin-ch1-ep2', 'पदों का अर्थ', 'सूरदास के पदों को समझें', 'learn', 2, true),
('5ecaec9b-e13c-4243-9c3b-b11ce53ea5ca', 3, 'hin-ch1-ep3', 'भाव और शिल्प', 'काव्य सौंदर्य की खोज', 'learn', 3, true);

-- Physics Ch1: Electricity
INSERT INTO tb_episodes (chapter_id, number, slug, title, subtitle, type, sort_order, is_published) VALUES
('3d756ca5-6d93-4372-bb27-2800bfd65e00', 1, 'phy-ch1-ep1', 'Electric Current and Circuit', 'What makes electricity flow?', 'learn', 1, true),
('3d756ca5-6d93-4372-bb27-2800bfd65e00', 2, 'phy-ch1-ep2', 'Ohm''s Law', 'The relationship between voltage, current and resistance', 'learn', 2, true),
('3d756ca5-6d93-4372-bb27-2800bfd65e00', 3, 'phy-ch1-ep3', 'Resistance and Resistivity', 'Why some materials resist current more than others', 'learn', 3, true);

-- Chemistry Ch1: Chemical Reactions and Equations
INSERT INTO tb_episodes (chapter_id, number, slug, title, subtitle, type, sort_order, is_published) VALUES
('8ac8528d-5d19-4082-b9d9-41cf236c1bdf', 1, 'chem-ch1-ep1', 'Introduction to Chemical Reactions', 'What happens when substances change?', 'learn', 1, true),
('8ac8528d-5d19-4082-b9d9-41cf236c1bdf', 2, 'chem-ch1-ep2', 'Balancing Chemical Equations', 'Making sure atoms are conserved', 'learn', 2, true),
('8ac8528d-5d19-4082-b9d9-41cf236c1bdf', 3, 'chem-ch1-ep3', 'Types of Reactions', 'Classifying reactions by what happens', 'learn', 3, true);
