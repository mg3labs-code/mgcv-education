// 10th Class Mathematics - Telangana State Board
// Type definitions for textbook content structure

export interface VisualAidContent {
  type: "image" | "video";
  url: string;
  caption: string;
  explanation?: string;
  alt?: string;
  searchTerms?: string;
}

export interface TextbookRefSnippet {
  text: string;
  source: string;
}

export interface JeeProblemsContent {
  questions: { question: string; options: string[]; correctIndex: number; explanation: string; trap?: string; previousYear?: string; negativeMarking?: number }[];
  timePerQuestion?: number;
}

export interface JeeExtensionContent {
  title: string;
  sections: { heading: string; body: string; formula?: string }[];
  advancedFormulas?: string[];
  proofSketch?: string;
}

export interface JeeSpeedDrillContent {
  questions: { question: string; answer: string; hint?: string }[];
  totalTimeSeconds: number;
}

export interface ContentBlock {
  type: "concept" | "activity" | "recall" | "explain" | "assessment" | "exercise" | "reasoning" | "assumptions" | "connections" | "application" | "implications" | "bilingual_concept" | "vocabulary" | "grammar_pattern" | "story_reading" | "visual_aid" | "jee_problems" | "jee_extension" | "jee_speed_drill";
  title: string;
  icon: string;
  depth?: "board" | "jee";
  content: ConceptContent | ActivityContent | RecallContent | ExplainContent | AssessmentContent | ExerciseContent | ReasoningContent | AssumptionsContent | ConnectionsContent | ApplicationContent | ImplicationsContent | VisualAidContent | JeeProblemsContent | JeeExtensionContent | JeeSpeedDrillContent | Record<string, any>;
  textbookRef?: {
    snippets?: TextbookRefSnippet[];
    text?: string;
    source?: string;
  };
}

export interface ConceptContent {
  sections: { heading: string; body: string; highlight?: boolean }[];
  keyFormulas?: string[];
  example?: { question: string; solution: string }[];
}

export interface ActivityContent {
  instruction: string;
  type: "classify" | "match" | "order" | "explore";
  items?: { value: string; categories?: string[] }[];
  categories?: { id: string; label: string; description: string }[];
}

export interface RecallContent {
  questions: { question: string; answer: string; hint?: string }[];
}

export interface ExplainContent {
  prompt: string;
  guidePoints?: string[];
  wordLimit?: number;
}

export interface AssessmentContent {
  questions: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export interface ExerciseContent {
  source: string;
  problems: { number: string; text: string; answer?: string }[];
}

// Layer 3: Reasoning (Cambridge-style "Why?" questions)
export interface ReasoningContent {
  centralQuestion: string;
  whyQuestions: { question: string; hint?: string; deeperInsight: string }[];
}

// Layer 4: Assumptions (Oxford Tutorial Defense)
export interface AssumptionsContent {
  concept: string;
  hiddenAssumptions: { assumption: string; whyItMatters: string; challenge: string }[];
  defensePrompt: string;
}

// Layer 5: Connections (MIT Cross-Domain)
export interface ConnectionsContent {
  concept: string;
  connections: { domain: string; icon: string; link: string; explanation: string }[];
}

// Layer 6: Application (Harvard Case Method)
export interface ApplicationContent {
  scenario: string;
  context: string;
  questions: { question: string; hint?: string }[];
  realWorldWhy: string;
  careers?: string[];
  harvardLabel?: string;
}

// Layer 7: Implications (Oxford Essay)
export interface ImplicationsContent {
  whatIfQuestion: string;
  reflectionPrompts: string[];
  essayPrompt: string;
  wordLimit?: number;
  implications?: { category: string; icon: string; color: string; points: string[] }[];
}

export interface Episode {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  duration: string;
  type: "Concept" | "Deep Dive" | "Application" | "Assessment" | "Practice";
  blocks: ContentBlock[];
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  color: string;
  periods: number;
  pageRange: string;
  episodes: Episode[];
}

// Hardcoded chapters data has been removed.
// All chapter/episode/block content is now served from the database.
// Use hooks from src/hooks/useTextbookData.ts to fetch content.
