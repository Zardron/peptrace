export type TenantMembershipCandidate = {
    id: string | null;
    isActive: boolean;
    role: string;
    tenant: {
        id: string;
        name: string;
        slug: string;
    };
};
export type TenantMembershipSummary = {
    id: string;
    name: string;
    role: string;
    slug: string;
    membershipId: string | null;
};
export declare const toTenantMembershipSummary: (membership: TenantMembershipCandidate) => TenantMembershipSummary;
export declare const getActiveTenantMemberships: (memberships: TenantMembershipCandidate[]) => TenantMembershipCandidate[];
export declare const selectTenantMembership: (memberships: TenantMembershipCandidate[], requestedTenant: string | null | undefined) => TenantMembershipCandidate | null;
export declare const hasTenantMembership: (memberships: TenantMembershipCandidate[], requestedTenant: string) => boolean;
