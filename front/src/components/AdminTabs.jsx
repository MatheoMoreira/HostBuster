import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, Server } from 'lucide-react';

// Navigation entre les écrans d'administration (utilisateurs / instances).
const AdminTabs = () => (
  <div className="hb-rise flex gap-2 mb-8">
    {[
      { to: '/admin/users', label: 'Utilisateurs', icon: Users },
      { to: '/admin/instances', label: 'Instances', icon: Server },
    ].map(({ to, label, icon: Icon }) => (
      <NavLink
        key={to}
        to={to}
        end
        className={({ isActive }) =>
          `flex items-center gap-2 px-4 py-2.5 rounded-sm text-xs font-black uppercase tracking-widest border-2 transition-colors ${
            isActive
              ? 'border-orange-500 bg-orange-500/10 text-orange-300'
              : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
          }`
        }
      >
        <Icon className="w-4 h-4" /> {label}
      </NavLink>
    ))}
  </div>
);

export default AdminTabs;
