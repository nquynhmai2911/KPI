import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditAction } from '../enums';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { AUDIT_METADATA_KEY, AuditMetadataOptions } from '../decorators/audit.decorator';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditOptions = this.reflector.getAllAndOverride<AuditMetadataOptions>(
      AUDIT_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Chỉ tự động ghi log cho các hành động thay đổi dữ liệu (POST, PUT, PATCH, DELETE) hoặc có decorator @Audit
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    if (!auditOptions && !isMutation) {
      return next.handle();
    }

    const user = request.user;
    const ipAddress = request.ip || request.headers['x-forwarded-for'] || request.socket.remoteAddress;
    const userAgent = request.headers['user-agent'] || null;

    // Lấy lý do thay đổi từ header x-audit-reason hoặc trong request body
    const reason =
      request.headers['x-audit-reason'] ||
      request.body?.reason ||
      request.body?.justification ||
      request.body?.quotaOverrideReason ||
      null;

    const action: AuditAction =
      auditOptions?.action ||
      (method === 'POST' ? AuditAction.CREATE : method === 'DELETE' ? AuditAction.DELETE : AuditAction.UPDATE);

    const entityName =
      auditOptions?.entityName ||
      request.route?.path?.split('/')?.[3] || // vd: /api/v1/evaluations -> evaluations
      'SystemEntity';

    const entityId = request.params?.id || request.body?.id || 'GLOBAL';

    return next.handle().pipe(
      tap({
        next: async (responseData) => {
          try {
            await this.prisma.auditLog.create({
              data: {
                userId: user?.id || null,
                username: user?.username || 'SYSTEM_ANONYMOUS',
                action,
                entityName,
                entityId: String(entityId),
                oldValues: request.body?.oldSnapshot || null,
                newValues: responseData ? JSON.parse(JSON.stringify(responseData)) : null,
                reason: reason ? String(reason) : null,
                ipAddress: typeof ipAddress === 'string' ? ipAddress : null,
                userAgent: typeof userAgent === 'string' ? userAgent : null,
              },
            });
          } catch (logErr) {
            this.logger.error(`Lỗi khi lưu Audit Log: ${logErr.message}`, logErr.stack);
          }
        },
      }),
    );
  }
}
