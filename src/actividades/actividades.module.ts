import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActividadesController } from './actividades.controller';
import { ActividadesService } from './actividades.service';
import { Actividad } from './actividad.entity';
import { Contrato } from '../contratos/contrato.entity';
import { Cuo } from '../cuo/cuo.entity';

/**
 * Módulo de Actividades
 * 
 * Gestiona las actividades de los CUO (TBL_ACTIVIDADES).
 * Funcionalidades:
 * - CRUD de actividades
 * - Control de avance físico
 * - Gestión de proyección financiera
 * - Seguimiento de unidades de avance
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Actividad, Contrato, Cuo])
  ],
  controllers: [ActividadesController],
  providers: [ActividadesService],
  exports: [ActividadesService]
})
export class ActividadesModule {} 