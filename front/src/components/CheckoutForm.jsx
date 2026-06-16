import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { ShieldCheck, AlertCircle } from 'lucide-react';

const CheckoutForm = ({ plan, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    const cardElement = elements.getElement(CardElement);

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      setError(error.message);
      setProcessing(false);
    } else {
      setError(null);
      setTimeout(() => {
        setProcessing(false);
        onSuccess();
      }, 1500);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        color: '#ffffff',
        fontFamily: 'Inter, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '14px',
        '::placeholder': {
          color: '#52525b',
        },
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-zinc-950 border border-zinc-800 p-4 rounded">
        <label className="text-[10px] font-black uppercase text-zinc-500 block mb-3">Informations de carte</label>
        <CardElement options={cardElementOptions} />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase border border-red-500/20 bg-red-500/5 p-3 rounded">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <button
        disabled={!stripe || processing}
        className="w-full bg-white text-black font-black py-4 rounded-sm hover:bg-cyan-400 disabled:opacity-50 transition-all uppercase tracking-widest text-xs"
      >
        {processing ? 'Validation...' : `Régler ${(plan.price / 100).toFixed(2)} € (${plan.price} crédits)`}
      </button>

      <div className="flex items-center justify-center gap-2 text-zinc-600">
        <ShieldCheck className="w-4 h-4" />
        <span className="text-[9px] font-black uppercase tracking-widest">Paiement sécurisé par Stripe</span>
      </div>
    </form>
  );
};

export default CheckoutForm;