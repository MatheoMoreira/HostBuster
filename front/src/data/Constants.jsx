import { Layout, Gamepad2, Briefcase, LifeBuoy } from 'lucide-react';

export const appTypes = [
  { id: 'wordpress', name: 'WordPress', icon: <Layout className="w-5 h-5" /> },
  { id: 'minecraft', name: 'Minecraft', icon: <Gamepad2 className="w-5 h-5" /> },
  { id: 'odoo', name: 'Odoo', icon: <Briefcase className="w-5 h-5" /> },
  { id: 'glpi', name: 'GLPI', icon: <LifeBuoy className="w-5 h-5" /> }
];

export const getPlansByApp = (appId) => {
  const basePlans = {
    wordpress: [
      { name: 'Starter', price: '9.99', features: ['1 vCPU', '2 Go RAM', '20 Go NVMe', 'Sauvegarde J+7'], recommended: false },
      { name: 'Professional', price: '24.99', features: ['2 vCPU', '4 Go RAM', '80 Go NVMe', 'Support 24/7', 'IP Dédiée'], recommended: true },
      { name: 'Business', price: '49.99', features: ['4 vCPU', '8 Go RAM', '200 Go NVMe', 'Staging Environnement', 'Haute Disponibilité'], recommended: false }
    ],
    minecraft: [
      { name: 'Grass', price: '5.99', features: ['2 vCPU', '4 Go RAM', '10 Go SSD', 'Anti-DDoS Game'], recommended: false },
      { name: 'Iron', price: '14.99', features: ['4 vCPU', '8 Go RAM', '40 Go SSD', 'Slots Illimités', 'Sauvegardes auto'], recommended: true },
      { name: 'Diamond', price: '29.99', features: ['8 vCPU', '16 Go RAM', '100 Go SSD', 'IP Dédiée', 'Support Prioritaire'], recommended: false }
    ],
    odoo: [
      { name: 'Small Biz', price: '19.99', features: ['2 vCPU', '4 Go RAM', '40 Go SSD', 'Installation 1-clic'], recommended: false },
      { name: 'Corporate', price: '59.99', features: ['4 vCPU', '8 Go RAM', '120 Go SSD', 'Maintenance incluse'], recommended: true },
      { name: 'Enterprise', price: '119.99', features: ['8 vCPU', '16 Go RAM', '300 Go SSD', 'Multi-instances', 'SLA 99.9%'], recommended: false }
    ],
    glpi: [
      { name: 'Essentiel', price: '12.99', features: ['1 vCPU', '2 Go RAM', '20 Go SSD'], recommended: false },
      { name: 'Pro', price: '34.99', features: ['2 vCPU', '4 Go RAM', '60 Go SSD', 'Support Technique'], recommended: true },
      { name: 'Elite', price: '74.99', features: ['4 vCPU', '8 Go RAM', '150 Go SSD', 'Audit Sécurité Annuel'], recommended: false }
    ]
  };

  return basePlans[appId] || basePlans['wordpress'];
};