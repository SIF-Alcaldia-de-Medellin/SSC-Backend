import { IsNumber, IsString, Min, IsPositive } from 'class-validator';

/**
 * DTO para crear un nuevo seguimiento de actividad
 */
export class CreateSeguimientoActividadDto {
  /**
   * ID de la actividad a la que pertenece el seguimiento
   */
  @IsNumber()
  actividadId: number;

  /**
   * Avance físico de la actividad (cantidad ejecutada)
   */
  @IsNumber()
  @IsPositive({ message: 'El avance físico debe ser un número positivo' })
  avanceFisico: number;

  /**
   * Costo aproximado de la actividad
   */
  @IsNumber()
  @IsPositive({ message: 'El costo aproximado debe ser un número positivo' })
  costoAproximado: number;

  /**
   * Descripción detallada del seguimiento
   */
  @IsString()
  descripcionSeguimiento: string;

  /**
   * Proyección de actividades futuras
   */
  @IsString()
  proyeccionActividades: string;
} 