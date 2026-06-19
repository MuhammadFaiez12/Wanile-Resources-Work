import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Employee, EmployeeDocument } from './schemas/employee.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
  ) {}

  async findAll(includeInactive = false): Promise<Employee[]> {
    const filter = includeInactive ? {} : { is_active: true };
    return this.employeeModel.find(filter).sort({ name: 1 }).lean();
  }

  async create(dto: CreateEmployeeDto): Promise<Employee> {
    const exists = await this.employeeModel.findOne({ name: dto.name.trim() });
    if (exists) throw new ConflictException('Employee with this name already exists');
    const emp = new this.employeeModel({
      name: dto.name.trim(),
      slack_user_id: dto.slack_user_id ?? '',
    });
    return emp.save();
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    const emp = await this.employeeModel.findByIdAndUpdate(id, dto, { new: true });
    if (!emp) throw new NotFoundException('Employee not found');
    return emp;
  }

  async deactivate(id: string): Promise<void> {
    const emp = await this.employeeModel.findByIdAndUpdate(id, { is_active: false });
    if (!emp) throw new NotFoundException('Employee not found');
  }

  async seed(): Promise<void> {
    const count = await this.employeeModel.countDocuments();
    if (count > 0) return;
    const defaults = ['Ahmed Khan', 'Sara Ali', 'Usman Raza', 'Fatima Sheikh', 'Bilal Mirza'];
    await this.employeeModel.insertMany(defaults.map((name) => ({ name })));
  }
}
