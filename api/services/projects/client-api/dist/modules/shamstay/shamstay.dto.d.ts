export declare class ListShamstayQueryDto {
    search?: string;
    status?: string;
    propertyId?: string;
    reservationId?: string;
    guestId?: string;
    city?: string;
    country?: string;
    checkIn?: string;
    checkOut?: string;
    from?: string;
    to?: string;
    guests?: number;
    minNightlyRate?: number;
    maxNightlyRate?: number;
}
export declare class UpdateStatusDto {
    status: string;
    notes?: string;
}
export declare class CreateShamstayPropertyDto {
    name: string;
    slug?: string;
    address: string;
    city: string;
    country: string;
    description?: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    maxGuests: number;
    nightlyRate: number;
    cleaningFee: number;
    currency?: string;
    status?: string;
    ownerName?: string;
    rating?: number;
    amenities?: unknown[];
    houseRules?: unknown[];
    photos?: unknown[];
    latitude?: number;
    longitude?: number;
}
export declare class UpdateShamstayPropertyDto {
    name?: string;
    slug?: string;
    address?: string;
    city?: string;
    country?: string;
    description?: string;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
    maxGuests?: number;
    nightlyRate?: number;
    cleaningFee?: number;
    currency?: string;
    status?: string;
    ownerName?: string;
    rating?: number;
    amenities?: unknown[];
    houseRules?: unknown[];
    photos?: unknown[];
    latitude?: number;
    longitude?: number;
}
export declare class CreateShamstayGuestDto {
    fullName: string;
    email: string;
    phone?: string;
    country?: string;
    notes?: string;
}
export declare class UpdateShamstayGuestDto {
    fullName?: string;
    email?: string;
    phone?: string;
    country?: string;
    notes?: string;
}
export declare class CreateShamstayReservationDto {
    propertyId: string;
    guestId: string;
    confirmationCode: string;
    status?: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    channel: string;
    nightlyRate: number;
    fees?: number;
    taxes?: number;
    totalAmount: number;
    currency?: string;
    notes?: string;
}
export declare class UpdateShamstayReservationDto {
    propertyId?: string;
    guestId?: string;
    confirmationCode?: string;
    status?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    channel?: string;
    nightlyRate?: number;
    fees?: number;
    taxes?: number;
    totalAmount?: number;
    currency?: string;
    notes?: string;
}
export declare class CreateShamstayTurnoverDto {
    propertyId: string;
    reservationId?: string;
    status?: string;
    scheduledFor: string;
    assignedTeam?: string;
    checklist?: unknown[];
    notes?: string;
}
export declare class UpdateShamstayTurnoverDto {
    propertyId?: string;
    reservationId?: string;
    status?: string;
    scheduledFor?: string;
    completedAt?: string;
    assignedTeam?: string;
    checklist?: unknown[];
    notes?: string;
}
export declare class CreateShamstayMaintenanceTicketDto {
    propertyId: string;
    title: string;
    category: string;
    priority: string;
    status?: string;
    dueAt?: string;
    vendorName?: string;
    estimatedCost?: number;
    actualCost?: number;
    currency?: string;
    notes?: string;
}
export declare class UpdateShamstayMaintenanceTicketDto {
    propertyId?: string;
    title?: string;
    category?: string;
    priority?: string;
    status?: string;
    dueAt?: string;
    resolvedAt?: string;
    vendorName?: string;
    estimatedCost?: number;
    actualCost?: number;
    currency?: string;
    notes?: string;
}
export declare class CreateShamstayOwnerPayoutDto {
    propertyId: string;
    periodStart: string;
    periodEnd: string;
    grossRevenue: number;
    expenses?: number;
    platformFees?: number;
    netPayout: number;
    currency?: string;
    status?: string;
    notes?: string;
}
export declare class UpdateShamstayOwnerPayoutDto {
    propertyId?: string;
    periodStart?: string;
    periodEnd?: string;
    grossRevenue?: number;
    expenses?: number;
    platformFees?: number;
    netPayout?: number;
    currency?: string;
    status?: string;
    paidAt?: string;
    notes?: string;
}
export declare class CreateShamstayPaymentDto {
    reservationId?: string;
    propertyId?: string;
    guestId?: string;
    provider?: string;
    providerReference?: string;
    type?: string;
    status?: string;
    amount: number;
    fees?: number;
    taxes?: number;
    currency?: string;
    paidAt?: string;
    notes?: string;
    metadata?: Record<string, unknown>;
}
export declare class UpdateShamstayPaymentDto {
    provider?: string;
    providerReference?: string;
    type?: string;
    status?: string;
    amount?: number;
    fees?: number;
    taxes?: number;
    refundAmount?: number;
    currency?: string;
    paidAt?: string;
    refundedAt?: string;
    notes?: string;
    metadata?: Record<string, unknown>;
}
export declare class UpdateShamstayPaymentStatusDto extends UpdateStatusDto {
    providerReference?: string;
    refundAmount?: number;
}
export declare class RefundShamstayPaymentDto {
    refundAmount: number;
    notes?: string;
}
export declare class CreateShamstayAvailabilityBlockDto {
    startDate: string;
    endDate: string;
    reason: string;
    status?: string;
    nightlyRateOverride?: number;
    minimumNights?: number;
    notes?: string;
}
export declare class UpdateShamstayAvailabilityBlockDto {
    startDate?: string;
    endDate?: string;
    reason?: string;
    status?: string;
    nightlyRateOverride?: number;
    minimumNights?: number;
    notes?: string;
}
export declare class CreateShamstayReviewDto {
    propertyId: string;
    reservationId?: string;
    guestName: string;
    rating: number;
    comment: string;
    status?: string;
}
export declare class UpdateShamstayReviewResponseDto {
    hostResponse: string;
}
export declare class CreateShamstayConversationDto {
    propertyId?: string;
    reservationId?: string;
    guestId?: string;
    guestName: string;
    guestEmail?: string;
    subject: string;
    status?: string;
    source?: string;
    initialMessage?: string;
}
export declare class CreateShamstayMessageDto {
    senderType?: string;
    senderName: string;
    body: string;
    attachments?: unknown[];
}
export declare class CreatePublicShamstayReservationRequestDto {
    propertyId: string;
    fullName: string;
    email: string;
    phone?: string;
    country?: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    notes?: string;
}
export declare class CreatePublicShamstayPaymentDto {
    reservationId: string;
    provider?: string;
    providerReference?: string;
    metadata?: Record<string, unknown>;
}
export declare class CreatePublicShamstayContactDto {
    propertyId?: string;
    reservationId?: string;
    fullName: string;
    email?: string;
    subject: string;
    message: string;
}
export declare class CreateShamstayWishlistItemDto {
    visitorKey: string;
    propertyId: string;
}
export declare class ListShamstayConversationQueryDto {
    status?: string;
    propertyId?: string;
    reservationId?: string;
    search?: string;
}
export declare class ListShamstaySavedQueryDto {
    visitorKey: string;
}
export declare class CreateShamstayInquiryMetadataDto {
    metadata?: Record<string, unknown>;
}
