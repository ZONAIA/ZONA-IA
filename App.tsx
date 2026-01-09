
import React, { useState } from 'react';
import { 
  MessageSquare, 
  Camera, 
  MapPin, 
  Mic, 
  Settings, 
  Menu, 
  Cpu,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { TabType } from './types';
import { APP_NAME } from './constants';
import ChatView from './components/ChatView';
import AnalysisView from './components/AnalysisView';
import MapsView from './components/MapsView';
import VoiceView from './components/VoiceView';

const LogoZ = ({ className = "w-24 h-24" }: { className?: string }) => (
  <div className={`${className} rounded-3xl flex items-center justify-center border-2 border-orange-500 bg-black shadow-[0_0_30px_rgba(255,140,0,0.15)] transition-all group-hover:scale-110 relative overflow-hidden`}>
    <span className="font-brand text-5xl font-black text-orange-500 select-none">Z</span>
    <Zap size={14} className="absolute bottom-2 right-2 text-orange-400 fill-orange-500/20 animate-pulse" />
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('voice'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderContent = () => {
    switch (activeTab) {
      case 'voice': return <VoiceView />;
      case 'chat': return <ChatView />;
      case 'analysis': return <AnalysisView />;
      case 'maps': return <MapsView />;
      default: return <VoiceView />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0b] text-[#e2e8f0] overflow-hidden">
      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/90 z-40 md:hidden backdrop-blur-sm" 
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-50 h-full w-72 bg-[#0d0d0f] border-r border-white/5 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl shadow-orange-500/10' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full p-6">
          {/* Main Logo Container */}
          <div className="flex flex-col items-center gap-3 mb-12 px-2 mt-4 group cursor-default">
            <LogoZ />
            <div className="text-center space-y-1">
              <h1 className="font-brand text-xl font-bold tracking-tight text-white leading-none">
                {APP_NAME} <span className="text-orange-500 animate-pulse">.</span>
              </h1>
              <p className="text-[10px] text-gray-500 font-black tracking-[0.4em] uppercase opacity-60">Zona Eléctrica</p>
            </div>
          </div>

          <nav className="flex-1 space-y-3">
            <NavItem 
              icon={<Mic size={18} />} 
              label="Zeia Live (Voz)" 
              active={activeTab === 'voice'} 
              onClick={() => { setActiveTab('voice'); setIsSidebarOpen(false); }} 
            />
            <NavItem 
              icon={<MessageSquare size={18} />} 
              label="Chat Técnico" 
              active={activeTab === 'chat'} 
              onClick={() => { setActiveTab('chat'); setIsSidebarOpen(false); }} 
            />
            <NavItem 
              icon={<Camera size={18} />} 
              label="Inspección Visual" 
              active={activeTab === 'analysis'} 
              onClick={() => { setActiveTab('analysis'); setIsSidebarOpen(false); }} 
            />
            <NavItem 
              icon={<MapPin size={18} />} 
              label="Red Suministros" 
              active={activeTab === 'maps'} 
              onClick={() => { setActiveTab('maps'); setIsSidebarOpen(false); }} 
            />
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
             <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-orange-500/5 border border-orange-500/10 text-[10px] text-orange-400 font-bold uppercase tracking-widest">
               <Cpu size={14} className="animate-spin-slow" />
               <span>Gemini 3 Pro Core</span>
             </div>
             <div className="flex flex-col gap-1 px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2 text-[9px] text-gray-500 font-black uppercase tracking-widest">
                  <ShieldCheck size={12} className="text-orange-500" /> Administrador
                </div>
                <div className="text-[11px] text-gray-300 truncate font-mono">cindustrialze@gmail.com</div>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0a0a0b] relative">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#0d0d0f]/50 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <button onClick={toggleSidebar} className="md:hidden text-gray-400 hover:text-orange-500 transition-colors">
              <Menu size={26} />
            </button>
            
            <div className="flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center border border-orange-500/30 shadow-lg transition-transform group-hover:rotate-12 relative overflow-hidden">
                <span className="font-brand text-lg font-black text-orange-500">Z</span>
              </div>
              <div className="hidden sm:block">
                <h2 className="font-brand text-[10px] font-bold text-white tracking-[0.4em] uppercase opacity-80">Terminal Industrial</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(255,140,0,0.6)]" />
                  <span className="text-[9px] text-orange-500/80 font-black tracking-widest uppercase">Sistema Online</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <button className="text-gray-400 hover:text-white p-2.5 rounded-xl transition-all hover:bg-white/5 border border-transparent hover:border-white/10">
               <Settings size={20} />
             </button>
          </div>
        </header>

        <section className="flex-1 relative overflow-hidden">
          {renderContent()}
        </section>

        {/* Floating Decorative Elements */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />
      </main>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`
      w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 group
      ${active 
        ? 'bg-orange-500 text-black shadow-2xl shadow-orange-500/20 translate-x-1' 
        : 'text-gray-400 hover:text-white hover:bg-white/5'}
    `}
  >
    <span className={`${active ? 'text-black' : 'text-orange-500 group-hover:scale-110 transition-transform'}`}>
      {icon}
    </span>
    <span className="tracking-tight">{label}</span>
    {active && <Zap size={14} className="ml-auto animate-pulse" />}
  </button>
);

export default App;
