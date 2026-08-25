export declare class ListQualityQueryDto {
    status?: string;
    vendorId?: string;
    peptideId?: string;
    batchId?: string;
}
export declare class UpdateQualityStatusDto {
    status: string;
    notes?: string;
}
export declare class CreatePeptraceBatchDto {
    batchCode: string;
    vendorId: string;
    peptideId: string;
    productId?: string;
    manufacturedAt?: string;
    receivedAt?: string;
    status?: string;
    quantityVials: number;
    vialSizeMg: number;
    storageCondition?: string;
    notes?: string;
}
export declare class UpdatePeptraceBatchDto {
    batchCode?: string;
    vendorId?: string;
    peptideId?: string;
    productId?: string;
    manufacturedAt?: string;
    receivedAt?: string;
    status?: string;
    quantityVials?: number;
    vialSizeMg?: number;
    storageCondition?: string;
    notes?: string;
}
export declare class CreatePeptraceCertificateDto {
    batchId: string;
    labTestId?: string;
    certificateNumber: string;
    status?: string;
    issuedAt?: string;
    expiresAt?: string;
    documentUrl?: string;
    summary?: Record<string, unknown>;
}
export declare class UpdatePeptraceCertificateDto {
    batchId?: string;
    labTestId?: string;
    certificateNumber?: string;
    status?: string;
    issuedAt?: string;
    expiresAt?: string;
    documentUrl?: string;
    summary?: Record<string, unknown>;
}
