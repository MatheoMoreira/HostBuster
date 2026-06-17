import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Zap, Check, ArrowRight, ShieldCheck, Globe,
    MousePointerClick, CreditCard, Rocket, Server, Cpu, Database, Clock,
    HelpCircle, Coins,
} from 'lucide-react';
import { appTypes, getPlansByApp, getAppByKey } from '../data/Constants';

const STATS = [
    { value: '~60s', label: 'Déploiement moyen', icon: Rocket },
    { value: '4', label: 'Applications prêtes à l\'emploi', icon: Server },
    { value: '99.9%', label: 'SLA disponibilité', icon: ShieldCheck },
    { value: '24/7', label: 'Supervision active', icon: Clock },
];

const STEPS = [
    { n: '01', title: 'Choisissez votre app', desc: 'WordPress, Minecraft, Odoo ou GLPI — sélectionnez en un clic depuis le catalogue.', icon: MousePointerClick },
    { n: '02', title: 'Sélectionnez un plan', desc: 'Trois configurations CPU/RAM/stockage par app. Payez en crédits, ajustables à tout moment.', icon: CreditCard },
    { n: '03', title: 'C\'est en ligne', desc: 'Votre instance est provisionnée et accessible en moins d\'une minute. Aucune installation manuelle.', icon: Rocket },
];

