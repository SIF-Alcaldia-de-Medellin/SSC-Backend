import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Actividad } from '../actividades/actividad.entity';

/**
 * Entidad que representa la tabla TBL_SEGUIMIENTOACTIVIDAD
 * 
 * Almacena el seguimiento detallado de cada actividad
 */
@Entity({ schema: 'SSC', name: 'TBL_SEGUIMIENTOACTIVIDAD' })
export class SeguimientoActividad {
  /**
   * Identificador único del seguimiento
   */
  @ApiProperty({ description: 'Identificador único del seguimiento' })
  @PrimaryGeneratedColumn({ name: 'SEG_ID' })
  id: number;

  /**
   * ID de la actividad a la que pertenece el seguimiento
   */
  @ApiProperty({ description: 'ID de la actividad a la que pertenece el seguimiento' })
  @Column({ name: 'SEG_ACT_ID' })
  actividadId: number;

  @ApiProperty({ description: 'Información de la actividad asociada' })
  @ManyToOne(() => Actividad, { eager: true })
  @JoinColumn({ name: 'SEG_ACT_ID' })
  actividad: Actividad;

  /**
   * Avance físico de la actividad (cantidad ejecutada)
   */
  @ApiProperty({ description: 'Avance físico de la actividad (cantidad ejecutada)' })
  @Column('decimal', { name: 'SEG_AVANCE_FISICO', precision: 10, scale: 2 })
  avanceFisico: number;

  /**
   * Costo aproximado de la actividad
   */
  @ApiProperty({ description: 'Costo aproximado de la actividad' })
  @Column('decimal', { name: 'SEG_COSTO_APROXIMADO', precision: 15, scale: 2 })
  costoAproximado: number;

  /**
   * Fecha de creación del registro
   */
  @ApiProperty({ description: 'Fecha de creación del registro' })
  @CreateDateColumn({ name: 'SEG_CREATED_AT' })
  createdAt: Date;

  /**
   * Descripción detallada del seguimiento
   */
  @ApiProperty({ description: 'Descripción detallada del seguimiento' })
  @Column('text', { name: 'SEG_DESCRIPCION_SEGUIMIENTO' })
  descripcionSeguimiento: string;

  /**
   * Proyección de actividades futuras
   */
  @ApiProperty({ description: 'Proyección de actividades futuras' })
  @Column('text', { name: 'SEG_PROYECCION_ACTIVIDADES' })
  proyeccionActividades: string;
} 