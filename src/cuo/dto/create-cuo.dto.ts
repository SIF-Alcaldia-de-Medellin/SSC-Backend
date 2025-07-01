import { IsNotEmpty, IsInt, IsString, IsNumber, IsPositive, Min, Max, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la creación de CUO (Código Único de Obra)
 * 
 * Este DTO define la estructura de datos requerida para crear un nuevo
 * código único de obra en el sistema
 */
export class CreateCuoDto {
  /**
   * ID del contrato al que pertenece el CUO
   */
  @ApiProperty({
    description: 'ID del contrato al que pertenece este CUO',
    example: 1,
    minimum: 1
  })
  @IsNotEmpty({ message: 'El ID del contrato es requerido' })
  @IsInt({ message: 'El ID del contrato debe ser un número entero' })
  @IsPositive({ message: 'El ID del contrato debe ser positivo' })
  contratoId: number;

  /**
   * Número identificador del CUO
   */
  @ApiProperty({
    description: 'Número identificador único del CUO (solo dígitos)',
    example: '123456789',
    pattern: '^[0-9]+$'
  })
  @IsNotEmpty({ message: 'El número de CUO es requerido' })
  @IsString({ message: 'El número de CUO debe ser una cadena de texto' })
  @Matches(/^[0-9]+$/, { message: 'El número de CUO debe contener solo dígitos' })
  numero: string;

  /**
   * Latitud de la ubicación del CUO
   */
  @ApiProperty({
    description: 'Latitud de la ubicación del CUO (coordenadas decimales)',
    example: 6.2442,
    minimum: -90,
    maximum: 90
  })
  @IsNotEmpty({ message: 'La latitud es requerida' })
  @IsNumber({}, { message: 'La latitud debe ser un número' })
  @Min(-90, { message: 'La latitud debe estar entre -90 y 90' })
  @Max(90, { message: 'La latitud debe estar entre -90 y 90' })
  latitud: number;

  /**
   * Longitud de la ubicación del CUO
   */
  @ApiProperty({
    description: 'Longitud de la ubicación del CUO (coordenadas decimales)',
    example: -75.5812,
    minimum: -180,
    maximum: 180
  })
  @IsNotEmpty({ message: 'La longitud es requerida' })
  @IsNumber({}, { message: 'La longitud debe ser un número' })
  @Min(-180, { message: 'La longitud debe estar entre -180 y 180' })
  @Max(180, { message: 'La longitud debe estar entre -180 y 180' })
  longitud: number;

  /**
   * Comuna donde se ubica el CUO
   */
  @ApiProperty({
    description: 'Comuna de Medellín donde se ubica el CUO',
    example: 'Comuna 1 - Popular',
    minLength: 2,
    maxLength: 50
  })
  @IsNotEmpty({ message: 'La comuna es requerida' })
  @IsString({ message: 'La comuna debe ser texto' })
  @Length(2, 50, { message: 'La comuna debe tener entre 2 y 50 caracteres' })
  comuna: string;

  /**
   * Barrio donde se ubica el CUO
   */
  @ApiProperty({
    description: 'Barrio específico donde se ubica el CUO',
    example: 'San Javier',
    minLength: 2,
    maxLength: 100
  })
  @IsNotEmpty({ message: 'El barrio es requerido' })
  @IsString({ message: 'El barrio debe ser texto' })
  @Length(2, 100, { message: 'El barrio debe tener entre 2 y 100 caracteres' })
  barrio: string;

  /**
   * Descripción detallada del CUO
   */
  @ApiProperty({
    description: 'Descripción detallada del código de obra y las actividades a realizar',
    example: 'Construcción de vía vehicular en el sector...'
  })
  @IsNotEmpty({ message: 'La descripción es requerida' })
  @IsString({ message: 'La descripción debe ser texto' })
  @Length(10, 1000, { message: 'La descripción debe tener entre 10 y 1000 caracteres' })
  descripcion: string;
} 