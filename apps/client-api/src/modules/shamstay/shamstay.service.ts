import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuthenticatedClientUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreatePublicShamstayContactDto,
  CreatePublicShamstayPaymentDto,
  CreatePublicShamstayReservationRequestDto,
  CreateShamstayAvailabilityBlockDto,
  CreateShamstayConversationDto,
  CreateShamstayGuestDto,
  CreateShamstayMaintenanceTicketDto,
  CreateShamstayMessageDto,
  CreateShamstayOwnerPayoutDto,
  CreateShamstayPaymentDto,
  CreateShamstayPropertyDto,
  CreateShamstayReservationDto,
  CreateShamstayReviewDto,
  CreateShamstayTurnoverDto,
  CreateShamstayWishlistItemDto,
  RefundShamstayPaymentDto,
  ListShamstayConversationQueryDto,
  ListShamstayQueryDto,
  ListShamstaySavedQueryDto,
  UpdateShamstayAvailabilityBlockDto,
  UpdateShamstayGuestDto,
  UpdateShamstayMaintenanceTicketDto,
  UpdateShamstayOwnerPayoutDto,
  UpdateShamstayPaymentDto,
  UpdateShamstayPaymentStatusDto,
  UpdateShamstayPropertyDto,
  UpdateShamstayReservationDto,
  UpdateShamstayReviewResponseDto,
  UpdateShamstayTurnoverDto,
  UpdateStatusDto
} from "./shamstay.dto";

