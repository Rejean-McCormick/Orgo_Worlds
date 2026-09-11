import { Inject } from '@nestjs/common';
import {
  ArgumentsHost,
  CallHandler,
  CanActivate,
  Catch,
  createParamDecorator,
  ExceptionFilter,
  ExecutionContext as NestContext,
  Injectable,
  NestInterceptor,
  SetMetadata,
  HttpException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { Observable, map } from 'rxjs';
import { DomainError, ExecutionContext } from '../../../platform/contracts';
import { IdentityService } from '../../../modules/identity/identity.service';
import { WorldsService } from '../../../modules/worlds/worlds.service';

export const Public = () => SetMetadata('orgo.public', true);
type ContextRequest = Request & { orgoContext?: ExecutionContext };
export const Ctx = createParamDecorator(
  (_data: unknown, host: NestContext) =>
    host.switchToHttp().getRequest<ContextRequest>().orgoContext,
);
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(IdentityService) private readonly identity: IdentityService,
    @Inject(WorldsService) private readonly worlds: WorldsService,
  ) {}
  async canActivate(host: NestContext) {
    if (
      this.reflector.getAllAndOverride<boolean>('orgo.public', [
        host.getHandler(),
        host.getClass(),
      ])
    )
      return true;
    const req = host.switchToHttp().getRequest<ContextRequest>();
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith('Bearer ') || authorization.length > 500)
      throw new DomainError('UNAUTHENTICATED', 'Bearer token required', 401);
    const identityContext = await this.identity.authenticate(authorization.slice(7), {
      organization: req.get('X-Organization-ID'),
      correlation: req.get('X-Correlation-ID'),
      idempotency: req.get('Idempotency-Key'),
    });
    const requestedWorld = req.get('X-Orgo-World')?.trim().toLowerCase() || null;
    const runtime = await this.worlds.resolve(identityContext, requestedWorld);
    const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase());
    const logout = /\/auth\/logout(?:\?|$)/.test(req.url);
    if (requestedWorld && runtime.worldRole === 'viewer' && !safeMethod && !logout)
      throw new DomainError(
        'WORLD_READ_ONLY',
        'Viewer membership is read-only in this World',
        403,
      );
    req.orgoContext = { ...identityContext, ...runtime };
    const response = host.switchToHttp().getResponse<Response>();
    response.setHeader('X-Correlation-ID', req.orgoContext.correlationId);
    response.setHeader('X-Orgo-World', runtime.worldKey);
    response.setHeader('X-Orgo-World-Release', String(runtime.worldReleaseNumber));
    response.setHeader('X-Orgo-World-Release-ID', runtime.worldReleaseId);
    return true;
  }
}
@Injectable()
export class Envelope implements NestInterceptor {
  intercept(_host: NestContext, next: CallHandler): Observable<unknown> {
    return next
      .handle()
      .pipe(map((data) => ({ ok: true, data: data ?? null, error: null })));
  }
}
@Catch()
export class Errors implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    let status = 500,
      code = 'INTERNAL_ERROR',
      message = 'An internal error occurred',
      details: unknown = {};
    if (error instanceof DomainError) {
      status = error.status;
      code = error.code;
      message = error.message;
      details = error.details;
    } else if (error instanceof HttpException) {
      status = error.getStatus();
      code = `HTTP_${status}`;
      message = error.message;
    } else if (typeof error === 'object' && error && 'code' in error) {
      if (error.code === 'P2002') {
        status = 409;
        code = 'CONFLICT';
        message = 'Record already exists';
      }
      if (error.code === 'P2003') {
        status = 409;
        code = 'REFERENCE_CONFLICT';
        message = 'Invalid or referenced record';
      }
      if (error.code === 'P2025') {
        status = 404;
        code = 'NOT_FOUND';
        message = 'Record not found';
      }
    }
    const req = host.switchToHttp().getRequest<ContextRequest>();
    if (status >= 500)
      console.error(
        JSON.stringify({
          event: 'http.failure',
          correlation_id: req.orgoContext?.correlationId,
          code,
        }),
      );
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(status)
      .json({ ok: false, data: null, error: { code, message, details } });
  }
}
