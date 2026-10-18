import { Module } from '@nestjs/common';
import { RbacController } from './rbac.controller';
import { RbacService } from './rbac.service';
import { SodPolicyService } from './sod-policy.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RbacController],
  providers: [RbacService, SodPolicyService],
  exports: [RbacService, SodPolicyService],
})
export class RbacModule {}
