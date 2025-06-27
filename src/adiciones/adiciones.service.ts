import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Adicion } from './adicion.entity';
import { Contrato } from '../contratos/contrato.entity';
import { CreateAdicionDto } from './dto/create-adicion.dto';
import { AdicionResponseDto } from './dto/adicion.response.dto';
import { RolUsuario } from '../usuarios/usuario.entity';
import { PermissionUtils } from '../auth/utils/permission.utils';

interface RequestUser {
  cedula: string;
  rol: RolUsuario;
}

/**
 * Servicio para la gestión de adiciones presupuestales
 */
@Injectable()
export class AdicionesService {
  constructor(
    @InjectRepository(Adicion)
    private readonly adicionRepository: Repository<Adicion>,
    @InjectRepository(Contrato)
    private readonly contratoRepository: Repository<Contrato>,
    private dataSource: DataSource
  ) {}

  /**
   * Transforma una entidad Adicion en un DTO de respuesta
   */
  private toResponseDto(adicion: Adicion): AdicionResponseDto {
    const { contrato, ...adicionData } = adicion;
    return {
      ...adicionData,
      contrato: contrato ? {
        numeroContrato: contrato.numeroContrato,
        identificadorSimple: contrato.identificadorSimple,
        objeto: contrato.objeto,
        valorTotal: contrato.valorTotal
      } : undefined
    };
  }

