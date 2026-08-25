import { AuthenticatedClientUser } from "../auth/auth.types";
import { ServicesService } from "./services.service";
export declare class ServicesController {
    private readonly servicesService;
    constructor(servicesService: ServicesService);
    listServices(user: AuthenticatedClientUser): Promise<{
        tenant: import("../auth/auth.types").AuthTenant;
        items: ({
            id: string;
            key: string;
            name: string;
            scope: string;
            category: string;
            description: string;
            owner: string;
            basePath: string;
            endpoints: import("@prisma/client/runtime/client").JsonValue | import("./service-catalog").DocumentedServiceEndpoint[];
            endpointGroups: import("./service-catalog").DocumentedServiceEndpointGroup[];
            requiredRoles: string[];
            tags: string[];
            docsPath: string | null;
            config: string | number | boolean | import("@prisma/client/runtime/client").JsonObject | import("@prisma/client/runtime/client").JsonArray;
            assignment: {
                id: string;
                status: string;
                isEnabled: boolean;
                notes: string | null;
                updatedAt: string;
            } | null;
        } | {
            id: string;
            key: string;
            name: string;
            scope: import("./service-catalog").DocumentedServiceScope;
            category: string;
            description: string;
            owner: string;
            basePath: string;
            endpoints: import("./service-catalog").DocumentedServiceEndpoint[];
            endpointGroups: import("./service-catalog").DocumentedServiceEndpointGroup[];
            requiredRoles: string[];
            tags: string[];
            docsPath: string;
            config: {
                tenantSlug: string;
                source: string;
            };
            assignment: null;
        })[];
    }>;
    listCatalog(user: AuthenticatedClientUser): {
        tenant: import("../auth/auth.types").AuthTenant;
        items: {
            isAvailableToTenant: boolean;
            id: string;
            key: string;
            name: string;
            scope: import("./service-catalog").DocumentedServiceScope;
            category: string;
            description: string;
            owner: string;
            basePath: string;
            endpoints: import("./service-catalog").DocumentedServiceEndpoint[];
            endpointGroups: import("./service-catalog").DocumentedServiceEndpointGroup[];
            requiredRoles: string[];
            tags: string[];
            docsPath: string;
            config: {
                tenantSlug: string;
                source: string;
            };
            assignment: null;
        }[];
    };
    getService(serviceKey: string, user: AuthenticatedClientUser): Promise<{
        tenant: import("../auth/auth.types").AuthTenant;
        service: {
            id: string;
            key: string;
            name: string;
            scope: string;
            category: string;
            description: string;
            owner: string;
            basePath: string;
            endpoints: import("@prisma/client/runtime/client").JsonValue | import("./service-catalog").DocumentedServiceEndpoint[];
            endpointGroups: import("./service-catalog").DocumentedServiceEndpointGroup[];
            requiredRoles: string[];
            tags: string[];
            docsPath: string | null;
            config: string | number | boolean | import("@prisma/client/runtime/client").JsonObject | import("@prisma/client/runtime/client").JsonArray;
            assignment: {
                id: string;
                status: string;
                isEnabled: boolean;
                notes: string | null;
                updatedAt: string;
            } | null;
        };
    } | {
        tenant: import("../auth/auth.types").AuthTenant;
        service: {
            id: string;
            key: string;
            name: string;
            scope: import("./service-catalog").DocumentedServiceScope;
            category: string;
            description: string;
            owner: string;
            basePath: string;
            endpoints: import("./service-catalog").DocumentedServiceEndpoint[];
            endpointGroups: import("./service-catalog").DocumentedServiceEndpointGroup[];
            requiredRoles: string[];
            tags: string[];
            docsPath: string;
            config: {
                tenantSlug: string;
                source: string;
            };
            assignment: null;
        };
    }>;
}
