import { ForbiddenException } from '@nestjs/common';
import { RolUsuario } from '../../usuarios/usuario.entity';
import { Repository } from 'typeorm';
import { Contrato } from '../../contratos/contrato.entity';

/**
 * Utilidad para verificar permisos de acceso basados en el contrato
 */
export class PermissionUtils {
  /**
   * Verifica si un usuario tiene acceso a un contrato específico
   * @param usuarioCedula - Cédula del usuario
   * @param usuarioRol - Rol del usuario
   * @param contrato - Contrato a verificar
   * @returns true si tiene acceso, false si no
   */
  static verificarAccesoContrato(
    usuarioCedula: string,
    usuarioRol: RolUsuario,
    contrato: Contrato
  ): boolean {
    if (usuarioRol === RolUsuario.ADMIN) return true;
    return contrato.usuarioCedula === usuarioCedula;
  }

  /**
   * Verifica si un usuario tiene acceso a un contrato por ID
   * @param contratoId - ID del contrato
   * @param usuarioCedula - Cédula del usuario
   * @param usuarioRol - Rol del usuario
   * @param contratoRepository - Repositorio de contratos
   * @throws ForbiddenException si el usuario no tiene acceso
   */
  static async verificarAccesoContratoById(
    contratoId: number,
    usuarioCedula: string,
    usuarioRol: RolUsuario,
    contratoRepository: Repository<Contrato>
  ): Promise<void> {
    if (usuarioRol === RolUsuario.ADMIN) return;

    const contrato = await contratoRepository.findOne({
      where: { id: contratoId }
    });

    if (!contrato || contrato.usuarioCedula !== usuarioCedula) {
      throw new ForbiddenException('No tienes acceso a este contrato');
    }
  }

  /**
   * Verifica si un usuario tiene acceso a una entidad relacionada con un contrato
   * @param contratoId - ID del contrato
   * @param usuarioCedula - Cédula del usuario
   * @param usuarioRol - Rol del usuario
   * @param contratoRepository - Repositorio de contratos
   * @throws ForbiddenException si el usuario no tiene acceso
   */
  static async verificarAccesoEntidad<T>(
    contratoId: number,
    usuarioCedula: string,
    usuarioRol: RolUsuario,
    contratoRepository: Repository<Contrato>
  ): Promise<void> {
    await this.verificarAccesoContratoById(
      contratoId,
      usuarioCedula,
      usuarioRol,
      contratoRepository
    );
  }

  /**
   * Verifica si un usuario tiene permiso para crear registros
   * @param usuarioRol - Rol del usuario
   * @throws ForbiddenException si el usuario no tiene permiso
   */
  static verificarPermisoCreacion(usuarioRol: RolUsuario): void {
    if (usuarioRol !== RolUsuario.ADMIN && usuarioRol !== RolUsuario.SUPERVISOR) {
      throw new ForbiddenException('No tienes permisos para crear registros');
    }
  }

  /**
   * Verifica si un usuario tiene permiso para eliminar registros
   * @param usuarioRol - Rol del usuario
   * @throws ForbiddenException si el usuario no tiene permiso
   */
  static verificarPermisoEliminacion(usuarioRol: RolUsuario): void {
    if (usuarioRol !== RolUsuario.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden eliminar registros');
    }
  }

  /**
   * Verifica si un usuario tiene permiso para actualizar registros
   * @param usuarioRol - Rol del usuario
   * @throws ForbiddenException si el usuario no tiene permiso
   */
  static verificarPermisoActualizacion(usuarioRol: RolUsuario): void {
    if (usuarioRol !== RolUsuario.ADMIN && usuarioRol !== RolUsuario.SUPERVISOR) {
      throw new ForbiddenException('No tienes permisos para actualizar registros');
    }
  }

  /**
   * Verifica si un usuario tiene permiso para ver registros
   * @param usuarioRol - Rol del usuario
   * @throws ForbiddenException si el usuario no tiene permiso
   */
  static verificarPermisoVisualizacion(usuarioRol: RolUsuario): void {
    if (usuarioRol !== RolUsuario.ADMIN && usuarioRol !== RolUsuario.SUPERVISOR) {
      throw new ForbiddenException('No tienes permisos para ver este recurso');
    }
  }
} 