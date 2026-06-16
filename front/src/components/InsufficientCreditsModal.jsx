import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, X, ArrowRight, AlertTriangle } from 'lucide-react';

const InsufficientCreditsModal = ({ need, have, pendingOrder, onClose }) => {
  const navigate = useNavigate();
  const missing = need - have;

  const recharge = () => {
    onClose();
    navigate('/credits', {
      state: pendingOrder
        ? { need: missing, returnTo: '/setup', returnState: pendingOrder }
        : { need: missing },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-zinc-900 border-2 border-zinc-800 w-full max-w-md rounded-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="h-1.5 bg-[repeating-linear-gradient(45deg,#facc15,#facc15_10px,#000_10px,#000_20px)]" />

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8">
          <div className="flex items-center justify-center w-14 h-14 bg-yellow-500/10 border border-yellow-500/30 rounded-full mx-auto mb-5">
            <AlertTriangle className="w-7 h-7 text-yellow-400" />
          </div>

          <h2 className="font-display text-2xl font-black uppercase tracking-tight text-white text-center mb-2">
            Crédits insuffisants
          </h2>
          <p className="text-center text-sm text-zinc-400 mb-6">
            Cette offre coûte <span className="font-bold text-white">{need} crédits</span>.
            Vous n'en avez que <span className="font-bold text-yellow-400">{have}</span>.
          </p>

          <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-4 mb-6 flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500">Manque</span>
            <span className="font-display text-2xl font-black text-yellow-400">{missing} crédits</span>
          </div>

          <button
            onClick={recharge}
            className="group w-full bg-yellow-500 text-black font-black py-4 rounded-sm hover:bg-yellow-400 active:scale-[0.99] transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2"
          >
            <Coins className="w-4 h-4" /> Recharger mes crédits <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={onClose}
            className="w-full mt-2 py-3 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsufficientCreditsModal;
