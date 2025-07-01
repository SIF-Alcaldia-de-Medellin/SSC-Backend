import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Contrato } from '../contratos/contrato.entity';

/**
 * Tipos de modificación permitidos
 */
export enum TipoModificacion {
  SUSPENSION = 'SUSPENSION',
  PRORROGA = 'PRORROGA'
}

/**
 * Entidad que representa la tabla TBL_MODIFICACIONES
 * 
 * Almacena las modificaciones realizadas a los contratos
 */
@Entity({ schema: 'SSC', name: 'TBL_MODIFICACIONES' })
export class Modificacion {
  /**
   * Identificador único de la modificación
   */
  @ApiProperty({ description: 'Identificador único de la modificación' })
  @PrimaryGeneratedColumn({ name: 'MOD_ID' })
  id: number;

  /**
   * ID del contrato al que pertenece la modificación
   */
  @ApiProperty({ description: 'ID del contrato al que pertenece la modificación' })
  @Column({ name: 'MOD_CON_ID' })
  contratoId: number;

  @ApiProperty({ description: 'Información del contrato asociado' })
  @ManyToOne(() => Contrato, { eager: true })
  @JoinColumn({ name: 'MOD_CON_ID' })
  contrato: Contrato;

  /**
   * Tipo de modificación
   */
  @ApiProperty({ description: 'Tipo de modificación', enum: TipoModificacion })
  @Column({ 
    name: 'MOD_TIPO',
    type: 'enum',
    enum: TipoModificacion,
    enumName: 'SSC.MODIFICACION_TIPO'
  })
  tipo: TipoModificacion;

  /**
   * Fecha de inicio de la modificación
   */
  @ApiProperty({ description: 'Fecha de inicio de la modificación' })
  @Column('date', { name: 'MOD_FECHA_INICIAL' })
  fechaInicio: Date;

  /**
   * Fecha final de la modificación
   */
  @ApiProperty({ description: 'Fecha final de la modificación' })
  @Column('date', { name: 'MOD_FECHA_FINAL' })
  fechaFinal: Date;

  /**
   * Duración en días de la modificación
   */
  @ApiProperty({ description: 'Duración en días de la modificación' })
  @Column('int', { name: 'MOD_DURACION' })
  duracion: number;

  /**
   * Fecha de creación del registro
   */
  @ApiProperty({ description: 'Fecha de creación del registro' })
  @CreateDateColumn({ name: 'MOD_CREATED_AT' })
  createdAt: Date;

  /**
   * Observaciones o justificación de la modificación
   */
  @ApiProperty({ description: 'Observaciones o justificación de la modificación', required: false })
  @Column('text', { name: 'MOD_OBSERVACIONES', nullable: true })
  observaciones?: string;
} 