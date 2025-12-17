import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SosController } from './sos.controller';
import { SosService } from './sos.service';
import { Sos } from '../../models/sos';
import { Contacts } from 'src/models/contacts';

@Module({
  imports: [TypeOrmModule.forFeature([Sos,Contacts])],
  controllers: [SosController],
  providers: [SosService],
  exports: [SosService], 
})
export class SosModule {}