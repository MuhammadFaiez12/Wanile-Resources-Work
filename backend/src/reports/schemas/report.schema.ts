import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReportDocument = HydratedDocument<Report>;

@Schema({ timestamps: true, collection: 'reports' })
export class Report {
  @Prop({ required: true })
  employee_name: string;

  @Prop({ required: true })
  date: string; // YYYY-MM-DD

  @Prop()
  project_task: string;

  @Prop()
  work_done: string;

  @Prop({ min: 1, max: 12, default: 1 })
  hours_spent: number;

  @Prop({ default: 'None' })
  blockers: string;

  @Prop()
  tomorrow_plan: string;

  @Prop({ min: 1, max: 5, default: 3 })
  mood: number;

  @Prop({ min: 0, max: 100, default: 50 })
  progress_percent: number;

  @Prop()
  submitted_at: string;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
ReportSchema.index({ employee_name: 1, date: 1 }, { unique: true });
ReportSchema.index({ date: 1 });
ReportSchema.index({ employee_name: 1 });
