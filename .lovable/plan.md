

# Complete Chapter 1 Episodes with Full Textbook Content

## Problem
Chapter 1 "Real Numbers" currently has only 3 episodes with incomplete content:
- Episode 1 (Bee Puzzle & Division Algorithm) - 5 blocks, covers Section 1.1 partially
- Episode 2 (Euclid's Algorithm for HCF) - 5 blocks, good coverage
- Episode 3 (Fundamental Theorem) - only 2 blocks (missing activity, recall, explain, exercise)

Missing entirely: Introduction/Number Types, Irrational Numbers, Real Numbers & Number Line, Operations on Real Numbers, and all textbook exercises from Exercises 1.1-1.5.

## Solution
Restructure Chapter 1 into **7 episodes** matching the textbook's content mapping, each with all 6 block types (concept, activity, recall, explain, assessment, exercise). Every definition, example, and exercise from the original textbook PDF is preserved.

## New Episode Structure

```text
Episode 1: Number Types & Classification (Section 1.1 Intro)
  - Concept: N, W, Z, Q definitions, p/q form, examples
  - Activity: Classify numbers into bags (John & Sneha activity)
  - Recall: Number type definitions
  - Explain: "Why is every integer also a rational number?"
  - Assessment: True/False with reasoning (Example 2 from textbook)
  - Exercise: Exercise 1.1 (8 questions)

Episode 2: The Bee Puzzle & Division Algorithm (Section 1.1)
  [EXISTING - keep as-is, already has 5 good blocks]

Episode 3: Euclid's Algorithm for HCF (Section 1.1)
  [EXISTING - keep as-is, already has 5 blocks + exercise]

Episode 4: Fundamental Theorem of Arithmetic (Section 1.1)
  [EXISTING but needs expansion - add missing blocks]
  - Concept: KEEP existing
  - Activity: NEW - Prime factorize numbers (factor tree building)
  - Recall: NEW - Key theorem questions
  - Explain: NEW - "Why is uniqueness important?"
  - Assessment: KEEP existing
  - Exercise: NEW - HCF/LCM problems using FTA

Episode 5: Irrational Numbers (Section 1.2)
  - Concept: sqrt(2) decimal, non-terminating non-recurring, pi note
  - Activity: Classify decimals as rational/irrational
  - Recall: Definition and examples
  - Explain: "How would you explain to a friend why sqrt(2) is irrational?"
  - Assessment: MCQs on identifying irrational numbers
  - Exercise: Exercise 1.2 (5 questions)

Episode 6: Real Numbers & Number Line (Sections 1.3-1.4)
  - Concept: R = Q union S, every point = unique real number, locating sqrt(2)
  - Activity: Plot irrational numbers on number line using Pythagoras
  - Recall: Definitions and key properties
  - Explain: "Why do we need irrational numbers on the number line?"
  - Assessment: MCQs on real number properties
  - Exercise: Exercise 1.3

Episode 7: Operations on Real Numbers (Section 1.5)
  - Concept: Closure properties, sqrt properties, rationalization, laws of exponents
  - Activity: Simplify expressions with surds
  - Recall: Properties and rules
  - Explain: "What is rationalization and why do we need it?"
  - Assessment: MCQs on operations
  - Exercise: Exercise 1.5 (8 questions)
```

## Files to Edit

### 1. `src/data/textbookData.ts`
- Add Episode 1 (Number Types) before existing episodes
- Expand Episode 3 (FTA) with 4 missing blocks (activity, recall, explain, exercise)
- Add Episode 5 (Irrational Numbers) with all 6 blocks
- Add Episode 6 (Real Numbers & Number Line) with all 6 blocks  
- Add Episode 7 (Operations) with all 6 blocks
- Renumber all episodes sequentially (1-7)
- All content sourced from the textbook PDF content mapping -- every definition, formula, example, and exercise preserved exactly

### 2. No other files need changes
The `TextbookEpisode.tsx` page already renders all 6 block types dynamically. The `TextbookChapter.tsx` page already lists episodes from the data. Adding episodes to `textbookData.ts` is the only change needed -- the UI automatically picks them up.

## Content Sourcing
- All definitions, examples, and exercises come directly from the uploaded textbook PDF (10th Maths EM) and the COMPLETE-CONTENT-MAPPING.md
- Every "Do This", "Try These", and end-of-section exercise is included
- Cognitive enhancement layers (recall, explain) are added on top without removing any original content

