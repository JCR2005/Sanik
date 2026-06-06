import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';
import { 
  Wind, MapPin, Droplets, Layers, ArrowLeft, Info, Leaf, Thermometer, Flame, Cloud
} from 'lucide-react';
import { devices as devicesApi } from '../services/api'; 
import logoImg from "../assets/logo2.svg"; 

// ─── COLORES DEL LANDING ────────────────────────────────────────────────────
const COLORS = {
  primary: "#67B7E8",
  accent: "#2BA8A0",
  bgDark: "#0A0F18",
  bgLight: "#F0F7FC",
  text: "#0A0F18",
  textMuted: "#5A7080",
  border: "#D6E8F5",
  white: "#ffffff",
};

// ─── GEOJSON ZONAS DE QUETZALTENANGO ────────────────────────────────────────
// Polígonos aproximados de las zonas urbanas de Quetzaltenango
const XELA_ZONAS_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { zona: "Zona 1", nombre: "Centro Histórico" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-91.5260, 14.8430], [-91.5180, 14.8430],
          [-91.5180, 14.8360], [-91.5260, 14.8360], [-91.5260, 14.8430]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { zona: "Zona 2", nombre: "Minerva" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-91.5350, 14.8430], [-91.5260, 14.8430],
          [-91.5260, 14.8360], [-91.5350, 14.8360], [-91.5350, 14.8430]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { zona: "Zona 3", nombre: "La Democracia" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-91.5180, 14.8430], [-91.5100, 14.8430],
          [-91.5100, 14.8360], [-91.5180, 14.8360], [-91.5180, 14.8430]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { zona: "Zona 4", nombre: "San Bartolomé" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-91.5260, 14.8360], [-91.5180, 14.8360],
          [-91.5180, 14.8290], [-91.5260, 14.8290], [-91.5260, 14.8360]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { zona: "Zona 5", nombre: "El Calvario" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-91.5350, 14.8360], [-91.5260, 14.8360],
          [-91.5260, 14.8290], [-91.5350, 14.8290], [-91.5350, 14.8360]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { zona: "Zona 6", nombre: "La Florida" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-91.5180, 14.8360], [-91.5100, 14.8360],
          [-91.5100, 14.8290], [-91.5180, 14.8290], [-91.5180, 14.8360]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { zona: "Zona 7", nombre: "Vista Hermosa" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-91.5260, 14.8290], [-91.5180, 14.8290],
          [-91.5180, 14.8220], [-91.5260, 14.8220], [-91.5260, 14.8290]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { zona: "Zona 8", nombre: "Los Trigales" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-91.5350, 14.8290], [-91.5260, 14.8290],
          [-91.5260, 14.8220], [-91.5350, 14.8220], [-91.5350, 14.8290]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { zona: "Zona 9", nombre: "Las Rosas" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-91.5180, 14.8290], [-91.5100, 14.8290],
          [-91.5100, 14.8220], [-91.5180, 14.8220], [-91.5180, 14.8290]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { zona: "Zona 10", nombre: "Xetuj" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-91.5430, 14.8430], [-91.5350, 14.8430],
          [-91.5350, 14.8290], [-91.5430, 14.8290], [-91.5430, 14.8430]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { zona: "Zona 11", nombre: "La Pedrera" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-91.5100, 14.8430], [-91.5020, 14.8430],
          [-91.5020, 14.8290], [-91.5100, 14.8290], [-91.5100, 14.8430]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { zona: "Zona 12", nombre: "Las Flores" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-91.5430, 14.8290], [-91.5260, 14.8290],
          [-91.5260, 14.8150], [-91.5430, 14.8150], [-91.5430, 14.8290]
        ]]
      }
    },
  ]
};

// Paleta de colores para cada zona
const ZONA_COLORS = [
  "#67B7E8", "#2BA8A0", "#7C9BE8", "#E8A067", "#A067E8",
  "#E86767", "#67E8A0", "#E8C967", "#67A0E8", "#C967E8",
  "#E88067", "#67E8C9"
];

