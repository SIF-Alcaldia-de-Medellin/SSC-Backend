import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ContratosModule } from './contratos/contratos.module';
import { AdicionesModule } from './adiciones/adiciones.module';
import { ModificacionesModule } from './modificaciones/modificaciones.module';
import { CuoModule } from './cuo/cuo.module';
import { ActividadesModule } from './actividades/actividades.module';
import { SeguimientoGeneralModule } from './seguimiento-general/seguimiento-general.module';
import { SeguimientoActividadModule } from './seguimiento-actividad/seguimiento-actividad.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

/**
 * Módulo principal de la aplicación
 * 
 * Integra todos los módulos del sistema de seguimiento de contratos.
 * La estructura modular permite una clara separación de responsabilidades
 * y facilita el mantenimiento del código.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      schema: process.env.DB_SCHEMA,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
      ssl: {
        rejectUnauthorized: false
      }
    }),
    AuthModule,
    UsuariosModule,
    ContratosModule,
    AdicionesModule,
    ModificacionesModule,
    CuoModule,
    ActividadesModule,
    SeguimientoGeneralModule,
    SeguimientoActividadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
