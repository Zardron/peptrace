export declare class ListRealEstateQueryDto {
    search?: string;
    status?: string;
    listingId?: string;
    assignedAgent?: string;
    from?: string;
    to?: string;
    city?: string;
    district?: string;
    propertyType?: string;
    listingPurpose?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    minSizeSqm?: number;
}
export declare class UpdateRealEstateStatusDto {
    status: string;
    notes?: string;
}
export declare class CreateListingDto {
    title: string;
    slug?: string;
    propertyType: string;
    address: string;
    district: string;
    city: string;
    description?: string;
    price: number;
    currency?: string;
    status?: string;
    listingPurpose?: string;
    bedrooms?: number;
    bathrooms?: number;
    sizeSqm?: number;
    lotSizeSqm?: number;
    yearBuilt?: number;
    ownerName?: string;
    assignedAgent?: string;
    publishedAt?: string;
    features?: unknown[];
    photos?: unknown[];
    latitude?: number;
    longitude?: number;
}
export declare class UpdateListingDto {
    title?: string;
    slug?: string;
    propertyType?: string;
    address?: string;
    district?: string;
    city?: string;
    description?: string;
    price?: number;
    currency?: string;
    status?: string;
    listingPurpose?: string;
    bedrooms?: number;
    bathrooms?: number;
    sizeSqm?: number;
    lotSizeSqm?: number;
    yearBuilt?: number;
    ownerName?: string;
    assignedAgent?: string;
    publishedAt?: string;
    features?: unknown[];
    photos?: unknown[];
    latitude?: number;
    longitude?: number;
}
export declare class CreateLeadDto {
    listingId?: string;
    fullName: string;
    email?: string;
    phone: string;
    source: string;
    interestType: string;
    budgetMin?: number;
    budgetMax?: number;
    status?: string;
    priority?: string;
    assignedAgent?: string;
    notes?: string;
}
export declare class UpdateLeadDto {
    listingId?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    source?: string;
    interestType?: string;
    budgetMin?: number;
    budgetMax?: number;
    status?: string;
    priority?: string;
    assignedAgent?: string;
    notes?: string;
}
export declare class CreateViewingDto {
    listingId: string;
    leadId?: string;
    scheduledFor: string;
    status?: string;
    assignedAgent?: string;
    notes?: string;
    feedback?: Record<string, unknown>;
}
export declare class UpdateViewingDto {
    listingId?: string;
    leadId?: string;
    scheduledFor?: string;
    status?: string;
    assignedAgent?: string;
    notes?: string;
    feedback?: Record<string, unknown>;
}
export declare class CreateOfferDto {
    listingId: string;
    leadId: string;
    amount: number;
    currency?: string;
    status?: string;
    submittedAt?: string;
    expiresAt?: string;
    terms?: Record<string, unknown>;
    notes?: string;
}
export declare class UpdateOfferDto {
    listingId?: string;
    leadId?: string;
    amount?: number;
    currency?: string;
    status?: string;
    submittedAt?: string;
    expiresAt?: string;
    terms?: Record<string, unknown>;
    notes?: string;
}
export declare class CreateCommissionDto {
    listingId?: string;
    offerId?: string;
    agentName: string;
    grossCommission: number;
    brokerageShare: number;
    agentShare: number;
    currency?: string;
    status?: string;
    dueAt?: string;
    notes?: string;
}
export declare class UpdateCommissionDto {
    listingId?: string;
    offerId?: string;
    agentName?: string;
    grossCommission?: number;
    brokerageShare?: number;
    agentShare?: number;
    currency?: string;
    status?: string;
    dueAt?: string;
    paidAt?: string;
    notes?: string;
}
export declare class CreatePublicRealEstateInquiryDto {
    listingId?: string;
    fullName: string;
    email?: string;
    phone: string;
    interestType?: string;
    budgetMin?: number;
    budgetMax?: number;
    message?: string;
}
export declare class CreateRealEstateTourRequestDto {
    listingId: string;
    fullName: string;
    email?: string;
    phone: string;
    scheduledFor: string;
    assignedAgent?: string;
    message?: string;
}
export declare class CreateRealEstateSavedListingDto {
    visitorKey: string;
    listingId: string;
}
export declare class CreateRealEstateSavedSearchDto {
    visitorKey: string;
    label: string;
    filters: Record<string, unknown>;
    alertFrequency?: string;
}
export declare class ListRealEstateSavedQueryDto {
    visitorKey: string;
}
