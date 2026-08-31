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
                a: 'Vous choisissez une application, un plan, puis vous lancez le déploiement. L\'instance passe par les étapes provisioning → deploying → running, et devient accessible dès qu\'elle est en ligne. Vous recevez un email dès qu\'elle est prête.',
            },
        ],
    },
    {
        category: 'Abonnement & renouvellement',
        items: [
            {
                q: 'Comment fonctionne le renouvellement de mon instance ?',
                a: 'Chaque instance fonctionne sur un abonnement mensuel. Le premier mois est payé à la création. Au bout de 30 jours, vous devez la renouveler depuis sa fiche en payant à nouveau le prix de votre offre, sinon l\'abonnement expire.',
            },
            {
                q: 'Que se passe-t-il si je ne renouvelle pas à temps ?',
                a: 'À l\'expiration, l\'instance est arrêtée (suspendue) et un email vous est envoyé. Vos données restent intactes pendant une période de grâce de 30 jours pour vous laisser le temps de renouveler.',
            },
            {
                q: 'Quels rappels reçois-je avant la suppression définitive ?',
                a: 'Vous recevez un email à l\'expiration (début de la période de grâce), un rappel 7 jours avant la suppression, un autre 1 jour avant, puis un email de confirmation au moment de la suppression effective.',
            },
            {
                q: 'Comment renouveler une instance suspendue ?',
                a: 'Ouvrez la fiche de votre instance et cliquez sur Renouveler. Le prix mensuel est débité, votre instance redémarre automatiquement, et la nouvelle échéance est repoussée de 30 jours.',
            },
            {
                q: 'Que se passe-t-il au bout des 30 jours de grâce ?',
                a: 'Sans renouvellement, l\'instance et toutes ses données sont définitivement supprimées. Cette opération est irréversible : pensez à exporter vos données importantes avant si vous ne souhaitez pas renouveler.',
            },
        ],
    },
    {
        category: 'Données & confidentialité',
        items: [
            {
                q: 'Combien de temps mes données sont-elles conservées ?',
                a: 'Une instance active est conservée tant que son abonnement est à jour. À l\'expiration, vos données sont gardées 30 jours (période de grâce) puis définitivement supprimées si vous ne renouvelez pas. La suppression efface l\'instance et l\'ensemble de ses sauvegardes.',
            },
            {
                q: 'Pendant combien de temps gardez-vous mes sauvegardes ?',
                a: 'Les sauvegardes suivent une politique de rétention : nous conservons au plus les 7 dernières, et aucune de plus de 30 jours. Les plus anciennes sont automatiquement purgées. Lorsqu\'une instance est supprimée, toutes ses sauvegardes le sont avec elle.',
            },
            {
                q: 'Où sont hébergées mes données ?',
                a: 'Vos données sont hébergées sur nos serveurs situés dans l\'Union européenne, conformément au RGPD. Chaque instance est isolée dans son propre conteneur.',
            },
            {
                q: 'Puis-je demander la suppression de mes données ?',
                a: 'Oui. Vous pouvez supprimer une instance et ses sauvegardes à tout moment depuis sa fiche. La suppression est immédiate et irréversible côté serveur (instance, volumes et sauvegardes).',
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
                    href="mailto:c.pess42@gmail.com"
                    className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-400 text-black px-6 py-3 rounded-sm font-black uppercase text-xs tracking-widest transition-colors"
                >
                    Contacter le support <ArrowRight className="w-4 h-4" />
                </a>
            </div>
        </div>
    );
};

export default Faq;
