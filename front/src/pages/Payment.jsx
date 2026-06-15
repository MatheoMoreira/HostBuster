import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';

const stripePromise = loadStripe('pk_test_51T7K4VHiOHmpM5ATqKjg4ruDBjo0RpB8xEg2HBTJJbfvQH8lVRtznIyWRWM3rnTVIQ6QSrUhgNpkGUvoRixWJmwJ00kYetPUHm');

const Payment = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const plan = state?.plan || { name: 'Plan Standard', price: '24.99' };

  const handleSuccess = () => {
    navigate('/setup', { state: { plan } });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="grid md:grid-cols-3 gap-12">
        <div className="md:col-span-2">
          <h2 className="text-2xl font-black uppercase tracking-tight mb-8 text-white">Finaliser la commande</h2>
          
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-sm">
            <Elements stripe={stripePromise}>
              <CheckoutForm plan={plan} onSuccess={handleSuccess} />
            </Elements>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm">
            <h3 className="font-black uppercase text-xs text-zinc-500 mb-6 border-b border-zinc-800 pb-2">Récapitulatif</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-white uppercase tracking-tighter">{plan.name}</span>
                <span className="text-sm font-black">{plan.price} €</span>
              </div>
              <div className="flex justify-between items-center text-zinc-500">
                <span className="text-[10px] font-bold uppercase">TVA (20%)</span>
                <span className="text-[10px] font-bold">Incluse</span>
              </div>
              <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
                <span className="text-sm font-black uppercase text-cyan-400">Total</span>
                <span className="text-xl font-black text-cyan-400">{plan.price} €</span>
              </div>
            </div>
          </div>

          <div className="p-4 border border-zinc-800 rounded-sm">
            <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
              En confirmant le paiement, vous acceptez les conditions générales de vente de HostBuster. Votre abonnement commencera immédiatement après le déploiement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;