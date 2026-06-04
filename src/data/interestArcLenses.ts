// ─────────────────────────────────────────────────────────────────────────────
//  Interest-flavoured 3-day arc lenses
//
//  The pedagogical engine is identical across all lenses:
//    Day 1 (Spark, ~5 min)   Hook → Aha → Sort → Trap → Done
//    Day 2 (Build, ~6 min)   Recall → Mechanism → Teach-back → Trap → Done
//    Day 3 (Master, ~8 min)  First-principles → Real case → Teach friend → OS
//
//  Every lens just swaps the *surface story* (cricket / food / travel / nature)
//  while keeping the layer progression and the same maths concepts
//  (negative numbers / integers → fractions as rates → sample-size honesty).
//
//  Sort items: a "pos" item belongs above zero, a "neg" item below.
//  Choice "correct" flags drive the green / red feedback in the UI.
// ─────────────────────────────────────────────────────────────────────────────

import type { PilotInterest } from "@/data/dayPilotContent";

export interface SortItem { label: string; val: string; pos: boolean }
export interface ChoiceOpt { label: string; correct: boolean }
export interface ComparePair {
  leftName: string; leftStat: string; leftDetail: string; leftResult: string;
  rightName: string; rightStat: string; rightDetail: string; rightResult: string;
}

export interface ArcLens {
  tag: PilotInterest;
  emoji: string;
  label: string;
  pillBg: string; pillFg: string;

  /* Day 1 */
  d1HookStepLabel: string;       // "The hook · 60 seconds"
  d1HookH: string;
  d1HookBody: string;
  d1HookPlaceholder: string;

  d1AhaTitle: string;
  d1AhaBody: string;
  d1AhaFormula: string;
  d1AhaFollowUp: string;

  d1SortH: string;
  d1SortInstruction: string;
  d1SortItems: SortItem[];       // mix of pos / neg

  d1TrapKicker: string;          // "Detective challenge — most people get this wrong"
  d1TrapStmt: string;
  d1TrapContext: string;
  d1TrapReveal: string;          // shown after pick
  d1TrapMicro: string;           // "🧠 What you just did..."

  d1DoneRows: [string, string, string];
  d1DoneTease: string;
  d1DoneFactPrefix: string;      // emoji + "One fact ..."
  d1DoneFact: string;

  /* Day 2 */
  d2RecallNow: string;           // "Today you'll discover..."
  d2PuzzleH: string;
  d2PuzzleB: string;
  d2Compare: ComparePair;
  d2PuzzleQ: string;
  d2PuzzleChoices: [ChoiceOpt, ChoiceOpt, ChoiceOpt];
  d2PuzzleReveal: string;

  d2MechH: string;
  d2MechB: string;
  d2FormulaTitle: string;
  d2FormulaRows: [string, string, string];
  d2ConnectionTitle: string;
  d2ConnectionBody: string;

  d2TeachPrompt: string;
  d2TeachSub: string;
  d2TeachPlaceholder: string;
  d2MirrorBody: string;
  d2MirrorGap: string;

  d2TrapStmt: string;
  d2TrapChoices: [ChoiceOpt, ChoiceOpt];
  d2TrapReveal: string;

  d2DoneSub: string;
  d2DoneTease: string;

  /* Day 3 */
  d3FirstH: string;
  d3FirstB: string;
  d3FirstRows: [string, string, string]; // problem1, problem2, solution
  d3FirstQ: string;
  d3FirstChoices: [ChoiceOpt, ChoiceOpt, ChoiceOpt];
  d3FirstReveal: string;

  d3CaseScenarioTag: string;
  d3CaseBody: string;
  d3CaseSub: string;
  d3CaseChoices: [ChoiceOpt, ChoiceOpt, ChoiceOpt];
  d3CaseReveal: string;

  d3TeachScenario: string;
  d3TeachContext: string;
  d3TeachLines: [string, string, string];

  d3UnlockGrid: [
    { label: string; text: string },
    { label: string; text: string },
    { label: string; text: string },
    { label: string; text: string },
  ];
}

