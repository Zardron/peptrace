export type UUID = string;
export type ISODateTime = string;

export type TestingStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "COMPLETE"
  | "FAILED"
  | "RETEST_REQUESTED";

export interface LabTest {
  id: UUID;
  labId: UUID;
  vialSizeMg: number;
  vendorId: UUID;
  resultsReleasedAt: ISODateTime | null;
  testingStatus: TestingStatus;
  peptideId: UUID;
  assay: "LC-MS" | "HPLC" | "NMR" | "Sterility";
  purityPercent: number | null;
  labelClaimPercent: number | null;
}

export interface LabTestSummary {
  id: UUID;
  labId: UUID;
  vialSizeMg: number;
  vendorId: UUID;
  resultsReleasedAt: ISODateTime | null;
  testingStatus: TestingStatus;
}

export interface VendorProduct {
  id: UUID;
  label: string;
  slug: string;
  peptideId: UUID;
  priceMg: number;
  rating: number;
  doseMg: number;
  purityPercent: number;
  labelAccuracyDelta: number;
  testsCount: number;
}

export interface Vendor {
  id: UUID;
  displayName: string;
  slug: string;
  overallRating: number;
  products: VendorProduct[];
}

export interface Peptide {
  id: UUID;
  label: string;
  slug: string;
  tests: LabTestSummary[];
}

export interface Lab {
  id: UUID;
  displayName: string;
  slug: string;
  partnerSince: ISODateTime;
  tests: UUID[];
}

export interface ApiSurface {
  group: string;
  routes: string[];
  owner: "Auth" | "Catalog" | "Quality" | "Access";
  readiness: "Scoped" | "Draft" | "Needs policy";
}

export interface AccountWorkItem {
  id: UUID;
  account: string;
  kind:
    | "API key"
    | "Guest operations"
    | "Lab review"
    | "Lead routing"
    | "Listing review"
    | "Vendor onboarding";
  priority: "High" | "Medium" | "Low";
  dueAt: ISODateTime;
}

export interface ClientTenant {
  id: UUID;
  name: string;
  slug: string;
  accessStatus: "Granted" | "Pending" | "Paused";
  status: "Healthy" | "Watch" | "At risk";
  owner: string;
  enabledAccounts: number;
  operationalValue: number;
  openItems: number;
  dataRegion: "US" | "EU" | "UAE" | "Syria";
  lastActivityAt: ISODateTime;
}

export const labTests: LabTest[] = [
  {
    id: "test-retatrutide-001",
    labId: "lab-creative-biolabs",
    vialSizeMg: 100,
    vendorId: "vendor-peptide-partners",
    resultsReleasedAt: "2026-07-28T10:00:00Z",
    testingStatus: "COMPLETE",
    peptideId: "peptide-retatrutide",
    assay: "LC-MS",
    purityPercent: 99.5,
    labelClaimPercent: 99.8
  },
  {
    id: "test-semaglutide-014",
    labId: "lab-chromatech",
    vialSizeMg: 50,
    vendorId: "vendor-amino-forge",
    resultsReleasedAt: "2026-08-06T16:30:00Z",
    testingStatus: "IN_REVIEW",
    peptideId: "peptide-semaglutide",
    assay: "HPLC",
    purityPercent: 98.7,
    labelClaimPercent: 99.1
  },
  {
    id: "test-tirzepatide-023",
    labId: "lab-apex-analytical",
    vialSizeMg: 75,
    vendorId: "vendor-northstar-peptides",
    resultsReleasedAt: null,
    testingStatus: "PENDING",
    peptideId: "peptide-tirzepatide",
    assay: "LC-MS",
    purityPercent: null,
    labelClaimPercent: null
  },
  {
    id: "test-bpc157-009",
    labId: "lab-creative-biolabs",
    vialSizeMg: 25,
    vendorId: "vendor-peptide-partners",
    resultsReleasedAt: "2026-07-31T12:45:00Z",
    testingStatus: "RETEST_REQUESTED",
    peptideId: "peptide-bpc-157",
    assay: "Sterility",
    purityPercent: 96.8,
    labelClaimPercent: 101.3
  }
];

