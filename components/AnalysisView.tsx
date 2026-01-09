
import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Loader2, CheckCircle, Hammer, Volume2, Zap, ClipboardPaste, Send, MessageSquare, RotateCcw, AlertTriangle } from 'lucide-react';
import { analyzeIndustrialImage, generateTechnicalSpeech, chatWithGemini } from '../services/geminiService';
import { CONSULTATION_LIMIT } from '../constants';

// @google/genai Guidelines: Implement manual base64 decoding
const decode = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
};

// @google/genai Guidelines: Manual raw PCM decoding
async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

interface AnalysisMessage {
  role: 'assistant' | 'user';
  text: string;
}

const AnalysisView: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<AnalysisMessage[]>([]);
  const [followUpInput, setFollowUpInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const followUpCount = chatHistory.filter(m => m.role === 'user').length;
  const isLimitReached = followUpCount >= CONSULTATION_LIMIT;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading, isFollowUpLoading]);

  // Manejar pegado de imagen desde el portapapeles
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (e) => {
              setSelectedImage(e.target?.result as string);
              setChatHistory([]);
            };
            reader.readAsDataURL(blob);
          }
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleReset = () => {
    setSelectedImage(null);
    setChatHistory([]);
    setFollowUpInput('');
    setIsLoading(false);
    setIsFollowUpLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setChatHistory([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async () => {
    if (!selectedImage) return;
    setIsLoading(true);
    setChatHistory([]);

    try {
      const base64 = selectedImage.split(',')[1];
      const mimeType = selectedImage.split(';')[0].split(':')[1];
      const result = await analyzeIndustrialImage(base64, mimeType);
      
      const analysisText = result.text || "No se pudo generar un reporte detallado.";
      setChatHistory([{ role: 'assistant', text: analysisText }]);
    } catch (error) {
      console.error(error);
      setChatHistory([{ role: 'assistant', text: "❌ Error en el sistema de visión artificial. Intenta con otra imagen." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUp = async () => {
    if (!followUpInput.trim() || isFollowUpLoading || isLimitReached) return;
    
    const userText = followUpInput;
    setFollowUpInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userText }]);
    setIsFollowUpLoading(true);

    try {
      const context = `Contexto del diagnóstico previo: ${chatHistory[0]?.text || ''}. El usuario pregunta ahora: ${userText}`;
      const result = await chatWithGemini(context);
      setChatHistory(prev => [...prev, { role: 'assistant', text: result.text || "No logré procesar tu pregunta técnica." }]);
    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { role: 'assistant', text: "Ocurrió un error consultando al asesor virtual." }]);
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  const playTTS = async (text: string) => {
    if (!text || isPlayingAudio) return;
    setIsPlayingAudio(true);
    try {
      const audioData = await generateTechnicalSpeech(text);
      if (audioData) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        const audioBuffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto pb-24">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        <header className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-white font-brand">Inspección de Equipos</h2>
          <p className="text-gray-400">Identifica componentes, detecta fallos y solicita asesoría técnica inmediata.</p>
        </header>

        <div className="grid lg:grid-cols-[400px_1fr] gap-8">
          <div className="space-y-4">
            <div className={`
              relative aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all
              ${selectedImage ? 'border-orange-500/50 shadow-2xl shadow-orange-500/10' : 'border-white/10 hover:border-orange-500/20 bg-white/5'}
            `}>
              {selectedImage ? (
                <>
                  <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-colors"
                  >
                    <Upload size={18} className="rotate-180" />
                  </button>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-4 w-full h-full justify-center group">
                  <div className="p-6 rounded-full bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform duration-300">
                    <Camera size={48} />
                  </div>
                  <div className="text-center px-6">
                    <p className="text-white font-medium">Click o Pega Imagen (Ctrl+V)</p>
                    <p className="text-xs text-gray-500 mt-2 italic">Formatos: JPG, PNG, WEBP</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              )}
            </div>
            
            <button 
              onClick={runAnalysis}
              disabled={!selectedImage || isLoading || isLimitReached}
              className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-400 text-black font-black rounded-2xl shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <Zap size={20} fill="currentColor" />}
              DIAGNÓSTICO ZEIA
            </button>

            {chatHistory.length > 0 && (
              <button 
                onClick={handleReset}
                className="w-full py-3 bg-white/5 text-gray-400 font-bold rounded-2xl border border-white/10 flex items-center justify-center gap-2 hover:bg-white/10 transition-all text-xs uppercase tracking-widest"
              >
                <RotateCcw size={14} /> REINICIAR ANÁLISIS
              </button>
            )}
          </div>

          <div className="bg-[#141416] rounded-3xl border border-white/5 flex flex-col shadow-2xl overflow-hidden h-[600px]">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 font-brand tracking-tighter uppercase">
                <CheckCircle className="text-orange-500" size={20} />
                Reporte e Interacción
              </h3>
              {chatHistory.length > 0 && (
                <span className="text-[10px] font-bold text-gray-500">CONSULTAS: {followUpCount}/{CONSULTATION_LIMIT}</span>
              )}
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
              {chatHistory.length === 0 && !isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 text-center py-10 opacity-40">
                  <ClipboardPaste size={48} className="mb-4" />
                  <p className="max-w-[200px] text-sm italic">Sube o pega una imagen industrial para iniciar la asesoría.</p>
                </div>
              )}

              {isLoading && (
                <div className="space-y-6 animate-pulse">
                  <div className="h-4 bg-white/5 rounded w-3/4" />
                  <div className="h-32 bg-white/5 rounded w-full" />
                  <div className="h-4 bg-white/5 rounded w-5/6" />
                </div>
              )}

              {chatHistory.map((msg, i) => (
                <React.Fragment key={i}>
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                    <div className={`
                      max-w-[90%] p-5 rounded-2xl relative
                      ${msg.role === 'user' 
                        ? 'bg-orange-500 text-black font-medium rounded-tr-none' 
                        : 'bg-[#1a1a1c] border border-white/5 text-gray-200 rounded-tl-none shadow-xl shadow-black/20'}
                    `}>
                      <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap leading-relaxed font-sans">
                        {msg.text}
                      </div>
                      {msg.role === 'assistant' && (
                        <button 
                          onClick={() => playTTS(msg.text)}
                          className="absolute top-2 right-2 p-1.5 text-gray-600 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"
                        >
                          <Volume2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {i === 0 && msg.role === 'assistant' && (
                    <div className="flex flex-col gap-3 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
                      <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex gap-4 items-start">
                        <div className="bg-orange-500/20 p-2 rounded-lg">
                          <Hammer className="text-orange-500" size={20} />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-orange-500 uppercase tracking-[0.2em] mb-1">SUGERENCIA DE EXPERTOS ZE</p>
                          <p className="text-xs text-gray-300">¿Deseas que te ayudemos a cotizar un equipo similar o prefieres hablar con un asesor para una homologación técnica?</p>
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}

              {isLimitReached && (
                <div className="flex flex-col items-center justify-center p-6 bg-orange-500/10 border border-orange-500/30 rounded-2xl space-y-4">
                  <AlertTriangle className="text-orange-500" size={32} />
                  <p className="text-xs text-gray-400 text-center">Has llegado al límite de preguntas para este diagnóstico. Reinicia para analizar otra pieza.</p>
                  <button onClick={handleReset} className="px-6 py-2 bg-orange-500 text-black text-xs font-bold rounded-xl flex items-center gap-2">
                    <RotateCcw size={14} /> REINICIAR
                  </button>
                </div>
              )}

              {isFollowUpLoading && (
                <div className="flex justify-start">
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/5"><Loader2 className="animate-spin text-orange-500" /></div>
                </div>
              )}
            </div>

            {chatHistory.length > 0 && (
              <div className="p-4 bg-[#0d0d0e] border-t border-white/5">
                <div className="relative">
                  <input 
                    value={followUpInput}
                    onChange={(e) => setFollowUpInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFollowUp()}
                    placeholder={isLimitReached ? "Sesión finalizada" : "Escribe tu duda o solicita una marca específica..."}
                    disabled={isLimitReached}
                    className={`w-full bg-[#141416] border border-white/10 rounded-xl px-5 py-4 pr-14 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50 placeholder:text-gray-600 ${isLimitReached ? 'opacity-50' : ''}`}
                  />
                  <button 
                    onClick={handleFollowUp}
                    disabled={isFollowUpLoading || !followUpInput.trim() || isLimitReached}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-orange-500 rounded-lg text-black hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
                  >
                    <Send size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-500 px-1 font-medium italic">
                  <MessageSquare size={12} />
                  <span>Pregunta por precios, marcas disponibles o características de instalación.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
