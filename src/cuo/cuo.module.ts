import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuoController } from './cuo.controller';
import { CuoService } from './cuo.service';
import { Cuo } from './cuo.entity';
import { Contrato } from '../contratos/contrato.entity';

/**
 * Módulo de Certificado Único de Obra (CUO)
 * 
 * Gestiona los certificados únicos de obra (TBL_CUO).
 * Funcionalidades:
 * - CRUD de certificados
 * - Gestión de ubicaciones (latitud, longitud)
 * - Control de información por comuna y barrio
 * - Descripción detallada de trabajos
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Cuo, Contrato])
  ],
  controllers: [CuoController],
  providers: [CuoService],
  exports: [CuoService]
})
export class CuoModule {} 