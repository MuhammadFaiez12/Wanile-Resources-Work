import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReportDto } from './dto/create-report.dto';
import { QueryReportDto } from './dto/query-report.dto';
import { PinGuard } from '../common/guards/pin.guard';
import { getPKTDate } from '../common/helpers/pkt-time.helper';

@Controller('api/reports')
export class ReportsController {
  constructor(
    private readonly svc: ReportsService,
    private readonly notifications: NotificationsService,
  ) {}

  @Post()
  async submit(@Body() dto: CreateReportDto) {
    const { report, action } = await this.svc.upsert(dto);
    const verb = action === 'updated' ? 'updated' : 'submitted';
    this.notifications
      .send(`${action === 'updated' ? '🔄' : '✅'} *${dto.employee_name}* ${verb} their daily report for ${dto.date}`)
      .catch(() => {});
    return { success: true, action, report };
  }

  @Get('today')
  @UseGuards(PinGuard)
  getToday() {
    return this.svc.findAll({ date: getPKTDate() });
  }

  @Get('export')
  @UseGuards(PinGuard)
  async export(
    @Query('month') month: string,
    @Query('year') year: string,
    @Res() res: Response,
  ) {
    const csv = await this.svc.exportCSV(parseInt(month), parseInt(year));
    const filename = `report_${year}_${String(month).padStart(2, '0')}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Get()
  @UseGuards(PinGuard)
  findAll(@Query() query: QueryReportDto) {
    return this.svc.findAll(query);
  }

  @Delete(':id')
  @UseGuards(PinGuard)
  async delete(@Param('id') id: string) {
    await this.svc.deleteById(id);
    return { success: true };
  }
}
