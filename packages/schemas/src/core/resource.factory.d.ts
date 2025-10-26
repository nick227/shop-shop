import type { ResourceDefinition, ResourceOperations, CrudOperation, Role } from './types.js';
export declare function defineResource(config: Omit<ResourceDefinition, 'path'> & {
    path?: string;
}): ResourceDefinition;
export declare function getResourceOperations(resource: ResourceDefinition): ResourceOperations;
export declare function getRequiredRoles(resource: ResourceDefinition, operation: CrudOperation): Role[];
export declare function requiresAuthentication(resource: ResourceDefinition, operation: CrudOperation): boolean;
export declare function validateResourceDefinition(resource: ResourceDefinition): void;
//# sourceMappingURL=resource.factory.d.ts.map