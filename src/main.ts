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
    .setTitle('API Sistema de Seguimiento de Contratos')
    .setDescription('API para la gestión y seguimiento de contratos de obra pública')
    .setVersion('1.0')
    .addTag('Autenticación', 'Endpoints de autenticación y gestión de usuarios')
    .addTag('Contratos', 'Gestión de contratos y sus estados')
    .addTag('Actividades', 'Gestión de actividades por contrato')
    .addTag('Seguimiento', 'Seguimiento de avances y modificaciones')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa tu token JWT',
        in: 'header',
      },
      'access-token', // Este es el nombre que usaremos para referenciar el esquema de seguridad
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Configuración adicional de Swagger UI
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      security: [{
        'access-token': []
      }]
    },
    customSiteTitle: 'Documentación API SSC',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
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
  console.log(`Aplicación corriendo en puerto ${port}`);
  console.log(`Documentación disponible en http://localhost:${port}/docs`);
}
bootstrap();
