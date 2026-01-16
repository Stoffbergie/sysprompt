# SysPrompt Development Instructions

You are building SysPrompt - a prompt development and deployment platform.

## Core Concept

SysPrompt solves the fundamental problem of prompt engineering: users know good output when they see it but cannot specify requirements upfront.

Instead of asking users to write prompts, SysPrompt lets them express preferences through simple reactions. The system accumulates these signals and builds the prompt automatically.

## The Two Experiences

### 1. Flow Mode (Development)

Users tune prompts by reacting to outputs. The interface is minimal:
- One question displayed
- One response displayed  
- Four buttons: minus, plus, thumbs-down, checkmark
- Text input for feedback or next question

Users stay in flow state. No forms, no decisions about constraint types, no visible complexity. They just react: shorter, longer, bad, good, never say that.

Every reaction is a signal. Signals accumulate into rules. Rules become a prompt. The prompt improves.

### 2. Production Mode (Deployment)

After tuning, users deploy through our API proxy. We see all traffic and collect user feedback (thumbs up/down).

We cluster unhappy responses into patterns. We suggest fixes. Users approve. The prompt improves from real usage. Test suites grow automatically.

## What To Build

Read the specs in the specs/ directory for detailed requirements:
- specs/overview.md - Product summary and principles
- specs/flow-mode.md - The tuning interface
- specs/production-mode.md - Deployment and continuous learning
- specs/data-models.md - Database entities
- specs/signal-processing.md - How signals become rules
- specs/background-optimizer.md - Automated improvement
- specs/advanced-view.md - Power user features

## Build Order

1. Data models and database schema
2. Flow mode interface (minimal UI with the 4 controls)
3. Signal accumulation backend
4. Test case generation from satisficed exchanges
5. Comparison mode for ambiguous feedback
6. Review queue modal
7. Checkpoint and versioning
8. Background optimization system
9. API proxy for production deployment
10. Feedback collection and logging
11. Pattern detection from unhappy responses
12. Pattern fix flow
13. Trust levels and auto-fix
14. Advanced view (test suite, rules, prompt tabs)

## Completion Criteria

The project is complete when:
- Flow mode works end to end with all controls functional
- Signals accumulate and generate a working system prompt
- Test cases are created automatically from approved responses
- Background optimizer improves prompts after checkpoint
- API proxy deploys prompts and collects feedback
- Pattern detection finds clusters in unhappy responses
- Fix flow tests changes and deploys approved fixes
- Version history tracks all changes with rollback

## Quality Standards

- Every feature must work before moving to the next
- Test each interaction path manually
- Keep the flow interface minimal - resist adding complexity
- The user should never see technical details during flow mode
- All complexity lives in the backend and advanced view

## RALPH_STATUS Block

When you complete significant milestones or the entire project, output:

\`\`\`
RALPH_STATUS:
  completed_phase: [phase name]
  progress_percentage: [0-100]
  EXIT_SIGNAL: [true only when ALL criteria met, false otherwise]
  next_action: [what comes next]
\`\`\`

Only set EXIT_SIGNAL: true when every completion criterion is satisfied and tested.