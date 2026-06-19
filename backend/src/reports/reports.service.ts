import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportDocument } from './schemas/report.schema';
import { CreateReportDto } from './dto/create-report.dto';
import { QueryReportDto } from './dto/query-report.dto';
import { getPKTDateTime } from '../common/helpers/pkt-time.helper';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<ReportDocument>,
  ) {}

  async upsert(dto: CreateReportDto): Promise<{ report: Report; action: 'submitted' | 'updated' }> {
    const submitted_at = getPKTDateTime();
    const existing = await this.reportModel.findOne({
      employee_name: dto.employee_name,
      date: dto.date,
    });

    if (existing) {
      Object.assign(existing, dto, { submitted_at });
      await existing.save();
      return { report: existing.toObject(), action: 'updated' };
    }

    const report = await this.reportModel.create({ ...dto, submitted_at });
    return { report: report.toObject(), action: 'submitted' };
  }

  async findAll(query: QueryReportDto): Promise<Report[]> {
    const filter: Record<string, unknown> = {};
    if (query.employee) filter.employee_name = query.employee;
    if (query.date) filter.date = query.date;
    if (query.startDate || query.endDate) {
      filter.date = {};
      if (query.startDate) (filter.date as Record<string, string>).$gte = query.startDate;
      if (query.endDate) (filter.date as Record<string, string>).$lte = query.endDate;
    }
    return this.reportModel.find(filter).sort({ date: -1, submitted_at: -1 }).lean();
  }

  async findByMonth(month: number, year: number): Promise<Report[]> {
    const ms = String(month).padStart(2, '0');
    return this.findAll({ startDate: `${year}-${ms}-01`, endDate: `${year}-${ms}-31` });
  }

  async deleteById(id: string): Promise<void> {
    await this.reportModel.findByIdAndDelete(id);
  }

  async exportCSV(month: number, year: number): Promise<string> {
    const reports = await this.findByMonth(month, year);
    const clean = (v: unknown) => String(v ?? '').replace(/,/g, ';').replace(/\n/g, ' ');
    const header = 'Employee,Date,Project/Task,Work Done,Hours,Progress %,Mood,Blockers,Tomorrow Plan,Submitted At';
    const rows = reports.map((r) =>
      [
        clean(r.employee_name), clean(r.date), clean(r.project_task),
        clean(r.work_done).slice(0, 120), r.hours_spent, r.progress_percent,
        r.mood, clean(r.blockers), clean(r.tomorrow_plan).slice(0, 100), clean(r.submitted_at),
      ].join(','),
    );
    return header + '\n' + rows.join('\n');
  }
}
