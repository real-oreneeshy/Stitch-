import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { ALL_CATEGORIES } from '../../services/seedCatalog';
import { usePreferences } from '../../hooks/usePreferences';

const CATEGORY_EMOJIS: Record<string, string> = {
  Technology: '💻',
  Business: '💼',
  Science: '🔬',
  Health: '🧠',
  'True Crime': '🔍',
  Comedy: '😂',
  News: '📰',
  Society: '🌍',
  Education: '📚',
  Sports: '⚽',
  Arts: '🎨',
  History: '🏛️',
};

interface CategorySelectorProps {
  onComplete: () => void;
}

export function CategorySelector({ onComplete }: CategorySelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const prefs = usePreferences();

  const toggle = (cat: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleContinue = () => {
    if (selected.size === 0) return;
    prefs.completeOnboarding(Array.from(selected));
    onComplete();
  };

  return (
    <div className="min-h-full bg-black flex flex-col px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1"
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">stitch</h1>
          <p className="text-white/50 text-sm mt-1">Podcast discovery, reimagined</p>
        </div>

        <h2 className="text-white text-2xl font-bold mb-2">What are you into?</h2>
        <p className="text-white/60 text-sm mb-8">
          Pick at least 3 topics to personalise your feed.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {ALL_CATEGORIES.map(cat => {
            const isSelected = selected.has(cat);
            return (
              <motion.button
                key={cat}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggle(cat)}
                className={`relative flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                  isSelected
                    ? 'bg-white/20 border-white/60 text-white'
                    : 'bg-white/5 border-white/10 text-white/70'
                }`}
              >
                <span className="text-2xl">{CATEGORY_EMOJIS[cat] ?? '🎙️'}</span>
                <span className="font-medium text-sm">{cat}</span>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                    <Check size={12} className="text-black" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="pt-8"
      >
        <button
          onClick={handleContinue}
          disabled={selected.size === 0}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
            selected.size > 0
              ? 'bg-white text-black hover:bg-white/90'
              : 'bg-white/20 text-white/40 cursor-not-allowed'
          }`}
        >
          {selected.size > 0
            ? `Start listening  →`
            : 'Pick at least one topic'}
        </button>
      </motion.div>
    </div>
  );
}
