import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto';
import { LoginDto } from './dto/login.dto';

/**
 * Servicio de autenticación
 * 
 * Maneja el registro, login y validación de usuarios
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService
  ) {}

  /**
   * Valida las credenciales de un usuario
   * 
   * @param email - Correo electrónico del usuario
   * @param password - Contraseña del usuario
   * @returns El usuario si las credenciales son válidas
   * @throws UnauthorizedException si las credenciales son inválidas
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usuariosService.findByEmail(email);
    
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }

    throw new UnauthorizedException('Credenciales inválidas');
  }

  /**
   * Genera un token JWT para un usuario
   * 
   * @param user - Usuario para el que se generará el token
   * @returns Token de acceso
   */
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    const payload = { 
      sub: user.cedula,
      email: user.email,
      rol: user.rol
    };

    return {
      access_token: this.jwtService.sign(payload)
    };
  }

  /**
   * Registra un nuevo usuario en el sistema
   * 
   * @param createUsuarioDto - Datos del usuario a registrar
   * @returns El usuario creado y su token de acceso
   */
  async register(createUsuarioDto: CreateUsuarioDto) {
    const user = await this.usuariosService.create(createUsuarioDto);
    
    const payload = { 
      sub: user.cedula,
      email: user.email,
      rol: user.rol
    };

    return {
      user,
      access_token: this.jwtService.sign(payload)
    };
  }
} 