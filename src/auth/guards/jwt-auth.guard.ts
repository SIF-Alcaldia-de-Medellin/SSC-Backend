import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { STRATEGY_TYPES } from '../constants';

/**
 * Guardia para proteger rutas que requieren autenticación JWT
 * 
 * Se utiliza en todas las rutas que requieren autenticación
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard(STRATEGY_TYPES.JWT) {} 