const Home = ({ handleOrder }) => {
    const [activeTab, setActiveTab] = useState('wordpress');
    const currentPlans = getPlansByApp(activeTab);

    return (
        <>
            {/* === HERO === */}
            <header className="py-24 text-center px-4 relative overflow-hidden">
                <div className="absolute inset-0 -z-10 opacity-30 pointer-events-none">
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-500/20 rounded-full blur-[120px]" />
                </div>
                <div className="hb-rise inline-flex items-center gap-2 bg-zinc-900 border border-zinc-700 text-red-400 px-4 py-2 rounded-full text-[10px] font-black mb-8 uppercase tracking-widest">
                    <Zap className="w-3 h-3 fill-current" /> Infrastructure Cloud Haute Performance
                </div>
                <h1 className="hb-rise font-display text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-[0.9] uppercase" style={{ animationDelay: '80ms' }}>
                    Ne laissez plus la latence <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-200">Hanter vos serveurs.</span>
                </h1>
                <p className="hb-rise max-w-2xl mx-auto text-lg text-zinc-400 leading-relaxed font-medium" style={{ animationDelay: '160ms' }}>
                    Hébergement haute disponibilité, monitoring en temps réel et déploiement instantané.
                    HostBuster simplifie la gestion de votre infrastructure technique.
                </p>
            </header>

            {/* === STATS BAR === */}
            <section className="max-w-7xl mx-auto px-4 mb-24">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-zinc-800 border border-zinc-800 rounded-sm overflow-hidden">
                    {STATS.map(({ value, label, icon: Icon }, i) => (
                        <div key={i} className="bg-zinc-950 px-6 py-8 text-center">
                            <Icon className="w-5 h-5 text-red-400 mx-auto mb-3" />
                            <p className="font-display text-3xl md:text-4xl font-black text-white mb-1">{value}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* === COMMENT ÇA MARCHE === */}
            <section className="max-w-7xl mx-auto px-4 mb-24">
                <div className="text-center mb-16">
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-3">Process</p>
                    <h2 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
                        De l'idée à la prod, <br className="hidden md:block" />
                        <span className="text-red-400">en trois clics.</span>
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                    {STEPS.map(({ n, title, desc, icon: Icon }, i) => (
                        <div key={i} className="hb-rise relative bg-zinc-900 border-2 border-zinc-800 rounded-sm p-8 group hover:border-red-500/40 transition-colors" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="flex items-start justify-between mb-6">
                                <span className="font-display font-black text-5xl text-zinc-800 group-hover:text-red-500/30 transition-colors">{n}</span>
                                <Icon className="w-7 h-7 text-red-400" />
                            </div>
                            <h3 className="font-display text-xl font-black uppercase tracking-tight text-white mb-3">{title}</h3>
                            <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
                            {i < STEPS.length - 1 && (
                                <ArrowRight className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-700 z-10" />
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* === PRICING === */}
            <section className="max-w-7xl mx-auto px-4 mb-24">
                <div className="text-center mb-12">
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-3">Pricing</p>
                    <h2 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-2">Choisissez votre app</h2>
                    <p className="text-zinc-500 text-sm">Crédits flexibles · ajustables à tout moment · pas d'engagement</p>
                </div>

                <div className="flex flex-wrap justify-center gap-3 mb-12">
                    {appTypes.map((app) => (
                        <button
                            key={app.id}
                            onClick={() => setActiveTab(app.id)}
                            className={`flex items-center gap-3 px-6 py-3.5 rounded-sm font-black transition-all border-2 uppercase text-xs tracking-tighter ${activeTab === app.id
                                ? 'border-red-500 bg-red-500/10 text-red-400'
                                : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                                }`}
                        >
                            {app.icon}
                            {app.name}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {currentPlans.map((plan, index) => {
                        const popular = index === 1;
                        return (
                            <div
                                key={index}
                                style={{ animationDelay: `${index * 90}ms` }}
                                className={`hb-rise group relative bg-zinc-900 rounded-sm p-8 border-2 transition-all duration-300 hover:-translate-y-1.5 ${popular
                                    ? 'border-red-500 shadow-[0_18px_50px_-20px_rgba(239,68,68,0.5)] md:scale-105'
                                    : 'border-zinc-800 hover:border-red-500/50 hover:shadow-[0_18px_50px_-20px_rgba(239,68,68,0.4)]'
                                    }`}
                            >
                                {popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-sm">
                                        Le plus populaire
                                    </div>
                                )}
                                <div className="mb-8">
                                    <h3 className="font-display text-3xl font-black mb-1 uppercase text-white">{plan.name}</h3>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Configuration recommandée</p>
                                </div>
                                <div className="mb-8 flex items-baseline gap-1.5">
                                    <span className="font-display text-5xl font-black">{plan.price}</span>
                                    <Coins className="w-4 h-4 text-yellow-400 self-center" />
                                    <span className="text-zinc-500 font-bold text-xs uppercase tracking-widest">crédits /mois</span>
                                </div>
                                <div className="space-y-4 mb-10">
                                    {plan.features.map((feature, fIndex) => (
                                        <div key={fIndex} className="flex items-center gap-3 text-sm text-zinc-300">
                                            <Check className="w-4 h-4 text-red-400" /> {feature}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => handleOrder(plan, getAppByKey(activeTab))}
                                    className={`w-full py-4 rounded-sm font-black text-xs uppercase tracking-widest transition-all ${popular
                                        ? 'bg-red-500 text-black hover:bg-red-400'
                                        : 'bg-zinc-800 text-white hover:bg-red-500 hover:text-black'
                                        }`}
                                >
                                    Sélectionner l'offre
                                </button>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* === SÉCURITÉ === */}
            <section className="max-w-5xl mx-auto px-4 mb-24">
                <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-12">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-3">Sécurité</p>
                            <h2 className="font-display text-4xl md:text-5xl font-black mb-8 leading-tight uppercase tracking-tighter text-white">Vos données restent vos données.</h2>
                            <div className="space-y-7">
                                <div className="flex gap-5">
                                    <ShieldCheck className="w-6 h-6 text-red-400 shrink-0" />
                                    <div>
                                        <h4 className="font-black mb-1 uppercase text-sm text-white">Isolation réseau</h4>
                                        <p className="text-zinc-500 text-sm">Chaque instance bénéficie d'une segmentation complète au niveau du kernel.</p>
                                    </div>
                                </div>
                                <div className="flex gap-5">
                                    <Globe className="w-6 h-6 text-red-400 shrink-0" />
                                    <div>
                                        <h4 className="font-black mb-1 uppercase text-sm text-white">Datacenters Tier III · UE</h4>
                                        <p className="text-zinc-500 text-sm">Serveurs localisés en France et en Allemagne. Conformité RGPD garantie.</p>
                                    </div>
                                </div>
                                <div className="flex gap-5">
                                    <Database className="w-6 h-6 text-red-400 shrink-0" />
                                    <div>
                                        <h4 className="font-black mb-1 uppercase text-sm text-white">Sauvegardes auto</h4>
                                        <p className="text-zinc-500 text-sm">Backups quotidiens chiffrés, restauration en 1-clic depuis le dashboard.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-zinc-950 border border-zinc-800 p-10 rounded-sm text-center">
                            <h3 className="font-display text-7xl font-black mb-2 text-red-400">99.9%</h3>
                            <p className="font-black uppercase tracking-widest text-[10px] text-zinc-500 mb-8">Disponibilité garantie (SLA)</p>
                            <div className="grid grid-cols-2 gap-3 text-left">
                                <div className="border border-zinc-800 px-3 py-2 rounded-sm">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Conformité</p>
                                    <p className="text-xs font-black text-white">RGPD</p>
                                </div>
                                <div className="border border-zinc-800 px-3 py-2 rounded-sm">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Datacenter</p>
                                    <p className="text-xs font-black text-white">Tier III</p>
                                </div>
                                <div className="border border-zinc-800 px-3 py-2 rounded-sm">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Chiffrement</p>
                                    <p className="text-xs font-black text-white">AES-256</p>
                                </div>
                                <div className="border border-zinc-800 px-3 py-2 rounded-sm">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Support</p>
                                    <p className="text-xs font-black text-white">24/7</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* === FAQ TEASER === */}
            <section className="max-w-3xl mx-auto px-4 mb-24">
                <Link
                    to="/faq"
                    className="group flex items-center gap-6 bg-zinc-900 border border-zinc-800 hover:border-red-500/50 rounded-sm p-8 transition-all"
                >
                    <div className="w-14 h-14 shrink-0 flex items-center justify-center bg-red-500/10 border border-red-500/30 rounded-sm">
                        <HelpCircle className="w-7 h-7 text-red-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">FAQ</p>
                        <h2 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tighter text-white mb-1">
                            Une question ?
                        </h2>
                        <p className="text-zinc-400 text-sm">Crédits, sauvegardes, migration, support — toutes les réponses.</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-zinc-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all shrink-0" />
                </Link>
            </section>

            {/* === CTA FINAL === */}
            <section className="max-w-7xl mx-auto px-4 mb-24">
                <div className="relative bg-gradient-to-br from-red-500/10 via-zinc-900 to-zinc-900 border-2 border-red-500/30 rounded-sm p-12 md:p-16 text-center overflow-hidden">
                    <div className="absolute inset-0 -z-10 opacity-50 pointer-events-none">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-500/20 rounded-full blur-[100px]" />
                    </div>
                    <Cpu className="w-12 h-12 text-red-400 mx-auto mb-6" />
                    <h2 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-4">
                        Prêt à déployer ?
                    </h2>
                    <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-8">
                        Créez un compte, choisissez votre app, lancez votre première instance en moins d'une minute.
                    </p>
                    <button
                        onClick={() => document.querySelector('section')?.scrollIntoView({ behavior: 'smooth' })}
                        className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-400 text-black px-8 py-4 rounded-sm font-black uppercase text-xs tracking-widest transition-colors"
                    >
                        Voir les offres <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </section>

            {/* === FOOTER === */}
            <footer className="border-t border-zinc-900 bg-zinc-950">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Zap className="w-5 h-5 text-red-400 fill-current" />
                                <span className="font-display font-black text-xl uppercase tracking-tighter text-white">HostBuster</span>
                            </div>
                            <p className="text-xs text-zinc-500 leading-relaxed">
                                PaaS clé-en-main pour PME, indépendants et particuliers. Déployez vos apps en un clic.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-black text-xs uppercase tracking-widest text-white mb-4">Navigation</h4>
                            <ul className="space-y-2 text-xs text-zinc-500">
                                <li><Link to="/" className="hover:text-red-400 transition-colors">Accueil</Link></li>
                                <li><Link to="/faq" className="hover:text-red-400 transition-colors">FAQ</Link></li>
                                <li><Link to="/dashboard" className="hover:text-red-400 transition-colors">Mon dashboard</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-black text-xs uppercase tracking-widest text-white mb-4">Contact</h4>
                            <ul className="space-y-2 text-xs text-zinc-500">
                                <li><a href="mailto:support@hostbuster.fr" className="hover:text-red-400 transition-colors">support@hostbuster.fr</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-zinc-900">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                            © {new Date().getFullYear()} HostBuster · CPI-Corporation
                        </p>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default Home;
