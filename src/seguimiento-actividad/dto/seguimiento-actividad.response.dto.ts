import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la respuesta de seguimiento de actividades
 * 
 * Este DTO define la estructura de los datos que se enviarán al cliente
 * cuando se consulte información de seguimientos de actividades
 */
export class SeguimientoActividadResponseDto {
  /**
   * Identificador único del seguimiento
   */
  @ApiProperty({ description: 'Identificador único del seguimiento' })
  id: number;

  /**
   * ID de la actividad a la que pertenece el seguimiento
   */
  @ApiProperty({ description: 'ID de la actividad a la que pertenece el seguimiento' })
  actividadId: number;

  /**
   * Información resumida de la actividad
   */
  @ApiProperty({ description: 'Información resumida de la actividad' })
  actividad?: {
    descripcion: string;
    metaFisica: number;
    unidadesAvance: string;
    proyectadoFinanciero: number;
    cuoId: number;
  };

  /**
   * Avance físico de la actividad (cantidad ejecutada)
   */
  @ApiProperty({ 
    description: 'Avance físico de la actividad (cantidad ejecutada)',
    example: 45.50
  })
  avanceFisico: number;

  /**
   * Porcentaje de avance físico
   */
  @ApiProperty({ 
    description: 'Porcentaje de avance físico respecto a la meta',
    example: 75.83
  })
  porcentajeAvance?: number;

  /**
   * Costo aproximado de la actividad
   */
  @ApiProperty({ 
    description: 'Costo aproximado de la actividad',
    example: 15000000.00
  })
  costoAproximado: number;

  /**
   * Porcentaje de ejecución financiera
   */
  @ApiProperty({ 
    description: 'Porcentaje de ejecución financiera respecto al valor proyectado',
    example: 68.25
  })
  porcentajeEjecucionFinanciera?: number;

  /**
   * Fecha de creación del registro
   */
  @ApiProperty({ 
    description: 'Fecha de creación del registro',
    example: '2024-03-15T10:30:00Z'
  })
  createdAt: Date;

  /**
   * Descripción detallada del seguimiento
   */
  @ApiProperty({ 
    description: 'Descripción detallada del seguimiento',
    example: 'Se completó la instalación de 45.5 metros cuadrados de andén...'
  })
  descripcionSeguimiento: string;

  /**
   * Proyección de actividades futuras
   */
  @ApiProperty({ 
    description: 'Proyección de actividades futuras',
    example: 'Se planea continuar con la instalación de losetas en el sector norte...'
  })
  proyeccionActividades: string;
} 