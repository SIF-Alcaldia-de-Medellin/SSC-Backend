import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto';
import { LoginDto } from './dto/login.dto';

/**
 * Controlador de autenticación
 * 
 * Maneja los endpoints de registro y login
 */
@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint para registrar un nuevo usuario
   */
  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({ 
    status: 201, 
    description: 'Usuario registrado exitosamente',
    schema: {
      example: {
        user: {
          cedula: '1234567890',
          email: 'usuario@medellin.gov.co',
          nombre: 'Usuario Prueba',
          rol: 'SUPERVISOR'
        },
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'El usuario ya existe' })
  async register(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.authService.register(createUsuarioDto);
  }

  /**
   * Endpoint para iniciar sesión
   */
  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ 
    status: 200, 
    description: 'Login exitoso',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
} 