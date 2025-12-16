export type CommandCategory = 
  | 'communication'
  | 'tasks'
  | 'unclutter'
  | 'morning'
  | 'intelligence'
  | 'focus'
  | 'unknown';

export type CommandAction = 
  | 'summarize_messages'
  | 'read_priority'
  | 'reply'
  | 'archive'
  | 'remind'
  | 'whats_next'
  | 'schedule'
  | 'create_task'
  | 'what_can_wait'
  | 'clear_unread'
  | 'summarize_tabs'
  | 'close_low_priority'
  | 'whats_unresolved'
  | 'run_morning_brief'
  | 'whats_important_today'
  | 'start_focus'
  | 'explain_simply'
  | 'is_important'
  | 'whats_the_risk'
  | 'unknown';

export interface ParsedCommand {
  action: CommandAction;
  category: CommandCategory;
  object?: string;
  context?: string;
  requiresConfirmation: boolean;
  confirmationReason?: 'money' | 'external_send' | 'bulk_delete';
  bulkCount?: number;
}

export interface CommandResult {
  success: boolean;
  response: string;
  data?: unknown;
}

// Response templates for voice feedback
export const RESPONSE_TEMPLATES: Record<CommandAction, (context?: string) => string> = {
  summarize_messages: () => "Here's your message summary.",
  read_priority: () => "Reading your priority messages.",
  reply: (context) => context ? `Sending reply: ${context}` : "Reply sent.",
  archive: (context) => context ? `Archived ${context} messages.` : "Archived.",
  remind: (context) => context ? `Reminder set for ${context}.` : "Reminder set.",
  whats_next: () => "Here's what's next.",
  schedule: (context) => context ? `Scheduled for ${context}.` : "Scheduled.",
  create_task: (context) => context ? `Task created: ${context}` : "Task created.",
  what_can_wait: () => "These items can wait.",
  clear_unread: (context) => context ? `Cleared ${context} unread messages.` : "Unread messages cleared.",
  summarize_tabs: () => "Summarizing your open items.",
  close_low_priority: () => "Low priority items closed.",
  whats_unresolved: () => "Here are your unresolved items.",
  run_morning_brief: () => "Starting your morning brief.",
  whats_important_today: () => "Here's what matters today.",
  start_focus: () => "Starting focus block.",
  explain_simply: () => "Here's a simpler explanation.",
  is_important: () => "Analyzing importance.",
  whats_the_risk: () => "Assessing risk.",
  unknown: () => "I didn't understand that command.",
};

// Quick command suggestions
export const QUICK_COMMANDS = [
  { label: "What's next?", command: "What's next?" },
  { label: "Morning brief", command: "Run morning brief" },
  { label: "Summarize messages", command: "Summarize new messages" },
  { label: "Start focus", command: "Start focus block" },
  { label: "Clear unread", command: "Clear unread messages" },
  { label: "What's unresolved?", command: "What's unresolved?" },
];

// Command reference by category
export const COMMAND_REFERENCE: Record<CommandCategory, string[]> = {
  communication: [
    "Summarize new messages",
    "Read priority email",
    "Reply: [your message]",
    "Archive this",
    "Remind me tomorrow",
  ],
  tasks: [
    "What's next?",
    "Schedule this for [day]",
    "Create task: [description]",
    "What can wait?",
  ],
  unclutter: [
    "Clear unread messages",
    "Summarize open tabs",
    "Close everything low priority",
    "What's unresolved?",
  ],
  morning: [
    "Run morning brief",
    "What matters today?",
    "Start focus block",
  ],
  intelligence: [
    "Explain this simply",
    "Is this important?",
    "What's the risk here?",
  ],
  focus: [
    "Start focus block",
    "End focus session",
  ],
  unknown: [],
};
