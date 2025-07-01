import { IsNumber, IsString, Min, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para crear un nuevo seguimiento de actividad
 */
export class CreateSeguimientoActividadDto {
  /**
   * ID de la actividad a la que pertenece el seguimiento
   */
  @ApiProperty({
    description: 'ID de la actividad a la que pertenece el seguimiento',
    example: 1,
    minimum: 1
  })
  @IsNumber()
  actividadId: number;

  /**
   * Avance físico de la actividad (cantidad ejecutada)
   */
  @ApiProperty({
    description: 'Avance físico de la actividad (cantidad ejecutada en las unidades correspondientes)',
    example: 25.5,
    minimum: 0
  })
  @IsNumber()
  @IsPositive({ message: 'El avance físico debe ser un número positivo' })
  avanceFisico: number;

  /**
   * Costo aproximado de la actividad
   */
  @ApiProperty({
    description: 'Costo aproximado de la actividad ejecutada en pesos colombianos',
    example: 12500000,
    minimum: 1
  })
  @IsNumber()
  @IsPositive({ message: 'El costo aproximado debe ser un número positivo' })
  costoAproximado: number;

  /**
   * Descripción detallada del seguimiento
   */
  @ApiProperty({
    description: 'Descripción detallada del avance realizado en este seguimiento',
    example: 'Se completó la instalación de 25.5 metros cuadrados de andén en concreto hidráulico en el sector norte'
  })
  @IsString()
  descripcionSeguimiento: string;

  /**
   * Proyección de actividades futuras
   */
  @ApiProperty({
    description: 'Proyección y planificación de actividades futuras',
    example: 'Se planea continuar con la instalación de andenes en el sector sur durante la próxima semana'
  })
  @IsString()
  proyeccionActividades: string;
} 