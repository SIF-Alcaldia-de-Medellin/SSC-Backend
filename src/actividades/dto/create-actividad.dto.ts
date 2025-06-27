import { IsNotEmpty, IsInt, IsString, IsNumber, IsPositive } from 'class-validator';

/**
 * DTO para la creación de actividades
 */
export class CreateActividadDto {
  /**
   * ID del CUO al que pertenece la actividad
   */
  @IsNotEmpty({ message: 'El ID del CUO es requerido' })
  @IsInt({ message: 'El ID del CUO debe ser un número entero' })
  @IsPositive({ message: 'El ID del CUO debe ser positivo' })
  cuoId: number;

  /**
   * Descripción de la actividad
   */
  @IsNotEmpty({ message: 'La descripción de la actividad es requerida' })
  @IsString({ message: 'La descripción debe ser texto' })
  actividad: string;

  /**
   * Meta física de la actividad
   */
  @IsNotEmpty({ message: 'La meta física es requerida' })
  @IsNumber({}, { message: 'La meta física debe ser un número' })
  @IsPositive({ message: 'La meta física debe ser positiva' })
  metaFisica: number;

  /**
   * Valor proyectado financiero
   */
  @IsNotEmpty({ message: 'El valor proyectado es requerido' })
  @IsNumber({}, { message: 'El valor proyectado debe ser un número' })
  @IsPositive({ message: 'El valor proyectado debe ser positivo' })
  proyectadoFinanciero: number;

  /**
   * Unidades de avance para medición
   */
  @IsNotEmpty({ message: 'Las unidades de avance son requeridas' })
  @IsString({ message: 'Las unidades de avance deben ser texto' })
  unidadesAvance: string;
} 