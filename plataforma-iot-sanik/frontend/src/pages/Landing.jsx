import { Link } from 'react-router-dom'
import { Wind, ArrowRight, Zap, BarChart2, Bell, Shield, Map, Cpu } from 'lucide-react'

export default function Landing() {
  return (
    <div style={{fontFamily:'DM Sans,sans-serif',background:'#0A0F0D',color:'#F0F5F2',minHeight:'100vh'}}>

      {/* NAV */}
      <nav style={{position:'sticky',top:0,zIndex:100,padding:'16px 6vw',display:'flex',alignItems:'center',justifyContent:'space-between',background:'rgba(10,15,13,.9)',backdropFilter:'blur(16px)',borderBottom:'1px solid #1E2E28'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:36,height:36,background:'#1D9E75',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Wind size={18} color="white"/>
          </div>
          <span style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'1.2rem'}}>Sanik</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:24}}>
          <a href="#como-funciona" style={{color:'#8FA899',textDecoration:'none',fontSize:'.9rem'}}>Cómo funciona</a>
          <a href="#precios" style={{color:'#8FA899',textDecoration:'none',fontSize:'.9rem'}}>Precios</a>
          <Link to="/login" style={{background:'#1D9E75',color:'#fff',padding:'8px 20px',borderRadius:8,textDecoration:'none',fontSize:'.9rem',fontWeight:500}}>Ingresar</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{minHeight:'90vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'80px 6vw 60px',position:'relative'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(29,158,117,.15)',border:'1px solid rgba(29,158,117,.3)',color:'#25C48F',padding:'6px 16px',borderRadius:99,fontSize:'.8rem',fontWeight:500,marginBottom:32}}>
          <span style={{width:6,height:6,background:'#25C48F',borderRadius:'50%',display:'inline-block'}}/>
          Monitoreo ambiental en tiempo real
        </div>
        <h1 style={{fontFamily:'Syne,sans-serif',fontSize:'clamp(2.8rem,6vw,4.5rem)',fontWeight:800,lineHeight:1.05,marginBottom:24,letterSpacing:'-.02em'}}>
          Aire limpio,<br/><span style={{color:'#25C48F'}}>datos claros</span><br/>para Guatemala
        </h1>
        <p style={{fontSize:'1.1rem',color:'#8FA899',lineHeight:1.7,maxWidth:540,marginBottom:40}}>
          Sanik conecta tus estaciones IoT con una plataforma que visualiza, alerta y registra la calidad del aire en tiempo real. Diseñado para municipalidades y empresas.
        </p>
        <div style={{display:'flex',gap:16,flexWrap:'wrap',justifyContent:'center'}}>
          <a href="#precios" style={{background:'#1D9E75',color:'#fff',padding:'14px 32px',borderRadius:10,textDecoration:'none',fontWeight:500,display:'flex',alignItems:'center',gap:8}}>
            Ver planes <ArrowRight size={16}/>
          </a>
          <a href="#como-funciona" style={{background:'transparent',color:'#F0F5F2',padding:'14px 32px',borderRadius:10,textDecoration:'none',border:'1px solid #1E2E28'}}>
            Cómo funciona
          </a>
        </div>
      </section>

      {/* STATS */}
      <div style={{borderTop:'1px solid #1E2E28',borderBottom:'1px solid #1E2E28',padding:'60px 6vw'}}>
        <div style={{maxWidth:800,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20,textAlign:'center'}}>
          {[['9+','Variables por estación'],['2 años','Historial almacenado'],['24/7','Monitoreo continuo']].map(([n,l])=>(
            <div key={l}><div style={{fontFamily:'Syne,sans-serif',fontSize:'2.5rem',fontWeight:800,color:'#25C48F'}}>{n}</div><div style={{color:'#8FA899',fontSize:'.9rem',marginTop:8}}>{l}</div></div>
          ))}
        </div>
      </div>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" style={{padding:'100px 6vw',maxWidth:1100,margin:'0 auto'}}>
        <div style={{color:'#1D9E75',fontSize:'.8rem',textTransform:'uppercase',letterSpacing:'.1em',fontWeight:600,marginBottom:12}}>Proceso</div>
        <h2 style={{fontFamily:'Syne,sans-serif',fontSize:'clamp(1.8rem,3vw,2.8rem)',fontWeight:800,marginBottom:60}}>Simple desde el día uno</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:32}}>
          {[['01','Instalamos la estación','Nuestro equipo instala la estación ESP32 con todos los sensores. Viene lista para conectarse a tu red WiFi.'],
            ['02','Activamos tu cuenta','Creamos tu cuenta en Sanik, configuramos tus dispositivos y te damos tus credenciales de acceso.'],
            ['03','Monitoreás en tiempo real','Entrás a tu dashboard desde cualquier dispositivo y ves todos tus datos con historial y alertas.']
          ].map(([n,t,d])=>(
            <div key={n}>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:'3rem',fontWeight:800,color:'#1E2E28',marginBottom:16}}>{n}</div>
              <div style={{fontWeight:600,marginBottom:8}}>{t}</div>
              <div style={{color:'#8FA899',fontSize:'.9rem',lineHeight:1.6}}>{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="funcionalidades" style={{padding:'100px 6vw',background:'#111810',borderTop:'1px solid #1E2E28'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{color:'#1D9E75',fontSize:'.8rem',textTransform:'uppercase',letterSpacing:'.1em',fontWeight:600,marginBottom:12}}>Funcionalidades</div>
          <h2 style={{fontFamily:'Syne,sans-serif',fontSize:'clamp(1.8rem,3vw,2.8rem)',fontWeight:800,marginBottom:60}}>Todo lo que necesitás</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:20}}>
            {[[Zap,'Tiempo real','Los datos llegan en segundos vía MQTT. Sin demoras.'],
              [BarChart2,'Gráficas históricas','1h a 30 días. Identificá patrones y tendencias.'],
              [Bell,'Alertas automáticas','Umbrales por sensor. Notificaciones por correo o webhook.'],
              [Map,'Mapa de estaciones','Ubicación exacta de cada estación con estado en vivo.'],
              [Cpu,'Multi-dispositivo','Todas tus estaciones desde un solo panel.'],
              [Shield,'Seguro y confiable','JWT, datos cifrados, 2 años de historial.']
            ].map(([Icon,t,d])=>(
              <div key={t} style={{background:'#121A16',border:'1px solid #1E2E28',borderRadius:16,padding:24}}>
                <div style={{width:44,height:44,background:'rgba(29,158,117,.1)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16}}>
                  <Icon size={20} color="#25C48F"/>
                </div>
                <div style={{fontWeight:600,marginBottom:8}}>{t}</div>
                <div style={{color:'#8FA899',fontSize:'.875rem',lineHeight:1.6}}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios" style={{padding:'100px 6vw',maxWidth:1000,margin:'0 auto'}}>
        <div style={{color:'#1D9E75',fontSize:'.8rem',textTransform:'uppercase',letterSpacing:'.1em',fontWeight:600,marginBottom:12}}>Planes</div>
        <h2 style={{fontFamily:'Syne,sans-serif',fontSize:'clamp(1.8rem,3vw,2.8rem)',fontWeight:800,marginBottom:60}}>Precios en quetzales</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:20}}>
          {[
            {name:'Gratuito',price:'Q0',period:'/mes',desc:'Para proyectos pequeños',features:['1 dispositivo','Datos en tiempo real','Historial 7 días','Alertas básicas'],popular:false},
            {name:'Pro',price:'Q299',period:'/mes',desc:'Para equipos en crecimiento',features:['10 dispositivos','Datos en tiempo real','Historial 30 días','Alertas avanzadas','Exportación de datos','Soporte prioritario'],popular:true},
            {name:'Empresarial',price:'Personalizado',period:'',desc:'Para grandes organizaciones',features:['Dispositivos ilimitados','Historial ilimitado','API dedicada','Reportes personalizados','Soporte 24/7'],popular:false},
          ].map(p=>(
            <div key={p.name} style={{background:'#121A16',border:`1px solid ${p.popular?'#1D9E75':'#1E2E28'}`,borderRadius:16,padding:28,position:'relative',background:p.popular?'linear-gradient(145deg,#121A16,rgba(29,158,117,.05))':'#121A16'}}>
              {p.popular && <div style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',background:'#1D9E75',color:'#fff',padding:'4px 16px',borderRadius:99,fontSize:'.75rem',fontWeight:600}}>Popular</div>}
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:'1.2rem',marginBottom:4}}>{p.name}</div>
              <div style={{color:'#25C48F',fontFamily:'Syne,sans-serif',fontSize:'2.2rem',fontWeight:800,margin:'16px 0 4px'}}>{p.price}<span style={{fontSize:'1rem',color:'#8FA899'}}>{p.period}</span></div>
              <div style={{color:'#8FA899',fontSize:'.85rem',marginBottom:20}}>{p.desc}</div>
              <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:24}}>
                {p.features.map(f=>(
                  <div key={f} style={{display:'flex',alignItems:'center',gap:10,fontSize:'.875rem',color:'#8FA899'}}>
                    <span style={{color:'#1D9E75'}}>✓</span>{f}
                  </div>
                ))}
              </div>
              <a href="mailto:contacto@sanik.io" style={{display:'block',textAlign:'center',padding:'11px',borderRadius:8,border:p.popular?'none':'1px solid #1E2E28',background:p.popular?'#1D9E75':'transparent',color:p.popular?'#fff':'#8FA899',textDecoration:'none',fontSize:'.9rem',fontWeight:500}}>
                Contactar
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:'100px 6vw',textAlign:'center',borderTop:'1px solid #1E2E28'}}>
        <h2 style={{fontFamily:'Syne,sans-serif',fontSize:'clamp(2rem,4vw,3rem)',fontWeight:800,marginBottom:16}}>¿Listo para monitorear<br/>tu aire en tiempo real?</h2>
        <p style={{color:'#8FA899',fontSize:'1rem',marginBottom:40}}>Contactanos y te tenemos la primera estación funcionando en menos de una semana.</p>
        <div style={{display:'flex',gap:16,justifyContent:'center',flexWrap:'wrap'}}>
          <a href="https://wa.me/502" style={{background:'#1D9E75',color:'#fff',padding:'14px 32px',borderRadius:10,textDecoration:'none',fontWeight:500}}>WhatsApp</a>
          <a href="mailto:contacto@sanik.io" style={{border:'1px solid #1E2E28',color:'#F0F5F2',padding:'14px 32px',borderRadius:10,textDecoration:'none'}}>contacto@sanik.io</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{padding:'32px 6vw',borderTop:'1px solid #1E2E28',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:30,height:30,background:'#1D9E75',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}><Wind size={14} color="white"/></div>
          <span style={{fontFamily:'Syne,sans-serif',fontWeight:800}}>Sanik</span>
        </div>
        <div style={{color:'#8FA899',fontSize:'.85rem'}}>© 2026 Sanik · Monitoreo ambiental para Guatemala</div>
        <div style={{display:'flex',gap:20}}>
          <Link to="/login" style={{color:'#8FA899',textDecoration:'none',fontSize:'.85rem'}}>Ingresar</Link>
          <a href="mailto:contacto@sanik.io" style={{color:'#8FA899',textDecoration:'none',fontSize:'.85rem'}}>Contacto</a>
        </div>
      </footer>

    </div>
  )
}
