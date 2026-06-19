import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Server, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiFetch } from '../../api/client';
import Avatar from '../../components/Avatar';
import AdminTabs from '../../components/AdminTabs';

const STATUS_META = {
  deploying:    { label: 'Déploiement', cls: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
  provisioning: { label: 'Déploiement', cls: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
  running:      { label: 'En ligne',    cls: 'bg-green-500/10 text-green-300 border-green-500/30' },
  stopped:      { label: 'Arrêtée',     cls: 'bg-zinc-700/40 text-zinc-300 border-zinc-600' },
  error:        { label: 'Erreur',      cls: 'bg-red-500/10 text-red-300 border-red-500/30' },
  deleted:      { label: 'Supprimée',   cls: 'bg-zinc-800/60 text-zinc-500 border-zinc-700' },
};

const AdminInstances = () => {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      params.set('page', page);
      setLoading(true);
      apiFetch(`/admin/instances?${params}`)
        .then(setData)
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [search, status, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="hb-rise mb-8">
        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-orange-400 mb-2">Administration</p>
        <h1 className="font-display text-4xl md:text-5xl font-black tracking-tighter uppercase text-white">
          Instances
        </h1>
      </div>

      <AdminTabs />

      <div className="hb-rise flex flex-wrap gap-3 mb-6" style={{ animationDelay: '80ms' }}>
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher nom d'instance ou propriétaire..."
            className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-sm py-2.5 pl-10 pr-3 text-sm font-bold focus:border-red-400 focus:outline-none transition-colors"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="bg-zinc-900 border-2 border-zinc-800 rounded-sm py-2.5 px-3 text-sm font-bold font-mono uppercase tracking-widest focus:border-red-400 focus:outline-none"
        >
          <option value="">Tous les statuts</option>
          <option value="deploying">Déploiement</option>
          <option value="running">En ligne</option>
          <option value="stopped">Arrêtée</option>
          <option value="error">Erreur</option>
          <option value="deleted">Supprimée</option>
        </select>
      </div>

      <div className="hb-rise bg-zinc-900 border-2 border-zinc-800 rounded-sm overflow-hidden" style={{ animationDelay: '160ms' }}>
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-zinc-800 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500">
              <th className="text-left py-3 px-4">Instance</th>
              <th className="text-left py-3 px-4">Propriétaire</th>
              <th className="text-left py-3 px-4">Application</th>
              <th className="text-left py-3 px-4">Statut</th>
              <th className="text-right py-3 px-4">Ressources</th>
              <th className="text-left py-3 px-4">Créée</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <tr key={`sk-${i}`} className="border-b border-zinc-800/60">
                {Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="py-3 px-4">
                    <div className="h-3 w-full bg-zinc-800 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
            {!loading && data?.data?.length === 0 && (
              <tr><td colSpan={7} className="py-16 text-center">
                <Server className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm font-bold">Aucune instance ne correspond.</p>
              </td></tr>
            )}
            {!loading && data?.data?.map((inst) => {
              const meta = STATUS_META[inst.status] || STATUS_META.error;
              return (
                <tr
                  key={inst.id}
                  onClick={() => navigate(`/instance/${inst.id}`)}
                  className="border-b border-zinc-800/60 hover:bg-red-500/5 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <p className="font-bold text-white truncate">{inst.instance_name}</p>
                    <p className="text-[11px] font-mono text-zinc-500">#{inst.id}</p>
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      to={`/admin/users/${inst.user_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 hover:text-red-400 transition-colors"
                    >
                      <Avatar name={inst.user_name} email={inst.user_email} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">@{inst.user_username}</p>
                        <p className="text-[11px] text-zinc-500 truncate">{inst.user_email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-xs text-zinc-300">{inst.app_name || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-sm text-[10px] font-mono font-bold uppercase tracking-[0.15em] border ${meta.cls}`}>
                      {meta.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-[11px] font-mono text-zinc-400 whitespace-nowrap">
                    {inst.cpu_allocated} vCPU · {Math.round(inst.ram_allocated / 1024)} Go · {inst.storage_allocated} Go
                  </td>
                  <td className="py-3 px-4 text-zinc-500 text-xs font-mono">{new Date(inst.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="py-3 px-4 text-right">
                    {inst.domain && inst.status === 'running' && inst.domain.startsWith('http') && (
                      <a href={inst.domain} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[10px] font-black uppercase tracking-widest text-green-400 hover:text-green-300">
                        Ouvrir →
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data && data.last_page > 1 && (
        <div className="flex justify-between items-center mt-4 text-xs font-mono font-bold uppercase tracking-widest text-zinc-500">
          <span>{data.total} instances</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-sm bg-zinc-900 border border-zinc-800 hover:border-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>{page} / {data.last_page}</span>
            <button
              onClick={() => setPage((p) => Math.min(data.last_page, p + 1))}
              disabled={page === data.last_page}
              className="p-2 rounded-sm bg-zinc-900 border border-zinc-800 hover:border-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInstances;
