import { Injectable, ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Usuario } from './usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';

/**
 * Servicio para la gestión de usuarios
 */
@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  /**
   * Crea un nuevo usuario en el sistema
   * 
   * @param createUsuarioDto - Datos del usuario a crear
   * @returns El usuario creado sin la contraseña
   * @throws ConflictException si el email o cédula ya existen
   * @throws InternalServerErrorException si hay un error al encriptar la contraseña
   */
  async create(createUsuarioDto: CreateUsuarioDto): Promise<Omit<Usuario, 'password'>> {
    try {
      // Verificar si ya existe un usuario con el mismo email o cédula
      const [existingEmail, existingCedula] = await Promise.all([
        this.usuarioRepository.findOne({ where: { email: createUsuarioDto.email } }),
        this.usuarioRepository.findOne({ where: { cedula: createUsuarioDto.cedula } })
      ]);

      if (existingEmail) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }

      if (existingCedula) {
        throw new ConflictException('La cédula ya está registrada');
      }

      // Encriptar la contraseña
      const hashedPassword = await bcrypt.hash(createUsuarioDto.password, 10);

      // Crear y guardar el usuario
      const usuario = await this.usuarioRepository.save({
        ...createUsuarioDto,
        password: hashedPassword
      });

      // Retornar el usuario sin la contraseña
      const { password, ...result } = usuario;
      return result;

    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      // Log del error para debugging
      console.error('Error al crear usuario:', error);

      if (error.code === '23505') { // Unique violation en PostgreSQL
        throw new ConflictException('El usuario ya existe');
      }

      throw new InternalServerErrorException(
        'Error al crear el usuario. Por favor, intente nuevamente.'
      );
    }
  }

  /**
   * Busca un usuario por su correo electrónico
   * 
   * @param email - Correo electrónico del usuario
   * @returns El usuario si existe, undefined si no
   */
  async findByEmail(email: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { email }
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con email ${email} no encontrado`);
    }

    return usuario;
  }

  /**
   * Encuentra un usuario por su cédula
   */
  async findByCedula(cedula: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { cedula }
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con cédula ${cedula} no encontrado`);
    }

    return usuario;
  }
} 