import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { PinGuard } from '../common/guards/pin.guard';

@Controller('api/dashboard')
@UseGuards(PinGuard)
export class DashboardController {
  constructor(private readonly svc: DashboardService) {}

  @Get('overview')
  getOverview(@Query('date') date?: string) {
    return this.svc.getOverview(date);
  }

  @Get('employee/:name')
  getEmployee(@Param('name') name: string) {
    return this.svc.getEmployeeStats(name);
  }

  @Get('monthly')
  getMonthly(@Query('month') month: string, @Query('year') year: string) {
    return this.svc.getMonthly(parseInt(month), parseInt(year));
  }

  @Get('team')
  getTeam() {
    return this.svc.getTeam();
  }

  @Get('analytics')
  getAnalytics(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('employee') employee?: string,
  ) {
    return this.svc.getAnalytics({ from, to, employee });
  }
}
