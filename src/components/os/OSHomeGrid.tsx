import { useNavigate } from 'react-router-dom';
import {
  Sun,
  Mic,
  CircleDot,
  Focus,
  MessageSquare,
  Newspaper,
  Heart,
  TrendingUp,
  Coins,
  Sliders,
  Network,
  BarChart3,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type HighlightedTile = 'OPEN_LOOPS' | 'COMMUNICATIONS' | 'FOCUS' | null;
export type FocusLockMode = 'CLOSE_LOOPS' | 'URGENT_REPLIES' | null;

interface OSTile {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  highlightKey?: HighlightedTile;
}

interface OSHomeGridProps {
  highlightedTile?: HighlightedTile;
  focusLockMode?: FocusLockMode;
}

// Tiles that remain enabled during focus lock modes
const FOCUS_LOCK_ENABLED_TILES = ['clear-open-loops', 'communications'];

const tiles: OSTile[] = [
  {
    id: 'morning-brief',
    title: 'Morning Brief',
    description: 'Start your day with clarity',
    icon: Sun,
    href: '/morning-brief',
  },
  {
    id: 'voice-command',
    title: 'Voice Command',
    description: 'Speak to control your OS',
    icon: Mic,
    href: '/voice',
  },
  {
    id: 'clear-open-loops',
    title: 'Clear Open Loops',
    description: "Close what's unfinished",
    icon: CircleDot,
    href: '/open-loops',
    highlightKey: 'OPEN_LOOPS',
  },
  {
    id: 'deep-focus',
    title: 'Deep Focus',
    description: 'Enter distraction-free mode',
    icon: Focus,
    href: '/focus',
    highlightKey: 'FOCUS',
  },
  {
    id: 'communications',
    title: 'Communications',
    description: 'Manage messages & replies',
    icon: MessageSquare,
    href: '/communication',
    highlightKey: 'COMMUNICATIONS',
  },
  {
    id: 'intelligence-feed',
    title: 'Intelligence Feed',
    description: 'Curated insights & news',
    icon: Newspaper,
    href: '/intelligence-feed',
  },
  {
    id: 'energy-systems',
    title: 'Energy Systems',
    description: 'Track health & energy',
    icon: Heart,
    href: '/health',
  },
  {
    id: 'strategy-wealth',
    title: 'Strategy & Wealth',
    description: 'Career & financial planning',
    icon: TrendingUp,
    href: '/strategy-wealth',
  },
  {
    id: 'token-economy',
    title: 'Token Economy',
    description: 'Manage your UCT balance',
    icon: Coins,
    href: '/tokens',
  },
  {
    id: 'ai-control',
    title: 'AI Control',
    description: 'Customize assistant behavior',
    icon: Sliders,
    href: '/customize-ai',
  },
  {
    id: 'network',
    title: 'Network',
    description: 'Blockchain & agent network',
    icon: Network,
    href: '/crypto',
  },
  {
    id: 'performance-report',
    title: 'Performance Report',
    description: 'Review your progress',
    icon: BarChart3,
    href: '/performance-report',
  },
];

export const OSHomeGrid = ({ highlightedTile = null, focusLockMode = null }: OSHomeGridProps) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        const isHighlighted = highlightedTile && tile.highlightKey === highlightedTile;
        const isDisabled = focusLockMode && !FOCUS_LOCK_ENABLED_TILES.includes(tile.id);
        
        return (
          <button
            key={tile.id}
            onClick={() => !isDisabled && navigate(tile.href)}
            className={`group relative flex flex-col items-start p-4 sm:p-5 rounded-xl 
                       backdrop-blur-md border
                       active:scale-[0.98] transition-all duration-200 ease-out
                       text-left focus:outline-none focus:ring-2 focus:ring-primary/30
                       ${isDisabled 
                         ? 'opacity-40 cursor-default' 
                         : 'hover:scale-[1.02]'
                       }
                       ${isHighlighted 
                         ? 'bg-primary/15 border-primary/40 shadow-[0_0_20px_rgba(147,51,234,0.2)]' 
                         : 'bg-card/40 border-border/30 hover:bg-card/60 hover:border-border/50'
                       }`}
          >
            {isHighlighted && (
              <Badge 
                variant="secondary" 
                className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary border-primary/30"
              >
                Recommended
              </Badge>
            )}
            <div className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 
                            rounded-lg mb-3 transition-colors
                            ${isHighlighted 
                              ? 'bg-primary/20 text-primary' 
                              : 'bg-primary/10 text-primary group-hover:bg-primary/15'
                            }`}>
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-sm sm:text-base font-medium text-foreground mb-1">
              {tile.title}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
              {tile.description}
            </p>
          </button>
        );
      })}
    </div>
  );
};

export default OSHomeGrid;
