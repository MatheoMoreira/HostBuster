import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, Globe, Cpu, CheckCircle2 } from 'lucide-react';

const Setup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);

  const startDeployment = () => {
    setStep(2);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setStep(3);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      {step === 1 && (
        <div className="animate-in fade-in duration-500">
          <h2 className="text-3xl font-black uppercase mb-4">Configuration de l'instance</h2>
          <p className="text-zinc-500 mb-12">Personnalisez votre infrastructure avant le déploiement final.</p>
          
          <div className="space-y-6 text-left mb-12">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm">
              <label className="text-[10px] font-black uppercase text-zinc-500 block mb-3 italic">Localisation du centre de données</label>
              <select className="w-full bg-zinc-950 border border-zinc-800 rounded py-3 px-4 focus:border-cyan-500/50 outline-none font-bold text-sm">
                <option>Paris, France (Bunker-01)</option>
                <option>Frankfurt, Germany (Bunker-02)</option>
                <option>London, UK (Bunker-03)</option>
              </select>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm">
              <label className="text-[10px] font-black uppercase text-zinc-500 block mb-3 italic">Nom d'hôte (Hostname)</label>
              <input type="text" placeholder="mon-serveur-production" className="w-full bg-zinc-950 border border-zinc-800 rounded py-3 px-4 focus:border-cyan-500/50 outline-none font-bold text-sm" />
            </div>
          </div>
          
          <button 
            onClick={startDeployment}
            className="bg-cyan-600 text-white px-10 py-4 rounded-sm font-black uppercase tracking-widest text-xs hover:bg-cyan-500 transition-all"
          >
            Lancer l'installation
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8 py-12">
          <div className="relative w-24 h-24 mx-auto">
            <Server className="w-full h-full text-cyan-400 animate-pulse" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-widest">Déploiement en cours...</h3>
          <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden max-w-md mx-auto">
            <div className="bg-cyan-500 h-full transition-all duration-100" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest italic">Allocation des ressources NVMe et configuration réseau</p>
        </div>
      )}

      {step === 3 && (
        <div className="animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-black uppercase mb-4 text-white">Instance prête</h2>
          <p className="text-zinc-500 mb-12">Votre serveur a été déployé avec succès sur notre infrastructure.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="bg-white text-black px-10 py-4 rounded-sm font-black uppercase tracking-widest text-xs hover:bg-cyan-400 transition-all"
          >
            Accéder à la console de gestion
          </button>
        </div>
      )}
    </div>
  );
};

export default Setup;