import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface PlayerHandProps {
  cards: React.ReactNode[];
  playerName: string;
  isCurrent?: boolean;
}

const PlayerHand: React.FC<PlayerHandProps> = ({ cards, playerName, isCurrent }) => {
  return (
    <div className={`flex flex-col items-center ${isCurrent ? 'scale-105' : ''}`}>
      <div className="flex gap-2 mb-2">
        <AnimatePresence initial={false}>
          {React.Children.map(cards, (card, idx) => (
            <motion.div
              key={(card as any)?.key || idx}
              initial={{ y: -30, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              layout
            >
              {card}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <span className={`text-sm font-semibold ${isCurrent ? 'text-green-700' : 'text-gray-600'}`}>{playerName}</span>
    </div>
  );
};

export default PlayerHand;
