# Signal Processing Specification

## Overview

Signals are raw interaction events. Signal processing converts them into rules and preferences that generate the system prompt.

## Signal Types

### length_adjust
User tapped minus or plus.
Contains: direction (shorter/longer), question context, before/after responses

### thumbs_down
User indicated response was bad.
Contains: feedback text, question, rejected response, regenerated response

### satisficed
User approved a response.
Contains: question, winning response

### phrase_ban
User highlighted text and clicked Never.
Contains: banned phrase, scope, any condition note

### comparison_pick
User chose between two variants.
Contains: both variants, winner, inferred dimension

### feedback_text
Natural language feedback typed by user.
Contains: raw text, parsed intents (extracted by system)

## Processing Pipeline

### Step 1: Signal Ingestion
Store raw signal immediately on user action. Do not process synchronously.

### Step 2: Intent Extraction
For feedback_text signals, extract structured intents:
- too long → length preference (shorter)
- too formal → tone preference (casual)
- missing X → content requirement (include X)
- hate phrase Y → potential phrase ban

Use LLM or pattern matching for extraction.

### Step 3: Hard Rule Extraction

Create HardRule when:
- User explicitly bans a phrase (phrase_ban signal)
- User explicitly requires something (parsed from feedback with high confidence)
- Multiple signals strongly indicate absolute requirement

Hard rules are binary: pass or fail.

### Step 4: Soft Preference Inference

Aggregate signals into preferences:
- Multiple shorter signals → length preference with strength based on frequency
- Consistent approval of casual responses → tone preference
- Pattern of adding detail → thoroughness preference for that context

Soft preferences have:
- Dimension (what aspect)
- Direction (which way)
- Strength (how much)
- Context (when it applies)

### Step 5: Contextual Rule Detection

Some rules only apply in certain situations:
- Shorter for simple questions, longer for complex
- Formal for external communication, casual for internal
- Technical depth based on question type

Detect context from:
- Question patterns
- User-provided conditions
- Clustering of signals by question type

### Step 6: Conflict Detection

Identify potentially conflicting signals:
- Said shorter once, said more detail another time
- Banned a phrase but approved response containing it

Check if auto-resolvable.

## Auto-Resolution Rules

When signals conflict, resolve automatically if possible:

### Recency
Later signals override earlier ones. User preferences evolve.

### Specificity
Specific context beats general. Shorter for billing questions beats shorter always.

### Explicit over Implicit
Direct action (phrase ban) beats inferred preference.

### Volume
Many signals beat few. If 10 signals say shorter and 2 say longer, shorter wins.

### Application
Apply rules in order. If still ambiguous after all rules, queue for user review.

## Prompt Generation

### Structure
Generate system prompt with sections:
1. Role/purpose description
2. Communication style (from tone, length, formality preferences)
3. Hard requirements (from hard rules)
4. Things to avoid (from phrase bans)
5. Contextual instructions (from contextual rules)

### Template
Use a consistent template. Fill sections based on accumulated rules and preferences.

### Regeneration
Regenerate prompt whenever rules or preferences change significantly. Track which version of rules generated which prompt version.