import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeguimientoActividad } from './seguimiento-actividad.entity';
import { Actividad } from '../actividades/actividad.entity';
import { SeguimientoActividadService } from './seguimiento-actividad.service';
import { SeguimientoActividadController } from './seguimiento-actividad.controller';

/**
 * Módulo de Seguimiento de Actividad
 * 
 * Gestiona el seguimiento específico de actividades (TBL_SEGUIMIENTOACTIVIDAD).
 * Funcionalidades:
 * - CRUD de seguimientos por actividad
 * - Control de avance físico específico
 * - Gestión de costos aproximados
 * - Registro de observaciones por actividad
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SeguimientoActividad,
      Actividad
    ])
  ],
  providers: [SeguimientoActividadService],
  controllers: [SeguimientoActividadController],
  exports: [SeguimientoActividadService]
})
export class SeguimientoActividadModule {} 