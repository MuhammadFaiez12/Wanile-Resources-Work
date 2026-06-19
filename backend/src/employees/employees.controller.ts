import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PinGuard } from '../common/guards/pin.guard';

@Controller('api/employees')
export class EmployeesController {
  constructor(private readonly svc: EmployeesService) {}

  @Get()
  findAll(@Query('all') all?: string) {
    return this.svc.findAll(all === 'true');
  }

  @Post()
  @UseGuards(PinGuard)
  create(@Body() dto: CreateEmployeeDto) {
    return this.svc.create(dto);
  }

  @Put(':id')
  @UseGuards(PinGuard)
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(PinGuard)
  async deactivate(@Param('id') id: string) {
    await this.svc.deactivate(id);
    return { success: true };
  }
}
