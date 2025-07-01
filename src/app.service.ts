import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return {
      message: 'API Sistema de Seguimiento de Contratos (SSC)',
      version: '1.0.0',
      description: 'API REST para el seguimiento de contratos de obra pública - Alcaldía de Medellín',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      documentation: '/docs'
    };
  }

  getApiInfo(): object {
    return {
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
        'Administración de contratos de obra pública',
        'Seguimiento de avances físicos y financieros',
        'Gestión de CUO (Códigos Únicos de Obra)',
        'Control de actividades por proyecto',
        'Modificaciones contractuales',
        'Adiciones presupuestales'
      ],
      authentication: 'JWT Bearer Token',
      baseUrl: process.env.NODE_ENV === 'production' 
        ? 'https://api-ssc.medellin.gov.co' 
        : 'http://localhost:3000'
    };
  }
}
