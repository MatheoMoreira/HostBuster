import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import InsufficientCreditsModal from './components/InsufficientCreditsModal';
import VerifyEmailBanner from './components/VerifyEmailBanner';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import Faq from './pages/Faq';
import Dashboard from './pages/Dashboard';
import Setup from './pages/Setup';
import InstanceDetails from './pages/InstanceDetails';
import Credits from './pages/Credits';
import Account from './pages/Account';
import ResetPassword from './pages/ResetPassword';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminInstances from './pages/admin/AdminInstances';
import { useAuth } from './context/AuthContext';

const App = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [insufficient, setInsufficient] = useState(null); // { need, have, order }
  const [verifiedMsg, setVerifiedMsg] = useState(null); // 'ok' | 'invalid'

  const { isLoggedIn, user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Retour du lien de vérification d'email (?verified=1 / =invalid)
  useEffect(() => {
    const v = searchParams.get('verified');
    if (!v) return;
    setVerifiedMsg(v === '1' ? 'ok' : 'invalid');
    if (v === '1') refreshUser().catch(() => {});
    searchParams.delete('verified');
    setSearchParams(searchParams, { replace: true });
    const t = setTimeout(() => setVerifiedMsg(null), 6000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const proceedOrder = (order, currentUser) => {
    const have = Math.trunc(Number(currentUser?.credits ?? 0));
    if (have < order.plan.price) {
      setInsufficient({ need: order.plan.price, have, order });
    } else {
      navigate('/setup', { state: order });
    }
  };

  const handleOrder = (plan, app) => {
    // On retire `icon` (JSX) — non clonable par history.pushState
    // eslint-disable-next-line no-unused-vars
    const { icon, ...appSerializable } = app;
    const order = { plan, app: appSerializable };
    if (!isLoggedIn) {
      setPendingOrder(order);
      setShowLogin(true);
    } else {
      proceedOrder(order, user);
    }
  };

  const handleAuthSuccess = (freshUser) => {
    setShowLogin(false);
    if (pendingOrder) {
      const order = pendingOrder;
      setPendingOrder(null);
      proceedOrder(order, freshUser);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-red-400 selection:text-black">

      <Navbar
        setShowLogin={setShowLogin}
        setIsSignUp={setIsSignUp}
      />

      <VerifyEmailBanner />

      {verifiedMsg && (
        <div className={`max-w-7xl mx-auto px-4 mt-4 ${verifiedMsg === 'ok' ? '' : ''}`}>
          <div className={`rounded-sm px-4 py-3 text-sm font-bold border ${
            verifiedMsg === 'ok'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {verifiedMsg === 'ok'
              ? '✓ Adresse email vérifiée ! Vous avez désormais accès à toutes les fonctionnalités.'
              : 'Lien de vérification invalide ou expiré. Reconnectez-vous et renvoyez l\'email.'}
          </div>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Home handleOrder={handleOrder} />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/setup" element={<ProtectedRoute><Setup /></ProtectedRoute>} />
        <Route path="/credits" element={<ProtectedRoute><Credits /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/instance/:id" element={<ProtectedRoute><InstanceDetails /></ProtectedRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/users/:id" element={<AdminRoute><AdminUserDetail /></AdminRoute>} />
        <Route path="/admin/instances" element={<AdminRoute><AdminInstances /></AdminRoute>} />
      </Routes>

      {showLogin && (
        <LoginModal
          isSignUp={isSignUp}
          setIsSignUp={setIsSignUp}
          setShowLogin={setShowLogin}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {insufficient && (
        <InsufficientCreditsModal
          need={insufficient.need}
          have={insufficient.have}
          pendingOrder={insufficient.order}
          onClose={() => setInsufficient(null)}
        />
      )}
    </div>
  );
};

export default App;
