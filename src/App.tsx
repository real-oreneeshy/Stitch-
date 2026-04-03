import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CategorySelector } from './components/Onboarding/CategorySelector';
import { SwipeableFeed } from './components/Feed/SwipeableFeed';
import { DiscoverScreen } from './components/Discover/DiscoverScreen';
import { LikesScreen } from './components/Discover/LikesScreen';
import { BottomNav, type Screen } from './components/UI/BottomNav';
import { usePreferenceStore } from './store/preferenceStore';

export default function App() {
  const [screen, setScreen] = useState<Screen>('feed');
  const onboardingComplete = usePreferenceStore(s => s.onboardingComplete);

  if (!onboardingComplete) {
    return (
      <div className="w-full h-full overflow-y-auto bg-black">
        <CategorySelector onComplete={() => {}} />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden">
      <AnimatePresence mode="wait">
        {screen === 'feed' && (
          <motion.div
            key="feed"
            className="absolute inset-0 pb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <SwipeableFeed />
          </motion.div>
        )}
        {screen === 'discover' && (
          <motion.div
            key="discover"
            className="absolute inset-0 pb-16"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <DiscoverScreen />
          </motion.div>
        )}
        {screen === 'likes' && (
          <motion.div
            key="likes"
            className="absolute inset-0 pb-16"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <LikesScreen />
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav active={screen} onChange={setScreen} />
    </div>
  );
}