  /**
   * Crea una nueva adición presupuestal y actualiza el valor total del contrato
   */
  async create(createAdicionDto: CreateAdicionDto, user: RequestUser): Promise<AdicionResponseDto> {
    // Verificar permiso de creación
    PermissionUtils.verificarPermisoCreacion(user.rol);

    // Verificar acceso al contrato
    await PermissionUtils.verificarAccesoContratoById(
      createAdicionDto.contratoId,
      user.cedula,
      user.rol,
      this.contratoRepository
    );

    // Usar transacción para asegurar la consistencia de los datos
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Crear la adición
      const adicion = this.adicionRepository.create(createAdicionDto);
      const savedAdicion = await queryRunner.manager.save(adicion);

      // Actualizar el valor total del contrato
      const contrato = await queryRunner.manager.findOne(Contrato, {
        where: { id: createAdicionDto.contratoId }
      });

      if (!contrato) {
        throw new NotFoundException(`No se encontró el contrato con ID ${createAdicionDto.contratoId}`);
      }

      contrato.valorTotal = Number(contrato.valorTotal) + Number(createAdicionDto.valorAdicion);
      await queryRunner.manager.save(contrato);

      // Confirmar la transacción
      await queryRunner.commitTransaction();

      // Cargar la adición con sus relaciones para el DTO
      const adicionCompleta = await this.adicionRepository.findOne({
        where: { id: savedAdicion.id },
        relations: ['contrato']
      });

      if (!adicionCompleta) {
        throw new NotFoundException(`No se pudo cargar la adición creada con ID ${savedAdicion.id}`);
      }

      return this.toResponseDto(adicionCompleta);
    } catch (error) {
      // Revertir cambios si hay error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Liberar el queryRunner
      await queryRunner.release();
    }
  }

  /**
   * Obtiene todas las adiciones según los permisos del usuario
   */
  async findAll(user: RequestUser): Promise<AdicionResponseDto[]> {
    // Verificar permiso de visualización
    PermissionUtils.verificarPermisoVisualizacion(user.rol);

    if (user.rol === RolUsuario.ADMIN) {
      const adiciones = await this.adicionRepository.find({
        relations: ['contrato']
      });
      return adiciones.map(adicion => this.toResponseDto(adicion));
    }

    // Para supervisores, solo retornar las adiciones de sus contratos
    const adiciones = await this.adicionRepository
      .createQueryBuilder('adicion')
      .leftJoinAndSelect('adicion.contrato', 'contrato')
      .where('contrato.usuarioCedula = :usuarioCedula', { usuarioCedula: user.cedula })
      .orderBy('adicion.createdAt', 'DESC')
      .getMany();

    return adiciones.map(adicion => this.toResponseDto(adicion));
  }

  /**
   * Obtiene una adición por su ID
   */
  async findOne(id: number, user: RequestUser): Promise<AdicionResponseDto> {
    // Verificar permiso de visualización
    PermissionUtils.verificarPermisoVisualizacion(user.rol);

    const adicion = await this.adicionRepository.findOne({
      where: { id },
      relations: ['contrato']
    });

    if (!adicion) {
      throw new NotFoundException('Adición no encontrada');
    }

    // Verificar acceso al contrato
    if (!PermissionUtils.verificarAccesoContrato(user.cedula, user.rol, adicion.contrato)) {
      throw new ForbiddenException('No tiene acceso a esta adición');
    }

    return this.toResponseDto(adicion);
  }

  /**
   * Actualiza una adición
   */
  async update(id: number, updateAdicionDto: Partial<CreateAdicionDto>, user: RequestUser): Promise<AdicionResponseDto> {
    // Verificar permiso de actualización
    PermissionUtils.verificarPermisoActualizacion(user.rol);

    // Si se está actualizando el valor de la adición, necesitamos una transacción
    if (updateAdicionDto.valorAdicion !== undefined) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const adicion = await queryRunner.manager.findOne(Adicion, {
          where: { id },
          relations: ['contrato']
        });

        if (!adicion) {
          throw new NotFoundException('Adición no encontrada');
        }

        // Verificar acceso al contrato
        if (!PermissionUtils.verificarAccesoContrato(user.cedula, user.rol, adicion.contrato)) {
          throw new ForbiddenException('No tiene acceso a esta adición');
        }

        // Calcular la diferencia en el valor
        const diferencia = Number(updateAdicionDto.valorAdicion) - Number(adicion.valorAdicion);

        // Actualizar la adición
        Object.assign(adicion, updateAdicionDto);
        await queryRunner.manager.save(adicion);

        // Actualizar el valor total del contrato
        const contrato = await queryRunner.manager.findOne(Contrato, {
          where: { id: adicion.contratoId }
        });

        if (!contrato) {
          throw new NotFoundException(`No se encontró el contrato con ID ${adicion.contratoId}`);
        }

        contrato.valorTotal = Number(contrato.valorTotal) + diferencia;
        await queryRunner.manager.save(contrato);

        await queryRunner.commitTransaction();

        // Cargar la adición actualizada con sus relaciones
        const adicionActualizada = await this.adicionRepository.findOne({
          where: { id },
          relations: ['contrato']
        });

        if (!adicionActualizada) {
          throw new NotFoundException(`No se pudo cargar la adición actualizada con ID ${id}`);
        }

        return this.toResponseDto(adicionActualizada);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    }

    // Si no se está actualizando el valor, proceder normalmente
    const adicion = await this.adicionRepository.findOne({ 
      where: { id },
      relations: ['contrato']
    });

    if (!adicion) {
      throw new NotFoundException('Adición no encontrada');
    }

    // Verificar acceso al contrato
    if (!PermissionUtils.verificarAccesoContrato(user.cedula, user.rol, adicion.contrato)) {
      throw new ForbiddenException('No tiene acceso a esta adición');
    }

    Object.assign(adicion, updateAdicionDto);
    const updatedAdicion = await this.adicionRepository.save(adicion);
    return this.toResponseDto(updatedAdicion);
  }

  /**
   * Elimina una adición y actualiza el valor total del contrato
   */
  async remove(id: number, user: RequestUser): Promise<void> {
    // Solo los administradores pueden eliminar adiciones
    if (user.rol !== RolUsuario.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden eliminar adiciones');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const adicion = await queryRunner.manager.findOne(Adicion, {
        where: { id },
        relations: ['contrato']
      });

      if (!adicion) {
        throw new NotFoundException('Adición no encontrada');
      }

      // Actualizar el valor total del contrato antes de eliminar la adición
      const contrato = await queryRunner.manager.findOne(Contrato, {
        where: { id: adicion.contratoId }
      });

      if (!contrato) {
        throw new NotFoundException(`No se encontró el contrato con ID ${adicion.contratoId}`);
      }

      contrato.valorTotal = Number(contrato.valorTotal) - Number(adicion.valorAdicion);
      await queryRunner.manager.save(contrato);

      // Eliminar la adición
      await queryRunner.manager.remove(adicion);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Obtiene todas las adiciones de un contrato
   */
  async findByContrato(contratoId: number, user: RequestUser): Promise<AdicionResponseDto[]> {
    // Verificar acceso al contrato
    await PermissionUtils.verificarAccesoContratoById(
      contratoId,
      user.cedula,
      user.rol,
      this.contratoRepository
    );

    const adiciones = await this.adicionRepository.find({
      where: { contratoId },
      relations: ['contrato'],
      order: {
        createdAt: 'DESC'
      }
    });
    return adiciones.map(adicion => this.toResponseDto(adicion));
  }
} 