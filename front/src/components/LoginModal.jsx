import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  User,
  AtSign,
  Eye,
  EyeOff,
  Fingerprint,
  Info,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginModal = ({ isSignUp, setIsSignUp, setShowLogin, onAuthSuccess }) => {
  const { login, register, forgotPassword } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [loginId, setLoginId] = useState(''); // email OU username pour la connexion
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [strength, setStrength] = useState({ score: 0, label: '', color: '', text: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState('');

  // Reset des erreurs quand on bascule connexion/inscription
  useEffect(() => {
    setError('');
  }, [isSignUp]);

  const submitForgot = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await forgotPassword(forgotEmail);
      setForgotSent(res?.message || 'Si un compte existe, un email vient d\'être envoyé.');
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  const checkStrength = (pass) => {
    setPassword(pass);
    if (!pass) return setStrength({ score: 0, label: '', color: '', text: '' });

    let score = 0;
    if (pass.length > 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    const levels = [
      { label: "Très faible", color: "bg-red-500", text: "text-red-500" },
      { label: "Faible", color: "bg-orange-500", text: "text-orange-500" },
      { label: "Moyen", color: "bg-yellow-500", text: "text-yellow-500" },
      { label: "Fort", color: "bg-red-500", text: "text-red-400" },
      { label: "Sécurisé", color: "bg-green-500", text: "text-green-500" }
    ];

    const currentLevel = levels[Math.min(score, 4)];
    setStrength({ score: score + 1, ...currentLevel });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      let u;
      if (isSignUp) {
        u = await register({
          username,
          first_name: prenom,
          last_name: nom,
          email,
          password,
          password_confirmation: passwordConfirm,
        });
      } else {
        u = await login(loginId, password);
      }
      onAuthSuccess(u);
    } catch (err) {
      // Erreurs de validation Laravel : on prend le premier message
      if (err.errors) {
        const first = Object.values(err.errors)[0];
        setError(Array.isArray(first) ? first[0] : String(first));
      } else {
        setError(err.message || 'Une erreur est survenue.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity duration-500"
        onClick={() => setShowLogin(false)}
      ></div>

      <div className="grain relative bg-zinc-900 border-2 border-zinc-800 w-full max-w-lg rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="h-1.5 bg-[repeating-linear-gradient(45deg,#facc15,#facc15_10px,#000_10px,#000_20px)] w-full"></div>

        {forgotMode ? (
          <form onSubmit={submitForgot} className="relative z-10 p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 inline-block mb-4">
                <Fingerprint className="text-red-400 w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Mot de passe oublié</h2>
              <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest mt-1">
                On vous envoie un lien de réinitialisation
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded p-3">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-[11px] font-bold text-red-400">{error}</p>
              </div>
            )}

            {forgotSent ? (
              <div className="text-center space-y-5">
                <div className="bg-green-500/10 border border-green-500/30 rounded p-3 text-left">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-green-400 shrink-0" />
                    <p className="text-[12px] font-bold text-green-400">{forgotSent}</p>
                  </div>
                  <p className="text-[11px] text-green-300/70 mt-1.5 ml-6">Pensez à vérifier vos spams.</p>
                </div>
                <button type="button" onClick={() => { setForgotMode(false); setForgotSent(''); }} className="text-red-400 font-black text-xs uppercase tracking-widest hover:underline">
                  Retour à la connexion
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-red-400 transition-colors" />
                    <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="adresse@email.com" required className="w-full bg-zinc-950 border border-zinc-800 rounded py-3 pl-11 pr-4 focus:border-red-400 focus:outline-none transition-all font-bold text-sm text-white" />
                  </div>
                </div>
                <button type="submit" disabled={submitting} className="w-full bg-white text-black font-black py-4 rounded-sm hover:bg-red-400 transition-all uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-2 disabled:opacity-60">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Envoyer le lien
                </button>
                <p className="text-center text-[11px] font-medium text-zinc-500">
                  <span onClick={() => { setForgotMode(false); setError(''); }} className="text-red-400 cursor-pointer hover:underline font-black uppercase">
                    Retour à la connexion
                  </span>
                </p>
              </div>
            )}
          </form>
        ) : (
        <form onSubmit={handleSubmit} className="relative z-10 p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="relative inline-block mb-4">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <Fingerprint className="text-red-400 w-8 h-8" />
              </div>
              <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full -z-10"></div>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white">
              {isSignUp ? 'Créer un compte' : 'Connexion Client'}
            </h2>
            <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest mt-1">
              Accès sécurisé à l'infrastructure HostBuster
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded p-3 animate-in fade-in duration-200">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-[11px] font-bold text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-5">
            {isSignUp && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Prénom</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-red-400 transition-colors" />
                      <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Ex: Jean" className="w-full bg-zinc-950 border border-zinc-800 rounded py-3 pl-11 pr-4 focus:border-red-400 focus:outline-none focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)] transition-all font-bold text-sm text-white" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Nom</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-red-400 transition-colors" />
                      <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Dupont" className="w-full bg-zinc-950 border border-zinc-800 rounded py-3 pl-11 pr-4 focus:border-red-400 focus:outline-none focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)] transition-all font-bold text-sm text-white" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Nom d'utilisateur</label>
                  <div className="relative group">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-red-400 transition-colors" />
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ex: jdupont" autoComplete="username" className="w-full bg-zinc-950 border border-zinc-800 rounded py-3 pl-11 pr-4 focus:border-red-400 focus:outline-none focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)] transition-all font-bold text-sm text-white" />
                  </div>
                </div>
              </>
            )}

            {isSignUp ? (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-red-400 transition-colors" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="adresse@email.com" className="w-full bg-zinc-950 border border-zinc-800 rounded py-3 pl-11 pr-4 focus:border-red-400 focus:outline-none focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)] transition-all font-bold text-sm text-white" />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Email ou nom d'utilisateur</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-red-400 transition-colors" />
                  <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="adresse@email.com ou jdupont" autoComplete="username" className="w-full bg-zinc-950 border border-zinc-800 rounded py-3 pl-11 pr-4 focus:border-red-400 focus:outline-none focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)] transition-all font-bold text-sm text-white" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex justify-between items-end px-1">
                <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500">Mot de passe</label>
                {!isSignUp && (
                  <button type="button" onClick={() => { setForgotMode(true); setError(''); setForgotSent(''); setForgotEmail(loginId.includes('@') ? loginId : ''); }} className="text-[10px] font-bold text-zinc-600 hover:text-red-400 transition-colors">
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-red-400 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => checkStrength(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded py-3 pl-11 pr-12 focus:border-red-400 focus:outline-none focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)] transition-all font-bold text-sm text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-red-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {password && isSignUp && (
                <div className="pt-2 animate-in slide-in-from-top-1 duration-300">
                  <div className="flex gap-1 h-1 mb-1.5">
                    {[1, 2, 3, 4, 5].map((step) => (
                      <div
                        key={step}
                        className={`flex-1 rounded-full transition-all duration-500 ${step <= strength.score ? strength.color : 'bg-zinc-800'}`}
                      ></div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Info className={`w-3 h-3 ${strength.text}`} />
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${strength.text}`}>
                      Sécurité : {strength.label}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Confirmer le mot de passe</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-red-400 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded py-3 pl-11 pr-4 focus:border-red-400 focus:outline-none focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)] transition-all font-bold text-sm text-white"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="group relative w-full bg-white text-black font-black py-4 rounded-sm hover:bg-red-400 active:scale-[0.99] transition-all mt-4 uppercase tracking-[0.2em] text-[11px] overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="relative z-10 flex items-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSignUp ? "Créer mon compte" : "Se connecter"}
              </span>
              <div className="absolute inset-0 bg-red-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>

            <p className="text-center text-[11px] font-medium text-zinc-500 mt-6">
              {isSignUp ? 'Déjà un compte ?' : "Pas encore de compte ?"} <span onClick={() => setIsSignUp(!isSignUp)} className="text-red-400 cursor-pointer hover:underline font-black ml-1 uppercase">
                {isSignUp ? 'Se connecter' : "S'inscrire"}
              </span>
            </p>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
