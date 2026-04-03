import { Home, Compass, Heart } from 'lucide-react';

export type Screen = 'feed' | 'discover' | 'likes';

interface BottomNavProps {
  active: Screen;
  onChange: (screen: Screen) => void;
}

const tabs: { id: Screen; label: string; Icon: typeof Home }[] = [
  { id: 'feed', label: 'For You', Icon: Home },
  { id: 'discover', label: 'Discover', Icon: Compass },
  { id: 'likes', label: 'Liked', Icon: Heart },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="absolute bottom-0 left-0 right-0 z-50 flex border-t border-white/10 bg-black/80 backdrop-blur-lg">
      {tabs.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
            active === id ? 'text-white' : 'text-white/40'
          }`}
        >
          <Icon
            size={22}
            className={active === id ? 'fill-white' : ''}
            strokeWidth={active === id ? 2.5 : 1.5}
          />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </nav>
  );
}
