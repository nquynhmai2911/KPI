import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Cấu hình tiền tố đường dẫn API toàn hệ thống
  const apiPrefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // 2. Kích hoạt Validation tự động với DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // 3. Cấu hình CORS cho Next.js Frontend
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-audit-reason'],
  });

  // 4. Cấu hình Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('Hệ thống Đánh giá KPI & Xếp loại Cán bộ (Dual-Mode Engine)')
    .setDescription(
      'REST API phục vụ 2 chế độ trên cùng một lõi:\n' +
      '- Chế độ Doanh nghiệp: KPI, OKR, BSC, Đánh giá 360°, Gắn kết quả Lương thưởng\n' +
      '- Chế độ Cơ quan Nhà nước: Đánh giá, xếp loại CBCCVC theo Nghị định 90/2020 & 48/2023\n' +
      '- Nguyên tắc cốt lõi: Audit log mọi biến động dữ liệu, Khóa kỳ bất biến, RBAC & Data Scope'
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Nhập Access Token vào đây',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    customSiteTitle: 'Tài liệu API Hệ thống KPI & Đánh giá Cán bộ',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`🚀 API Server đang chạy tại: http://localhost:${port}/${apiPrefix}`);
  logger.log(`📖 Tài liệu OpenAPI Swagger: http://localhost:${port}/${apiPrefix}/docs`);
}

bootstrap();
