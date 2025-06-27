import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para crear un nuevo seguimiento general
 */
export class CreateSeguimientoGeneralDto {
  /**
   * ID del contrato al que pertenece el seguimiento
   */
  @ApiProperty({
    description: 'ID del contrato al que pertenece el seguimiento',
    example: 1
  })
  @IsNumber()
  contratoId: number;

  /**
   * Valor ejecutado del contrato en pesos
   */
  @ApiProperty({
    description: 'Valor ejecutado del contrato en pesos',
    example: 150000000,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  avanceFinanciero: number;

  /**
   * Porcentaje de avance físico (0-100)
   */
  @ApiProperty({
    description: 'Porcentaje de avance físico (0-100)',
    example: 45.5,
    minimum: 0,
    maximum: 100
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  avanceFisico: number;

  /**
   * Observaciones del seguimiento (opcional)
   */
  @ApiProperty({
    description: 'Observaciones del seguimiento',
    example: 'Se ha completado la fase inicial del proyecto...',
    required: false
  })
  @IsString()
  @IsOptional()
  observaciones?: string;
} 