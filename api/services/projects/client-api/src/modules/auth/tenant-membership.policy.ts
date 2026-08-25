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

export const toTenantMembershipSummary = (
  membership: TenantMembershipCandidate
): TenantMembershipSummary => ({
  id: membership.tenant.id,
  membershipId: membership.id,
  name: membership.tenant.name,
  role: membership.role,
  slug: membership.tenant.slug
});

export const getActiveTenantMemberships = (
  memberships: TenantMembershipCandidate[]
): TenantMembershipCandidate[] =>
  memberships
    .filter((membership) => membership.isActive)
    .sort((left, right) => left.tenant.name.localeCompare(right.tenant.name));

export const selectTenantMembership = (
  memberships: TenantMembershipCandidate[],
  requestedTenant: string | null | undefined
): TenantMembershipCandidate | null => {
  const activeMemberships = getActiveTenantMemberships(memberships);
  const requested = requestedTenant?.trim().toLowerCase();

  if (requested) {
    return (
      activeMemberships.find(
        (membership) =>
          membership.tenant.id.toLowerCase() === requested ||
          membership.tenant.slug.toLowerCase() === requested
      ) ?? null
    );
  }

  return activeMemberships[0] ?? null;
};

export const hasTenantMembership = (
  memberships: TenantMembershipCandidate[],
  requestedTenant: string
): boolean => selectTenantMembership(memberships, requestedTenant) !== null;
