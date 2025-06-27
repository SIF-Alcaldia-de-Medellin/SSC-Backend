import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Contrato } from '../contratos/contrato.entity';

/**
 * Entidad que representa la tabla TBL_ADICIONES
 * 
 * Almacena las adiciones presupuestales a los contratos
 */
@Entity({ schema: 'SSC', name: 'TBL_ADICIONES' })
export class Adicion {
  /**
   * Identificador único de la adición
   */
  @ApiProperty({ description: 'Identificador único de la adición' })
  @PrimaryGeneratedColumn({ name: 'ADI_ID' })
  id: number;

  /**
   * ID del contrato al que pertenece la adición
   */
  @ApiProperty({ description: 'ID del contrato al que pertenece la adición' })
  @Column({ name: 'ADI_CON_ID' })
  contratoId: number;

  @ApiProperty({ description: 'Información del contrato asociado' })
  @ManyToOne(() => Contrato, { eager: true })
  @JoinColumn({ name: 'ADI_CON_ID' })
  contrato: Contrato;

  /**
   * Valor de la adición presupuestal
   */
  @ApiProperty({ description: 'Valor de la adición presupuestal' })
  @Column('bigint', { name: 'ADI_VALOR_ADICION' })
  valorAdicion: number;

  /**
   * Fecha de la adición
   */
  @ApiProperty({ description: 'Fecha de la adición' })
  @Column('date', { name: 'ADI_FECHA' })
  fecha: Date;

  /**
   * Fecha de creación del registro
   */
  @ApiProperty({ description: 'Fecha de creación del registro' })
  @CreateDateColumn({ name: 'ADI_CREATED_AT' })
  createdAt: Date;

  /**
   * Observaciones o justificación de la adición
   */
  @ApiProperty({ description: 'Observaciones o justificación de la adición', required: false })
  @Column('text', { name: 'ADI_OBSERVACIONES', nullable: true })
  observaciones?: string;
} 