
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, Blob } from '@google/genai';
import { Mic, MicOff, Volume2, Loader2, Radio, User, Bot, Sparkles } from 'lucide-react';
import { MODELS, SYSTEM_PROMPT } from '../constants';

interface TranscriptEntry {
  role: 'user' | 'zeia';
  text: string;
}

const VoiceView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcriptHistory, setTranscriptHistory] = useState<TranscriptEntry[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentOutput, setCurrentOutput] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const startSession = async () => {
    setIsConnecting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const decode = (base64: string) => {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        return bytes;
      };

      const encode = (bytes: Uint8Array) => {
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
      };

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

      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputAudioContext;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: MODELS.LIVE,
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContext.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setCurrentOutput('');
            }

            if (message.serverContent?.inputTranscription) {
              setCurrentInput(prev => prev + message.serverContent.inputTranscription.text);
            }
            if (message.serverContent?.outputTranscription) {
              setCurrentOutput(prev => prev + message.serverContent.outputTranscription.text);
            }

            if (message.serverContent?.turnComplete) {
              setTranscriptHistory(prev => {
                const newHistory = [...prev];
                if (currentInput) newHistory.push({ role: 'user', text: currentInput });
                if (currentOutput) newHistory.push({ role: 'zeia', text: currentOutput });
                return newHistory.slice(-10);
              });
              setCurrentInput('');
              setCurrentOutput('');
            }
          },
          onerror: (e) => { 
            console.error("Live Error:", e); 
            setIsActive(false); 
            setIsConnecting(false); 
          },
          onclose: () => { 
            setIsActive(false); 
            setIsConnecting(false); 
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: SYSTEM_PROMPT + " IMPORTANTE: Responde SIEMPRE en ESPAÑOL. Sé breve y directo.",
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Failed to start voice session:", err);
      setIsConnecting(false);
      alert("No se pudo acceder al micrófono o conectar con ZEIA.");
    }
  };

  const stopSession = () => {
    if (sessionRef.current) sessionRef.current.close();
    setIsActive(false);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-8 animate-fade-in">
      <div className="space-y-4 max-w-lg">
        <div className="flex justify-center mb-2">
          <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20">
            <Sparkles className="text-orange-500" size={32} />
          </div>
        </div>
        <h2 className="text-4xl font-bold text-white font-brand uppercase tracking-tighter">ZEIA en Vivo</h2>
        <p className="text-gray-400">Consulta técnica por voz con procesamiento en tiempo real. Activa el micrófono para empezar.</p>
      </div>

      <div className="relative group">
        <div className={`w-52 h-52 rounded-full flex items-center justify-center transition-all duration-700 ${isActive ? 'bg-orange-500 shadow-[0_0_80px_rgba(255,140,0,0.5)]' : 'bg-white/5 border border-white/10'}`}>
          {isActive && (
            <>
              <div className="absolute inset-0 rounded-full border-4 border-orange-500/30 animate-ping" />
              <div className="absolute inset-4 rounded-full border-2 border-orange-500/20 animate-pulse" />
            </>
          )}
          <button 
            onClick={isActive ? stopSession : startSession} 
            disabled={isConnecting} 
            className={`w-40 h-40 rounded-full flex items-center justify-center text-black transition-all hover:scale-105 active:scale-95 shadow-2xl relative z-10 ${isActive ? 'bg-orange-600' : 'bg-orange-500'}`}
          >
            {isConnecting ? <Loader2 className="w-14 h-14 animate-spin" /> : (isActive ? <MicOff size={50} /> : <Mic size={50} />)}
          </button>
        </div>
        
        {isActive && (
          <div className="mt-8 flex items-center justify-center gap-2 text-orange-500 font-bold animate-pulse text-sm">
            <Radio size={16} /> TRANSMITIENDO AUDIO
          </div>
        )}
      </div>

      <div className="w-full max-w-2xl h-72 bg-[#141416] rounded-3xl border border-white/5 p-6 overflow-y-auto relative shadow-2xl">
         <div className="space-y-4">
            {transcriptHistory.map((entry, i) => (
              <div key={i} className={`flex gap-3 text-left animate-fade-in ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl ${entry.role === 'user' ? 'bg-white/5 border border-white/10 text-gray-400' : 'bg-orange-500/10 border border-orange-500/20 text-orange-100 shadow-lg shadow-orange-500/5'}`}>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 block mb-2">{entry.role === 'user' ? 'Tú' : 'ZEIA'}</span>
                  <p className="text-sm leading-relaxed">{entry.text}</p>
                </div>
              </div>
            ))}
            
            {(currentInput || currentOutput) && (
              <div className={`flex gap-3 text-left animate-pulse ${currentInput ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl ${currentInput ? 'bg-white/5 text-gray-500 italic' : 'bg-orange-500/5 text-orange-200/50'}`}>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 block mb-2">{currentInput ? 'Tú (procesando...)' : 'ZEIA (respondiendo...)'}</span>
                  <p className="text-sm leading-relaxed">{currentInput || currentOutput}</p>
                </div>
              </div>
            )}

            {transcriptHistory.length === 0 && !currentInput && !currentOutput && (
              <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 italic text-sm text-gray-500">
                <Bot size={32} className="mb-2" />
                No hay actividad reciente.
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default VoiceView;
