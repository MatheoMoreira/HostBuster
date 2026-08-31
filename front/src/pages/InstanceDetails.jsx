import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play,
  Square,
  Trash2,
  Globe,
  Database,
  ArrowLeft,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  Save,
  Archive,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Server } from 'lucide-react';
import { apiFetch } from '../api/client';
import { useToast } from '../context/ToastContext';
import DeleteInstanceModal from '../components/DeleteInstanceModal';

const STATUS_META = {
  deploying:    { label: 'Déploiement', cls: 'bg-amber-500/10 text-amber-400', dot: 'bg-amber-400', spin: true },
  provisioning: { label: 'Déploiement', cls: 'bg-amber-500/10 text-amber-400', dot: 'bg-amber-400', spin: true },
  running:      { label: 'En ligne',    cls: 'bg-green-500/10 text-green-500', dot: 'bg-green-500', spin: false },
  stopped:      { label: 'Arrêtée',     cls: 'bg-zinc-500/10 text-zinc-400',   dot: 'bg-zinc-400',  spin: false },
  error:        { label: 'Erreur',      cls: 'bg-red-500/10 text-red-500',     dot: 'bg-red-500',   spin: false },
  deleted:      { label: 'Supprimée',   cls: 'bg-zinc-500/10 text-zinc-500',   dot: 'bg-zinc-500',  spin: false },
};

