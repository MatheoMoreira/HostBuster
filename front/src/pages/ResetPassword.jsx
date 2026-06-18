import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, Check, AlertTriangle, Loader2, Fingerprint } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const token = params.get('token') || '';
  const email = params.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [state, setState] = useState('idle'); // idle | submitting | done
  const [error, setError] = useState('');

  const invalidLink = !token || !email;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setState('submitting');
    try {
      await resetPassword({
        email,
        token,
        password,
        password_confirmation: confirm,
      });
      setState('done');
      setTimeout(() => navigate('/'), 2500);
    } catch (err) {
      setState('idle');
      setError(err.errors ? Object.values(err.errors)[0][0] : (err.message || 'Erreur.'));
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-zinc-900 border-2 border-zinc-800 rounded-xl overflow-hidden">
        <div className="h-1.5 bg-[repeating-linear-gradient(45deg,#dc2626,#dc2626_10px,#000_10px,#000_20px)]" />
        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-block bg-zinc-950 p-4 rounded-xl border border-zinc-800 mb-4">
              <Fingerprint className="text-red-400 w-8 h-8" />
            </div>
            <h1 className="font-display text-3xl font-black uppercase tracking-tighter text-white">Nouveau mot de passe</h1>
            {email && <p className="text-zinc-500 text-sm mt-1">{email}</p>}
          </div>

          {invalidLink ? (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded p-3 text-sm font-bold mb-6">
                <AlertTriangle className="w-4 h-4" /> Lien invalide ou incomplet.
              </div>
              <Link to="/" className="text-red-400 font-black text-xs uppercase tracking-widest hover:underline">Retour à l'accueil</Link>
            </div>
          ) : state === 'done' ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/10 border-2 border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-white font-bold mb-1">Mot de passe réinitialisé !</p>
              <p className="text-zinc-500 text-sm">Redirection vers l'accueil…</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded p-3">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] font-bold text-red-400">{error}</p>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Nouveau mot de passe</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-red-400" />
                  <input
                    type={show ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded py-3 pl-11 pr-12 focus:border-red-400 focus:outline-none transition-all font-bold text-sm text-white"
                  />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-red-400">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Confirmer</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-red-400" />
                  <input
                    type={show ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded py-3 pl-11 pr-4 focus:border-red-400 focus:outline-none transition-all font-bold text-sm text-white"
                  />
                </div>
              </div>
              <p className="text-[10px] text-zinc-600">Minimum 8 caractères, avec lettres et chiffres.</p>
              <button
                type="submit"
                disabled={state === 'submitting'}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-sm uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {state === 'submitting' && <Loader2 className="w-4 h-4 animate-spin" />}
                Réinitialiser
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
