import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
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
   * Determina el estado del avance basado en la diferencia entre avance físico y financiero
   * @param diferenciaAvance Diferencia entre porcentaje físico y financiero
   * @returns Estado del avance: ATRASADO, NORMAL o ADELANTADO
   */
  private determinarEstadoAvance(diferenciaAvance: number): string {
    if (diferenciaAvance < -5) return 'ATRASADO';
    if (diferenciaAvance > 5) return 'ADELANTADO';
    return 'NORMAL';
  }

  /**
   * Calcula el porcentaje de avance financiero
   * @param valorEjecutado Valor ejecutado del contrato
   * @param valorTotal Valor total del contrato
   * @returns Porcentaje de avance financiero
   */
  private calcularPorcentajeFinanciero(valorEjecutado: number, valorTotal: number): number {
    if (!valorTotal || valorTotal <= 0) {
      throw new BadRequestException('El valor total del contrato debe ser mayor a 0');
    }
    return (valorEjecutado / valorTotal) * 100;
  }

  /**
   * Valida los valores de avance
   * @throws BadRequestException si los valores no son válidos
   */
  private validarValores(valorEjecutado: number, avanceFisico: number, valorTotal: number): void {
    // Validar valor ejecutado
    if (isNaN(valorEjecutado) || valorEjecutado < 0) {
      throw new BadRequestException('El valor ejecutado debe ser un número positivo');
    }

    // Validar que el valor ejecutado no supere el valor total
    if (valorEjecutado > valorTotal) {
      throw new BadRequestException(
        `El valor ejecutado (${valorEjecutado.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}) ` +
        `no puede superar el valor total del contrato (${valorTotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })})`
      );
    }

    // Validar avance físico
    if (isNaN(avanceFisico) || avanceFisico < 0 || avanceFisico > 100) {
      throw new BadRequestException('El porcentaje de avance físico debe estar entre 0 y 100');
    }
  }

  /**
   * Transforma una entidad SeguimientoGeneral en un DTO de respuesta
   * @throws NotFoundException si el seguimiento es nulo
   */
  private toResponseDto(seguimiento: SeguimientoGeneral): SeguimientoGeneralResponseDto {
    if (!seguimiento) {
      throw new NotFoundException('No se puede convertir un seguimiento nulo a DTO');
    }

    const { contrato, ...seguimientoData } = seguimiento;

    if (!contrato) {
      throw new NotFoundException('No se encontró el contrato asociado al seguimiento');
    }

    // Asegurar que los valores sean números
    const valorEjecutado = Number(seguimiento.avanceFinanciero);
    const valorTotal = Number(contrato.valorTotal);
    const avanceFisico = Number(seguimiento.avanceFisico);

    // Calcular el porcentaje de avance financiero
    const avanceFinanciero = this.calcularPorcentajeFinanciero(valorEjecutado, valorTotal);

    // Calcular la diferencia entre avance físico y financiero
    const diferenciaAvance = Number((avanceFisico - avanceFinanciero).toFixed(2));

    // Calcular el estado del avance
    const estadoAvance = this.determinarEstadoAvance(diferenciaAvance);

    return {
      ...seguimientoData,
      valorEjecutado: valorEjecutado,
      avanceFinanciero: Number(avanceFinanciero.toFixed(2)),
      avanceFisico: Number(avanceFisico.toFixed(2)),
      contrato: {
        numeroContrato: contrato.numeroContrato,
        identificadorSimple: contrato.identificadorSimple,
        objeto: contrato.objeto,
        valorTotal: contrato.valorTotal,
        fechaTerminacionActual: contrato.fechaTerminacionActual,
        estado: contrato.estado
      },
      diferenciaAvance,
      estadoAvance,
      fechaUltimaModificacion: seguimiento.createdAt,
      resumenEstado: `${estadoAvance}: Avance físico ${avanceFisico.toFixed(2)}% vs. financiero ${avanceFinanciero.toFixed(2)}% ` +
        `(diferencia: ${diferenciaAvance > 0 ? '+' : ''}${diferenciaAvance}%). ` +
        `Valor ejecutado: ${valorEjecutado.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })} ` +
        `de ${valorTotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}`
    };
  }

  /**
   * Crea un nuevo seguimiento general
   * @throws ForbiddenException si el usuario no tiene permisos de creación
   * @throws BadRequestException si los valores no son válidos
   * @throws NotFoundException si el contrato no existe
   */
  async create(
    createSeguimientoGeneralDto: CreateSeguimientoGeneralDto,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<SeguimientoGeneralResponseDto> {
    // Verificar permiso de creación (solo ADMIN)
    PermissionUtils.verificarPermisoCreacion(usuarioRol);

    // Buscar el contrato y verificar acceso
    const contrato = await this.contratoRepository.findOne({
      where: { id: createSeguimientoGeneralDto.contratoId }
    });

    if (!contrato) {
      throw new NotFoundException(`No se encontró el contrato con ID ${createSeguimientoGeneralDto.contratoId}`);
    }

    await PermissionUtils.verificarAccesoContratoById(
      createSeguimientoGeneralDto.contratoId,
      usuarioCedula,
      usuarioRol,
      this.contratoRepository
    );

    // Validar los valores
    this.validarValores(
      createSeguimientoGeneralDto.avanceFinanciero,
      createSeguimientoGeneralDto.avanceFisico,
      contrato.valorTotal
    );

    const seguimiento = this.seguimientoGeneralRepository.create({
      ...createSeguimientoGeneralDto,
      avanceFinanciero: Number(createSeguimientoGeneralDto.avanceFinanciero),
      avanceFisico: Number(createSeguimientoGeneralDto.avanceFisico)
    });

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
   * @throws ForbiddenException si el usuario no tiene acceso al contrato
   * @throws NotFoundException si no se encuentran seguimientos
   */
  async findByContrato(
    contratoId: number,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<SeguimientoGeneralResponseDto[]> {
    // Verificar acceso al contrato
    await PermissionUtils.verificarAccesoContratoById(
      contratoId,
      usuarioCedula,
      usuarioRol,
      this.contratoRepository
    );

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
   * @throws ForbiddenException si el usuario no tiene acceso al contrato
   * @throws NotFoundException si no se encuentra el contrato o los seguimientos
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
    await PermissionUtils.verificarAccesoContratoById(
      contrato.id,
      usuarioCedula,
      usuarioRol,
      this.contratoRepository
    );

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
   * @throws ForbiddenException si el usuario no tiene acceso al contrato
   * @throws NotFoundException si no se encuentra el seguimiento
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
    await PermissionUtils.verificarAccesoContratoById(
      seguimiento.contratoId,
      usuarioCedula,
      usuarioRol,
      this.contratoRepository
    );

    return this.toResponseDto(seguimiento);
  }
} 