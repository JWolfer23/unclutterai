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

// Sort tiles to show highlighted tile first on mobile
const getSortedTiles = (tiles: OSTile[], highlightedTile: HighlightedTile): OSTile[] => {
  if (!highlightedTile) return tiles;
  
  return [...tiles].sort((a, b) => {
    const aHighlighted = a.highlightKey === highlightedTile;
    const bHighlighted = b.highlightKey === highlightedTile;
    if (aHighlighted && !bHighlighted) return -1;
    if (!aHighlighted && bHighlighted) return 1;
    return 0;
  });
};

export const OSHomeGrid = ({ highlightedTile = null, focusLockMode = null }: OSHomeGridProps) => {
  const navigate = useNavigate();
  const sortedTiles = getSortedTiles(tiles, highlightedTile);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
      {sortedTiles.map((tile) => {
        const Icon = tile.icon;
        const isHighlighted = highlightedTile && tile.highlightKey === highlightedTile;
        const isDisabled = focusLockMode && !FOCUS_LOCK_ENABLED_TILES.includes(tile.id);
        
        return (
          <button
            key={tile.id}
            onClick={() => !isDisabled && navigate(tile.href)}
            className={`group relative flex flex-col items-start 
                       p-4 sm:p-5 
                       min-h-[120px] sm:min-h-[140px]
                       rounded-xl backdrop-blur-md border
                       active:scale-[0.97] transition-all duration-200 ease-out
                       text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
                       touch-manipulation
                       ${isDisabled 
                         ? 'opacity-40 cursor-default' 
                         : 'sm:hover:scale-[1.02]'
                       }
                       ${isHighlighted 
                         ? 'bg-primary/15 border-primary/40 shadow-[0_0_20px_rgba(147,51,234,0.2)]' 
                         : 'bg-card/40 border-border/30 sm:hover:bg-card/60 sm:hover:border-border/50'
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
                              : 'bg-primary/10 text-primary'
                            }`}>
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-sm sm:text-base font-medium text-foreground mb-1">
              {tile.title}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-snug line-clamp-2">
              {tile.description}
            </p>
          </button>
        );
      })}
    </div>
  );
};

export default OSHomeGrid;
