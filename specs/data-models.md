# Data Models Specification

## Prompt

The top-level entity representing a prompt being developed.

Fields:
- id (unique identifier)
- name (user-provided name)
- created_at (timestamp)
- updated_at (timestamp)
- current_version_id (reference to active version)
- deployment_status (draft, deployed, paused)
- deployment_settings (proxy config, trust level)

## Version

A snapshot of a prompt at a point in time.

Fields:
- id
- prompt_id (reference to parent prompt)
- version_number (sequential)
- version_name (optional user-provided name)
- prompt_text (the actual system prompt content)
- created_at
- source (manual_checkpoint, auto_checkpoint, background_optimization, production_fix, auto_fix)
- test_suite_snapshot (copy of test cases at this point)
- pass_rate (percentage at time of creation)

## Signal

A raw interaction event from the user.

Fields:
- id
- prompt_id
- timestamp
- type (length_adjust, thumbs_down, satisficed, phrase_ban, comparison_pick, feedback_text)
- question (the input being tested)
- response (the output shown)
- details (type-specific data)

Details by type:
- length_adjust: direction (shorter/longer), resulting_response
- thumbs_down: feedback_text, resulting_response
- satisficed: winning_response
- phrase_ban: banned_phrase, scope (global/conditional), condition_note
- comparison_pick: variant_a, variant_b, winner, dimension
- feedback_text: text, parsed_intents

## TestCase

A question-response pair used for regression testing.

Fields:
- id
- prompt_id
- question (the input)
- approved_response (the response user accepted)
- source (tuning, production)
- source_signal_id (if from tuning)
- source_pattern_id (if from production)
- created_at
- hard_rules_to_check (list of rule IDs that apply)
- soft_preferences_to_score (list of preference IDs)

## HardRule

An absolute requirement extracted from explicit user actions.

Fields:
- id
- prompt_id
- type (phrase_ban, phrase_require, pattern_ban, pattern_require)
- value (the phrase or pattern)
- scope (global, conditional)
- condition (if conditional, when does it apply)
- source_signal_id
- created_at
- active (boolean)

## SoftPreference

A directional tendency inferred from user behavior.

Fields:
- id
- prompt_id
- dimension (length, tone, formality, technical_depth, structure)
- direction (shorter/longer, casual/formal, etc)
- strength (0-1, how strong the preference)
- context (when does this apply, if contextual)
- source_signal_ids (list of signals that contributed)
- created_at
- confidence (how certain we are)

## ProductionCall

A logged API call through the proxy.

Fields:
- id
- prompt_id
- version_id (which version was used)
- timestamp
- input (user message)
- output (model response)
- latency_ms
- error (if any)
- metadata (model used, tokens, etc)

## Feedback

User feedback on a production call.

Fields:
- id
- production_call_id
- rating (up, down)
- comment (optional text)
- timestamp

## Pattern

A detected cluster of unhappy responses.

Fields:
- id
- prompt_id
- description (what the pattern is)
- common_thread (explanation of similarity)
- unhappy_call_ids (list of production calls in this pattern)
- count (number of calls)
- percentage (of total unhappy)
- likely_cause (hypothesis)
- confidence (0-1)
- status (detected, fixing, fixed, ignored)
- suggested_fix (proposed prompt change)
- resolution_version_id (if fixed, which version fixed it)
- created_at

## ReviewQueueItem

An item needing user decision.

Fields:
- id
- prompt_id
- type (retroactive_improvement, conflict_resolution)
- context_question (the question being decided)
- option_a (first response option)
- option_b (second response option)
- reason (why this needs review, internal use)
- status (pending, resolved, skipped)
- resolution (if resolved, which option chosen)
- created_at
- resolved_at