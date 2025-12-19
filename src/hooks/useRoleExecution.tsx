import { useCallback } from 'react';
import { useAssistantProfile, AssistantRole, AllowedActions, TrustBoundaries } from '@/hooks/useAssistantProfile';
import { toast } from '@/components/ui/sonner';

// Action categories with authority requirements
export type ActionCategory = 
  | 'suggest'           // Analyst + Operator: always allowed
  | 'draft'             // Analyst: suggest only, Operator: can draft
  | 'schedule'          // Analyst: requires confirmation, Operator: minimal confirmation
  | 'archive'           // Analyst: requires confirmation, Operator: auto-allowed
  | 'send'              // Analyst: blocked, Operator: requires confirmation
  | 'delete'            // Always requires confirmation
  | 'autoExecute';      // Analyst: blocked, Operator: allowed with trust boundaries

export type ActionType = 
  | 'createTask'
  | 'updateTask'
  | 'deleteTask'
  | 'startFocusSession'
  | 'completeFocusSession'
  | 'claimUCT'
  | 'spendUCT'
  | 'sendMessage'
  | 'archiveMessage'
  | 'scheduleAction'
  | 'autoReply'
  | 'draftReply'
  | 'suggest'
  | 'analyze';

// Map actions to their category and required authority
interface ActionConfig {
  category: ActionCategory;
  minRole: AssistantRole;
  requiresConfirmation: {
    analyst: boolean;
    operator: boolean;
  };
  allowedActionKey?: keyof AllowedActions;
  trustBoundaryKey?: keyof TrustBoundaries;
}

const ACTION_CONFIG: Record<ActionType, ActionConfig> = {
  // Always allowed - suggestion/analysis
  suggest: {
    category: 'suggest',
    minRole: 'analyst',
    requiresConfirmation: { analyst: false, operator: false },
  },
  analyze: {
    category: 'suggest',
    minRole: 'analyst',
    requiresConfirmation: { analyst: false, operator: false },
  },
  
  // Task management
  createTask: {
    category: 'draft',
    minRole: 'analyst',
    requiresConfirmation: { analyst: true, operator: false },
  },
  updateTask: {
    category: 'draft',
    minRole: 'analyst',
    requiresConfirmation: { analyst: true, operator: false },
  },
  deleteTask: {
    category: 'delete',
    minRole: 'analyst',
    requiresConfirmation: { analyst: true, operator: true },
  },
  
  // Focus sessions
  startFocusSession: {
    category: 'schedule',
    minRole: 'analyst',
    requiresConfirmation: { analyst: true, operator: false },
    allowedActionKey: 'schedule_items',
  },
  completeFocusSession: {
    category: 'draft',
    minRole: 'analyst',
    requiresConfirmation: { analyst: false, operator: false },
  },
  
  // UCT operations
  claimUCT: {
    category: 'draft',
    minRole: 'analyst',
    requiresConfirmation: { analyst: true, operator: false },
  },
  spendUCT: {
    category: 'schedule',
    minRole: 'analyst',
    requiresConfirmation: { analyst: true, operator: true },
  },
  
  // Messaging - requires Operator for autonomous actions
  sendMessage: {
    category: 'send',
    minRole: 'operator',
    requiresConfirmation: { analyst: true, operator: true },
    trustBoundaryKey: 'send_messages',
  },
  archiveMessage: {
    category: 'archive',
    minRole: 'analyst',
    requiresConfirmation: { analyst: true, operator: false },
    allowedActionKey: 'archive_items',
  },
  scheduleAction: {
    category: 'schedule',
    minRole: 'analyst',
    requiresConfirmation: { analyst: true, operator: false },
    allowedActionKey: 'schedule_items',
    trustBoundaryKey: 'schedule_meetings',
  },
  autoReply: {
    category: 'autoExecute',
    minRole: 'operator',
    requiresConfirmation: { analyst: true, operator: false },
    allowedActionKey: 'auto_handle_low_risk',
    trustBoundaryKey: 'send_messages',
  },
  draftReply: {
    category: 'draft',
    minRole: 'analyst',
    requiresConfirmation: { analyst: true, operator: false },
    allowedActionKey: 'draft_replies',
  },
};

// Calm, non-judgmental explanations for blocked actions
const BLOCKED_EXPLANATIONS: Record<ActionCategory, string> = {
  suggest: 'This action is available.',
  draft: 'I can prepare this for your review, but I need your confirmation to proceed.',
  schedule: 'I can schedule this, but your approval is required first.',
  archive: 'I can archive this item, but I need you to confirm.',
  send: 'Sending messages on your behalf requires Operator mode. Would you like me to draft this for your review instead?',
  delete: 'Deleting content requires your explicit confirmation.',
  autoExecute: 'Autonomous actions require Operator mode. I can suggest this action, but you\'ll need to execute it manually.',
};

const UPGRADE_SUGGESTIONS: Record<ActionCategory, string> = {
  suggest: '',
  draft: 'Enable draft permissions in assistant settings to allow this.',
  schedule: 'Enable scheduling permissions to allow autonomous scheduling.',
  archive: 'Enable archive permissions to allow automatic archiving.',
  send: 'Upgrade to Operator mode in settings to enable message sending.',
  delete: 'This action always requires confirmation for safety.',
  autoExecute: 'Upgrade to Operator mode to enable autonomous actions.',
};

