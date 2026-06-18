import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Coins, ShieldCheck, Ban, Trash2, Loader2, Plus, Minus, Server, ShoppingCart, Wrench } from 'lucide-react';
import { apiFetch } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/Avatar';

const AdminUserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const load = () => {
    setLoading(true);
    apiFetch(`/admin/users/${id}`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const action = async (fn) => {
    setBusy(true);
    setError('');
    try { await fn(); load(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const adjustCredits = (sign) => action(async () => {
    const value = parseFloat(amount);
    if (!value) return;
    await apiFetch(`/admin/users/${id}/credits`, {
      method: 'POST',
      body: { amount: sign * Math.abs(value), reason },
    });
    setAmount('');
    setReason('');
  });

  const toggleRole = () => action(async () => {
    const next = data.user.role === 'admin' ? 'client' : 'admin';
    await apiFetch(`/admin/users/${id}`, { method: 'PATCH', body: { role: next } });
  });

  const toggleSuspend = () => action(async () => {
    const path = data.user.suspended_at ? 'unsuspend' : 'suspend';
    await apiFetch(`/admin/users/${id}/${path}`, { method: 'POST' });
  });

  const remove = () => {
    if (!confirm(`Supprimer définitivement ${data.user.email} ?`)) return;
    action(async () => {
      await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
      navigate('/admin/users');
    });
  };

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-20 text-center"><Loader2 className="w-6 h-6 animate-spin inline text-zinc-500" /></div>;
  if (!data) return <div className="max-w-5xl mx-auto px-4 py-20 text-center text-red-400">{error || 'Introuvable'}</div>;

  const { user, credit_history = [], instances, total_spent } = data;
  const isSelf = me?.id === user.id;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <Link to="/admin/users" className="hb-rise inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-red-400 mb-6">
        <ArrowLeft className="w-3 h-3" /> Retour
      </Link>

      <div className="hb-rise mb-8 flex items-center gap-5" style={{ animationDelay: '80ms' }}>
        <Avatar name={user.name} email={user.email} size="xl" />
        <div className="min-w-0">
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-orange-400 mb-2">Utilisateur #{user.id}</p>
          <h1 className="font-display text-4xl md:text-5xl font-black tracking-tighter uppercase text-white mb-1 truncate">@{user.username}</h1>
          <p className="text-zinc-400 text-sm truncate">{user.name} · <span className="font-mono">{user.email}</span></p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded p-3 text-sm text-red-400 font-bold">{error}</div>
      )}

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="hb-rise bg-zinc-900 border-2 border-zinc-800 rounded-sm p-5" style={{ animationDelay: '160ms' }}>
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 mb-2">Crédits</p>
          <p className="font-display text-4xl font-black text-yellow-400">{Math.trunc(Number(user.credits))}</p>
        </div>
        <div className="hb-rise bg-zinc-900 border-2 border-zinc-800 rounded-sm p-5" style={{ animationDelay: '240ms' }}>
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 mb-2">Total dépensé</p>
          <p className="font-display text-4xl font-black text-red-400">{Math.trunc(total_spent)} €</p>
        </div>
        <div className="hb-rise bg-zinc-900 border-2 border-zinc-800 rounded-sm p-5" style={{ animationDelay: '320ms' }}>
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 mb-2">Instances</p>
          <p className="font-display text-4xl font-black text-white">{instances.length}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Actions */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border-2 border-zinc-800 rounded-sm p-6">
            <h2 className="font-display text-xl font-black uppercase tracking-tight text-white mb-4 flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-400" /> Ajuster les crédits
            </h2>
            <div className="space-y-3">
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Montant"
                className="w-full bg-zinc-950 border border-zinc-800 rounded py-2.5 px-3 text-sm font-bold focus:border-red-400 focus:outline-none"
              />
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Raison (optionnel)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded py-2.5 px-3 text-sm focus:border-red-400 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={busy || !amount}
                  onClick={() => adjustCredits(1)}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-black py-2.5 rounded-sm text-xs uppercase tracking-widest disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" /> Créditer
                </button>
                <button
                  disabled={busy || !amount}
                  onClick={() => adjustCredits(-1)}
                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-black py-2.5 rounded-sm text-xs uppercase tracking-widest disabled:opacity-40"
                >
                  <Minus className="w-4 h-4" /> Débiter
                </button>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border-2 border-zinc-800 rounded-sm p-6">
            <h2 className="font-display text-xl font-black uppercase tracking-tight text-white mb-4">Compte</h2>
            <div className="space-y-2">
              <button
                onClick={toggleRole}
                disabled={busy || isSelf}
                className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-orange-600 text-white font-bold py-2.5 rounded-sm text-xs uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShieldCheck className="w-4 h-4" />
                {user.role === 'admin' ? 'Rétrograder en client' : 'Promouvoir admin'}
              </button>
              <button
                onClick={toggleSuspend}
                disabled={busy || isSelf}
                className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-red-600 text-white font-bold py-2.5 rounded-sm text-xs uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Ban className="w-4 h-4" />
                {user.suspended_at ? 'Réactiver le compte' : 'Suspendre le compte'}
              </button>
              <button
                onClick={remove}
                disabled={busy || isSelf}
                className="w-full flex items-center justify-center gap-2 bg-red-700 hover:bg-red-600 text-white font-black py-2.5 rounded-sm text-xs uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </div>
            {isSelf && (
              <p className="text-[10px] font-mono text-zinc-500 mt-3">Actions désactivées sur votre propre compte.</p>
            )}
          </div>
        </div>

        {/* Historique */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border-2 border-zinc-800 rounded-sm p-6">
            <h2 className="font-display text-xl font-black uppercase tracking-tight text-white mb-4">Historique crédits</h2>
            {credit_history.length === 0 && <p className="text-sm text-zinc-500">Aucun mouvement.</p>}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {credit_history.map((e, idx) => {
                const positive = Number(e.amount) >= 0;
                let Icon, label, sub;
                if (e.kind === 'admin_adjustment') {
                  Icon = Wrench;
                  label = e.reason || 'Ajustement admin';
                  sub = `Admin · ${e.admin_name || 'inconnu'}`;
                } else if (e.kind === 'credit_purchase') {
                  Icon = ShoppingCart;
                  label = `Achat de crédits`;
                  sub = `Paiement · ${Number(e.euros).toFixed(2)} €`;
                } else {
                  Icon = Server;
                  label = `Déploiement instance${e.instance_name ? ` · ${e.instance_name}` : ''}`;
                  sub = `Achat instance #${e.instance_id}`;
                }
                return (
                  <div key={idx} className="flex items-start justify-between gap-3 py-2 border-b border-zinc-800/60 last:border-0">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${positive ? 'text-green-400' : 'text-red-400'}`} />
                      <div className="min-w-0">
                        <p className="text-xs text-zinc-300 truncate">{label}</p>
                        <p className="text-[10px] font-mono text-zinc-600 mt-0.5">
                          {sub} · {new Date(e.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <span className={`font-mono font-black text-sm shrink-0 ${positive ? 'text-green-400' : 'text-red-400'}`}>
                      {positive ? '+' : ''}{Math.trunc(Number(e.amount))}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-zinc-900 border-2 border-zinc-800 rounded-sm p-6">
            <h2 className="font-display text-xl font-black uppercase tracking-tight text-white mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-red-400" /> Instances
            </h2>
            {instances.length === 0 && <p className="text-sm text-zinc-500">Aucune instance.</p>}
            <div className="space-y-2">
              {instances.map((i) => (
                <div key={i.id} className="flex items-center justify-between py-2 border-b border-zinc-800/60 last:border-0">
                  <span className="font-bold text-sm text-white">{i.instance_name}</span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">{i.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetail;
