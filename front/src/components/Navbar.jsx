import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Ghost, Home, LayoutDashboard, LogOut, Coins, ShieldCheck, Plus, HelpCircle, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

const Navbar = ({ setShowLogin, setIsSignUp }) => {
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    `text-sm font-bold transition-colors flex items-center gap-2 ${
      isActive ? 'text-red-500' : 'text-zinc-400 hover:text-red-400'
    }`;

  // Liens affichés au centre. `to` + `label` + `icon`, filtrés selon le rôle.
  const navLinks = [
    { to: '/', label: 'Accueil', icon: Home, show: true, end: true },
    { to: '/faq', label: 'FAQ', icon: HelpCircle, show: true },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, show: isLoggedIn },
    { to: '/admin/users', label: 'Admin', icon: ShieldCheck, show: isLoggedIn && user?.role === 'admin', admin: true },
  ];

  const renderLinks = (onClick) =>
    navLinks
      .filter((l) => l.show)
      .map((l) => {
        const Icon = l.icon;
        return (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            onClick={onClick}
            className={({ isActive }) =>
              `${linkClass({ isActive })} ${l.admin && !isActive ? 'text-orange-400 hover:text-orange-300' : ''}`
            }
          >
            <Icon className="w-4 h-4" /> {l.label}
          </NavLink>
        );
      });

  return (
    <nav className="bg-zinc-900/50 backdrop-blur-md border-b border-zinc-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="bg-red-600 p-2 rounded-full border-2 border-white">
              <Ghost className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter italic text-white uppercase">
              Host<span className="text-red-600">Buster</span>
            </span>
          </Link>

          {/* Liens centraux (desktop) */}
          <div className="hidden md:flex items-center gap-6">
            {renderLinks()}
          </div>

          {/* Actions (desktop) */}
          <div className="hidden md:flex items-center gap-6">
            {isLoggedIn && (
              <Link
                to="/credits"
                className="flex items-center gap-2 text-sm font-bold text-yellow-400 hover:text-yellow-300 transition-colors group"
                title="Recharger des crédits"
              >
                <Coins className="w-4 h-4" />
                <span>{Math.trunc(Number(user?.credits ?? 0))} crédits</span>
                <Plus className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:rotate-90 transition-all" />
              </Link>
            )}
            {!isLoggedIn ? (
              <>
                <button onClick={() => { setIsSignUp(false); setShowLogin(true); }} className="text-sm font-bold text-zinc-400 hover:text-red-400 transition-colors">
                  Connexion
                </button>
                <button onClick={() => { setIsSignUp(true); setShowLogin(true); }} className="bg-red-600 text-white px-6 py-2.5 rounded-sm font-black text-sm hover:bg-red-700 transition-all uppercase tracking-widest">
                  S'inscrire
                </button>
              </>
            ) : (
              <>
                <Link to="/account" title="Mon compte" className="hover:ring-2 hover:ring-red-500/50 rounded-full transition-all">
                  <Avatar name={user?.name} email={user?.email} size="md" />
                </Link>
                <button onClick={handleLogout} title="Se déconnecter" className="text-zinc-500 hover:text-red-500 transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Burger (mobile) */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden text-zinc-300 hover:text-white transition-colors"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Menu mobile déroulant */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col gap-5">
            {renderLinks(() => setMobileOpen(false))}

            {isLoggedIn && (
              <>
                <Link
                  to="/account"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 text-sm font-bold text-zinc-300 hover:text-red-400 transition-colors"
                >
                  <Avatar name={user?.name} email={user?.email} size="sm" />
                  Mon compte
                </Link>
                <Link
                  to="/credits"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm font-bold text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                  <Coins className="w-4 h-4" />
                  {Math.trunc(Number(user?.credits ?? 0))} crédits
                  <Plus className="w-3.5 h-3.5 opacity-60" />
                </Link>
              </>
            )}

            <div className="pt-4 border-t border-zinc-800">
              {!isLoggedIn ? (
                <div className="flex flex-col gap-3">
                  <button onClick={() => { setIsSignUp(false); setShowLogin(true); setMobileOpen(false); }} className="text-left text-sm font-bold text-zinc-400 hover:text-red-400 transition-colors">
                    Connexion
                  </button>
                  <button onClick={() => { setIsSignUp(true); setShowLogin(true); setMobileOpen(false); }} className="bg-red-600 text-white px-6 py-2.5 rounded-sm font-black text-sm hover:bg-red-700 transition-all uppercase tracking-widest">
                    S'inscrire
                  </button>
                </div>
              ) : (
                <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-red-500 transition-colors">
                  <LogOut className="w-5 h-5" /> Se déconnecter
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
