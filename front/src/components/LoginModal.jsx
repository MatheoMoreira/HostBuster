import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  Fingerprint,
  Info
} from 'lucide-react';

const LoginModal = ({ isSignUp, setIsSignUp, setShowLogin, handleLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState({ score: 0, label: '', color: '', text: '' });
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsScanning(false), 1500);
    return () => clearTimeout(timer);
  }, [isSignUp]);

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
      { label: "Fort", color: "bg-cyan-500", text: "text-cyan-400" },
      { label: "Sécurisé", color: "bg-green-500", text: "text-green-500" }
    ];

    const currentLevel = levels[Math.min(score, 4)];
    setStrength({ score: score + 1, ...currentLevel });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity duration-500" 
        onClick={() => setShowLogin(false)}
      ></div>
      
      <div className="relative bg-zinc-900 border-2 border-zinc-800 w-full max-w-lg rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="h-1.5 bg-[repeating-linear-gradient(45deg,#facc15,#facc15_10px,#000_10px,#000_20px)] w-full"></div>
        
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            <div className="w-full h-px bg-cyan-500 shadow-[0_0_15px_#22d3ee] absolute top-0 animate-[scan_1.5s_ease-in-out_infinite]"></div>
            <style>{`
              @keyframes scan {
                0% { top: 0%; opacity: 0; }
                50% { opacity: 1; }
                100% { top: 100%; opacity: 0; }
              }
            `}</style>
          </div>
        )}

        <div className="p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="relative inline-block mb-4">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <Fingerprint className="text-cyan-400 w-8 h-8" />
              </div>
              <div className="absolute inset-0 bg-cyan-500/10 blur-xl rounded-full -z-10"></div>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white">
              {isSignUp ? 'Créer un compte' : 'Connexion Client'}
            </h2>
            <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest mt-1">
              Accès sécurisé à l'infrastructure HostBuster
            </p>
          </div>

          <div className="space-y-5">
            {isSignUp && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Nom</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-cyan-400 transition-colors" />
                    <input type="text" placeholder="Ex: Jean" className="w-full bg-zinc-950 border border-zinc-800 rounded py-3 pl-11 pr-4 focus:border-cyan-500/50 focus:outline-none transition-all font-bold text-sm text-white" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Prénom</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-cyan-400 transition-colors" />
                    <input type="text" placeholder="Ex: Dupont" className="w-full bg-zinc-950 border border-zinc-800 rounded py-3 pl-11 pr-4 focus:border-cyan-500/50 focus:outline-none transition-all font-bold text-sm text-white" />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-cyan-400 transition-colors" />
                <input type="email" placeholder="adresse@email.com" className="w-full bg-zinc-950 border border-zinc-800 rounded py-3 pl-11 pr-4 focus:border-cyan-500/50 focus:outline-none transition-all font-bold text-sm text-white" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-end px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Mot de passe</label>
                {!isSignUp && (
                  <button className="text-[10px] font-bold text-zinc-600 hover:text-cyan-400 transition-colors">
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-cyan-400 transition-colors" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => checkStrength(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded py-3 pl-11 pr-12 focus:border-cyan-500/50 focus:outline-none transition-all font-bold text-sm text-white" 
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-cyan-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {password && (
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

            <div className="flex items-center gap-2 px-1 pt-2">
              <input type="checkbox" id="remember" className="w-3.5 h-3.5 rounded border-zinc-800 bg-zinc-950 text-cyan-500 focus:ring-0 focus:ring-offset-0" />
              <label htmlFor="remember" className="text-[11px] font-medium text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors">
                Se souvenir de moi
              </label>
            </div>

            <button 
              onClick={handleLogin} 
              className="group relative w-full bg-white text-black font-black py-4 rounded-sm hover:bg-cyan-400 transition-all mt-4 uppercase tracking-[0.2em] text-[11px] overflow-hidden"
            >
              <span className="relative z-10">{isSignUp ? "Créer mon compte" : "Se connecter"}</span>
              <div className="absolute inset-0 bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>

            <p className="text-center text-[11px] font-medium text-zinc-500 mt-6">
              {isSignUp ? 'Déjà un compte ?' : "Pas encore de compte ?"} <span onClick={() => setIsSignUp(!isSignUp)} className="text-cyan-400 cursor-pointer hover:underline font-black ml-1 uppercase">
                {isSignUp ? 'Se connecter' : "S'inscrire"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;