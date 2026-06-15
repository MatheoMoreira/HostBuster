import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/navbar';
import LoginModal from './components/LoginModal';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Payment from './pages/Payment';
import Setup from './pages/Setup';
import InstanceDetails from './pages/InstanceDetails';

const App = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  const navigate = useNavigate();

  const handleOrder = (plan) => {
    setSelectedPlan(plan);
    if (!isLoggedIn) {
      setShowLogin(true);
    } else {
      navigate('/payment', { state: { plan } });
    }
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowLogin(false);
    // Si l'utilisateur était en train de commander, on le redirige vers le paiement
    if (selectedPlan) {
      navigate('/payment', { state: { plan: selectedPlan } });
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-cyan-400 selection:text-black">
      <div className="h-1.5 bg-[repeating-linear-gradient(45deg,#facc15,#facc15_10px,#000_10px,#000_20px)] w-full"></div>

      <Navbar 
        isLoggedIn={isLoggedIn} 
        setShowLogin={setShowLogin} 
        setIsLoggedIn={setIsLoggedIn}
        setIsSignUp={setIsSignUp}
      />

      <Routes>
        <Route path="/" element={<Home handleOrder={handleOrder} />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/instance/:id" element={<InstanceDetails />} />
      </Routes>

      {showLogin && (
        <LoginModal 
          isSignUp={isSignUp} 
          setIsSignUp={setIsSignUp} 
          setShowLogin={setShowLogin} 
          handleLogin={handleLogin} 
        />
      )}
    </div>
  );
};

export default App;