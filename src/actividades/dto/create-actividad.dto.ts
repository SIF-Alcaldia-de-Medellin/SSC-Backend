import { IsNotEmpty, IsInt, IsString, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la creación de actividades
 */
export class CreateActividadDto {
  /**
   * ID del CUO al que pertenece la actividad
   */
  @ApiProperty({
    description: 'ID del CUO (Código Único de Obra) al que pertenece la actividad',
    example: 1,
    minimum: 1
  })
  @IsNotEmpty({ message: 'El ID del CUO es requerido' })
  @IsInt({ message: 'El ID del CUO debe ser un número entero' })
  @IsPositive({ message: 'El ID del CUO debe ser positivo' })
  cuoId: number;

  /**
   * Descripción de la actividad
   */
  @ApiProperty({
    description: 'Descripción detallada de la actividad a realizar',
    example: 'Construcción de andenes en concreto hidráulico'
  })
  @IsNotEmpty({ message: 'La descripción de la actividad es requerida' })
  @IsString({ message: 'La descripción debe ser texto' })
  actividad: string;

  /**
   * Meta física de la actividad
   */
  @ApiProperty({
    description: 'Meta física total a ejecutar en la actividad',
    example: 150.5,
    minimum: 0
  })
  @IsNotEmpty({ message: 'La meta física es requerida' })
  @IsNumber({}, { message: 'La meta física debe ser un número' })
  @IsPositive({ message: 'La meta física debe ser positiva' })
  metaFisica: number;

  /**
   * Valor proyectado financiero
   */
  @ApiProperty({
    description: 'Valor proyectado financiero total de la actividad en pesos colombianos',
    example: 75000000,
    minimum: 1
  })
  @IsNotEmpty({ message: 'El valor proyectado es requerido' })
  @IsNumber({}, { message: 'El valor proyectado debe ser un número' })
  @IsPositive({ message: 'El valor proyectado debe ser positivo' })
  proyectadoFinanciero: number;

  /**
   * Unidades de avance para medición
   */
  @ApiProperty({
    description: 'Unidades de medida para el seguimiento del avance',
    example: 'Metros cuadrados'
  })
  @IsNotEmpty({ message: 'Las unidades de avance son requeridas' })
  @IsString({ message: 'Las unidades de avance deben ser texto' })
  unidadesAvance: string;
} 