import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Square, 
  RefreshCw, 
  Terminal, 
  Globe, 
  Shield, 
  Database, 
  Settings,
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const InstanceDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [status, setStatus] = useState('online');
  const [activeTab, setActiveTab] = useState('console');
  const [copied, setCopied] = useState(false);
  
  const [metrics, setMetrics] = useState({
    cpu: [32, 35, 31, 40, 38, 33, 35],
    ram: 1.2,
    disk: 14.5
  });

  const copyIp = () => {
    navigator.clipboard.writeText('142.250.179.142');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button 
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 text-xs font-black uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4" /> Retour au dashboard
      </button>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">GLPI-01</h2>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] font-black uppercase ${
              status === 'online' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              {status === 'online' ? 'En ligne' : 'Hors ligne'}
            </div>
          </div>
          <div className="flex items-center gap-4 text-zinc-500 text-xs font-bold uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Paris, France</span>
            <span className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors" onClick={copyIp}>
              IP: 142.250.179.142 {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            </span>
          </div>
        </div>

        <div className="flex gap-2 w-full lg:w-auto">
          <button 
            onClick={() => setStatus('online')}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Démarrer
          </button>
          <button 
            onClick={() => setStatus('offline')}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <Square className="w-3.5 h-3.5 fill-current" /> Arrêter
          </button>
          <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all">
            <RefreshCw className="w-3.5 h-3.5" /> Redémarrer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Utilisation CPU</p>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-3xl font-black text-white">32%</span>
            <span className="text-zinc-600 text-[10px] font-bold pb-1 uppercase">1 vCPU</span>
          </div>
          <div className="flex gap-1 h-8 items-end">
            {metrics.cpu.map((val, i) => (
              <div key={i} className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/40 transition-all rounded-t-sm" style={{ height: `${val}%` }}></div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Mémoire vive (RAM)</p>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-3xl font-black text-white">{metrics.ram} GB</span>
            <span className="text-zinc-600 text-[10px] font-bold pb-1 uppercase">Sur 4 GB</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-cyan-500 h-full w-[30%]"></div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Stockage NVMe</p>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-3xl font-black text-white">{metrics.disk} GB</span>
            <span className="text-zinc-600 text-[10px] font-bold pb-1 uppercase">Sur 80 GB</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-cyan-500 h-full w-[18%]"></div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Temps de disponibilité</p>
          <div className="text-2xl font-black text-white uppercase tracking-tighter">14j 02h 45m</div>
          <p className="text-[9px] font-bold text-green-500 uppercase tracking-widest">SLA 99.99% respecté</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden">
        <div className="flex border-b border-zinc-800">
          {[
            { id: 'console', label: 'Console', icon: Terminal },
            { id: 'network', label: 'Réseau', icon: Globe },
            { id: 'backups', label: 'Sauvegardes', icon: Database },
            { id: 'security', label: 'Sécurité', icon: Shield },
            { id: 'settings', label: 'Paramètres', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id ? 'bg-zinc-800 text-cyan-400 border-b-2 border-cyan-400' : 'text-zinc-500 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-0">
          {activeTab === 'console' && (
            <div className="bg-zinc-950 p-6 font-mono text-sm min-h-[400px]">
              <div className="text-zinc-500 mb-1">[SYSTEM] Connexion établie au socket v4.2.1...</div>
              <div className="text-zinc-500 mb-4">[SYSTEM] Authentification via clé SSH réussie.</div>
              <div className="text-white flex gap-2">
                <span className="text-cyan-400 font-bold">root@GLPI-01:~$</span>
                <span className="animate-pulse">_</span>
              </div>
            </div>
          )}
          
          {activeTab !== 'console' && (
            <div className="p-12 text-center">
              <p className="text-zinc-500 font-bold text-xs uppercase tracking-[0.2em]">Configuration {activeTab} en cours de chargement...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstanceDetails;