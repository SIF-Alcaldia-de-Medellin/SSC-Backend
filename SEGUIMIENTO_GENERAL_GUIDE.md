# Guía del Módulo de Seguimiento General

## 📋 Descripción General

El módulo de **Seguimiento General** maneja el seguimiento del avance de contratos de obra pública, calculando automáticamente valores acumulados y porcentajes de progreso. Este módulo es fundamental para el control y monitoreo del estado de ejecución de los contratos.

## 🔄 Concepto de Valores Acumulados

### ❌ **Enfoque Anterior (Incorrecto)**
Cada seguimiento era independiente y solo mostraba su valor individual.

### ✅ **Enfoque Actual (Correcto)**
Cada seguimiento muestra:
- **Valores individuales**: Lo reportado en ese período específico
- **Valores acumulados**: Suma total desde el inicio hasta esa fecha

## 📊 Estructura de Datos

### Valores de Entrada (CreateSeguimientoGeneralDto)
```typescript
{
  contratoId: 1,
  avanceFinanciero: 150000000,  // ← Valor INCREMENTAL del período
  avanceFisico: 15.5,           // ← Porcentaje INCREMENTAL del período  
  observaciones: "Segundo trimestre completado"
}
```

### Valores de Salida (SeguimientoGeneralResponseDto)
```typescript
{
  // Valores individuales (lo reportado en este período)
  valorEjecutadoIndividual: 150000000,  // ← Solo este período
  avanceFisicoIndividual: 15.5,         // ← Solo este período
  
  // Valores acumulados (suma total hasta esta fecha)
  valorEjecutado: 250000000,            // ← 100M + 150M (acumulado)
  avanceFisico: 45.5,                   // ← 30% + 15.5% (acumulado)
  
  // Porcentajes calculados automáticamente
  avanceFinanciero: 76.22,              // ← (250M / 328M) * 100
  diferenciaAvance: -30.72,             // ← 45.5% - 76.22%
  estadoAvance: "ATRASADO"              // ← Basado en diferencia
}
```

## 📈 Ejemplo de Evolución

### Seguimiento 1 (Primer Período)
```json
// Entrada
{
  "avanceFinanciero": 100000000,  // $100M ejecutados en este período
  "avanceFisico": 30.0            // 30% de avance físico en este período
}

// Salida
{
  "valorEjecutadoIndividual": 100000000,  // $100M individual
  "valorEjecutado": 100000000,            // $100M acumulado (igual al individual)
  "avanceFisicoIndividual": 30.0,         // 30% individual  
  "avanceFisico": 30.0,                   // 30% acumulado (igual al individual)
  "avanceFinanciero": 30.49               // (100M / 328M) * 100 = 30.49%
}
```

### Seguimiento 2 (Segundo Período)
```json
// Entrada
{
  "avanceFinanciero": 150000000,  // $150M ejecutados ADICIONALES en este período
  "avanceFisico": 15.5            // 15.5% de avance físico ADICIONAL en este período
}

// Salida
{
  "valorEjecutadoIndividual": 150000000,  // $150M individual (solo este período)
  "valorEjecutado": 250000000,            // $250M acumulado (100M + 150M)
  "avanceFisicoIndividual": 15.5,         // 15.5% individual (solo este período)
  "avanceFisico": 45.5,                   // 45.5% acumulado (30% + 15.5%)
  "avanceFinanciero": 76.22,              // (250M / 328M) * 100 = 76.22%
  "diferenciaAvance": -30.72,             // 45.5% - 76.22% = -30.72%
  "estadoAvance": "ATRASADO"              // Diferencia < -5%
}
```

## 🚨 Estados de Avance

| Estado | Condición | Descripción |
|--------|-----------|-------------|
| **ADELANTADO** | `diferencia > +5%` | Avance físico supera al financiero por más de 5% |
| **NORMAL** | `-5% ≤ diferencia ≤ +5%` | Avance físico y financiero están balanceados |
| **ATRASADO** | `diferencia < -5%` | Avance físico está por debajo del financiero por más de 5% |

## 🔍 Endpoints Disponibles

### 1. **POST** `/seguimiento-general`
Crea un nuevo seguimiento con valores incrementales.

**Características:**
- Valores de entrada son incrementales (del período actual)
- Calcula automáticamente valores acumulados
- Valida que los acumulados no excedan límites

### 2. **GET** `/seguimiento-general/contrato/{id}`
Obtiene todos los seguimientos de un contrato con valores acumulados.

**Características:**
- Lista ordenada por fecha (más reciente primero)
- Cada seguimiento muestra progreso acumulado hasta esa fecha
- Incluye valores individuales y acumulados para cada registro

### 3. **GET** `/seguimiento-general/contrato/numero/{numeroContrato}`
Similar al anterior pero busca por número de contrato.

### 4. **GET** `/seguimiento-general/{id}`
Obtiene un seguimiento específico con valores acumulados hasta esa fecha.

## 🎯 Casos de Uso

