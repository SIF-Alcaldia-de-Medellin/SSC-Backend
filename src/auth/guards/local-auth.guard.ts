import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { STRATEGY_TYPES } from '../constants';

/**
 * Guardia para proteger rutas que requieren autenticación local
 * 
 * Se utiliza principalmente en el endpoint de login
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard(STRATEGY_TYPES.LOCAL) {} 