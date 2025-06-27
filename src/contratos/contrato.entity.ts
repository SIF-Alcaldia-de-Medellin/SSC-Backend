import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';

/**
 * Estados posibles de un contrato
 */
export enum EstadoContrato {
  ACTIVO = 'activo',
  TERMINADO = 'terminado',
  SUSPENDIDO = 'suspendido',
  LIQUIDADO = 'liquidado'
}

/**
 * Entidad que representa la tabla TBL_CONTRATOS
 * 
 * Almacena la información principal de los contratos de obra
 */
@Entity({ schema: 'SSC', name: 'TBL_CONTRATOS' })
export class Contrato {
  /**
   * Identificador único del contrato
   */
  @PrimaryGeneratedColumn({ name: 'CON_ID' })
  id: number;

  /**
   * Cédula del supervisor del contrato
   * Relación con la tabla de usuarios
   */
  @Column({ name: 'CON_USU_CEDULA' })
  usuarioCedula: string;

  @ManyToOne(() => Usuario, { eager: true })
  @JoinColumn({ name: 'CON_USU_CEDULA', referencedColumnName: 'cedula' })
  supervisor: Usuario;

  /**
   * Número único del contrato
   */
  @Column('varchar', { name: 'CON_NRO_CONTRATO', unique: true, length: 20 })
  numeroContrato: string;

  /**
   * Año de suscripción del contrato
   */
  @Column('smallint', { name: 'CON_ANO_SUSCRIPCION' })
  anoSuscripcion: number;

  /**
   * Programa al que pertenece el contrato
   */
  @Column('varchar', { name: 'CON_PROGRAMA', length: 255 })
  programa: string;

  /**
   * Tipo de contrato
   */
  @Column('varchar', { name: 'CON_TIPO_CONTRATO', length: 100 })
  tipoContrato: string;

  /**
   * Objeto del contrato
   */
  @Column('text', { name: 'CON_OBJETO' })
  objeto: string;

  /**
   * Identificador simple para referencia rápida
   */
  @Column('varchar', { name: 'CON_IDENTIFICADOR_SIMPLE', length: 100 })
  identificadorSimple: string;

  /**
   * Suplentes asignados al contrato
   */
  @Column('varchar', { name: 'CON_SUPLENTES', nullable: true, length: 255 })
  suplentes: string;

  /**
   * Personal de apoyo
   */
  @Column('varchar', { name: 'CON_APOYO', nullable: true, length: 255 })
  apoyo: string;

  /**
   * Estado actual del contrato
   */
  @Column({
    name: 'CON_ESTADO',
    type: 'varchar',
    enum: EstadoContrato,
    default: EstadoContrato.ACTIVO
  })
  estado: EstadoContrato;

  /**
   * Nombre o razón social del contratista
   */
  @Column('varchar', { name: 'CON_CONTRATISTA', length: 255 })
  contratista: string;

  /**
   * Número del proceso de contratación
   */
  @Column('varchar', { name: 'CON_NRO_PROCESO', length: 100 })
  numeroProceso: string;

  /**
   * Fecha de inicio del contrato
   */
  @Column('date', { name: 'CON_FECHA_INI' })
  fechaInicio: Date;

  /**
   * Fecha de terminación inicial
   */
  @Column('date', { name: 'CON_FECHA_TER_INI' })
  fechaTerminacionInicial: Date;

  /**
   * Fecha de terminación actual (considerando prórrogas)
   */
  @Column('date', { name: 'CON_FECHA_TER_ACT' })
  fechaTerminacionActual: Date;

  /**
   * Valor inicial del contrato
   */
  @Column('bigint', { name: 'CON_VALOR_INI' })
  valorInicial: number;

  /**
   * Valor total del contrato (incluyendo adiciones)
   */
  @Column('bigint', { name: 'CON_VALOR_TOTAL' })
  valorTotal: number;

  /**
   * Puntos de intervención (CUOs) asociados al contrato
   */
  @OneToMany('Cuo', 'contrato')
  cuos: any[];
} 