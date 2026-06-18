import React, { useState } from 'react';
import { MailWarning, Loader2, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Bandeau affiché tant que l'email de l'utilisateur connecté n'est pas vérifié.
const VerifyEmailBanner = () => {
  const { isLoggedIn, user, resendVerification } = useAuth();
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [msg, setMsg] = useState('');

  if (!isLoggedIn || !user || user.email_verified_at) return null;

  const resend = async () => {
    setState('sending');
    setMsg('');
    try {
      const res = await resendVerification();
      setState('sent');
      setMsg(res?.message || 'Email de vérification renvoyé.');
    } catch (e) {
      setState('error');
      setMsg(e.message || 'Échec de l\'envoi.');
    }
  };

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <MailWarning className="w-5 h-5 text-amber-400 shrink-0" />
        <p className="text-sm text-amber-200 font-medium flex-1 min-w-[200px]">
          Vérifiez votre adresse <span className="font-bold">{user.email}</span> pour débloquer le déploiement et le rechargement.
          <span className="block text-[11px] text-amber-300/70 mt-0.5">Pensez à vérifier vos spams.</span>
        </p>
        {state === 'sent' ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-400">
            <Check className="w-4 h-4" /> {msg}
          </span>
        ) : (
          <button
            onClick={resend}
            disabled={state === 'sending'}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-sm font-black text-[11px] uppercase tracking-widest transition-colors disabled:opacity-50 shrink-0"
          >
            {state === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Renvoyer l'email
          </button>
        )}
        {state === 'error' && <span className="text-xs font-bold text-red-400 w-full">{msg}</span>}
      </div>
    </div>
  );
};

export default VerifyEmailBanner;
