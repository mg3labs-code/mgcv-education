

# Update Deep Block Components with Curiosity-Driven Language

## What's Changing

All 5 deep block components use formal academic language ("Cross-domain connections", "Oxford Tutorial Defense", "Harvard Case Method", "Hidden assumptions"). For classes 7-10 students, this needs to become playful, curiosity-sparking, and simple.

## Language Mapping Per Component

### ReasoningBlock
- Header: ~~formal centralQuestion box~~ → "🤔 But WHY though?" with subtitle "Don't just memorize — understand the reason!"
- Question badges: ~~plain "?"~~ → "Why?" with warm gradient
- Reveal button: ~~"Think first, then reveal"~~ → "I've thought about it — show me! 👀"
- Revealed insight label: add "💡 Aha! Here's the cool part:"

### AssumptionsBlock  
- Header: ~~"Hidden assumptions about: {concept}"~~ → "🕵️ Detective Mode: What if everyone's wrong about {concept}?"
- Subtitle: ~~"beliefs most students hold"~~ → "Most people believe these without checking. Can YOU spot the trick?"
- Expand prompt: ~~"Tap to examine this assumption"~~ → "Tap to bust this myth! 🔍"
- Why it matters label: → "🤯 Mind-blowing part:"
- Challenge label: ~~"🎯 Challenge:"~~ → "🎯 Your mission:"
- Tutorial Defense: ~~"🎓 Oxford Tutorial Defense"~~ → "⚔️ Can you defend your answer?"
- Subtitle: ~~"Think critically and argue"~~ → "Pretend you're explaining to a friend who disagrees..."
- Button: ~~"Accept the Challenge"~~ → "I'm ready! Let's go 💪"
- CTA: ~~"Ready to defend your understanding?"~~ → "Think you really get it? Prove it!"
- CTA subtitle: ~~"AI tutor will challenge your reasoning"~~ → "5 min · AI buddy will ask you tricky questions"

### ApplicationBlock
- Header: ~~"🎓 Harvard Case Method"~~ → "🚀 Real Life Mission"
- Subtitle: ~~formal~~ → "This isn't just textbook stuff — people actually use this!"
- Textarea placeholder: ~~"Work it out here..."~~ → "Write your answer here — there's no wrong answer! ✍️"
- Real World Why button: ~~"Why does this matter?"~~ → "OK but why should I care? 🤔"
- Revealed label: ~~"Why this matters in real life:"~~ → "🌍 Here's why this is actually cool:"
- Careers: ~~"💼 Careers Using This"~~ → "🦸 People who use this every day"

### ConnectionsBlock
- Header: ~~"Cross-domain connections for: {concept}"~~ → "🌐 Where else does {concept} hide?"
- Subtitle: ~~"Great thinkers see patterns"~~ → "This idea shows up in surprising places. Can you spot it?"
- Add hover scale animation on connection cards

### ImplicationsBlock
- What-If label: ~~"🔮 The Big Question"~~ → "🔮 Imagine this..."
- Reflection fallback: ~~"Think about these:"~~ → "🧠 Let these ideas bounce around your brain:"
- Essay section: ~~"📝 Oxford Essay Question"~~ → "✏️ Your Turn to Think Big"
- Textarea placeholder: ~~"Write your reflection here..."~~ → "Share your thoughts — even wild ideas are welcome! 🚀"
- Voice button: ~~"🎤 Record Voice Essay Instead"~~ → "🎤 Say it out loud instead"
- Voice coming soon: → "Voice recording coming soon — for now, type your ideas!"

## Files Modified
1. `src/components/textbook/ReasoningBlock.tsx`
2. `src/components/textbook/AssumptionsBlock.tsx`
3. `src/components/textbook/ApplicationBlock.tsx`
4. `src/components/textbook/ConnectionsBlock.tsx`
5. `src/components/textbook/ImplicationsBlock.tsx`

No data model, structure, or dependency changes. Pure language + minor styling updates.