/* ════════════════════════════ CRICKET ════════════════════════════ */
const CRICKET: ArcLens = {
  tag: "cricket", emoji: "🏏", label: "Cricket",
  pillBg: "#F0FDF4", pillFg: "#15803D",

  d1HookStepLabel: "The hook · 60 seconds",
  d1HookH: "Can a team win a match and still have a negative NRR?",
  d1HookBody: "India beats Sri Lanka by 2 wickets. But their NRR drops from +0.4 to -0.1. How can winning lower a score? And what does \"negative\" even mean for a rate?",
  d1HookPlaceholder: "Take your best guess — no wrong answer...",

  d1AhaTitle: "NRR is a number line. Zero is the reference.",
  d1AhaBody: "NRR = (runs scored per over) − (runs conceded per over). When you concede more than you score across all matches, the subtraction gives a number below zero. That's a negative integer — a number that exists to the left of zero on the number line.",
  d1AhaFormula: "Runs scored/ov − Runs conceded/ov = can be negative",
  d1AhaFollowUp: "The number line doesn't stop at zero. It keeps going left — into negative territory. That's exactly what integers are: whole numbers that include the world below zero.",

  d1SortH: "Which of these are below zero?",
  d1SortInstruction: "Tap a number, then tap which side it belongs on. Some are above zero (+), some are below (−). The cricket ones you've already seen — trust your instinct for the rest.",
  d1SortItems: [
    { label: "NRR: -0.8", val: "-0.8", pos: false },
    { label: "NRR: +1.2", val: "+1.2", pos: true },
    { label: "-50m sea level", val: "-50m", pos: false },
    { label: "+340 runs", val: "+340", pos: true },
    { label: "-15°C temp", val: "-15C", pos: false },
    { label: "Everest: +8848m", val: "+8848m", pos: true },
  ],

  d1TrapKicker: "Detective challenge — most people get this wrong",
  d1TrapStmt: "\"A cricket team with an NRR of -0.5 has definitely lost more matches than they've won.\"",
  d1TrapContext: "Think about it. NRR depends on run rate, not just wins and losses. Could you lose big and win narrow — and end up with a negative NRR despite equal wins?",
  d1TrapReveal: "The statement is false. A team could win 3 matches narrowly and lose 1 by a huge margin — ending with a negative NRR despite more wins. NRR measures how efficiently you scored runs, not whether you won. A big loss \"poisons\" the average more than a narrow win \"helps\" it. This is exactly why integers and averages behave differently from simple counting.",
  d1TrapMicro: "🧠 What you just did: you questioned an assumption. That's the core skill.",

  d1DoneRows: [
    "You got confused first — NRR going negative felt strange. That confusion is what made the concept stick. Confusion is the beginning of understanding.",
    "You sorted real examples — not textbook numbers. When you placed -50m and -15°C in the \"below zero\" bin, you built the concept in your own mind.",
    "You caught a trap — a statement that sounds true but isn't. That's the hardest skill in mathematics. You used it.",
  ],
  d1DoneTease: "We'll show you exactly what you guessed today — your own words. Then we'll go one layer deeper: why fractions had to be invented, and what cricket stats look like without them. 6 minutes.",
  d1DoneFactPrefix: "🏏",
  d1DoneFact: "The next time you see a negative NRR on a scorecard, you'll know you're looking at an integer — a number that tells a story of more conceded than scored. That's the entire concept, right there.",

  d2RecallNow: "Today you'll discover exactly why that's incomplete — and something most cricket fans never realise.",
  d2PuzzleH: "Two bowlers. Same 3 wickets. Completely different story.",
  d2PuzzleB: "Here's a puzzle your cricket friends probably can't solve. Think carefully before you answer.",
  d2Compare: {
    leftName: "Bumrah", leftStat: "3 wickets", leftDetail: "in 4 overs", leftResult: "Economy: 5.2",
    rightName: "Arshdeep", rightStat: "3 wickets", rightDetail: "in 6 overs", rightResult: "Economy: 7.8",
  },
  d2PuzzleQ: "Same wickets. Who performed better in this spell?",
  d2PuzzleChoices: [
    { label: "Bumrah 💪", correct: true },
    { label: "Both equal 🤷", correct: false },
    { label: "Arshdeep 🤔", correct: false },
  ],
  d2PuzzleReveal: "Bumrah — 3 wickets in 4 overs means fewer balls wasted. Rate = wickets ÷ overs = 3/4. Arshdeep took 3/6. 3/4 is a bigger fraction than 3/6. Efficiency matters more than totals. This is exactly what fractions measure — performance per unit.",

  d2MechH: "Counting doesn't always tell the truth.",
  d2MechB: "3 wickets sounds the same whether you bowled 4 overs or 10 overs. But you intuitively know they're not the same. Why? Because your brain is secretly computing a ratio — how many wickets per over. That ratio is a fraction. Fractions exist because totals lie and rates tell the truth.",
  d2FormulaTitle: "The Fraction Formula in Cricket",
  d2FormulaRows: [
    "Bowling average = Runs conceded ÷ Wickets taken",
    "Economy rate = Runs conceded ÷ Overs bowled",
    "Both are fractions — part ÷ whole = rate",
  ],
  d2ConnectionTitle: "The connection to Virat Kohli:",
  d2ConnectionBody: "Kohli has played 500+ matches, average 54. A new player plays 2 matches, scores a lot, average is 80. Who is more reliable? The average (runs ÷ innings) is a fraction — and a fraction needs enough data to be meaningful. A fraction from 2 innings lies. A fraction from 500 tells the truth.",

  d2TeachPrompt: "Your cricket-crazy cousin says: \"Rahul has 5 wickets and Jadeja has 3. Rahul is obviously better.\" How do you correct him?",
  d2TeachSub: "Use what you just learned. Keep it simple — like you're texting a friend. Cricket language is fine.",
  d2TeachPlaceholder: "Bro, that's not how it works. Wickets alone don't tell you...",
  d2MirrorBody: "You used rate-thinking correctly — that's the key insight. Comparing wickets without overs is like comparing runs without balls faced.",
  d2MirrorGap: "One gap to sharpen: mention that both numbers matter — wickets AND overs. Economy = wickets ÷ overs. You need both parts to get the fraction. Next time, state both numbers when comparing.",

  d2TrapStmt: "\"Virat Kohli's average is 54. He played 2 matches recently and scored 0 and 10. So now his average dropped below 54.\"",
  d2TrapChoices: [
    { label: "True — obviously", correct: false },
    { label: "Depends on something", correct: true },
  ],
  d2TrapReveal: "Depends on sample size. Adding 2 low-scoring innings to 500+ innings barely moves the average — the fraction denominator (total innings) is so large that 2 innings barely changes it. This is why Kohli's average from 500 matches is reliable, but a player's average from 2 matches means almost nothing. Fractions need enough data to be meaningful.",

  d2DoneSub: "You learned why fractions exist — and used cricket to prove it.",
  d2DoneTease: "You'll get a real cricket puzzle your friends can't solve — and the words to explain it perfectly. Plus: why do some small fractions feel bigger than large ones? 🤔",

  d3FirstH: "Why does maths need fractions at all?",
  d3FirstB: "Strip it to the root. Before fractions existed, people could only count whole things — 1 goat, 2 goats. But what if you wanted to split a goat? Or compare speeds? Or share something unequally?",
  d3FirstRows: [
    "Problem 1: Two bowlers took 3 wickets each — but you can't compare them with whole numbers alone. You need wickets per over.",
    "Problem 2: Kohli scored 5000 runs in 100 innings. Stating just \"5000\" means nothing. You need runs per innings = average.",
    "Solution: A fraction (a ÷ b) lets you express \"a for every b\" — performance per unit. Fractions were invented to compare fairly.",
  ],
  d3FirstQ: "Quick confirm — which one needs a fraction to compare fairly?",
  d3FirstChoices: [
    { label: "Total runs scored", correct: false },
    { label: "Runs per ball faced", correct: true },
    { label: "Number of sixes hit", correct: false },
  ],
  d3FirstReveal: "Runs per ball faced — because this is a rate (part ÷ whole = fraction). Total sixes and total runs are whole numbers that don't need division. Rates always need fractions.",

  d3CaseScenarioTag: "Real match scenario",
  d3CaseBody: "Vaibhav Suryavanshi plays 2 IPL matches. Scores 150 and 120. Average = 135.\nVirat Kohli plays 250 IPL matches. Average = 54.\n\nA newspaper writes: \"Vaibhav is currently a better batter than Kohli by average.\"",
  d3CaseSub: "Is the newspaper right? Wrong? Or is something missing?",
  d3CaseChoices: [
    { label: "Newspaper is right", correct: false },
    { label: "Something's missing", correct: true },
    { label: "Newspaper is wrong", correct: false },
  ],
  d3CaseReveal: "Something's missing — sample size. Vaibhav's average of 135 from 2 innings is a fraction with a denominator of 2. Kohli's 54 from 250 innings is a fraction with a denominator of 250. A fraction from 2 data points is unreliable. The newspaper used the right tool (average = fraction) but ignored how trustworthy the fraction is. Two innings can be lucky. Two-fifty innings tells the real story.",

  d3TeachScenario: "Your friend says: \"Bumrah and Arshdeep both got 3 wickets today. They're equal, right?\"",
  d3TeachContext: "You know better now. How do you explain it — simply, in cricket language, so they actually get it?",
  d3TeachLines: [
    "\"Did you know 3 wickets in 4 overs beats 3 wickets in 6 overs? It's a fraction — efficiency per over. Most fans miss this.\"",
    "\"Bro, in cricket you can't just compare wickets. Check the overs too — it's about rate, like speed: faster = better bowler.\"",
    "\"Think of it like money: same amount but one took less time. Same wickets but fewer overs = better bowler. It's fractions.\"",
  ],
  d3UnlockGrid: [
    { label: "Week 2 hook", text: "Why do D/L method results sometimes feel unfair? (Fractions + averages deeper)" },
    { label: "Week 3 hook", text: "How does toss advantage vary by pitch? (Probability + ratios)" },
    { label: "Month 2", text: "Can you predict a team's total from powerplay? (Algebra begins)" },
    { label: "Month 3", text: "Why does Kohli's average drop in SENA countries? (Statistics, data)" },
  ],
};

