
# Cohesive Presentation Demo Experience for UnclutterAI

## Overview

Transform the existing `/demo` route into a multi-scene, single-system demo that visually supports Scenes 2-5 of the product video. The demo evolves through distinct phases, showing one continuous system—not separate demos.

## Scene Flow Architecture

The demo will progress through 4 distinct scenes, controlled by a phase state machine. Each scene builds on the previous, creating a narrative of increasing intelligence.

```text
Timeline: ~20-25 seconds total (adjustable)

┌─────────────────────────────────────────────────────────────────────────┐
│  Scene 2       Scene 3         Scene 4           Scene 5               │
│  (0-4s)        (4-9s)          (9-15s)           (15-22s)              │
│                                                                         │
│  Static        Messages        AI labels         Tasks                  │
│  Inbox         fade in         appear            materialize            │
│  at rest       one by one      on messages       from messages          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Scene 2: Product Introduction State (0-4s)

**Purpose:** Establish UnclutterAI as real software at rest.

**Visual State:**
- Clean header with "Unified Inbox" title and UnclutterAI logo
- Empty inbox area with subtle ambient glow
- Status indicator: "Monitoring 3 channels"
- Completely static, no motion

**Implementation:**
- Initial render shows header only
- No messages visible yet
- Calm, confident, production-ready appearance

---

## Scene 3: Unified Inbox Reveal (4-9s)

**Purpose:** Show multi-channel unification.

**Visual State:**
- 7 messages fade in sequentially (staggered, 0.3s apart)
- Each message shows:
  - Source icon (Email/Slack/WhatsApp) - subtle, muted
  - Sender name - primary text
  - Subject/preview - secondary text
  - Time indicator - tertiary, muted

**Implementation:**
- Messages appear in priority groups: "Requires Action" first, then "For Review", then "FYI"
- Each row uses slow fade-in (opacity 0→1, duration 500ms)
- No priority indicators yet—just raw unified inbox

**Demo Data (7 messages):**
| # | Sender | Intent | Source | Priority |
|---|--------|--------|--------|----------|
| 1 | Sarah Chen | Contract needs approval before Friday | Email | high |
| 2 | DevOps Team | Production deployment blocked | Slack | high |
| 3 | Michael Torres | Review updated proposal draft | Email | medium |
| 4 | Product Team | Feedback requested on roadmap | Slack | medium |
| 5 | Finance | Q4 invoice processed | Email | fyi |
| 6 | Alex Kim | Confirmed meeting moved to 3pm | WhatsApp | fyi |
| 7 | Board Assistant | Quarterly report attached | Email | fyi |

---

## Scene 4: AI Understanding — Urgency & Intent (9-15s)

**Purpose:** Demonstrate real AI behavior.

**Visual Changes:**
- Priority indicators animate in (left-edge color bars)
  - High: muted amber
  - Medium: subtle blue
  - FYI: no color (transparent)
- AI intent labels appear below each message (staggered)

**Intent Labels (factual, not promotional):**
| Message | AI Label |
|---------|----------|
| Contract approval | "Decision required" |
| Deployment blocked | "Awaiting response" |
| Proposal draft | "Review requested" |
| Roadmap feedback | "Input requested" |
| Invoice processed | "No action needed" |
| Meeting moved | "Acknowledged" |
| Quarterly report | "For reference" |

**Implementation:**
- Priority bars fade in simultaneously (300ms)
- Intent labels fade in staggered (0.2s apart)
- Low-priority messages visually de-emphasized (opacity 60%)

---

## Scene 5: Output — Tasks & Clarity (15-22s)

**Purpose:** Show the result of AI processing.

**Visual Changes:**
- Right panel slides in with "Your Next Actions" header
- 4 tasks extracted from high/medium priority messages:
  1. "Approve contract" — from Sarah Chen's email
  2. "Unblock deployment" — from DevOps Slack
  3. "Review proposal" — from Michael Torres
  4. "Provide roadmap feedback" — from Product Team

**Task Panel Design:**
- Minimal, clean list
- Each task shows:
  - Clear action (primary text)
  - Source reference (subtle, secondary)
  - Priority indicator (left bar)

**Implementation:**
- Panel slides in from right (transform: translateX)
- Tasks fade in staggered (0.3s apart)
- FYI messages in inbox visually dim further (40% opacity)

---

## Visual Specifications

### Layout Structure
```text
┌────────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  UnclutterAI Logo    Unified Inbox    Status Badge             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌─────────────────────────────────────┐ ┌──────────────────────────┐  │
│  │                                     │ │                          │  │
│  │         MESSAGE LIST                │ │      TASK PANEL          │  │
│  │         (Scenes 2-4)                │ │      (Scene 5 only)      │  │
│  │                                     │ │                          │  │
│  │  ┌─────────────────────────────┐    │ │  Your Next Actions       │  │
│  │  │ ▎ Sender                    │    │ │                          │  │
│  │  │   Intent summary            │    │ │  ☐ Approve contract      │  │
│  │  │   AI Label (Scene 4+)       │    │ │    ↳ from Sarah Chen     │  │
│  │  │                  Source Time│    │ │                          │  │
│  │  └─────────────────────────────┘    │ │  ☐ Unblock deployment    │  │
│  │                                     │ │    ↳ from DevOps Team    │  │
│  │                                     │ │                          │  │
│  └─────────────────────────────────────┘ └──────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Color Palette (Dark Mode Only)
- Background: `#0b0b0d` to `#111111` gradient
- Card: `rgba(255,255,255,0.03)` with subtle border
- Primary accent: `hsl(266 83% 65%)` — UnclutterAI purple
- Text primary: `#fafafa`
- Text secondary: `#a1a1aa`
- Text muted: `#71717a`
- Priority high: `#d97706` (muted amber)
- Priority medium: `#60a5fa` (soft blue)

