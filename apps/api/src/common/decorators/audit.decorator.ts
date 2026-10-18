import { SetMetadata } from '@nestjs/common';
import { AuditAction } from '../enums';

export interface AuditMetadataOptions {
  action: AuditAction;
  entityName: string;
  reasonField?: string; // Tên trường trong body chứa lý do (ví dụ: 'reason', 'justification')
}

export const AUDIT_METADATA_KEY = 'audit_metadata';
export const Audit = (options: AuditMetadataOptions) => SetMetadata(AUDIT_METADATA_KEY, options);
