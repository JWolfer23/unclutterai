/**
 * Onboarding Missions - Earn-First UCT Incentive Loop
 * 
 * UCT is earned through clarity, not time spent.
 * 
 * Four core missions with +10 UCT each:
 * 1. Complete Assistant Setup → +10 UCT
 * 2. Connect Messaging → +10 UCT
 * 3. Complete First Unclutter → +10 UCT
 * 4. Complete First Focus Session → +10 UCT
 * 
 * Total: 40 UCT to unlock Pro
 */

export type MissionId = 
  | 'assistant_setup'
  | 'connect_messaging'
  | 'first_unclutter'
  | 'first_focus';

export interface Mission {
  id: MissionId;
  title: string;
  description: string;
  reward: number;
  icon: string;
  clarityAction: string; // What clarity action this represents
}

/**
 * The four onboarding missions - locked list
 * UCT is earned through clarity, not time spent.
 */
export const ONBOARDING_MISSIONS: Mission[] = [
  {
    id: 'assistant_setup',
    title: 'Complete assistant setup',
    description: 'Configure your assistant preferences',
    reward: 10,
    icon: 'Bot',
    clarityAction: 'Define how your assistant works',
  },
  {
    id: 'connect_messaging',
    title: 'Connect messaging',
    description: 'Link your email account',
    reward: 10,
    icon: 'Mail',
    clarityAction: 'Bring your communications together',
  },
  {
    id: 'first_unclutter',
    title: 'Complete first Unclutter',
    description: 'Resolve your open loops',
    reward: 10,
    icon: 'Inbox',
    clarityAction: 'Clear mental clutter',
  },
  {
    id: 'first_focus',
    title: 'Complete first Focus session',
    description: 'Start a distraction-free session',
    reward: 10,
    icon: 'Target',
    clarityAction: 'Protect your attention',
  },
];

/**
 * Total UCT available from onboarding (40 UCT)
 */
export const TOTAL_ONBOARDING_UCT = ONBOARDING_MISSIONS.reduce(
  (sum, m) => sum + m.reward, 
  0
);

/**
 * Pro unlock threshold
 */
export const PRO_UNLOCK_UCT = 40;

/**
 * Earn-first messaging
 */
export const EARN_FIRST_MESSAGE = "Earn your first 40 UCT to unlock Pro.";
export const EARN_COMPLETE_MESSAGE = "You've unlocked Pro through clarity.";
