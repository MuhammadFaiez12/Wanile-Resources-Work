import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { EmployeesService } from './employees/employees.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new Logger('Bootstrap');

  app.enableCors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Seed default employees on first run
  const employeesService = app.get(EmployeesService);
  await employeesService.seed();

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  logger.log(`NestJS server running on http://localhost:${port}`);
}
bootstrap();
