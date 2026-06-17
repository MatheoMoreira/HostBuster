import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ArrowLeft, ArrowRight, MessageCircle } from 'lucide-react';

const FAQ_GROUPS = [
    {
        category: 'Crédits & facturation',
        items: [
            {
                q: 'Comment fonctionnent les crédits ?',
                a: 'Les crédits sont la monnaie interne de HostBuster. Le taux de conversion est de 1 € = 100 crédits. Vous payez chaque instance en crédits par mois, et vous pouvez recharger votre solde à tout moment depuis le dashboard.',
            },
            {
                q: 'Que se passe-t-il si je n\'ai pas assez de crédits pour créer une instance ?',
                a: 'Le déploiement est bloqué tant que votre solde est inférieur au prix mensuel de l\'instance choisie. Vous êtes redirigé vers la page de rechargement pour ajuster votre solde, puis vous pouvez relancer la création.',
            },
        ],
    },
    {
        category: 'Applications & instances',
        items: [
            {
                q: 'Quelles applications puis-je déployer ?',
                a: 'Quatre applications sont disponibles : WordPress (CMS), Minecraft Java Edition (serveur de jeu), Odoo (ERP) et GLPI (gestion de parc IT). Chaque application propose trois niveaux de plan (CPU / RAM / stockage).',
            },
            {
                q: 'Comment se passe le déploiement d\'une instance ?',
                a: 'Vous choisissez une application, un plan, puis vous lancez le déploiement. L\'instance passe par les étapes provisioning → deploying → running, et devient accessible dès qu\'elle est en ligne.',
            },
            {
                q: 'Que se passe-t-il à la date de suppression programmée ?',
                a: 'Chaque instance peut avoir une date de suppression programmée (champ scheduled_deletion_at). À l\'échéance, l\'instance est supprimée automatiquement et son statut passe à "deleted".',
            },
        ],
    },
];

const Faq = () => {
    const navigate = useNavigate();
    const [open, setOpen] = useState('0-0'); // "groupIdx-itemIdx"

    return (
        <div className="max-w-4xl mx-auto px-4 py-16">
            <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-10 text-xs font-black uppercase tracking-widest"
            >
                <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
            </button>

            <div className="text-center mb-16">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-3">FAQ</p>
                <h1 className="font-display text-5xl md:text-6xl font-black uppercase tracking-tighter text-white mb-4">
                    Questions fréquentes
                </h1>
                <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                    Tout ce qu'il faut savoir avant de déployer votre première instance.
                </p>
            </div>

            <div className="space-y-12">
                {FAQ_GROUPS.map((group, gi) => (
                    <div key={gi}>
                        <h2 className="font-display text-xs font-black uppercase tracking-widest text-zinc-500 mb-4 pb-3 border-b border-zinc-900">
                            {group.category}
                        </h2>
                        <div className="space-y-3">
                            {group.items.map((item, ii) => {
                                const key = `${gi}-${ii}`;
                                const isOpen = open === key;
                                return (
                                    <div key={key} className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden">
                                        <button
                                            onClick={() => setOpen(isOpen ? null : key)}
                                            className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-zinc-800/50 transition-colors"
                                        >
                                            <span className="font-black text-sm text-white uppercase tracking-tight">{item.q}</span>
                                            <ChevronDown className={`w-5 h-5 text-red-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isOpen && (
                                            <div className="px-6 pb-6 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800 pt-4">
                                                {item.a}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* CTA Support */}
            <div className="mt-20 bg-gradient-to-br from-red-500/10 via-zinc-900 to-zinc-900 border-2 border-red-500/30 rounded-sm p-10 text-center">
                <MessageCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
                <h3 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tighter text-white mb-2">
                    Vous n'avez pas trouvé votre réponse ?
                </h3>
                <p className="text-zinc-400 mb-6">Notre équipe support répond en moins de 24h ouvrées.</p>
                <a
                    href="mailto:support@hostbuster.fr"
                    className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-400 text-black px-6 py-3 rounded-sm font-black uppercase text-xs tracking-widest transition-colors"
                >
                    Contacter le support <ArrowRight className="w-4 h-4" />
                </a>
            </div>
        </div>
    );
};

export default Faq;
