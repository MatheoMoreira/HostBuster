import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play,
  Square,
  Trash2,
  Terminal,
  Globe,
  Shield,
  Database,
  Settings,
  ArrowLeft,
  Copy,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Server } from 'lucide-react';
import { apiFetch } from '../api/client';
import DeleteInstanceModal from '../components/DeleteInstanceModal';

const DEPLOY_DURATION_MS = 5000;

const STATUS_META = {
  deploying:    { label: 'Déploiement', cls: 'bg-amber-500/10 text-amber-400', dot: 'bg-amber-400', spin: true },
  provisioning: { label: 'Déploiement', cls: 'bg-amber-500/10 text-amber-400', dot: 'bg-amber-400', spin: true },
  running:      { label: 'En ligne',    cls: 'bg-green-500/10 text-green-500', dot: 'bg-green-500', spin: false },
  stopped:      { label: 'Arrêtée',     cls: 'bg-zinc-500/10 text-zinc-400',   dot: 'bg-zinc-400',  spin: false },
  error:        { label: 'Erreur',      cls: 'bg-red-500/10 text-red-500',     dot: 'bg-red-500',   spin: false },
  deleted:      { label: 'Supprimée',   cls: 'bg-zinc-500/10 text-zinc-500',   dot: 'bg-zinc-500',  spin: false },
};

// Métriques fakes (pas de vraie supervision côté Abeille pour l'instant)
const randomJitter = (base, spread) => Math.max(0, Math.min(100, base + (Math.random() - 0.5) * spread));

