import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ResourceDefinition, HookContext } from '@packages/schemas';
import { BaseCrudService } from '../services/base.service.js';
export interface AuthenticatedRequest extends FastifyRequest {
    user?: {
        id: string;
        role: 'USER' | 'VENDOR' | 'ADMIN' | 'AFFILIATE' | 'RIDER' | 'STAFF';
        email: string;
        name: string | null;
        phone: string | null;
        suspendedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    };
}
export declare class BaseCrudController {
    protected resource: ResourceDefinition;
    protected service: BaseCrudService;
    constructor(resource: ResourceDefinition);
    protected getHookContext(req: AuthenticatedRequest): HookContext;
    /**
     * Optional authorizeAccess hook replaces default ownership checks when present.
     */
    protected enforceAccess(req: AuthenticatedRequest, reply: FastifyReply, existing: unknown, operation: 'read' | 'update' | 'delete'): Promise<boolean>;
    create(req: AuthenticatedRequest, reply: FastifyReply): Promise<never>;
    findById(req: AuthenticatedRequest, reply: FastifyReply): Promise<undefined>;
    list(req: AuthenticatedRequest, reply: FastifyReply): Promise<never>;
    update(req: AuthenticatedRequest, reply: FastifyReply): Promise<undefined>;
    delete(req: AuthenticatedRequest, reply: FastifyReply): Promise<undefined>;
    protected handleError(error: unknown, reply: FastifyReply, operation?: string): FastifyReply<import("fastify").RawServerDefault, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, import("fastify").RouteGenericInterface, unknown, import("fastify").FastifySchema, import("fastify").FastifyTypeProviderDefault, unknown>;
}
//# sourceMappingURL=base.controller.d.ts.map