const SHAMSTAY_TENANT_SLUG = "shamstay-bnb";
const WRITE_ROLES = new Set(["owner", "admin", "manager"]);
const RESERVATION_CONFLICT_STATUSES = ["BOOKED", "CONFIRMED", "REQUESTED", "PENDING"];
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ShamstayService {
  constructor(private readonly prisma: PrismaService) {}

  listProperties(query: ListShamstayQueryDto, user: AuthenticatedClientUser) {
    this.assertShamstay(user);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayProperty.findMany({
        orderBy: [{ status: "asc" }, { name: "asc" }],
        where: {
          city: query.city ? { equals: query.city, mode: "insensitive" } : undefined,
          country: query.country ? { equals: query.country, mode: "insensitive" } : undefined,
          maxGuests: query.guests ? { gte: query.guests } : undefined,
          nightlyRate:
            query.minNightlyRate !== undefined || query.maxNightlyRate !== undefined
              ? { gte: query.minNightlyRate, lte: query.maxNightlyRate }
              : undefined,
          tenantId: user.tenantId,
          status: query.status,
          ...(query.search
            ? {
                OR: [
                  { name: { contains: query.search, mode: "insensitive" } },
                  { city: { contains: query.search, mode: "insensitive" } },
                  { address: { contains: query.search, mode: "insensitive" } }
                ]
              }
            : {})
        }
      })
    );
  }

  async getProperty(idOrSlug: string, user: AuthenticatedClientUser) {
    this.assertShamstay(user);
    const property = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayProperty.findFirst({
        include: {
          availabilityBlocks: { orderBy: { startDate: "asc" }, take: 20 },
          conversations: { orderBy: { updatedAt: "desc" }, take: 10 },
          maintenanceTickets: { orderBy: { createdAt: "desc" }, take: 10 },
          ownerPayouts: { orderBy: { periodStart: "desc" }, take: 6 },
          reservations: { orderBy: { checkIn: "desc" }, take: 10 },
          reviews: { orderBy: { createdAt: "desc" }, take: 10 },
          turnovers: { orderBy: { scheduledFor: "desc" }, take: 10 }
        },
        where: {
          tenantId: user.tenantId,
          OR: [{ id: idOrSlug }, { slug: idOrSlug }]
        }
      })
    );

    if (!property) {
      throw new NotFoundException("Property not found");
    }
    return property;
  }

  async createProperty(dto: CreateShamstayPropertyDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    try {
      return await this.prisma.withConnectionRetry(() =>
        this.prisma.shamstayProperty.create({
          data: {
            address: dto.address.trim(),
            amenities: (dto.amenities ?? []) as Prisma.InputJsonValue,
            bathrooms: dto.bathrooms,
            bedrooms: dto.bedrooms,
            city: dto.city.trim(),
            cleaningFee: dto.cleaningFee,
            country: dto.country.trim(),
            currency: dto.currency?.trim() || "USD",
            description: dto.description?.trim() || null,
            houseRules: (dto.houseRules ?? []) as Prisma.InputJsonValue,
            latitude: dto.latitude,
            longitude: dto.longitude,
            maxGuests: dto.maxGuests,
            name: dto.name.trim(),
            nightlyRate: dto.nightlyRate,
            ownerName: dto.ownerName?.trim() || null,
            photos: (dto.photos ?? []) as Prisma.InputJsonValue,
            propertyType: dto.propertyType.trim(),
            rating: dto.rating,
            slug: this.slugify(dto.slug ?? dto.name),
            status: dto.status?.trim() || "ACTIVE",
            tenantId: user.tenantId
          }
        })
      );
    } catch (error) {
      this.rethrowUnique(error, "A property with this slug already exists");
    }
  }

  async updateProperty(id: string, dto: UpdateShamstayPropertyDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await this.ensureProperty(id, user.tenantId);
    const data = this.buildPropertyUpdate(dto);
    try {
      return await this.prisma.withConnectionRetry(() =>
        this.prisma.shamstayProperty.update({
          data,
          where: { id }
        })
      );
    } catch (error) {
      this.rethrowUnique(error, "A property with this slug already exists");
    }
  }

  async updatePropertyStatus(id: string, dto: UpdateStatusDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await this.ensureProperty(id, user.tenantId);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayProperty.update({
        data: { status: dto.status.trim() },
        where: { id }
      })
    );
  }

  async archiveProperty(id: string, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await this.ensureProperty(id, user.tenantId);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayProperty.update({
        data: { status: "ARCHIVED" },
        where: { id }
      })
    );
  }

  listGuests(query: ListShamstayQueryDto, user: AuthenticatedClientUser) {
    this.assertShamstay(user);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayGuest.findMany({
        orderBy: { fullName: "asc" },
        where: {
          tenantId: user.tenantId,
          ...(query.search
            ? {
                OR: [
                  { fullName: { contains: query.search, mode: "insensitive" } },
                  { email: { contains: query.search, mode: "insensitive" } }
                ]
              }
            : {})
        }
      })
    );
  }

  async createGuest(dto: CreateShamstayGuestDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    try {
      return await this.prisma.withConnectionRetry(() =>
        this.prisma.shamstayGuest.create({
          data: {
            country: dto.country?.trim() || null,
            email: dto.email.trim().toLowerCase(),
            fullName: dto.fullName.trim(),
            notes: dto.notes?.trim() || null,
            phone: dto.phone?.trim() || null,
            tenantId: user.tenantId
          }
        })
      );
    } catch (error) {
      this.rethrowUnique(error, "A guest with this email already exists");
    }
  }

  async updateGuest(id: string, dto: UpdateShamstayGuestDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await this.ensureGuest(id, user.tenantId);
    try {
      return await this.prisma.withConnectionRetry(() =>
        this.prisma.shamstayGuest.update({
          data: {
            country: dto.country?.trim(),
            email: dto.email?.trim().toLowerCase(),
            fullName: dto.fullName?.trim(),
            notes: dto.notes !== undefined ? dto.notes.trim() || null : undefined,
            phone: dto.phone !== undefined ? dto.phone.trim() || null : undefined
          },
          where: { id }
        })
      );
    } catch (error) {
      this.rethrowUnique(error, "A guest with this email already exists");
    }
  }

  async getGuest(id: string, user: AuthenticatedClientUser) {
    this.assertShamstay(user);
    const guest = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayGuest.findFirst({
        include: {
          conversations: { orderBy: { updatedAt: "desc" }, take: 10 },
          payments: { orderBy: { createdAt: "desc" }, take: 10 },
          reservations: { orderBy: { checkIn: "desc" }, take: 10 }
        },
        where: { id, tenantId: user.tenantId }
      })
    );
    if (!guest) {
      throw new NotFoundException("Guest not found");
    }
    return guest;
  }

  listReservations(query: ListShamstayQueryDto, user: AuthenticatedClientUser) {
    this.assertShamstay(user);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayReservation.findMany({
        include: { guest: true, property: true },
        orderBy: { checkIn: "desc" },
        where: {
          propertyId: query.propertyId,
          status: query.status,
          tenantId: user.tenantId
        }
      })
    );
  }

  async getReservation(id: string, user: AuthenticatedClientUser) {
    this.assertShamstay(user);
    const reservation = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayReservation.findFirst({
        include: { guest: true, property: true, turnovers: true },
        where: { id, tenantId: user.tenantId }
      })
    );
    if (!reservation) {
      throw new NotFoundException("Reservation not found");
    }
    return reservation;
  }

  async createReservation(dto: CreateShamstayReservationDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await Promise.all([this.ensureProperty(dto.propertyId, user.tenantId), this.ensureGuest(dto.guestId, user.tenantId)]);
    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);
    if (checkOut <= checkIn) {
      throw new BadRequestException("checkOut must be after checkIn");
    }

    try {
      return await this.prisma.withConnectionRetry(() =>
        this.prisma.shamstayReservation.create({
          data: {
            channel: dto.channel.trim(),
            checkIn,
            checkOut,
            confirmationCode: dto.confirmationCode.trim(),
            currency: dto.currency?.trim() || "USD",
            fees: dto.fees ?? 0,
            guestId: dto.guestId,
            guests: dto.guests,
            nightlyRate: dto.nightlyRate,
            notes: dto.notes?.trim() || null,
            propertyId: dto.propertyId,
            status: dto.status?.trim() || "BOOKED",
            taxes: dto.taxes ?? 0,
            tenantId: user.tenantId,
            totalAmount: dto.totalAmount
          },
          include: { guest: true, property: true }
        })
      );
    } catch (error) {
      this.rethrowUnique(error, "A reservation with this confirmation code already exists");
    }
  }

  async updateReservation(id: string, dto: UpdateShamstayReservationDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    const reservation = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayReservation.findFirst({ where: { id, tenantId: user.tenantId } })
    );
    if (!reservation) {
      throw new NotFoundException("Reservation not found");
    }
    if (dto.propertyId) {
      await this.ensureProperty(dto.propertyId, user.tenantId);
    }
    if (dto.guestId) {
      await this.ensureGuest(dto.guestId, user.tenantId);
    }
    const checkIn = dto.checkIn ? new Date(dto.checkIn) : reservation.checkIn;
    const checkOut = dto.checkOut ? new Date(dto.checkOut) : reservation.checkOut;
    if (checkOut <= checkIn) {
      throw new BadRequestException("checkOut must be after checkIn");
    }

    try {
      return await this.prisma.withConnectionRetry(() =>
        this.prisma.shamstayReservation.update({
          data: {
            channel: dto.channel?.trim(),
            checkIn: dto.checkIn ? checkIn : undefined,
            checkOut: dto.checkOut ? checkOut : undefined,
            confirmationCode: dto.confirmationCode?.trim(),
            currency: dto.currency?.trim(),
            fees: dto.fees,
            guestId: dto.guestId,
            guests: dto.guests,
            nightlyRate: dto.nightlyRate,
            notes: dto.notes !== undefined ? dto.notes.trim() || null : undefined,
            propertyId: dto.propertyId,
            status: dto.status?.trim(),
            taxes: dto.taxes,
            totalAmount: dto.totalAmount
          },
          where: { id },
          include: { guest: true, property: true }
        })
      );
    } catch (error) {
      this.rethrowUnique(error, "A reservation with this confirmation code already exists");
    }
  }

  async updateReservationStatus(id: string, dto: UpdateStatusDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    const reservation = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayReservation.findFirst({ where: { id, tenantId: user.tenantId } })
    );
    if (!reservation) {
      throw new NotFoundException("Reservation not found");
    }
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayReservation.update({
        data: { notes: dto.notes?.trim() ?? reservation.notes, status: dto.status.trim() },
        where: { id },
        include: { guest: true, property: true }
      })
    );
  }

  async archiveReservation(id: string, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    const reservation = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayReservation.findFirst({ where: { id, tenantId: user.tenantId } })
    );
    if (!reservation) {
      throw new NotFoundException("Reservation not found");
    }
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayReservation.update({
        data: { status: "ARCHIVED" },
        where: { id },
        include: { guest: true, property: true }
      })
    );
  }

  listTurnovers(query: ListShamstayQueryDto, user: AuthenticatedClientUser) {
    this.assertShamstay(user);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayTurnover.findMany({
        include: { property: true, reservation: true },
        orderBy: { scheduledFor: "asc" },
        where: {
          propertyId: query.propertyId,
          status: query.status,
          tenantId: user.tenantId
        }
      })
    );
  }

  async createTurnover(dto: CreateShamstayTurnoverDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await this.ensureProperty(dto.propertyId, user.tenantId);
    if (dto.reservationId) {
      await this.ensureReservation(dto.reservationId, user.tenantId);
    }

    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayTurnover.create({
        data: {
          assignedTeam: dto.assignedTeam?.trim() || null,
          checklist: (dto.checklist ?? []) as Prisma.InputJsonValue,
          notes: dto.notes?.trim() || null,
          propertyId: dto.propertyId,
          reservationId: dto.reservationId,
          scheduledFor: new Date(dto.scheduledFor),
          status: dto.status?.trim() || "SCHEDULED",
          tenantId: user.tenantId
        },
        include: { property: true, reservation: true }
      })
    );
  }

  async updateTurnover(id: string, dto: UpdateShamstayTurnoverDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    const turnover = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayTurnover.findFirst({ where: { id, tenantId: user.tenantId } })
    );
    if (!turnover) {
      throw new NotFoundException("Turnover not found");
    }
    if (dto.propertyId) {
      await this.ensureProperty(dto.propertyId, user.tenantId);
    }
    if (dto.reservationId) {
      await this.ensureReservation(dto.reservationId, user.tenantId);
    }

    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayTurnover.update({
        data: {
          assignedTeam: dto.assignedTeam !== undefined ? dto.assignedTeam.trim() || null : undefined,
          checklist: dto.checklist !== undefined ? (dto.checklist as Prisma.InputJsonValue) : undefined,
          completedAt: dto.completedAt
            ? new Date(dto.completedAt)
            : dto.status?.trim().toUpperCase() === "COMPLETED"
              ? turnover.completedAt ?? new Date()
              : undefined,
          notes: dto.notes !== undefined ? dto.notes.trim() || null : undefined,
          propertyId: dto.propertyId,
          reservationId: dto.reservationId,
          scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
          status: dto.status?.trim()
        },
        where: { id },
        include: { property: true, reservation: true }
      })
    );
  }

  async getTurnover(id: string, user: AuthenticatedClientUser) {
    this.assertShamstay(user);
    const turnover = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayTurnover.findFirst({
        include: { property: true, reservation: true },
        where: { id, tenantId: user.tenantId }
      })
    );
    if (!turnover) {
      throw new NotFoundException("Turnover not found");
    }
    return turnover;
  }

  async updateTurnoverStatus(id: string, dto: UpdateStatusDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    const turnover = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayTurnover.findFirst({ where: { id, tenantId: user.tenantId } })
    );
    if (!turnover) {
      throw new NotFoundException("Turnover not found");
    }

    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayTurnover.update({
        data: {
          notes: dto.notes?.trim() ?? turnover.notes,
          status: dto.status.trim(),
          completedAt: dto.status.trim().toUpperCase() === "COMPLETED" ? new Date() : turnover.completedAt
        },
        where: { id },
        include: { property: true, reservation: true }
      })
    );
  }

  async archiveTurnover(id: string, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await this.ensureTurnover(id, user.tenantId);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayTurnover.update({
        data: { status: "ARCHIVED" },
        where: { id },
        include: { property: true, reservation: true }
      })
    );
  }

  listMaintenanceTickets(query: ListShamstayQueryDto, user: AuthenticatedClientUser) {
    this.assertShamstay(user);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayMaintenanceTicket.findMany({
        include: { property: true },
        orderBy: [{ status: "asc" }, { reportedAt: "desc" }],
        where: {
          propertyId: query.propertyId,
          status: query.status,
          tenantId: user.tenantId
        }
      })
    );
  }

  async createMaintenanceTicket(dto: CreateShamstayMaintenanceTicketDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await this.ensureProperty(dto.propertyId, user.tenantId);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayMaintenanceTicket.create({
        data: {
          actualCost: dto.actualCost,
          category: dto.category.trim(),
          currency: dto.currency?.trim() || "USD",
          dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
          estimatedCost: dto.estimatedCost,
          notes: dto.notes?.trim() || null,
          priority: dto.priority.trim(),
          propertyId: dto.propertyId,
          status: dto.status?.trim() || "OPEN",
          tenantId: user.tenantId,
          title: dto.title.trim(),
          vendorName: dto.vendorName?.trim() || null
        },
        include: { property: true }
      })
    );
  }

  async updateMaintenanceTicket(id: string, dto: UpdateShamstayMaintenanceTicketDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    const ticket = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayMaintenanceTicket.findFirst({ where: { id, tenantId: user.tenantId } })
    );
    if (!ticket) {
      throw new NotFoundException("Maintenance ticket not found");
    }
    if (dto.propertyId) {
      await this.ensureProperty(dto.propertyId, user.tenantId);
    }

    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayMaintenanceTicket.update({
        data: {
          actualCost: dto.actualCost,
          category: dto.category?.trim(),
          currency: dto.currency?.trim(),
          dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
          estimatedCost: dto.estimatedCost,
          notes: dto.notes !== undefined ? dto.notes.trim() || null : undefined,
          priority: dto.priority?.trim(),
          propertyId: dto.propertyId,
          resolvedAt: dto.resolvedAt
            ? new Date(dto.resolvedAt)
            : dto.status?.trim().toUpperCase() === "RESOLVED"
              ? ticket.resolvedAt ?? new Date()
              : undefined,
          status: dto.status?.trim(),
          title: dto.title?.trim(),
          vendorName: dto.vendorName !== undefined ? dto.vendorName.trim() || null : undefined
        },
        where: { id },
        include: { property: true }
      })
    );
  }

  async getMaintenanceTicket(id: string, user: AuthenticatedClientUser) {
    this.assertShamstay(user);
    const ticket = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayMaintenanceTicket.findFirst({
        include: { property: true },
        where: { id, tenantId: user.tenantId }
      })
    );
    if (!ticket) {
      throw new NotFoundException("Maintenance ticket not found");
    }
    return ticket;
  }

  async updateMaintenanceStatus(id: string, dto: UpdateStatusDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    const ticket = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayMaintenanceTicket.findFirst({ where: { id, tenantId: user.tenantId } })
    );
    if (!ticket) {
      throw new NotFoundException("Maintenance ticket not found");
    }
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayMaintenanceTicket.update({
        data: {
          notes: dto.notes?.trim() ?? ticket.notes,
          resolvedAt: dto.status.trim().toUpperCase() === "RESOLVED" ? new Date() : ticket.resolvedAt,
          status: dto.status.trim()
        },
        where: { id },
        include: { property: true }
      })
    );
  }

  async archiveMaintenanceTicket(id: string, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    const ticket = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayMaintenanceTicket.findFirst({ where: { id, tenantId: user.tenantId } })
    );
    if (!ticket) {
      throw new NotFoundException("Maintenance ticket not found");
    }
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayMaintenanceTicket.update({
        data: { status: "ARCHIVED" },
        where: { id },
        include: { property: true }
      })
    );
  }

  listOwnerPayouts(query: ListShamstayQueryDto, user: AuthenticatedClientUser) {
    this.assertShamstay(user);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayOwnerPayout.findMany({
        include: { property: true },
        orderBy: { periodStart: "desc" },
        where: {
          propertyId: query.propertyId,
          status: query.status,
          tenantId: user.tenantId
        }
      })
    );
  }

  async createOwnerPayout(dto: CreateShamstayOwnerPayoutDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await this.ensureProperty(dto.propertyId, user.tenantId);
    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);
    if (periodEnd <= periodStart) {
      throw new BadRequestException("periodEnd must be after periodStart");
    }
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayOwnerPayout.create({
        data: {
          currency: dto.currency?.trim() || "USD",
          expenses: dto.expenses ?? 0,
          grossRevenue: dto.grossRevenue,
          netPayout: dto.netPayout,
          notes: dto.notes?.trim() || null,
          periodEnd,
          periodStart,
          platformFees: dto.platformFees ?? 0,
          propertyId: dto.propertyId,
          status: dto.status?.trim() || "DRAFT",
          tenantId: user.tenantId
        },
        include: { property: true }
      })
    );
  }

  async updateOwnerPayout(id: string, dto: UpdateShamstayOwnerPayoutDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    const payout = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayOwnerPayout.findFirst({ where: { id, tenantId: user.tenantId } })
    );
    if (!payout) {
      throw new NotFoundException("Owner payout not found");
    }
    if (dto.propertyId) {
      await this.ensureProperty(dto.propertyId, user.tenantId);
    }
    const periodStart = dto.periodStart ? new Date(dto.periodStart) : payout.periodStart;
    const periodEnd = dto.periodEnd ? new Date(dto.periodEnd) : payout.periodEnd;
    if (periodEnd <= periodStart) {
      throw new BadRequestException("periodEnd must be after periodStart");
    }

    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayOwnerPayout.update({
        data: {
          currency: dto.currency?.trim(),
          expenses: dto.expenses,
          grossRevenue: dto.grossRevenue,
          netPayout: dto.netPayout,
          notes: dto.notes !== undefined ? dto.notes.trim() || null : undefined,
          paidAt: dto.paidAt
            ? new Date(dto.paidAt)
            : dto.status?.trim().toUpperCase() === "PAID"
              ? payout.paidAt ?? new Date()
              : undefined,
          periodEnd: dto.periodEnd ? periodEnd : undefined,
          periodStart: dto.periodStart ? periodStart : undefined,
          platformFees: dto.platformFees,
          propertyId: dto.propertyId,
          status: dto.status?.trim()
        },
        where: { id },
        include: { property: true }
      })
    );
  }

  async getOwnerPayout(id: string, user: AuthenticatedClientUser) {
    this.assertShamstay(user);
    const payout = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayOwnerPayout.findFirst({
        include: { property: true },
        where: { id, tenantId: user.tenantId }
      })
    );
    if (!payout) {
      throw new NotFoundException("Owner payout not found");
    }
    return payout;
  }

  async updateOwnerPayoutStatus(id: string, dto: UpdateStatusDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    const payout = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayOwnerPayout.findFirst({ where: { id, tenantId: user.tenantId } })
    );
    if (!payout) {
      throw new NotFoundException("Owner payout not found");
    }
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayOwnerPayout.update({
        data: {
          notes: dto.notes?.trim() ?? payout.notes,
          paidAt: dto.status.trim().toUpperCase() === "PAID" ? new Date() : payout.paidAt,
          status: dto.status.trim()
        },
        where: { id },
        include: { property: true }
      })
    );
  }

  async archiveOwnerPayout(id: string, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    const payout = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayOwnerPayout.findFirst({ where: { id, tenantId: user.tenantId } })
    );
    if (!payout) {
      throw new NotFoundException("Owner payout not found");
    }
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayOwnerPayout.update({
        data: { status: "ARCHIVED" },
        where: { id },
        include: { property: true }
      })
    );
  }

  listPayments(query: ListShamstayQueryDto, user: AuthenticatedClientUser) {
    this.assertShamstay(user);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayPayment.findMany({
        include: { guest: true, property: true, reservation: true },
        orderBy: { createdAt: "desc" },
        where: {
          guestId: query.guestId,
          propertyId: query.propertyId,
          reservationId: query.reservationId,
          status: query.status,
          tenantId: user.tenantId
        }
      })
    );
  }

  async getPayment(id: string, user: AuthenticatedClientUser) {
    this.assertShamstay(user);
    const payment = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayPayment.findFirst({
        include: { guest: true, property: true, reservation: true },
        where: { id, tenantId: user.tenantId }
      })
    );
    if (!payment) {
      throw new NotFoundException("Payment not found");
    }
    return payment;
  }

  analyticsOverview(query: ListShamstayQueryDto, user: AuthenticatedClientUser) {
    this.assertShamstay(user);
    const dateRange = this.optionalAnalyticsRange(query);
    const reservationWhere: Prisma.ShamstayReservationWhereInput = {
      propertyId: query.propertyId,
      tenantId: user.tenantId,
      ...(dateRange
        ? {
            checkIn: { lt: dateRange.endDate },
            checkOut: { gt: dateRange.startDate }
          }
        : {})
    };
    const createdWhere = dateRange ? { createdAt: { gte: dateRange.startDate, lte: dateRange.endDate } } : {};

    return this.prisma.withConnectionRetry(async () => {
      const [
        totalProperties,
        activeProperties,
        reservationStatuses,
        paymentTotals,
        openMaintenance,
        openTurnovers,
        pendingReviews,
        openConversations,
        savedProperties
      ] = await Promise.all([
        this.prisma.shamstayProperty.count({
          where: { id: query.propertyId, tenantId: user.tenantId }
        }),
        this.prisma.shamstayProperty.count({
          where: { id: query.propertyId, status: "ACTIVE", tenantId: user.tenantId }
        }),
        this.prisma.shamstayReservation.groupBy({
          by: ["status"],
          _count: { _all: true },
          where: reservationWhere
        }),
        this.prisma.shamstayPayment.aggregate({
          _sum: { amount: true, fees: true, refundAmount: true, taxes: true },
          where: {
            propertyId: query.propertyId,
            tenantId: user.tenantId,
            ...createdWhere,
            status: { notIn: ["VOID", "FAILED", "CANCELLED"] }
          }
        }),
        this.prisma.shamstayMaintenanceTicket.count({
          where: {
            propertyId: query.propertyId,
            status: { notIn: ["RESOLVED", "CLOSED", "CANCELLED"] },
            tenantId: user.tenantId,
            ...createdWhere
          }
        }),
        this.prisma.shamstayTurnover.count({
          where: {
            propertyId: query.propertyId,
            scheduledFor: dateRange ? { gte: dateRange.startDate, lte: dateRange.endDate } : undefined,
            status: { notIn: ["COMPLETED", "CANCELLED"] },
            tenantId: user.tenantId
          }
        }),
        this.prisma.shamstayReview.count({
          where: {
            propertyId: query.propertyId,
            status: "PENDING",
            tenantId: user.tenantId,
            ...createdWhere
          }
        }),
        this.prisma.shamstayConversation.count({
          where: {
            propertyId: query.propertyId,
            status: "OPEN",
            tenantId: user.tenantId,
            ...createdWhere
          }
        }),
        this.prisma.shamstayWishlistItem.count({
          where: {
            propertyId: query.propertyId,
            tenantId: user.tenantId,
            ...createdWhere
          }
        })
      ]);

      const grossAmount = paymentTotals._sum.amount ?? 0;
      const refundAmount = paymentTotals._sum.refundAmount ?? 0;
      return {
        filters: {
          from: dateRange?.startDate ?? null,
          propertyId: query.propertyId ?? null,
          to: dateRange?.endDate ?? null
        },
        properties: {
          active: activeProperties,
          total: totalProperties
        },
        reservations: {
          byStatus: this.toCountMap(reservationStatuses),
          total: reservationStatuses.reduce((sum, row) => sum + row._count._all, 0)
        },
        billing: {
          fees: paymentTotals._sum.fees ?? 0,
          grossAmount,
          netAmount: grossAmount - refundAmount,
          refundAmount,
          taxes: paymentTotals._sum.taxes ?? 0
        },
        operations: {
          openMaintenance,
          openTurnovers
        },
        engagement: {
          openConversations,
          pendingReviews,
          savedProperties
        }
      };
    });
  }

  async createPayment(dto: CreateShamstayPaymentDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    const data = await this.buildPaymentCreateData(dto, user.tenantId);
    try {
      return await this.prisma.withConnectionRetry(() =>
        this.prisma.shamstayPayment.create({
          data,
          include: { guest: true, property: true, reservation: true }
        })
      );
    } catch (error) {
      this.rethrowUnique(error, "A payment with this provider reference already exists");
    }
  }

  async updatePayment(id: string, dto: UpdateShamstayPaymentDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await this.ensurePayment(id, user.tenantId);
    try {
      return await this.prisma.withConnectionRetry(() =>
        this.prisma.shamstayPayment.update({
          data: this.buildPaymentUpdate(dto),
          where: { id },
          include: { guest: true, property: true, reservation: true }
        })
      );
    } catch (error) {
      this.rethrowUnique(error, "A payment with this provider reference already exists");
    }
  }

  async updatePaymentStatus(id: string, dto: UpdateShamstayPaymentStatusDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    const payment = await this.ensurePayment(id, user.tenantId);
    const status = dto.status.trim();
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayPayment.update({
        data: {
          notes: dto.notes?.trim() ?? payment.notes,
          paidAt: this.isPaidStatus(status) ? payment.paidAt ?? new Date() : payment.paidAt,
          providerReference: dto.providerReference?.trim() || payment.providerReference,
          refundedAt: this.isRefundedStatus(status) ? payment.refundedAt ?? new Date() : payment.refundedAt,
          refundAmount: dto.refundAmount ?? payment.refundAmount,
          status
        },
        where: { id },
        include: { guest: true, property: true, reservation: true }
      })
    );
  }

  async refundPayment(id: string, dto: RefundShamstayPaymentDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    const payment = await this.ensurePayment(id, user.tenantId);
    const nextRefundAmount = payment.refundAmount + dto.refundAmount;
    if (nextRefundAmount > payment.amount) {
      throw new BadRequestException("refundAmount cannot exceed the captured payment amount");
    }
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayPayment.update({
        data: {
          notes: dto.notes?.trim() ?? payment.notes,
          refundedAt: new Date(),
          refundAmount: nextRefundAmount,
          status: nextRefundAmount === payment.amount ? "REFUNDED" : "PARTIALLY_REFUNDED"
        },
        where: { id },
        include: { guest: true, property: true, reservation: true }
      })
    );
  }

  async voidPayment(id: string, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await this.ensurePayment(id, user.tenantId);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayPayment.update({
        data: { status: "VOID" },
        where: { id },
        include: { guest: true, property: true, reservation: true }
      })
    );
  }

  async listAvailabilityBlocks(propertyId: string, query: ListShamstayQueryDto, user: AuthenticatedClientUser) {
    this.assertShamstay(user);
    await this.ensureProperty(propertyId, user.tenantId);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayAvailabilityBlock.findMany({
        orderBy: { startDate: "asc" },
        where: {
          propertyId,
          status: query.status,
          tenantId: user.tenantId
        }
      })
    );
  }

  async createAvailabilityBlock(
    propertyId: string,
    dto: CreateShamstayAvailabilityBlockDto,
    user: AuthenticatedClientUser
  ) {
    this.assertCanWrite(user);
    await this.ensureProperty(propertyId, user.tenantId);
    const { startDate, endDate } = this.parseDateRange(dto.startDate, dto.endDate, "endDate");

    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayAvailabilityBlock.create({
        data: {
          endDate,
          minimumNights: dto.minimumNights,
          nightlyRateOverride: dto.nightlyRateOverride,
          notes: dto.notes?.trim() || null,
          propertyId,
          reason: dto.reason.trim(),
          startDate,
          status: dto.status?.trim() || "BLOCKED",
          tenantId: user.tenantId
        },
        include: { property: true }
      })
    );
  }

  async updateAvailabilityBlock(
    id: string,
    dto: UpdateShamstayAvailabilityBlockDto,
    user: AuthenticatedClientUser
  ) {
    this.assertCanWrite(user);
    const block = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayAvailabilityBlock.findFirst({ where: { id, tenantId: user.tenantId } })
    );
    if (!block) {
      throw new NotFoundException("Availability block not found");
    }
    const startDate = dto.startDate ? new Date(dto.startDate) : block.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : block.endDate;
    if (endDate <= startDate) {
      throw new BadRequestException("endDate must be after startDate");
    }

    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayAvailabilityBlock.update({
        data: {
          endDate: dto.endDate ? endDate : undefined,
          minimumNights: dto.minimumNights,
          nightlyRateOverride: dto.nightlyRateOverride,
          notes: dto.notes?.trim() ?? undefined,
          reason: dto.reason?.trim(),
          startDate: dto.startDate ? startDate : undefined,
          status: dto.status?.trim()
        },
        where: { id },
        include: { property: true }
      })
    );
  }

  async deleteAvailabilityBlock(id: string, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    const block = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayAvailabilityBlock.findFirst({ where: { id, tenantId: user.tenantId } })
    );
    if (!block) {
      throw new NotFoundException("Availability block not found");
    }
    return this.prisma.withConnectionRetry(() => this.prisma.shamstayAvailabilityBlock.delete({ where: { id } }));
  }

  listReviews(query: ListShamstayQueryDto, user: AuthenticatedClientUser) {
    this.assertShamstay(user);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayReview.findMany({
        include: { property: true, reservation: true },
        orderBy: { createdAt: "desc" },
        where: {
          propertyId: query.propertyId,
          status: query.status,
          tenantId: user.tenantId
        }
      })
    );
  }

  async getReview(id: string, user: AuthenticatedClientUser) {
    this.assertShamstay(user);
    const review = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayReview.findFirst({
        include: { property: true, reservation: true },
        where: { id, tenantId: user.tenantId }
      })
    );
    if (!review) {
      throw new NotFoundException("Review not found");
    }
    return review;
  }

  async createReview(dto: CreateShamstayReviewDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await this.ensureProperty(dto.propertyId, user.tenantId);
    if (dto.reservationId) {
      await this.ensureReservation(dto.reservationId, user.tenantId);
    }
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayReview.create({
        data: {
          comment: dto.comment.trim(),
          guestName: dto.guestName.trim(),
          propertyId: dto.propertyId,
          rating: dto.rating,
          reservationId: dto.reservationId,
          status: dto.status?.trim() || "PENDING",
          tenantId: user.tenantId
        },
        include: { property: true, reservation: true }
      })
    );
  }

  async updateReviewStatus(id: string, dto: UpdateStatusDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await this.ensureReview(id, user.tenantId);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayReview.update({
        data: { status: dto.status.trim() },
        where: { id },
        include: { property: true, reservation: true }
      })
    );
  }

  async updateReviewResponse(
    id: string,
    dto: UpdateShamstayReviewResponseDto,
    user: AuthenticatedClientUser
  ) {
    this.assertCanWrite(user);
    await this.ensureReview(id, user.tenantId);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayReview.update({
        data: { hostResponse: dto.hostResponse.trim() },
        where: { id },
        include: { property: true, reservation: true }
      })
    );
  }

  async archiveReview(id: string, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await this.ensureReview(id, user.tenantId);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayReview.update({
        data: { status: "ARCHIVED" },
        where: { id },
        include: { property: true, reservation: true }
      })
    );
  }

  listConversations(query: ListShamstayConversationQueryDto, user: AuthenticatedClientUser) {
    this.assertShamstay(user);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayConversation.findMany({
        include: {
          guest: true,
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
          property: true,
          reservation: true
        },
        orderBy: { updatedAt: "desc" },
        where: {
          propertyId: query.propertyId,
          reservationId: query.reservationId,
          status: query.status,
          tenantId: user.tenantId,
          ...(query.search
            ? {
                OR: [
                  { guestName: { contains: query.search, mode: "insensitive" } },
                  { guestEmail: { contains: query.search, mode: "insensitive" } },
                  { subject: { contains: query.search, mode: "insensitive" } }
                ]
              }
            : {})
        }
      })
    );
  }

  async getConversation(id: string, user: AuthenticatedClientUser) {
    this.assertShamstay(user);
    const conversation = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayConversation.findFirst({
        include: {
          guest: true,
          messages: { orderBy: { createdAt: "asc" } },
          property: true,
          reservation: true
        },
        where: { id, tenantId: user.tenantId }
      })
    );
    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }
    return conversation;
  }

  async createConversation(dto: CreateShamstayConversationDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await this.ensureConversationReferences(dto, user.tenantId);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayConversation.create({
        data: {
          guestEmail: dto.guestEmail?.trim().toLowerCase() || null,
          guestId: dto.guestId,
          guestName: dto.guestName.trim(),
          messages: dto.initialMessage
            ? {
                create: {
                  body: dto.initialMessage.trim(),
                  senderName: dto.guestName.trim(),
                  senderType: "GUEST"
                }
              }
            : undefined,
          propertyId: dto.propertyId,
          reservationId: dto.reservationId,
          source: dto.source?.trim() || "ADMIN",
          status: dto.status?.trim() || "OPEN",
          subject: dto.subject.trim(),
          tenantId: user.tenantId
        },
        include: { messages: true, property: true, reservation: true }
      })
    );
  }

  async listConversationMessages(id: string, user: AuthenticatedClientUser) {
    this.assertShamstay(user);
    await this.ensureConversation(id, user.tenantId);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayMessage.findMany({
        orderBy: { createdAt: "asc" },
        where: { conversationId: id }
      })
    );
  }

  async createConversationMessage(id: string, dto: CreateShamstayMessageDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await this.ensureConversation(id, user.tenantId);
    return this.prisma.withConnectionRetry(async () => {
      const message = await this.prisma.shamstayMessage.create({
        data: {
          attachments: (dto.attachments ?? []) as Prisma.InputJsonValue,
          body: dto.body.trim(),
          conversationId: id,
          senderName: dto.senderName.trim(),
          senderType: dto.senderType?.trim() || "HOST"
        }
      });
      await this.prisma.shamstayConversation.update({
        data: { updatedAt: new Date() },
        where: { id }
      });
      return message;
    });
  }

  async archiveConversation(id: string, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await this.ensureConversation(id, user.tenantId);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayConversation.update({
        data: { status: "ARCHIVED" },
        where: { id },
        include: { guest: true, messages: true, property: true, reservation: true }
      })
    );
  }

  async publicListProperties(query: ListShamstayQueryDto) {
    const tenantId = await this.getTenantId();
    const range = this.optionalDateRange(query.checkIn, query.checkOut);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayProperty.findMany({
        orderBy: [{ rating: "desc" }, { nightlyRate: "asc" }],
        where: {
          city: query.city ? { equals: query.city, mode: "insensitive" } : undefined,
          country: query.country ? { equals: query.country, mode: "insensitive" } : undefined,
          maxGuests: query.guests ? { gte: query.guests } : undefined,
          nightlyRate:
            query.minNightlyRate !== undefined || query.maxNightlyRate !== undefined
              ? { gte: query.minNightlyRate, lte: query.maxNightlyRate }
              : undefined,
          status: "ACTIVE",
          tenantId,
          ...this.availablePropertyWhere(range),
          ...(query.search
            ? {
                OR: [
                  { name: { contains: query.search, mode: "insensitive" } },
                  { city: { contains: query.search, mode: "insensitive" } },
                  { country: { contains: query.search, mode: "insensitive" } },
                  { propertyType: { contains: query.search, mode: "insensitive" } }
                ]
              }
            : {})
        }
      })
    );
  }

  async publicGetProperty(idOrSlug: string) {
    const tenantId = await this.getTenantId();
    const property = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayProperty.findFirst({
        include: {
          availabilityBlocks: {
            orderBy: { startDate: "asc" },
            take: 30,
            where: { endDate: { gte: new Date() } }
          },
          reviews: {
            orderBy: { createdAt: "desc" },
            take: 20,
            where: { status: "APPROVED" }
          }
        },
        where: {
          status: "ACTIVE",
          tenantId,
          OR: [{ id: idOrSlug }, { slug: idOrSlug }]
        }
      })
    );
    if (!property) {
      throw new NotFoundException("Property not found");
    }
    return property;
  }

  async publicCreateReservationRequest(dto: CreatePublicShamstayReservationRequestDto) {
    const tenantId = await this.getTenantId();
    const property = await this.ensurePublicProperty(dto.propertyId, tenantId);
    if (dto.guests > property.maxGuests) {
      throw new BadRequestException("Guest count is higher than the property allows");
    }
    const { startDate: checkIn, endDate: checkOut } = this.parseDateRange(dto.checkIn, dto.checkOut, "checkOut");
    await this.assertPropertyAvailable(property.id, tenantId, checkIn, checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / DAY_MS);
    const quote = this.calculateQuote(property, nights);
    const email = dto.email.trim().toLowerCase();

    try {
      return await this.prisma.withConnectionRetry(async () => {
        const guest = await this.prisma.shamstayGuest.upsert({
          create: {
            country: dto.country?.trim() || null,
            email,
            fullName: dto.fullName.trim(),
            notes: dto.notes?.trim() || null,
            phone: dto.phone?.trim() || null,
            tenantId
          },
          update: {
            country: dto.country?.trim() || undefined,
            fullName: dto.fullName.trim(),
            notes: dto.notes?.trim() || undefined,
            phone: dto.phone?.trim() || undefined
          },
          where: { tenantId_email: { email, tenantId } }
        });
        const reservation = await this.prisma.shamstayReservation.create({
          data: {
            channel: "WEBSITE",
            checkIn,
            checkOut,
            confirmationCode: this.generateConfirmationCode(),
            currency: property.currency,
            fees: quote.cleaningFee,
            guestId: guest.id,
            guests: dto.guests,
            nightlyRate: property.nightlyRate,
            notes: dto.notes?.trim() || null,
            propertyId: property.id,
            status: "REQUESTED",
            taxes: quote.taxes,
            tenantId,
            totalAmount: quote.totalAmount
          },
          include: { guest: true, property: true }
        });
        const conversation = await this.prisma.shamstayConversation.create({
          data: {
            guestEmail: email,
            guestId: guest.id,
            guestName: dto.fullName.trim(),
            messages: dto.notes
              ? {
                  create: {
                    body: dto.notes.trim(),
                    senderName: dto.fullName.trim(),
                    senderType: "GUEST"
                  }
                }
              : undefined,
            propertyId: property.id,
            reservationId: reservation.id,
            source: "WEBSITE",
            status: "OPEN",
            subject: `Reservation request for ${property.name}`,
            tenantId
          },
          include: { messages: true }
        });
        return { conversation, reservation };
      });
    } catch (error) {
      this.rethrowUnique(error, "A reservation with this confirmation code already exists");
    }
  }

  async publicQuoteProperty(idOrSlug: string, query: ListShamstayQueryDto) {
    const tenantId = await this.getTenantId();
    const property = await this.ensurePublicProperty(idOrSlug, tenantId);
    if (!query.checkIn || !query.checkOut) {
      throw new BadRequestException("checkIn and checkOut are required");
    }
    if (query.guests && query.guests > property.maxGuests) {
      throw new BadRequestException("Guest count is higher than the property allows");
    }
    const { startDate: checkIn, endDate: checkOut } = this.parseDateRange(query.checkIn, query.checkOut, "checkOut");
    await this.assertPropertyAvailable(property.id, tenantId, checkIn, checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / DAY_MS);
    return {
      available: true,
      checkIn,
      checkOut,
      guests: query.guests,
      nights,
      property: {
        id: property.id,
        name: property.name,
        slug: property.slug
      },
      ...this.calculateQuote(property, nights)
    };
  }

  async publicCreatePayment(dto: CreatePublicShamstayPaymentDto) {
    const tenantId = await this.getTenantId();
    const reservation = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayReservation.findFirst({
        include: { guest: true, property: true },
        where: {
          id: dto.reservationId,
          status: { notIn: ["ARCHIVED", "CANCELLED"] },
          tenantId
        }
      })
    );
    if (!reservation) {
      throw new NotFoundException("Reservation not found");
    }
    try {
      return await this.prisma.withConnectionRetry(() =>
        this.prisma.shamstayPayment.create({
          data: {
            amount: reservation.totalAmount,
            currency: reservation.currency,
            fees: reservation.fees,
            guestId: reservation.guestId,
            metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
            notes: "Website payment intent.",
            provider: dto.provider?.trim() || "manual",
            providerReference: dto.providerReference?.trim() || null,
            propertyId: reservation.propertyId,
            reservationId: reservation.id,
            status: "PENDING",
            taxes: reservation.taxes,
            tenantId,
            type: "CHARGE"
          },
          include: { guest: true, property: true, reservation: true }
        })
      );
    } catch (error) {
      this.rethrowUnique(error, "A payment with this provider reference already exists");
    }
  }

  async publicCreateContact(dto: CreatePublicShamstayContactDto) {
    const tenantId = await this.getTenantId();
    let propertyId: string | undefined;
    if (dto.propertyId) {
      const property = await this.ensurePublicProperty(dto.propertyId, tenantId);
      propertyId = property.id;
    }
    if (dto.reservationId) {
      await this.ensureReservation(dto.reservationId, tenantId);
    }
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayConversation.create({
        data: {
          guestEmail: dto.email?.trim().toLowerCase() || null,
          guestName: dto.fullName.trim(),
          messages: {
            create: {
              body: dto.message.trim(),
              senderName: dto.fullName.trim(),
              senderType: "GUEST"
            }
          },
          propertyId,
          reservationId: dto.reservationId,
          source: "WEBSITE",
          status: "OPEN",
          subject: dto.subject.trim(),
          tenantId
        },
        include: { messages: true, property: true, reservation: true }
      })
    );
  }

  async publicListReviews(idOrSlug: string) {
    const property = await this.publicGetProperty(idOrSlug);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayReview.findMany({
        orderBy: { createdAt: "desc" },
        where: { propertyId: property.id, status: "APPROVED" }
      })
    );
  }

  async publicSaveWishlistItem(dto: CreateShamstayWishlistItemDto) {
    const tenantId = await this.getTenantId();
    const property = await this.ensurePublicProperty(dto.propertyId, tenantId);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayWishlistItem.upsert({
        create: {
          propertyId: property.id,
          tenantId,
          visitorKey: dto.visitorKey.trim()
        },
        update: {},
        where: {
          tenantId_visitorKey_propertyId: {
            propertyId: property.id,
            tenantId,
            visitorKey: dto.visitorKey.trim()
          }
        },
        include: { property: true }
      })
    );
  }

  async publicListWishlist(query: ListShamstaySavedQueryDto) {
    const tenantId = await this.getTenantId();
    return this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayWishlistItem.findMany({
        include: { property: true },
        orderBy: { createdAt: "desc" },
        where: {
          tenantId,
          visitorKey: query.visitorKey.trim()
        }
      })
    );
  }

  async publicRemoveWishlistItem(propertyIdOrSlug: string, visitorKey: string | undefined) {
    if (!visitorKey?.trim()) {
      throw new BadRequestException("visitorKey is required");
    }
    const tenantId = await this.getTenantId();
    const property = await this.ensurePublicProperty(propertyIdOrSlug, tenantId);
    const existing = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayWishlistItem.findUnique({
        where: {
          tenantId_visitorKey_propertyId: {
            propertyId: property.id,
            tenantId,
            visitorKey: visitorKey.trim()
          }
        }
      })
    );
    if (!existing) {
      throw new NotFoundException("Wishlist item not found");
    }
    return this.prisma.withConnectionRetry(() => this.prisma.shamstayWishlistItem.delete({ where: { id: existing.id } }));
  }

  private optionalAnalyticsRange(query: ListShamstayQueryDto) {
    const start = query.from ?? query.checkIn;
    const end = query.to ?? query.checkOut;
    if (!start && !end) {
      return undefined;
    }
    if (!start || !end) {
      throw new BadRequestException("Both from and to are required when filtering analytics by date");
    }
    return this.parseDateRange(start, end, "to");
  }

  private toCountMap(rows: Array<{ status: string; _count: { _all: number } }>): Record<string, number> {
    return rows.reduce<Record<string, number>>((counts, row) => {
      counts[row.status] = row._count._all;
      return counts;
    }, {});
  }

  private buildPropertyUpdate(dto: UpdateShamstayPropertyDto): Prisma.ShamstayPropertyUncheckedUpdateInput {
    const data: Prisma.ShamstayPropertyUncheckedUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.slug !== undefined) data.slug = this.slugify(dto.slug);
    if (dto.address !== undefined) data.address = dto.address.trim();
    if (dto.city !== undefined) data.city = dto.city.trim();
    if (dto.country !== undefined) data.country = dto.country.trim();
    if (dto.description !== undefined) data.description = dto.description.trim() || null;
    if (dto.propertyType !== undefined) data.propertyType = dto.propertyType.trim();
    if (dto.bedrooms !== undefined) data.bedrooms = dto.bedrooms;
    if (dto.bathrooms !== undefined) data.bathrooms = dto.bathrooms;
    if (dto.maxGuests !== undefined) data.maxGuests = dto.maxGuests;
    if (dto.nightlyRate !== undefined) data.nightlyRate = dto.nightlyRate;
    if (dto.cleaningFee !== undefined) data.cleaningFee = dto.cleaningFee;
    if (dto.currency !== undefined) data.currency = dto.currency.trim();
    if (dto.status !== undefined) data.status = dto.status.trim();
    if (dto.ownerName !== undefined) data.ownerName = dto.ownerName.trim() || null;
    if (dto.rating !== undefined) data.rating = dto.rating;
    if (dto.amenities !== undefined) data.amenities = dto.amenities as Prisma.InputJsonValue;
    if (dto.houseRules !== undefined) data.houseRules = dto.houseRules as Prisma.InputJsonValue;
    if (dto.photos !== undefined) data.photos = dto.photos as Prisma.InputJsonValue;
    if (dto.latitude !== undefined) data.latitude = dto.latitude;
    if (dto.longitude !== undefined) data.longitude = dto.longitude;
    return data;
  }

  private async buildPaymentCreateData(
    dto: CreateShamstayPaymentDto,
    tenantId: string
  ): Promise<Prisma.ShamstayPaymentUncheckedCreateInput> {
    if (!dto.reservationId && !dto.propertyId && !dto.guestId) {
      throw new BadRequestException("reservationId, propertyId, or guestId is required");
    }
    const reservation = dto.reservationId
      ? await this.prisma.withConnectionRetry(() =>
          this.prisma.shamstayReservation.findFirst({ where: { id: dto.reservationId, tenantId } })
        )
      : null;
    if (dto.reservationId && !reservation) {
      throw new NotFoundException("Reservation not found");
    }
    const propertyId = dto.propertyId ?? reservation?.propertyId;
    const guestId = dto.guestId ?? reservation?.guestId;
    if (propertyId) await this.ensureProperty(propertyId, tenantId);
    if (guestId) await this.ensureGuest(guestId, tenantId);

    return {
      amount: dto.amount,
      currency: dto.currency?.trim() || reservation?.currency || "USD",
      fees: dto.fees ?? 0,
      guestId,
      metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
      notes: dto.notes?.trim() || null,
      paidAt: dto.paidAt ? new Date(dto.paidAt) : null,
      provider: dto.provider?.trim() || "manual",
      providerReference: dto.providerReference?.trim() || null,
      propertyId,
      refundAmount: 0,
      reservationId: reservation?.id ?? dto.reservationId,
      status: dto.status?.trim() || "PENDING",
      taxes: dto.taxes ?? 0,
      tenantId,
      type: dto.type?.trim() || "CHARGE"
    };
  }

  private buildPaymentUpdate(dto: UpdateShamstayPaymentDto): Prisma.ShamstayPaymentUncheckedUpdateInput {
    const data: Prisma.ShamstayPaymentUncheckedUpdateInput = {};
    if (dto.provider !== undefined) data.provider = dto.provider.trim();
    if (dto.providerReference !== undefined) data.providerReference = dto.providerReference.trim() || null;
    if (dto.type !== undefined) data.type = dto.type.trim();
    if (dto.status !== undefined) data.status = dto.status.trim();
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.fees !== undefined) data.fees = dto.fees;
    if (dto.taxes !== undefined) data.taxes = dto.taxes;
    if (dto.refundAmount !== undefined) data.refundAmount = dto.refundAmount;
    if (dto.currency !== undefined) data.currency = dto.currency.trim();
    if (dto.paidAt !== undefined) data.paidAt = dto.paidAt ? new Date(dto.paidAt) : null;
    if (dto.refundedAt !== undefined) data.refundedAt = dto.refundedAt ? new Date(dto.refundedAt) : null;
    if (dto.notes !== undefined) data.notes = dto.notes.trim() || null;
    if (dto.metadata !== undefined) data.metadata = dto.metadata as Prisma.InputJsonValue;
    return data;
  }

  private calculateQuote(
    property: Pick<Prisma.ShamstayPropertyUncheckedCreateInput, "cleaningFee" | "currency" | "nightlyRate">,
    nights: number
  ) {
    const nightlySubtotal = property.nightlyRate * nights;
    const cleaningFee = property.cleaningFee;
    const taxes = Math.round((nightlySubtotal + cleaningFee) * 0.1);
    return {
      cleaningFee,
      currency: property.currency,
      nightlyRate: property.nightlyRate,
      nightlySubtotal,
      taxes,
      totalAmount: nightlySubtotal + cleaningFee + taxes
    };
  }

  private parseDateRange(start: string, end: string, endFieldName: string) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException("Date range contains an invalid date");
    }
    if (endDate <= startDate) {
      throw new BadRequestException(`${endFieldName} must be after startDate`);
    }
    return { endDate, startDate };
  }

  private optionalDateRange(start?: string, end?: string) {
    if (!start && !end) {
      return undefined;
    }
    if (!start || !end) {
      throw new BadRequestException("Both checkIn and checkOut are required when filtering by dates");
    }
    return this.parseDateRange(start, end, "checkOut");
  }

  private availablePropertyWhere(range?: { startDate: Date; endDate: Date }): Prisma.ShamstayPropertyWhereInput {
    if (!range) {
      return {};
    }
    return {
      availabilityBlocks: {
        none: {
          endDate: { gt: range.startDate },
          startDate: { lt: range.endDate },
          status: { notIn: ["AVAILABLE", "OPEN", "REMOVED"] }
        }
      },
      reservations: {
        none: {
          checkIn: { lt: range.endDate },
          checkOut: { gt: range.startDate },
          status: { in: RESERVATION_CONFLICT_STATUSES }
        }
      }
    };
  }

  private async assertPropertyAvailable(propertyId: string, tenantId: string, checkIn: Date, checkOut: Date) {
    const [reservationConflict, blockConflict] = await Promise.all([
      this.prisma.withConnectionRetry(() =>
        this.prisma.shamstayReservation.findFirst({
          select: { id: true },
          where: {
            checkIn: { lt: checkOut },
            checkOut: { gt: checkIn },
            propertyId,
            status: { in: RESERVATION_CONFLICT_STATUSES },
            tenantId
          }
        })
      ),
      this.prisma.withConnectionRetry(() =>
        this.prisma.shamstayAvailabilityBlock.findFirst({
          select: { id: true },
          where: {
            endDate: { gt: checkIn },
            propertyId,
            startDate: { lt: checkOut },
            status: { notIn: ["AVAILABLE", "OPEN", "REMOVED"] },
            tenantId
          }
        })
      )
    ]);

    if (reservationConflict || blockConflict) {
      throw new ConflictException("Property is not available for the requested dates");
    }
  }

  private async getTenantId(): Promise<string> {
    const tenant = await this.prisma.withConnectionRetry(() =>
      this.prisma.clientTenant.findUnique({
        select: { id: true },
        where: { slug: SHAMSTAY_TENANT_SLUG }
      })
    );
    if (!tenant) {
      throw new NotFoundException("Shamstay BnB tenant is not configured");
    }
    return tenant.id;
  }

  private async ensurePublicProperty(idOrSlug: string, tenantId: string) {
    const property = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayProperty.findFirst({
        where: {
          status: "ACTIVE",
          tenantId,
          OR: [{ id: idOrSlug }, { slug: idOrSlug }]
        }
      })
    );
    if (!property) {
      throw new NotFoundException("Property not found");
    }
    return property;
  }

  private async ensureReview(id: string, tenantId: string): Promise<void> {
    const review = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayReview.findFirst({ select: { id: true }, where: { id, tenantId } })
    );
    if (!review) {
      throw new NotFoundException("Review not found");
    }
  }

  private async ensureTurnover(id: string, tenantId: string): Promise<void> {
    const turnover = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayTurnover.findFirst({ select: { id: true }, where: { id, tenantId } })
    );
    if (!turnover) {
      throw new NotFoundException("Turnover not found");
    }
  }

  private async ensureConversation(id: string, tenantId: string): Promise<void> {
    const conversation = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayConversation.findFirst({ select: { id: true }, where: { id, tenantId } })
    );
    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }
  }

  private async ensurePayment(id: string, tenantId: string) {
    const payment = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayPayment.findFirst({ where: { id, tenantId } })
    );
    if (!payment) {
      throw new NotFoundException("Payment not found");
    }
    return payment;
  }

  private isPaidStatus(status: string): boolean {
    return ["CAPTURED", "PAID", "SUCCEEDED"].includes(status.trim().toUpperCase());
  }

  private isRefundedStatus(status: string): boolean {
    return ["PARTIALLY_REFUNDED", "REFUNDED"].includes(status.trim().toUpperCase());
  }

  private async ensureConversationReferences(dto: CreateShamstayConversationDto, tenantId: string): Promise<void> {
    if (dto.propertyId) {
      await this.ensureProperty(dto.propertyId, tenantId);
    }
    if (dto.reservationId) {
      await this.ensureReservation(dto.reservationId, tenantId);
    }
    if (dto.guestId) {
      await this.ensureGuest(dto.guestId, tenantId);
    }
  }

  private generateConfirmationCode(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `SHAM-${date}-${suffix}`;
  }

  private async ensureProperty(id: string, tenantId: string): Promise<void> {
    const property = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayProperty.findFirst({ select: { id: true }, where: { id, tenantId } })
    );
    if (!property) {
      throw new NotFoundException("Property not found");
    }
  }

  private async ensureGuest(id: string, tenantId: string): Promise<void> {
    const guest = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayGuest.findFirst({ select: { id: true }, where: { id, tenantId } })
    );
    if (!guest) {
      throw new NotFoundException("Guest not found");
    }
  }

  private async ensureReservation(id: string, tenantId: string): Promise<void> {
    const reservation = await this.prisma.withConnectionRetry(() =>
      this.prisma.shamstayReservation.findFirst({ select: { id: true }, where: { id, tenantId } })
    );
    if (!reservation) {
      throw new NotFoundException("Reservation not found");
    }
  }

  private assertCanWrite(user: AuthenticatedClientUser): void {
    this.assertShamstay(user);
    if (!WRITE_ROLES.has(user.role)) {
      throw new ForbiddenException("Only Shamstay owners, admins, and managers can change operations data");
    }
  }

  private assertShamstay(user: AuthenticatedClientUser): void {
    if (user.tenantSlug !== SHAMSTAY_TENANT_SLUG) {
      throw new NotFoundException("Shamstay BnB service is not enabled for this company");
    }
  }

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private rethrowUnique(error: unknown, message: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictException(message);
    }
    throw error;
  }
}
