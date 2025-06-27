import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModificacionesController } from './modificaciones.controller';
import { ModificacionesService } from './modificaciones.service';
import { Modificacion } from './modificacion.entity';
import { Contrato } from '../contratos/contrato.entity';

/**
 * Módulo de Modificaciones
 * 
 * Gestiona las modificaciones a los contratos (TBL_MODIFICACIONES).
 * Funcionalidades:
 * - CRUD de modificaciones
 * - Control de fechas de inicio y fin
 * - Gestión de tipos de modificación
 * - Seguimiento de duración y observaciones
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Modificacion, Contrato])
  ],
  controllers: [ModificacionesController],
  providers: [ModificacionesService],
  exports: [ModificacionesService]
})
export class ModificacionesModule {} 