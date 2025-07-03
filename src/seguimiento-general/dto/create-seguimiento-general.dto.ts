import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para crear un nuevo seguimiento general
 * 
 * Este DTO define los datos necesarios para crear un seguimiento general.
 * Los valores ingresados se consideran como INCREMENTALES (del período actual)
 * y el sistema calculará automáticamente los valores acumulados totales.
 */
export class CreateSeguimientoGeneralDto {
  /**
   * ID del contrato al que pertenece el seguimiento
   */
  @ApiProperty({
    description: 'ID del contrato al que pertenece el seguimiento',
    example: 1,
    type: 'number'
  })
  @IsNumber()
  contratoId: number;

  /**
   * Valor ejecutado incremental en este período específico
   */
  @ApiProperty({
    description: `Valor ejecutado en este período específico en pesos colombianos.
    
    **IMPORTANTE:** Este valor representa únicamente lo ejecutado en este período,
    NO el valor total acumulado. El sistema sumará automáticamente este valor
    a los seguimientos anteriores para calcular el acumulado total.
    
    **Ejemplo:** Si ya se han ejecutado $100M en seguimientos anteriores y en este
    período se ejecutaron $50M adicionales, debe ingresar $50M (no $150M).`,
    example: 150000000,
    minimum: 0,
    type: 'number'
  })
  @IsNumber()
  @Min(0)
  avanceFinanciero: number;

  /**
   * Porcentaje de avance físico incremental en este período
   */
  @ApiProperty({
    description: `Porcentaje de avance físico alcanzado en este período específico (0-100).
    
    **IMPORTANTE:** Este porcentaje representa únicamente el avance logrado en este
    período, NO el porcentaje total acumulado. El sistema sumará automáticamente
    este porcentaje a los seguimientos anteriores para calcular el avance total.
    
    **Ejemplo:** Si ya se tenía un 30% de avance en seguimientos anteriores y en 
    este período se completó un 15% adicional, debe ingresar 15% (no 45%).
    
    **Validación:** Debe estar entre 0 y 100. El sistema validará que el acumulado
    no exceda los límites del contrato.`,
    example: 15.5,
    minimum: 0,
    maximum: 100,
    type: 'number'
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  avanceFisico: number;

  /**
   * Observaciones del seguimiento (opcional)
   */
  @ApiProperty({
    description: `Observaciones, comentarios o notas sobre el seguimiento realizado.
    
    **Recomendaciones:**
    - Describa los trabajos realizados en este período
    - Mencione logros, dificultades o situaciones especiales
    - Incluya información relevante para el seguimiento del proyecto
    - Documente decisiones importantes o cambios en el alcance`,
    example: 'Se completó la segunda fase del proyecto incluyendo la instalación de 500m de tubería. Se experimentaron retrasos menores debido a condiciones climáticas, pero se mantiene el cronograma general.',
    required: false,
    type: 'string'
  })
  @IsString()
  @IsOptional()
  observaciones?: string;
} 