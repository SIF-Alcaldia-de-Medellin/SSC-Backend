import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la respuesta de adiciones
 * 
 * Este DTO define la estructura de los datos que se enviarán al cliente
 * cuando se consulte información de adiciones
 */
export class AdicionResponseDto {
  /**
   * Identificador único de la adición
   */
  @ApiProperty({ description: 'Identificador único de la adición' })
  id: number;

  /**
   * ID del contrato al que pertenece la adición
   */
  @ApiProperty({ description: 'ID del contrato al que pertenece la adición' })
  contratoId: number;

  /**
   * Valor de la adición presupuestal
   */
  @ApiProperty({ description: 'Valor de la adición presupuestal' })
  valorAdicion: number;

  /**
   * Fecha de la adición
   */
  @ApiProperty({ description: 'Fecha de la adición' })
  fecha: Date;

  /**
   * Fecha de creación del registro
   */
  @ApiProperty({ description: 'Fecha de creación del registro' })
  createdAt: Date;

  /**
   * Observaciones o justificación de la adición
   */
  @ApiProperty({ 
    description: 'Observaciones o justificación de la adición',
    required: false 
  })
  observaciones?: string;
} 