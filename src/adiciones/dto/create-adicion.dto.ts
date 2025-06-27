import { IsNotEmpty, IsInt, IsString, IsDate, IsPositive, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para la creación de adiciones presupuestales
 */
export class CreateAdicionDto {
  /**
   * ID del contrato al que se aplica la adición
   */
  @IsNotEmpty({ message: 'El ID del contrato es requerido' })
  @IsInt({ message: 'El ID del contrato debe ser un número entero' })
  @IsPositive({ message: 'El ID del contrato debe ser positivo' })
  contratoId: number;

  /**
   * Valor de la adición presupuestal
   */
  @IsNotEmpty({ message: 'El valor de la adición es requerido' })
  @IsInt({ message: 'El valor debe ser un número entero' })
  @IsPositive({ message: 'El valor debe ser positivo' })
  valorAdicion: number;

  /**
   * Fecha de la adición
   */
  @IsNotEmpty({ message: 'La fecha es requerida' })
  @Type(() => Date)
  @IsDate({ message: 'Fecha inválida' })
  fecha: Date;

  /**
   * Observaciones o justificación de la adición
   */
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  observaciones?: string;
} 