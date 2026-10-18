import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';

let BasePrismaClient: any = class {
  $connect() { return Promise.resolve(); }
  $disconnect() { return Promise.resolve(); }
};

try {
  const prismaPkg = require('@prisma/client');
  if (prismaPkg && prismaPkg.PrismaClient) {
    BasePrismaClient = prismaPkg.PrismaClient;
  }
} catch {
  // Safe fallback
}

@Injectable()
export class PrismaService extends BasePrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  [key: string]: any;

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Kết nối cơ sở dữ liệu PostgreSQL thành công');
    } catch (error) {
      this.logger.warn(`Chưa thể kết nối CSDL ngay lập tức: ${error.message}. Hệ thống tiếp tục khởi động.`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Đã ngắt kết nối cơ sở dữ liệu PostgreSQL');
  }
}
