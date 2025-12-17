// clerk.module.ts
import { Module } from '@nestjs/common';
import { ClerkService } from './clerk.service';

@Module({
  providers: [ClerkService],
  exports: [ClerkService],   // ← VERY IMPORTANT
})
export class ClerkModule {}
