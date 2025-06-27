import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cuo } from './cuo.entity';
import { Contrato } from '../contratos/contrato.entity';
import { CreateCuoDto } from './dto/create-cuo.dto';
import { CuoResponseDto } from './dto/cuo.response.dto';
import { RolUsuario } from '../usuarios/usuario.entity';
import { PermissionUtils } from '../auth/utils/permission.utils';

/**
 * Servicio para la gestión de CUO (Centro Único de Obra)
 */
@Injectable()
export class CuoService {
  constructor(
    @InjectRepository(Cuo)
    private readonly cuoRepository: Repository<Cuo>,
    @InjectRepository(Contrato)
    private readonly contratoRepository: Repository<Contrato>
  ) {}

  /**
   * Transforma una entidad CUO en un DTO de respuesta
   */
  private toResponseDto(cuo: Cuo): CuoResponseDto {
    if (!cuo) {
      throw new NotFoundException('No se puede convertir un CUO nulo a DTO');
    }

    const { contrato, actividades, ...cuoData } = cuo;
    return {
      ...cuoData,
      contrato: contrato ? {
        numeroContrato: contrato.numeroContrato,
        identificadorSimple: contrato.identificadorSimple,
        objeto: contrato.objeto
      } : undefined,
      cantidadActividades: actividades?.length || 0
    };
  }

  /**
   * Crea un nuevo CUO
   * 
   * @param createCuoDto - Datos del CUO a crear
   * @param usuarioCedula - Cédula del usuario que realiza la acción
   * @param usuarioRol - Rol del usuario que realiza la acción
   * @returns El CUO creado
   */
  async create(
    createCuoDto: CreateCuoDto,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<CuoResponseDto> {
    // Verificar permiso de creación
    PermissionUtils.verificarPermisoCreacion(usuarioRol);

    // Verificar acceso al contrato
    await PermissionUtils.verificarAccesoEntidad(
      createCuoDto.contratoId,
      usuarioCedula,
      usuarioRol,
      this.contratoRepository
    );

    const cuo = this.cuoRepository.create(createCuoDto);
    const savedCuo = await this.cuoRepository.save(cuo);

    // Cargar la relación con contrato para el DTO
    const cuoCompleto = await this.cuoRepository.findOne({
      where: { id: savedCuo.id },
      relations: ['contrato']
    });

    if (!cuoCompleto) {
      throw new NotFoundException(`No se pudo cargar el CUO creado con ID ${savedCuo.id}`);
    }

    return this.toResponseDto(cuoCompleto);
  }

  /**
   * Obtiene todos los CUO según los permisos del usuario
   * 
   * @param usuarioCedula - Cédula del usuario que realiza la consulta
   * @param usuarioRol - Rol del usuario que realiza la consulta
   * @returns Lista de CUO
   */
  async findAll(usuarioCedula: string, usuarioRol: RolUsuario): Promise<CuoResponseDto[]> {
    const cuos = await this.cuoRepository.find({
      relations: ['contrato']
    });
    return cuos.map(cuo => this.toResponseDto(cuo));
  }

  /**
   * Obtiene un CUO por su ID
   * 
   * @param id - ID del CUO
   * @param usuarioCedula - Cédula del usuario que realiza la consulta
   * @param usuarioRol - Rol del usuario que realiza la consulta
   * @returns El CUO encontrado
   */
  async findOne(
    id: number,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<CuoResponseDto> {
    const cuo = await this.cuoRepository.findOne({
      where: { id },
      relations: ['contrato']
    });

    if (!cuo) {
      throw new NotFoundException('CUO no encontrado');
    }

    // Verificar acceso al contrato relacionado
    await PermissionUtils.verificarAccesoEntidad(
      cuo.contratoId,
      usuarioCedula,
      usuarioRol,
      this.contratoRepository
    );

    return this.toResponseDto(cuo);
  }

  /**
   * Actualiza un CUO
   * 
   * @param id - ID del CUO a actualizar
   * @param updateCuoDto - Datos actualizados del CUO
   * @param usuarioCedula - Cédula del usuario que realiza la acción
   * @param usuarioRol - Rol del usuario que realiza la acción
   * @returns El CUO actualizado
   */
  async update(
    id: number,
    updateCuoDto: Partial<CreateCuoDto>,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<CuoResponseDto> {
    // Verificar permiso de actualización
    PermissionUtils.verificarPermisoActualizacion(usuarioRol);

    const cuo = await this.cuoRepository.findOne({
      where: { id },
      relations: ['contrato']
    });

    if (!cuo) {
      throw new NotFoundException('CUO no encontrado');
    }

    // Verificar acceso al contrato relacionado
    await PermissionUtils.verificarAccesoEntidad(
      cuo.contratoId,
      usuarioCedula,
      usuarioRol,
      this.contratoRepository
    );

    // Si se está cambiando el contrato, verificar acceso al nuevo contrato
    if (updateCuoDto.contratoId && updateCuoDto.contratoId !== cuo.contratoId) {
      await PermissionUtils.verificarAccesoEntidad(
        updateCuoDto.contratoId,
        usuarioCedula,
        usuarioRol,
        this.contratoRepository
      );
    }

    Object.assign(cuo, updateCuoDto);
    const updatedCuo = await this.cuoRepository.save(cuo);
    return this.toResponseDto(updatedCuo);
  }

  /**
   * Elimina un CUO
   * 
   * @param id - ID del CUO a eliminar
   * @param usuarioCedula - Cédula del usuario que realiza la acción
   * @param usuarioRol - Rol del usuario que realiza la acción
   */
  async remove(id: number, usuarioCedula: string, usuarioRol: RolUsuario): Promise<void> {
    const cuo = await this.cuoRepository.findOne({
      where: { id },
      relations: ['contrato']
    });

    if (!cuo) {
      throw new NotFoundException('CUO no encontrado');
    }

    // Verificar permiso de eliminación
    PermissionUtils.verificarPermisoEliminacion(usuarioRol);

    // Verificar acceso al contrato relacionado
    await PermissionUtils.verificarAccesoEntidad(
      cuo.contratoId,
      usuarioCedula,
      usuarioRol,
      this.contratoRepository
    );

    await this.cuoRepository.remove(cuo);
  }

  /**
   * Obtiene todos los CUO de un contrato
   * 
   * @param contratoId - ID del contrato
   * @param usuarioCedula - Cédula del usuario que realiza la consulta
   * @param usuarioRol - Rol del usuario que realiza la consulta
   * @returns Lista de CUO del contrato
   */
  async findByContrato(
    contratoId: number,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<CuoResponseDto[]> {
    // Verificar acceso al contrato
    await PermissionUtils.verificarAccesoEntidad(
      contratoId,
      usuarioCedula,
      usuarioRol,
      this.contratoRepository
    );

    const cuos = await this.cuoRepository.find({
      where: { contratoId },
      relations: ['contrato'],
      order: {
        id: 'ASC'
      }
    });

    return cuos.map(cuo => this.toResponseDto(cuo));
  }
} 