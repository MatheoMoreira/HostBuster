import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShieldCheck, User, Ban, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { apiFetch } from '../../api/client';

const RoleBadge = ({ role }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] font-mono font-bold uppercase tracking-[0.15em] border ${
    role === 'admin'
      ? 'bg-orange-500/10 border-orange-500/40 text-orange-300'
      : 'bg-zinc-800 border-zinc-700 text-zinc-400'
  }`}>
    {role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
    {role}
  </span>
);

const AdminUsers = () => {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (role) params.set('role', role);
      params.set('page', page);
      setLoading(true);
      apiFetch(`/admin/users?${params}`)
        .then(setData)
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [search, role, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="hb-rise mb-8">
        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-orange-400 mb-2">Administration</p>
        <h1 className="font-display text-4xl md:text-5xl font-black tracking-tighter uppercase text-white">
          Utilisateurs
        </h1>
      </div>

      <div className="hb-rise flex flex-wrap gap-3 mb-6" style={{ animationDelay: '80ms' }}>
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher nom ou email..."
            className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-sm py-2.5 pl-10 pr-3 text-sm font-bold focus:border-red-400 focus:outline-none transition-colors"
          />
        </div>
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="bg-zinc-900 border-2 border-zinc-800 rounded-sm py-2.5 px-3 text-sm font-bold font-mono uppercase tracking-widest focus:border-red-400 focus:outline-none"
        >
          <option value="">Tous les rôles</option>
          <option value="admin">Admin</option>
          <option value="client">Client</option>
        </select>
      </div>

      <div className="hb-rise bg-zinc-900 border-2 border-zinc-800 rounded-sm overflow-hidden" style={{ animationDelay: '160ms' }}>
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-zinc-800 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500">
              <th className="text-left py-3 px-4">Nom</th>
              <th className="text-left py-3 px-4">Email</th>
              <th className="text-left py-3 px-4">Rôle</th>
              <th className="text-right py-3 px-4">Crédits</th>
              <th className="text-left py-3 px-4">Statut</th>
              <th className="text-left py-3 px-4">Créé</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="py-12 text-center text-zinc-500"><Loader2 className="w-5 h-5 animate-spin inline" /></td></tr>
            )}
            {!loading && data?.data?.length === 0 && (
              <tr><td colSpan={7} className="py-12 text-center text-zinc-500 text-sm font-bold">Aucun utilisateur.</td></tr>
            )}
            {!loading && data?.data?.map((u) => (
              <tr key={u.id} className="border-b border-zinc-800/60 hover:bg-red-500/5 transition-colors">
                <td className="py-3 px-4 font-bold text-white">{u.name}</td>
                <td className="py-3 px-4 text-zinc-400 text-sm">{u.email}</td>
                <td className="py-3 px-4"><RoleBadge role={u.role} /></td>
                <td className="py-3 px-4 text-right font-mono font-bold text-yellow-400">{Math.trunc(Number(u.credits))}</td>
                <td className="py-3 px-4">
                  {u.suspended_at ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-red-400">
                      <Ban className="w-3 h-3" /> Suspendu
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold uppercase text-green-400">Actif</span>
                  )}
                </td>
                <td className="py-3 px-4 text-zinc-500 text-xs font-mono">{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                <td className="py-3 px-4 text-right">
                  <Link to={`/admin/users/${u.id}`} className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300">
                    Détails →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.last_page > 1 && (
        <div className="flex justify-between items-center mt-4 text-xs font-mono font-bold uppercase tracking-widest text-zinc-500">
          <span>{data.total} utilisateurs</span>
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

export default AdminUsers;
