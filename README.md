# Sistema de Seguimiento de Contratos (SSC) - Backend

## Descripción

Backend del Sistema de Seguimiento de Contratos, desarrollado con NestJS. Este sistema permite la gestión y seguimiento de contratos de obras públicas, incluyendo sus modificaciones, adiciones presupuestales y seguimiento de actividades.

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- Node.js (v18 o superior)
- npm (v9 o superior)
- PostgreSQL (v15 o superior)

## Configuración del Proyecto

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd SSC-Backend
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:

Crea un archivo `.env` en la raíz del proyecto con la siguiente estructura:
```env
# Configuración del servidor
PORT=3000
NODE_ENV=development

# Configuración de la base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_contraseña
DB_DATABASE=ssc_db
DB_SCHEMA=SSC

# Configuración de JWT
JWT_SECRET=tu_clave_secreta_jwt
JWT_EXPIRATION=24h
```

4. Configura la base de datos:

- Crea una base de datos PostgreSQL con el nombre especificado en `DB_DATABASE`
- Crea el schema especificado en `DB_SCHEMA`

5. Ejecuta las migraciones:
```bash
npm run migration:run
```

6. (Opcional) Ejecuta el seeder para datos iniciales:
```bash
npm run seed
```

## Ejecución del Proyecto

```bash
# Modo desarrollo
npm run start:dev

# Modo debug
npm run start:debug

# Modo producción
npm run start:prod
```

## Pruebas

```bash
# Pruebas unitarias
npm run test

# Pruebas e2e
npm run test:e2e

# Cobertura de pruebas
npm run test:cov
```

## Estructura del Proyecto

```
src/
├── actividades/         # Gestión de actividades de obra
├── adiciones/          # Gestión de adiciones presupuestales
├── auth/              # Autenticación y autorización
├── contratos/         # Gestión de contratos
├── cuo/               # Gestión de CUO (Código Único de Obra)
├── database/          # Configuración y migraciones de base de datos
├── modificaciones/    # Gestión de modificaciones contractuales
├── seguimiento-*/     # Módulos de seguimiento
└── usuarios/          # Gestión de usuarios
```

## Roles y Permisos

El sistema maneja dos roles principales:

- **ADMIN**: Acceso total al sistema y gestión de usuarios
- **SUPERVISOR**: Gestión y seguimiento de obras

## Documentación API

La documentación de la API está disponible en la ruta `/api` cuando el servidor está en ejecución. Esta documentación está generada con Swagger y permite probar los endpoints directamente desde el navegador.

## Comandos Útiles

```bash
# Formatear código
npm run format

# Verificar linting
npm run lint

# Generar nueva migración
npm run migration:generate nombre_migracion

# Crear migración en blanco
npm run migration:create nombre_migracion

# Revertir última migración
npm run migration:revert
```

## Soporte

Para reportar problemas o solicitar ayuda, por favor crea un issue en el repositorio del proyecto.

## Licencia

Este proyecto está licenciado bajo [LICENCIA]. Consulta el archivo LICENSE para más detalles.


Testeo commit from github in qa branch
