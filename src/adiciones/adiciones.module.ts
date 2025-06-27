import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdicionesController } from './adiciones.controller';
import { AdicionesService } from './adiciones.service';
import { Adicion } from './adicion.entity';
import { Contrato } from '../contratos/contrato.entity';

/**
 * Módulo de Adiciones
 * 
 * Gestiona las adiciones presupuestales a los contratos (TBL_ADICIONES).
 * Funcionalidades:
 * - CRUD de adiciones
 * - Control de valores adicionales
 * - Seguimiento de fechas de adición
 * - Registro de observaciones
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Adicion, Contrato])
  ],
  controllers: [AdicionesController],
  providers: [AdicionesService],
  exports: [AdicionesService]
})
export class AdicionesModule {} 