/* ════════════════════════════ FOOD ════════════════════════════ */
const FOOD: ArcLens = {
  tag: "food", emoji: "🍔", label: "Foodie",
  pillBg: "#FFF7ED", pillFg: "#C2410C",

  d1HookStepLabel: "The hook · 60 seconds",
  d1HookH: "Can a restaurant serve more food today than it bought — and still show negative stock tomorrow?",
  d1HookBody: "Sharma's tiffin centre buys 50 kg of rice on Monday. They sell 53 kg of rice meals by Tuesday night (last 3 kg came from a borrowed sack). The stock app shows -3 kg. How is rice \"negative\"?",
  d1HookPlaceholder: "Take your best guess — no wrong answer...",

  d1AhaTitle: "Stock is a number line. Zero is \"empty pantry\".",
  d1AhaBody: "Daily stock = (what you started with) − (what you sold). When you sell more than you actually have, the subtraction crosses zero and goes negative. That negative is the amount you owe — a number that lives to the left of zero on the number line.",
  d1AhaFormula: "Bought − Sold = can be negative (debt)",
  d1AhaFollowUp: "Bills, profits, loyalty points, fridge inventory — all of them can go below zero. That's exactly what integers are: counts extended into the \"I owe\" world below zero.",

  d1SortH: "Which of these are below zero?",
  d1SortInstruction: "Tap a number, then tap which side it belongs on. Some are above zero (+), some are below (−). The food ones you've already seen — trust your instinct for the rest.",
  d1SortItems: [
    { label: "Profit: -₹200", val: "-0.8", pos: false },
    { label: "Profit: +₹1,200", val: "+1.2", pos: true },
    { label: "Freezer: -18°C", val: "-50m", pos: false },
    { label: "+340 cal snack", val: "+340", pos: true },
    { label: "Owed: -3 kg rice", val: "-15C", pos: false },
    { label: "+8848 ml batter", val: "+8848m", pos: true },
  ],

  d1TrapKicker: "Detective challenge — most people get this wrong",
  d1TrapStmt: "\"A restaurant showing -₹500 profit on Monday has definitely served fewer customers than Sunday.\"",
  d1TrapContext: "Think about it. Profit = revenue − costs. Could a busy day with high ingredient costs end in a loss, while a quiet day with cheap dal turns a profit?",
  d1TrapReveal: "The statement is false. A restaurant can serve 200 customers but lose ₹500 if ingredient prices spiked. A quieter day with 80 customers and cheap dal could still make ₹300 profit. Profit is a subtraction, not a count — that's why integers and counts behave differently.",
  d1TrapMicro: "🧠 What you just did: you separated \"how many\" from \"how much was left over\". That's integer thinking.",

  d1DoneRows: [
    "You got confused first — rice going negative felt strange. That confusion is what made the concept stick. Confusion is the beginning of understanding.",
    "You sorted real examples — freezer temperature, owed rice, profit. When you placed -18°C in the \"below zero\" bin, you built the concept in your own mind.",
    "You caught a trap — a statement that sounded obvious but wasn't. That's the hardest skill in mathematics. You used it.",
  ],
  d1DoneTease: "We'll show you exactly what you guessed today — your own words. Then we'll go one layer deeper: why every bill, every recipe and every tip needs fractions — and what they look like without them. 6 minutes.",
  d1DoneFactPrefix: "🍔",
  d1DoneFact: "The next time you see a negative profit or a -₹50 wallet balance, you'll know you're looking at an integer — a number that tells a story of more out than in.",

  d2RecallNow: "Today you'll discover exactly why that's incomplete — and something most foodies never think about.",
  d2PuzzleH: "Two cooks. Same 12 dosas. Completely different story.",
  d2PuzzleB: "Here's a puzzle your foodie friends probably can't solve. Think carefully before you answer.",
  d2Compare: {
    leftName: "Ravi",   leftStat: "12 dosas",  leftDetail: "in 8 minutes",  leftResult: "Rate: 1.5/min",
    rightName: "Suresh", rightStat: "12 dosas", rightDetail: "in 15 minutes", rightResult: "Rate: 0.8/min",
  },
  d2PuzzleQ: "Same dosas. Who cooked better in this rush?",
  d2PuzzleChoices: [
    { label: "Ravi 💪", correct: true },
    { label: "Both equal 🤷", correct: false },
    { label: "Suresh 🤔", correct: false },
  ],
  d2PuzzleReveal: "Ravi — 12 dosas in 8 minutes means each dosa took less time. Rate = dosas ÷ minutes = 12/8 = 1.5/min. Suresh did 12/15 = 0.8/min. 12/8 is a bigger fraction than 12/15. Speed matters more than totals. This is exactly what fractions measure — output per unit time.",

  d2MechH: "Counting doesn't always tell the truth.",
  d2MechB: "12 dosas sounds the same whether you took 8 minutes or 25 minutes. But you intuitively know they're not the same. Why? Because your brain is secretly computing a rate — dosas per minute. That rate is a fraction. Fractions exist because totals lie and rates tell the truth.",
  d2FormulaTitle: "The Fraction Formula in the Kitchen",
  d2FormulaRows: [
    "Cost per gram = Total cost ÷ Total grams",
    "Calories per ₹ = Total calories ÷ Total rupees spent",
    "Both are fractions — part ÷ whole = rate",
  ],
  d2ConnectionTitle: "The connection to Zomato ratings:",
  d2ConnectionBody: "A famous biryani place has 50,000 ratings, average 4.3. A new café has 5 ratings, average 4.9. Who's more trustworthy? The rating (sum ÷ count) is a fraction — and a fraction needs enough data to be meaningful. A 4.9 from 5 ratings can be friends. A 4.3 from 50,000 is reality.",

  d2TeachPrompt: "Your foodie friend says: \"Ravi made 12 dosas and Suresh made 12 dosas. They're equally good cooks.\" How do you correct him?",
  d2TeachSub: "Use what you just learned. Keep it simple — like you're texting a friend. Kitchen language is fine.",
  d2TeachPlaceholder: "Bro, that's not how it works. Dosas alone don't tell you...",
  d2MirrorBody: "You used rate-thinking correctly — that's the key insight. Comparing dosas without time is like comparing distance without speed.",
  d2MirrorGap: "One gap to sharpen: mention that both numbers matter — dosas AND minutes. Rate = dosas ÷ minutes. You need both parts to get the fraction. Next time, state both numbers when comparing.",

  d2TrapStmt: "\"Punjab Grill has 4.3 average from 50,000 reviews. Five new customers gave them 1-star. So now its average dropped well below 4.3.\"",
  d2TrapChoices: [
    { label: "True — obviously", correct: false },
    { label: "Depends on something", correct: true },
  ],
  d2TrapReveal: "Depends on sample size. Adding 5 one-stars to 50,000 ratings barely moves the average — the denominator is so large that 5 votes can't shift it. This is why a restaurant with 50,000 ratings of 4.3 is reliable, but a café with 5 ratings of 4.9 means almost nothing. Fractions need enough data to be meaningful.",

  d2DoneSub: "You learned why fractions exist — and used a kitchen to prove it.",
  d2DoneTease: "You'll get a real food puzzle most people get wrong — and the words to explain it perfectly. Plus: why do some small ratings feel bigger than huge ones? 🤔",

  d3FirstH: "Why does maths need fractions at all?",
  d3FirstB: "Strip it to the root. Before fractions existed, people could only count whole things — 1 roti, 2 rotis. But what if you wanted to split a roti between 3 kids? Or compare two recipes? Or rate a chef?",
  d3FirstRows: [
    "Problem 1: Two cooks made 12 dosas each — but you can't compare them with whole numbers alone. You need dosas per minute.",
    "Problem 2: A restaurant earned ₹50,000 across 100 orders. Stating just \"50,000\" means nothing. You need ₹ per order = average bill.",
    "Solution: A fraction (a ÷ b) lets you express \"a for every b\" — per unit. Fractions were invented to compare fairly.",
  ],
  d3FirstQ: "Quick confirm — which one needs a fraction to compare fairly?",
  d3FirstChoices: [
    { label: "Total orders served", correct: false },
    { label: "Calories per ₹100 spent", correct: true },
    { label: "Number of items on menu", correct: false },
  ],
  d3FirstReveal: "Calories per ₹100 — because this is a rate (part ÷ whole = fraction). Total orders and menu count are whole numbers that don't need division. Rates always need fractions.",

  d3CaseScenarioTag: "Real Zomato scenario",
  d3CaseBody: "New Café (Open 2 months): 5 reviews, average 4.9★\nKareem's Old Delhi (Open 100 years): 50,000 reviews, average 4.2★\n\nA food blogger writes: \"New Café is currently a better restaurant than Kareem's by rating.\"",
  d3CaseSub: "Is the blogger right? Wrong? Or is something missing?",
  d3CaseChoices: [
    { label: "Blogger is right", correct: false },
    { label: "Something's missing", correct: true },
    { label: "Blogger is wrong", correct: false },
  ],
  d3CaseReveal: "Something's missing — sample size. New Café's 4.9 from 5 reviews is a fraction with denominator 5. Kareem's 4.2 from 50,000 is a fraction with denominator 50,000. A fraction from 5 data points is unreliable. The blogger used the right tool (average = fraction) but ignored how trustworthy the fraction is. 5 friends can rate anything 5★. 50,000 strangers tell the real story.",

  d3TeachScenario: "Your friend says: \"Ravi and Suresh both made 12 dosas today. They're equal cooks, right?\"",
  d3TeachContext: "You know better now. How do you explain it — simply, in kitchen language, so they actually get it?",
  d3TeachLines: [
    "\"Did you know 12 dosas in 8 minutes beats 12 dosas in 15? It's a fraction — output per minute. Most foodies miss this.\"",
    "\"Bro, in cooking you can't just count dishes. Check the time too — it's about rate, like km/h: faster = better cook.\"",
    "\"Think of it like cricket strike rate: same runs but one took fewer balls. Same dosas but fewer minutes = better cook. It's fractions.\"",
  ],
  d3UnlockGrid: [
    { label: "Week 2 hook", text: "Why does Swiggy's \"₹99 deal\" sometimes cost more than ₹250? (Percent + fractions deeper)" },
    { label: "Week 3 hook", text: "How do chefs scale a recipe for 50 from a recipe for 4? (Ratios + proportion)" },
    { label: "Month 2", text: "Can you predict a restaurant's monthly profit from one weekend? (Algebra begins)" },
    { label: "Month 3", text: "Why do some food trends die in 3 months and others last 100 years? (Statistics, data)" },
  ],
};

