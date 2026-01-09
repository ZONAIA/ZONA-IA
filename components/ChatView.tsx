
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ExternalLink, Cpu, Zap, Image as ImageIcon, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { chatWithGemini, complexReasoning, generateTechnicalImage } from '../services/geminiService';
import { Message, GroundingSource } from '../types';
import { CONSULTATION_LIMIT } from '../constants';

const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const userMessagesCount = messages.filter(m => m.role === 'user').length;
  const isLimitReached = userMessagesCount >= CONSULTATION_LIMIT;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isThinking, isGeneratingImage]);

  const handleReset = () => {
    setMessages([]);
    setInput('');
    setIsLoading(false);
    setIsThinking(false);
    setIsGeneratingImage(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || isLimitReached) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const isImageRequest = /imagen|foto|render|diagrama|visualiza|genera/i.test(currentInput);

      if (isImageRequest) {
        setIsGeneratingImage(true);
        const result = await generateTechnicalImage(currentInput);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: (result.imageUrl ? `![Imagen Generada](${result.imageUrl})\n\n` : '') + (result.text || "Aquí tienes la visualización técnica solicitada."),
          timestamp: Date.now(),
          type: 'image'
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const isComplex = currentInput.length > 200 || /calcula|diseña|proyecto|analiza|ingeniería/i.test(currentInput);
        let response;
        
        if (isComplex) {
          setIsThinking(true);
          response = await complexReasoning(currentInput);
        } else {
          response = await chatWithGemini(currentInput);
        }

        const sources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
          title: chunk.web?.title || 'Fuente Técnica',
          uri: chunk.web?.uri || '#'
        })) || [];

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.text || "Entendido. ¿Deseas ampliar algún detalle técnico o hablar con un asesor?",
          timestamp: Date.now(),
          sources
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      console.error("Chat Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `### ⚠️ Error en la Terminal\n\nNo fue posible procesar la consulta técnica en este momento.\n\n**Causa probable:** ${error.message || "Error de conexión con el núcleo Gemini."}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsThinking(false);
      setIsGeneratingImage(false);
    }
  };

  const renderMessageContent = (content: string) => {
    const imgRegex = /!\[.*?\]\((.*?)\)/;
    const match = content.match(imgRegex);
    if (match) {
      const imageUrl = match[1];
      const textContent = content.replace(imgRegex, '').trim();
      return (
        <div className="space-y-4">
          <div className="relative group overflow-hidden rounded-xl border border-orange-500/20 bg-black shadow-2xl shadow-orange-500/5">
            <img src={imageUrl} alt="Visualización ZE" className="w-full h-auto object-contain max-h-[600px] transition-transform group-hover:scale-105 duration-700" />
            <div className="absolute top-4 right-4">
               <div className="px-3 py-1 bg-orange-500 text-black text-[9px] font-black uppercase rounded-full shadow-lg flex items-center gap-2">
                 <Zap size={10} fill="currentColor" /> RENDER HD
               </div>
            </div>
          </div>
          <div className="prose prose-invert prose-orange max-w-none">{textContent}</div>
        </div>
      );
    }
    return <div className="prose prose-invert prose-orange max-w-none leading-relaxed">{content}</div>;
  };

  return (
    <div className="h-full flex flex-col p-4 max-w-5xl mx-auto w-full animate-fade-in">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 pb-24 px-2 pt-4 scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-10 opacity-60">
            <div className="relative">
              <div className="w-32 h-32 rounded-3xl bg-black border-2 border-orange-500 flex items-center justify-center shadow-[0_0_50px_rgba(255,140,0,0.1)] p-4 overflow-hidden relative group">
                <span className="font-brand text-8xl font-black text-orange-500 group-hover:scale-110 transition-transform duration-500 select-none">Z</span>
                <Zap size={24} className="absolute bottom-4 right-4 text-orange-500 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white font-brand tracking-tighter uppercase">Terminal Técnica ZE</h2>
              <p className="text-gray-500 max-w-xs mx-auto text-sm italic font-mono uppercase tracking-widest">
                Engine Gemini 3 Pro <span className="text-orange-500">Active</span>
              </p>
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[90%] md:max-w-[85%] rounded-2xl p-5 shadow-xl ${m.role === 'user' ? 'bg-orange-500 text-black rounded-tr-none font-medium' : 'bg-[#141416] border border-white/5 text-gray-300 rounded-tl-none'}`}>
              {renderMessageContent(m.content)}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap gap-2">
                  {m.sources.map((src, i) => (
                    <a key={i} href={src.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] text-gray-500 hover:text-orange-500 hover:border-orange-500/30 transition-all">
                      {src.title} <ExternalLink size={10} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {(isThinking || isGeneratingImage) && (
          <div className="flex justify-start animate-pulse">
             <div className="bg-[#141416] border border-orange-500/20 rounded-2xl p-5 flex items-center gap-4 text-sm text-gray-400">
               <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                 {isThinking ? <Cpu className="animate-spin text-orange-500" /> : <ImageIcon className="animate-bounce text-orange-500" />}
               </div>
               <div className="text-[10px] font-black uppercase tracking-widest">{isThinking ? 'Calculando Ingeniería...' : 'Procesando Imagen HD...'}</div>
             </div>
          </div>
        )}

        {isLoading && !isThinking && !isGeneratingImage && (
          <div className="flex justify-start">
            <div className="bg-[#141416] p-4 rounded-2xl border border-white/5 shadow-lg"><Loader2 className="animate-spin text-orange-500" /></div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 pb-6 sticky bottom-0 z-30 bg-[#0a0a0b]/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto w-full relative group">
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
            placeholder={isLimitReached ? "Límite de sesión alcanzado" : "Consulta técnica, solicita un asesor o pide un render..."} 
            disabled={isLimitReached || isLoading}
            className={`w-full bg-[#141416] border border-white/10 rounded-2xl px-6 py-5 pr-20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 shadow-2xl transition-all ${isLimitReached ? 'opacity-50 cursor-not-allowed' : 'hover:border-white/20'}`} 
          />
          <button 
            onClick={handleSend} 
            disabled={isLoading || !input.trim() || isLimitReached} 
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-3.5 bg-orange-500 rounded-xl text-black hover:bg-orange-400 hover:scale-105 active:scale-95 transition-all disabled:opacity-20 shadow-lg shadow-orange-500/20"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="flex justify-between items-center mt-3 px-2">
           <div className="flex items-center gap-2 text-[9px] font-bold text-gray-600 uppercase tracking-widest">
              <ShieldCheck size={12} className="text-orange-500" /> Consultoría Protegida
           </div>
           {messages.length > 0 && (
             <button 
               onClick={handleReset}
               className="text-[10px] text-gray-600 hover:text-orange-500 flex items-center gap-1 uppercase tracking-widest font-black transition-colors"
             >
               <RotateCcw size={10} /> Reiniciar ({userMessagesCount}/{CONSULTATION_LIMIT})
             </button>
           )}
        </div>
      </div>
    </div>
  );
};

export default ChatView;
