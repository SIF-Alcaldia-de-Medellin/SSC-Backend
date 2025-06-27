import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Contrato } from '../contratos/contrato.entity';

/**
 * Entidad que representa la tabla TBL_SEGUIMIENTOGENERAL
 * 
 * Almacena el seguimiento general de avance de los contratos
 */
@Entity({ schema: 'SSC', name: 'TBL_SEGUIMIENTOGENERAL' })
export class SeguimientoGeneral {
  /**
   * Identificador único del seguimiento
   */
  @ApiProperty({ description: 'Identificador único del seguimiento' })
  @PrimaryGeneratedColumn({ name: 'SEG_ID' })
  id: number;

  /**
   * ID del contrato al que pertenece el seguimiento
   */
  @ApiProperty({ description: 'ID del contrato al que pertenece el seguimiento' })
  @Column({ name: 'SEG_CON_ID' })
  contratoId: number;

  @ApiProperty({ description: 'Información del contrato asociado' })
  @ManyToOne(() => Contrato, { eager: true })
  @JoinColumn({ name: 'SEG_CON_ID' })
  contrato: Contrato;

  /**
   * Valor ejecutado del contrato en pesos
   */
  @ApiProperty({ 
    description: 'Valor ejecutado del contrato en pesos',
    example: 150000000
  })
  @Column('decimal', { 
    name: 'SEG_AVANCE_FINANCIERO', 
    precision: 15, 
    scale: 2,
    comment: 'Valor ejecutado del contrato en pesos colombianos'
  })
  avanceFinanciero: number;

  /**
   * Porcentaje de avance físico
   */
  @ApiProperty({ 
    description: 'Porcentaje de avance físico', 
    minimum: 0, 
    maximum: 100,
    example: 45.5
  })
  @Column('decimal', { 
    name: 'SEG_AVANCE_FISICO', 
    precision: 5, 
    scale: 2,
    comment: 'Porcentaje de avance físico (0-100)'
  })
  avanceFisico: number;

  /**
   * Fecha de creación del registro
   */
  @ApiProperty({ 
    description: 'Fecha de creación del registro',
    example: '2024-03-15T10:30:00Z'
  })
  @CreateDateColumn({ name: 'SEG_CREATED_AT' })
  createdAt: Date;

  /**
   * Observaciones del seguimiento
   */
  @ApiProperty({ 
    description: 'Observaciones del seguimiento', 
    required: false,
    example: 'El avance del contrato se encuentra dentro de lo programado...'
  })
  @Column('text', { name: 'SEG_OBSERVACIONES', nullable: true })
  observaciones?: string;
} 