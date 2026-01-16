# Background Optimizer Specification

## Purpose

After checkpoint, automatically improve the prompt by testing variations against the accumulated test suite.

## Trigger

Runs when:
- User creates a manual checkpoint
- Auto-checkpoint triggers (every 30 minutes)

## Process

### Step 1: Gather Current State
- Current prompt text
- All test cases
- All hard rules
- All soft preferences

### Step 2: Generate Variations
Create multiple prompt variations:
- Reword instructions differently
- Reorganize sections
- Adjust emphasis
- Try different phrasings for rules

Generate 10-20 variations per run.

### Step 3: Test Each Variation
For each variation:
- Run all test cases
- Check hard rules (pass/fail)
- Score soft preferences (0-1)
- Calculate overall score

### Step 4: Evaluate Results
- Must pass all hard rules (non-negotiable)
- Score = weighted combination of soft preference scores
- Higher score = better prompt

### Step 5: Compare to Current
If a variation scores higher than current prompt:
- It becomes the new candidate
- Continue testing more variations against it

### Step 6: Overfitting Detection
Check for overfitting:
- Test on held-out cases (if available)
- Check if prompt is too specific to test cases
- Prefer simpler prompts that still pass

Indicators of overfitting:
- Prompt length grew significantly
- Very specific language matching test cases exactly
- Poor performance on novel inputs

### Step 7: Save Improved Version
If improvement found:
- Save as new version
- Source: background_optimization
- User sees improved prompt next time they check

## Duration

Can run for extended periods (hours). Not blocking user activity.

## Resource Management

- Rate limit LLM calls
- Run in background/async
- Pause if user starts new tuning session
- Resume when idle

## Results

After optimization:
- New version saved (if improved)
- Log of what was tried
- Metrics on improvement achieved

User comes back to find prompt is better without doing anything.