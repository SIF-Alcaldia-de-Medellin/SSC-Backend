import { IsNotEmpty, IsInt, IsString, IsDate, IsPositive, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para la creación de adiciones presupuestales
 */
export class CreateAdicionDto {
  /**
   * ID del contrato al que se aplica la adición
   */
  @ApiProperty({
    description: 'ID del contrato al que se aplica la adición presupuestal',
    example: 1,
    minimum: 1
  })
  @IsNotEmpty({ message: 'El ID del contrato es requerido' })
  @IsInt({ message: 'El ID del contrato debe ser un número entero' })
  @IsPositive({ message: 'El ID del contrato debe ser positivo' })
  contratoId: number;

  /**
   * Valor de la adición presupuestal
   */
  @ApiProperty({
    description: 'Valor de la adición presupuestal en pesos colombianos',
    example: 150000000,
    minimum: 1
  })
  @IsNotEmpty({ message: 'El valor de la adición es requerido' })
  @IsInt({ message: 'El valor debe ser un número entero' })
  @IsPositive({ message: 'El valor debe ser positivo' })
  valorAdicion: number;

  /**
   * Fecha de la adición
   */
  @ApiProperty({
    description: 'Fecha en que se aprueba la adición',
    example: '2024-03-15',
    format: 'date'
  })
  @IsNotEmpty({ message: 'La fecha es requerida' })
  @Type(() => Date)
  @IsDate({ message: 'Fecha inválida' })
  fecha: Date;

  /**
   * Observaciones o justificación de la adición
   */
  @ApiPropertyOptional({
    description: 'Observaciones o justificación de la adición presupuestal',
    example: 'Se requiere adición para cubrir costos adicionales por cambios en especificaciones técnicas'
  })
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  observaciones?: string;
} 