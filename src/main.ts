import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { config as dotenvConfig } from 'dotenv';

async function bootstrap() {
  // Cargar variables de entorno
  dotenvConfig();
  
  const app = await NestFactory.create(AppModule);

  // Configuración de validación global
  app.useGlobalPipes(new ValidationPipe());

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('API Sistema de Seguimiento de Contratos (SSC)')
    .setDescription(`
    API REST para el Sistema de Seguimiento de Contratos de obra pública de la Alcaldía de Medellín.
    
    ## Funcionalidades principales:
    - **Gestión de usuarios** con roles (Admin/Supervisor)
    - **Administración de contratos** de obra pública
      - **Seguimiento de avances** físicos y financieros
      - **Gestión de CUO** (Códigos Únicos de Obra)
      - **Control de actividades** por proyecto
      - **Modificaciones contractuales** (suspensiones, prórrogas)
    - **Adiciones presupuestales**
    
    ## Roles y permisos:
    - **ADMIN**: Acceso completo a todas las funcionalidades
    - **SUPERVISOR**: Acceso a contratos asignados y sus componentes
    
    ## Autenticación:
    Utiliza JWT (JSON Web Tokens) para la autenticación. Incluye el token en el header:
    \`Authorization: Bearer <tu-token>\`
    `)
    .setVersion('1.0')
    .addTag('App', 'Endpoints generales de la aplicación')
    .addTag('Autenticación', 'Registro, login y gestión de sesiones')
    .addTag('Usuarios', 'Gestión de usuarios del sistema')
    .addTag('Contratos', 'Administración de contratos de obra pública')
    .addTag('CUO', 'Gestión de Códigos Únicos de Obra (puntos de intervención)')
    .addTag('Actividades', 'Gestión de actividades específicas por CUO')
    .addTag('Seguimiento General', 'Seguimiento general de contratos (avance físico y financiero)')
    .addTag('Seguimiento de Actividades', 'Seguimiento detallado de actividades específicas')
    .addTag('Modificaciones', 'Modificaciones contractuales (suspensiones, prórrogas, etc.)')
    .addTag('Adiciones', 'Adiciones presupuestales a contratos')
    .setContact(
      'Equipo de Desarrollo SSC',
      'https://medellin.gov.co',
      'desarrollo@medellin.gov.co'
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:3000', 'Servidor de desarrollo')
    .addServer('https://api-ssc.medellin.gov.co', 'Servidor de producción')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa tu token JWT (se obtiene al hacer login)',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Configuración adicional de Swagger UI
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      security: [{
        'access-token': []
      }],
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'Documentación API SSC - Alcaldía de Medellín',
    customfavIcon: 'https://www.medellin.gov.co/favicon.ico',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    ],
  });

  // Iniciar servidor
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Aplicación corriendo en puerto ${port}`);
  console.log(`📚 Documentación disponible en http://localhost:${port}/docs`);
  console.log(`🔍 Health check en http://localhost:${port}/health`);
}
bootstrap();