export interface RoleExecutionResult {
  allowed: boolean;
  requiresConfirmation: boolean;
  blockedReason: string | null;
  suggestion: string | null;
  canSuggestInstead: boolean;
}

export interface UseRoleExecutionReturn {
  // Check if action is allowed for current role
  checkAction: (action: ActionType) => RoleExecutionResult;
  
  // Execute action with role enforcement
  executeWithRoleCheck: <T>(
    action: ActionType,
    executor: () => Promise<T>,
    options?: {
      onBlocked?: (result: RoleExecutionResult) => void;
      skipConfirmation?: boolean;
    }
  ) => Promise<{ success: boolean; result?: T; blocked?: RoleExecutionResult }>;
  
  // Get current role info
  currentRole: AssistantRole;
  isOperator: boolean;
  isAnalyst: boolean;
  
  // Permission helpers
  canAutoHandle: (actionType: keyof AllowedActions) => boolean;
  requiresConfirmationFor: (action: ActionType) => boolean;
}

export function useRoleExecution(): UseRoleExecutionReturn {
  const { 
    profile, 
    isOperator: checkIsOperator, 
    canAutoHandle,
    requiresConfirmation: checkTrustBoundary,
  } = useAssistantProfile();
  
  const currentRole: AssistantRole = profile?.role || 'analyst';
  const isOperator = checkIsOperator();
  const isAnalyst = !isOperator;

  const checkAction = useCallback((action: ActionType): RoleExecutionResult => {
    const config = ACTION_CONFIG[action];
    
    if (!config) {
      // Unknown action - block by default
      return {
        allowed: false,
        requiresConfirmation: true,
        blockedReason: 'This action is not recognized.',
        suggestion: 'Please try a different approach.',
        canSuggestInstead: false,
      };
    }

    // Check minimum role requirement
    const roleOrder: Record<AssistantRole, number> = { analyst: 0, operator: 1 };
    const hasRequiredRole = roleOrder[currentRole] >= roleOrder[config.minRole];

    if (!hasRequiredRole) {
      return {
        allowed: false,
        requiresConfirmation: true,
        blockedReason: BLOCKED_EXPLANATIONS[config.category],
        suggestion: UPGRADE_SUGGESTIONS[config.category],
        canSuggestInstead: config.category !== 'suggest',
      };
    }

    // Check allowed actions if specified
    if (config.allowedActionKey && !canAutoHandle(config.allowedActionKey)) {
      // Action not enabled in settings
      const needsConfirmation = config.requiresConfirmation[currentRole];
      return {
        allowed: true,
        requiresConfirmation: true, // Force confirmation if not auto-enabled
        blockedReason: null,
        suggestion: null,
        canSuggestInstead: false,
      };
    }

    // Check trust boundaries if specified
    if (config.trustBoundaryKey && checkTrustBoundary(config.trustBoundaryKey)) {
      // Trust boundary requires confirmation
      return {
        allowed: true,
        requiresConfirmation: true,
        blockedReason: null,
        suggestion: null,
        canSuggestInstead: false,
      };
    }

    // Action is allowed
    const needsConfirmation = config.requiresConfirmation[currentRole];
    
    return {
      allowed: true,
      requiresConfirmation: needsConfirmation,
      blockedReason: null,
      suggestion: null,
      canSuggestInstead: false,
    };
  }, [currentRole, canAutoHandle, checkTrustBoundary]);

  const executeWithRoleCheck = useCallback(async <T,>(
    action: ActionType,
    executor: () => Promise<T>,
    options?: {
      onBlocked?: (result: RoleExecutionResult) => void;
      skipConfirmation?: boolean;
    }
  ): Promise<{ success: boolean; result?: T; blocked?: RoleExecutionResult }> => {
    const check = checkAction(action);

    if (!check.allowed) {
      // Show calm toast explaining the block
      toast.info(check.blockedReason || 'This action is not available.', {
        description: check.suggestion || undefined,
        duration: 4000,
      });

      options?.onBlocked?.(check);
      
      return { success: false, blocked: check };
    }

    // If confirmation required and not skipped, we return without executing
    // The caller should handle confirmation UI
    if (check.requiresConfirmation && !options?.skipConfirmation) {
      return { 
        success: false, 
        blocked: {
          ...check,
          blockedReason: 'Confirmation required before proceeding.',
          suggestion: null,
        }
      };
    }

    // Execute the action
    try {
      const result = await executor();
      return { success: true, result };
    } catch (error) {
      console.error(`[RoleExecution] Action ${action} failed:`, error);
      toast.error('Action failed', {
        description: 'Something went wrong. Please try again.',
      });
      return { success: false };
    }
  }, [checkAction]);

  const requiresConfirmationFor = useCallback((action: ActionType): boolean => {
    const result = checkAction(action);
    return result.requiresConfirmation;
  }, [checkAction]);

  return {
    checkAction,
    executeWithRoleCheck,
    currentRole,
    isOperator,
    isAnalyst,
    canAutoHandle,
    requiresConfirmationFor,
  };
}
