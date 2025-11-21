
import { 
  Phone, 
  MessageSquare, 
  Mail, 
  Facebook, 
  Instagram, 
  Youtube, 
  Linkedin,
  MessageCircle,
  Send,
  Camera,
  Apple,
  Briefcase,
  Music,
  Video,
  Globe
} from "lucide-react";

export interface Platform {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: 'phone' | 'messaging' | 'email' | 'social';
  description?: string;
  color: string;
}

export const platformsByCategory = {
  phone: [
    {
      id: 'sms',
      name: 'SMS & Phone logs',
      icon: <Phone className="w-5 h-5" />,
      category: 'phone' as const,
      description: 'Voice messages & missed calls',
      color: 'bg-green-500'
    }
  ],
  messaging: [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: <MessageCircle className="w-5 h-5" />,
      category: 'messaging' as const,
      color: 'bg-green-500'
    },
    {
      id: 'wechat',
      name: 'WeChat / Weixin',
      icon: <MessageSquare className="w-5 h-5" />,
      category: 'messaging' as const,
      color: 'bg-green-600'
    },
    {
      id: 'messenger',
      name: 'Facebook Messenger',
      icon: <Facebook className="w-5 h-5" />,
      category: 'messaging' as const,
      color: 'bg-blue-600'
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: <Send className="w-5 h-5" />,
      category: 'messaging' as const,
      color: 'bg-blue-500'
    },
    {
      id: 'snapchat',
      name: 'Snapchat',
      icon: <Camera className="w-5 h-5" />,
      category: 'messaging' as const,
      color: 'bg-yellow-400'
    },
    {
      id: 'imessage',
      name: 'iMessage',
      icon: <MessageSquare className="w-5 h-5" />,
      category: 'messaging' as const,
      color: 'bg-blue-500'
    }
  ],
  email: [
    {
      id: 'gmail',
      name: 'Gmail',
      icon: <Mail className="w-5 h-5" />,
      category: 'email' as const,
      color: 'bg-red-500'
    },
    {
      id: 'apple-mail',
      name: 'Apple Mail',
      icon: <Apple className="w-5 h-5" />,
      category: 'email' as const,
      color: 'bg-gray-600'
    },
    {
      id: 'outlook',
      name: 'Microsoft Outlook',
      icon: <Mail className="w-5 h-5" />,
      category: 'email' as const,
      color: 'bg-blue-600'
    }
  ],
  social: [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <Facebook className="w-5 h-5" />,
      category: 'social' as const,
      color: 'bg-blue-600'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: <Instagram className="w-5 h-5" />,
      category: 'social' as const,
      color: 'bg-pink-500'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: <Music className="w-5 h-5" />,
      category: 'social' as const,
      color: 'bg-black'
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: <Youtube className="w-5 h-5" />,
      category: 'social' as const,
      color: 'bg-red-600'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: <Linkedin className="w-5 h-5" />,
      category: 'social' as const,
      color: 'bg-blue-700'
    }
  ]
};

export const stepConfig = [
  {
    step: 1,
    title: "Connect Your Phone",
    subtitle: "Allow access to your device for:",
    description: "We'll summarise these and pull important ones into your dashboard.",
    category: 'phone' as const,
    platforms: platformsByCategory.phone
  },
  {
    step: 2,
    title: "Link Your Messaging Apps",
    subtitle: "Choose the ones you use — we'll handle the rest.",
    description: "We'll combine all incoming messages into one clean feed. You reply from here — no app-hopping.",
    category: 'messaging' as const,
    platforms: platformsByCategory.messaging
  },
  {
    step: 3,
    title: "Connect Your Email Accounts",
    subtitle: "Add your email accounts",
    description: "We'll summarise unread emails, highlight what matters, and let you clear your inbox in one tap.",
    category: 'email' as const,
    platforms: platformsByCategory.email
  }
];
