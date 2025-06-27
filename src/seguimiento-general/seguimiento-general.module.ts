import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeguimientoGeneral } from './seguimiento-general.entity';
import { Contrato } from '../contratos/contrato.entity';
import { SeguimientoGeneralService } from './seguimiento-general.service';
import { SeguimientoGeneralController } from './seguimiento-general.controller';

/**
 * Módulo de Seguimiento General
 * 
 * Gestiona el seguimiento general de contratos (TBL_SEGUIMIENTOGENERAL).
 * Funcionalidades:
 * - CRUD de seguimientos
 * - Control de avance financiero
 * - Seguimiento de avance físico
 * - Registro de observaciones generales
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SeguimientoGeneral,
      Contrato
    ])
  ],
  providers: [SeguimientoGeneralService],
  controllers: [SeguimientoGeneralController],
  exports: [SeguimientoGeneralService]
})
export class SeguimientoGeneralModule {} 