const toTestSummary = (test: LabTest): LabTestSummary => ({
  id: test.id,
  labId: test.labId,
  vialSizeMg: test.vialSizeMg,
  vendorId: test.vendorId,
  resultsReleasedAt: test.resultsReleasedAt,
  testingStatus: test.testingStatus
});

export const peptides: Peptide[] = [
  {
    id: "peptide-retatrutide",
    label: "Retatrutide",
    slug: "retatrutide",
    tests: labTests.filter((test) => test.peptideId === "peptide-retatrutide").map(toTestSummary)
  },
  {
    id: "peptide-semaglutide",
    label: "Semaglutide",
    slug: "semaglutide",
    tests: labTests.filter((test) => test.peptideId === "peptide-semaglutide").map(toTestSummary)
  },
  {
    id: "peptide-tirzepatide",
    label: "Tirzepatide",
    slug: "tirzepatide",
    tests: labTests.filter((test) => test.peptideId === "peptide-tirzepatide").map(toTestSummary)
  },
  {
    id: "peptide-bpc-157",
    label: "BPC-157",
    slug: "bpc-157",
    tests: labTests.filter((test) => test.peptideId === "peptide-bpc-157").map(toTestSummary)
  }
];

export const vendors: Vendor[] = [
  {
    id: "vendor-peptide-partners",
    displayName: "Peptide Partners",
    slug: "peptide-partners",
    overallRating: 0.98,
    products: [
      {
        id: "product-retatrutide-pp",
        label: "Retatrutide",
        slug: "retatrutide",
        peptideId: "peptide-retatrutide",
        priceMg: 4.85,
        rating: 0.92,
        doseMg: 0.35,
        purityPercent: 99.5,
        labelAccuracyDelta: 0.2,
        testsCount: 142
      },
      {
        id: "product-bpc157-pp",
        label: "BPC-157",
        slug: "bpc-157",
        peptideId: "peptide-bpc-157",
        priceMg: 2.1,
        rating: 0.81,
        doseMg: 0.25,
        purityPercent: 96.8,
        labelAccuracyDelta: 1.3,
        testsCount: 47
      }
    ]
  },
  {
    id: "vendor-amino-forge",
    displayName: "AminoForge",
    slug: "amino-forge",
    overallRating: 0.91,
    products: [
      {
        id: "product-semaglutide-af",
        label: "Semaglutide",
        slug: "semaglutide",
        peptideId: "peptide-semaglutide",
        priceMg: 3.45,
        rating: 0.88,
        doseMg: 0.5,
        purityPercent: 98.7,
        labelAccuracyDelta: 0.4,
        testsCount: 84
      }
    ]
  },
  {
    id: "vendor-northstar-peptides",
    displayName: "Northstar Peptides",
    slug: "northstar-peptides",
    overallRating: 0.86,
    products: [
      {
        id: "product-tirzepatide-ns",
        label: "Tirzepatide",
        slug: "tirzepatide",
        peptideId: "peptide-tirzepatide",
        priceMg: 5.2,
        rating: 0.79,
        doseMg: 0.75,
        purityPercent: 97.4,
        labelAccuracyDelta: 0.8,
        testsCount: 61
      }
    ]
  }
];

export const labs: Lab[] = [
  {
    id: "lab-creative-biolabs",
    displayName: "Creative Biolabs",
    slug: "creative-biolabs",
    partnerSince: "2025-02-11T00:00:00Z",
    tests: labTests
      .filter((test) => test.labId === "lab-creative-biolabs")
      .map((test) => test.id)
  },
  {
    id: "lab-chromatech",
    displayName: "Chromatech",
    slug: "chromatech",
    partnerSince: "2025-09-18T00:00:00Z",
    tests: labTests.filter((test) => test.labId === "lab-chromatech").map((test) => test.id)
  },
  {
    id: "lab-apex-analytical",
    displayName: "Apex Analytical",
    slug: "apex-analytical",
    partnerSince: "2026-01-22T00:00:00Z",
    tests: labTests.filter((test) => test.labId === "lab-apex-analytical").map((test) => test.id)
  }
];

