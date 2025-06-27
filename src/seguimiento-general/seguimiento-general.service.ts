import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeguimientoGeneral } from './seguimiento-general.entity';
import { Contrato } from '../contratos/contrato.entity';
import { CreateSeguimientoGeneralDto } from './dto/create-seguimiento-general.dto';
import { SeguimientoGeneralResponseDto } from './dto/seguimiento-general.response.dto';
import { RolUsuario } from '../usuarios/usuario.entity';
import { PermissionUtils } from '../auth/utils/permission.utils';

@Injectable()
export class SeguimientoGeneralService {
  constructor(
    @InjectRepository(SeguimientoGeneral)
    private readonly seguimientoGeneralRepository: Repository<SeguimientoGeneral>,
    @InjectRepository(Contrato)
    private readonly contratoRepository: Repository<Contrato>
  ) {}

  /**
   * Verifica si un usuario tiene acceso a un contrato
   */
  private async verificarAccesoContrato(
    contratoId: number,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<void> {
    await PermissionUtils.verificarAccesoEntidad(
      contratoId,
      usuarioCedula,
      usuarioRol,
      this.contratoRepository
    );
  }

  /**
   * Determina el estado del avance basado en la diferencia entre avance físico y financiero
   */
  private determinarEstadoAvance(diferenciaAvance: number): string {
    if (diferenciaAvance < -5) return 'ATRASADO';
    if (diferenciaAvance > 5) return 'ADELANTADO';
    return 'NORMAL';
  }

  /**
   * Transforma una entidad SeguimientoGeneral en un DTO de respuesta
   */
  private toResponseDto(seguimiento: SeguimientoGeneral): SeguimientoGeneralResponseDto {
    if (!seguimiento) {
      throw new NotFoundException('No se puede convertir un seguimiento nulo a DTO');
    }

    const { contrato, ...seguimientoData } = seguimiento;

    // Calcular la diferencia entre avance físico y financiero
    const diferenciaAvance = Number((seguimiento.avanceFisico - seguimiento.avanceFinanciero).toFixed(2));

    return {
      ...seguimientoData,
      contrato: contrato ? {
        numeroContrato: contrato.numeroContrato,
        identificadorSimple: contrato.identificadorSimple,
        objeto: contrato.objeto,
        valorTotal: contrato.valorTotal,
        fechaTerminacionActual: contrato.fechaTerminacionActual,
        estado: contrato.estado
      } : undefined,
      diferenciaAvance,
      estadoAvance: this.determinarEstadoAvance(diferenciaAvance)
    };
  }

  /**
   * Crea un nuevo seguimiento general
   */
  async create(
    createSeguimientoGeneralDto: CreateSeguimientoGeneralDto,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<SeguimientoGeneralResponseDto> {
    // Verificar permiso de creación
    PermissionUtils.verificarPermisoCreacion(usuarioRol);

    // Verificar acceso al contrato
    await this.verificarAccesoContrato(
      createSeguimientoGeneralDto.contratoId,
      usuarioCedula,
      usuarioRol
    );

    const seguimiento = this.seguimientoGeneralRepository.create(createSeguimientoGeneralDto);
    const savedSeguimiento = await this.seguimientoGeneralRepository.save(seguimiento);
    
    // Cargar la relación con contrato para el DTO de respuesta
    const seguimientoConContrato = await this.seguimientoGeneralRepository.findOne({
      where: { id: savedSeguimiento.id },
      relations: ['contrato']
    });

    if (!seguimientoConContrato) {
      throw new NotFoundException(`Error al cargar el seguimiento creado con ID ${savedSeguimiento.id}`);
    }

    return this.toResponseDto(seguimientoConContrato);
  }

  /**
   * Obtiene todos los seguimientos de un contrato específico por su ID
   */
  async findByContrato(
    contratoId: number,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<SeguimientoGeneralResponseDto[]> {
    // Verificar acceso al contrato
    await this.verificarAccesoContrato(contratoId, usuarioCedula, usuarioRol);

    const seguimientos = await this.seguimientoGeneralRepository.find({
      where: { contratoId },
      order: { createdAt: 'DESC' },
      relations: ['contrato']
    });

    if (!seguimientos.length) {
      throw new NotFoundException(`No se encontraron seguimientos para el contrato ${contratoId}`);
    }

    return seguimientos.map(seguimiento => this.toResponseDto(seguimiento));
  }

  /**
   * Obtiene todos los seguimientos de un contrato por su número de contrato
   */
  async findByNumeroContrato(
    numeroContrato: string,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<SeguimientoGeneralResponseDto[]> {
    // Primero buscamos el contrato por número
    const contrato = await this.contratoRepository.findOne({
      where: { numeroContrato }
    });

    if (!contrato) {
      throw new NotFoundException(`No se encontró el contrato con número ${numeroContrato}`);
    }

    // Verificar acceso al contrato
    await this.verificarAccesoContrato(contrato.id, usuarioCedula, usuarioRol);

    const seguimientos = await this.seguimientoGeneralRepository
      .createQueryBuilder('seguimiento')
      .innerJoinAndSelect('seguimiento.contrato', 'contrato')
      .where('contrato.numeroContrato = :numeroContrato', { numeroContrato })
      .orderBy('seguimiento.createdAt', 'DESC')
      .getMany();

    if (!seguimientos.length) {
      throw new NotFoundException(`No se encontraron seguimientos para el contrato número ${numeroContrato}`);
    }

    return seguimientos.map(seguimiento => this.toResponseDto(seguimiento));
  }

  /**
   * Obtiene un seguimiento específico por su ID
   */
  async findOne(
    id: number,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<SeguimientoGeneralResponseDto> {
    const seguimiento = await this.seguimientoGeneralRepository.findOne({
      where: { id },
      relations: ['contrato']
    });

    if (!seguimiento) {
      throw new NotFoundException(`No se encontró el seguimiento con ID ${id}`);
    }

    // Verificar acceso al contrato relacionado
    await this.verificarAccesoContrato(seguimiento.contratoId, usuarioCedula, usuarioRol);

    return this.toResponseDto(seguimiento);
  }
} 