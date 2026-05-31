import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Cpu,
  Bell,
  User,
  LogOut,
  Sun,
  Moon
} from 'lucide-react'
import useAuthStore from '../../store/auth'

const AirSunBoxLogo = ({ size = 220 }) => (
  <svg
    width={size}
    height={(size * 500) / 900}
    viewBox="0 0 900 500"
    xmlns="http://www.w3.org/2000/svg"
  >
    <style>{`
      .blue{
        stroke:#67B7E8;
        fill:none;
        stroke-width:10;
        stroke-linecap:round;
        stroke-linejoin:round;
      }

      .text{
        fill:#67B7E8;
        font-family:Arial,sans-serif;
        font-size:72px;
        font-weight:bold;
      }
    `}</style>

    <circle className="blue" cx="260" cy="220" r="110"/>

    <line className="blue" x1="260" y1="60" x2="260" y2="10"/>
    <line className="blue" x1="260" y1="380" x2="260" y2="430"/>

    <line className="blue" x1="110" y1="220" x2="50" y2="220"/>
    <line className="blue" x1="410" y1="220" x2="470" y2="220"/>

    <line className="blue" x1="150" y1="110" x2="105" y2="65"/>
    <line className="blue" x1="370" y1="330" x2="415" y2="375"/>

    <line className="blue" x1="370" y1="110" x2="415" y2="65"/>
    <line className="blue" x1="150" y1="330" x2="105" y2="375"/>

    <line className="blue" x1="205" y1="80" x2="185" y2="35"/>
    <line className="blue" x1="315" y1="80" x2="335" y2="35"/>

    <line className="blue" x1="205" y1="360" x2="185" y2="405"/>
    <line className="blue" x1="315" y1="360" x2="335" y2="405"/>

    <path
      className="blue"
      d="M470 180
      C540 180,560 180,600 180
      C650 180,670 120,620 120
      C585 120,575 150,590 160"
    />

    <path
      className="blue"
      d="M450 220
      C560 220,620 220,720 220
      C790 220,810 140,740 140
      C700 140,690 180,715 190"
    />

    <path
      className="blue"
      d="M470 280
      C560 280,620 280,680 280
      C740 280,760 350,700 350
      C660 350,655 310,680 300"
    />

    <path
      className="blue"
      d="M720 270
      C780 270,790 270,810 270
      C850 270,860 330,820 330
      C790 330,785 300,800 290"
    />

    <text className="text" x="340" y="430">
      AirSunBox
    </text>
  </svg>
)

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()

  const logout =
    useAuthStore((state) => state.logout) ||
    (() => {
      localStorage.removeItem('token')
      navigate('/login')
    })

  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark')
  )

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const LINKS = [
    {
      path: '/devices',
      label: 'Estaciones',
      icon: Cpu
    },
    {
      path: '/alerts',
      label: 'Alertas',
      icon: Bell
    },
    {
      path: '/profile',
      label: 'Perfil',
      icon: User
    }
  ]

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: '#F0F7FC',
        borderBottom: '1px solid rgba(103,183,232,.15)',
        backdropFilter: 'blur(16px)'
      }}
    >
      <div
        className="max-w-7xl mx-auto px-8"
        style={{
          minHeight: '110px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* LOGO */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'flex-start'
          }}
        >
          <Link to="/devices">
            <AirSunBoxLogo size={220} />
          </Link>
        </div>

        {/* MENU */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          {LINKS.map((item) => {
            const Icon = item.icon

            const active =
              location.pathname.startsWith(item.path)

            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '14px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '.95rem',
                  transition: '.25s',
                  color: active
                    ? '#67B7E8'
                    : '#607284',
                  background: active
                    ? 'rgba(103,183,232,.12)'
                    : 'transparent'
                }}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* DERECHA */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-xl"
          >
            {isDark ? (
              <Sun size={18} color="#F59E0B" />
            ) : (
              <Moon size={18} color="#67B7E8" />
            )}
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '14px',
              background: '#FFFFFF',
              border:
                '1px solid rgba(103,183,232,.12)'
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background:
                  'rgba(103,183,232,.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <User
                size={18}
                color="#67B7E8"
              />
            </div>

            <div>
              <div
                style={{
                  fontSize: '.85rem',
                  fontWeight: 700,
                  color: '#0A0F18'
                }}
              >
                Cliente
              </div>

              <div
                style={{
                  fontSize: '.75rem',
                  color: '#607284'
                }}
              >
                AirSunBox
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: '10px',
              borderRadius: '12px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <LogOut
              size={18}
              color="#ef4444"
            />
          </button>
        </div>
      </div>
    </header>
  )
}