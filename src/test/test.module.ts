import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { testDbConfig } from './test-config';
import { jwtConstants } from '../auth/constants';
import { Usuario } from '../usuarios/usuario.entity';
import { Contrato } from '../contratos/contrato.entity';
import { Cuo } from '../cuo/cuo.entity';
import { Actividad } from '../actividades/actividad.entity';
import { SeguimientoActividad } from '../seguimiento-actividad/seguimiento-actividad.entity';
import { SeguimientoGeneral } from '../seguimiento-general/seguimiento-general.entity';
import { Adicion } from '../adiciones/adicion.entity';
import { Modificacion } from '../modificaciones/modificacion.entity';
import { AuthModule } from '../auth/auth.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { ContratosModule } from '../contratos/contratos.module';
import { AdicionesModule } from '../adiciones/adiciones.module';
import { ModificacionesModule } from '../modificaciones/modificaciones.module';
import { CuoModule } from '../cuo/cuo.module';
import { ActividadesModule } from '../actividades/actividades.module';
import { SeguimientoGeneralModule } from '../seguimiento-general/seguimiento-general.module';
import { SeguimientoActividadModule } from '../seguimiento-actividad/seguimiento-actividad.module';
import { AppController } from '../app.controller';
import { AppService } from '../app.service';

@Module({
  imports: [
    TypeOrmModule.forRoot(testDbConfig),
    TypeOrmModule.forFeature([
      Usuario,
      Contrato,
      Cuo,
      Actividad,
      SeguimientoActividad,
      SeguimientoGeneral,
      Adicion,
      Modificacion
    ]),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: jwtConstants.expiresIn },
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
  exports: [TypeOrmModule, JwtModule]
})
export class TestModule {} 