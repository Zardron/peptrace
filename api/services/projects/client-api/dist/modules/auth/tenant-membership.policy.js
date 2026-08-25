"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasTenantMembership = exports.selectTenantMembership = exports.getActiveTenantMemberships = exports.toTenantMembershipSummary = void 0;
const toTenantMembershipSummary = (membership) => ({
    id: membership.tenant.id,
    membershipId: membership.id,
    name: membership.tenant.name,
    role: membership.role,
    slug: membership.tenant.slug
});
exports.toTenantMembershipSummary = toTenantMembershipSummary;
const getActiveTenantMemberships = (memberships) => memberships
    .filter((membership) => membership.isActive)
    .sort((left, right) => left.tenant.name.localeCompare(right.tenant.name));
exports.getActiveTenantMemberships = getActiveTenantMemberships;
const selectTenantMembership = (memberships, requestedTenant) => {
    const activeMemberships = (0, exports.getActiveTenantMemberships)(memberships);
    const requested = requestedTenant?.trim().toLowerCase();
    if (requested) {
        return (activeMemberships.find((membership) => membership.tenant.id.toLowerCase() === requested ||
            membership.tenant.slug.toLowerCase() === requested) ?? null);
    }
    return activeMemberships[0] ?? null;
};
exports.selectTenantMembership = selectTenantMembership;
const hasTenantMembership = (memberships, requestedTenant) => (0, exports.selectTenantMembership)(memberships, requestedTenant) !== null;
exports.hasTenantMembership = hasTenantMembership;
//# sourceMappingURL=tenant-membership.policy.js.map