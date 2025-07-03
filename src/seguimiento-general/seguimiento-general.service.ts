import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
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
  private async toResponseDto(seguimiento: SeguimientoGeneral): Promise<SeguimientoGeneralResponseDto> {
    if (!seguimiento) {
      throw new NotFoundException('No se puede convertir un seguimiento nulo a DTO');
    }

    const { contrato, ...seguimientoData } = seguimiento;

    if (!contrato) {
      throw new NotFoundException('No se encontró el contrato asociado al seguimiento');
    }

    // Valores individuales del seguimiento actual
    const valorEjecutadoIndividual = Number(seguimiento.avanceFinanciero);
    const avanceFisicoIndividual = Number(seguimiento.avanceFisico);
    const valorTotal = Number(contrato.valorTotal);

    // Calcular valores acumulados incluyendo este seguimiento
    const valorEjecutadoAcumulado = await this.calcularValorEjecutadoAcumulado(
      seguimiento.contratoId,
      seguimiento.createdAt,
      seguimiento
    );

    const avanceFisicoAcumulado = await this.calcularAvanceFisicoAcumulado(
      seguimiento.contratoId,
      seguimiento.createdAt,
      seguimiento
    );

    // Calcular porcentajes basados en valores acumulados
    const porcentajeFinanciero = this.calcularPorcentajeFinanciero(valorEjecutadoAcumulado, valorTotal);
    
    // Para avance físico asumimos que 100% es la meta (se podría parametrizar si se necesita)
    const porcentajeFisico = avanceFisicoAcumulado; // Ya viene como porcentaje

    // Calcular la diferencia entre avance físico y financiero
    const diferenciaAvance = Number((porcentajeFisico - porcentajeFinanciero).toFixed(2));

    // Calcular el estado del avance
    const estadoAvance = this.determinarEstadoAvance(diferenciaAvance);

    return {
      ...seguimientoData,
      // Valores individuales de este seguimiento
      valorEjecutadoIndividual: valorEjecutadoIndividual,
      avanceFisicoIndividual: avanceFisicoIndividual,
      // Valores acumulados hasta esta fecha
      valorEjecutado: valorEjecutadoAcumulado,
      avanceFinanciero: Number(porcentajeFinanciero.toFixed(2)),
      avanceFisico: Number(porcentajeFisico.toFixed(2)),
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
      resumenEstado: `${estadoAvance}: Avance físico ${porcentajeFisico.toFixed(2)}% vs. financiero ${porcentajeFinanciero.toFixed(2)}% ` +
        `(diferencia: ${diferenciaAvance > 0 ? '+' : ''}${diferenciaAvance}%). ` +
        `Valor ejecutado acumulado: ${valorEjecutadoAcumulado.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })} ` +
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

    // Validar que el avance físico acumulado no supere el 100%
    const avanceFisicoAcumuladoActual = await this.calcularAvanceFisicoAcumulado(
      createSeguimientoGeneralDto.contratoId
    );
    
    const nuevoAvanceFisicoAcumulado = avanceFisicoAcumuladoActual + Number(createSeguimientoGeneralDto.avanceFisico);
    
    if (nuevoAvanceFisicoAcumulado > 100) {
      throw new BadRequestException(
        `El avance físico acumulado no puede superar el 100%. ` +
        `Avance actual: ${avanceFisicoAcumuladoActual.toFixed(2)}%, ` +
        `Nuevo avance: ${Number(createSeguimientoGeneralDto.avanceFisico).toFixed(2)}%, ` +
        `Total resultante: ${nuevoAvanceFisicoAcumulado.toFixed(2)}%. ` +
        `Máximo permitido: ${(100 - avanceFisicoAcumuladoActual).toFixed(2)}%`
      );
    }

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

    return await this.toResponseDto(seguimientoConContrato);
  }

  /**
   * Calcula el valor ejecutado acumulado hasta un seguimiento específico
   * @param contratoId ID del contrato
   * @param fechaLimite Fecha límite para el cálculo (opcional)
   * @param seguimientoActual Seguimiento actual para incluir en el cálculo (opcional)
   */
  private async calcularValorEjecutadoAcumulado(
    contratoId: number,
    fechaLimite?: Date,
    seguimientoActual?: SeguimientoGeneral
  ): Promise<number> {
    const seguimientosAnteriores = await this.seguimientoGeneralRepository.find({
      where: {
        contratoId,
        ...(fechaLimite && { createdAt: LessThanOrEqual(fechaLimite) })
      },
      order: {
        createdAt: 'ASC'
      }
    });

    // Sumar todos los valores ejecutados anteriores
    const valorTotal = seguimientosAnteriores.reduce((sum, seg) => {
      const valor = typeof seg.avanceFinanciero === 'string' ? 
        parseFloat(seg.avanceFinanciero) : 
        Number(seg.avanceFinanciero);
      return sum + (isNaN(valor) ? 0 : valor);
    }, 0);

    // Si hay un seguimiento actual, incluirlo en el cálculo
    if (seguimientoActual) {
      const valorActual = typeof seguimientoActual.avanceFinanciero === 'string' ?
        parseFloat(seguimientoActual.avanceFinanciero) :
        Number(seguimientoActual.avanceFinanciero);
      return valorTotal + (isNaN(valorActual) ? 0 : valorActual);
    }

    return valorTotal;
  }

  /**
   * Calcula el avance físico acumulado hasta un seguimiento específico
   * @param contratoId ID del contrato
   * @param fechaLimite Fecha límite para el cálculo (opcional)
   * @param seguimientoActual Seguimiento actual para incluir en el cálculo (opcional)
   */
  private async calcularAvanceFisicoAcumulado(
    contratoId: number,
    fechaLimite?: Date,
    seguimientoActual?: SeguimientoGeneral
  ): Promise<number> {
    const seguimientosAnteriores = await this.seguimientoGeneralRepository.find({
      where: {
        contratoId,
        ...(fechaLimite && { createdAt: LessThanOrEqual(fechaLimite) })
      },
      order: {
        createdAt: 'ASC'
      }
    });

    // Sumar todos los avances físicos anteriores
    const avanceTotal = seguimientosAnteriores.reduce((sum, seg) => {
      const avance = typeof seg.avanceFisico === 'string' ? 
        parseFloat(seg.avanceFisico) : 
        Number(seg.avanceFisico);
      return sum + (isNaN(avance) ? 0 : avance);
    }, 0);

    // Si hay un seguimiento actual, incluirlo en el cálculo
    if (seguimientoActual) {
      const avanceActual = typeof seguimientoActual.avanceFisico === 'string' ?
        parseFloat(seguimientoActual.avanceFisico) :
        Number(seguimientoActual.avanceFisico);
      return avanceTotal + (isNaN(avanceActual) ? 0 : avanceActual);
    }

    return avanceTotal;
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
      order: { createdAt: 'ASC' }, // Ordenar ascendente para calcular acumulados
      relations: ['contrato']
    });

    if (!seguimientos.length) {
      throw new NotFoundException(`No se encontraron seguimientos para el contrato ${contratoId}`);
    }

    // Convertir cada seguimiento a DTO con valores acumulados
    const seguimientosResponse = await Promise.all(
      seguimientos.map(seguimiento => this.toResponseDto(seguimiento))
    );
    
    return seguimientosResponse.reverse(); // Mostrar el más reciente primero
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
      .orderBy('seguimiento.createdAt', 'ASC') // Ordenar ascendente para calcular acumulados
      .getMany();

    if (!seguimientos.length) {
      throw new NotFoundException(`No se encontraron seguimientos para el contrato número ${numeroContrato}`);
    }

    // Convertir cada seguimiento a DTO con valores acumulados
    const seguimientosResponse = await Promise.all(
      seguimientos.map(seguimiento => this.toResponseDto(seguimiento))
    );
    
    return seguimientosResponse.reverse(); // Mostrar el más reciente primero
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

    return await this.toResponseDto(seguimiento);
  }


} 