export interface TopicVisual {
  keywords: string[];
  imageUrl: string;
  caption: string;
  category: string;
}

export const topicVisuals: TopicVisual[] = [
  // Cricket
  {
    keywords: ["cricket", "batsman", "batting", "innings", "ipl"],
    imageUrl: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&q=80",
    caption: "Cricket — The Gentleman's Game",
    category: "cricket",
  },
  {
    keywords: ["bowling", "bowler", "spin", "swing", "bumrah", "pace"],
    imageUrl: "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=600&q=80",
    caption: "Bowling — Physics in Action",
    category: "cricket",
  },
  {
    keywords: ["dhoni", "captain", "wicketkeeper"],
    imageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&q=80",
    caption: "MS Dhoni — Captain Cool",
    category: "cricket",
  },
  {
    keywords: ["stadium", "crowd", "match", "tournament"],
    imageUrl: "https://images.unsplash.com/photo-1567220720937-7304e8bffbec?w=600&q=80",
    caption: "The Thrill of a Live Match",
    category: "cricket",
  },
  // Football
  {
    keywords: ["football", "soccer", "goal", "striker", "messi", "ronaldo"],
    imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80",
    caption: "Football — The Beautiful Game",
    category: "football",
  },
  {
    keywords: ["kick", "free kick", "penalty", "dribble"],
    imageUrl: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=600&q=80",
    caption: "The Perfect Kick",
    category: "football",
  },
  // Physics
  {
    keywords: ["magnus", "magnus effect", "spin", "curve", "aerodynamics"],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Magnus_effect.svg/640px-Magnus_effect.svg.png",
    caption: "The Magnus Effect — Why Balls Curve",
    category: "physics",
  },
  {
    keywords: ["force", "newton", "gravity", "acceleration", "motion", "velocity"],
    imageUrl: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&q=80",
    caption: "Forces & Motion — Newton's Laws",
    category: "physics",
  },
  {
    keywords: ["projectile", "trajectory", "parabola", "throw", "launch"],
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80",
    caption: "Projectile Motion — The Perfect Arc",
    category: "physics",
  },
  {
    keywords: ["friction", "drag", "resistance", "air resistance"],
    imageUrl: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&q=80",
    caption: "Friction & Drag Forces",
    category: "physics",
  },
  {
    keywords: ["energy", "kinetic", "potential", "conservation"],
    imageUrl: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&q=80",
    caption: "Energy — The Power Behind Motion",
    category: "physics",
  },
  // Electricity
  {
    keywords: ["circuit", "current", "voltage", "resistor", "ohm"],
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
    caption: "Circuits — The Flow of Electrons",
    category: "science",
  },
  {
    keywords: ["electricity", "electric", "charge", "electron", "led"],
    imageUrl: "https://images.unsplash.com/photo-1567581935884-3349723552ca?w=600&q=80",
    caption: "Electricity — Powering Our World",
    category: "science",
  },
  {
    keywords: ["battery", "cell", "emf", "kirchhoff"],
    imageUrl: "https://images.unsplash.com/photo-1619641805634-98e7e4e39e34?w=600&q=80",
    caption: "Batteries & EMF",
    category: "science",
  },
  // Math
  {
    keywords: ["equation", "formula", "algebra", "solve", "calculate"],
    imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80",
    caption: "Mathematics — The Language of Science",
    category: "math",
  },
  {
    keywords: ["graph", "plot", "coordinate", "x-axis", "y-axis"],
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
    caption: "Graphs & Data Visualization",
    category: "math",
  },
  {
    keywords: ["speed", "distance", "time", "rate"],
    imageUrl: "https://images.unsplash.com/photo-1461896836934-bd45ba3b3082?w=600&q=80",
    caption: "Speed, Distance & Time",
    category: "math",
  },
  {
    keywords: ["angle", "degree", "trigonometry", "sine", "cosine"],
    imageUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&q=80",
    caption: "Angles & Trigonometry",
    category: "math",
  },
  // Gaming
  {
    keywords: ["gaming", "game", "video game", "esports", "controller"],
    imageUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&q=80",
    caption: "Gaming — Strategy & Reflexes",
    category: "gaming",
  },
  // Cooking
  {
    keywords: ["cooking", "recipe", "chef", "kitchen", "food"],
    imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80",
    caption: "Cooking — Chemistry in the Kitchen",
    category: "cooking",
  },
  // Music
  {
    keywords: ["music", "instrument", "rhythm", "melody", "song"],
    imageUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=80",
    caption: "Music — Waves & Frequencies",
    category: "music",
  },
  // General learning
  {
    keywords: ["textbook", "ncert", "chapter", "syllabus", "curriculum"],
    imageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&q=80",
    caption: "Your Textbook — Let's Explore!",
    category: "learning",
  },
  {
    keywords: ["exam", "test", "jee", "competitive", "practice"],
    imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&q=80",
    caption: "Exam Ready — Practice Makes Perfect",
    category: "learning",
  },
  {
    keywords: ["experiment", "lab", "science", "chemistry", "biology"],
    imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&q=80",
    caption: "Science Lab — Discover & Experiment",
    category: "science",
  },
  // Basketball
  {
    keywords: ["basketball", "dunk", "hoop", "nba"],
    imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&q=80",
    caption: "Basketball — Arcs & Trajectories",
    category: "basketball",
  },
  // Swimming
  {
    keywords: ["swimming", "swim", "pool", "water"],
    imageUrl: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&q=80",
    caption: "Swimming — Fluid Dynamics",
    category: "swimming",
  },
  // Badminton
  {
    keywords: ["badminton", "shuttle", "racket", "smash"],
    imageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&q=80",
    caption: "Badminton — Speed & Precision",
    category: "badminton",
  },
  // Chess
  {
    keywords: ["chess", "strategy", "checkmate", "board"],
    imageUrl: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=600&q=80",
    caption: "Chess — Strategic Thinking",
    category: "chess",
  },
];

/**
 * Scan text for matching visuals. Returns all matches sorted by
 * position of the first keyword found (earliest match first).
 */
export function findMatchingVisuals(text: string): TopicVisual[] {
  const lower = text.toLowerCase();
  const scored: { visual: TopicVisual; pos: number }[] = [];

  for (const v of topicVisuals) {
    let bestPos = Infinity;
    for (const kw of v.keywords) {
      const idx = lower.indexOf(kw);
      if (idx !== -1 && idx < bestPos) bestPos = idx;
    }
    if (bestPos < Infinity) scored.push({ visual: v, pos: bestPos });
  }

  // Deduplicate by category — keep the earliest match per category
  const seen = new Set<string>();
  return scored
    .sort((a, b) => a.pos - b.pos)
    .filter(({ visual }) => {
      if (seen.has(visual.caption)) return false;
      seen.add(visual.caption);
      return true;
    })
    .map(({ visual }) => visual);
}
