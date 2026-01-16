# SysPrompt Brand Guidelines

## Brand Identity

**Name**: SysPrompt
**Tagline**: "Express taste, not requirements"
**Mission**: Transform prompt engineering from specification to discovery

## Color Palette

### Primary Colors (Muted Tones)

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Slate | `#64748b` | 100, 116, 139 | Primary text, icons |
| Indigo | `#6366f1` | 99, 102, 241 | Primary actions, links |
| Violet | `#8b5cf6` | 139, 92, 246 | Accents, highlights |

### Neutral Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Background | `#fafafa` | 250, 250, 250 | Light mode background |
| Surface | `#f4f4f5` | 244, 244, 245 | Cards, elevated surfaces |
| Border | `#e4e4e7` | 228, 228, 231 | Borders, dividers |
| Muted | `#a1a1aa` | 161, 161, 170 | Secondary text |

### Dark Mode Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Background | `#09090b` | 9, 9, 11 | Dark mode background |
| Surface | `#18181b` | 24, 24, 27 | Cards, elevated surfaces |
| Border | `#27272a` | 39, 39, 42 | Borders, dividers |
| Muted | `#71717a` | 113, 113, 122 | Secondary text |

### Semantic Colors (Muted Variants)

| Name | Hex | Usage |
|------|-----|-------|
| Success | `#22c55e` | Positive feedback, passed tests |
| Warning | `#f59e0b` | Caution states, pending items |
| Error | `#ef4444` | Errors, failed tests, negative feedback |
| Info | `#3b82f6` | Information, tips |

## Typography

### Font Stack
- **Primary**: Inter, system-ui, sans-serif
- **Monospace**: JetBrains Mono, ui-monospace, monospace (for code/prompts)

### Sizes
- **Display**: 2.25rem (36px) - Hero text
- **Heading 1**: 1.875rem (30px) - Page titles
- **Heading 2**: 1.5rem (24px) - Section titles
- **Heading 3**: 1.25rem (20px) - Card titles
- **Body**: 1rem (16px) - Standard text
- **Small**: 0.875rem (14px) - Labels, captions
- **Tiny**: 0.75rem (12px) - Badges, metadata

## Logo

The SysPrompt logo consists of:
1. **Icon**: A stylized "S" formed by two overlapping speech bubbles, representing dialogue and iteration
2. **Wordmark**: "SysPrompt" in Inter Bold

### Logo Colors
- Primary: Indigo (#6366f1) on light backgrounds
- Inverted: White (#ffffff) on dark backgrounds

## UI Components

### Buttons

**Primary Button**
- Background: Indigo (#6366f1)
- Hover: Darker indigo (#4f46e5)
- Text: White

**Secondary Button**
- Background: Surface (#f4f4f5 / #18181b dark)
- Border: Border (#e4e4e7 / #27272a dark)
- Text: Slate (#64748b)

**Ghost Button**
- Background: Transparent
- Hover: Surface with opacity
- Text: Slate (#64748b)

### Cards
- Background: Surface color
- Border: 1px solid Border color
- Border Radius: 0.75rem (12px)
- Shadow: Subtle (0 1px 3px rgba(0,0,0,0.1))

### Inputs
- Background: Background color
- Border: 1px solid Border color
- Focus: 2px ring in Indigo with opacity
- Border Radius: 0.5rem (8px)

## Voice & Tone

### Principles
1. **Clear**: No jargon, plain language
2. **Calm**: Reassuring, not urgent
3. **Helpful**: Guide, don't instruct
4. **Human**: Conversational, not robotic

### Copy Examples

**Good**: "How did this response feel?"
**Avoid**: "Rate the quality of the generated output"

**Good**: "Let's try something different"
**Avoid**: "Error: Response rejected. Regenerating..."

**Good**: "Your prompt is getting better"
**Avoid**: "Optimization complete. Score improved by 15%"

## Application Areas

### Landing Page
- Hero with gradient background (subtle indigo to violet)
- Clear value proposition
- Muted, professional aesthetic

### Flow Mode
- Minimal chrome, maximum focus
- Soft shadows on response cards
- Muted control buttons until hovered

### Dashboard
- Clean grid layouts
- Muted metric cards
- Subtle data visualizations

### Production View
- Professional appearance
- Clear status indicators
- Muted patterns for charts

## Accessibility

- Minimum contrast ratio: 4.5:1 for text
- Focus indicators visible on all interactive elements
- Color not sole indicator of state (use icons/text)
- Support for reduced motion preferences
