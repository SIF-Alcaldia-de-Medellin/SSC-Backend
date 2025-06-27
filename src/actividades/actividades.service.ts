import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Actividad } from './actividad.entity';
import { Contrato } from '../contratos/contrato.entity';
import { Cuo } from '../cuo/cuo.entity';
import { CreateActividadDto } from './dto/create-actividad.dto';
import { ActividadResponseDto } from './dto/actividad.response.dto';
import { RolUsuario } from '../usuarios/usuario.entity';
import { PermissionUtils } from '../auth/utils/permission.utils';

/**
 * Servicio para la gestión de actividades
 */
@Injectable()
export class ActividadesService {
  constructor(
    @InjectRepository(Actividad)
    private readonly actividadRepository: Repository<Actividad>,
    @InjectRepository(Contrato)
    private readonly contratoRepository: Repository<Contrato>,
    @InjectRepository(Cuo)
    private readonly cuoRepository: Repository<Cuo>
  ) {}

  /**
   * Verifica el acceso al CUO y su contrato asociado
   */
  private async verificarAccesoCuo(
    cuoId: number,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<void> {
    const cuo = await this.cuoRepository.findOne({
      where: { id: cuoId },
      relations: ['contrato']
    });

    if (!cuo) {
      throw new NotFoundException(`No se encontró el CUO con ID ${cuoId}`);
    }

    await PermissionUtils.verificarAccesoEntidad(
      cuo.contrato.id,
      usuarioCedula,
      usuarioRol,
      this.contratoRepository
    );
  }

  /**
   * Transforma una entidad Actividad en un DTO de respuesta
   */
  private toResponseDto(actividad: Actividad): ActividadResponseDto {
    if (!actividad) {
      throw new NotFoundException('No se puede convertir una actividad nula a DTO');
    }

    const { cuo, ...actividadData } = actividad;
    return {
      ...actividadData,
      cuo: cuo ? {
        id: cuo.id,
        nroCuo: cuo.numero,
        descripcion: cuo.descripcion
      } : undefined
    };
  }

  /**
   * Crea una nueva actividad
   */
  async create(
    createActividadDto: CreateActividadDto,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<ActividadResponseDto> {
    // Verificar permiso de creación
    PermissionUtils.verificarPermisoCreacion(usuarioRol);

    // Verificar acceso al CUO y su contrato
    await this.verificarAccesoCuo(
      createActividadDto.cuoId,
      usuarioCedula,
      usuarioRol
    );

    const actividad = this.actividadRepository.create(createActividadDto);
    const savedActividad = await this.actividadRepository.save(actividad);

    const actividadCompleta = await this.actividadRepository.findOne({
      where: { id: savedActividad.id },
      relations: ['cuo']
    });

    if (!actividadCompleta) {
      throw new NotFoundException(`No se pudo cargar la actividad creada con ID ${savedActividad.id}`);
    }

    return this.toResponseDto(actividadCompleta);
  }

  /**
   * Obtiene todas las actividades según los permisos del usuario
   */
  async findAll(usuarioCedula: string, usuarioRol: RolUsuario): Promise<ActividadResponseDto[]> {
    let actividades: Actividad[];

    if (usuarioRol === RolUsuario.ADMIN) {
      // Los administradores pueden ver todas las actividades
      actividades = await this.actividadRepository.find({
        relations: ['cuo', 'cuo.contrato']
      });
    } else {
      // Los supervisores solo ven las actividades de sus contratos
      actividades = await this.actividadRepository
        .createQueryBuilder('actividad')
        .innerJoinAndSelect('actividad.cuo', 'cuo')
        .innerJoinAndSelect('cuo.contrato', 'contrato')
        .where('contrato.usuarioCedula = :usuarioCedula', { usuarioCedula })
        .getMany();
    }

    return actividades.map(actividad => this.toResponseDto(actividad));
  }

  /**
   * Obtiene una actividad por su ID
   */
  async findOne(
    id: number,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<ActividadResponseDto> {
    const actividad = await this.actividadRepository.findOne({
      where: { id },
      relations: ['cuo', 'cuo.contrato']
    });

    if (!actividad) {
      throw new NotFoundException('Actividad no encontrada');
    }

    // Verificar acceso al contrato relacionado a través del CUO
    await PermissionUtils.verificarAccesoEntidad(
      actividad.cuo.contrato.id,
      usuarioCedula,
      usuarioRol,
      this.contratoRepository
    );

    return this.toResponseDto(actividad);
  }

  /**
   * Actualiza una actividad
   */
  async update(
    id: number,
    updateActividadDto: Partial<CreateActividadDto>,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<ActividadResponseDto> {
    // Verificar permiso de actualización
    PermissionUtils.verificarPermisoActualizacion(usuarioRol);

    const actividad = await this.actividadRepository.findOne({
      where: { id },
      relations: ['cuo', 'cuo.contrato']
    });

    if (!actividad) {
      throw new NotFoundException('Actividad no encontrada');
    }

    // Verificar acceso al contrato actual
    await PermissionUtils.verificarAccesoEntidad(
      actividad.cuo.contrato.id,
      usuarioCedula,
      usuarioRol,
      this.contratoRepository
    );

    // Si se está cambiando el CUO, verificar acceso al nuevo CUO
    if (updateActividadDto.cuoId && updateActividadDto.cuoId !== actividad.cuoId) {
      await this.verificarAccesoCuo(
        updateActividadDto.cuoId,
        usuarioCedula,
        usuarioRol
      );
    }

    Object.assign(actividad, updateActividadDto);
    const updatedActividad = await this.actividadRepository.save(actividad);
    return this.toResponseDto(updatedActividad);
  }

  /**
   * Elimina una actividad
   */
  async remove(id: number, usuarioCedula: string, usuarioRol: RolUsuario): Promise<void> {
    // Verificar permiso de eliminación
    PermissionUtils.verificarPermisoEliminacion(usuarioRol);

    const actividad = await this.actividadRepository.findOne({
      where: { id },
      relations: ['cuo', 'cuo.contrato']
    });

    if (!actividad) {
      throw new NotFoundException('Actividad no encontrada');
    }

    // Verificar acceso al contrato relacionado
    await PermissionUtils.verificarAccesoEntidad(
      actividad.cuo.contrato.id,
      usuarioCedula,
      usuarioRol,
      this.contratoRepository
    );

    await this.actividadRepository.remove(actividad);
  }

  /**
   * Obtiene todas las actividades de un CUO
   */
  async findByCuo(
    cuoId: number,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<ActividadResponseDto[]> {
    // Verificar acceso al CUO y su contrato
    await this.verificarAccesoCuo(cuoId, usuarioCedula, usuarioRol);

    const actividades = await this.actividadRepository.find({
      where: { cuoId },
      relations: ['cuo'],
      order: {
        id: 'ASC'
      }
    });

    return actividades.map(actividad => this.toResponseDto(actividad));
  }
} 