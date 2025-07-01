import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cuo } from './cuo.entity';
import { Contrato } from '../contratos/contrato.entity';
import { CreateCuoDto } from './dto/create-cuo.dto';
import { CuoResponseDto } from './dto/cuo.response.dto';
import { RolUsuario } from '../usuarios/usuario.entity';
import { PermissionUtils } from '../auth/utils/permission.utils';

/**
 * Servicio para la gestión de CUO (Código Único de Obra)
 * 
 * Maneja toda la lógica de negocio relacionada con los códigos únicos de obra,
 * incluyendo operaciones CRUD y validaciones específicas del dominio.
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
   */
  async create(
    createCuoDto: CreateCuoDto,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<CuoResponseDto> {
    // Verificar permiso de creación
    PermissionUtils.verificarPermisoCreacion(usuarioRol);

    // Verificar acceso al contrato
    await PermissionUtils.verificarAccesoContratoById(
      createCuoDto.contratoId,
      usuarioCedula,
      usuarioRol,
      this.contratoRepository
    );

    const cuo = this.cuoRepository.create(createCuoDto);
    const savedCuo = await this.cuoRepository.save(cuo);

    const cuoCompleto = await this.cuoRepository.findOne({
      where: { id: savedCuo.id },
      relations: ['contrato', 'actividades']
    });

    if (!cuoCompleto) {
      throw new NotFoundException(`No se pudo cargar el CUO creado con ID ${savedCuo.id}`);
    }

    return this.toResponseDto(cuoCompleto);
  }

  /**
   * Obtiene todos los CUO según los permisos del usuario
   */
  async findAll(usuarioCedula: string, usuarioRol: RolUsuario): Promise<CuoResponseDto[]> {
    // Verificar permiso de visualización
    PermissionUtils.verificarPermisoVisualizacion(usuarioRol);

    if (usuarioRol === RolUsuario.ADMIN) {
      const cuos = await this.cuoRepository.find({
        relations: ['contrato', 'actividades']
      });
      return cuos.map(cuo => this.toResponseDto(cuo));
    }

    // Para supervisores, solo retornar los CUO de sus contratos
    const cuos = await this.cuoRepository
      .createQueryBuilder('cuo')
      .leftJoinAndSelect('cuo.contrato', 'contrato')
      .leftJoinAndSelect('cuo.actividades', 'actividades')
      .where('contrato.usuarioCedula = :usuarioCedula', { usuarioCedula })
      .orderBy('cuo.id', 'ASC')
      .getMany();

    return cuos.map(cuo => this.toResponseDto(cuo));
  }

  /**
   * Obtiene un CUO por su ID
   */
  async findOne(
    id: number,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<CuoResponseDto> {
    const cuo = await this.cuoRepository.findOne({
      where: { id },
      relations: ['contrato', 'actividades']
    });

    if (!cuo) {
      throw new NotFoundException('CUO no encontrado');
    }

    // Verificar acceso al contrato
    await PermissionUtils.verificarAccesoContratoById(
      cuo.contratoId,
      usuarioCedula,
      usuarioRol,
      this.contratoRepository
    );

    return this.toResponseDto(cuo);
  }

  /**
   * Actualiza un CUO
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
      relations: ['contrato', 'actividades']
    });

    if (!cuo) {
      throw new NotFoundException('CUO no encontrado');
    }

    // Verificar acceso al contrato actual
    await PermissionUtils.verificarAccesoContratoById(
      cuo.contratoId,
      usuarioCedula,
      usuarioRol,
      this.contratoRepository
    );

    // Si se está cambiando el contrato, verificar acceso al nuevo contrato
    if (updateCuoDto.contratoId && updateCuoDto.contratoId !== cuo.contratoId) {
      await PermissionUtils.verificarAccesoContratoById(
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
   */
  async remove(id: number, usuarioCedula: string, usuarioRol: RolUsuario): Promise<void> {
    // Verificar permiso de eliminación
    PermissionUtils.verificarPermisoEliminacion(usuarioRol);

    const cuo = await this.cuoRepository.findOne({
      where: { id },
      relations: ['contrato']
    });

    if (!cuo) {
      throw new NotFoundException('CUO no encontrado');
    }

    // Verificar acceso al contrato
    await PermissionUtils.verificarAccesoContratoById(
      cuo.contratoId,
      usuarioCedula,
      usuarioRol,
      this.contratoRepository
    );

    await this.cuoRepository.remove(cuo);
  }

  /**
   * Obtiene todos los CUO de un contrato
   */
  async findByContrato(
    contratoId: number,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<CuoResponseDto[]> {
    // Verificar acceso al contrato
    await PermissionUtils.verificarAccesoContratoById(
      contratoId,
      usuarioCedula,
      usuarioRol,
      this.contratoRepository
    );

    const cuos = await this.cuoRepository.find({
      where: { contratoId },
      relations: ['contrato', 'actividades'],
      order: {
        id: 'ASC'
      }
    });

    return cuos.map(cuo => this.toResponseDto(cuo));
  }
} 