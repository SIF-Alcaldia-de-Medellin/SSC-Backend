import { IsNotEmpty, IsInt, IsString, IsNumber, IsPositive, Min, Max, Length, Matches } from 'class-validator';

/**
 * DTO para la creación de CUO (Centro Único de Obra)
 */
export class CreateCuoDto {
  /**
   * ID del contrato al que pertenece el CUO
   */
  @IsNotEmpty({ message: 'El ID del contrato es requerido' })
  @IsInt({ message: 'El ID del contrato debe ser un número entero' })
  @IsPositive({ message: 'El ID del contrato debe ser positivo' })
  contratoId: number;

  /**
   * Número identificador del CUO
   */
  @IsNotEmpty({ message: 'El número de CUO es requerido' })
  @IsString({ message: 'El número de CUO debe ser una cadena de texto' })
  @Matches(/^[0-9]+$/, { message: 'El número de CUO debe contener solo dígitos' })
  numero: string;

  /**
   * Latitud de la ubicación del CUO
   */
  @IsNotEmpty({ message: 'La latitud es requerida' })
  @IsNumber({}, { message: 'La latitud debe ser un número' })
  @Min(-90, { message: 'La latitud debe estar entre -90 y 90' })
  @Max(90, { message: 'La latitud debe estar entre -90 y 90' })
  latitud: number;

  /**
   * Longitud de la ubicación del CUO
   */
  @IsNotEmpty({ message: 'La longitud es requerida' })
  @IsNumber({}, { message: 'La longitud debe ser un número' })
  @Min(-180, { message: 'La longitud debe estar entre -180 y 180' })
  @Max(180, { message: 'La longitud debe estar entre -180 y 180' })
  longitud: number;

  /**
   * Comuna donde se ubica el CUO
   */
  @IsNotEmpty({ message: 'La comuna es requerida' })
  @IsString({ message: 'La comuna debe ser texto' })
  @Length(2, 50, { message: 'La comuna debe tener entre 2 y 50 caracteres' })
  comuna: string;

  /**
   * Barrio donde se ubica el CUO
   */
  @IsNotEmpty({ message: 'El barrio es requerido' })
  @IsString({ message: 'El barrio debe ser texto' })
  @Length(2, 100, { message: 'El barrio debe tener entre 2 y 100 caracteres' })
  barrio: string;

  /**
   * Descripción detallada del CUO
   */
  @IsNotEmpty({ message: 'La descripción es requerida' })
  @IsString({ message: 'La descripción debe ser texto' })
  @Length(10, 1000, { message: 'La descripción debe tener entre 10 y 1000 caracteres' })
  descripcion: string;
} 