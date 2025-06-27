import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { STRATEGY_TYPES } from '../constants';

/**
 * Estrategia de autenticación local
 * 
 * Utiliza email y contraseña para autenticar usuarios
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, STRATEGY_TYPES.LOCAL) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  /**
   * Valida las credenciales del usuario
   * 
   * @param email - Correo electrónico del usuario
   * @param password - Contraseña del usuario
   * @returns El usuario autenticado
   * @throws UnauthorizedException si las credenciales son inválidas
   */
  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);
    
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    
    return user;
  }
} 