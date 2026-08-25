export const TESTING_STATUSES = ["PENDING", "IN_REVIEW", "COMPLETE", "FAILED", "RETEST_REQUESTED"] as const;
export const ASSAYS = ["LC-MS", "HPLC", "NMR", "Sterility"] as const;
export const PRIORITIES = ["High", "Medium", "Low"] as const;
export const ACCESS_STATUSES = ["Granted", "Pending", "Paused"] as const;
export const TENANT_STATUSES = ["Healthy", "Watch", "At risk"] as const;
export const DATA_REGIONS = ["US", "EU", "UAE", "Syria"] as const;
