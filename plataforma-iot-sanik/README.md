# Plataforma IoT — Setup

## Requisitos
- Docker Desktop instalado
- Git

## Levantar todo con un comando

```bash
docker-compose up -d
```

Eso levanta los 5 servicios:

| Servicio      | URL / Puerto                        |
|---------------|-------------------------------------|
| Frontend      | http://localhost                    |
| Backend API   | http://localhost:3000               |
| MQTT          | mqtt://localhost:1883               |
| EMQX Panel    | http://localhost:18083              |
| TimescaleDB   | localhost:5432                      |
| Redis         | localhost:6379                      |

## Credenciales por defecto

**Base de datos**
- Usuario: `iot_user`
- Password: `iot_password`
- Base: `iot_platform`

**EMQX Panel** (administración del broker MQTT)
- URL: http://localhost:18083
- Usuario: `admin`
- Password: `public`

## Estructura del proyecto

```
plataforma-iot/
├── docker-compose.yml      ← levanta todo
├── database/
│   └── init.sql            ← tablas de la base de datos
├── backend/                ← Node.js + Fastify (Prog. 1)
└── frontend/               ← React + Vite (Prog. 2)
```

## Comandos útiles

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs solo del backend
docker-compose logs -f backend

# Reiniciar un servicio
docker-compose restart backend

# Apagar todo
docker-compose down

# Apagar todo y borrar datos
docker-compose down -v
```

## Configuración del ESP32

El ESP32 manda datos a:
```
MQTT broker: mqtt://TU_IP:1883
Topic:       /v1/devices/{DEVICE_TOKEN}/data
Payload:     {"temperatura": 25.4, "humedad": 60}
```

## Deploy en Railway

1. Subir el repo a GitHub
2. Crear proyecto en railway.app
3. Agregar cada servicio desde el repo
4. Las variables de entorno ya están en docker-compose.yml
