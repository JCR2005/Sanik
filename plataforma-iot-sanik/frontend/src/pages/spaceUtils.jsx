import {
  Layers, MapPin,
  Wind, Droplets, Mountain, Volume2,
  Sun, Leaf, Flame, Cloud, Waves, Thermometer, HeartPulse, Cpu, Server, Gauge,
  Moon, Star, Sunrise, Sunset, CloudRain, CloudSnow, CloudLightning, CloudSun, Cloudy, Snowflake,
  Bug, Sprout, Flower2, Factory, Building2, Warehouse, Rabbit, Briefcase, Zap,
  BatteryFull, Timer, Hourglass, Lock, Shield, ShieldAlert, Key, Radar, Network, Satellite, Bluetooth, Target, Database, Brain
} from 'lucide-react'

export const TYPE_LABELS = { aire: 'Aire', agua: 'Agua', suelo: 'Suelo', ruido: 'Ruido', otro: 'Otro' }

export const generateLabel = (text) => text
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
   .replace(/(^-|-$)+/g, '')

export const iconByLabel = {
  aire: Wind, tierra: Leaf, agua: Droplets, suelo: Mountain, ruido: Volume2,
  otro: Layers, 'map-pin': MapPin,
  sensor: Cpu, gota: Droplets, viento: Wind, sol: Sun, hoja: Leaf, llama: Flame,
  thermo: Thermometer, nube: Cloud, onda: Waves, servidor: Server,
  heart: HeartPulse, luna: Moon, estrella: Star, amanecer: Sunrise, atardecer: Sunset,
  lluvia: CloudRain, nieve: CloudSnow, tormenta: CloudLightning, solnube: CloudSun,
  nublado: Cloudy, copo: Snowflake, insecto: Bug, brote: Sprout, flor: Flower2,
  fabrica: Factory, edificio: Building2, deposito: Warehouse, conejo: Rabbit,
  negocio: Briefcase, relampago: Zap, bateria: BatteryFull, tiempo: Timer,
  horas: Hourglass, candado: Lock, escudo: Shield, alerta: ShieldAlert, llave: Key,
  radar: Radar, red: Network, blue: Bluetooth, satelite: Satellite, blanco: Target,
  base: Database, cerebro: Brain, medidor: Gauge
}

export const spaceIcon = (label, fallback, size = 18) => {
  const C = (label && iconByLabel[label]) ? iconByLabel[label]
            : (iconByLabel[fallback] || Layers)
  return <C size={size} />
}

export const DEFAULT_CATS = [
  { name: 'Bien',   color: '#10B981' },
  { name: 'Precaución', color: '#F59E0B' },
  { name: 'Mal',    color: '#EF4444' }
]

export function buildTram(n) {
  const out = []
  for (let i = 0; i < n; i++) {
    out.push({
      score_lo: Math.round((100 / n) * i),
      score_hi: Math.round((100 / n) * (i + 1)) - 1
    })
  }
  out[n - 1].score_hi = 100
  return out
}

export function toConfig(categories, includedVars, ranges) {
  return {
    categories: categories.map((c, i) => ({
      name: c.name, color: c.color, score_lo: c.score_lo, score_hi: c.score_hi
    })),
    variables: includedVars.map((v, i) => ({ variable_label: v.label })),
    ranges
  }
}