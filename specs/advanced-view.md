# Advanced View Specification

## Purpose

Separate section for power users who want to see and manage internals. Completely optional. Not visible during normal flow.

## Access

Separate tab or section. User explicitly navigates here. Does not interrupt flow mode.

## Test Suite Tab

### Display
List all test cases grouped by source:
- From Tuning (created during flow mode)
- From Production (created from patterns)

For each test case show:
- Question
- Expected response characteristics
- Pass/fail status on current version
- Source and creation date

### Actions
- Run all tests (execute test suite against current prompt)
- Run single test
- View test details
- Delete test (with confirmation)

### Metrics
- Total test count
- Pass rate
- Coverage by question type

## Rules Tab

### Hard Rules Section
List all hard rules:
- Rule text
- Type (phrase ban, requirement, etc)
- Source (which signal created it)
- Active/inactive toggle

For each:
- Edit button (modify rule)
- Delete button (with confirmation showing what might break)

### Soft Preferences Section
List all soft preferences:
- Dimension
- Direction and strength (visual indicator)
- Confidence level
- Source signals (count)

For each:
- Adjust strength slider
- Edit context/conditions
- Delete (with confirmation)

### Add New
Button to manually add rules or preferences (for power users who want direct control).

## Prompt Tab

### Display
Show the actual generated system prompt text in a code/text view.

### Sections
Indicate which section came from which rules/preferences (annotations or color coding).

### Edit Mode
Allow direct editing of prompt text.

Warning: Manual edits may be overwritten by signal processing. Offer to lock sections from auto-update.

### Export
Copy prompt to clipboard or download as file.

## Version History

### List
All versions with:
- Version number/name
- Timestamp
- Source
- Test suite size at that version
- Pass rate

### Compare
Select two versions to see diff.

### Rollback
One-click rollback to any version. Confirmation required.

## Analytics (Optional)

If in production mode:
- Helpful rate over time (chart)
- Call volume over time
- Top failure patterns
- Test suite growth