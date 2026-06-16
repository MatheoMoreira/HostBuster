import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ghost, LayoutDashboard, LogOut, Coins } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ setShowLogin, setIsSignUp }) => {
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-zinc-900/50 backdrop-blur-md border-b border-zinc-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-full border-2 border-white">
              <Ghost className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter italic text-white uppercase">
              Host<span className="text-red-600">Buster</span>
            </span>
          </Link>

          <div className="flex items-center gap-6">
            {isLoggedIn && (
              <>
                <span className="hidden sm:flex items-center gap-2 text-sm font-bold text-yellow-400">
                  <Coins className="w-4 h-4" /> {user?.credits ?? 0} crédits
                </span>
                <Link to="/dashboard" className="text-sm font-bold text-zinc-400 hover:text-cyan-400 transition-colors flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
              </>
            )}
            {!isLoggedIn ? (
              <>
                <button onClick={() => { setIsSignUp(false); setShowLogin(true); }} className="text-sm font-bold text-zinc-400 hover:text-cyan-400 transition-colors">
                  Connexion
                </button>
                <button onClick={() => { setIsSignUp(true); setShowLogin(true); }} className="bg-red-600 text-white px-6 py-2.5 rounded-sm font-black text-sm hover:bg-red-700 transition-all uppercase tracking-widest">
                  S'inscrire
                </button>
              </>
            ) : (
              <button onClick={handleLogout} title="Se déconnecter" className="text-zinc-500 hover:text-red-500 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
