import { ApiProperty } from '@nestjs/swagger';
import { EstadoContrato } from '../contrato.entity';

/**
 * DTO para la respuesta de contratos
 * 
 * Este DTO define la estructura de los datos que se enviarán al cliente
 * cuando se consulte información de contratos
 */
export class ContratoResponseDto {
  /**
   * Identificador único del contrato
   */
  @ApiProperty({ description: 'Identificador único del contrato' })
  id: number;

  /**
   * Número único del contrato
   */
  @ApiProperty({ description: 'Número único del contrato' })
  numeroContrato: string;

  /**
   * Año de suscripción del contrato
   */
  @ApiProperty({ description: 'Año de suscripción del contrato' })
  anoSuscripcion: number;

  /**
   * Programa al que pertenece el contrato
   */
  @ApiProperty({ description: 'Programa al que pertenece el contrato' })
  programa: string;

  /**
   * Tipo de contrato
   */
  @ApiProperty({ description: 'Tipo de contrato' })
  tipoContrato: string;

  /**
   * Objeto del contrato
   */
  @ApiProperty({ description: 'Objeto del contrato' })
  objeto: string;

  /**
   * Identificador simple para referencia rápida
   */
  @ApiProperty({ description: 'Identificador simple para referencia rápida' })
  identificadorSimple: string;

  /**
   * Suplentes asignados al contrato
   */
  @ApiProperty({ description: 'Suplentes asignados al contrato', required: false })
  suplentes?: string;

  /**
   * Personal de apoyo
   */
  @ApiProperty({ description: 'Personal de apoyo', required: false })
  apoyo?: string;

  /**
   * Estado actual del contrato
   */
  @ApiProperty({ 
    description: 'Estado actual del contrato',
    enum: EstadoContrato,
    default: EstadoContrato.ACTIVO
  })
  estado: EstadoContrato;

  /**
   * Nombre o razón social del contratista
   */
  @ApiProperty({ description: 'Nombre o razón social del contratista' })
  contratista: string;

  /**
   * Número del proceso de contratación
   */
  @ApiProperty({ description: 'Número del proceso de contratación' })
  numeroProceso: string;

  /**
   * Fecha de inicio del contrato
   */
  @ApiProperty({ description: 'Fecha de inicio del contrato' })
  fechaInicio: Date;

  /**
   * Fecha de terminación inicial
   */
  @ApiProperty({ description: 'Fecha de terminación inicial' })
  fechaTerminacionInicial: Date;

  /**
   * Fecha de terminación actual (considerando prórrogas)
   */
  @ApiProperty({ description: 'Fecha de terminación actual (considerando prórrogas)' })
  fechaTerminacionActual: Date;

  /**
   * Valor inicial del contrato
   */
  @ApiProperty({ description: 'Valor inicial del contrato' })
  valorInicial: number;

  /**
   * Valor total del contrato (incluyendo adiciones)
   */
  @ApiProperty({ description: 'Valor total del contrato (incluyendo adiciones)' })
  valorTotal: number;

  /**
   * Información básica del supervisor
   */
  @ApiProperty({ description: 'Información básica del supervisor' })
  supervisor: {
    cedula: string;
    nombre: string;
    email: string;
  };
} 