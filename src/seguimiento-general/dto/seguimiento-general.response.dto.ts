import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la respuesta de seguimiento general
 * 
 * Este DTO define la estructura de los datos que se enviarán al cliente
 * cuando se consulte información de seguimientos generales de contratos.
 * 
 * **IMPORTANTE:** Este DTO incluye tanto valores individuales (del período específico)
 * como valores acumulados (suma total desde el inicio del contrato).
 */
export class SeguimientoGeneralResponseDto {
  /**
   * Identificador único del seguimiento
   */
  @ApiProperty({ 
    description: 'Identificador único del seguimiento',
    example: 1
  })
  id: number;

  /**
   * ID del contrato al que pertenece el seguimiento
   */
  @ApiProperty({ 
    description: 'ID del contrato al que pertenece el seguimiento',
    example: 1
  })
  contratoId: number;

  /**
   * Información resumida del contrato asociado
   */
  @ApiProperty({ 
    description: 'Información resumida del contrato asociado',
    example: {
      numeroContrato: '460000001',
      identificadorSimple: 'INFRA-2024-001',
      objeto: 'Construcción de infraestructura vial',
      valorTotal: 328000000,
      fechaTerminacionActual: '2024-12-31T23:59:59Z',
      estado: 'ACTIVO'
    }
  })
  contrato?: {
    numeroContrato: string;
    identificadorSimple: string;
    objeto: string;
    valorTotal: number;
    fechaTerminacionActual: Date;
    estado: string;
  };

  /**
   * Valor ejecutado individual en este seguimiento específico
   */
  @ApiProperty({ 
    description: 'Valor ejecutado individual reportado en este seguimiento específico (no incluye seguimientos anteriores)',
    example: 150000000,
    type: 'number'
  })
  valorEjecutadoIndividual: number;

  /**
   * Valor ejecutado acumulado del contrato en pesos hasta esta fecha
   */
  @ApiProperty({ 
    description: 'Valor ejecutado acumulado del contrato en pesos hasta esta fecha (suma de todos los seguimientos hasta este punto)',
    example: 250000000,
    type: 'number'
  })
  valorEjecutado: number;

  /**
   * Porcentaje de avance financiero acumulado calculado
   */
  @ApiProperty({ 
    description: 'Porcentaje de avance financiero acumulado calculado (valor ejecutado acumulado / valor total del contrato * 100)',
    minimum: 0,
    maximum: 100,
    example: 76.22,
    type: 'number'
  })
  avanceFinanciero: number;

  /**
   * Porcentaje de avance físico individual en este seguimiento específico
   */
  @ApiProperty({ 
    description: 'Porcentaje de avance físico individual reportado en este seguimiento específico (no incluye seguimientos anteriores)',
    minimum: 0,
    maximum: 100,
    example: 15.5,
    type: 'number'
  })
  avanceFisicoIndividual: number;

  /**
   * Porcentaje de avance físico acumulado
   */
  @ApiProperty({ 
    description: 'Porcentaje de avance físico acumulado hasta esta fecha (suma de todos los avances físicos hasta este punto)',
    minimum: 0,
    maximum: 100,
    example: 45.5,
    type: 'number'
  })
  avanceFisico: number;

  /**
   * Fecha de creación del registro
   */
  @ApiProperty({ 
    description: 'Fecha de creación del registro de seguimiento',
    example: '2024-01-20T10:30:00Z',
    type: 'string',
    format: 'date-time'
  })
  createdAt: Date;

  /**
   * Fecha de última modificación del registro
   */
  @ApiProperty({ 
    description: 'Fecha de última modificación del registro (actualmente igual a createdAt)',
    example: '2024-01-20T10:30:00Z',
    type: 'string',
    format: 'date-time'
  })
  fechaUltimaModificacion: Date;

  /**
   * Observaciones del seguimiento
   */
  @ApiProperty({ 
    description: 'Observaciones y comentarios sobre el seguimiento realizado',
    required: false,
    example: 'Se completó la segunda fase del proyecto. El avance físico está por debajo del financiero debido a retrasos en la entrega de materiales.',
    type: 'string'
  })
  observaciones?: string;

  /**
   * Diferencia entre avance físico y financiero
   */
  @ApiProperty({ 
    description: 'Diferencia entre avance físico y financiero acumulados (positivo indica mayor avance físico, negativo indica retraso físico)',
    example: -30.72,
    type: 'number'
  })
  diferenciaAvance: number;

  /**
   * Estado del avance
   */
  @ApiProperty({ 
    description: 'Estado del avance basado en la diferencia entre avance físico y financiero',
    example: 'ATRASADO',
    enum: ['ATRASADO', 'NORMAL', 'ADELANTADO'],
    type: 'string'
  })
  estadoAvance: string;

  /**
   * Resumen del estado en formato legible
   */
  @ApiProperty({ 
    description: 'Resumen completo del estado del proyecto en formato legible para humanos',
    example: 'ATRASADO: Avance físico 45.50% vs. financiero 76.22% (diferencia: -30.72%). Valor ejecutado acumulado: $250.000.000 de $328.000.000',
    type: 'string'
  })
  resumenEstado: string;
} 