import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

/**
 * DTO para crear un nuevo seguimiento general
 */
export class CreateSeguimientoGeneralDto {
  /**
   * ID del contrato al que pertenece el seguimiento
   */
  @IsNumber()
  contratoId: number;

  /**
   * Porcentaje de avance financiero (0-100)
   */
  @IsNumber()
  @Min(0)
  @Max(100)
  avanceFinanciero: number;

  /**
   * Porcentaje de avance físico (0-100)
   */
  @IsNumber()
  @Min(0)
  @Max(100)
  avanceFisico: number;

  /**
   * Observaciones del seguimiento (opcional)
   */
  @IsString()
  @IsOptional()
  observaciones?: string;
} 