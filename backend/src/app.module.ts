import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modulos/auth/auth.module';
import { PsicologosModule } from './modulos/psicologos/psicologos.module';
import { PacientesModule } from './modulos/pacientes/pacientes.module';
import { PaquetesModule } from './modulos/paquetes/paquetes.module';
import { CitasModule } from './modulos/citas/citas.module';
import { MlModule } from './modulos/ml/ml.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    PsicologosModule,
    PacientesModule,
    PaquetesModule,
    CitasModule,
    MlModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
