import { ApiProperty } from '@nestjs/swagger';
import { TipoModificacion } from '../modificacion.entity';

/**
 * DTO para la respuesta de modificaciones
 * 
 * Este DTO define la estructura de los datos que se enviarán al cliente
 * cuando se consulte información de modificaciones de contratos
 */
export class ModificacionResponseDto {
  /**
   * Identificador único de la modificación
   */
  @ApiProperty({ description: 'Identificador único de la modificación' })
  id: number;

  /**
   * ID del contrato al que pertenece la modificación
   */
  @ApiProperty({ description: 'ID del contrato al que pertenece la modificación' })
  contratoId: number;

  /**
   * Información básica del contrato asociado
   */
  @ApiProperty({ description: 'Información básica del contrato asociado' })
  contrato?: {
    numeroContrato: string;
    identificadorSimple: string;
    objeto: string;
    fechaTerminacionActual: Date;
  };

  /**
   * Tipo de modificación
   */
  @ApiProperty({ 
    description: 'Tipo de modificación',
    enum: TipoModificacion,
    example: TipoModificacion.SUSPENSION
  })
  tipo: TipoModificacion;

  /**
   * Fecha de inicio de la modificación
   */
  @ApiProperty({ 
    description: 'Fecha de inicio de la modificación',
    example: '2024-03-15'
  })
  fechaInicio: Date;

  /**
   * Fecha final de la modificación
   */
  @ApiProperty({ 
    description: 'Fecha final de la modificación',
    example: '2024-04-15'
  })
  fechaFinal: Date;

  /**
   * Duración en días de la modificación
   */
  @ApiProperty({ 
    description: 'Duración en días de la modificación',
    example: 30
  })
  duracion: number;

  /**
   * Fecha de creación del registro
   */
  @ApiProperty({ 
    description: 'Fecha de creación del registro',
    example: '2024-03-14T10:30:00Z'
  })
  createdAt: Date;

  /**
   * Observaciones o justificación de la modificación
   */
  @ApiProperty({ 
    description: 'Observaciones o justificación de la modificación',
    required: false,
    example: 'Suspensión por temporada de lluvias que impide la ejecución segura de las obras.'
  })
  observaciones?: string;
} 