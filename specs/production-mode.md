# Production Mode Specification

## Purpose

After tuning, users deploy through our proxy. We collect feedback, detect patterns, and continuously improve the prompt.

## Deployment Setup

### Transition Point
User clicks Deploy with SysPrompt after checkpointing.

### Setup Screen
Show:
1. New API endpoint URL (drop-in replacement)
2. API key for authentication
3. Optional: feedback widget code snippet

### Integration
User changes their API endpoint from OpenAI/Anthropic to ours. Same API format. We handle the rest.

## API Proxy

### Behavior
1. Receive API call in standard format
2. Inject the tuned system prompt
3. Forward to underlying LLM
4. Return response to caller
5. Log everything: input, output, latency, metadata

### Logging
Store for each call:
- Timestamp
- Prompt version used
- User input
- Model output
- Latency
- Any errors

## Feedback Collection

### Widget
Embeddable script that adds thumbs up/down to user UIs.

Two styles:
- Minimal: just 👍 and 👎
- Full: thumbs plus comment field

### API
Endpoint for submitting feedback:
- Call ID (links to logged call)
- Rating (up/down)
- Comment (optional)

### Storage
Link feedback to the original call record.

## Production Dashboard

### Metrics Display
- Call volume (today, this week)
- Feedback rate (percentage of calls with feedback)
- Helpful rate (percentage thumbs up)

### Recent Unhappy
List of recent thumbs-down responses:
- The question asked
- The response given
- Any comment provided
- Timestamp

### Pattern Detection Status
- Show when insufficient data for patterns
- Show count of patterns detected when ready

## Pattern Detection

### Clustering
Group unhappy responses by semantic similarity.

### Pattern Output
For each pattern:
- Description of common thread
- Count of unhappy responses
- Percentage of total unhappy
- Example queries in this pattern
- Likely cause hypothesis
- Confidence level

### Display
List patterns with indicators for new ones. Allow clicking into details.

## Pattern Fix Flow

### Pattern Detail View
Show:
- What we found (explanation)
- Examples (specific queries and responses)
- Suggested fix (proposed prompt change)
- Confidence level

### Actions
Three buttons:
- **Apply fix** - Test and stage the fix
- **Tune manually** - Go to flow mode with these examples
- **Ignore** - Dismiss this pattern

### Apply Fix Process
1. Generate prompt modification
2. Run against existing test suite (check regressions)
3. Run against unhappy cases from pattern
4. Show results: existing tests pass rate, unhappy cases improvement
5. Show before/after example
6. User approves or discards

### On Approval
- Deploy new version
- Add pattern cases to test suite automatically
- Test suite grows from production

## Trust Levels

### Settings Location
Settings page with trust level selector.

### Levels

**Monitor Only**
- Collect feedback
- Show patterns
- User fixes everything manually

**Suggest Fixes (default)**
- Detect patterns
- Propose fixes
- User approves before deploy

**Auto-fix Guardrailed**
- Auto-apply fixes that pass all tests
- Respect guardrails (configurable: never change tone, never change hard bans)
- Notify user of changes
- User can rollback

**Full Autopilot**
- Continuous evolution
- Weekly summary email
- For mature stable prompts

## Version History

### Tracking
Every version stored with:
- Version number/name
- Timestamp
- Source (manual checkpoint, optimization, production fix, auto-fix)
- Test suite size
- Pass rate at time of save

### Rollback
One-click rollback to any previous version.

### Audit Trail
Clear history of why each version exists.