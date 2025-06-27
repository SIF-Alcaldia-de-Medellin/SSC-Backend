import { IsNotEmpty, IsInt, IsString, IsEnum, IsDate, Min, IsOptional, Length, IsPositive, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoContrato } from '../contrato.entity';

/**
 * DTO para la creación de contratos
 */
export class CreateContratoDto {
  /**
   * Cédula del supervisor asignado
   */
  @IsNotEmpty({ message: 'La cédula del supervisor es requerida' })
  @IsString({ message: 'La cédula debe ser una cadena de texto' })
  usuarioCedula: string;

  /**
   * Número único del contrato
   */
  @IsNotEmpty({ message: 'El número de contrato es requerido' })
  @IsString({ message: 'El número de contrato debe ser una cadena de texto' })
  @Matches(/^[0-9]{10}$/, { message: 'El número de contrato debe tener 10 dígitos' })
  numeroContrato: string;

  /**
   * Año de suscripción
   */
  @IsNotEmpty({ message: 'El año de suscripción es requerido' })
  @IsInt({ message: 'El año debe ser un número entero' })
  @Min(2000, { message: 'El año debe ser mayor a 2000' })
  anoSuscripcion: number;

  /**
   * Programa del contrato
   */
  @IsNotEmpty({ message: 'El programa es requerido' })
  @IsString({ message: 'El programa debe ser una cadena de texto' })
  @Length(3, 100, { message: 'El programa debe tener entre 3 y 100 caracteres' })
  programa: string;

  /**
   * Tipo de contrato
   */
  @IsNotEmpty({ message: 'El tipo de contrato es requerido' })
  @IsString({ message: 'El tipo de contrato debe ser una cadena de texto' })
  tipoContrato: string;

  /**
   * Objeto del contrato
   */
  @IsNotEmpty({ message: 'El objeto del contrato es requerido' })
  @IsString({ message: 'El objeto debe ser una cadena de texto' })
  @Length(10, 1000, { message: 'El objeto debe tener entre 10 y 1000 caracteres' })
  objeto: string;

  /**
   * Identificador simple
   */
  @IsNotEmpty({ message: 'El identificador simple es requerido' })
  @IsString({ message: 'El identificador debe ser una cadena de texto' })
  identificadorSimple: string;

  /**
   * Suplentes del contrato
   */
  @IsOptional()
  @IsString({ message: 'Los suplentes deben ser una cadena de texto' })
  suplentes?: string;

  /**
   * Personal de apoyo
   */
  @IsOptional()
  @IsString({ message: 'El personal de apoyo debe ser una cadena de texto' })
  apoyo?: string;

  /**
   * Estado del contrato
   */
  @IsNotEmpty({ message: 'El estado es requerido' })
  @IsEnum(EstadoContrato, { message: 'Estado inválido' })
  estado: EstadoContrato;

  /**
   * Contratista
   */
  @IsNotEmpty({ message: 'El contratista es requerido' })
  @IsString({ message: 'El contratista debe ser una cadena de texto' })
  contratista: string;

  /**
   * Número del proceso
   */
  @IsNotEmpty({ message: 'El número de proceso es requerido' })
  @IsString({ message: 'El número de proceso debe ser una cadena de texto' })
  numeroProceso: string;

  /**
   * Fecha de inicio
   */
  @IsNotEmpty({ message: 'La fecha de inicio es requerida' })
  @Type(() => Date)
  @IsDate({ message: 'Fecha de inicio inválida' })
  fechaInicio: Date;

  /**
   * Fecha de terminación inicial
   */
  @IsNotEmpty({ message: 'La fecha de terminación inicial es requerida' })
  @Type(() => Date)
  @IsDate({ message: 'Fecha de terminación inicial inválida' })
  fechaTerminacionInicial: Date;

  /**
   * Fecha de terminación actual
   */
  @IsNotEmpty({ message: 'La fecha de terminación actual es requerida' })
  @Type(() => Date)
  @IsDate({ message: 'Fecha de terminación actual inválida' })
  fechaTerminacionActual: Date;

  /**
   * Valor inicial del contrato
   */
  @IsNotEmpty({ message: 'El valor inicial es requerido' })
  @IsInt({ message: 'El valor inicial debe ser un número entero' })
  @IsPositive({ message: 'El valor inicial debe ser positivo' })
  valorInicial: number;

  /**
   * Valor total del contrato
   */
  @IsNotEmpty({ message: 'El valor total es requerido' })
  @IsInt({ message: 'El valor total debe ser un número entero' })
  @IsPositive({ message: 'El valor total debe ser positivo' })
  valorTotal: number;
} 