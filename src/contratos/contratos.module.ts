import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContratosController } from './contratos.controller';
import { ContratosService } from './contratos.service';
import { Contrato } from './contrato.entity';

/**
 * Módulo de Contratos
 * 
 * Gestiona los contratos de obra (TBL_CONTRATOS).
 * Funcionalidades:
 * - CRUD de contratos
 * - Gestión de información contractual
 * - Seguimiento de fechas y valores
 * - Relación con supervisores
 */
@Module({
  imports: [TypeOrmModule.forFeature([Contrato])],
  controllers: [ContratosController],
  providers: [ContratosService],
  exports: [ContratosService]
})
export class ContratosModule {} 