### Typography
- Font: Inter (already configured)
- Header: 24px, semibold, -0.02em tracking
- Sender: 16px, semibold
- Intent: 15px, regular, muted
- AI Label: 13px, medium, primary color
- Meta: 12px, regular, very muted

### Spacing
- Container max-width: 960px (two-panel layout)
- Message row height: 76px
- Row padding: 20px horizontal, 16px vertical
- Section gap: 32px
- Message gap: 12px

### Motion Guidelines
- All transitions: 500ms ease-out
- Stagger delay: 200-300ms
- No bounce, spring, or overshoot
- Motion should feel "inevitable, not animated"

---

## Technical Implementation

### File Structure
All changes contained in `src/pages/Demo.tsx`:

### State Machine
```typescript
type DemoScene = 
  | "intro"        // Scene 2: Static header, empty inbox
  | "inbox"        // Scene 3: Messages fade in
  | "intelligence" // Scene 4: AI labels appear
  | "tasks";       // Scene 5: Task panel slides in

const [scene, setScene] = useState<DemoScene>("intro");
```

### Timing Sequence
```typescript
useEffect(() => {
  const timers = [
    setTimeout(() => setScene("inbox"), 2000),        // Scene 3 starts
    setTimeout(() => setScene("intelligence"), 7000), // Scene 4 starts
    setTimeout(() => setScene("tasks"), 13000),       // Scene 5 starts
  ];
  return () => timers.forEach(clearTimeout);
}, []);
```

### Component Structure

1. **DemoHeader** — Logo, title, status
2. **DemoMessageList** — Container for message sections
3. **DemoSection** — Priority group (label + messages)
4. **DemoMessageRow** — Individual message with:
   - Priority bar
   - Sender/intent
   - AI label (conditional)
   - Source/time meta
5. **DemoTaskPanel** — Slide-in task list (Scene 5)
6. **DemoTaskRow** — Individual extracted task

### Staggered Animations
```typescript
// Messages appear one by one in Scene 3
const messageDelay = (index: number) => 
  scene === "inbox" ? `${index * 300}ms` : "0ms";

// AI labels appear staggered in Scene 4
const labelDelay = (index: number) =>
  scene === "intelligence" ? `${index * 200}ms` : "0ms";
```

### CSS Transitions
```css
/* Base message row */
.demo-message-row {
  opacity: 0;
  transition: opacity 500ms ease-out;
}

/* Visible state */
.demo-message-row--visible {
  opacity: 1;
}

/* De-emphasized (FYI in Scene 4-5) */
.demo-message-row--dimmed {
  opacity: 0.4;
}

/* Task panel slide */
.demo-task-panel {
  transform: translateX(100%);
  transition: transform 600ms ease-out;
}

.demo-task-panel--visible {
  transform: translateX(0);
}
```

---

## Demo Data

### Messages (7 total)
```typescript
const DEMO_MESSAGES = [
  { id: "1", sender: "Sarah Chen", intent: "Contract needs approval before Friday", source: "email", priority: "high", aiLabel: "Decision required" },
  { id: "2", sender: "DevOps Team", intent: "Production deployment blocked", source: "slack", priority: "high", aiLabel: "Awaiting response" },
  { id: "3", sender: "Michael Torres", intent: "Review updated proposal draft", source: "email", priority: "medium", aiLabel: "Review requested" },
  { id: "4", sender: "Product Team", intent: "Feedback requested on roadmap", source: "slack", priority: "medium", aiLabel: "Input requested" },
  { id: "5", sender: "Finance", intent: "Q4 invoice processed", source: "email", priority: "fyi", aiLabel: "No action needed" },
  { id: "6", sender: "Alex Kim", intent: "Confirmed meeting moved to 3pm", source: "whatsapp", priority: "fyi", aiLabel: "Acknowledged" },
  { id: "7", sender: "Board Assistant", intent: "Quarterly report attached", source: "email", priority: "fyi", aiLabel: "For reference" },
];
```

### Tasks (4 derived from messages)
```typescript
const DEMO_TASKS = [
  { id: "t1", action: "Approve contract", source: "Sarah Chen", messageId: "1", priority: "high" },
  { id: "t2", action: "Unblock deployment", source: "DevOps Team", messageId: "2", priority: "high" },
  { id: "t3", action: "Review proposal", source: "Michael Torres", messageId: "3", priority: "medium" },
  { id: "t4", action: "Provide roadmap feedback", source: "Product Team", messageId: "4", priority: "medium" },
];
```

---

## Removed / Avoided Elements

**Explicitly excluded:**
- User avatars
- Emojis
- Playful copy or productivity jargon
- Onboarding tips or tooltips
- Glow effects or neon colors
- Spring/bounce animations
- Scrolling or cursor
- Interactive elements
- Marketing language ("magic", "supercharged", "AI-powered")

---

## Success Criteria

When someone watches the demo silently, they should conclude:
- ✓ This is a real AI product
- ✓ This is a real workflow
- ✓ This could exist today
- ✓ This is built for serious users

The demo should feel:
- **Calm** — Nothing demands attention unnecessarily
- **Confident** — No explanations needed
- **Inevitable** — Each transition feels natural
- **Professional** — Apple / Linear / Stripe aesthetic

---

## Implementation Summary

| File | Changes |
|------|---------|
| `src/pages/Demo.tsx` | Complete rewrite with multi-scene state machine, new components, updated data |

**Estimated scope:** Single file, ~400-500 lines of React/TypeScript