const formatUptime = (createdAt) => {
  if (!createdAt) return '—';
  const created = new Date(createdAt.replace(' ', 'T'));
  const diffMs = Date.now() - created.getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return '—';
  const days = Math.floor(diffMs / 86_400_000);
  const hours = Math.floor((diffMs % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
  return `${days}j ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
};

const InstanceDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { state: navState } = useLocation();

  const [instance, setInstance] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('console');
  const [copied, setCopied] = useState(false);
  const [acting, setActing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [forceDeploying, setForceDeploying] = useState(Boolean(navState?.justDeployed));

  // Métriques fake qui bougent légèrement pour faire vivre l'UI
  const [metrics, setMetrics] = useState({
    cpuHistory: [32, 35, 31, 40, 38, 33, 35],
    cpuPct: 32,
    ramPct: 30,
    diskPct: 18,
  });

  const load = useCallback(async () => {
    try {
      const data = await apiFetch(`/instances/${id}`);
      setInstance(data);
      setError(null);
    } catch (e) {
      setError(e.status === 404 ? 'Instance introuvable.' : (e.message || 'Erreur de chargement'));
    }
  }, [id]);

  useEffect(() => {
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!instance || instance.status !== 'running') return;
    const id = setInterval(() => {
      setMetrics((m) => ({
        cpuHistory: [...m.cpuHistory.slice(1), randomJitter(m.cpuPct, 20)],
        cpuPct: randomJitter(m.cpuPct, 10),
        ramPct: randomJitter(m.ramPct, 5),
        diskPct: Math.min(100, m.diskPct + Math.random() * 0.05),
      }));
    }, 1500);
    return () => clearInterval(id);
  }, [instance]);

  const copyAddress = (value) => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAction = async (action) => {
    setActing(true);
    try {
      await apiFetch(`/instances/${id}/${action}`, { method: 'POST' });
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setActing(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await apiFetch(`/instances/${id}`, { method: 'DELETE' });
      navigate('/dashboard');
    } catch (e) {
      alert(e.message);
      setDeleting(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 text-xs font-black uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> Retour au dashboard
        </button>
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-sm text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-zinc-500 text-xs font-bold uppercase tracking-widest">
        Chargement…
      </div>
    );
  }

  if (forceDeploying || instance.status === 'deploying' || instance.status === 'provisioning') {
    return (
      <DeployingView
        instance={instance}
        onDone={() => setForceDeploying(false)}
      />
    );
  }

  if (instance.status === 'deleted') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 text-xs font-black uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> Retour au dashboard
        </button>

        <div className="bg-zinc-900 border-2 border-zinc-800 rounded-sm overflow-hidden">
          <div className="h-1.5 bg-[repeating-linear-gradient(45deg,#3f3f46,#3f3f46_10px,#000_10px,#000_20px)]" />
          <div className="p-10 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-zinc-800 border border-zinc-700 rounded-full mx-auto mb-6">
              <Trash2 className="w-7 h-7 text-zinc-500" />
            </div>

            <h2 className="font-display text-3xl font-black uppercase tracking-tight text-white mb-2">
              {instance.instance_name}
            </h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-8">
              Instance supprimée · #{instance.id}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8 text-left">
              {instance.app_name && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-4">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-600 mb-1">Application</p>
                  <p className="text-sm font-bold text-zinc-300">{instance.app_name}</p>
                </div>
              )}
              <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-4">
                <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-600 mb-1">Ressources allouées</p>
                <p className="text-sm font-bold text-zinc-300">
                  {instance.cpu_allocated} vCPU · {instance.ram_allocated} Mo · {instance.storage_allocated} Go
                </p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-4 col-span-2">
                <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-600 mb-1">Créée le</p>
                <p className="text-sm font-bold text-zinc-300">{instance.created_at || '—'}</p>
              </div>
            </div>

            <p className="text-sm text-zinc-500 mb-8">
              Les données de cette instance ne sont plus accessibles.
            </p>

            <button
              onClick={() => navigate('/dashboard')}
              className="bg-white text-black font-black py-3 px-8 rounded-sm hover:bg-red-400 active:scale-[0.99] transition-all uppercase tracking-[0.2em] text-xs"
            >
              Retour au dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const meta = STATUS_META[instance.status] || STATUS_META.error;
  const kpisInactive = ['stopped', 'deploying', 'provisioning'].includes(instance.status);
  const ramTotalGb = (instance.ram_allocated / 1024).toFixed(1);
  const ramUsedGb = ((instance.ram_allocated / 1024) * (metrics.ramPct / 100)).toFixed(2);
  const diskUsedGb = (instance.storage_allocated * (metrics.diskPct / 100)).toFixed(1);
  const ipv6 = instance.ipv6_address || '—';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 text-xs font-black uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4" /> Retour au dashboard
      </button>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
        <div>
          <div className="flex items-center gap-4 mb-2 flex-wrap">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">{instance.instance_name}</h2>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] font-black uppercase ${meta.cls}`}>
              {meta.spin
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <div className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}></div>}
              {meta.label}
            </div>
            {instance.app_name && (
              <span className="text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 px-2 py-1 rounded-sm">
                {instance.app_name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-zinc-500 text-xs font-bold uppercase tracking-widest flex-wrap">
            <span
              className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors"
              onClick={() => copyAddress(ipv6)}
              title="Copier l'adresse IPv6"
            >
              <Globe className="w-3.5 h-3.5" /> IPv6 : {ipv6}{' '}
              {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            </span>
            <span>#{instance.id}</span>
          </div>
        </div>

        <div className="flex gap-2 w-full lg:w-auto">
          <button
            onClick={() => handleAction('start')}
            disabled={acting || instance.status === 'running' || instance.status === 'deploying' || instance.status === 'deleted'}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:hover:bg-zinc-800"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Démarrer
          </button>
          <button
            onClick={() => handleAction('stop')}
            disabled={acting || instance.status !== 'running'}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:hover:bg-zinc-800"
          >
            <Square className="w-3.5 h-3.5 fill-current" /> Arrêter
          </button>
          <button
            onClick={() => setShowDelete(true)}
            disabled={acting || instance.status === 'deleted'}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:hover:bg-red-600"
          >
            <Trash2 className="w-3.5 h-3.5" /> Supprimer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Utilisation CPU</p>
          {kpisInactive ? (
            <>
              <div className="h-9 w-24 bg-zinc-800 rounded-sm animate-pulse mb-4" />
              <div className="h-8 w-full bg-zinc-800 rounded-sm animate-pulse" />
            </>
          ) : (
            <>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-3xl font-black text-white">{metrics.cpuPct.toFixed(0)}%</span>
                <span className="text-zinc-600 text-[10px] font-bold pb-1 uppercase">{instance.cpu_allocated} vCPU</span>
              </div>
              <div className="flex gap-1 h-8 items-end">
                {metrics.cpuHistory.map((val, i) => (
                  <div key={i} className="flex-1 bg-red-500/20 hover:bg-red-500/40 transition-all rounded-t-sm" style={{ height: `${val}%` }}></div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Mémoire vive (RAM)</p>
          {kpisInactive ? (
            <>
              <div className="h-9 w-28 bg-zinc-800 rounded-sm animate-pulse mb-4" />
              <div className="h-1.5 w-full bg-zinc-800 rounded-full animate-pulse" />
            </>
          ) : (
            <>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-3xl font-black text-white">{ramUsedGb} Go</span>
                <span className="text-zinc-600 text-[10px] font-bold pb-1 uppercase">Sur {ramTotalGb} Go</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full transition-all" style={{ width: `${metrics.ramPct}%` }}></div>
              </div>
            </>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Stockage NVMe</p>
          {kpisInactive ? (
            <>
              <div className="h-9 w-28 bg-zinc-800 rounded-sm animate-pulse mb-4" />
              <div className="h-1.5 w-full bg-zinc-800 rounded-full animate-pulse" />
            </>
          ) : (
            <>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-3xl font-black text-white">{diskUsedGb} Go</span>
                <span className="text-zinc-600 text-[10px] font-bold pb-1 uppercase">Sur {instance.storage_allocated} Go</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full transition-all" style={{ width: `${metrics.diskPct}%` }}></div>
              </div>
            </>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Temps de disponibilité</p>
          {kpisInactive ? (
            <div className="h-8 w-32 bg-zinc-800 rounded-sm animate-pulse my-1" />
          ) : (
            <div className="text-2xl font-black text-white uppercase tracking-tighter">{formatUptime(instance.created_at)}</div>
          )}
          <p className="text-[9px] font-bold text-green-500 uppercase tracking-widest">SLA 99.99% respecté</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden">
        <div className="flex border-b border-zinc-800">
          {[
            { id: 'console', label: 'Console', icon: Terminal },
            { id: 'network', label: 'Réseau', icon: Globe },
            { id: 'backups', label: 'Sauvegardes', icon: Database },
            { id: 'security', label: 'Sécurité', icon: Shield },
            { id: 'settings', label: 'Paramètres', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id ? 'bg-zinc-800 text-red-400 border-b-2 border-red-400' : 'text-zinc-500 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-0">
          {activeTab === 'console' && (
            <div className="bg-zinc-950 p-6 font-mono text-sm min-h-[400px]">
              <div className="text-zinc-500 mb-1">[SYSTEM] Connexion établie au socket v4.2.1...</div>
              <div className="text-zinc-500 mb-4">[SYSTEM] Authentification via clé SSH réussie.</div>
              <div className="text-white flex gap-2">
                <span className="text-red-400 font-bold">root@{instance.instance_name}:~$</span>
                <span className="animate-pulse">_</span>
              </div>
            </div>
          )}

          {activeTab === 'network' && (
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Adresse IPv6</p>
                <p className="font-mono text-white">{ipv6}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Sous-domaine</p>
                <p className="font-mono text-white">{instance.instance_name}.pt.filiere.info</p>
              </div>
            </div>
          )}

          {activeTab !== 'console' && activeTab !== 'network' && (
            <div className="p-12 text-center">
              <p className="text-zinc-500 font-bold text-xs uppercase tracking-[0.2em]">
                Configuration {activeTab} en cours de chargement...
              </p>
            </div>
          )}
        </div>
      </div>

      {showDelete && (
        <DeleteInstanceModal
          instanceName={instance.instance_name}
          submitting={deleting}
          onConfirm={confirmDelete}
          onClose={() => (deleting ? null : setShowDelete(false))}
        />
      )}
    </div>
  );
};

const DeployingView = ({ instance, onDone }) => {
  const [progress, setProgress] = useState(0);
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / DEPLOY_DURATION_MS) * 100);
      setProgress(pct);
      if (elapsed >= DEPLOY_DURATION_MS) {
        clearInterval(tick);
        onDoneRef.current?.();
      }
    }, 60);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-xl text-center space-y-8">
        <Server className="w-24 h-24 text-red-400 mx-auto animate-pulse" />
        <div>
          <h2 className="font-display text-4xl font-black uppercase tracking-tight text-white mb-2">
            Déploiement en cours…
          </h2>
          <p className="text-zinc-400">
            {instance.instance_name}
            {instance.app_name && <> · <span className="text-red-400 font-bold">{instance.app_name}</span></>}
          </p>
        </div>

        <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
          <div
            className="bg-red-500 h-full transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">
          Allocation des ressources NVMe et configuration réseau · {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
};

export default InstanceDetails;
