import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants, STRATEGY_TYPES } from '../constants';

/**
 * Estrategia de autenticación JWT
 * 
 * Valida tokens JWT para proteger rutas
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, STRATEGY_TYPES.JWT) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  /**
   * Valida el payload del token JWT
   * 
   * @param payload - Contenido del token JWT
   * @returns Los datos del usuario autenticado
   */
  async validate(payload: any) {
    return { 
      cedula: payload.sub, 
      email: payload.email,
      rol: payload.rol
    };
  }
} 