/* ════════════════════════════ TRAVEL ════════════════════════════ */
const TRAVEL: ArcLens = {
  tag: "travel", emoji: "✈️", label: "Travel",
  pillBg: "#EFF6FF", pillFg: "#1D4ED8",

  d1HookStepLabel: "The hook · 60 seconds",
  d1HookH: "Can a flight \"arrive in -15 minutes\"? Your ticket app just said exactly that.",
  d1HookBody: "Your flight from Hyderabad to Delhi was scheduled at 6:00 PM, ETA 8:00 PM. It actually landed at 7:45 PM. The app shows: \"Arrived: -15 min\". How can time be negative? And what does it really mean?",
  d1HookPlaceholder: "Take your best guess — no wrong answer...",

  d1AhaTitle: "Delay is a number line. Zero is \"exactly on time\".",
  d1AhaBody: "Delay = (actual arrival) − (scheduled arrival). When you land before schedule, the subtraction goes below zero. That negative is how early you were — a number that lives to the left of zero on the number line.",
  d1AhaFormula: "Actual − Scheduled = can be negative (early)",
  d1AhaFollowUp: "Elevation below sea level, temperature below 0°C, jet-lag hours, fuel-remaining alerts — all of them can go below zero. That's exactly what integers are: counts extended into the \"opposite direction\" below zero.",

  d1SortH: "Which of these are below zero?",
  d1SortInstruction: "Tap a number, then tap which side it belongs on. Some are above zero (+), some are below (−). The travel ones you've already seen — trust your instinct for the rest.",
  d1SortItems: [
    { label: "Delay: -15 min (early)", val: "-0.8", pos: false },
    { label: "Delay: +90 min (late)", val: "+1.2", pos: true },
    { label: "Dead Sea: -430 m", val: "-50m", pos: false },
    { label: "Everest: +8848 m", val: "+340", pos: true },
    { label: "Ladakh night: -25°C", val: "-15C", pos: false },
    { label: "Cruise altitude: +11000 m", val: "+8848m", pos: true },
  ],

  d1TrapKicker: "Detective challenge — most travellers get this wrong",
  d1TrapStmt: "\"A flight with average delay of -20 min has definitely never been late in its history.\"",
  d1TrapContext: "Think about it. Average = sum ÷ count. Could a flight be 60 min late one day and 100 min early the next — and still average negative?",
  d1TrapReveal: "The statement is false. A flight could be +60 min late on Monday, -100 min early on Tuesday — average = -20 min, but it was still late on Monday. Averages collapse history into one number; they don't tell you the worst day. This is exactly why integers and averages behave differently from simple counts.",
  d1TrapMicro: "🧠 What you just did: you questioned an average — the hardest skill in everyday stats.",

  d1DoneRows: [
    "You got confused first — delay being negative felt strange. That confusion is what made the concept stick. Confusion is the beginning of understanding.",
    "You sorted real examples — Dead Sea, Ladakh cold, early flights. When you placed -430 m in the \"below zero\" bin, you built the concept in your own mind.",
    "You caught a trap — an average that sounded reassuring but hid the worst day. That's the hardest skill in mathematics. You used it.",
  ],
  d1DoneTease: "We'll show you exactly what you guessed today — your own words. Then we'll go one layer deeper: why every fare, every fuel reading and every ETA needs fractions — and what travel looks like without them. 6 minutes.",
  d1DoneFactPrefix: "✈️",
  d1DoneFact: "The next time you see \"flight on time 87%\" or \"delay: -10 min\", you'll know you're looking at an integer or a fraction — a number that tells a story your eye can't see directly.",

  d2RecallNow: "Today you'll discover exactly why that's incomplete — and something most travellers never check.",
  d2PuzzleH: "Two routes. Same 240 km. Completely different story.",
  d2PuzzleB: "Here's a puzzle your travel friends probably can't solve. Think carefully before you answer.",
  d2Compare: {
    leftName: "Route A", leftStat: "240 km", leftDetail: "in 3 hours", leftResult: "Speed: 80 km/h",
    rightName: "Route B", rightStat: "240 km", rightDetail: "in 5 hours", rightResult: "Speed: 48 km/h",
  },
  d2PuzzleQ: "Same distance. Which route is the better drive?",
  d2PuzzleChoices: [
    { label: "Route A 💪", correct: true },
    { label: "Both equal 🤷", correct: false },
    { label: "Route B 🤔", correct: false },
  ],
  d2PuzzleReveal: "Route A — 240 km in 3 hours means each hour you covered more ground. Rate = km ÷ hours = 240/3 = 80 km/h. Route B did 240/5 = 48 km/h. 240/3 is a bigger fraction than 240/5. Speed matters more than totals. This is exactly what fractions measure — distance per unit time.",

  d2MechH: "Counting doesn't always tell the truth.",
  d2MechB: "240 km sounds the same whether you drove 3 hours or 8 hours. But you intuitively know they're not the same. Why? Because your brain is secretly computing a rate — km per hour. That rate is a fraction. Fractions exist because totals lie and rates tell the truth.",
  d2FormulaTitle: "The Fraction Formula on the Road",
  d2FormulaRows: [
    "Speed = Distance ÷ Time",
    "Mileage = Distance ÷ Fuel used",
    "Both are fractions — part ÷ whole = rate",
  ],
  d2ConnectionTitle: "The connection to Google Maps ETA:",
  d2ConnectionBody: "Maps knows your average speed from millions of trips on a route — average from 1,000,000 trips is reliable. A new shortcut with only 3 trips logged is suggested but unreliable. ETA (distance ÷ speed) is a fraction — and a fraction needs enough data to be meaningful. Speed from 3 trips lies. Speed from a million tells the truth.",

  d2TeachPrompt: "Your friend says: \"Route A and Route B are both 240 km. They're the same drive.\" How do you correct him?",
  d2TeachSub: "Use what you just learned. Keep it simple — like you're texting a friend. Travel language is fine.",
  d2TeachPlaceholder: "Bro, that's not how it works. Distance alone doesn't tell you...",
  d2MirrorBody: "You used rate-thinking correctly — that's the key insight. Comparing distance without time is like comparing wickets without overs.",
  d2MirrorGap: "One gap to sharpen: mention that both numbers matter — km AND hours. Speed = km ÷ hours. You need both parts to get the fraction. Next time, state both numbers when comparing.",

  d2TrapStmt: "\"IndiGo flight 6E-123 has 92% on-time average over 1000 flights. Last week 3 flights were 2 hours late. So now its on-time score crashed.\"",
  d2TrapChoices: [
    { label: "True — obviously", correct: false },
    { label: "Depends on something", correct: true },
  ],
  d2TrapReveal: "Depends on sample size. Adding 3 late flights to 1000 flights barely moves the percentage — the denominator is so large that 3 lates can't shift it much. This is why an airline with 1000 flights of 92% on-time is reliable, but a new airline with 5 flights at 100% means almost nothing. Fractions need enough data to be meaningful.",

  d2DoneSub: "You learned why fractions exist — and used the road to prove it.",
  d2DoneTease: "You'll get a real travel puzzle most people get wrong — and the words to explain it perfectly. Plus: why do some \"shortcuts\" feel faster but actually waste time? 🤔",

  d3FirstH: "Why does maths need fractions at all?",
  d3FirstB: "Strip it to the root. Before fractions existed, people could only count whole things — 1 day, 2 days of travel. But what if you wanted to compare a 240 km horse-cart day with a 800 km train day? Or split fuel cost across 4 friends?",
  d3FirstRows: [
    "Problem 1: Two routes covered 240 km each — but you can't compare them with whole numbers alone. You need km per hour.",
    "Problem 2: A car used 50 litres on a trip. Stating just \"50 litres\" means nothing. You need km per litre = mileage.",
    "Solution: A fraction (a ÷ b) lets you express \"a for every b\" — per unit. Fractions were invented to compare fairly.",
  ],
  d3FirstQ: "Quick confirm — which one needs a fraction to compare fairly?",
  d3FirstChoices: [
    { label: "Total km driven", correct: false },
    { label: "Litres per 100 km", correct: true },
    { label: "Number of toll gates", correct: false },
  ],
  d3FirstReveal: "Litres per 100 km — because this is a rate (part ÷ whole = fraction). Total km and toll count are whole numbers that don't need division. Rates always need fractions.",

  d3CaseScenarioTag: "Real travel scenario",
  d3CaseBody: "New highway NH-99 (just opened): 1 trip logged at avg 110 km/h.\nOld highway NH-44: 50,000 trips logged at avg 78 km/h.\n\nA travel blogger writes: \"NH-99 is officially the fastest highway in India by average speed.\"",
  d3CaseSub: "Is the blogger right? Wrong? Or is something missing?",
  d3CaseChoices: [
    { label: "Blogger is right", correct: false },
    { label: "Something's missing", correct: true },
    { label: "Blogger is wrong", correct: false },
  ],
  d3CaseReveal: "Something's missing — sample size. NH-99's 110 km/h from 1 trip is a fraction with denominator 1. NH-44's 78 km/h from 50,000 trips is a fraction with denominator 50,000. A fraction from 1 data point is unreliable. The blogger used the right tool (average = fraction) but ignored how trustworthy it is. 1 trip can be empty roads at 3 AM. 50,000 trips tell the real story across weather, traffic and time of day.",

  d3TeachScenario: "Your friend says: \"Route A and Route B are both 240 km. Same drive, right?\"",
  d3TeachContext: "You know better now. How do you explain it — simply, in travel language, so they actually get it?",
  d3TeachLines: [
    "\"Did you know 240 km in 3 hours beats 240 km in 5? It's a fraction — speed per hour. Most travellers don't compare this way.\"",
    "\"Bro, in driving you can't just compare distance. Check the time too — it's about km/h: faster = better route.\"",
    "\"Think of it like cricket strike rate: same runs but one took fewer balls. Same km but fewer hours = faster route. It's fractions.\"",
  ],
  d3UnlockGrid: [
    { label: "Week 2 hook", text: "Why does the cheaper flight sometimes cost more after baggage? (Percent + hidden fractions)" },
    { label: "Week 3 hook", text: "How do airlines decide which seats stay empty? (Ratios + probability)" },
    { label: "Month 2", text: "Can you predict total trip cost from the first 100 km? (Algebra begins)" },
    { label: "Month 3", text: "Why is Mumbai → Bengaluru cheaper on Tuesday than Friday? (Statistics, data)" },
  ],
};

