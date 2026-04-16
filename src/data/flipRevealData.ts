/**
 * Flip-Reveal Visual Breakdown Data
 * 
 * Maps specific complex topics to their "Think First → Reveal" visual breakdowns.
 * Only placed where spatial/process understanding is critical — NOT on every block.
 * 
 * Key: block title (lowercase, trimmed) from content_blocks
 * Images are static assets generated once and reused for ALL students.
 */

import chemicalReactionImg from "@/assets/chemistry/chemical-reaction-breakdown.jpg";
import balancingEquationsImg from "@/assets/chemistry/balancing-equations-breakdown.jpg";
import typesOfReactionsImg from "@/assets/chemistry/types-of-reactions-breakdown.jpg";

export interface FlipRevealData {
  challenge: string;
  hint?: string;
  imageUrl: string;
  imageAlt: string;
  explanation: string;
  labels: string[];
  emoji: string;
}

/**
 * Lookup key = lowercase block title.
 * Only complex topics that truly benefit from visual breakdown are included.
 */
export const flipRevealRegistry: Record<string, FlipRevealData> = {
  // ── Chemistry Chapter 1: Chemical Reactions & Equations ──

  "what is a chemical reaction?": {
    challenge: "Can you figure out what happens when hydrogen meets oxygen? What do the atoms do during a chemical reaction?",
    hint: "Think about what goes IN and what comes OUT. Do the atoms disappear or rearrange?",
    imageUrl: chemicalReactionImg,
    imageAlt: "Chemical reaction showing reactant molecules (H₂ and O₂) combining to form product (H₂O)",
    explanation: "In a chemical reaction, reactant molecules break apart and their atoms rearrange to form completely new product molecules. No atoms are created or destroyed — they just find new partners!",
    labels: ["Reactants", "Products", "Bond Breaking", "Bond Formation", "Energy Change"],
    emoji: "⚗️",
  },

  "the golden rule of chemical reactions: balancing equations": {
    challenge: "Why must a chemical equation always be 'balanced'? What would happen if the number of atoms changed?",
    hint: "Imagine putting ingredients on a weighing scale before and after cooking. Does the total weight change?",
    imageUrl: balancingEquationsImg,
    imageAlt: "Law of Conservation of Mass showing equal mass before and after a chemical reaction on weighing scales",
    explanation: "The Law of Conservation of Mass means atoms can't appear or vanish. In a balanced equation, every atom on the left (reactants) must appear on the right (products). Count atoms → Add coefficients → Verify!",
    labels: ["Conservation of Mass", "Coefficients", "Atom Counting", "Before = After"],
    emoji: "⚖️",
  },

  "types of chemical reactions: a bollywood drama": {
    challenge: "There are 4 main types of chemical reactions. Can you guess the patterns? Think: what happens when things JOIN, SPLIT, SWAP, or DOUBLE-SWAP?",
    hint: "Imagine 4 different dance moves: solo joining a group, group breaking apart, someone cutting in, and partners swapping!",
    imageUrl: typesOfReactionsImg,
    imageAlt: "Four types of chemical reactions: Combination, Decomposition, Displacement, and Double Displacement with molecule diagrams",
    explanation: "Combination (A+B→AB): elements join. Decomposition (AB→A+B): compound splits. Displacement (A+BC→AC+B): a stronger element kicks out a weaker one. Double Displacement (AB+CD→AD+CB): partners swap!",
    labels: ["Combination", "Decomposition", "Single Displacement", "Double Displacement"],
    emoji: "🎭",
  },
};

/**
 * Look up flip-reveal data for a block title.
 * Returns undefined if the topic doesn't warrant a visual breakdown.
 */
export function getFlipRevealForBlock(blockTitle: string): FlipRevealData | undefined {
  if (!blockTitle) return undefined;
  return flipRevealRegistry[blockTitle.toLowerCase().trim()];
}
