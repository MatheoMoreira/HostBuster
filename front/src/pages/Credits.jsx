import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Coins, ShieldCheck, AlertCircle, Check, ArrowRight } from 'lucide-react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Wealth from '../components/Wealth';

const stripePromise = loadStripe('pk_test_51T7K4VHiOHmpM5ATqKjg4ruDBjo0RpB8xEg2HBTJJbfvQH8lVRtznIyWRWM3rnTVIQ6QSrUhgNpkGUvoRixWJmwJ00kYetPUHm');

const TIERS = [
  { value: 500,   label: 'Découverte' },
  { value: 1000,  label: 'Standard' },
  { value: 2500,  label: 'Confort' },
  { value: 5000,  label: 'Pro' },
  { value: 10000, label: 'Business' },
  { value: 25000, label: 'Enterprise' },
];

const Form = ({ credits, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError(null);

    const { error: stripeError } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardElement),
    });
    if (stripeError) {
      setError(stripeError.message);
      setProcessing(false);
      return;
    }

    try {
      const res = await apiFetch('/credits/recharge', {
        method: 'POST',
        body: { credits },
      });
      onSuccess(res.credits);
    } catch (e) {
      setError(e.message || 'Erreur de recharge.');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="bg-zinc-950 border border-zinc-800 p-4 rounded">
        <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 block mb-3">Carte bancaire</label>
        <CardElement options={{
          style: { base: { color: '#fff', fontFamily: 'Outfit, sans-serif', fontSize: '14px', '::placeholder': { color: '#52525b' } }, invalid: { color: '#ef4444' } }
        }} />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-500/10 border border-red-500/30 p-3 rounded">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="group w-full bg-yellow-500 text-black font-black py-5 rounded-sm hover:bg-yellow-400 active:scale-[0.99] transition-all uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {processing ? 'Validation…' : <>Payer {(credits / 100).toFixed(2)} € · +{credits} crédits <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
      </button>

      <p className="flex items-center justify-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-600">
        <ShieldCheck className="w-3 h-3" /> Paiement sécurisé par Stripe
      </p>
    </form>
  );
};

const Credits = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const need = state?.need || 0;
  const returnTo = state?.returnTo;
  const returnState = state?.returnState;

  // Pré-sélectionne le plus petit palier qui couvre le besoin, sinon "Pro"
  const defaultTier = useMemo(() => {
    if (need > 0) return TIERS.find((t) => t.value >= need) || TIERS[TIERS.length - 1];
    return TIERS[1];
  }, [need]);

  const [selected, setSelected] = useState(defaultTier.value);
  const [success, setSuccess] = useState(false);

  const handleSuccess = (newCredits) => {
    setUser({ ...user, credits: newCredits });
    setSuccess(true);
    setTimeout(() => {
      if (returnTo) navigate(returnTo, { state: returnState });
      else navigate('/dashboard');
    }, 1200);
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="font-display text-3xl font-black uppercase text-white mb-2">Crédits ajoutés</h2>
        <p className="text-zinc-400">Redirection…</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="hb-rise mb-8">
        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-yellow-400 mb-2">Compte · Crédits</p>
        <h1 className="font-display text-4xl md:text-5xl font-black tracking-tighter uppercase text-white">
          Recharger des crédits
        </h1>
        <p className="text-zinc-400 mt-2 flex items-center gap-2 flex-wrap">
          <Coins className="w-4 h-4 text-yellow-400" />
          Solde actuel : <span className="font-mono font-bold text-yellow-400">{Math.trunc(Number(user?.credits ?? 0))}</span> crédits
          <span className="text-zinc-600 text-xs">· 1 € = 100 crédits</span>
        </p>
      </div>

      {need > 0 && (
        <div className="hb-rise mb-6 flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded p-4" style={{ animationDelay: '60ms' }}>
          <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
          <p className="text-sm text-zinc-300">
            Vous avez besoin d'au moins <span className="font-bold text-yellow-400">{need} crédits</span> pour finaliser votre commande.
          </p>
        </div>
      )}

      {/* Grille 3×2 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {TIERS.map((t, i) => {
          const isSelected = selected === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setSelected(t.value)}
              style={{ animationDelay: `${i * 70}ms` }}
              className={`hb-rise group relative h-44 flex flex-col items-center justify-center gap-1 rounded-sm border-2 p-4 transition-all overflow-hidden ${
                isSelected
                  ? 'border-yellow-400 bg-yellow-500/5 shadow-[0_18px_50px_-20px_rgba(250,204,21,0.55)] -translate-y-1'
                  : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:-translate-y-0.5'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-black" strokeWidth={3} />
                </div>
              )}

              <p className={`absolute top-3 left-3 text-[10px] font-mono font-bold uppercase tracking-[0.2em] ${isSelected ? 'text-yellow-400' : 'text-zinc-500'}`}>
                {t.label}
              </p>

              <div className="flex-1 flex items-center justify-center pt-3">
                <div className="w-14 h-14 md:w-16 md:h-16">
                  <Wealth tier={i} />
                </div>
              </div>

              <div className="text-center mt-2">
                <p className="font-display text-2xl md:text-3xl font-black text-white leading-none">
                  {t.value.toLocaleString('fr-FR').replace(',', ' ')}
                  <span className="text-[10px] font-mono text-zinc-500 ml-1.5 align-middle">crédits</span>
                </p>
                <p className="text-xs font-mono font-bold text-zinc-500 mt-1">{(t.value / 100).toFixed(2)} €</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Récap + paiement */}
      <div className="grid md:grid-cols-5 gap-6">
        <div className="hb-rise md:col-span-2 bg-zinc-900 border-2 border-zinc-800 rounded-sm p-6 self-start" style={{ animationDelay: '500ms' }}>
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">Récapitulatif</p>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-20 h-20 shrink-0">
              <Wealth tier={TIERS.findIndex((t) => t.value === selected)} />
            </div>
            <div>
              <p className="font-display text-3xl font-black text-yellow-400">+{selected.toLocaleString('fr-FR').replace(',', ' ')}</p>
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">crédits</p>
            </div>
          </div>
          <div className="pt-4 border-t border-zinc-800 flex justify-between items-baseline">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">Total</span>
            <span className="font-display text-3xl font-black text-white">{(selected / 100).toFixed(2)} €</span>
          </div>
        </div>

        <div className="hb-rise md:col-span-3 bg-zinc-900 border-2 border-zinc-800 rounded-sm p-6" style={{ animationDelay: '560ms' }}>
          <h3 className="font-display text-xl font-black uppercase tracking-tight text-white mb-5">Paiement</h3>
          <Elements stripe={stripePromise}>
            <Form credits={selected} onSuccess={handleSuccess} />
          </Elements>
        </div>
      </div>
    </div>
  );
};

export default Credits;
