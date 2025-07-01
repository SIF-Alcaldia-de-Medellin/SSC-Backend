import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Entidad que representa la tabla TBL_CUO (Código Único de Obra)
 * 
 * Esta entidad mapea los códigos únicos de obra que son puntos específicos
 * de intervención dentro de un contrato municipal.
 */
@Entity({ schema: 'SSC', name: 'TBL_CUO' })
export class Cuo {
  /**
   * Identificador único del CUO
   */
  @ApiProperty({ description: 'Identificador único del Código Único de Obra (CUO)' })
  @PrimaryGeneratedColumn({ name: 'CUO_ID' })
  id: number;

  /**
   * ID del contrato al que pertenece este CUO
   */
  @ApiProperty({ description: 'ID del contrato al que pertenece este Código Único de Obra' })
  @Column({ name: 'CUO_CON_ID' })
  contratoId: number;

  /**
   * Relación con el contrato
   */
  @ApiProperty({ description: 'Información del contrato asociado' })
  @ManyToOne('Contrato', 'cuos', { eager: true })
  @JoinColumn({ name: 'CUO_CON_ID' })
  contrato: any;

  /**
   * Número identificador del CUO
   */
  @ApiProperty({ description: 'Número identificador del Código Único de Obra' })
  @Column('varchar', { name: 'CUO_NRO', length: 20 })
  numero: string;

  /**
   * Latitud de la ubicación del CUO
   */
  @ApiProperty({ description: 'Latitud de la ubicación del Código Único de Obra', minimum: -90, maximum: 90 })
  @Column('decimal', { name: 'CUO_LATITUD', precision: 10, scale: 8 })
  latitud: number;

  /**
   * Longitud de la ubicación del CUO
   */
  @ApiProperty({ description: 'Longitud de la ubicación del Código Único de Obra', minimum: -180, maximum: 180 })
  @Column('decimal', { name: 'CUO_LONGITUD', precision: 11, scale: 8 })
  longitud: number;

  /**
   * Comuna donde se ubica el CUO
   */
  @ApiProperty({ description: 'Comuna donde se ubica el Código Único de Obra', maxLength: 50 })
  @Column('varchar', { name: 'CUO_COMUNA', length: 50 })
  comuna: string;

  /**
   * Barrio donde se ubica el CUO
   */
  @ApiProperty({ description: 'Barrio donde se ubica el Código Único de Obra', maxLength: 100 })
  @Column('varchar', { name: 'CUO_BARRIO', length: 100 })
  barrio: string;

  /**
   * Descripción detallada del CUO
   */
  @ApiProperty({ description: 'Descripción detallada del Código Único de Obra y las actividades a realizar' })
  @Column('text', { name: 'CUO_DESCRIPCION' })
  descripcion: string;

  /**
   * Actividades asociadas al CUO
   */
  @ApiProperty({ description: 'Actividades asociadas al Código Único de Obra', type: 'array' })
  @OneToMany('Actividad', 'cuo')
  actividades: any[];
} 