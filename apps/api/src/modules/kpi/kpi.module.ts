import { Module } from '@nestjs/common';
import { KpiController } from './kpi.controller';
import { KpiService } from './kpi.service';
import { KpiScoringService } from './kpi-scoring.service';
import { WorkflowStateMachineService } from './workflow-state-machine.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KpiController],
  providers: [KpiService, KpiScoringService, WorkflowStateMachineService],
  exports: [KpiService, KpiScoringService, WorkflowStateMachineService],
})
export class KpiModule {}

