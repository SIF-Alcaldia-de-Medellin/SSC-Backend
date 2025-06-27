import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la respuesta de seguimiento general
 * 
 * Este DTO define la estructura de los datos que se enviarán al cliente
 * cuando se consulte información de seguimientos generales de contratos
 */
export class SeguimientoGeneralResponseDto {
  /**
   * Identificador único del seguimiento
   */
  @ApiProperty({ description: 'Identificador único del seguimiento' })
  id: number;

  /**
   * ID del contrato al que pertenece el seguimiento
   */
  @ApiProperty({ description: 'ID del contrato al que pertenece el seguimiento' })
  contratoId: number;

  /**
   * Información resumida del contrato asociado
   */
  @ApiProperty({ description: 'Información resumida del contrato asociado' })
  contrato?: {
    numeroContrato: string;
    identificadorSimple: string;
    objeto: string;
    valorTotal: number;
    fechaTerminacionActual: Date;
    estado: string;
  };

  /**
   * Valor ejecutado del contrato en pesos
   */
  @ApiProperty({ 
    description: 'Valor ejecutado del contrato en pesos',
    example: 150000000
  })
  valorEjecutado: number;

  /**
   * Porcentaje de avance financiero calculado
   */
  @ApiProperty({ 
    description: 'Porcentaje de avance financiero calculado (valor ejecutado / valor total del contrato)',
    minimum: 0,
    maximum: 100,
    example: 45.75
  })
  avanceFinanciero: number;

  /**
   * Porcentaje de avance físico
   */
  @ApiProperty({ 
    description: 'Porcentaje de avance físico',
    minimum: 0,
    maximum: 100,
    example: 42.30
  })
  avanceFisico: number;

  /**
   * Fecha de creación del registro
   */
  @ApiProperty({ 
    description: 'Fecha de creación del registro',
    example: '2024-03-15T10:30:00Z'
  })
  createdAt: Date;

  /**
   * Fecha de última modificación del registro
   */
  @ApiProperty({ 
    description: 'Fecha de última modificación del registro',
    example: '2024-03-15T10:30:00Z'
  })
  fechaUltimaModificacion: Date;

  /**
   * Observaciones del seguimiento
   */
  @ApiProperty({ 
    description: 'Observaciones del seguimiento',
    required: false,
    example: 'El avance del contrato se encuentra dentro de lo programado...'
  })
  observaciones?: string;

  /**
   * Diferencia entre avance físico y financiero
   */
  @ApiProperty({ 
    description: 'Diferencia entre avance físico y financiero (positivo indica mayor avance físico que financiero)',
    example: -3.45
  })
  diferenciaAvance: number;

  /**
   * Estado del avance
   */
  @ApiProperty({ 
    description: 'Estado del avance basado en la diferencia entre avance físico y financiero',
    example: 'NORMAL',
    enum: ['ATRASADO', 'NORMAL', 'ADELANTADO']
  })
  estadoAvance: string;

  /**
   * Resumen del estado en formato legible
   */
  @ApiProperty({ 
    description: 'Resumen del estado en formato legible',
    example: 'NORMAL: Avance físico 42.30% vs. financiero 45.75% (diferencia: -3.45%). Valor ejecutado: $150.000.000 de $328.000.000'
  })
  resumenEstado: string;
} 