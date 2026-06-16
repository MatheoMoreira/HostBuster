import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import InsufficientCreditsModal from './components/InsufficientCreditsModal';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Setup from './pages/Setup';
import InstanceDetails from './pages/InstanceDetails';
import Credits from './pages/Credits';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import { useAuth } from './context/AuthContext';

const App = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [insufficient, setInsufficient] = useState(null); // { need, have, order }

  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-cyan-400 selection:text-black">

      <Navbar
        setShowLogin={setShowLogin}
        setIsSignUp={setIsSignUp}
      />

      <Routes>
        <Route path="/" element={<Home handleOrder={handleOrder} />} />
        <Route path="/setup" element={<ProtectedRoute><Setup /></ProtectedRoute>} />
        <Route path="/credits" element={<ProtectedRoute><Credits /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/instance/:id" element={<ProtectedRoute><InstanceDetails /></ProtectedRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/users/:id" element={<AdminRoute><AdminUserDetail /></AdminRoute>} />
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
