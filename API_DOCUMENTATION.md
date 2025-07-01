# 📚 Documentación API Sistema de Seguimiento de Contratos (SSC)

## 🌟 Introducción

El Sistema de Seguimiento de Contratos (SSC) es una API REST desarrollada para la Alcaldía de Medellín que permite gestionar y hacer seguimiento a contratos de obra pública de manera eficiente y transparente.

## 🚀 Acceso a la Documentación

- **Documentación Interactiva (Swagger)**: `http://localhost:3000/docs`
- **Health Check**: `http://localhost:3000/health`

## 🏗️ Arquitectura del Sistema

### Roles y Permisos

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **ADMIN** | Administrador del sistema | - Crear y gestionar usuarios<br>- Acceso completo a todos los contratos<br>- Crear, modificar y eliminar contratos<br>- Gestionar modificaciones y adiciones |
| **SUPERVISOR** | Supervisor de contratos | - Acceso solo a contratos asignados<br>- Crear y gestionar CUO de sus contratos<br>- Registrar seguimientos<br>- Ver reportes de sus contratos |

## 📊 Estructura de Datos

```
SSC-Backend/
├── Usuarios (Administración de usuarios)
├── Contratos (Gestión de contratos municipales)
├── CUO (Código Único de Obra)
├── Actividades (Actividades específicas por CUO)
├── Seguimiento General (Avance físico/financiero)
├── Seguimiento de Actividades (Seguimiento detallado)
├── Modificaciones (Cambios en contratos)
└── Adiciones (Adiciones presupuestales)
```

## 🔐 Autenticación

### 1. Registro de Usuario (Solo ADMIN)

```bash
POST /auth/register
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "cedula": "1234567890",
  "email": "supervisor@medellin.gov.co",
  "password": "MiPassword123",
  "nombre": "Juan Carlos Pérez",
  "rol": "SUPERVISOR"
}
```

### 2. Inicio de Sesión

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "supervisor@medellin.gov.co",
  "password": "MiPassword123"
}
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Uso del Token

Incluye el token en todas las peticiones protegidas:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📋 Flujos de Trabajo Principales

### 1. Flujo de Creación de Contrato

```mermaid
sequenceDiagram
    participant A as Admin
    participant API as API SSC
    participant DB as Base de Datos
    
    A->>API: POST /auth/login
    API-->>A: access_token
    
    A->>API: POST /contratos
    Note over A,API: Crear contrato con supervisor asignado
    API->>DB: Guardar contrato
    API-->>A: Contrato creado
    
    A->>API: POST /cuo
    Note over A,API: Crear CUO para el contrato
    API->>DB: Guardar CUO
    API-->>A: CUO creado
```

### 2. Flujo de Seguimiento

```mermaid
sequenceDiagram
    participant S as Supervisor
    participant API as API SSC
    participant DB as Base de Datos
    
    S->>API: POST /auth/login
    API-->>S: access_token
    
    S->>API: GET /contratos
    Note over S,API: Ver contratos asignados
    API-->>S: Lista de contratos
    
    S->>API: POST /actividades
    Note over S,API: Crear actividades en CUO
    API->>DB: Guardar actividad
    API-->>S: Actividad creada
    
    S->>API: POST /seguimiento-actividad
    Note over S,API: Registrar avance de actividad
    API->>DB: Guardar seguimiento
    API-->>S: Seguimiento registrado
    
    S->>API: POST /seguimiento-general
    Note over S,API: Registrar seguimiento general
    API->>DB: Guardar seguimiento general
    API-->>S: Seguimiento general registrado
```

## 📊 Ejemplos de Uso

### Crear un Contrato

```bash
POST /contratos
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "usuarioCedula": "1234567890",
  "numeroContrato": "4600000001",
  "anoSuscripcion": 2024,
  "programa": "Programa de Infraestructura Vial",
  "tipoContrato": "Obra Pública",
  "objeto": "Construcción de vía en el barrio San Javier",
  "identificadorSimple": "INF-VIA-2024-001",
  "estado": "ACTIVO",
  "contratista": "Constructora Medellín S.A.S.",
  "numeroProceso": "LP-001-2024",
  "fechaInicio": "2024-01-15",
  "fechaTerminacionInicial": "2024-06-15",
  "fechaTerminacionActual": "2024-06-15",
  "valorInicial": 1000000000,
  "valorTotal": 1000000000
}
```