// ─── CAPA DE ZONAS DE XELA ───────────────────────────────────────────────────
const XelaZonasLayer = ({ zonaHover, onZonaHover, onZonaClick }) => {
  const getStyle = (feature, index) => {
    const color = ZONA_COLORS[index % ZONA_COLORS.length];
    const isHovered = zonaHover === feature.properties.zona;
    return {
      fillColor: color,
      fillOpacity: isHovered ? 0.55 : 0.25,
      color: color,
      weight: isHovered ? 3 : 1.5,
      opacity: 0.9,
    };
  };

  const onEachFeature = (feature, layer, index) => {
    layer.on({
      mouseover: (e) => {
        onZonaHover(feature.properties.zona);
        e.target.setStyle({
          fillOpacity: 0.55,
          weight: 3,
        });
      },
      mouseout: (e) => {
        onZonaHover(null);
        e.target.setStyle({
          fillOpacity: 0.25,
          weight: 1.5,
        });
      },
      click: () => {
        onZonaClick(feature.properties);
      },
    });
    layer.bindTooltip(
      `<strong>${feature.properties.zona}</strong><br/>${feature.properties.nombre}`,
      { sticky: true, className: 'xela-tooltip' }
    );
  };

  return (
    <GeoJSON
      key={JSON.stringify(XELA_ZONAS_GEOJSON)}
      data={XELA_ZONAS_GEOJSON}
      style={(feature) => {
        const index = XELA_ZONAS_GEOJSON.features.findIndex(
          f => f.properties.zona === feature.properties.zona
        );
        return getStyle(feature, index);
      }}
      onEachFeature={(feature, layer) => {
        const index = XELA_ZONAS_GEOJSON.features.findIndex(
          f => f.properties.zona === feature.properties.zona
        );
        onEachFeature(feature, layer, index);
      }}
    />
  );
};

// ─── FUNCIÓN DE COLORES AQI ─────────────────────────────────────────────────
const getAqiColor = (category) => {
  if (!category) return '#9CA3AF'; 
  const cat = category.toLowerCase();
  if (cat.includes('excelente')) return '#10B981'; // Verde
  if (cat.includes('buena'))     return '#34D399'; // Verde claro
  if (cat.includes('precaución')) return '#F59E0B'; // Amarillo
  if (cat.includes('mala'))      return '#F97316'; // Ocre
  if (cat.includes('peligrosa')) return '#EF4444'; // Rojo
  return '#9CA3AF';
};

