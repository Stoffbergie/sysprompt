# SysPrompt

## The Pitch

### Start Here: The Feeling

Have you ever tried to explain what you want to a designer, struggled for 20 minutes, then they showed you something and you immediately said "no, not like that"?

You knew it was wrong the moment you saw it. But you couldn't have described "right" beforehand.

That's not a failure of articulation. That's how human taste works. You discover what you want through rejection. You don't know the rules until you've seen them broken.

Now imagine doing that — but with an AI. You need it to write emails a certain way. Sound a certain way. Never say certain things. Be helpful in your specific context.

How do you tell it?

You write a prompt. A paragraph of instructions. You test it. The output is wrong. You edit the prompt. Test again. Still wrong, but differently. Edit. Test. Edit. Test.

Hours pass. You fix one thing, break another. There's no progress bar. No sense of "70% done." Just you, staring at outputs, wondering if you're getting closer or just going in circles.

This is prompt engineering today. It's the worst kind of work: high effort, low feedback, no clear endpoint.

**We're building the tool that makes this disappear.**

### The Problem (Really Explained)

When you tune a prompt, you're actually doing three jobs at once without realizing it:

**1. Discovery** — Finding out what you actually want (through rejection)

**2. Specification** — Defining rules the output must follow

**3. Implementation** — Writing the prompt that satisfies those rules

Current tools assume you've already done #1 and #2. They say: "Tell us your requirements, we'll help you implement."

But you don't have requirements. You have taste. You have a vague sense of "good." You'll know it when you see it.

So you guess at requirements. Write a prompt. See it fail. Adjust your mental model of what you want. Rewrite. See it fail differently. Slowly, painfully, through dozens of iterations, you figure out what you actually wanted all along.

And here's the brutal part: **none of that learning is captured.**

The prompt you end up with is just text. It doesn't explain why it says what it says. It doesn't document the 47 failed attempts that shaped it. When you hand it to someone else, they see instructions. They don't see the reasoning.

When you come back in three months, you've forgotten the reasoning too.

So you make a small edit. Something breaks. You don't know why. The rules you discovered through painful iteration? Lost. You're starting over.

### The Insight

What if the tool understood that you don't know what you want yet?

What if instead of asking "what are your requirements?" it just showed you outputs and let you react?

Good. Bad. Shorter. Longer. Never say that phrase. Yes, this one.

Each reaction is a data point. The system collects them. Finds patterns. Infers rules. Builds the prompt for you.

You never write the prompt. You never define a constraint. You never fill out a form.

You just... respond to outputs. The prompt emerges from your preferences like a photograph in a darkroom. You don't draw it. You expose it.

**That's SysPrompt.**

### What It Feels Like

You open the app. You type a question — the kind of thing your users will ask.

"How does billing work?"

The AI responds. You read it. Too long. You tap the minus button. It regenerates, shorter. Better, but there's a phrase you hate — "excited to help you." You highlight it, tap "never use this." It regenerates without the phrase.

Good. You tap the checkmark. Done with that question.

You type another question. "What's the difference between the Standard and Pro tiers?"

The AI responds with bullet points. You hate bullet points. You type "no bullet points, use prose." It regenerates in paragraphs. Better. Checkmark.

Another question. Another. You're just chatting with it, reacting, adjusting. It feels like nothing. Like scrolling. Like swiping.

But here's what's happening underneath:

Every minus tap is logged: "User prefers shorter responses for billing questions."

Every banned phrase is stored: "Never use 'excited to help' — hard rule."

Every "no bullet points" becomes: "User prefers prose over lists."

Every checkmarked response becomes a test case: "This question + this answer = good."

You're building a test suite without knowing it. You're defining constraints without articulating them. The system is learning your taste.

After thirty minutes, you've done maybe 15 questions. You hit "checkpoint." Save your progress.

Then something magic happens.

Overnight, the AI takes your test suite — all those questions and approved answers — and optimizes. It tries hundreds of variations. Tests each against your preferences. Finds the tightest prompt that satisfies everything. Resolves edge cases you never thought about.

You come back the next morning. Your prompt is better. It passes 97% of tests instead of 85%. You didn't do anything. The machine did the grinding.

**That's the development experience.**

### But Wait, There's More (Production)

You've tuned your prompt. It's good. Ship it.

You can export the prompt and use it anywhere. That's fine. You're done. Thanks for using SysPrompt.

Or...

You deploy through us. One line change:

```javascript
Before: https://api.openai.com/v1/chat/completions
After: https://api.sysprompt.dev/v1/chat/completions
```

Same API. Same format. We just sit in the middle.

Now we see everything. Every question your users ask. Every response they get. And if you add a simple thumbs up/down widget to your UI? We see that too.

**Here's where it gets interesting.**

Your test suite from tuning? 15 questions. Limited. Just what you thought to test.

Your production traffic? Thousands of real questions. Edge cases you never imagined. Weird phrasings. Unexpected contexts.

We cluster the thumbs-down responses. Find patterns.

"23 users asked about Okta SSO setup and got generic instructions. They all marked it unhelpful."

"12 users asked about pricing in euros and got USD answers. They all marked it unhelpful."

We show you these patterns. You click "fix." We generate a prompt modification. Test it against your existing test suite (no regressions). Test it against the 23 unhappy cases (most now pass). Show you before and after.

You approve. It's live.

Those 23 cases? They're now part of your test suite. Forever. The SSO problem can never regress. The system learned it.

**Your test suite grows automatically from production feedback.**

