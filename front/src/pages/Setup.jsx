import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Cpu, MemoryStick, HardDrive } from 'lucide-react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';

const Setup = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { setUser, user } = useAuth();

  const plan = state?.plan;
  const app = state?.app;
  if (!plan || !app) return <Navigate to="/" replace />;

  const [hostname, setHostname] = useState('');
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
          cpu: plan.cpu,
          ram: plan.ram,
          storage: plan.storage,
        },
      });
      setUser({ ...user, credits: res.credits });
      navigate(`/instance/${res.instance.id}`, { state: { justDeployed: true } });
    } catch (e) {
      setError(e.errors ? Object.values(e.errors)[0][0] : (e.message || 'Échec du déploiement.'));
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
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
            disabled={submitting}
            className="w-full bg-zinc-950 border border-zinc-800 rounded py-3 px-4 focus:border-cyan-400 focus:outline-none focus:shadow-[0_0_0_3px_rgba(34,211,238,0.12)] font-bold text-sm transition-all disabled:opacity-60"
          />
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
        Lancer le déploiement · {plan.price} crédits <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};

export default Setup;
