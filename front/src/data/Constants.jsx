import { Layout, Gamepad2, Briefcase, LifeBuoy } from 'lucide-react';

// Taux de conversion : 1 € = 100 crédits.
export const CREDITS_PER_EURO = 100;

// Les db_id correspondent à la table `applications` du schema.sql.
export const appTypes = [
  { id: 'wordpress', db_id: 1, name: 'WordPress', icon: <Layout className="w-5 h-5" /> },
  { id: 'minecraft', db_id: 2, name: 'Minecraft', icon: <Gamepad2 className="w-5 h-5" /> },
  { id: 'odoo', db_id: 3, name: 'Odoo', icon: <Briefcase className="w-5 h-5" /> },
  { id: 'glpi', db_id: 4, name: 'GLPI', icon: <LifeBuoy className="w-5 h-5" /> }
];

export const getAppByKey = (key) => appTypes.find((a) => a.id === key);

// Specs sont stockées en clair (cpu/ram_mb/storage_gb) pour envoi au backend.
export const getPlansByApp = (appId) => {
  const basePlans = {
    wordpress: [
      { name: 'Starter', price: 999, cpu: 1, ram: 2048, storage: 20, features: ['1 vCPU', '2 Go RAM', '20 Go NVMe', 'Sauvegarde J+7'] },
      { name: 'Professional', price: 2499, cpu: 2, ram: 4096, storage: 80, features: ['2 vCPU', '4 Go RAM', '80 Go NVMe', 'Support 24/7', 'IP Dédiée'] },
      { name: 'Business', price: 4999, cpu: 4, ram: 8192, storage: 200, features: ['4 vCPU', '8 Go RAM', '200 Go NVMe', 'Staging Environnement', 'Haute Disponibilité'] }
    ],
    minecraft: [
      { name: 'Grass', price: 599, cpu: 2, ram: 4096, storage: 10, features: ['2 vCPU', '4 Go RAM', '10 Go SSD', 'Anti-DDoS Game'] },
      { name: 'Iron', price: 1499, cpu: 4, ram: 8192, storage: 40, features: ['4 vCPU', '8 Go RAM', '40 Go SSD', 'Slots Illimités', 'Sauvegardes auto'] },
      { name: 'Diamond', price: 2999, cpu: 8, ram: 16384, storage: 100, features: ['8 vCPU', '16 Go RAM', '100 Go SSD', 'IP Dédiée', 'Support Prioritaire'] }
    ],
    odoo: [
      { name: 'Small Biz', price: 1999, cpu: 2, ram: 4096, storage: 40, features: ['2 vCPU', '4 Go RAM', '40 Go SSD', 'Installation 1-clic'] },
      { name: 'Corporate', price: 5999, cpu: 4, ram: 8192, storage: 120, features: ['4 vCPU', '8 Go RAM', '120 Go SSD', 'Maintenance incluse'] },
      { name: 'Enterprise', price: 11999, cpu: 8, ram: 16384, storage: 300, features: ['8 vCPU', '16 Go RAM', '300 Go SSD', 'Multi-instances', 'SLA 99.9%'] }
    ],
    glpi: [
      { name: 'Essentiel', price: 1299, cpu: 1, ram: 2048, storage: 20, features: ['1 vCPU', '2 Go RAM', '20 Go SSD'] },
      { name: 'Pro', price: 3499, cpu: 2, ram: 4096, storage: 60, features: ['2 vCPU', '4 Go RAM', '60 Go SSD', 'Support Technique'] },
      { name: 'Elite', price: 7499, cpu: 4, ram: 8192, storage: 150, features: ['4 vCPU', '8 Go RAM', '150 Go SSD', 'Audit Sécurité Annuel'] }
    ]
  };

  return basePlans[appId] || basePlans['wordpress'];
};