### Para Administradores
- Crear seguimientos para cualquier contrato
- Monitorear el progreso general de todos los proyectos
- Analizar estados de avance y tendencias

### Para Supervisores
- Crear seguimientos solo para contratos asignados
- Reportar avances periódicos de sus proyectos
- Consultar histórico de sus contratos

## 💡 Mejores Prácticas

### ✅ **Correcto**
```typescript
// Reportar solo lo del período actual
{
  avanceFinanciero: 50000000,    // $50M ejecutados HOY
  avanceFisico: 10.5,            // 10.5% completado HOY
  observaciones: "Instalación de tuberías completada"
}
```

### ❌ **Incorrecto**
```typescript
// NO reportar valores acumulados
{
  avanceFinanciero: 200000000,   // ❌ Total desde el inicio
  avanceFisico: 55.5,            // ❌ Total acumulado
  observaciones: "Total ejecutado hasta la fecha"
}
```

## 🔧 Validaciones Automáticas

1. **Valores positivos**: `avanceFinanciero ≥ 0`
2. **Porcentajes válidos**: `0 ≤ avanceFisico ≤ 100`
3. **Límite acumulado**: El avance físico acumulado no puede superar el 100%
4. **Permisos de acceso**: Supervisores solo ven sus contratos
5. **Existencia de contrato**: Valida que el contrato exista

### Validación de Límite del 100%

El sistema evita que el avance físico total supere el 100% mediante una validación inteligente:

```typescript
// Ejemplo de validación
Avance actual acumulado: 80%
Nuevo avance a reportar: 25%
Total resultante: 105% ❌

// Error mostrado:
"El avance físico acumulado no puede superar el 100%. 
 Avance actual: 80.00%, 
 Nuevo avance: 25.00%, 
 Total resultante: 105.00%. 
 Máximo permitido: 20.00%"
```

**Casos válidos:**
- ✅ Reportar 20% cuando ya hay 80% acumulado (total: 100%)
- ✅ Reportar 15% cuando ya hay 80% acumulado (total: 95%)

**Casos inválidos:**
- ❌ Reportar 25% cuando ya hay 80% acumulado (total: 105%)

## 📱 Integración Frontend

### Crear Seguimiento
```typescript
const nuevoSeguimiento = {
  contratoId: 1,
  avanceFinanciero: 75000000,     // Solo lo del período actual
  avanceFisico: 12.3,             // Solo lo del período actual
  observaciones: "Avance mensual de febrero"
};

// El backend retornará valores acumulados automáticamente
const response = await api.post('/seguimiento-general', nuevoSeguimiento);
console.log(response.valorEjecutado);          // Valor acumulado total
console.log(response.valorEjecutadoIndividual); // Valor del período
```

### Validación Frontend para Límite del 100%
```typescript
// Obtener avance acumulado actual antes de crear seguimiento
const seguimientos = await api.get(`/seguimiento-general/contrato/${contratoId}`);
const avanceAcumulado = seguimientos.length > 0 ? seguimientos[0].avanceFisico : 0;

// Validar antes de enviar
const nuevoAvanceFisico = 25.0;
const totalPotencial = avanceAcumulado + nuevoAvanceFisico;

if (totalPotencial > 100) {
  const maximoPermitido = 100 - avanceAcumulado;
  alert(`El avance físico no puede superar el 100%. 
         Avance actual: ${avanceAcumulado}%
         Máximo que puede reportar: ${maximoPermitido}%`);
  return;
}

// Proceder con la creación si la validación pasa
try {
  const seguimiento = await api.post('/seguimiento-general', {
    contratoId,
    avanceFinanciero: 50000000,
    avanceFisico: nuevoAvanceFisico,
    observaciones: "Seguimiento validado"
  });
} catch (error) {
  if (error.response?.status === 400) {
    console.error('Error de validación:', error.response.data.message);
  }
}
```

### Consultar Progreso
```typescript
// Obtener evolución completa del contrato
const seguimientos = await api.get('/seguimiento-general/contrato/1');

seguimientos.forEach(seguimiento => {
  console.log(`Fecha: ${seguimiento.createdAt}`);
  console.log(`Período: $${seguimiento.valorEjecutadoIndividual.toLocaleString()}`);
  console.log(`Acumulado: $${seguimiento.valorEjecutado.toLocaleString()}`);
  console.log(`Estado: ${seguimiento.estadoAvance}`);
  console.log('---');
});
```

## 🚀 Beneficios del Sistema

1. **Trazabilidad Completa**: Histórico detallado de cada período + acumulados
2. **Cálculos Automáticos**: No hay errores de suma manual
3. **Estados Inteligentes**: Evaluación automática del estado del proyecto
4. **Flexibilidad**: Consultas por contrato, número o seguimiento específico
5. **Seguridad**: Control de acceso basado en roles y asignaciones

---

## 📞 Soporte

Para dudas sobre el módulo de Seguimiento General, contactar al equipo de desarrollo o revisar la documentación de Swagger en `/docs`. 