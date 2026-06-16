import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Payment from './pages/Payment';
import Setup from './pages/Setup';
import InstanceDetails from './pages/InstanceDetails';
import { useAuth } from './context/AuthContext';

const App = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const handleOrder = (plan) => {
    setSelectedPlan(plan);
    if (!isLoggedIn) {
      setShowLogin(true);
    } else {
      navigate('/payment', { state: { plan } });
    }
  };

  // Appelé par LoginModal après une connexion/inscription réussie.
  const handleAuthSuccess = () => {
    setShowLogin(false);
    if (selectedPlan) {
      navigate('/payment', { state: { plan: selectedPlan } });
      setSelectedPlan(null);
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
        <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        <Route path="/setup" element={<ProtectedRoute><Setup /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/instance/:id" element={<ProtectedRoute><InstanceDetails /></ProtectedRoute>} />
      </Routes>

      {showLogin && (
        <LoginModal
          isSignUp={isSignUp}
          setIsSignUp={setIsSignUp}
          setShowLogin={setShowLogin}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
};

export default App;