// 2 unités les plus fortes, unité secondaire zero-paddée, unités nulles masquées.
const formatUptimeSeconds = (seconds) => {
  if (seconds == null || Number.isNaN(seconds) || seconds < 0) return '—';
  const s = Math.floor(seconds);
  const d = Math.floor(s / 86_400);
  const h = Math.floor((s % 86_400) / 3_600);
  const m = Math.floor((s % 3_600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}j ${String(h).padStart(2, '0')}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, '0')}s`;
  return `${sec}s`;
};

const InstanceDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const [instance, setInstance] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('backups');
  const [copied, setCopied] = useState(false);
  const [acting, setActing] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'start' | 'stop'
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Bouton "Ouvrir" désactivé qq sec juste après un déploiement (marge pour le
  // certificat TLS / la prise en compte par le proxy).
  const [openCooldown, setOpenCooldown] = useState(0);
  const prevStatusRef = useRef(null);

  // Métriques live remontées par le worker (docker stats)
  const [metrics, setMetrics] = useState({
    available: false,
    cpuPct: null,
    cpuHistory: [],
    memUsedMb: null,
    memLimitMb: null,
    memPct: null,
    diskUsedMb: null,
    uptimeSeconds: null,
    startedAt: null,
  });
  const [, setTick] = useState(0); // force le recalcul de l'uptime chaque seconde

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
    if (!instance || instance.status !== 'running') {
      setMetrics((m) => ({ ...m, available: false }));
      return;
    }
    let cancelled = false;
    const fetchMetrics = async () => {
      try {
        const data = await apiFetch(`/instances/${id}/metrics`);
        if (cancelled) return;
        if (!data?.available) {
          setMetrics((m) => ({ ...m, available: false }));
          return;
        }
        setMetrics((m) => ({
          available: true,
          cpuPct: data.cpu_pct,
          cpuHistory: [...m.cpuHistory.slice(-13), data.cpu_pct ?? 0].slice(-14),
          memUsedMb: data.mem_used_mb,
          memLimitMb: data.mem_limit_mb,
          memPct: data.mem_pct,
          diskUsedMb: data.disk_used_mb,
          uptimeSeconds: data.uptime_seconds,
          startedAt: data.started_at,
        }));
      } catch {
        if (!cancelled) setMetrics((m) => ({ ...m, available: false }));
      }
    };
    fetchMetrics();
    const handle = setInterval(fetchMetrics, 3000);
    return () => { cancelled = true; clearInterval(handle); };
  }, [instance, id]);

  const copyAddress = (value) => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAction = async (action) => {
    setActing(true);
    setPendingAction(action);
    try {
      // Le worker traite l'action en tâche de fond (202). On garde le loader
      // jusqu'à ce que le statut poll atteigne la cible (voir l'effet ci-dessous).
      await apiFetch(`/instances/${id}/${action}`, { method: 'POST' });
      await load();
    } catch (e) {
      toast.error(e.message);
      setActing(false);
      setPendingAction(null);
    }
  };

  // Au passage "déploiement -> en ligne", on bloque "Ouvrir" 10 s.
  useEffect(() => {
    const prev = prevStatusRef.current;
    if (instance && instance.status === 'running'
        && (prev === 'deploying' || prev === 'provisioning')) {
      setOpenCooldown(30);
    }
    if (instance) prevStatusRef.current = instance.status;
  }, [instance?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Décompte du cooldown.
  useEffect(() => {
    if (openCooldown <= 0) return;
    const t = setTimeout(() => setOpenCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [openCooldown]);

  // Tick local : fait défiler l'uptime à la seconde entre deux samples worker.
  useEffect(() => {
    if (instance?.status !== 'running') return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [instance?.status]);

  // Fin du loader quand l'instance a réellement atteint l'état visé.
  useEffect(() => {
    if (!pendingAction || !instance) return;
    const target = pendingAction === 'start' ? 'running' : 'stopped';
    if (instance.status === target) {
      toast.success(pendingAction === 'start' ? 'Instance démarrée.' : 'Instance arrêtée.');
      setActing(false);
      setPendingAction(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance?.status, pendingAction]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await apiFetch(`/instances/${id}`, { method: 'DELETE' });
      toast.success('Instance supprimée.');
      navigate('/dashboard');
    } catch (e) {
      toast.error(e.message);
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
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse mb-8" />
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-zinc-800 rounded animate-pulse" />
          <div className="space-y-2">
            <div className="h-7 w-56 bg-zinc-800 rounded animate-pulse" />
            <div className="h-3 w-40 bg-zinc-800 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-zinc-900 border border-zinc-800 rounded-sm animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-zinc-900 border border-zinc-800 rounded-sm animate-pulse" />
      </div>
    );
  }

  if (instance.status === 'deploying' || instance.status === 'provisioning') {
    return <DeployingView instance={instance} onBack={() => navigate('/dashboard')} />;
  }

  if (instance.status === 'error') {
    return <ErrorView instance={instance} onBack={() => navigate('/dashboard')} onDelete={confirmDelete} deleting={deleting} />;
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
              <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-4">
                <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-600 mb-1">Créée le</p>
                <p className="text-sm font-bold text-zinc-300">{instance.created_at || '—'}</p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-4">
                <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-600 mb-1">Supprimée le</p>
                <p className="text-sm font-bold text-zinc-300">
                  {instance.deleted_at ? new Date(instance.deleted_at).toLocaleString('fr-FR') : '—'}
                </p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-4 col-span-2">
                <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-600 mb-1">Supprimée par</p>
                <p className="text-sm font-bold text-zinc-300">
                  {instance.deleted_by_role === 'système'
                    ? 'Automatiquement (expiration d’abonnement)'
                    : instance.deleted_by_name
                      ? `${instance.deleted_by_name} · ${instance.deleted_by_role}`
                      : (instance.deleted_by_role || '—')}
                </p>
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
  // Tant que le premier sample du worker n'est pas arrivé : skeleton.
  const kpisLoading = instance.status === 'running' && metrics.cpuPct == null;
  // Skeleton uniquement pendant un chargement réel (déploiement / 1er sample).
  // Une instance arrêtée n'est pas "en chargement" : on montre des "—".
  const kpisSkeleton = ['deploying', 'provisioning'].includes(instance.status) || kpisLoading;
  const liveAvailable = metrics.available && instance.status === 'running' && metrics.cpuPct != null;
  const ramTotalGb = (instance.ram_allocated / 1024).toFixed(1);
  const ramUsedGb = liveAvailable && metrics.memUsedMb != null
    ? (metrics.memUsedMb / 1024).toFixed(2)
    : null;
  const ramPctDisplay = liveAvailable && metrics.memPct != null ? metrics.memPct : 0;
  const cpuPctDisplay = liveAvailable && metrics.cpuPct != null ? metrics.cpuPct : 0;
  const diskUsedGb = liveAvailable && metrics.diskUsedMb != null
    ? (metrics.diskUsedMb / 1024).toFixed(2)
    : null;
  const diskPctDisplay = liveAvailable && metrics.diskUsedMb != null && instance.storage_allocated
    ? Math.min(100, (metrics.diskUsedMb / 1024 / instance.storage_allocated) * 100)
    : 0;
  // Uptime live : recalculé depuis started_at (sinon repli sur la valeur worker).
  const liveUptime = metrics.startedAt
    ? Math.max(0, (Date.now() - Date.parse(metrics.startedAt)) / 1000)
    : metrics.uptimeSeconds;
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
          {instance.domain && instance.status === 'running' && instance.domain.startsWith('http') && (
            openCooldown > 0 ? (
              <span
                title="Démarrage des services en cours…"
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-green-600/40 text-white/70 px-4 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest cursor-not-allowed"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Ouvrir ({openCooldown}s)
              </span>
            ) : (
              <a
                href={instance.domain}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Ouvrir
              </a>
            )
          )}
          <button
            onClick={() => handleAction('start')}
            disabled={acting || instance.status === 'running' || instance.status === 'deploying' || instance.status === 'deleted'}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:hover:bg-zinc-800"
          >
            {pendingAction === 'start'
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Démarrage…</>
              : <><Play className="w-3.5 h-3.5 fill-current" /> Démarrer</>}
          </button>
          <button
            onClick={() => handleAction('stop')}
            disabled={acting || instance.status !== 'running'}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:hover:bg-zinc-800"
          >
            {pendingAction === 'stop'
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Arrêt…</>
              : <><Square className="w-3.5 h-3.5 fill-current" /> Arrêter</>}
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
          {kpisSkeleton ? (
            <>
              <div className="h-9 w-24 bg-zinc-800 rounded-sm animate-pulse mb-4" />
              <div className="h-8 w-full bg-zinc-800 rounded-sm animate-pulse" />
            </>
          ) : (
            <>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-3xl font-black text-white">
                  {liveAvailable ? `${cpuPctDisplay.toFixed(1)}%` : '—'}
                </span>
                <span className="text-zinc-600 text-[10px] font-bold pb-1 uppercase">{instance.cpu_allocated} vCPU</span>
              </div>
              <div className="flex gap-1 h-8 items-end">
                {(metrics.cpuHistory.length ? metrics.cpuHistory : Array(14).fill(0)).map((val, i) => (
                  <div key={i} className="flex-1 bg-red-500/20 hover:bg-red-500/40 transition-all rounded-t-sm" style={{ height: `${Math.min(100, Math.max(2, val || 0))}%` }}></div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Mémoire vive (RAM)</p>
          {kpisSkeleton ? (
            <>
              <div className="h-9 w-28 bg-zinc-800 rounded-sm animate-pulse mb-4" />
              <div className="h-1.5 w-full bg-zinc-800 rounded-full animate-pulse" />
            </>
          ) : (
            <>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-3xl font-black text-white">
                  {liveAvailable && ramUsedGb ? `${ramUsedGb} Go` : '—'}
                </span>
                <span className="text-zinc-600 text-[10px] font-bold pb-1 uppercase">Sur {ramTotalGb} Go</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full transition-all" style={{ width: `${ramPctDisplay}%` }}></div>
              </div>
            </>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Stockage NVMe</p>
          {kpisSkeleton ? (
            <>
              <div className="h-9 w-28 bg-zinc-800 rounded-sm animate-pulse mb-4" />
              <div className="h-1.5 w-full bg-zinc-800 rounded-full animate-pulse" />
            </>
          ) : (
            <>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-3xl font-black text-white">
                  {diskUsedGb ? `${diskUsedGb} Go` : '—'}
                </span>
                <span className="text-zinc-600 text-[10px] font-bold pb-1 uppercase">Sur {instance.storage_allocated} Go</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full transition-all" style={{ width: `${diskPctDisplay}%` }}></div>
              </div>
            </>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Temps de disponibilité</p>
          {kpisSkeleton ? (
            <div className="h-9 w-32 bg-zinc-800 rounded-sm animate-pulse" />
          ) : (
            <div className="text-3xl font-black text-white uppercase tracking-tighter">
              {liveAvailable ? formatUptimeSeconds(liveUptime) : '—'}
            </div>
          )}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden">
        <div className="flex border-b border-zinc-800">
          {[
            { id: 'backups', label: 'Sauvegardes', icon: Database },
            { id: 'network', label: 'Réseau', icon: Globe },
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
          {activeTab === 'network' && (
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Adresse IPv6</p>
                <p className="font-mono text-white">{ipv6}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Adresse publique</p>
                <p className="font-mono text-white break-all">{instance.domain || '— (en attente du worker)'}</p>
              </div>
            </div>
          )}

          {activeTab === 'backups' && (
            <BackupsTab instanceId={id} canManage={instance.status !== 'deleted'} />
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

const formatBytes = (b) => {
  if (!b && b !== 0) return '—';
  if (b < 1024) return `${b} o`;
  if (b < 1_048_576) return `${(b / 1024).toFixed(0)} Ko`;
  if (b < 1_073_741_824) return `${(b / 1_048_576).toFixed(1)} Mo`;
  return `${(b / 1_073_741_824).toFixed(2)} Go`;
};

const BackupsTab = ({ instanceId, canManage }) => {
  const toast = useToast();
  const [backups, setBackups] = useState(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(null); // nom en cours de restore/delete
  const [confirm, setConfirm] = useState(null); // { action, name }

  const reload = useCallback(async () => {
    try {
      const data = await apiFetch(`/instances/${instanceId}/backups`);
      setBackups(data.backups || []);
    } catch {
      setBackups([]);
    }
  }, [instanceId]);

  useEffect(() => { reload(); }, [reload]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await apiFetch(`/instances/${instanceId}/backups`, { method: 'POST' });
      toast.success('Sauvegarde créée.');
      await reload();
    } catch (e) {
      toast.error(e.message || 'Échec de la sauvegarde.');
    } finally {
      setCreating(false);
    }
  };

  const runConfirmed = async () => {
    const { action, name } = confirm;
    setConfirm(null);
    setBusy(name);
    try {
      if (action === 'restore') {
        await apiFetch(`/instances/${instanceId}/backups/${encodeURIComponent(name)}/restore`, { method: 'POST' });
        toast.success('Restauration lancée. L\'instance redémarre.');
      } else {
        await apiFetch(`/instances/${instanceId}/backups/${encodeURIComponent(name)}`, { method: 'DELETE' });
        toast.success('Sauvegarde supprimée.');
      }
      await reload();
    } catch (e) {
      toast.error(e.message || 'Action impossible.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <p className="text-sm font-black text-white uppercase tracking-tight">Sauvegardes</p>
          <p className="text-[11px] text-zinc-500 font-bold mt-0.5">Snapshot des données de l'instance (restaurable à tout moment).</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating || !canManage}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
        >
          {creating
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sauvegarde…</>
            : <><Save className="w-3.5 h-3.5" /> Nouvelle sauvegarde</>}
        </button>
      </div>

      {backups === null ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 bg-zinc-800/50 rounded-sm animate-pulse" />
          ))}
        </div>
      ) : backups.length === 0 ? (
        <div className="text-center py-12">
          <Archive className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm font-bold">Aucune sauvegarde pour le moment.</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-sm">
          {backups.map((b) => (
            <div key={b.name} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-zinc-800/30 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <Archive className="w-4 h-4 text-zinc-500 shrink-0" />
                <div className="min-w-0">
                  <p className="font-mono text-xs text-white truncate">{b.name}</p>
                  <p className="text-[11px] text-zinc-500 font-bold">
                    {formatBytes(b.size_bytes)} · {new Date(b.created_at * 1000).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setConfirm({ action: 'restore', name: b.name })}
                  disabled={busy === b.name || !canManage}
                  className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
                >
                  {busy === b.name ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                  Restaurer
                </button>
                <button
                  onClick={() => setConfirm({ action: 'delete', name: b.name })}
                  disabled={busy === b.name}
                  className="flex items-center gap-1.5 text-zinc-500 hover:text-red-400 px-2 py-2 rounded-sm transition-all disabled:opacity-40"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setConfirm(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <p className="text-white font-black uppercase tracking-tight mb-2">
              {confirm.action === 'restore' ? 'Restaurer cette sauvegarde ?' : 'Supprimer cette sauvegarde ?'}
            </p>
            <p className="text-zinc-400 text-sm mb-6">
              {confirm.action === 'restore'
                ? 'Les données actuelles de l\'instance seront remplacées par celles de la sauvegarde. L\'instance va redémarrer.'
                : 'Cette sauvegarde sera définitivement supprimée.'}
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirm(null)} className="px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white">
                Annuler
              </button>
              <button
                onClick={runConfirmed}
                className={`px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest text-white ${confirm.action === 'restore' ? 'bg-red-600 hover:bg-red-500' : 'bg-red-600 hover:bg-red-500'}`}
              >
                {confirm.action === 'restore' ? 'Restaurer' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Déploiement réel : on ne connaît pas la durée → barre indéterminée.
// Le composant parent re-rend automatiquement vers la vue normale quand le
// polling détecte que le statut est passé à `running` (callback du worker).
const DeployingView = ({ instance, onBack }) => (
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

      <div className="relative w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
        <div className="hb-indeterminate bg-red-500" />
      </div>

      <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">
        Provisionnement du conteneur et configuration réseau · peut prendre 1 à 2 min
      </p>
      <button onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
        ← Revenir au dashboard (le déploiement continue)
      </button>
    </div>
  </div>
);

// Échec de déploiement (le worker a renvoyé status=error).
const ErrorView = ({ instance, onBack, onDelete, deleting }) => (
  <div className="min-h-[70vh] flex items-center justify-center px-4">
    <div className="w-full max-w-xl text-center space-y-6">
      <div className="w-20 h-20 bg-red-500/10 border-2 border-red-500/30 rounded-full flex items-center justify-center mx-auto">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>
      <div>
        <h2 className="font-display text-4xl font-black uppercase tracking-tight text-white mb-2">
          Échec du déploiement
        </h2>
        <p className="text-zinc-400">
          {instance.instance_name}
          {instance.app_name && <> · <span className="text-red-400 font-bold">{instance.app_name}</span></>}
        </p>
        <p className="text-zinc-500 text-sm mt-3">
          Le provisionnement a échoué côté infrastructure. Vous pouvez supprimer cette instance et réessayer.
        </p>
      </div>
      <div className="flex gap-3 justify-center">
        <button onClick={onBack} className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-sm text-xs font-black uppercase tracking-widest transition-colors">
          Retour
        </button>
        <button onClick={onDelete} disabled={deleting} className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-sm text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-50">
          {deleting ? 'Suppression…' : 'Supprimer'}
        </button>
      </div>
    </div>
  </div>
);

export default InstanceDetails;