// ─── MARCADOR CON ARO TRANSLÚCIDO ───────────────────────────────────────────
const createAqiIcon = (category) => {
  const color = getAqiColor(category);
  return L.divIcon({
    className: 'custom-aqi-marker',
    html: `
      <div style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <div style="
          width: 16px;
          height: 16px;
          background-color: ${color};
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 0 10px ${color}45, 0 4px 8px rgba(0,0,0,0.3);
          transition: all 0.3s ease;
        "></div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });
};

// ─── CAPA DE MAPA DE CALOR ──────────────────────────────────────────────────
const HeatmapLayer = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    const heatPoints = points.map(p => [p.lat, p.lng, 0.5]); 
    const heatLayer = L.heatLayer(heatPoints, {
      radius: 35,
      blur: 20,
      maxZoom: 12,
      gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1: 'red' }
    }).addTo(map);
    return () => map.removeLayer(heatLayer);
  }, [map, points]);
  return null;
};

export default function PublicMap() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Agregamos el estado para manejar el hover de las zonas
  const [zonaHover, setZonaHover] = useState(null);

  // 1. Cargar las estaciones e ir por el AQI en segundo plano
  useEffect(() => {
    const fetchPublicDevices = async () => {
      try {
        const res = await devicesApi.listPublic(); 
        const conGPS = res.filter(d => d.lat && d.lng); 
        setDevices(conGPS);
        setLoading(false);

        // Obtenemos el AQI real de cada uno para activar los colores en el mapa
        const devicesWithAqi = await Promise.all(
          conGPS.map(async (d) => {
            try {
              const aqiData = await devicesApi.aqiPublic(d.id);
              return { 
                ...d, 
                aqi_value: aqiData.aqi, 
                aqi_category: aqiData.category, 
                liveVariables: aqiData.variables 
              };
            } catch (error) {
              return d; 
            }
          })
        );
        setDevices(devicesWithAqi);
      } catch (error) {
        console.error("Error cargando dispositivos públicos:", error);
        setLoading(false);
      }
    };
    fetchPublicDevices();
  }, []);

  const handleDeviceClick = (device) => {
    setSelectedDevice(device);
  };

  const center = devices.length > 0 ? [devices[0].lat, devices[0].lng] : [14.8347, -91.5181]; 

  // Mapeo seguro de variables en tiempo real para la estación seleccionada
  const liveVars = selectedDevice?.liveVariables || {};
  const temp = liveVars.temperatura?.value ?? liveVars.temperature?.value ?? null;
  const hum = liveVars.humedad?.value ?? liveVars.humidity?.value ?? null;
  const co2 = liveVars.co2?.value ?? null;
  const co = liveVars.co?.value ?? null;
  const currentAqiColor = getAqiColor(selectedDevice?.aqi_category);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: COLORS.bgLight, fontFamily: 'sans-serif' }}>
      {/* ─── NAVBAR PÚBLICO ─── */}
      <header style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '16px 6vw', backgroundColor: COLORS.white, borderBottom: `1px solid ${COLORS.border}`,
        zIndex: 1000, position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={logoImg} alt="AirSunBox" style={{ height: '40px' }} />
          <h1 style={{ margin: 0, fontSize: '1.2rem', color: COLORS.text, fontWeight: 'bold' }}>
            Mapa Ambiental Público
          </h1>
        </div>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: COLORS.textMuted, textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>
          <ArrowLeft size={16} /> Volver al inicio
        </Link>
      </header>

      {/* ─── CONTENEDOR DEL MAPA Y PANEL ─── */}
      <div style={{ flex: 1, position: 'relative' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <p style={{ color: COLORS.textMuted }}>Cargando estaciones de monitoreo...</p>
          </div>
        ) : (
          <MapContainer center={center} zoom={13} style={{ width: '100%', height: '100%' }} zoomControl={false}>
            <TileLayer
              attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
            />
            
            {/* CAPA DE ZONAS AGREGADA AQUÍ */}
            <XelaZonasLayer 
              zonaHover={zonaHover} 
              onZonaHover={setZonaHover} 
              onZonaClick={(props) => console.log("Clic en zona:", props)} 
            />

            {showHeatmap && <HeatmapLayer points={devices} />}
            {!showHeatmap && devices.map(d => (
              <Marker 
                key={d.id} 
                position={[d.lat, d.lng]}
                icon={createAqiIcon(d.aqi_category)} 
                eventHandlers={{ click: () => handleDeviceClick(d) }} 
              />
            ))}
          </MapContainer>
        )}

        {/* ─── CONTROLES FLOTANTES ─── */}
        <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 1000 }}>
          <button 
            onClick={() => setShowHeatmap(!showHeatmap)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
              backgroundColor: COLORS.white, color: showHeatmap ? COLORS.primary : COLORS.textMuted,
              border: `1px solid ${COLORS.border}`, borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <Layers size={18} /> {showHeatmap ? "Ocultar Mapa de Calor" : "Ver Mapa de Calor"}
          </button>
        </div>

        {/* ─── PANEL DETALLADO FLOTANTE (ESTILO DE TU IMAGEN) ─── */}
        {selectedDevice && !showHeatmap && (
          <div style={{
            position: 'absolute', top: '20px', right: '20px', zIndex: 1000, 
            width: '440px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto',
            backgroundColor: COLORS.white, borderRadius: '28px', padding: '24px',
            boxShadow: '0 15px 35px rgba(0,0,0,0.12)', border: `1px solid ${COLORS.border}`
          }}>
            {/* Cabecera del Panel */}
            <button 
              onClick={() => setSelectedDevice(null)}
              style={{ float: 'right', background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: '1.5rem', marginTop: '-4px' }}
            >
              &times;
            </button>
            <h3 style={{ margin: '0 0 4px 0', color: COLORS.text, fontSize: '1.25rem', fontWeight: 'bold' }}>{selectedDevice.name}</h3>
            <p style={{ margin: '0 0 20px 0', color: COLORS.textMuted, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} /> {selectedDevice.description || 'Estación de monitoreo ambiental activa'}
            </p>

            {/* CONTENEDOR DOS COLUMNAS PRINCIPALES */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr', gap: '20px', alignItems: 'stretch' }}>
              
              {/* BLOQUE IZQUIERDO: CALIDAD DEL AIRE (CÍRCULO GRANDE) */}
              <div style={{ 
                border: `1px solid ${COLORS.border}`, borderRadius: '24px', padding: '16px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
                textAlign: 'center', backgroundColor: COLORS.white
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Calidad del Aire</span>
                  <Info size={12} color={COLORS.primary} />
                </div>

                {/* Barra de colores Superior */}
                <div style={{ width: '100%', position: 'relative', margin: '10px 0' }}>
                  <div style={{ display: 'flex', width: '100%', height: '5px', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ flex: 1, backgroundColor: '#10B981' }}></div>
                    <div style={{ flex: 1, backgroundColor: '#34D399' }}></div>
                    <div style={{ flex: 1, backgroundColor: '#F59E0B' }}></div>
                    <div style={{ flex: 1, backgroundColor: '#F97316' }}></div>
                    <div style={{ flex: 1, backgroundColor: '#EF4444' }}></div>
                  </div>
                  {selectedDevice.aqi_value != null && (
                    <div style={{
                      position: 'absolute', top: '1px', left: `calc(${Math.min(100, Math.max(0, selectedDevice.aqi_value))}% - 4px)`,
                      width: '8px', height: '8px', backgroundColor: 'white', border: '1px solid #9CA3AF', borderRadius: '50%'
                    }} />
                  )}
                </div>

                {/* Círculo Principal de Color */}
                <div style={{
                  width: '120px', height: '120px', borderRadius: '50%', backgroundColor: currentAqiColor,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  color: 'white', boxShadow: `0 10px 25px ${currentAqiColor}60`, transition: 'all 0.4s'
                }}>
                  <Leaf size={22} style={{ marginBottom: '2px' }} />
                  <span style={{ fontSize: '2.2rem', fontWeight: '900', lineHeight: 1 }}>
                    {selectedDevice.aqi_value !== null ? Math.round(selectedDevice.aqi_value) : '--'}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {selectedDevice.aqi_category || 'Cargando'}
                  </span>
                </div>

                {/* Texto Descriptivo Inferior */}
                <div style={{ 
                  marginTop: '12px', padding: '6px 8px', borderRadius: '10px', 
                  backgroundColor: COLORS.bgLight, border: `1px solid ${COLORS.border}`
                }}>
                  <p style={{ margin: 0, fontSize: '0.68rem', color: COLORS.text, fontWeight: '500' }}>
                    {selectedDevice.aqi_category?.toLowerCase().includes('excelente') && 'El aire es ideal. Sin riesgo.'}
                    {selectedDevice.aqi_category?.toLowerCase().includes('buena') && 'Calidad aceptable. Riesgo mínimo.'}
                    {selectedDevice.aqi_category?.toLowerCase().includes('precaución') && 'Grupos sensibles limitar esfuerzo.'}
                    {selectedDevice.aqi_category?.toLowerCase().includes('mala') && '⚠️ Riesgo. Reducir exteriores.'}
                    {selectedDevice.aqi_category?.toLowerCase().includes('peligrosa') && '🚨 Peligro. Quédate dentro.'}
                    {!selectedDevice.aqi_category && 'Esperando datos...'}
                  </p>
                </div>
              </div>

              {/* BLOQUE DERECHO: MÉTRICAS (Temperatura, Humedad, CO2, Monóxido) */}
              <div style={{ display: 'grid', gridTemplateRows: '1fr auto 1fr', gap: '10px' }}>
                
                {/* Fila 1: Temp y Humedad */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ textAlign: 'left', padding: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <Thermometer size={16} color="#EF4444" />
                      <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: COLORS.textMuted, textTransform: 'uppercase' }}>Temperatura</span>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '900', color: COLORS.text }}>
                      {temp != null ? Number(temp).toFixed(1) : '--'}
                      <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#EF4444', marginLeft: '2px' }}>°C</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'left', padding: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <Droplets size={16} color="#3B82F6" />
                      <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: COLORS.textMuted, textTransform: 'uppercase' }}>Humedad</span>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '900', color: COLORS.text }}>
                      {hum != null ? Number(hum).toFixed(1) : '--'}
                      <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#3B82F6', marginLeft: '2px' }}>%</span>
                    </div>
                  </div>
                </div>

                {/* Línea Divisora Intermedia */}
                <div style={{ height: '1px', backgroundColor: COLORS.border, margin: '4px 0' }}></div>

                {/* Fila 2: CO2 y CO */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ textAlign: 'left', padding: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <Cloud size={16} color="#8B5CF6" />
                      <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: COLORS.textMuted, textTransform: 'uppercase' }}>Dióxido Carbono</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: COLORS.text }}>
                      {co2 != null ? Number(co2).toFixed(0) : '--'}
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#8B5CF6', marginLeft: '2px' }}>ppm</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'left', padding: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <Wind size={16} color="#F97316" />
                      <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: COLORS.textMuted, textTransform: 'uppercase' }}>Monóxido</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: COLORS.text }}>
                      {co != null ? Number(co).toFixed(1) : '--'}
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#F97316', marginLeft: '2px' }}>ppm</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}