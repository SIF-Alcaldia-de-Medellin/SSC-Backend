import { IsNotEmpty, IsInt, IsString, IsDate, IsEnum, IsPositive, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoModificacion } from '../modificacion.entity';

/**
 * DTO para la creación de modificaciones contractuales
 */
export class CreateModificacionDto {
  /**
   * ID del contrato al que se aplica la modificación
   */
  @IsNotEmpty({ message: 'El ID del contrato es requerido' })
  @IsInt({ message: 'El ID del contrato debe ser un número entero' })
  @IsPositive({ message: 'El ID del contrato debe ser positivo' })
  contratoId: number;

  /**
   * Tipo de modificación
   */
  @IsNotEmpty({ message: 'El tipo de modificación es requerido' })
  @IsEnum(TipoModificacion, { message: 'Tipo de modificación inválido' })
  tipo: TipoModificacion;

  /**
   * Fecha de inicio de la modificación
   */
  @IsNotEmpty({ message: 'La fecha de inicio es requerida' })
  @Type(() => Date)
  @IsDate({ message: 'Fecha de inicio inválida' })
  fechaInicio: Date;

  /**
   * Fecha final de la modificación
   */
  @IsNotEmpty({ message: 'La fecha final es requerida' })
  @Type(() => Date)
  @IsDate({ message: 'Fecha final inválida' })
  fechaFinal: Date;

  /**
   * Observaciones o justificación de la modificación
   */
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  observaciones?: string;
} 