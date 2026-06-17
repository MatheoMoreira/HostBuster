import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, AtSign, Coins, ShieldCheck, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

const Account = () => {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState(user?.username ?? '');
    const [firstName, setFirstName] = useState(user?.first_name ?? '');
    const [lastName, setLastName] = useState(user?.last_name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileMsg, setProfileMsg] = useState(null); // { type: 'ok'|'err', text }

    const [currentPassword, setCurrentPassword] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [savingPwd, setSavingPwd] = useState(false);
    const [pwdMsg, setPwdMsg] = useState(null);

    const profileDirty =
        username !== (user?.username ?? '') ||
        firstName !== (user?.first_name ?? '') ||
        lastName !== (user?.last_name ?? '') ||
        email !== (user?.email ?? '');

    const saveProfile = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        setProfileMsg(null);
        try {
            const updated = await apiFetch('/user', {
                method: 'PATCH',
                body: { username, first_name: firstName, last_name: lastName, email },
            });
            setUser(updated);
            setProfileMsg({ type: 'ok', text: 'Profil mis à jour.' });
        } catch (err) {
            const text = err.errors ? Object.values(err.errors)[0][0] : (err.message || 'Erreur.');
            setProfileMsg({ type: 'err', text });
        } finally {
            setSavingProfile(false);
        }
    };

    const savePassword = async (e) => {
        e.preventDefault();
        if (password !== passwordConfirm) {
            setPwdMsg({ type: 'err', text: 'Les mots de passe ne correspondent pas.' });
            return;
        }
        setSavingPwd(true);
        setPwdMsg(null);
        try {
            await apiFetch('/user', {
                method: 'PATCH',
                body: {
                    current_password: currentPassword,
                    password,
                    password_confirmation: passwordConfirm,
                },
            });
            setPwdMsg({ type: 'ok', text: 'Mot de passe modifié.' });
            setCurrentPassword('');
            setPassword('');
            setPasswordConfirm('');
        } catch (err) {
            const text = err.errors ? Object.values(err.errors)[0][0] : (err.message || 'Erreur.');
            setPwdMsg({ type: 'err', text });
        } finally {
            setSavingPwd(false);
        }
    };

    const inputClass =
        'w-full bg-zinc-950 border border-zinc-800 rounded-sm px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-red-500 focus:outline-none transition-colors';

    const Banner = ({ msg }) =>
        msg ? (
            <div className={`flex items-center gap-2 text-xs font-bold p-3 rounded-sm ${
                msg.type === 'ok'
                    ? 'text-green-400 bg-green-500/10 border border-green-500/30'
                    : 'text-red-400 bg-red-500/10 border border-red-500/30'
            }`}>
                {msg.type === 'ok' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {msg.text}
            </div>
        ) : null;

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <div className="hb-rise mb-10">
                <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-red-400 mb-2">Compte</p>
                <h1 className="font-display text-4xl md:text-5xl font-black tracking-tighter uppercase text-white">Mon compte</h1>
            </div>

            {/* En-tête identité */}
            <div className="hb-rise flex items-center gap-5 bg-zinc-900 border-2 border-zinc-800 rounded-sm p-6 mb-6">
                <Avatar name={user?.name} email={user?.email} size="xl" />
                <div className="min-w-0">
                    <h2 className="font-display text-2xl font-black uppercase tracking-tight text-white truncate">{user?.name}</h2>
                    <p className="text-sm text-red-400 font-bold truncate">@{user?.username}</p>
                    <p className="text-sm text-zinc-400 truncate">{user?.email}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-1 rounded-sm">
                            <Coins className="w-3.5 h-3.5" /> {Math.trunc(Number(user?.credits ?? 0))} crédits
                        </span>
                        {user?.role === 'admin' && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2.5 py-1 rounded-sm">
                                <ShieldCheck className="w-3.5 h-3.5" /> Administrateur
                            </span>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => navigate('/credits')}
                    className="ml-auto hidden sm:inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2.5 rounded-sm font-black text-xs uppercase tracking-widest transition-colors shrink-0"
                >
                    Recharger <ArrowRight className="w-4 h-4" />
                </button>
            </div>

            {/* Profil */}
            <form onSubmit={saveProfile} className="hb-rise bg-zinc-900 border-2 border-zinc-800 rounded-sm p-6 mb-6 space-y-4" style={{ animationDelay: '80ms' }}>
                <h3 className="font-display text-xl font-black uppercase tracking-tight text-white">Informations</h3>

                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2 mb-2">
                            <User className="w-3.5 h-3.5" /> Prénom
                        </label>
                        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} maxLength={100} />
                    </div>
                    <div>
                        <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2 mb-2">
                            <User className="w-3.5 h-3.5" /> Nom
                        </label>
                        <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} maxLength={100} />
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2 mb-2">
                        <AtSign className="w-3.5 h-3.5" /> Nom d'utilisateur
                    </label>
                    <input value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} maxLength={50} autoComplete="username" />
                </div>
                <div>
                    <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2 mb-2">
                        <Mail className="w-3.5 h-3.5" /> Email
                    </label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                </div>

                <Banner msg={profileMsg} />

                <button
                    type="submit"
                    disabled={savingProfile || !profileDirty}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-sm font-black text-xs uppercase tracking-widest transition-colors disabled:opacity-40"
                >
                    {savingProfile ? 'Enregistrement…' : 'Enregistrer'}
                </button>
            </form>

            {/* Mot de passe */}
            <form onSubmit={savePassword} className="hb-rise bg-zinc-900 border-2 border-zinc-800 rounded-sm p-6 space-y-4" style={{ animationDelay: '160ms' }}>
                <h3 className="font-display text-xl font-black uppercase tracking-tight text-white">Mot de passe</h3>

                <div>
                    <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2 mb-2">
                        <Lock className="w-3.5 h-3.5" /> Mot de passe actuel
                    </label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} autoComplete="current-password" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2 block">Nouveau mot de passe</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} autoComplete="new-password" />
                    </div>
                    <div>
                        <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2 block">Confirmation</label>
                        <input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} className={inputClass} autoComplete="new-password" />
                    </div>
                </div>
                <p className="text-[10px] text-zinc-600">Minimum 8 caractères, avec lettres et chiffres.</p>

                <Banner msg={pwdMsg} />

                <button
                    type="submit"
                    disabled={savingPwd || !currentPassword || !password}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-sm font-black text-xs uppercase tracking-widest transition-colors disabled:opacity-40"
                >
                    {savingPwd ? 'Modification…' : 'Changer le mot de passe'}
                </button>
            </form>
        </div>
    );
};

export default Account;
