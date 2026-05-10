import { BaseCrudService } from '../services/base.service.js';
export class BaseCrudController {
    resource;
    service;
    constructor(resource) {
        this.resource = resource;
        this.service = new BaseCrudService({ model: resource.model });
    }
    getHookContext(req) {
        return {
            userId: req.user?.id,
            userRole: req.user?.role,
        };
    }
    /**
     * Optional authorizeAccess hook replaces default ownership checks when present.
     */
    async enforceAccess(req, reply, existing, operation) {
        const user = req.user;
        const authorize = this.resource.customHooks?.authorizeAccess;
        if (authorize) {
            try {
                await authorize(existing, this.getHookContext(req), operation);
            }
            catch (err) {
                if (err instanceof Error && err.message === 'Forbidden') {
                    reply.code(403).send({ error: 'Forbidden' });
                    return false;
                }
                throw err;
            }
            return true;
        }
        if (this.resource.ownership?.enabled && user && user.role !== 'ADMIN') {
            const resourceId = existing.id;
            const canAccess = await this.service.canUserAccess(user.id, resourceId, this.resource.ownership.relationPath);
            if (!canAccess) {
                const msg = operation === 'read'
                    ? 'You do not have permission to view this resource'
                    : operation === 'update'
                        ? 'You do not have permission to update this resource'
                        : 'You do not have permission to delete this resource';
                reply.code(403).send({ error: msg });
                return false;
            }
        }
        return true;
    }
    async create(req, reply) {
        try {
            // Validate input
            const input = this.resource.schemas.create.parse(req.body);
            // Before hook - wrap in try-catch to handle authorization errors
            let processedInput;
            try {
                processedInput = this.resource.customHooks?.beforeCreate
                    ? await this.resource.customHooks.beforeCreate(input, this.getHookContext(req))
                    : input;
            }
            catch (hookError) {
                // All beforeCreate hook errors are authorization/business rule violations
                if (hookError instanceof Error) {
                    return reply.code(403).send({ error: hookError.message });
                }
                throw hookError;
            }
            // Check if hook already handled creation (e.g., complex business logic)
            let result;
            if (processedInput && typeof processedInput === 'object' && '_skipCreate' in processedInput) {
                // Hook already created the resource, use the provided result
                result = processedInput._result;
            }
            else {
                // Create resource normally
                result = await this.service.create(processedInput);
            }
            // After hook
            if (this.resource.customHooks?.afterCreate) {
                await this.resource.customHooks.afterCreate(result, this.getHookContext(req));
            }
            req.log.info({
                event: `${this.resource.name}_created`,
                resourceId: result.id,
                userId: req.user?.id,
            }, `${this.resource.name} created`);
            return reply.code(201).send(result);
        }
        catch (error) {
            return this.handleError(error, reply);
        }
    }
    async findById(req, reply) {
        try {
            const { id } = req.params;
            let result = await this.service.findById(id);
            if (!result) {
                return reply.code(404).send({
                    error: `${this.resource.name} not found`
                });
            }
            const allowed = await this.enforceAccess(req, reply, result, 'read');
            if (!allowed) {
                return;
            }
            // After read hook
            if (this.resource.customHooks?.afterRead) {
                result = await this.resource.customHooks.afterRead(result, this.getHookContext(req));
            }
            return reply.send(result);
        }
        catch (error) {
            return this.handleError(error, reply);
        }
    }
    async list(req, reply) {
        try {
            // Parse query params
            const querySchema = this.resource.schemas.query;
            const query = querySchema ? querySchema.parse(req.query) : req.query;
            const page = query.page || 1;
            const limit = query.limit || 20;
            // Extract filters from query
            const originalFilters = query.filters || {};
            let prismaFilters = originalFilters;
            const orderBy = query.orderBy;
            if (this.resource.customHooks?.beforeList) {
                prismaFilters = await this.resource.customHooks.beforeList(originalFilters, this.getHookContext(req));
            }
            // Build find params
            let result = await this.service.findMany({
                skip: (page - 1) * limit,
                take: limit,
                where: prismaFilters,
                orderBy: orderBy || { createdAt: 'desc' },
            });
            // After list hook (pass ORIGINAL filters with location params)
            if (this.resource.customHooks?.afterList) {
                const hookContext = {
                    ...this.getHookContext(req),
                    filters: originalFilters, // Pass original filters with location params
                    page,
                    limit,
                    orderBy: orderBy || { createdAt: 'desc' },
                };
                const modifiedResult = await this.resource.customHooks.afterList(result, hookContext);
                if (modifiedResult) {
                    result = modifiedResult;
                }
            }
            return reply.send({
                data: result.data,
                total: result.total,
                page,
                limit,
            });
        }
        catch (error) {
            return this.handleError(error, reply);
        }
    }
    async update(req, reply) {
        try {
            const { id } = req.params;
            const user = req.user;
            // Check if resource exists
            const existing = await this.service.findById(id);
            if (!existing) {
                return reply.code(404).send({
                    error: `${this.resource.name} not found`
                });
            }
            const allowedUpdate = await this.enforceAccess(req, reply, existing, 'update');
            if (!allowedUpdate) {
                return;
            }
            // Validate input
            const input = this.resource.schemas.update.parse(req.body);
            // Before hook
            let processedInput;
            try {
                processedInput = this.resource.customHooks?.beforeUpdate
                    ? await this.resource.customHooks.beforeUpdate(id, input, this.getHookContext(req))
                    : input;
            }
            catch (hookError) {
                // All beforeUpdate hook errors are authorization/business rule violations
                if (hookError instanceof Error) {
                    return reply.code(403).send({ error: hookError.message });
                }
                throw hookError;
            }
            // Update resource
            const result = await this.service.update(id, processedInput);
            // After hook
            if (this.resource.customHooks?.afterUpdate) {
                await this.resource.customHooks.afterUpdate(result, this.getHookContext(req));
            }
            req.log.info({
                event: `${this.resource.name}_updated`,
                resourceId: id,
                userId: user.id,
            }, `${this.resource.name} updated`);
            return reply.send(result);
        }
        catch (error) {
            return this.handleError(error, reply, 'update');
        }
    }
    async delete(req, reply) {
        try {
            const { id } = req.params;
            const user = req.user;
            // Check if resource exists
            const existing = await this.service.findById(id);
            if (!existing) {
                return reply.code(404).send({
                    error: `${this.resource.name} not found`
                });
            }
            const allowedDelete = await this.enforceAccess(req, reply, existing, 'delete');
            if (!allowedDelete) {
                return;
            }
            // Before hook
            if (this.resource.customHooks?.beforeDelete) {
                try {
                    await this.resource.customHooks.beforeDelete(id, this.getHookContext(req));
                }
                catch (hookError) {
                    if (hookError instanceof Error) {
                        return reply.code(403).send({ error: hookError.message });
                    }
                    throw hookError;
                }
            }
            // Delete resource
            await this.service.delete(id);
            // After hook
            if (this.resource.customHooks?.afterDelete) {
                await this.resource.customHooks.afterDelete(id, this.getHookContext(req));
            }
            req.log.info({
                event: `${this.resource.name}_deleted`,
                resourceId: id,
                userId: user.id,
            }, `${this.resource.name} deleted`);
            return reply.code(204).send();
        }
        catch (error) {
            return this.handleError(error, reply, 'delete');
        }
    }
    handleError(error, reply, operation) {
        if (error instanceof Error && error.message === 'Forbidden') {
            return reply.code(403).send({ error: 'Forbidden' });
        }
        if (error instanceof Error &&
            (error.message === 'Assignee must be a rider' ||
                error.message === 'Assignee must be an active store driver' ||
                error.message === 'You cannot assign deliveries for this store' ||
                error.message === 'Store is not ready to publish')) {
            return reply.code(400).send({ error: error.message });
        }
        // Zod validation error
        if (error && typeof error === 'object' && 'issues' in error) {
            return reply.code(400).send({
                error: 'Validation error',
                issues: error.issues,
            });
        }
        // Prisma errors
        if (error && typeof error === 'object' && 'code' in error) {
            const prismaError = error;
            // Unique constraint violation
            if (prismaError.code === 'P2002') {
                return reply.code(409).send({
                    error: 'Resource already exists',
                    field: prismaError.meta?.target?.[0],
                });
            }
            // Record not found
            if (prismaError.code === 'P2025') {
                return reply.code(404).send({
                    error: `${this.resource.name} not found`,
                });
            }
            // Foreign key constraint
            if (prismaError.code === 'P2003') {
                return reply.code(400).send({
                    error: 'Invalid reference',
                    field: prismaError.meta?.field_name,
                });
            }
        }
        // Re-throw unknown errors
        throw error;
    }
}
