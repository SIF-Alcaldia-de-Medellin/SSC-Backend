import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Adicion } from './adicion.entity';
import { Contrato } from '../contratos/contrato.entity';
import { CreateAdicionDto } from './dto/create-adicion.dto';
import { AdicionResponseDto } from './dto/adicion.response.dto';
import { RolUsuario } from '../usuarios/usuario.entity';

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
   * Verifica si un usuario tiene acceso a un contrato específico
   * @param user - Usuario que realiza la petición
   * @param contratoId - ID del contrato a verificar
   * @returns true si tiene acceso, false si no
   */
  private async hasAccessToContract(user: RequestUser, contratoId: number): Promise<boolean> {
    if (user.rol === RolUsuario.ADMIN || user.rol === RolUsuario.SUPERVISOR) {
      return true;
    }

    const contrato = await this.contratoRepository.findOne({
      where: { id: contratoId }
    });

    return contrato?.usuarioCedula === user.cedula;
  }

  /**
   * Verifica si un usuario tiene acceso a una adición específica
   * @param user - Usuario que realiza la petición
   * @param adicionId - ID de la adición a verificar
   * @returns true si tiene acceso, false si no
   */
  private async hasAccessToAdicion(user: RequestUser, adicionId: number): Promise<boolean> {
    if (user.rol === RolUsuario.ADMIN || user.rol === RolUsuario.SUPERVISOR) {
      return true;
    }

    const adicion = await this.adicionRepository.findOne({
      where: { id: adicionId },
      relations: ['contrato']
    });

    if (!adicion || !adicion.contrato) {
      return false;
    }

    return adicion.contrato.usuarioCedula === user.cedula;
  }

  /**
   * Transforma una entidad Adicion en un DTO de respuesta
   */
  private toResponseDto(adicion: Adicion): AdicionResponseDto {
    const { contrato, ...adicionData } = adicion;
    return adicionData as AdicionResponseDto;
  }

  /**
   * Actualiza el valor total del contrato
   * @param contratoId - ID del contrato
   * @param valorAdicion - Valor de la adición
   */
  private async actualizarValorTotalContrato(contratoId: number, valorAdicion: number): Promise<void> {
    const contrato = await this.contratoRepository.findOne({
      where: { id: contratoId }
    });

    if (!contrato) {
      throw new NotFoundException(`No se encontró el contrato con ID ${contratoId}`);
    }

    // Actualizar el valor total sumando la adición
    contrato.valorTotal = Number(contrato.valorTotal) + Number(valorAdicion);
    await this.contratoRepository.save(contrato);
  }

  /**
   * Crea una nueva adición presupuestal y actualiza el valor total del contrato
   * 
   * @param createAdicionDto - Datos de la adición a crear
   * @param user - Usuario que realiza la petición
   * @returns La adición creada
   */
  async create(createAdicionDto: CreateAdicionDto, user: RequestUser): Promise<AdicionResponseDto> {
    if (user.rol !== RolUsuario.ADMIN && user.rol !== RolUsuario.SUPERVISOR) {
      throw new ForbiddenException('No tiene permisos para crear adiciones');
    }

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
   * Obtiene todas las adiciones
   * 
   * @param user - Usuario que realiza la petición
   * @returns Lista de adiciones
   */
  async findAll(user: RequestUser): Promise<AdicionResponseDto[]> {
    if (user.rol === RolUsuario.CONTRATISTA) {
      const adiciones = await this.adicionRepository
        .createQueryBuilder('adicion')
        .leftJoinAndSelect('adicion.contrato', 'contrato')
        .where('contrato.usuarioCedula = :cedula', { cedula: user.cedula })
        .getMany();
      return adiciones.map(adicion => this.toResponseDto(adicion));
    }

    const adiciones = await this.adicionRepository.find({
      relations: ['contrato']
    });
    return adiciones.map(adicion => this.toResponseDto(adicion));
  }

  /**
   * Obtiene una adición por su ID
   * 
   * @param id - ID de la adición
   * @param user - Usuario que realiza la petición
   * @returns La adición encontrada
   * @throws NotFoundException si la adición no existe
   * @throws ForbiddenException si el usuario no tiene acceso
   */
  async findOne(id: number, user: RequestUser): Promise<AdicionResponseDto> {
    const adicion = await this.adicionRepository.findOne({
      where: { id },
      relations: ['contrato']
    });

    if (!adicion) {
      throw new NotFoundException('Adición no encontrada');
    }

    const hasAccess = await this.hasAccessToAdicion(user, id);
    if (!hasAccess) {
      throw new ForbiddenException('No tiene acceso a esta adición');
    }

    return this.toResponseDto(adicion);
  }

  /**
   * Actualiza una adición
   * 
   * @param id - ID de la adición a actualizar
   * @param updateAdicionDto - Datos actualizados de la adición
   * @param user - Usuario que realiza la petición
   * @returns La adición actualizada
   * @throws NotFoundException si la adición no existe
   * @throws ForbiddenException si el usuario no tiene acceso
   */
  async update(id: number, updateAdicionDto: Partial<CreateAdicionDto>, user: RequestUser): Promise<AdicionResponseDto> {
    if (user.rol !== RolUsuario.ADMIN && user.rol !== RolUsuario.SUPERVISOR) {
      throw new ForbiddenException('No tiene permisos para actualizar adiciones');
    }

    // Si se está actualizando el valor de la adición, necesitamos una transacción
    if (updateAdicionDto.valorAdicion !== undefined) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const adicion = await queryRunner.manager.findOne(Adicion, {
          where: { id }
        });

        if (!adicion) {
          throw new NotFoundException('Adición no encontrada');
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

    Object.assign(adicion, updateAdicionDto);
    const updatedAdicion = await this.adicionRepository.save(adicion);
    return this.toResponseDto(updatedAdicion);
  }

  /**
   * Elimina una adición y actualiza el valor total del contrato
   * 
   * @param id - ID de la adición a eliminar
   * @param user - Usuario que realiza la petición
   * @throws NotFoundException si la adición no existe
   * @throws ForbiddenException si el usuario no tiene acceso
   */
  async remove(id: number, user: RequestUser): Promise<void> {
    if (user.rol !== RolUsuario.ADMIN) {
      throw new ForbiddenException('No tiene permisos para eliminar adiciones');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const adicion = await queryRunner.manager.findOne(Adicion, {
        where: { id }
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
   * 
   * @param contratoId - ID del contrato
   * @param user - Usuario que realiza la petición
   * @returns Lista de adiciones del contrato
   * @throws ForbiddenException si el usuario no tiene acceso
   */
  async findByContrato(contratoId: number, user: RequestUser): Promise<AdicionResponseDto[]> {
    const hasAccess = await this.hasAccessToContract(user, contratoId);
    if (!hasAccess) {
      throw new ForbiddenException('No tiene acceso a las adiciones de este contrato');
    }

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