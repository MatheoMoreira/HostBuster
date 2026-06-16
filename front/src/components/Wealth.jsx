import React from 'react';
import tier0 from '../assets/credits/tier-0-coin.svg';
import tier1 from '../assets/credits/tier-1-euro.svg';
import tier2 from '../assets/credits/tier-2-purse.svg';
import tier3 from '../assets/credits/tier-3-wings.svg';
import tier4 from '../assets/credits/tier-4-bag.svg';
import tier5 from '../assets/credits/tier-5-bank.svg';

const TIER_ASSETS = [tier0, tier1, tier2, tier3, tier4, tier5];
const TIER_ALT = [
  'Pièce d\'or',
  'Billet euro',
  'Bourse',
  'Billets volants',
  'Sac d\'argent',
  'Banque',
];

/**
 * Illustration "Fluent Emoji" colorée pour un palier.
 * tier : 0 → 5
 */
const Wealth = ({ tier, className = '' }) => {
  const src = TIER_ASSETS[tier] ?? TIER_ASSETS[0];
  return (
    <img
      src={src}
      alt={TIER_ALT[tier] ?? ''}
      className={`block w-full h-full object-contain select-none pointer-events-none ${className}`}
      draggable={false}
    />
  );
};

export default Wealth;
