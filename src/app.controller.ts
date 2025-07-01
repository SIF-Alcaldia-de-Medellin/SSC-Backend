import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Información general de la API',
    description: 'Retorna información básica sobre la API del Sistema de Seguimiento de Contratos'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Información general de la API',
    schema: {
      example: {
        message: 'API Sistema de Seguimiento de Contratos (SSC)',
        version: '1.0.0',
        description: 'API REST para el seguimiento de contratos de obra pública - Alcaldía de Medellín',
        environment: 'development',
        timestamp: '2024-01-15T10:30:00.000Z',
        documentation: '/docs'
      }
    }
  })
  getHello(): object {
    return this.appService.getHello();
  }

  @Get('info')
  @ApiOperation({ 
    summary: 'Información detallada de la API',
    description: 'Retorna información detallada sobre las funcionalidades y características de la API'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Información detallada de la API',
    schema: {
      example: {
        name: 'SSC Backend API',
        version: '1.0.0',
        description: 'Sistema de Seguimiento de Contratos de obra pública',
        organization: 'Alcaldía de Medellín',
        contact: {
          email: 'desarrollo@medellin.gov.co',
          website: 'https://medellin.gov.co'
        },
        features: [
          'Gestión de usuarios con roles (Admin/Supervisor)',
          'Administración de contratos de obra pública'
        ],
        authentication: 'JWT Bearer Token',
        baseUrl: 'http://localhost:3000'
      }
    }
  })
  getApiInfo(): object {
    return this.appService.getApiInfo();
  }

  @Get('health')
  @ApiOperation({ 
    summary: 'Health check del sistema',
    description: 'Endpoint para verificar el estado de salud de la API'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado de salud de la aplicación',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2024-01-15T10:30:00.000Z',
        uptime: '2h 30m 45s',
        environment: 'development'
      }
    }
  })
  healthCheck(): object {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    return { 
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: `${hours}h ${minutes}m ${seconds}s`,
      environment: process.env.NODE_ENV || 'development'
    };
  }
}
