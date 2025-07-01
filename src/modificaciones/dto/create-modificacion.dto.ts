import { IsNotEmpty, IsInt, IsString, IsDate, IsEnum, IsPositive, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoModificacion } from '../modificacion.entity';

/**
 * DTO para la creación de modificaciones contractuales
 */
export class CreateModificacionDto {
  /**
   * ID del contrato al que se aplica la modificación
   */
  @ApiProperty({
    description: 'ID del contrato al que se aplica la modificación',
    example: 1,
    minimum: 1
  })
  @IsNotEmpty({ message: 'El ID del contrato es requerido' })
  @IsInt({ message: 'El ID del contrato debe ser un número entero' })
  @IsPositive({ message: 'El ID del contrato debe ser positivo' })
  contratoId: number;

  /**
   * Tipo de modificación
   */
  @ApiProperty({
    description: 'Tipo de modificación que se aplicará al contrato',
    enum: TipoModificacion,
    example: TipoModificacion.SUSPENSION,
    enumName: 'TipoModificacion'
  })
  @IsNotEmpty({ message: 'El tipo de modificación es requerido' })
  @IsEnum(TipoModificacion, { message: 'Tipo de modificación inválido' })
  tipo: TipoModificacion;

  /**
   * Fecha de inicio de la modificación
   */
  @ApiProperty({
    description: 'Fecha de inicio de la modificación',
    example: '2024-03-15',
    format: 'date'
  })
  @IsNotEmpty({ message: 'La fecha de inicio es requerida' })
  @Type(() => Date)
  @IsDate({ message: 'Fecha de inicio inválida' })
  fechaInicio: Date;

  /**
   * Fecha final de la modificación
   */
  @ApiProperty({
    description: 'Fecha final de la modificación',
    example: '2024-04-15',
    format: 'date'
  })
  @IsNotEmpty({ message: 'La fecha final es requerida' })
  @Type(() => Date)
  @IsDate({ message: 'Fecha final inválida' })
  fechaFinal: Date;

  /**
   * Observaciones o justificación de la modificación
   */
  @ApiPropertyOptional({
    description: 'Observaciones o justificación de la modificación',
    example: 'Suspensión por temporada de lluvias que impide la ejecución segura de las obras'
  })
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  observaciones?: string;
} 