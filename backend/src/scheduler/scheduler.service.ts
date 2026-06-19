import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportDocument } from '../reports/schemas/report.schema';
import { Employee, EmployeeDocument } from '../employees/schemas/employee.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { getPKTDate } from '../common/helpers/pkt-time.helper';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger('Scheduler');

  constructor(
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
    @InjectModel(Report.name) private readonly reportModel: Model<ReportDocument>,
    @InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>,
  ) {}

  // 4:30 PM PKT = 11:30 UTC, Mon–Fri
  @Cron('30 11 * * 1-5', { timeZone: 'UTC' })
  async sendReminder() {
    const formUrl = this.config.get<string>('FORM_URL', 'http://localhost:3001/submit');
    this.logger.log('Sending 4:30 PM PKT daily reminder');
    await this.notifications.send(
      [
        '🔔 *Daily Work Report Reminder*',
        '',
        "It's 4:30 PM PKT — time to fill out your daily work report!",
        '',
        `📋 *Submit here:* ${formUrl}`,
        '',
        'Please include: what you worked on, hours spent, blockers, tomorrow\'s plan, and your mood.',
        '',
        'Thank you for keeping the team informed! 💪',
      ].join('\n'),
    );
  }

  // 5:30 PM PKT = 12:30 UTC, Mon–Fri
  @Cron('30 12 * * 1-5', { timeZone: 'UTC' })
  async checkMissing() {
    const today = getPKTDate();
    this.logger.log(`Running missing-submission check for ${today}`);
    const formUrl = this.config.get<string>('FORM_URL', 'http://localhost:3001/submit');

    const [employees, submitted] = await Promise.all([
      this.employeeModel.find({ is_active: true }).lean(),
      this.reportModel.find({ date: today }).distinct('employee_name'),
    ]);

    const missing = employees.filter((e) => !submitted.includes(e.name));

    if (missing.length === 0) {
      await this.notifications.send(
        `✅ *All ${employees.length} team members* submitted their daily report for *${today}*! Great work everyone! 🎉`,
      );
      return;
    }

    const names = missing
      .map((e) => (e.slack_user_id ? `<@${e.slack_user_id}>` : `*${e.name}*`))
      .join(', ');

    await this.notifications.send(
      [
        `⚠️ *Missing Daily Reports* — as of 5:30 PM PKT on ${today}`,
        '',
        'The following team members have *not* submitted their report:',
        names,
        '',
        `Submitted so far: ${submitted.join(', ') || 'None yet'}`,
        '',
        `Please submit ASAP: ${formUrl}`,
      ].join('\n'),
    );
  }
}
