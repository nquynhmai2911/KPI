import { SetMetadata } from '@nestjs/common';
import { DataScopeType } from '../enums';

export const DATA_SCOPE_KEY = 'data_scope';
export const RequireDataScope = (scope: DataScopeType) => SetMetadata(DATA_SCOPE_KEY, scope);