export const apiSurfaces: ApiSurface[] = [
  {
    group: "Authentication",
    routes: ["/auth/login", "/auth/register", "/auth/refresh"],
    owner: "Auth",
    readiness: "Scoped"
  },
  {
    group: "Vendor catalog",
    routes: ["/vendors", "/vendor/:id"],
    owner: "Catalog",
    readiness: "Scoped"
  },
  {
    group: "Peptide catalog",
    routes: ["/peptides", "/peptide/:id"],
    owner: "Catalog",
    readiness: "Scoped"
  },
  {
    group: "Lab testing",
    routes: ["/testing", "/testing/:id"],
    owner: "Quality",
    readiness: "Draft"
  },
  {
    group: "Account settings",
    routes: ["/account/profile", "/account/security"],
    owner: "Auth",
    readiness: "Draft"
  },
];

export const accountWorkItems: AccountWorkItem[] = [
  {
    id: "work-api-key-001",
    account: "Peptrace",
    kind: "API key",
    priority: "High",
    dueAt: "2026-08-11T15:00:00Z"
  },
  {
    id: "work-guest-ops-014",
    account: "Shamstay BnB",
    kind: "Guest operations",
    priority: "Medium",
    dueAt: "2026-08-12T18:30:00Z"
  },
  {
    id: "work-listing-review-009",
    account: "Sham Real Estate Hub",
    kind: "Listing review",
    priority: "Medium",
    dueAt: "2026-08-15T12:00:00Z"
  },
  {
    id: "work-lead-routing-003",
    account: "Sham Real Estate Hub",
    kind: "Lead routing",
    priority: "Low",
    dueAt: "2026-08-18T09:00:00Z"
  }
];

export const clientTenants: ClientTenant[] = [
  {
    id: "client-peptrace",
    name: "Peptrace",
    slug: "peptrace",
    accessStatus: "Granted",
    status: "Healthy",
    owner: "Platform operations",
    enabledAccounts: 18,
    operationalValue: 16200,
    openItems: 1,
    dataRegion: "US",
    lastActivityAt: "2026-08-10T15:18:00Z"
  },
  {
    id: "client-shamstay-bnb",
    name: "Shamstay BnB",
    slug: "shamstay-bnb",
    accessStatus: "Granted",
    status: "Healthy",
    owner: "Hospitality success",
    enabledAccounts: 12,
    operationalValue: 8200,
    openItems: 4,
    dataRegion: "Syria",
    lastActivityAt: "2026-08-10T11:42:00Z"
  },
  {
    id: "client-sham-real-estate-hub",
    name: "Sham Real Estate Hub",
    slug: "sham-real-estate-hub",
    accessStatus: "Granted",
    status: "Watch",
    owner: "Real estate success",
    enabledAccounts: 16,
    operationalValue: 32600000,
    openItems: 4,
    dataRegion: "Syria",
    lastActivityAt: "2026-08-09T21:06:00Z"
  }
];

export const getPeptideLabel = (peptideId: UUID): string =>
  peptides.find((peptide) => peptide.id === peptideId)?.label ?? "Unknown peptide";

export const getVendorName = (vendorId: UUID): string =>
  vendors.find((vendor) => vendor.id === vendorId)?.displayName ?? "Unknown vendor";

export const getLabName = (labId: UUID): string =>
  labs.find((lab) => lab.id === labId)?.displayName ?? "Unknown lab";

export const formatScore = (score: number): string => `${Math.round(score * 100)}%`;

export const dashboardMetrics = {
  clients: clientTenants.length,
  vendors: vendors.length,
  peptides: peptides.length,
  completeTests: labTests.filter((test) => test.testingStatus === "COMPLETE").length,
  openReviews: labTests.filter((test) => test.testingStatus !== "COMPLETE").length,
  testsInReview: labTests.filter((test) => test.testingStatus === "IN_REVIEW").length,
  retestRequests: labTests.filter((test) => test.testingStatus === "RETEST_REQUESTED").length,
  apiReady: apiSurfaces.filter((surface) => surface.readiness === "Scoped").length,
  averageVendorRating:
    vendors.reduce((total, vendor) => total + vendor.overallRating, 0) / vendors.length
};
