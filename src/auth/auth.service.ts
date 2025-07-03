import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { FirstLoginChangePasswordDto } from './dto/first-login-change-password.dto';
import { ChangePasswordResponseDto } from './dto/change-password-response.dto';

/**
 * Servicio de autenticación
 * 
 * Maneja el registro, login, validación de usuarios y cambio de contraseñas
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
   * Genera un token JWT para un usuario y verifica si debe cambiar contraseña
   * 
   * @param loginDto - Datos de login del usuario
   * @returns Token de acceso y información sobre cambio de contraseña
   */
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    const payload = { 
      sub: user.cedula,
      email: user.email,
      rol: user.rol
    };

    return {
      access_token: this.jwtService.sign(payload),
      mustChangePassword: user.mustChangePassword,
      user: {
        cedula: user.cedula,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        mustChangePassword: user.mustChangePassword,
        lastPasswordChange: user.lastPasswordChange
      }
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

  /**
   * Cambia la contraseña de un usuario (requiere contraseña actual)
   * 
   * @param userCedula - Cédula del usuario que cambia la contraseña
   * @param changePasswordDto - Datos del cambio de contraseña
   * @returns Respuesta con el resultado del cambio
   */
  async changePassword(userCedula: string, changePasswordDto: ChangePasswordDto): Promise<ChangePasswordResponseDto> {
    // Obtener el usuario actual
    const user = await this.usuariosService.findByCedula(userCedula);
    
    // Verificar la contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    // Verificar que la nueva contraseña sea diferente
    const isSamePassword = await bcrypt.compare(changePasswordDto.newPassword, user.password);
    if (isSamePassword) {
      throw new ConflictException('La nueva contraseña debe ser diferente a la actual');
    }

    // Actualizar la contraseña
    return await this.updateUserPassword(user, changePasswordDto.newPassword);
  }

  /**
   * Cambia la contraseña en el primer login (no requiere contraseña actual)
   * 
   * @param userCedula - Cédula del usuario que cambia la contraseña
   * @param firstLoginChangePasswordDto - Datos de la nueva contraseña
   * @returns Respuesta con el resultado del cambio
   */
  async firstLoginChangePassword(userCedula: string, firstLoginChangePasswordDto: FirstLoginChangePasswordDto): Promise<ChangePasswordResponseDto> {
    // Obtener el usuario actual
    const user = await this.usuariosService.findByCedula(userCedula);
    
    // Verificar que el usuario efectivamente debe cambiar su contraseña
    if (!user.mustChangePassword) {
      throw new BadRequestException('Este usuario no requiere cambio de contraseña obligatorio');
    }

    // Verificar que la nueva contraseña sea diferente a la actual
    const isSamePassword = await bcrypt.compare(firstLoginChangePasswordDto.newPassword, user.password);
    if (isSamePassword) {
      throw new ConflictException('La nueva contraseña debe ser diferente a la actual');
    }

    // Actualizar la contraseña
    return await this.updateUserPassword(user, firstLoginChangePasswordDto.newPassword);
  }

  /**
   * Método privado para actualizar la contraseña de un usuario
   * 
   * @param user - Usuario a actualizar
   * @param newPassword - Nueva contraseña en texto plano
   * @returns Respuesta del cambio de contraseña
   */
  private async updateUserPassword(user: any, newPassword: string): Promise<ChangePasswordResponseDto> {
    // Encriptar la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar el usuario
    const updatedUser = await this.usuariosService.updatePassword(
      user.cedula,
      hashedPassword,
      false, // mustChangePassword = false después del cambio
      new Date() // lastPasswordChange = ahora
    );

    // Generar nuevo token con información actualizada
    const payload = { 
      sub: updatedUser.cedula,
      email: updatedUser.email,
      rol: updatedUser.rol
    };

    const newToken = this.jwtService.sign(payload);

    return {
      success: true,
      message: 'Contraseña cambiada exitosamente',
      access_token: newToken,
      passwordChangedAt: updatedUser.lastPasswordChange,
      user: {
        cedula: updatedUser.cedula,
        email: updatedUser.email,
        nombre: updatedUser.nombre,
        rol: updatedUser.rol,
        mustChangePassword: updatedUser.mustChangePassword,
        lastPasswordChange: updatedUser.lastPasswordChange
      }
    };
  }
} 