import { FOOD_MODULES, type InnerJourney } from "./foodInnerOS";
import { IDENTITY_MODULES } from "./identitiesInnerOS";

/** Journeys available in the Inner OS. Chapter 4 is the default. */
export const JOURNEYS: InnerJourney[] = [
  {
    id: "identities",
    title: "Algebraic Identities",
    lens: "Food Lens · 3-Day Spark",
    persona: "Kitchen Manager",
    personaEmoji: "👨‍🍳",
    modules: IDENTITY_MODULES,
  },
  {
    id: "numbers",
    title: "Number Systems",
    lens: "Food Lens",
    persona: "Kitchen Manager",
    personaEmoji: "🍔",
    modules: FOOD_MODULES,
  },
];

export const DEFAULT_JOURNEY_ID = "identities";

export const DAY_META: Record<number, { name: string; blurb: string }> = {
  1: { name: "Day 1 · Spark", blurb: "A trick you can't explain yet" },
  2: { name: "Day 2 · Build", blurb: "Turn the picture into speed" },
  3: { name: "Day 3 · Flex", blurb: "Read it backwards, then show off" },
};
