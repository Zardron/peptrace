import assert from "node:assert/strict";
import test from "node:test";
import {
  getActiveTenantMemberships,
  hasTenantMembership,
  selectTenantMembership,
  toTenantMembershipSummary,
  type TenantMembershipCandidate
} from "../src/modules/auth/tenant-membership.policy";

const memberships: TenantMembershipCandidate[] = [
  {
    id: "membership-peptrace",
    isActive: true,
    role: "owner",
    tenant: {
      id: "client-peptrace",
      name: "Peptrace",
      slug: "peptrace"
    }
  },
  {
    id: "membership-shamstay",
    isActive: true,
    role: "admin",
    tenant: {
      id: "client-shamstay-bnb",
      name: "Shamstay BnB",
      slug: "shamstay-bnb"
    }
  },
  {
    id: "membership-disabled",
    isActive: false,
    role: "owner",
    tenant: {
      id: "client-disabled",
      name: "Disabled Client",
      slug: "disabled-client"
    }
  }
];

test("selectTenantMembership selects an explicit tenant by id or slug", () => {
  assert.equal(selectTenantMembership(memberships, "client-peptrace")?.tenant.slug, "peptrace");
  assert.equal(selectTenantMembership(memberships, "shamstay-bnb")?.tenant.id, "client-shamstay-bnb");
});

test("selectTenantMembership rejects inactive and unknown tenant selections", () => {
  assert.equal(selectTenantMembership(memberships, "disabled-client"), null);
  assert.equal(selectTenantMembership(memberships, "client-spoofed"), null);
});

test("selectTenantMembership defaults to the first active membership sorted by tenant name", () => {
  assert.equal(selectTenantMembership(memberships, undefined)?.tenant.slug, "peptrace");
});

test("active membership helpers only expose tenant-scoped active memberships", () => {
  assert.deepEqual(
    getActiveTenantMemberships(memberships).map((membership) => membership.tenant.slug),
    ["peptrace", "shamstay-bnb"]
  );
  assert.equal(hasTenantMembership(memberships, "peptrace"), true);
  assert.equal(hasTenantMembership(memberships, "disabled-client"), false);
});

test("membership summaries carry tenant-level role, not a trusted frontend value", () => {
  assert.deepEqual(toTenantMembershipSummary(memberships[1]!), {
    id: "client-shamstay-bnb",
    membershipId: "membership-shamstay",
    name: "Shamstay BnB",
    role: "admin",
    slug: "shamstay-bnb"
  });
});
