import React, { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

const DeleteInstanceModal = ({ instanceName, onConfirm, onClose, submitting = false }) => {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const matches = value.trim() === instanceName;

  const submit = (e) => {
    e.preventDefault();
    if (!matches || submitting) return;
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={submitting ? undefined : onClose}
      />

      <div className="relative bg-zinc-900 border-2 border-zinc-800 w-full max-w-md rounded-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="h-1.5 bg-[repeating-linear-gradient(45deg,#ef4444,#ef4444_10px,#000_10px,#000_20px)]" />

        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors p-1 disabled:opacity-40"
        >
          <X className="w-4 h-4" />
        </button>

        <form onSubmit={submit} className="p-8">
          <div className="flex items-center justify-center w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-full mx-auto mb-5">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>

          <h2 className="font-display text-2xl font-black uppercase tracking-tight text-white text-center mb-2">
            Supprimer l'instance ?
          </h2>
          <p className="text-center text-sm text-zinc-400 mb-6">
            Cette action est <span className="font-bold text-red-400">définitive</span>.
            Toutes les données seront perdues.
          </p>

          <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-4 mb-5">
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">
              Tapez le nom de l'instance pour confirmer
            </p>
            <p className="font-mono text-sm text-white mb-3 break-all">{instanceName}</p>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder={instanceName}
              disabled={submitting}
              className="w-full bg-zinc-900 border border-zinc-800 rounded py-2.5 px-3 font-mono text-sm focus:border-red-500 focus:outline-none focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)] transition-all disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={!matches || submitting}
            className="w-full bg-red-600 text-white font-black py-4 rounded-sm hover:bg-red-500 active:scale-[0.99] transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:hover:bg-zinc-800 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            {submitting ? 'Suppression…' : 'Supprimer définitivement'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-full mt-2 py-3 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors disabled:opacity-40"
          >
            Annuler
          </button>
        </form>
      </div>
    </div>
  );
};

export default DeleteInstanceModal;
