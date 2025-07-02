
import { useState, useEffect } from 'react';
import { toast } from "@/hooks/use-toast";

interface FocusSession {
  id: string;
  startTime: Date;
  endTime: Date;
  plannedDuration: number; // in minutes
  actualDuration: number;
  interruptions: number;
  score: number;
}

interface Message {
  id: number;
  from: string;
  subject: string;
  preview: string;
  platform: 'email' | 'social' | 'messaging' | 'voicemail';
  time: string;
  timestamp: Date;
  priority: 'high' | 'quick' | 'batch' | 'spam';
  requiresAction: boolean;
  suggestedResponse?: string;
  platformIcon: string;
}

interface FocusRecoveryData {
  focusScore: number;
  totalMissed: number;
  breakdown: {
    high: number;
    quick: number;
    batch: number;
    spam: number;
  };
  platformBreakdown: Record<string, number>;
  actionPlan: {
    immediate: string[];
    quickReplies: string[];
    batchLater: string[];
  };
  highPriorityPreview: Message[];
}

export const useFocusRecovery = () => {
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [missedMessages, setMissedMessages] = useState<Message[]>([]);
  const [isNotificationsMuted, setIsNotificationsMuted] = useState(false);

  // Calculate dynamic focus score based on adherence and interruptions
  const calculateFocusScore = (
    plannedMinutes: number,
    actualMinutes: number,
    interruptions: number
  ): number => {
    const adherenceScore = Math.min((actualMinutes / plannedMinutes) * 100, 100);
    const interruptionPenalty = interruptions * 5; // 5% penalty per interruption
    const finalScore = Math.max(adherenceScore - interruptionPenalty, 0);
    return Math.round(finalScore);
  };

  // Advanced message classification
  const classifyMessage = (message: Message): 'high' | 'quick' | 'batch' | 'spam' => {
    const subject = message.subject.toLowerCase();
    const preview = message.preview.toLowerCase();
    const from = message.from.toLowerCase();

    // High Priority keywords
    const highPriorityKeywords = [
      'urgent', 'asap', 'emergency', 'deadline', 'important',
      'meeting', 'interview', 'approval', 'confirm', 'action required'
    ];

    // Spam/Unnecessary keywords
    const spamKeywords = [
      'congratulations', 'winner', 'prize', 'free', 'offer',
      'discount', 'sale', 'promotion', 'unsubscribe', 'viagra'
    ];

    // Quick reply keywords
    const quickReplyKeywords = [
      'thanks', 'received', 'acknowledge', 'yes', 'no',
      'lunch', 'coffee', 'quick question', 'fyi'
    ];

    // Check for spam first
    if (spamKeywords.some(keyword => subject.includes(keyword) || preview.includes(keyword))) {
      return 'spam';
    }

    // Check for high priority
    if (highPriorityKeywords.some(keyword => subject.includes(keyword) || preview.includes(keyword))) {
      return 'high';
    }

    // Check for quick replies
    if (quickReplyKeywords.some(keyword => subject.includes(keyword) || preview.includes(keyword))) {
      return 'quick';
    }

    // Check platform-specific rules
    if (message.platform === 'email' && from.includes('boss') || from.includes('client')) {
      return 'high';
    }

    if (message.platform === 'social' && preview.length < 50) {
      return 'quick';
    }

    // Default to batch
    return 'batch';
  };

  // Generate comprehensive recovery data
  const generateRecoveryData = (messages: Message[], focusScore: number): FocusRecoveryData => {
    const classifiedMessages = messages.map(msg => ({
      ...msg,
      priority: classifyMessage(msg)
    }));

    const breakdown = {
      high: classifiedMessages.filter(m => m.priority === 'high').length,
      quick: classifiedMessages.filter(m => m.priority === 'quick').length,
      batch: classifiedMessages.filter(m => m.priority === 'batch').length,
      spam: classifiedMessages.filter(m => m.priority === 'spam').length,
    };

    const platformBreakdown = classifiedMessages.reduce((acc, msg) => {
      acc[msg.platform] = (acc[msg.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const highPriorityMessages = classifiedMessages
      .filter(m => m.priority === 'high')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 3);

    const quickMessages = classifiedMessages.filter(m => m.priority === 'quick');
    const batchMessages = classifiedMessages.filter(m => m.priority === 'batch');

    const actionPlan = {
      immediate: highPriorityMessages.map(m => `${m.from}: ${m.subject}`),
      quickReplies: quickMessages.slice(0, 4).map(m => `${m.from}: ${m.subject}`),
      batchLater: batchMessages.slice(0, 3).map(m => `${m.platform}: ${m.subject}`)
    };

    return {
      focusScore,
      totalMissed: messages.length,
      breakdown,
      platformBreakdown,
      actionPlan,
      highPriorityPreview: highPriorityMessages
    };
  };

  // Mock comprehensive message data
  const generateMockMessages = (): Message[] => {
    return [
      {
        id: 1,
        from: "Sarah Johnson (Boss)",
        subject: "Urgent: Project deadline moved up",
        preview: "Hi, we need to discuss the project timeline. The client wants delivery by Friday instead of next week.",
        platform: 'email',
        time: "2 min ago",
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        priority: 'high',
        requiresAction: true,
        suggestedResponse: "Acknowledge and request meeting to discuss timeline",
        platformIcon: "Mail"
      },
      {
        id: 2,
        from: "LinkedIn Recruiter",
        subject: "Quick question about your availability",
        preview: "Hi! I have a great opportunity that matches your skills. Are you open to a 15-min chat?",
        platform: 'social',
        time: "5 min ago",
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        priority: 'quick',
        requiresAction: true,
        platformIcon: "User"
      },
      {
        id: 3,
        from: "Jessica Martinez",
        subject: "Lunch tomorrow?",
        preview: "Hey! Want to grab lunch tomorrow at 12:30? The new Italian place downtown?",
        platform: 'messaging',
        time: "8 min ago",
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
        priority: 'quick',
        requiresAction: true,
        platformIcon: "MessageSquare"
      },
      {
        id: 4,
        from: "Client Portal",
        subject: "Invoice #1234 requires approval",
        preview: "Invoice #1234 for $2,500 is pending your approval. Please review and approve by EOD.",
        platform: 'email',
        time: "12 min ago",
        timestamp: new Date(Date.now() - 12 * 60 * 1000),
        priority: 'high',
        requiresAction: true,
        platformIcon: "Mail"
      },
      {
        id: 5,
        from: "Figma Weekly",
        subject: "New design trends for 2024",
        preview: "Discover the latest design trends and tools that are shaping the industry this year.",
        platform: 'email',
        time: "15 min ago",
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        priority: 'batch',
        requiresAction: false,
        platformIcon: "Mail"
      },
      {
        id: 6,
        from: "Instagram",
        subject: "3 new messages",
        preview: "You have new direct messages from @designstudio, @clientwork, and @teamlead",
        platform: 'social',
        time: "18 min ago",
        timestamp: new Date(Date.now() - 18 * 60 * 1000),
        priority: 'batch',
        requiresAction: false,
        platformIcon: "Instagram"
      },
      {
        id: 7,
        from: "Special Offers",
        subject: "🎉 50% OFF Everything - Limited Time!",
        preview: "Congratulations! You've been selected for our exclusive 50% discount. Click now before it expires!",
        platform: 'email',
        time: "20 min ago",
        timestamp: new Date(Date.now() - 20 * 60 * 1000),
        priority: 'spam',
        requiresAction: false,
        platformIcon: "Mail"
      },
      {
        id: 8,
        from: "Mom",
        subject: "Dinner this Sunday?",
        preview: "Hi honey, are you free for family dinner this Sunday at 6 PM? Let me know!",
        platform: 'messaging',
        time: "25 min ago",
        timestamp: new Date(Date.now() - 25 * 60 * 1000),
        priority: 'quick',
        requiresAction: true,
        platformIcon: "MessageSquare"
      },
      {
        id: 9,
        from: "Team Lead",
        subject: "Meeting notes from today",
        preview: "Here are the action items from our team meeting. Please review and add any missing points.",
        platform: 'email',
        time: "30 min ago",
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        priority: 'batch',
        requiresAction: false,
        platformIcon: "Mail"
      },
      {
        id: 10,
        from: "Dr. Smith's Office",
        subject: "Appointment confirmation needed",
        preview: "Please confirm your appointment for next Tuesday at 2 PM. Reply YES to confirm or call to reschedule.",
        platform: 'messaging',
        time: "35 min ago",
        timestamp: new Date(Date.now() - 35 * 60 * 1000),
        priority: 'high',
        requiresAction: true,
        platformIcon: "MessageSquare"
      }
    ];
  };

  const startFocusSession = (plannedMinutes: number) => {
    setIsNotificationsMuted(true);
    setMissedMessages(generateMockMessages());
    
    toast({
      title: "🎯 Focus Mode Activated",
      description: `All notifications muted for ${plannedMinutes} minutes. Stay focused!`,
    });
  };

  const endFocusSession = (
    plannedMinutes: number,
    actualMinutes: number,
    interruptions: number = 0
  ) => {
    const score = calculateFocusScore(plannedMinutes, actualMinutes, interruptions);
    
    const session: FocusSession = {
      id: Date.now().toString(),
      startTime: new Date(Date.now() - actualMinutes * 60 * 1000),
      endTime: new Date(),
      plannedDuration: plannedMinutes,
      actualDuration: actualMinutes,
      interruptions,
      score
    };

    setFocusSessions(prev => [...prev, session]);
    setIsNotificationsMuted(false);

    return generateRecoveryData(missedMessages, score);
  };

  return {
    focusSessions,
    missedMessages,
    isNotificationsMuted,
    startFocusSession,
    endFocusSession,
    calculateFocusScore,
    generateRecoveryData
  };
};
