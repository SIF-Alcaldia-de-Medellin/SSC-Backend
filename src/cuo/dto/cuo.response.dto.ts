import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la respuesta de CUO (Centro Único de Obra)
 * 
 * Este DTO define la estructura de los datos que se enviarán al cliente
 * cuando se consulte información de CUOs
 */
export class CuoResponseDto {
  /**
   * Identificador único del CUO
   */
  @ApiProperty({ description: 'Identificador único del CUO' })
  id: number;

  /**
   * ID del contrato al que pertenece el CUO
   */
  @ApiProperty({ description: 'ID del contrato al que pertenece el CUO' })
  contratoId: number;

  /**
   * Información básica del contrato asociado
   */
  @ApiProperty({ description: 'Información básica del contrato asociado' })
  contrato?: {
    numeroContrato: string;
    identificadorSimple: string;
    objeto: string;
  };

  /**
   * Número identificador del CUO
   */
  @ApiProperty({ description: 'Número identificador del CUO' })
  numero: string;

  /**
   * Latitud de la ubicación del CUO
   */
  @ApiProperty({ 
    description: 'Latitud de la ubicación del CUO',
    minimum: -90,
    maximum: 90
  })
  latitud: number;

  /**
   * Longitud de la ubicación del CUO
   */
  @ApiProperty({ 
    description: 'Longitud de la ubicación del CUO',
    minimum: -180,
    maximum: 180
  })
  longitud: number;

  /**
   * Comuna donde se ubica el CUO
   */
  @ApiProperty({ 
    description: 'Comuna donde se ubica el CUO',
    maxLength: 50
  })
  comuna: string;

  /**
   * Barrio donde se ubica el CUO
   */
  @ApiProperty({ 
    description: 'Barrio donde se ubica el CUO',
    maxLength: 100
  })
  barrio: string;

  /**
   * Descripción detallada del CUO
   */
  @ApiProperty({ description: 'Descripción detallada del CUO' })
  descripcion: string;

  /**
   * Resumen de actividades asociadas
   */
  @ApiProperty({ 
    description: 'Cantidad de actividades asociadas al CUO',
    type: 'number',
    required: false
  })
  cantidadActividades?: number;
} 