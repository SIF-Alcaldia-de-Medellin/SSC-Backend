import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Modificacion, TipoModificacion } from './modificacion.entity';
import { Contrato } from '../contratos/contrato.entity';
import { CreateModificacionDto } from './dto/create-modificacion.dto';
import { ModificacionResponseDto } from './dto/modificacion.response.dto';
import { RolUsuario } from '../usuarios/usuario.entity';
import { PermissionUtils } from '../auth/utils/permission.utils';
import { differenceInDays, addDays } from 'date-fns';

interface RequestUser {
  cedula: string;
  rol: RolUsuario;
}

/**
 * Servicio para la gestión de modificaciones contractuales
 */
@Injectable()
export class ModificacionesService {
  constructor(
    @InjectRepository(Modificacion)
    private readonly modificacionRepository: Repository<Modificacion>,
    @InjectRepository(Contrato)
    private readonly contratoRepository: Repository<Contrato>,
    private dataSource: DataSource
  ) {}

  /**
   * Calcula la duración en días entre dos fechas
   */
  private calcularDuracion(fechaInicio: Date, fechaFinal: Date): number {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFinal);
    return differenceInDays(fin, inicio) + 1; // +1 porque el día final también cuenta
  }

  /**
   * Verifica si hay superposición de fechas con suspensiones existentes
   */
  private async verificarSuperposicionSuspensiones(
    contratoId: number,
    fechaInicio: Date,
    fechaFinal: Date,
    modificacionId?: number
  ): Promise<void> {
    const queryBuilder = this.modificacionRepository
      .createQueryBuilder('modificacion')
      .where('modificacion.contratoId = :contratoId', { contratoId })
      .andWhere('modificacion.tipo = :tipo', { tipo: TipoModificacion.SUSPENSION })
      .andWhere(
        '((:fechaInicio BETWEEN modificacion.fechaInicio AND modificacion.fechaFinal) OR ' +
        '(:fechaFinal BETWEEN modificacion.fechaInicio AND modificacion.fechaFinal) OR ' +
        '(modificacion.fechaInicio BETWEEN :fechaInicio AND :fechaFinal) OR ' +
        '(modificacion.fechaFinal BETWEEN :fechaInicio AND :fechaFinal))',
        { fechaInicio, fechaFinal }
      );

    // Si es una actualización, excluir la modificación actual
    if (modificacionId) {
      queryBuilder.andWhere('modificacion.id != :modificacionId', { modificacionId });
    }

    const suspensionesSuperpuestas = await queryBuilder.getCount();

    if (suspensionesSuperpuestas > 0) {
      throw new BadRequestException(
        'El período de suspensión se superpone con otra suspensión existente'
      );
    }
  }

  /**
   * Actualiza la fecha de terminación del contrato según el tipo de modificación
   */
  private async actualizarFechaTerminacionContrato(
    contrato: Contrato,
    modificacion: Modificacion,
    duracion: number
  ): Promise<void> {
    // Tanto las suspensiones como las prórrogas afectan la fecha de terminación (extienden el plazo)
    if (modificacion.tipo === TipoModificacion.SUSPENSION || modificacion.tipo === TipoModificacion.PRORROGA) {
      contrato.fechaTerminacionActual = addDays(new Date(contrato.fechaTerminacionActual), duracion);
    }
  }

  /**
   * Transforma una entidad Modificacion en un DTO de respuesta
   */
  private toResponseDto(modificacion: Modificacion): ModificacionResponseDto {
    const { contrato, ...modificacionData } = modificacion;
    return {
      ...modificacionData,
      contrato: contrato ? {
        numeroContrato: contrato.numeroContrato,
        identificadorSimple: contrato.identificadorSimple,
        objeto: contrato.objeto,
        fechaTerminacionActual: contrato.fechaTerminacionActual
      } : undefined
    };
  }

  /**
   * Valida las fechas de la modificación
   */
  private validarFechas(fechaInicio: Date, fechaFinal: Date): void {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFinal);

    if (inicio > fin) {
      throw new BadRequestException('La fecha de inicio no puede ser posterior a la fecha final');
    }
  }

  /**
   * Crea una nueva modificación contractual
   */
  async create(createModificacionDto: CreateModificacionDto, user: RequestUser): Promise<ModificacionResponseDto> {
    // Verificar permiso de creación
    PermissionUtils.verificarPermisoCreacion(user.rol);

    // Verificar acceso al contrato
    await PermissionUtils.verificarAccesoContratoById(
      createModificacionDto.contratoId,
      user.cedula,
      user.rol,
      this.contratoRepository
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validar fechas
      this.validarFechas(createModificacionDto.fechaInicio, createModificacionDto.fechaFinal);

      // Si es una suspensión, verificar superposición con otras suspensiones
      if (createModificacionDto.tipo === TipoModificacion.SUSPENSION) {
        await this.verificarSuperposicionSuspensiones(
          createModificacionDto.contratoId,
          createModificacionDto.fechaInicio,
          createModificacionDto.fechaFinal
        );
      }

      // Calcular duración
      const duracion = this.calcularDuracion(
        createModificacionDto.fechaInicio,
        createModificacionDto.fechaFinal
      );

      // Crear la modificación con la duración calculada
      const modificacion = this.modificacionRepository.create({
        contratoId: createModificacionDto.contratoId,
        tipo: createModificacionDto.tipo,
        fechaInicio: createModificacionDto.fechaInicio,
        fechaFinal: createModificacionDto.fechaFinal,
        observaciones: createModificacionDto.observaciones,
        duracion
      });

      const savedModificacion = await queryRunner.manager.save(Modificacion, modificacion);

      // Obtener y actualizar el contrato
      const contrato = await queryRunner.manager.findOne(Contrato, {
        where: { id: createModificacionDto.contratoId }
      });

      if (!contrato) {
        throw new NotFoundException(`No se encontró el contrato con ID ${createModificacionDto.contratoId}`);
      }

      // Actualizar la fecha de terminación del contrato según el tipo de modificación
      await this.actualizarFechaTerminacionContrato(contrato, modificacion, duracion);
      await queryRunner.manager.save(Contrato, contrato);

      await queryRunner.commitTransaction();

      // Cargar la modificación completa con sus relaciones
      const modificacionCompleta = await this.modificacionRepository.findOne({
        where: { id: savedModificacion.id },
        relations: ['contrato']
      });

      if (!modificacionCompleta) {
        throw new NotFoundException(`No se pudo cargar la modificación creada con ID ${savedModificacion.id}`);
      }

      return this.toResponseDto(modificacionCompleta);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Obtiene todas las modificaciones según los permisos del usuario
   */
  async findAll(user: RequestUser): Promise<ModificacionResponseDto[]> {
    // Verificar permiso de visualización
    PermissionUtils.verificarPermisoVisualizacion(user.rol);

    if (user.rol === RolUsuario.ADMIN) {
      const modificaciones = await this.modificacionRepository.find({
        relations: ['contrato'],
        order: {
          createdAt: 'DESC'
        }
      });
      return modificaciones.map(modificacion => this.toResponseDto(modificacion));
    }

    // Para supervisores, solo retornar las modificaciones de sus contratos
    const modificaciones = await this.modificacionRepository
      .createQueryBuilder('modificacion')
      .leftJoinAndSelect('modificacion.contrato', 'contrato')
      .where('contrato.usuarioCedula = :usuarioCedula', { usuarioCedula: user.cedula })
      .orderBy('modificacion.createdAt', 'DESC')
      .getMany();

    return modificaciones.map(modificacion => this.toResponseDto(modificacion));
  }

  /**
   * Obtiene una modificación por su ID
   */
  async findOne(id: number, user: RequestUser): Promise<ModificacionResponseDto> {
    // Verificar permiso de visualización
    PermissionUtils.verificarPermisoVisualizacion(user.rol);

    const modificacion = await this.modificacionRepository.findOne({
      where: { id },
      relations: ['contrato']
    });

    if (!modificacion) {
      throw new NotFoundException('Modificación no encontrada');
    }

    // Verificar acceso al contrato
    if (!PermissionUtils.verificarAccesoContrato(user.cedula, user.rol, modificacion.contrato)) {
      throw new ForbiddenException('No tiene acceso a esta modificación');
    }

    return this.toResponseDto(modificacion);
  }

  /**
   * Actualiza una modificación
   */
  async update(id: number, updateModificacionDto: Partial<CreateModificacionDto>, user: RequestUser): Promise<ModificacionResponseDto> {
    // Verificar permiso de actualización
    PermissionUtils.verificarPermisoActualizacion(user.rol);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const modificacion = await queryRunner.manager.findOne(Modificacion, {
        where: { id },
        relations: ['contrato']
      });

      if (!modificacion) {
        throw new NotFoundException('Modificación no encontrada');
      }

      // Verificar acceso al contrato
      if (!PermissionUtils.verificarAccesoContrato(user.cedula, user.rol, modificacion.contrato)) {
        throw new ForbiddenException('No tiene acceso a esta modificación');
      }

      // Si se están actualizando las fechas, recalcular la duración
      if (updateModificacionDto.fechaInicio || updateModificacionDto.fechaFinal) {
        const fechaInicio = updateModificacionDto.fechaInicio || modificacion.fechaInicio;
        const fechaFinal = updateModificacionDto.fechaFinal || modificacion.fechaFinal;
        
        this.validarFechas(fechaInicio, fechaFinal);

        // Si es una suspensión, verificar superposición con otras suspensiones
        if (modificacion.tipo === TipoModificacion.SUSPENSION) {
          await this.verificarSuperposicionSuspensiones(
            modificacion.contratoId,
            fechaInicio,
            fechaFinal,
            modificacion.id
          );
        }
        
        const duracionAnterior = modificacion.duracion;
        const nuevaDuracion = this.calcularDuracion(fechaInicio, fechaFinal);
        
        // Actualizar la modificación con las nuevas fechas y duración
        Object.assign(modificacion, {
          ...updateModificacionDto,
          duracion: nuevaDuracion
        });

        // Si es una suspensión o prórroga, actualizar la fecha de terminación del contrato
        if (modificacion.tipo === TipoModificacion.SUSPENSION || modificacion.tipo === TipoModificacion.PRORROGA) {
          const contrato = await queryRunner.manager.findOne(Contrato, {
            where: { id: modificacion.contratoId }
          });

          if (!contrato) {
            throw new NotFoundException(`No se encontró el contrato con ID ${modificacion.contratoId}`);
          }

          // Restar la duración anterior y sumar la nueva
          contrato.fechaTerminacionActual = addDays(
            addDays(new Date(contrato.fechaTerminacionActual), -duracionAnterior),
            nuevaDuracion
          );
          await queryRunner.manager.save(contrato);
        }
      } else {
        Object.assign(modificacion, updateModificacionDto);
      }

      const updatedModificacion = await queryRunner.manager.save(modificacion);
      await queryRunner.commitTransaction();

      return this.toResponseDto(updatedModificacion);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Elimina una modificación
   */
  async remove(id: number, user: RequestUser): Promise<void> {
    // Solo los administradores pueden eliminar modificaciones
    if (user.rol !== RolUsuario.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden eliminar modificaciones');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const modificacion = await queryRunner.manager.findOne(Modificacion, {
        where: { id },
        relations: ['contrato']
      });

      if (!modificacion) {
        throw new NotFoundException('Modificación no encontrada');
      }

      // Si es una suspensión o prórroga, actualizar la fecha de terminación del contrato
      if (modificacion.tipo === TipoModificacion.SUSPENSION || modificacion.tipo === TipoModificacion.PRORROGA) {
        const contrato = await queryRunner.manager.findOne(Contrato, {
          where: { id: modificacion.contratoId }
        });

        if (!contrato) {
          throw new NotFoundException(`No se encontró el contrato con ID ${modificacion.contratoId}`);
        }

        // Restar la duración de la modificación
        contrato.fechaTerminacionActual = addDays(
          new Date(contrato.fechaTerminacionActual),
          -modificacion.duracion
        );
        await queryRunner.manager.save(contrato);
      }

      await queryRunner.manager.remove(modificacion);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Obtiene todas las modificaciones de un contrato
   */
  async findByContrato(contratoId: number, user: RequestUser): Promise<ModificacionResponseDto[]> {
    // Verificar acceso al contrato
    await PermissionUtils.verificarAccesoContratoById(
      contratoId,
      user.cedula,
      user.rol,
      this.contratoRepository
    );

    const modificaciones = await this.modificacionRepository.find({
      where: { contratoId },
      relations: ['contrato'],
      order: {
        createdAt: 'DESC'
      }
    });
    return modificaciones.map(modificacion => this.toResponseDto(modificacion));
  }
} 