import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la respuesta de actividades
 */
export class ActividadResponseDto {
  /**
   * Identificador único de la actividad
   */
  @ApiProperty({ description: 'Identificador único de la actividad' })
  id: number;

  /**
   * ID del CUO al que pertenece la actividad
   */
  @ApiProperty({ description: 'ID del Código Único de Obra (CUO) al que pertenece la actividad' })
  cuoId: number;

  /**
   * Descripción de la actividad
   */
  @ApiProperty({ description: 'Descripción de la actividad' })
  actividad: string;

  /**
   * Meta física de la actividad
   */
  @ApiProperty({ description: 'Meta física de la actividad' })
  metaFisica: number;

  /**
   * Valor proyectado financiero
   */
  @ApiProperty({ description: 'Valor proyectado financiero' })
  proyectadoFinanciero: number;

  /**
   * Unidades de avance
   */
  @ApiProperty({ description: 'Unidades de avance para medición' })
  unidadesAvance: string;

  /**
   * Información del CUO asociado
   */
  @ApiProperty({ 
    description: 'Información del CUO asociado',
    required: false
  })
  cuo?: {
    id: number;
    nroCuo: string;
    descripcion: string;
  };
} 