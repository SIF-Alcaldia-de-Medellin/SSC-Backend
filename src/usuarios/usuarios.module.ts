import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './usuario.entity';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';

/**
 * Módulo de Usuarios
 * 
 * Gestiona los usuarios del sistema (TBL_USUARIOS).
 * Funcionalidades:
 * - CRUD de usuarios
 * - Gestión de roles y permisos
 * - Actualización de perfiles
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario])
  ],
  providers: [UsuariosService],
  controllers: [UsuariosController],
  exports: [UsuariosService]
})
export class UsuariosModule {} 