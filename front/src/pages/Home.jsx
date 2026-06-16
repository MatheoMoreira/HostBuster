import React, { useState } from 'react';
import { Zap, Check, ArrowRight, ShieldCheck, Globe } from 'lucide-react';
import { appTypes, getPlansByApp, getAppByKey } from '../data/Constants';

const Home = ({ handleOrder }) => {
    const [activeTab, setActiveTab] = useState('wordpress');
    const currentPlans = getPlansByApp(activeTab);

    return (
        <>
            <header className="py-24 text-center px-4 relative">
                <div className="hb-rise inline-flex items-center gap-2 bg-zinc-900 border border-zinc-700 text-cyan-400 px-4 py-2 rounded-full text-[10px] font-black mb-8 uppercase tracking-widest">
                    <Zap className="w-3 h-3 fill-current" /> Infrastructure Cloud Haute Performance
                </div>
                <h1 className="hb-rise font-display text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-[0.9] uppercase" style={{ animationDelay: '80ms' }}>
                    La performance sans compromis <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">pour vos serveurs.</span>
                </h1>
                <p className="hb-rise max-w-2xl mx-auto text-lg text-zinc-400 leading-relaxed font-medium" style={{ animationDelay: '160ms' }}>
                    Hébergement haute disponibilité, monitoring en temps réel et déploiement instantané.
                    HostBuster simplifie la gestion de votre infrastructure technique.
                </p>
            </header>

            <section className="max-w-7xl mx-auto px-4 mb-20">
                <div className="flex flex-wrap justify-center gap-4 mb-12">
                    {appTypes.map((app) => (
                        <button
                            key={app.id}
                            onClick={() => setActiveTab(app.id)}
                            className={`flex items-center gap-3 px-8 py-4 rounded-sm font-black transition-all border-2 uppercase text-xs tracking-tighter ${activeTab === app.id
                                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                                : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700'
                                }`}
                        >
                            {app.name}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {currentPlans.map((plan, index) => (
                        <div
                            key={index}
                            style={{ animationDelay: `${index * 90}ms` }}
                            className="hb-rise group relative bg-zinc-900 rounded-sm p-8 border-2 border-zinc-800 transition-all duration-300 hover:-translate-y-1.5 hover:border-cyan-500/50 hover:shadow-[0_18px_50px_-20px_rgba(34,211,238,0.4)]"
                        >
                            <div className="mb-8">
                                <h3 className="font-display text-3xl font-black mb-1 uppercase text-white">{plan.name}</h3>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Configuration recommandée</p>
                            </div>
                            <div className="mb-8 flex items-baseline gap-1">
                                <span className="font-display text-5xl font-black">{plan.price}</span>
                                <span className="text-zinc-500 font-bold text-xs uppercase tracking-widest">crédits /mois</span>
                            </div>
                            <div className="space-y-4 mb-10">
                                {plan.features.map((feature, fIndex) => (
                                    <div key={fIndex} className="flex items-center gap-3 text-sm text-zinc-300">
                                        <Check className="w-4 h-4 text-cyan-400" /> {feature}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => handleOrder(plan, getAppByKey(activeTab))}
                                className="w-full py-4 rounded-sm font-black text-xs uppercase tracking-widest transition-all bg-zinc-800 text-white hover:bg-cyan-500 hover:text-black"
                            >
                                Sélectionner l'offre
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            <section className="max-w-5xl mx-auto mt-32 px-4 pb-20">
                <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-12">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="font-display text-5xl font-black mb-8 leading-tight uppercase tracking-tighter text-white">Sécurité et isolation des données.</h2>
                            <div className="space-y-8">
                                <div className="flex gap-5">
                                    <ShieldCheck className="w-6 h-6 text-cyan-400 shrink-0" />
                                    <div>
                                        <h4 className="font-black mb-1 uppercase text-sm text-white">Isolation réseau</h4>
                                        <p className="text-zinc-500 text-sm">Chaque instance bénéficie d'une segmentation complète au niveau du kernel.</p>
                                    </div>
                                </div>
                                <div className="flex gap-5">
                                    <Globe className="w-6 h-6 text-cyan-400 shrink-0" />
                                    <div>
                                        <h4 className="font-black mb-1 uppercase text-sm text-white">Centres de données Tier III</h4>
                                        <p className="text-zinc-500 text-sm">Serveurs localisés dans des infrastructures hautement sécurisées en Europe.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-zinc-950 border border-zinc-800 p-10 rounded-sm text-center">
                            <h3 className="font-display text-7xl font-black mb-2 text-cyan-400">99.9%</h3>
                            <p className="font-black uppercase tracking-widest text-[10px] text-zinc-500">Disponibilité garantie (SLA)</p>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default Home;