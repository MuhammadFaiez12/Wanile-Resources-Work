import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Report, ReportSchema } from '../reports/schemas/report.schema';
import { Employee, EmployeeSchema } from '../employees/schemas/employee.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema },
      { name: Employee.name, schema: EmployeeSchema },
    ]),
    NotificationsModule,
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}
