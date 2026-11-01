import { Module } from '@nestjs/common';
import { CitasService } from './citas.service';
import { CitasController } from './citas.controller';
import { MlModule } from '../ml/ml.module';
import { NotificacionesService } from '../../comun/notificaciones.service';

@Module({
  imports: [MlModule],
  controllers: [CitasController],
  providers: [CitasService, NotificacionesService],
  exports: [CitasService],
})
export class CitasModule {}