Started with 15 cases. After a month? 120 cases. Real cases. From real users. Things you never would have thought to test.

And if you trust the system enough? You can turn on auto-fix. It applies changes automatically — as long as they pass all tests. You get a notification. You can rollback. But mostly you just watch the helpful rate tick up.

91% → 93% → 95% → 96%...

The prompt is improving itself. From real usage. While you sleep.

### The Full Picture

**Week 1: Development**

You tune in flow mode. React to outputs. Build up preferences. Checkpoint. Background optimizer runs. Your prompt is ready.

**Week 2: Launch**

You deploy through our proxy. Add the feedback widget. Watch the dashboard. Traffic flows. Feedback accumulates.

**Week 3-4: Learning**

Patterns emerge. System detects "enterprise SSO" is a weak spot. Suggests a fix. You approve. Test suite grows by 23 cases. Helpful rate jumps 3%.

**Month 2 onwards: Autopilot**

You turn on auto-fix. System handles routine improvements. You get weekly summaries. Prompt evolves continuously. You check in occasionally. Mostly it just works.

**Six months later:**

Your prompt has been through 47 versions. 340 test cases. 97% helpful rate. Documents itself — every rule traces back to a real signal from you or your users. Anyone on your team can understand it, maintain it, improve it.

You didn't become a prompt engineer. You just expressed taste. The system did the rest.

### Why This Is Hard to Copy

**1. The preference model**

We're not storing "user clicked shorter." We're building a graph of contextual preferences.

"Shorter" on a 200-word billing answer means something different than "shorter" on an 80-word how-to. We track context. We infer intent. We resolve conflicts.

This is months of work. Competitors can't just "add this feature."

**2. The test complexity**

Our tests aren't "does output contain X." They're multi-dimensional evaluations:

- Hard rules (must pass)
- Soft preferences (weighted scores)
- Semantic similarity to approved responses
- Contextual rules (different behavior for different question types)
- Learned exceptions (you approved bullets for API lists specifically)

This requires accumulated history. Can't fake it.

**3. The production flywheel**

Your tuning session: 50 interactions. Your production: 50,000 interactions.

The system learns from scale you can't replicate manually. And switching to a competitor means abandoning all that accumulated intelligence. Starting over.

The switching cost is massive.

**4. The optimizer**

Background optimization isn't "run GPT-4 in a loop." It's:

- Fitness functions derived from human signals
- Overfitting detection
- Regression prevention
- Minimal prompt discovery
- Conflict resolution

Real ML. Months to build.

**5. Dogfooding**

Our preference extractor is tuned by SysPrompt. Our test evaluator is tuned by SysPrompt. Our variation generator is tuned by SysPrompt.

We improve ourselves. It compounds.

### Why This Matters (The Big Picture)

Prompts are becoming infrastructure.

Every AI feature runs on prompts. Customer support bots. Sales automation. Document processing. Code assistants. Each one has prompts — sometimes dozens — that determine whether it's good or garbage.

Right now, those prompts are artisanal. One person wrote them. One person understands them. Everyone else is afraid to touch them.

This doesn't scale.

As AI features multiply, prompt maintenance becomes the bottleneck. You can't have one "prompt whisperer" per feature. You can't have institutional knowledge locked in one person's head.

**SysPrompt makes prompts into engineered systems.**

Version controlled. Every change tracked. Tested. Regressions caught automatically. Documented. Every rule traces to a real signal. Continuously improving. Learning from production.

The prompt becomes a codebase. Maintainable. Transferable. Professional.

### Who This Is For

**Teams building AI features** who need to ship with confidence.

Your prompt "kind of works." 85% of the time. You need to get to 95%+. You need anyone on the team to maintain it. You need to know it won't regress.

**Power users** who tune prompts for a living.

You're fast at manual tuning. But you're tired. Same patterns over and over. You want acceleration without losing control.

**Not for:** Casual users who just want ChatGPT to work better.

We're a professional tool. You need to care about prompt quality to care about us.

### The One-Liner

**You express taste. The system builds the prompt. Production feedback makes it better. Forever.**

### The Longer One-Liner

**SysPrompt turns prompt engineering from an art into a system. You react to outputs instead of writing requirements. Your preferences become constraints. Your constraints become tests. Production feedback grows the test suite. The prompt improves itself.**

### The Ask

We're building this. The development experience (flow mode) is specced. The production experience (continuous learning) is specced. The moat is clear.

What we need:

1. **Design partner** — A team with a real prompt in production who wants to be first.
2. **Feedback** — Does this resonate? What's missing? What's confusing?
3. **Belief** — This is a platform, not a tool. Platforms take longer. But they win.

The prize: Own the prompt engineering workflow. Development through production. Continuous improvement. The full lifecycle.

Every company building AI features needs this. Most don't know it yet because they're still in the "one person hacking prompts" phase. But that doesn't scale. They'll learn. And when they do, we'll be there.

### Finally: The Emotion

Here's what we're really selling.

**During development:** Flow state. The feeling of just vibing with an AI until it gets you. No forms. No decisions. Just reactions. And then you look up and it's... actually good.

**During production:** Confidence. The prompt is improving while you sleep. Real users are making it better. You're not worried about edge cases because the system is finding them for you.

**Long-term:** Peace of mind. The prompt isn't a black box anymore. It's documented. Tested. Maintained by the system. Anyone can pick it up. The knowledge doesn't leave when people leave.

You went from "I need to build an AI feature" to "I have a continuously-improving AI system."

You didn't become a prompt engineer.

You just told it what you liked.

That's SysPrompt.
