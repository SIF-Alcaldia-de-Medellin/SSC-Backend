import { IsNotEmpty, IsInt, IsString, IsEnum, IsDate, Min, IsOptional, Length, IsPositive, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoContrato } from '../contrato.entity';

/**
 * DTO para la creación de contratos
 */
export class CreateContratoDto {
  /**
   * Cédula del supervisor asignado
   */
  @ApiProperty({
    description: 'Cédula del supervisor asignado al contrato',
    example: '1234567890'
  })
  @IsNotEmpty({ message: 'La cédula del supervisor es requerida' })
  @IsString({ message: 'La cédula debe ser una cadena de texto' })
  usuarioCedula: string;

  /**
   * Número único del contrato
   */
  @ApiProperty({
    description: 'Número único del contrato (10 dígitos)',
    example: '4600000001',
    pattern: '^[0-9]{10}$',
    minLength: 10,
    maxLength: 10
  })
  @IsNotEmpty({ message: 'El número de contrato es requerido' })
  @IsString({ message: 'El número de contrato debe ser una cadena de texto' })
  @Matches(/^[0-9]{10}$/, { message: 'El número de contrato debe tener 10 dígitos' })
  numeroContrato: string;

  /**
   * Año de suscripción
   */
  @ApiProperty({
    description: 'Año de suscripción del contrato',
    example: 2024,
    minimum: 2000
  })
  @IsNotEmpty({ message: 'El año de suscripción es requerido' })
  @IsInt({ message: 'El año debe ser un número entero' })
  @Min(2000, { message: 'El año debe ser mayor a 2000' })
  anoSuscripcion: number;

  /**
   * Programa del contrato
   */
  @ApiProperty({
    description: 'Programa al que pertenece el contrato',
    example: 'Programa de Infraestructura Vial',
    minLength: 3,
    maxLength: 100
  })
  @IsNotEmpty({ message: 'El programa es requerido' })
  @IsString({ message: 'El programa debe ser una cadena de texto' })
  @Length(3, 100, { message: 'El programa debe tener entre 3 y 100 caracteres' })
  programa: string;

  /**
   * Tipo de contrato
   */
  @ApiProperty({
    description: 'Tipo de contrato',
    example: 'Obra Pública'
  })
  @IsNotEmpty({ message: 'El tipo de contrato es requerido' })
  @IsString({ message: 'El tipo de contrato debe ser una cadena de texto' })
  tipoContrato: string;

  /**
   * Objeto del contrato
   */
  @ApiProperty({
    description: 'Descripción detallada del objeto del contrato',
    example: 'Construcción de vía en el barrio San Javier, incluye pavimentación, obras de drenaje y señalización',
    minLength: 10,
    maxLength: 1000
  })
  @IsNotEmpty({ message: 'El objeto del contrato es requerido' })
  @IsString({ message: 'El objeto debe ser una cadena de texto' })
  @Length(10, 1000, { message: 'El objeto debe tener entre 10 y 1000 caracteres' })
  objeto: string;

  /**
   * Identificador simple
   */
  @ApiProperty({
    description: 'Identificador simple del contrato para referencias internas',
    example: 'INF-VIA-2024-001'
  })
  @IsNotEmpty({ message: 'El identificador simple es requerido' })
  @IsString({ message: 'El identificador debe ser una cadena de texto' })
  identificadorSimple: string;

  /**
   * Suplentes del contrato
   */
  @ApiPropertyOptional({
    description: 'Personal suplente asignado al contrato',
    example: 'María González - Supervisora Suplente'
  })
  @IsOptional()
  @IsString({ message: 'Los suplentes deben ser una cadena de texto' })
  suplentes?: string;

  /**
   * Personal de apoyo
   */
  @ApiPropertyOptional({
    description: 'Personal de apoyo técnico asignado',
    example: 'Equipo técnico de la Secretaría de Infraestructura'
  })
  @IsOptional()
  @IsString({ message: 'El personal de apoyo debe ser una cadena de texto' })
  apoyo?: string;

  /**
   * Estado del contrato
   */
  @ApiProperty({
    description: 'Estado actual del contrato',
    enum: EstadoContrato,
    example: EstadoContrato.ACTIVO,
    enumName: 'EstadoContrato'
  })
  @IsNotEmpty({ message: 'El estado es requerido' })
  @IsEnum(EstadoContrato, { message: 'Estado inválido' })
  estado: EstadoContrato;

  /**
   * Contratista
   */
  @ApiProperty({
    description: 'Nombre de la empresa o persona contratista',
    example: 'Constructora Medellín S.A.S.'
  })
  @IsNotEmpty({ message: 'El contratista es requerido' })
  @IsString({ message: 'El contratista debe ser una cadena de texto' })
  contratista: string;

  /**
   * Número del proceso
   */
  @ApiProperty({
    description: 'Número del proceso de contratación',
    example: 'LP-001-2024'
  })
  @IsNotEmpty({ message: 'El número de proceso es requerido' })
  @IsString({ message: 'El número de proceso debe ser una cadena de texto' })
  numeroProceso: string;

  /**
   * Fecha de inicio
   */
  @ApiProperty({
    description: 'Fecha de inicio del contrato',
    example: '2024-01-15',
    format: 'date'
  })
  @IsNotEmpty({ message: 'La fecha de inicio es requerida' })
  @Type(() => Date)
  @IsDate({ message: 'Fecha de inicio inválida' })
  fechaInicio: Date;

  /**
   * Fecha de terminación inicial
   */
  @ApiProperty({
    description: 'Fecha de terminación inicialmente prevista',
    example: '2024-06-15',
    format: 'date'
  })
  @IsNotEmpty({ message: 'La fecha de terminación inicial es requerida' })
  @Type(() => Date)
  @IsDate({ message: 'Fecha de terminación inicial inválida' })
  fechaTerminacionInicial: Date;

  /**
   * Fecha de terminación actual
   */
  @ApiProperty({
    description: 'Fecha de terminación actual (puede diferir de la inicial por modificaciones)',
    example: '2024-08-15',
    format: 'date'
  })
  @IsNotEmpty({ message: 'La fecha de terminación actual es requerida' })
  @Type(() => Date)
  @IsDate({ message: 'Fecha de terminación actual inválida' })
  fechaTerminacionActual: Date;

  /**
   * Valor inicial del contrato
   */
  @ApiProperty({
    description: 'Valor inicial del contrato en pesos colombianos',
    example: 1000000000,
    minimum: 1
  })
  @IsNotEmpty({ message: 'El valor inicial es requerido' })
  @IsInt({ message: 'El valor inicial debe ser un número entero' })
  @IsPositive({ message: 'El valor inicial debe ser positivo' })
  valorInicial: number;

  /**
   * Valor total del contrato
   */
  @ApiProperty({
    description: 'Valor total actual del contrato en pesos colombianos (incluye adiciones)',
    example: 1200000000,
    minimum: 1
  })
  @IsNotEmpty({ message: 'El valor total es requerido' })
  @IsInt({ message: 'El valor total debe ser un número entero' })
  @IsPositive({ message: 'El valor total debe ser positivo' })
  valorTotal: number;
} 