import { Type } from "class-transformer";
import {
  IsArray,
  IsEmail,
  IsISO8601,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength
} from "class-validator";

export class ListShamstayQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  reservationId?: string;

  @IsOptional()
  @IsString()
  guestId?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsISO8601()
  checkIn?: string;

  @IsOptional()
  @IsISO8601()
  checkOut?: string;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  guests?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minNightlyRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxNightlyRate?: number;
}

export class UpdateStatusDto {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  status!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CreateShamstayPropertyDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  slug?: string;

  @IsString()
  @MinLength(4)
  address!: string;

  @IsString()
  @MinLength(2)
  city!: string;

  @IsString()
  @MinLength(2)
  country!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsString()
  @MinLength(2)
  propertyType!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedrooms!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bathrooms!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxGuests!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  nightlyRate!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  cleaningFee!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  ownerName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsArray()
  amenities?: unknown[];

  @IsOptional()
  @IsArray()
  houseRules?: unknown[];

  @IsOptional()
  @IsArray()
  photos?: unknown[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;
}

export class UpdateShamstayPropertyDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  slug?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  address?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  city?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  propertyType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxGuests?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  nightlyRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  cleaningFee?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  ownerName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsArray()
  amenities?: unknown[];

  @IsOptional()
  @IsArray()
  houseRules?: unknown[];

  @IsOptional()
  @IsArray()
  photos?: unknown[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;
}

export class CreateShamstayGuestDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateShamstayGuestDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CreateShamstayReservationDto {
  @IsString()
  propertyId!: string;

  @IsString()
  guestId!: string;

  @IsString()
  @MinLength(3)
  confirmationCode!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsISO8601()
  checkIn!: string;

  @IsISO8601()
  checkOut!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  guests!: number;

  @IsString()
  channel!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  nightlyRate!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fees?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  taxes?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalAmount!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateShamstayReservationDto {
  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  guestId?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  confirmationCode?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsISO8601()
  checkIn?: string;

  @IsOptional()
  @IsISO8601()
  checkOut?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  guests?: number;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  nightlyRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fees?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  taxes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalAmount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CreateShamstayTurnoverDto {
  @IsString()
  propertyId!: string;

  @IsOptional()
  @IsString()
  reservationId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsISO8601()
  scheduledFor!: string;

  @IsOptional()
  @IsString()
  assignedTeam?: string;

  @IsOptional()
  @IsArray()
  checklist?: unknown[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateShamstayTurnoverDto {
  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  reservationId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsISO8601()
  scheduledFor?: string;

  @IsOptional()
  @IsISO8601()
  completedAt?: string;

  @IsOptional()
  @IsString()
  assignedTeam?: string;

  @IsOptional()
  @IsArray()
  checklist?: unknown[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CreateShamstayMaintenanceTicketDto {
  @IsString()
  propertyId!: string;

  @IsString()
  @MinLength(2)
  title!: string;

  @IsString()
  category!: string;

  @IsString()
  priority!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsISO8601()
  dueAt?: string;

  @IsOptional()
  @IsString()
  vendorName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estimatedCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  actualCost?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateShamstayMaintenanceTicketDto {
  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsISO8601()
  dueAt?: string;

  @IsOptional()
  @IsISO8601()
  resolvedAt?: string;

  @IsOptional()
  @IsString()
  vendorName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estimatedCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  actualCost?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CreateShamstayOwnerPayoutDto {
  @IsString()
  propertyId!: string;

  @IsISO8601()
  periodStart!: string;

  @IsISO8601()
  periodEnd!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  grossRevenue!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expenses?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  platformFees?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  netPayout!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateShamstayOwnerPayoutDto {
  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsISO8601()
  periodStart?: string;

  @IsOptional()
  @IsISO8601()
  periodEnd?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  grossRevenue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expenses?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  platformFees?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  netPayout?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsISO8601()
  paidAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CreateShamstayPaymentDto {
  @IsOptional()
  @IsString()
  reservationId?: string;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  guestId?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  providerReference?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  amount!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fees?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  taxes?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsISO8601()
  paidAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateShamstayPaymentDto {
  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  providerReference?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fees?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  taxes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  refundAmount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsISO8601()
  paidAt?: string;

  @IsOptional()
  @IsISO8601()
  refundedAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateShamstayPaymentStatusDto extends UpdateStatusDto {
  @IsOptional()
  @IsString()
  providerReference?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  refundAmount?: number;
}

export class RefundShamstayPaymentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  refundAmount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CreateShamstayAvailabilityBlockDto {
  @IsISO8601()
  startDate!: string;

  @IsISO8601()
  endDate!: string;

  @IsString()
  reason!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  nightlyRateOverride?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minimumNights?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateShamstayAvailabilityBlockDto {
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  nightlyRateOverride?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minimumNights?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CreateShamstayReviewDto {
  @IsString()
  propertyId!: string;

  @IsOptional()
  @IsString()
  reservationId?: string;

  @IsString()
  @MinLength(2)
  guestName!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @MinLength(2)
  @MaxLength(4000)
  comment!: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateShamstayReviewResponseDto {
  @IsString()
  @MinLength(2)
  @MaxLength(4000)
  hostResponse!: string;
}

export class CreateShamstayConversationDto {
  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  reservationId?: string;

  @IsOptional()
  @IsString()
  guestId?: string;

  @IsString()
  @MinLength(2)
  guestName!: string;

  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @IsString()
  @MinLength(2)
  subject!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  initialMessage?: string;
}

export class CreateShamstayMessageDto {
  @IsOptional()
  @IsString()
  senderType?: string;

  @IsString()
  @MinLength(2)
  senderName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;

  @IsOptional()
  @IsArray()
  attachments?: unknown[];
}

export class CreatePublicShamstayReservationRequestDto {
  @IsString()
  propertyId!: string;

  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsISO8601()
  checkIn!: string;

  @IsISO8601()
  checkOut!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  guests!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CreatePublicShamstayPaymentDto {
  @IsString()
  reservationId!: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  providerReference?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class CreatePublicShamstayContactDto {
  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  reservationId?: string;

  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(2)
  subject!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  message!: string;
}

export class CreateShamstayWishlistItemDto {
  @IsString()
  @MinLength(4)
  visitorKey!: string;

  @IsString()
  propertyId!: string;
}

export class ListShamstayConversationQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  reservationId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class ListShamstaySavedQueryDto {
  @IsString()
  @MinLength(4)
  visitorKey!: string;
}

export class CreateShamstayInquiryMetadataDto {
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
