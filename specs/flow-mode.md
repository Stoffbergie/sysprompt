# Flow Mode Specification

## Purpose

Flow mode is where users tune their prompts by reacting to outputs. The goal is flow state - minimal cognitive load, just reactions.

## The Interface

### Layout

The screen shows:
1. Current question (top)
2. Current response (middle)
3. Control buttons (below response)
4. Text input field (bottom)

That is the entire interface. Nothing else visible.

### Control Buttons

Four buttons in a row:

**Minus button (−)**
- Regenerates the response shorter
- Same content, fewer words
- Logs signal: user wanted shorter for this question type

**Plus button (+)**
- Regenerates the response with more detail
- More thorough explanation
- Logs signal: user wanted more detail for this question type

**Thumbs down button (👎)**
- Opens a text input overlay asking what is wrong
- User types natural language: too formal, missing the cost part, hate the opening
- System regenerates addressing the feedback
- Logs signal: the feedback and what was wrong

**Checkmark button (✓)**
- Marks this exchange as satisficed (user is happy)
- Clears the screen
- Ready for next question
- Stores question + response as a test case
- User does not know they created a test case

### Text Input Field

Located at the bottom. User can type:
- Feedback on current response (if response is showing)
- New question (to move on)

System determines intent based on context.

## Text Highlighting

When user selects text in the response:

Show a small popup near the selection with two buttons:
- **Never** - Ban this phrase globally
- **Note** - Add context about when to avoid

### Never Button
- One tap
- Phrase is added to hard rules (banned)
- Response regenerates without the phrase
- Popup disappears

### Note Button
- Opens small text input
- User can add context: only avoid in formal contexts, etc
- Creates conditional rule instead of hard ban

## Comparison Mode

When feedback is ambiguous (like too formal), system needs calibration.

### Trigger
System detects ambiguous feedback that could go multiple directions.

### Display
Show two response variants side by side:
- Response A on left
- Response B on right
- Each with a selection button below

### Interaction
- User taps which one is better
- Logs comparison_pick signal
- Comparison disappears
- Normal flow resumes with the winning approach

### Frequency
Keep comparisons rare. Only when truly necessary for calibration.

## Review Queue

### Purpose
Handle items that need user input without interrupting flow.

### What Gets Queued
- Retroactive improvements (new rule affects old approved response)
- Genuine conflicts that auto-resolve cannot handle

### Trigger
Modal appears when:
- Queue has 5+ items, OR
- Items have been waiting 20+ minutes

### Modal Interface
- Shows one question at top
- Shows two response options (A and B)
- User taps which is better
- Immediately shows next pair
- No explanation of why shown
- Optional: small text input for notes
- Counter showing progress (3 of 7)

### Flow
Rapid-fire selection. Tap, next, tap, next, done. 7 items in 30 seconds. Then back to normal flow.

## Checkpoint

### Manual Checkpoint
Small button in corner: Checkpoint

When clicked:
1. Process any pending review queue items
2. Save current state as named version
3. User can name it or accept auto-name

### Auto Checkpoint
Every 30 minutes of active use, auto-save a checkpoint.

### What Gets Saved
- Current prompt state
- All accumulated signals
- All rules and preferences
- All test cases
- Snapshot of everything