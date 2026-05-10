import { prisma } from '../client.js';
export class BaseCrudService {
    config;
    modelDelegate;
    constructor(config) {
        this.config = config;
        // Dynamic model access from prisma client
        const modelKey = config.model.charAt(0).toLowerCase() + config.model.slice(1);
        this.modelDelegate = prisma[modelKey];
        if (!this.modelDelegate) {
            throw new Error(`Prisma model not found: ${config.model}`);
        }
    }
    async create(data) {
        return this.modelDelegate.create({ data });
    }
    async findById(id, include) {
        return this.modelDelegate.findUnique({
            where: { id },
            include
        });
    }
    async findMany(params) {
        const { where, skip, take, orderBy, include } = params;
        const [data, total] = await Promise.all([
            this.modelDelegate.findMany({
                where,
                skip,
                take,
                orderBy,
                include,
            }),
            this.modelDelegate.count({ where }),
        ]);
        return { data, total };
    }
    async update(id, data) {
        return this.modelDelegate.update({
            where: { id },
            data,
        });
    }
    async delete(id) {
        await this.modelDelegate.delete({
            where: { id }
        });
    }
    /**
     * Check if user owns/can access a resource
     * @param userId - User ID to check
     * @param resourceId - Resource ID
     * @param relationPath - Path to owner field (e.g., 'ownerUserId' or 'store.ownerUserId')
     */
    async canUserAccess(userId, resourceId, relationPath) {
        if (!relationPath)
            return false;
        const resource = await this.findById(resourceId, this.getIncludeFromPath(relationPath));
        if (!resource)
            return false;
        // Navigate relation path to find owner ID
        const ownerId = this.getValueFromPath(resource, relationPath);
        return ownerId === userId;
    }
    getIncludeFromPath(relationPath) {
        // If path contains '.', need to include relation
        // e.g., 'store.ownerUserId' → { include: { store: true } }
        const parts = relationPath.split('.');
        if (parts.length === 1)
            return undefined;
        return { [parts[0]]: true };
    }
    getValueFromPath(obj, path) {
        const keys = path.split('.');
        let current = obj;
        for (const key of keys) {
            if (current === null || current === undefined)
                return undefined;
            current = current[key];
        }
        return current;
    }
}
