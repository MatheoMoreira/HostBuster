import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Server, CheckCircle2, AlertTriangle, ArrowRight, Cpu, MemoryStick, HardDrive } from 'lucide-react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';

const LOCATIONS = [
  'Paris, France (Bunker-01)',
  'Frankfurt, Germany (Bunker-02)',
  'London, UK (Bunker-03)',
];

const Setup = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { setUser, user } = useAuth();

  const plan = state?.plan;
  const app = state?.app;
  if (!plan || !app) return <Navigate to="/" replace />;

  const [hostname, setHostname] = useState('');
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const startDeployment = async () => {
    if (!hostname.trim()) {
      setError('Le hostname est requis.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const res = await apiFetch('/instances', {
        method: 'POST',
        body: {
          app_id: app.db_id,
          plan_name: plan.name,
          price: plan.price,
          hostname: hostname.trim(),
          location,
          cpu: plan.cpu,
          ram: plan.ram,
          storage: plan.storage,
        },
      });
      // Met à jour le solde local
      setUser({ ...user, credits: res.credits });
      setStep(2);
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) { clearInterval(interval); setStep(3); return 100; }
          return p + 4;
        });
      }, 60);
    } catch (e) {
      setError(e.errors ? Object.values(e.errors)[0][0] : (e.message || 'Échec du déploiement.'));
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {step === 1 && (
        <>
          <div className="hb-rise mb-8">
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-cyan-400 mb-2">Étape 2 / 2 — Configuration</p>
            <h1 className="font-display text-4xl md:text-5xl font-black tracking-tighter uppercase text-white">
              Configurez votre instance
            </h1>
            <p className="text-zinc-400 mt-2">{app.name} · {plan.name} · <span className="text-cyan-400 font-bold">{plan.price} crédits/mois</span></p>
          </div>

          <div className="hb-rise grid grid-cols-3 gap-2 mb-6" style={{ animationDelay: '80ms' }}>
            <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-3 text-center">
              <Cpu className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
              <p className="font-mono text-xs font-bold">{plan.cpu} vCPU</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-3 text-center">
              <MemoryStick className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
              <p className="font-mono text-xs font-bold">{(plan.ram / 1024).toFixed(0)} Go RAM</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-3 text-center">
              <HardDrive className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
              <p className="font-mono text-xs font-bold">{plan.storage} Go</p>
            </div>
          </div>

          <div className="hb-rise space-y-5 mb-8" style={{ animationDelay: '160ms' }}>
            <div className="bg-zinc-900 border-2 border-zinc-800 rounded-sm p-5">
              <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 block mb-3">Hostname</label>
              <input
                type="text"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                placeholder="mon-serveur-prod"
                className="w-full bg-zinc-950 border border-zinc-800 rounded py-3 px-4 focus:border-cyan-400 focus:outline-none focus:shadow-[0_0_0_3px_rgba(34,211,238,0.12)] font-bold text-sm transition-all"
              />
            </div>
            <div className="bg-zinc-900 border-2 border-zinc-800 rounded-sm p-5">
              <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 block mb-3">Localisation</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded py-3 px-4 focus:border-cyan-400 focus:outline-none font-bold text-sm"
              >
                {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <div className="hb-rise mb-5 flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded p-3">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm font-bold text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={startDeployment}
            disabled={submitting}
            className="hb-rise group w-full bg-white text-black font-black py-5 rounded-sm hover:bg-cyan-400 active:scale-[0.99] transition-all uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 disabled:opacity-60"
            style={{ animationDelay: '240ms' }}
          >
            {submitting ? 'Déploiement…' : <>Lancer le déploiement · {plan.price} crédits <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
          </button>
        </>
      )}

      {step === 2 && (
        <div className="py-16 space-y-8 text-center">
          <Server className="w-24 h-24 text-cyan-400 mx-auto animate-pulse" />
          <h3 className="font-display text-3xl font-black uppercase tracking-tight">Déploiement en cours…</h3>
          <div className="w-full max-w-md mx-auto bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
            <div className="bg-cyan-500 h-full transition-all duration-100" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">
            Allocation des ressources NVMe et configuration réseau
          </p>
        </div>
      )}

      {step === 3 && (
        <div className="py-16 text-center animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="font-display text-4xl font-black uppercase mb-2 text-white">Instance prête</h2>
          <p className="text-zinc-400 mb-10">Votre serveur a été déployé avec succès.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-white text-black px-10 py-4 rounded-sm font-black uppercase tracking-[0.2em] text-sm hover:bg-cyan-400 transition-all"
          >
            Accéder au dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default Setup;
