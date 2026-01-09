
import React, { useState, useEffect } from 'react';
import { MapPin, Search, Loader2, Navigation, Star, ShieldCheck, Map as MapIcon } from 'lucide-react';
import { findNearbyDistributors } from '../services/geminiService';

interface Place {
  title: string;
  uri: string;
  snippets: string[];
  isFeatured?: boolean;
  address?: string;
}

const ZONA_ELECTRICA_PLACE: Place = {
  title: "ZONA ELÉCTRICA - Sede Principal",
  uri: "https://www.google.com/maps/search/?api=1&query=Zona+Eléctrica+Calle+56+%2344-127+Barranquilla",
  address: "Calle 56 #44-127, Barranquilla, Atlántico",
  snippets: ["Distribuidor líder en soluciones eléctricas e industriales. Soporte técnico especializado ZE."],
  isFeatured: true
};

const MapsView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error(err)
      );
    }
    // Inicialmente mostrar solo Zona Eléctrica
    setPlaces([ZONA_ELECTRICA_PLACE]);
  }, []);

  const handleSearch = async () => {
    if (!query || !userLocation) return;
    setIsLoading(true);
    try {
      // Ajustamos la consulta para Gemini para enfatizar el radio de 50km
      const expandedQuery = `${query} en un radio de 50 kilómetros a la redonda de mi ciudad`;
      const response = await findNearbyDistributors(expandedQuery, userLocation);
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      
      const extractedPlaces = chunks
        .filter((c: any) => c.maps)
        .map((c: any) => ({
          title: c.maps.title,
          uri: c.maps.uri,
          snippets: c.maps.placeAnswerSources?.reviewSnippets || [],
          isFeatured: false
        }));

      // Siempre colocar Zona Eléctrica de primero
      setPlaces([ZONA_ELECTRICA_PLACE, ...extractedPlaces]);
    } catch (error) {
      console.error(error);
      setPlaces([ZONA_ELECTRICA_PLACE]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto pb-24">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <header className="text-center space-y-2">
          <div className="flex justify-center mb-2">
             <div className="bg-orange-500/10 p-3 rounded-2xl border border-orange-500/20">
                <MapIcon className="text-orange-500" size={32} />
             </div>
          </div>
          <h2 className="text-3xl font-bold text-white font-brand uppercase tracking-tighter">Red de Proveedores ZE</h2>
          <p className="text-gray-400 text-sm">Localiza suministros industriales en un radio de 50km. Priorizando la red oficial Zona Eléctrica.</p>
        </header>

        <div className="relative">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="¿Qué material o componente buscas? (Ej: Cables, Breakers...)"
                className="w-full bg-[#141416] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hidden sm:block">
                <Search size={18} />
              </div>
            </div>
            <button 
              onClick={handleSearch}
              disabled={isLoading || !userLocation}
              className="px-8 py-4 bg-orange-500 text-black font-bold rounded-2xl hover:bg-orange-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <MapPin size={20} />}
              RASTREAR 50KM
            </button>
          </div>
          {!userLocation && (
             <p className="mt-3 text-xs text-orange-400 flex items-center gap-2 bg-orange-400/5 p-2 rounded-lg border border-orange-400/10">
               <Star size={12} fill="currentColor" /> Activa tu ubicación para precisión en tiempo real.
             </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2 px-1">
             <Star size={10} className="text-orange-500" /> Resultados Disponibles
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {places.map((place, i) => (
              <div 
                key={i} 
                className={`
                  relative border transition-all duration-300 rounded-3xl p-6
                  ${place.isFeatured 
                    ? 'bg-orange-500/10 border-orange-500 shadow-[0_0_30px_rgba(255,140,0,0.1)] ring-1 ring-orange-500/50 scale-[1.02]' 
                    : 'bg-[#141416] border-white/5 hover:border-orange-500/30'}
                `}
              >
                {place.isFeatured && (
                  <div className="absolute -top-3 left-6 px-3 py-1 bg-orange-500 text-black text-[9px] font-black uppercase rounded-full shadow-lg flex items-center gap-1">
                    <ShieldCheck size={10} /> RECOMENDADO OFICIAL
                  </div>
                )}
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <h4 className={`text-xl font-bold font-brand tracking-tight ${place.isFeatured ? 'text-orange-500' : 'text-white'}`}>
                      {place.title}
                    </h4>
                    {place.address && (
                      <p className="text-xs text-orange-300 flex items-center gap-1 font-mono">
                        <MapPin size={12} /> {place.address}
                      </p>
                    )}
                    {place.snippets.length > 0 && (
                      <p className="text-sm text-gray-400 italic leading-relaxed line-clamp-2">
                        "{place.snippets[0]}"
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <a 
                      href={place.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`
                        flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all
                        ${place.isFeatured 
                          ? 'bg-orange-500 text-black hover:bg-orange-400' 
                          : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'}
                      `}
                    >
                      <Navigation size={18} /> CÓMO LLEGAR
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {places.length === 0 && !isLoading && (
            <div className="py-20 text-center text-gray-600 bg-[#141416] rounded-3xl border border-dashed border-white/5">
               <MapPin size={48} className="mx-auto mb-4 opacity-10" />
               <p className="text-sm">Inicia una búsqueda para ver los distribuidores en tu zona.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapsView;
