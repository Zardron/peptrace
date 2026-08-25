export { adminPanelServices } from "./admin-panel/index.js";
export { projectServices } from "./projects/index.js";
export {
  sharedUserbaseServices,
  sharedUserbaseBoundaries,
} from "./shared-userbase/index.js";

export const serviceAreas = [
  {
    id: "projects",
    label: "Projects",
    root: "api/services/projects",
    description: "Project-facing APIs and product-specific service modules.",
  },
  {
    id: "admin-panel",
    label: "Admin panel",
    root: "api/services/admin-panel",
    description: "Admin panel APIs, platform operations, and tenant management.",
  },
  {
    id: "shared-userbase",
    label: "Shared userbase",
    root: "api/services/shared-userbase",
    description: "Shared auth, users, tenant membership, and account boundaries.",
  },
] as const;

export type ServiceAreaId = (typeof serviceAreas)[number]["id"];
