import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolUsuario } from './usuario.entity';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';

/**
 * Controlador para la gestión de usuarios
 */
@ApiTags('Usuarios')
@ApiBearerAuth('access-token')
@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  /**
   * Crea un nuevo usuario
   */
  @Post()
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({ 
    status: 201, 
    description: 'Usuario creado exitosamente',
    schema: {
      example: {
        cedula: '1234567890',
        email: 'usuario@medellin.gov.co',
        nombre: 'Usuario Prueba',
        rol: 'SUPERVISOR'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido - Rol no autorizado' })
  @ApiResponse({ status: 409, description: 'El usuario ya existe' })
  async create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return await this.usuariosService.create(createUsuarioDto);
  }

  /**
   * Obtiene el perfil del usuario actual
   */
  @Get('perfil/me')
  @ApiOperation({ summary: 'Obtener el perfil del usuario actual' })
  @ApiResponse({ 
    status: 200, 
    description: 'Perfil del usuario',
    schema: {
      example: {
        cedula: '1234567890',
        email: 'usuario@medellin.gov.co',
        nombre: 'Usuario Prueba',
        rol: 'SUPERVISOR'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getProfile(@Request() req) {
    const usuario = await this.usuariosService.findByCedula(req.user.cedula);
    const { password, ...result } = usuario;
    return result;
  }

  /**
   * Obtiene un usuario por su cédula
   */
  @Get(':cedula')
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Obtener un usuario por cédula' })
  @ApiResponse({ 
    status: 200, 
    description: 'Usuario encontrado',
    schema: {
      example: {
        cedula: '1234567890',
        email: 'usuario@medellin.gov.co',
        nombre: 'Usuario Prueba',
        rol: 'SUPERVISOR'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido - Rol no autorizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findByCedula(@Param('cedula') cedula: string) {
    const usuario = await this.usuariosService.findByCedula(cedula);
    const { password, ...result } = usuario;
    return result;
  }
} 