/* ════════════════════════════ NATURE ════════════════════════════ */
const NATURE: ArcLens = {
  tag: "nature", emoji: "🌧", label: "Nature",
  pillBg: "#ECFDF5", pillFg: "#047857",

  d1HookStepLabel: "The hook · 60 seconds",
  d1HookH: "Can a forest \"grow by -200 trees\" in a year? The forest department report just used that exact number.",
  d1HookBody: "Telangana planted 1,800 new trees in 2024. But 2,000 trees were lost to drought and disease. The annual report says: \"Net growth: -200 trees.\" How can growth be negative? And what does it really mean?",
  d1HookPlaceholder: "Take your best guess — no wrong answer...",

  d1AhaTitle: "Population change is a number line. Zero is \"no change\".",
  d1AhaBody: "Net change = (gained) − (lost). When you lose more than you gain, the subtraction goes below zero. That negative is the shrinkage — a number that lives to the left of zero on the number line.",
  d1AhaFormula: "Gained − Lost = can be negative (shrinking)",
  d1AhaFollowUp: "Dead Sea elevation, polar temperature, monsoon deficit, glacier retreat, frog population trends — all of them can go below zero. That's exactly what integers are: counts extended into the world below zero.",

  d1SortH: "Which of these are below zero?",
  d1SortInstruction: "Tap a number, then tap which side it belongs on. Some are above zero (+), some are below (−). The nature ones you've already seen — trust your instinct for the rest.",
  d1SortItems: [
    { label: "Forest cover: -200 trees", val: "-0.8", pos: false },
    { label: "Forest cover: +1,200 trees", val: "+1.2", pos: true },
    { label: "Dead Sea: -430 m", val: "-50m", pos: false },
    { label: "Rainfall: +340 mm", val: "+340", pos: true },
    { label: "Antarctica: -89°C", val: "-15C", pos: false },
    { label: "Everest: +8848 m", val: "+8848m", pos: true },
  ],

  d1TrapKicker: "Detective challenge — most people get this wrong",
  d1TrapStmt: "\"A district with average rainfall of -50 mm this year has definitely never seen a wet day.\"",
  d1TrapContext: "Think about it. \"Average\" already crushes 365 days into one number. Could a district flood in July and stay bone-dry from August onwards — and still average a deficit?",
  d1TrapReveal: "The statement is false. A district could get +400 mm in July alone and almost nothing else — still ending the year below the long-term average. \"Below average\" hides which days were wet and which were dry. This is exactly why integers and averages behave differently from simple counts.",
  d1TrapMicro: "🧠 What you just did: you questioned what \"average\" actually hides. That's the core skill.",

  d1DoneRows: [
    "You got confused first — tree growth going negative felt strange. That confusion is what made the concept stick. Confusion is the beginning of understanding.",
    "You sorted real examples — Dead Sea, Antarctic cold, monsoon. When you placed -430 m in the \"below zero\" bin, you built the concept in your own mind.",
    "You caught a trap — an average that sounded clear but hid every wet day. That's the hardest skill in mathematics. You used it.",
  ],
  d1DoneTease: "We'll show you exactly what you guessed today — your own words. Then we'll go one layer deeper: why every rainfall reading, every species count and every climate stat needs fractions — and what nature looks like without them. 6 minutes.",
  d1DoneFactPrefix: "🌧",
  d1DoneFact: "The next time you read \"monsoon deficit -23%\" or \"net forest change: -200\", you'll know you're looking at an integer — a number that tells a story your eye can't see directly.",

  d2RecallNow: "Today you'll discover exactly why that's incomplete — and something most wildlife reports skip past.",
  d2PuzzleH: "Two forests. Same 5,000 trees. Completely different story.",
  d2PuzzleB: "Here's a puzzle your nature-loving friends probably can't solve. Think carefully before you answer.",
  d2Compare: {
    leftName: "Forest A", leftStat: "5,000 trees", leftDetail: "in 100 hectares", leftResult: "Density: 50/ha",
    rightName: "Forest B", rightStat: "5,000 trees", rightDetail: "in 250 hectares", rightResult: "Density: 20/ha",
  },
  d2PuzzleQ: "Same tree count. Which forest is denser and healthier?",
  d2PuzzleChoices: [
    { label: "Forest A 💪", correct: true },
    { label: "Both equal 🤷", correct: false },
    { label: "Forest B 🤔", correct: false },
  ],
  d2PuzzleReveal: "Forest A — 5,000 trees in 100 hectares means 50 trees per hectare. Forest B has 20 per hectare. Rate = trees ÷ hectares = 5000/100 = 50. 5000/100 is a bigger fraction than 5000/250. Density matters more than totals. This is exactly what fractions measure — count per unit area.",

  d2MechH: "Counting doesn't always tell the truth.",
  d2MechB: "5,000 trees sounds the same whether they're packed in 100 hectares or spread thin across 500. But you intuitively know they're not the same forest. Why? Because your brain is secretly computing density — trees per hectare. That density is a fraction. Fractions exist because totals lie and rates tell the truth.",
  d2FormulaTitle: "The Fraction Formula in Nature",
  d2FormulaRows: [
    "Population density = Population ÷ Area",
    "Rainfall rate = Rainfall ÷ Days",
    "Both are fractions — part ÷ whole = rate",
  ],
  d2ConnectionTitle: "The connection to climate records:",
  d2ConnectionBody: "IMD tracks rainfall every day for 150+ years across 1000+ stations — average from millions of readings is reliable. A new village weather sensor with 3 months of data is suggested but unreliable. Rainfall average (sum ÷ days) is a fraction — and a fraction needs enough data to be meaningful. 3 months lies. 150 years tells the truth.",

  d2TeachPrompt: "Your friend says: \"Forest A and Forest B both have 5,000 trees. They're equally healthy forests.\" How do you correct him?",
  d2TeachSub: "Use what you just learned. Keep it simple — like you're texting a friend. Nature language is fine.",
  d2TeachPlaceholder: "Bro, that's not how it works. Tree count alone doesn't tell you...",
  d2MirrorBody: "You used rate-thinking correctly — that's the key insight. Comparing tree count without area is like comparing wickets without overs.",
  d2MirrorGap: "One gap to sharpen: mention that both numbers matter — trees AND hectares. Density = trees ÷ hectares. You need both parts to get the fraction. Next time, state both numbers when comparing.",

  d2TrapStmt: "\"Mumbai received +400 mm rainfall this July. 5 days last week were completely dry. So now July's total dropped well below average.\"",
  d2TrapChoices: [
    { label: "True — obviously", correct: false },
    { label: "Depends on something", correct: true },
  ],
  d2TrapReveal: "Depends on what \"completely dry\" means. 5 dry days subtract zero from a 400 mm total — the total stays 400 mm. Daily average drops, but the seasonal total doesn't. You have to be careful which fraction (mm ÷ days, mm ÷ month) you're measuring. Fractions need to be read precisely, not just felt.",

  d2DoneSub: "You learned why fractions exist — and used a forest to prove it.",
  d2DoneTease: "You'll get a real climate puzzle most people get wrong — and the words to explain it perfectly. Plus: why do some \"record\" weather events feel huge but actually aren't? 🤔",

  d3FirstH: "Why does maths need fractions at all?",
  d3FirstB: "Strip it to the root. Before fractions existed, people could only count whole things — 1 tiger, 2 tigers. But what if you wanted to compare 50 tigers in a small park with 50 tigers across the entire Western Ghats? Or split monsoon rainfall fairly across 4 villages?",
  d3FirstRows: [
    "Problem 1: Two forests had 5,000 trees each — but you can't compare them with whole numbers alone. You need trees per hectare.",
    "Problem 2: Kerala got 2,500 mm rain in 365 days. Stating just \"2,500\" means nothing. You need mm per day = rate.",
    "Solution: A fraction (a ÷ b) lets you express \"a for every b\" — per unit. Fractions were invented to compare fairly.",
  ],
  d3FirstQ: "Quick confirm — which one needs a fraction to compare fairly?",
  d3FirstChoices: [
    { label: "Total rainfall (mm)", correct: false },
    { label: "mm of rain per day", correct: true },
    { label: "Number of rainy stations", correct: false },
  ],
  d3FirstReveal: "mm per day — because this is a rate (part ÷ whole = fraction). Total rainfall and station count are whole numbers that don't need division. Rates always need fractions.",

  d3CaseScenarioTag: "Real climate scenario",
  d3CaseBody: "New weather station at Araku Valley (just installed): 1 month of data, avg 28°C.\nIMD Hyderabad station: 75 years of data, avg 26°C.\n\nA news headline reads: \"Araku is officially hotter than Hyderabad by average temperature.\"",
  d3CaseSub: "Is the headline right? Wrong? Or is something missing?",
  d3CaseChoices: [
    { label: "Headline is right", correct: false },
    { label: "Something's missing", correct: true },
    { label: "Headline is wrong", correct: false },
  ],
  d3CaseReveal: "Something's missing — sample size. Araku's 28°C from 1 month is a fraction with denominator 30. Hyderabad's 26°C from 75 years is from 27,000+ days. A fraction from 30 data points is unreliable — that month could just be Araku's hottest. The headline used the right tool (average = fraction) but ignored how trustworthy it is. A month can be a heatwave. 75 years tells the real story.",

  d3TeachScenario: "Your friend says: \"Forest A and Forest B both have 5,000 trees. Same forest, right?\"",
  d3TeachContext: "You know better now. How do you explain it — simply, in nature language, so they actually get it?",
  d3TeachLines: [
    "\"Did you know 5,000 trees in 100 hectares beats 5,000 in 250? It's a fraction — density per hectare. Most reports miss this.\"",
    "\"Bro, in a forest you can't just count trees. Check the area too — it's about density, like population: more per km² = healthier forest.\"",
    "\"Think of it like cricket strike rate: same runs but one took fewer balls. Same trees but smaller area = denser forest. It's fractions.\"",
  ],
  d3UnlockGrid: [
    { label: "Week 2 hook", text: "Why did one cyclone wipe out a coast that survived 50 others? (Fractions + thresholds)" },
    { label: "Week 3 hook", text: "How do scientists count tigers they never see? (Probability + ratios)" },
    { label: "Month 2", text: "Can you predict monsoon onset from one March temperature? (Algebra begins)" },
    { label: "Month 3", text: "Why is +2°C climate change a bigger deal than +20°C summer? (Statistics, data)" },
  ],
};

/* ════════════════════════════ LOOKUP ════════════════════════════ */
export const ARC_LENSES: Record<string, ArcLens> = {
  cricket: CRICKET, food: FOOD, travel: TRAVEL, nature: NATURE,
};

export function getArcLens(tag: PilotInterest | string | null | undefined): ArcLens | null {
  if (!tag) return null;
  return ARC_LENSES[tag] ?? null;
}

export function hasArcLens(tag: PilotInterest | string | null | undefined): boolean {
  return !!getArcLens(tag);
}
