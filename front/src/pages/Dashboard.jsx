import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, Loader2, AlertCircle, Trash2, Eye, EyeOff } from 'lucide-react';
import { apiFetch } from '../api/client';
import DeleteInstanceModal from '../components/DeleteInstanceModal';

const STATUS_META = {
  deploying:    { label: 'Déploiement', cls: 'bg-amber-500/10 text-amber-400',  icon: Loader2 },
  provisioning: { label: 'Déploiement', cls: 'bg-amber-500/10 text-amber-400',  icon: Loader2 },
  running:      { label: 'Opérationnel', cls: 'bg-green-500/10 text-green-500', icon: null },
  stopped:      { label: 'Arrêté',      cls: 'bg-zinc-500/10 text-zinc-400',    icon: null },
  error:        { label: 'Erreur',      cls: 'bg-red-500/10 text-red-500',      icon: AlertCircle },
  deleted:      { label: 'Supprimée',   cls: 'bg-zinc-500/10 text-zinc-500',    icon: null },
};

const SHOW_DELETED_KEY = 'hb_dashboard_show_deleted';

const Dashboard = () => {
  const navigate = useNavigate();
  const [instances, setInstances] = useState(null);
  const [error, setError] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleted, setShowDeleted] = useState(() => localStorage.getItem(SHOW_DELETED_KEY) === '1');

  const toggleShowDeleted = () => {
    setShowDeleted((v) => {
      const next = !v;
      localStorage.setItem(SHOW_DELETED_KEY, next ? '1' : '0');
      return next;
    });
  };

  const visibleInstances = instances?.filter((i) => showDeleted || i.status !== 'deleted') ?? null;
  const deletedCount = instances?.filter((i) => i.status === 'deleted').length ?? 0;

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/instances');
      setInstances(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      setError(e.message || 'Erreur de chargement');
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [load]);

  const askDelete = (inst, e) => {
    e.stopPropagation();
    setToDelete(inst);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/instances/${toDelete.id}`, { method: 'DELETE' });
      setToDelete(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
            Gestion des <span className="text-red-400">Instances</span>
          </h2>
          <p className="text-zinc-500 text-sm font-medium mt-1">
            Surveillance de votre infrastructure en temps réel.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {deletedCount > 0 && (
            <button
              onClick={toggleShowDeleted}
              title={showDeleted ? 'Masquer les instances supprimées' : 'Afficher les instances supprimées'}
              className={`flex items-center gap-2 px-3 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest border transition-colors ${
                showDeleted
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-red-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
              }`}
            >
              {showDeleted ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              Supprimées ({deletedCount})
            </button>
          )}
          <button
            onClick={() => navigate('/setup')}
            className="bg-red-500 hover:bg-red-400 text-zinc-950 px-4 py-2 rounded-sm text-xs font-black uppercase tracking-widest transition-colors"
          >
            Ajouter un serveur
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-sm text-xs font-bold uppercase tracking-widest">
          {error}
        </div>
      )}

      {instances === null && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm">
              <div className="flex justify-between items-start mb-6">
                <div className="w-6 h-6 bg-zinc-800 rounded animate-pulse" />
                <div className="w-20 h-5 bg-zinc-800 rounded animate-pulse" />
              </div>
              <div className="h-4 w-2/3 bg-zinc-800 rounded animate-pulse mb-2" />
              <div className="h-3 w-1/3 bg-zinc-800 rounded animate-pulse mb-6" />
              <div className="h-3 w-3/4 bg-zinc-800 rounded animate-pulse mb-6" />
              <div className="pt-4 border-t border-zinc-800 flex justify-between">
                <div className="h-3 w-10 bg-zinc-800 rounded animate-pulse" />
                <div className="h-4 w-4 bg-zinc-800 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {visibleInstances && visibleInstances.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-sm text-center">
          <Server className="text-zinc-700 w-10 h-10 mx-auto mb-4" />
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">
            {instances.length === 0 ? 'Aucune instance déployée' : 'Aucune instance active'}
          </p>
          <button
            onClick={() => navigate('/setup')}
            className="bg-red-500 hover:bg-red-400 text-zinc-950 px-4 py-2 rounded-sm text-xs font-black uppercase tracking-widest"
          >
            {instances.length === 0 ? 'Déployer ma première instance' : 'Déployer une nouvelle instance'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(visibleInstances || []).map((inst) => {
          const meta = STATUS_META[inst.status] || STATUS_META.error;
          const Icon = meta.icon;
          const kpisInactive = ['stopped', 'deploying', 'provisioning'].includes(inst.status);
          return (
            <div
              key={inst.id}
              onClick={() => navigate(`/instance/${inst.id}`)}
              className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm cursor-pointer hover:border-red-500/50 transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <Server className="text-red-400 w-6 h-6" />
                <span className={`flex items-center gap-1.5 text-[10px] font-black px-2 py-1 rounded uppercase ${meta.cls}`}>
                  {Icon && <Icon className={`w-3 h-3 ${inst.status === 'deploying' || inst.status === 'provisioning' ? 'animate-spin' : ''}`} />}
                  {meta.label}
                </span>
              </div>
              <h4 className="font-black uppercase text-base text-white mb-1 group-hover:text-red-400 transition-colors">
                {inst.instance_name}
              </h4>
              {inst.app_name && (
                <p className="text-red-400/80 text-[10px] mb-2 font-black uppercase tracking-widest">
                  {inst.app_name}
                </p>
              )}
              {kpisInactive ? (
                <div className="h-3 w-3/4 bg-zinc-800 rounded-sm animate-pulse mb-6" />
              ) : (
                <p className="text-zinc-500 text-[10px] mb-6 font-bold uppercase tracking-widest italic">
                  {inst.cpu_allocated} vCPU · {inst.ram_allocated} Mo RAM · {inst.storage_allocated} Go
                </p>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                  #{inst.id}
                </span>
                {inst.status !== 'deleted' && (
                  <button
                    onClick={(e) => askDelete(inst, e)}
                    className="text-zinc-600 hover:text-red-500 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {toDelete && (
        <DeleteInstanceModal
          instanceName={toDelete.instance_name}
          submitting={deleting}
          onConfirm={confirmDelete}
          onClose={() => (deleting ? null : setToDelete(null))}
        />
      )}
    </div>
  );
};

export default Dashboard;
