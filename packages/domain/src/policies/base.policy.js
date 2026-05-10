// ========================================
// Base Policy Interface
// Authorization logic for domain resources
// ========================================
/**
 * Helper to convert policy result to exception
 */
export function enforcePolicy(result) {
    if (result !== true) {
        throw new Error(typeof result === 'string' ? result : 'Access denied');
    }
}
