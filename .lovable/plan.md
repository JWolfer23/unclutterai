
# Presentation-Only Interaction State for Executive Inbox Demo

## Overview
Add an automatic, timed interaction sequence to the existing Demo page that showcases the assistant handling a high-priority message. The sequence runs once on page load, demonstrating intelligent action without user input.

## Interaction Timeline (~4-5 seconds total)

| Phase | Time | Visual State |
|-------|------|--------------|
| **Calm** | 0-1s | Static inbox, all messages visible |
| **Focus** | 1-2s | First high-priority message gains emphasis, others fade to 50% opacity |
| **Action** | 2-3.5s | Suggested action appears below focused message ("Approve contract") |
| **Resolve** | 3.5-4.5s | Action completes, message fades out and collapses |
| **Return** | 4.5s+ | Remaining messages return to full opacity, inbox calm |

## Technical Implementation

### 1. State Management
Add React state to track the interaction phase:

```tsx
type InteractionPhase = "calm" | "focus" | "action" | "resolve" | "complete";
const [phase, setPhase] = useState<InteractionPhase>("calm");
```

### 2. Timing Sequence (useEffect)
Implement the automatic sequence on component mount:

```tsx
useEffect(() => {
  const timers = [
    setTimeout(() => setPhase("focus"), 1000),
    setTimeout(() => setPhase("action"), 2000),
    setTimeout(() => setPhase("resolve"), 3500),
    setTimeout(() => setPhase("complete"), 4500),
  ];
  return () => timers.forEach(clearTimeout);
}, []);
```

### 3. Message Row Modifications
Update `DemoMessageRow` to accept interaction state props:

```tsx
interface DemoMessageRowProps {
  message: DemoMessage;
  isFocused: boolean;
  isFaded: boolean;
  isResolving: boolean;
  showAction: boolean;
}
```

**Visual states:**
- **Focused**: Slightly brighter background (`bg-card/50`), subtle ring (`ring-1 ring-primary/20`)
- **Faded**: Reduced opacity (`opacity-50`)
- **Resolving**: Collapse height to 0 with opacity fade
- **Action visible**: Inline action button appears below intent text

### 4. Suggested Action Component
Simple inline action that appears during "action" phase:

```tsx
function SuggestedAction({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mt-2 animate-in fade-in duration-300">
      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
      <span className="text-sm text-primary font-medium">{label}</span>
    </div>
  );
}
```

### 5. CSS Transitions
All transitions use opacity and max-height only (per constraints):

```tsx
// Base row classes
className={cn(
  "transition-all duration-500 ease-out",
  isFaded && "opacity-50",
  isFocused && "bg-card/50 ring-1 ring-primary/20",
  isResolving && "opacity-0 max-h-0 overflow-hidden py-0 my-0"
)}
```

### 6. Header Badge Update
During "complete" phase, update the badge from "All caught up" to reflect the resolved action (optional, subtle):

```tsx
{phase === "complete" ? "1 handled" : "All caught up"}
```

## File Changes

**`src/pages/Demo.tsx`** - All changes in this single file:

1. Add `useState` and `useEffect` imports
2. Add `InteractionPhase` type and state
3. Add timing sequence in `useEffect`
4. Create `SuggestedAction` component
5. Update `DemoMessageRow` to accept and respond to phase props
6. Pass phase-derived props from parent to each message row
7. Add transition classes for smooth opacity/layout changes
8. Target message ID "1" (Sarah Chen - Contract approval) as the focused message

## Visual Behavior Summary

- **No modals, tooltips, or explanations** - action appears inline
- **No scrolling or cursor** - page is static
- **Only opacity + subtle emphasis changes** - no sliding, bouncing, or dramatic animations
- **Professional action labels**: "Approve contract" (matches the high-priority contract message)
- **Message count updates**: Header shows "6 messages across 3 channels" after resolution

## Demo Data Alignment
The first high-priority message (Sarah Chen - "Contract needs approval before Friday") is perfect for this demo. The suggested action will be "Approve contract" - clear, professional, realistic.
