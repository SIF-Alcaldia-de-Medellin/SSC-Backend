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
   * Porcentaje de avance financiero
   */
  @ApiProperty({ 
    description: 'Porcentaje de avance financiero',
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
  diferenciaAvance?: number;

  /**
   * Estado del avance
   */
  @ApiProperty({ 
    description: 'Estado del avance basado en la diferencia entre avance físico y financiero',
    example: 'NORMAL',
    enum: ['ATRASADO', 'NORMAL', 'ADELANTADO']
  })
  estadoAvance?: string;
} 