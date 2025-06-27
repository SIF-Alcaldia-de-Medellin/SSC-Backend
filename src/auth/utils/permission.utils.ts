import { ForbiddenException } from '@nestjs/common';
import { RolUsuario } from '../../usuarios/usuario.entity';
import { Repository } from 'typeorm';
import { Contrato } from '../../contratos/contrato.entity';

/**
 * Utilidad para verificar permisos de acceso basados en el contrato
 */
export class PermissionUtils {
  /**
   * Verifica si un usuario tiene acceso a un contrato
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
   * Verifica si un usuario tiene acceso a una entidad relacionada con un contrato
   */
  static async verificarAccesoEntidad<T>(
    contratoId: number,
    usuarioCedula: string,
    usuarioRol: RolUsuario,
    contratoRepository: Repository<Contrato>
  ): Promise<void> {
    // Los administradores tienen acceso total
    if (usuarioRol === RolUsuario.ADMIN) return;

    // Buscar el contrato relacionado
    const contrato = await contratoRepository.findOne({
      where: { id: contratoId }
    });

    // Si el contrato no existe o el usuario no tiene acceso, lanzar error
    if (!contrato || contrato.usuarioCedula !== usuarioCedula) {
      throw new ForbiddenException('No tienes acceso a este recurso');
    }
  }

  /**
   * Verifica si un usuario tiene permiso para crear registros
   */
  static verificarPermisoCreacion(usuarioRol: RolUsuario): void {
    if (usuarioRol !== RolUsuario.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden crear registros');
    }
  }

  /**
   * Verifica si un usuario tiene permiso para eliminar registros
   */
  static verificarPermisoEliminacion(usuarioRol: RolUsuario): void {
    if (usuarioRol !== RolUsuario.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden eliminar registros');
    }
  }

  /**
   * Verifica si un usuario tiene permiso para actualizar registros
   */
  static verificarPermisoActualizacion(usuarioRol: RolUsuario): void {
    if (usuarioRol !== RolUsuario.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden actualizar registros');
    }
  }

  /**
   * Verifica si un usuario tiene permiso para ver registros
   */
  static verificarPermisoVisualizacion(usuarioRol: RolUsuario): void {
    if (usuarioRol !== RolUsuario.ADMIN && usuarioRol !== RolUsuario.SUPERVISOR) {
      throw new ForbiddenException('No tienes permisos para ver este recurso');
    }
  }
} 