### Crear un CUO

```bash
POST /cuo
Authorization: Bearer <supervisor-token>
Content-Type: application/json

{
  "contratoId": 1,
  "numero": "123456789",
  "latitud": 6.2442,
  "longitud": -75.5812,
  "comuna": "Comuna 1 - Popular",
  "barrio": "San Javier",
  "descripcion": "Construcción de vía vehicular en concreto rígido"
}
```

### Registrar Seguimiento General

```bash
POST /seguimiento-general
Authorization: Bearer <supervisor-token>
Content-Type: application/json

{
  "contratoId": 1,
  "avanceFinanciero": 500000000,
  "avanceFisico": 45.5,
  "observaciones": "Avance según cronograma establecido"
}
```

## 🚨 Códigos de Estado HTTP

| Código | Descripción | Uso |
|--------|-------------|-----|
| 200 | OK | Operación exitosa |
| 201 | Created | Recurso creado exitosamente |
| 400 | Bad Request | Datos inválidos en la petición |
| 401 | Unauthorized | Token inválido o expirado |
| 403 | Forbidden | Sin permisos para el recurso |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Conflicto (ej: email duplicado) |
| 500 | Internal Server Error | Error interno del servidor |

## 📈 Campos Calculados Automáticamente

### Seguimiento General
- **Porcentaje Financiero**: Se calcula como `(valorEjecutado / valorTotalContrato) * 100`
- **Diferencia de Avance**: `avanceFisico - avanceFinanciero`
- **Estado del Avance**: 
  - `ATRASADO` si diferencia < -5%
  - `ADELANTADO` si diferencia > 5%
  - `NORMAL` en otros casos

### Modificaciones
- **Duración**: Se calcula automáticamente entre `fechaInicio` y `fechaFinal`
- **Actualización de fechas**: Las prórrogas actualizan automáticamente `fechaTerminacionActual`

## 🔍 Filtros y Búsquedas

### Contratos
- Por supervisor: `GET /contratos/supervisor/:cedula`
- Por ID: `GET /contratos/:id`

### Seguimientos
- Por contrato: `GET /seguimiento-general/contrato/:id`
- Por número de contrato: `GET /seguimiento-general/contrato/numero/:numeroContrato`

### CUO
- Por contrato: `GET /cuo/contrato/:id`

## 🛠️ Herramientas de Desarrollo

### Postman Collection
Puedes generar una colección de Postman desde la documentación Swagger:
1. Ve a `http://localhost:3000/docs`
2. Haz clic en el enlace "Download OpenAPI specification"
3. Importa el archivo JSON en Postman

### Validaciones
- **Cédula**: 8-10 dígitos numéricos
- **Email**: Formato válido de email
- **Contraseña**: Mínimo 8 caracteres, debe incluir mayúscula, minúscula y número
- **Número de Contrato**: Exactamente 10 dígitos
- **Coordenadas**: Latitud (-90 a 90), Longitud (-180 a 180)

## 🐛 Manejo de Errores

### Formato de Respuesta de Error

```json
{
  "message": "Descripción del error",
  "error": "Tipo de error",
  "statusCode": 400
}
```

### Errores de Validación

```json
{
  "message": [
    "La cédula debe tener entre 8 y 10 dígitos",
    "El correo electrónico debe tener un formato válido"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

## 📞 Soporte

Para soporte técnico o reportar problemas:
- **Email**: desarrollo@medellin.gov.co
- **Documentación**: `http://localhost:3000/docs`
- **Health Check**: `http://localhost:3000/health`

---

**Versión**: 1.0  
**Última actualización**: Enero 2025  
**Desarrollado por**: Equipo de Desarrollo SSC - Alcaldía de Medellín 