import React from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Importer le hook
import { Server } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate(); // 2. Initialiser la fonction navigate

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
            Gestion des <span className="text-cyan-400">Instances</span>
          </h2>
          <p className="text-zinc-500 text-sm font-medium mt-1">
            Surveillance de votre infrastructure en temps réel.
          </p>
        </div>
        <button className="bg-zinc-800 text-white px-4 py-2 rounded-sm text-xs font-black uppercase">
          Ajouter un serveur
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => navigate('/instance/GLPI-01')} // 3. Utilisation de navigate
          className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm cursor-pointer hover:border-cyan-500/50 transition-all group"
        >
          <div className="flex justify-between items-start mb-6">
            <Server className="text-cyan-400 w-6 h-6" />
            <span className="text-[10px] font-black bg-green-500/10 text-green-500 px-2 py-1 rounded uppercase">
              Opérationnel
            </span>
          </div>
          <h4 className="font-black uppercase text-base text-white mb-1 group-hover:text-cyan-400 transition-colors">
            GLPI-01
          </h4>
          <p className="text-zinc-500 text-[10px] mb-6 font-bold uppercase tracking-widest italic">
            Paris - Instance GLPI
          </p>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                <span className="text-zinc-400">CPU Usage</span>
                <span className="text-white">32%</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full w-[32%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;