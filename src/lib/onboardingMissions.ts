/**
 * Onboarding Missions - UCT reward system
 * 
 * Four explicit missions with +10 UCT each:
 * 1. Complete Assistant Setup
 * 2. Connect Messaging (Gmail)
 * 3. Complete First Unclutter Session
 * 4. Start First Focus Session
 */

export type MissionId = 
  | 'assistant_setup'
  | 'connect_gmail'
  | 'first_unclutter'
  | 'first_focus';

export interface Mission {
  id: MissionId;
  title: string;
  description: string;
  reward: number;
  icon: string;
}

/**
 * The four onboarding missions - locked list
 */
export const ONBOARDING_MISSIONS: Mission[] = [
  {
    id: 'assistant_setup',
    title: 'Complete Assistant Setup',
    description: 'Configure your assistant preferences',
    reward: 10,
    icon: 'Bot',
  },
  {
    id: 'connect_gmail',
    title: 'Connect Messaging',
    description: 'Link your Gmail account',
    reward: 10,
    icon: 'Mail',
  },
  {
    id: 'first_unclutter',
    title: 'First Unclutter Session',
    description: 'Complete one unclutter session',
    reward: 10,
    icon: 'Inbox',
  },
  {
    id: 'first_focus',
    title: 'First Focus Session',
    description: 'Start your first focus session',
    reward: 10,
    icon: 'Focus',
  },
];

/**
 * Total UCT available from onboarding
 */
export const TOTAL_ONBOARDING_UCT = ONBOARDING_MISSIONS.reduce(
  (sum, m) => sum + m.reward, 
  0
);
