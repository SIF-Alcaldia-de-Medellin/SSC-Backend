import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Cuo } from '../cuo/cuo.entity';

/**
 * Entidad que representa la tabla TBL_ACTIVIDADES
 * 
 * Almacena las actividades a realizar en cada CUO
 */
@Entity({ schema: 'SSC', name: 'TBL_ACTIVIDADES' })
export class Actividad {
  /**
   * Identificador único de la actividad
   */
  @ApiProperty({ description: 'Identificador único de la actividad' })
  @PrimaryGeneratedColumn({ name: 'ACT_ID' })
  id: number;

  /**
   * ID del CUO al que pertenece esta actividad
   */
  @ApiProperty({ description: 'ID del Código Único de Obra (CUO) al que pertenece la actividad' })
  @Column({ name: 'ACT_CUO_ID' })
  cuoId: number;

  /**
   * Información del CUO asociado
   */
  @ApiProperty({ description: 'Información del Código Único de Obra asociado' })
  @ManyToOne('Cuo', 'actividades', { eager: true })
  @JoinColumn({ name: 'ACT_CUO_ID' })
  cuo: Cuo;

  /**
   * Descripción de la actividad
   */
  @ApiProperty({ description: 'Descripción de la actividad' })
  @Column('varchar', { name: 'ACT_ACTIVIDAD' })
  actividad: string;

  /**
   * Meta física de la actividad
   */
  @ApiProperty({ description: 'Meta física de la actividad' })
  @Column('float', { name: 'ACT_METAFISICA' })
  metaFisica: number;

  /**
   * Valor proyectado financiero
   */
  @ApiProperty({ description: 'Valor proyectado financiero' })
  @Column('bigint', { name: 'ACT_PROYECTADO_FINANCIERO' })
  proyectadoFinanciero: number;

  /**
   * Unidades de avance
   */
  @ApiProperty({ description: 'Unidades de avance para medición' })
  @Column('varchar', { name: 'ACT_UNIDADES_AVANCE' })
  unidadesAvance: string;
} 