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
  CreateCommissionDto,
  CreateLeadDto,
  CreateListingDto,
  CreateOfferDto,
  CreatePublicRealEstateInquiryDto,
  CreateRealEstateSavedListingDto,
  CreateRealEstateSavedSearchDto,
  CreateRealEstateTourRequestDto,
  CreateViewingDto,
  ListRealEstateQueryDto,
  ListRealEstateSavedQueryDto,
  UpdateCommissionDto,
  UpdateLeadDto,
  UpdateListingDto,
  UpdateOfferDto,
  UpdateRealEstateStatusDto,
  UpdateViewingDto
} from "./real-estate.dto";

const REAL_ESTATE_TENANT_SLUG = "sham-real-estate-hub";
const WRITE_ROLES = new Set(["owner", "admin", "manager"]);

@Injectable()
export class RealEstateService {
  constructor(private readonly prisma: PrismaService) {}

  listListings(query: ListRealEstateQueryDto, user: AuthenticatedClientUser) {
    this.assertRealEstate(user);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateListing.findMany({
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
        where: {
          assignedAgent: query.assignedAgent,
          bathrooms: query.bathrooms ? { gte: query.bathrooms } : undefined,
          bedrooms: query.bedrooms ? { gte: query.bedrooms } : undefined,
          city: query.city ? { equals: query.city, mode: "insensitive" } : undefined,
          district: query.district ? { equals: query.district, mode: "insensitive" } : undefined,
          listingPurpose: query.listingPurpose,
          price:
            query.minPrice !== undefined || query.maxPrice !== undefined
              ? { gte: query.minPrice, lte: query.maxPrice }
              : undefined,
          propertyType: query.propertyType,
          sizeSqm: query.minSizeSqm !== undefined ? { gte: query.minSizeSqm } : undefined,
          status: query.status,
          tenantId: user.tenantId,
          ...(query.search
            ? {
                OR: [
                  { title: { contains: query.search, mode: "insensitive" } },
                  { district: { contains: query.search, mode: "insensitive" } },
                  { city: { contains: query.search, mode: "insensitive" } }
                ]
              }
            : {})
        }
      })
    );
  }

  async getListing(idOrSlug: string, user: AuthenticatedClientUser) {
    this.assertRealEstate(user);
    const listing = await this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateListing.findFirst({
        include: {
          commissions: { orderBy: { createdAt: "desc" }, take: 10 },
          leads: { orderBy: { createdAt: "desc" }, take: 10 },
          offers: { orderBy: { submittedAt: "desc" }, take: 10 },
          savedListings: { orderBy: { createdAt: "desc" }, take: 10 },
          viewings: { orderBy: { scheduledFor: "desc" }, take: 10 }
        },
        where: {
          tenantId: user.tenantId,
          OR: [{ id: idOrSlug }, { slug: idOrSlug }]
        }
      })
    );
    if (!listing) {
      throw new NotFoundException("Listing not found");
    }
    return listing;
  }

  async createListing(dto: CreateListingDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    try {
      return await this.prisma.withConnectionRetry(() =>
        this.prisma.realEstateListing.create({
          data: {
            address: dto.address.trim(),
            assignedAgent: dto.assignedAgent?.trim() || null,
            bathrooms: dto.bathrooms,
            bedrooms: dto.bedrooms,
            city: dto.city.trim(),
            currency: dto.currency?.trim() || "USD",
            description: dto.description?.trim() || null,
            district: dto.district.trim(),
            features: (dto.features ?? []) as Prisma.InputJsonValue,
            latitude: dto.latitude,
            listingPurpose: dto.listingPurpose?.trim() || "SALE",
            longitude: dto.longitude,
            lotSizeSqm: dto.lotSizeSqm,
            ownerName: dto.ownerName?.trim() || null,
            photos: (dto.photos ?? []) as Prisma.InputJsonValue,
            price: dto.price,
            propertyType: dto.propertyType.trim(),
            publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
            sizeSqm: dto.sizeSqm,
            slug: this.slugify(dto.slug ?? dto.title),
            status: dto.status?.trim() || "DRAFT",
            tenantId: user.tenantId,
            title: dto.title.trim(),
            yearBuilt: dto.yearBuilt
          }
        })
      );
    } catch (error) {
      this.rethrowUnique(error, "A listing with this slug already exists");
    }
  }

  async updateListing(id: string, dto: UpdateListingDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await this.ensureListing(id, user.tenantId);
    const data = this.buildListingUpdate(dto);
    try {
      return await this.prisma.withConnectionRetry(() =>
        this.prisma.realEstateListing.update({
          data,
          where: { id }
        })
      );
    } catch (error) {
      this.rethrowUnique(error, "A listing with this slug already exists");
    }
  }

  async updateListingStatus(id: string, dto: UpdateRealEstateStatusDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await this.ensureListing(id, user.tenantId);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateListing.update({
        data: {
          publishedAt: dto.status.trim().toUpperCase() === "PUBLISHED" ? new Date() : undefined,
          status: dto.status.trim()
        },
        where: { id }
      })
    );
  }

  async archiveListing(id: string, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await this.ensureListing(id, user.tenantId);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateListing.update({
        data: { status: "ARCHIVED" },
        where: { id }
      })
    );
  }

  listLeads(query: ListRealEstateQueryDto, user: AuthenticatedClientUser) {
    this.assertRealEstate(user);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateLead.findMany({
        include: { listing: true },
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        where: {
          assignedAgent: query.assignedAgent,
          listingId: query.listingId,
          status: query.status,
          tenantId: user.tenantId,
          ...(query.search
            ? {
                OR: [
                  { fullName: { contains: query.search, mode: "insensitive" } },
                  { phone: { contains: query.search, mode: "insensitive" } },
                  { email: { contains: query.search, mode: "insensitive" } }
                ]
              }
            : {})
        }
      })
    );
  }

  async getLead(id: string, user: AuthenticatedClientUser) {
    this.assertRealEstate(user);
    const lead = await this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateLead.findFirst({
        include: { listing: true, offers: true, viewings: true },
        where: { id, tenantId: user.tenantId }
      })
    );
    if (!lead) {
      throw new NotFoundException("Lead not found");
    }
    return lead;
  }

  async createLead(dto: CreateLeadDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    if (dto.listingId) {
      await this.ensureListing(dto.listingId, user.tenantId);
    }
    if (dto.budgetMin !== undefined && dto.budgetMax !== undefined && dto.budgetMax < dto.budgetMin) {
      throw new BadRequestException("budgetMax must be greater than or equal to budgetMin");
    }

    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateLead.create({
        data: {
          assignedAgent: dto.assignedAgent?.trim() || null,
          budgetMax: dto.budgetMax,
          budgetMin: dto.budgetMin,
          email: dto.email?.trim().toLowerCase() || null,
          fullName: dto.fullName.trim(),
          interestType: dto.interestType.trim(),
          listingId: dto.listingId,
          notes: dto.notes?.trim() || null,
          phone: dto.phone.trim(),
          priority: dto.priority?.trim() || "MEDIUM",
          source: dto.source.trim(),
          status: dto.status?.trim() || "NEW",
          tenantId: user.tenantId
        },
        include: { listing: true }
      })
    );
  }

  async updateLead(id: string, dto: UpdateLeadDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await this.ensureLead(id, user.tenantId);
    if (dto.listingId) {
      await this.ensureListing(dto.listingId, user.tenantId);
    }
    this.assertBudgetRange(dto.budgetMin, dto.budgetMax);

    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateLead.update({
        data: {
          assignedAgent: dto.assignedAgent !== undefined ? dto.assignedAgent.trim() || null : undefined,
          budgetMax: dto.budgetMax,
          budgetMin: dto.budgetMin,
          email: dto.email !== undefined ? dto.email.trim().toLowerCase() || null : undefined,
          fullName: dto.fullName?.trim(),
          interestType: dto.interestType?.trim(),
          listingId: dto.listingId,
          notes: dto.notes !== undefined ? dto.notes.trim() || null : undefined,
          phone: dto.phone?.trim(),
          priority: dto.priority?.trim(),
          source: dto.source?.trim(),
          status: dto.status?.trim()
        },
        where: { id },
        include: { listing: true }
      })
    );
  }

  async updateLeadStatus(id: string, dto: UpdateRealEstateStatusDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    const lead = await this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateLead.findFirst({ where: { id, tenantId: user.tenantId } })
    );
    if (!lead) {
      throw new NotFoundException("Lead not found");
    }
    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateLead.update({
        data: { notes: dto.notes?.trim() ?? lead.notes, status: dto.status.trim() },
        where: { id },
        include: { listing: true }
      })
    );
  }

  async archiveLead(id: string, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await this.ensureLead(id, user.tenantId);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateLead.update({
        data: { status: "ARCHIVED" },
        where: { id },
        include: { listing: true }
      })
    );
  }

  listViewings(query: ListRealEstateQueryDto, user: AuthenticatedClientUser) {
    this.assertRealEstate(user);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateViewing.findMany({
        include: { lead: true, listing: true },
        orderBy: { scheduledFor: "asc" },
        where: {
          assignedAgent: query.assignedAgent,
          listingId: query.listingId,
          status: query.status,
          tenantId: user.tenantId
        }
      })
    );
  }

  async getViewing(id: string, user: AuthenticatedClientUser) {
    this.assertRealEstate(user);
    const viewing = await this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateViewing.findFirst({
        include: { lead: true, listing: true },
        where: { id, tenantId: user.tenantId }
      })
    );
    if (!viewing) {
      throw new NotFoundException("Viewing not found");
    }
    return viewing;
  }

  async createViewing(dto: CreateViewingDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await this.ensureListing(dto.listingId, user.tenantId);
    if (dto.leadId) {
      await this.ensureLead(dto.leadId, user.tenantId);
    }

    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateViewing.create({
        data: {
          assignedAgent: dto.assignedAgent?.trim() || null,
          feedback: (dto.feedback ?? {}) as Prisma.InputJsonValue,
          leadId: dto.leadId,
          listingId: dto.listingId,
          notes: dto.notes?.trim() || null,
          scheduledFor: new Date(dto.scheduledFor),
          status: dto.status?.trim() || "SCHEDULED",
          tenantId: user.tenantId
        },
        include: { lead: true, listing: true }
      })
    );
  }

  async updateViewing(id: string, dto: UpdateViewingDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await this.ensureViewing(id, user.tenantId);
    if (dto.listingId) {
      await this.ensureListing(dto.listingId, user.tenantId);
    }
    if (dto.leadId) {
      await this.ensureLead(dto.leadId, user.tenantId);
    }

    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateViewing.update({
        data: {
          assignedAgent: dto.assignedAgent !== undefined ? dto.assignedAgent.trim() || null : undefined,
          feedback: dto.feedback !== undefined ? (dto.feedback as Prisma.InputJsonValue) : undefined,
          leadId: dto.leadId,
          listingId: dto.listingId,
          notes: dto.notes !== undefined ? dto.notes.trim() || null : undefined,
          scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
          status: dto.status?.trim()
        },
        where: { id },
        include: { lead: true, listing: true }
      })
    );
  }

  async updateViewingStatus(id: string, dto: UpdateRealEstateStatusDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    const viewing = await this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateViewing.findFirst({ where: { id, tenantId: user.tenantId } })
    );
    if (!viewing) {
      throw new NotFoundException("Viewing not found");
    }
    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateViewing.update({
        data: { notes: dto.notes?.trim() ?? viewing.notes, status: dto.status.trim() },
        where: { id },
        include: { lead: true, listing: true }
      })
    );
  }

  async archiveViewing(id: string, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await this.ensureViewing(id, user.tenantId);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateViewing.update({
        data: { status: "ARCHIVED" },
        where: { id },
        include: { lead: true, listing: true }
      })
    );
  }

  listOffers(query: ListRealEstateQueryDto, user: AuthenticatedClientUser) {
    this.assertRealEstate(user);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateOffer.findMany({
        include: { lead: true, listing: true },
        orderBy: { submittedAt: "desc" },
        where: {
          listingId: query.listingId,
          status: query.status,
          tenantId: user.tenantId
        }
      })
    );
  }

  async getOffer(id: string, user: AuthenticatedClientUser) {
    this.assertRealEstate(user);
    const offer = await this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateOffer.findFirst({
        include: { commissions: true, lead: true, listing: true },
        where: { id, tenantId: user.tenantId }
      })
    );
    if (!offer) {
      throw new NotFoundException("Offer not found");
    }
    return offer;
  }

  async createOffer(dto: CreateOfferDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await Promise.all([this.ensureListing(dto.listingId, user.tenantId), this.ensureLead(dto.leadId, user.tenantId)]);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateOffer.create({
        data: {
          amount: dto.amount,
          currency: dto.currency?.trim() || "USD",
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          leadId: dto.leadId,
          listingId: dto.listingId,
          notes: dto.notes?.trim() || null,
          status: dto.status?.trim() || "SUBMITTED",
          submittedAt: dto.submittedAt ? new Date(dto.submittedAt) : new Date(),
          tenantId: user.tenantId,
          terms: (dto.terms ?? {}) as Prisma.InputJsonValue
        },
        include: { lead: true, listing: true }
      })
    );
  }

  async updateOffer(id: string, dto: UpdateOfferDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await this.ensureOffer(id, user.tenantId);
    if (dto.listingId) {
      await this.ensureListing(dto.listingId, user.tenantId);
    }
    if (dto.leadId) {
      await this.ensureLead(dto.leadId, user.tenantId);
    }

    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateOffer.update({
        data: {
          amount: dto.amount,
          currency: dto.currency?.trim(),
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
          leadId: dto.leadId,
          listingId: dto.listingId,
          notes: dto.notes !== undefined ? dto.notes.trim() || null : undefined,
          status: dto.status?.trim(),
          submittedAt: dto.submittedAt ? new Date(dto.submittedAt) : undefined,
          terms: dto.terms !== undefined ? (dto.terms as Prisma.InputJsonValue) : undefined
        },
        where: { id },
        include: { lead: true, listing: true }
      })
    );
  }

  async updateOfferStatus(id: string, dto: UpdateRealEstateStatusDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    const offer = await this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateOffer.findFirst({ where: { id, tenantId: user.tenantId } })
    );
    if (!offer) {
      throw new NotFoundException("Offer not found");
    }
    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateOffer.update({
        data: { notes: dto.notes?.trim() ?? offer.notes, status: dto.status.trim() },
        where: { id },
        include: { lead: true, listing: true }
      })
    );
  }

  async archiveOffer(id: string, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await this.ensureOffer(id, user.tenantId);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateOffer.update({
        data: { status: "ARCHIVED" },
        where: { id },
        include: { lead: true, listing: true }
      })
    );
  }

  listCommissions(query: ListRealEstateQueryDto, user: AuthenticatedClientUser) {
    this.assertRealEstate(user);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateCommission.findMany({
        include: { listing: true, offer: true },
        orderBy: { createdAt: "desc" },
        where: {
          listingId: query.listingId,
          status: query.status,
          tenantId: user.tenantId
        }
      })
    );
  }

  async getCommission(id: string, user: AuthenticatedClientUser) {
    this.assertRealEstate(user);
    const commission = await this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateCommission.findFirst({
        include: { listing: true, offer: true },
        where: { id, tenantId: user.tenantId }
      })
    );
    if (!commission) {
      throw new NotFoundException("Commission not found");
    }
    return commission;
  }

  async createCommission(dto: CreateCommissionDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    if (dto.listingId) {
      await this.ensureListing(dto.listingId, user.tenantId);
    }
    if (dto.offerId) {
      await this.ensureOffer(dto.offerId, user.tenantId);
    }

    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateCommission.create({
        data: {
          agentName: dto.agentName.trim(),
          agentShare: dto.agentShare,
          brokerageShare: dto.brokerageShare,
          currency: dto.currency?.trim() || "USD",
          dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
          grossCommission: dto.grossCommission,
          listingId: dto.listingId,
          notes: dto.notes?.trim() || null,
          offerId: dto.offerId,
          status: dto.status?.trim() || "PENDING",
          tenantId: user.tenantId
        },
        include: { listing: true, offer: true }
      })
    );
  }

  async updateCommission(id: string, dto: UpdateCommissionDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    const commission = await this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateCommission.findFirst({ where: { id, tenantId: user.tenantId } })
    );
    if (!commission) {
      throw new NotFoundException("Commission not found");
    }
    if (dto.listingId) {
      await this.ensureListing(dto.listingId, user.tenantId);
    }
    if (dto.offerId) {
      await this.ensureOffer(dto.offerId, user.tenantId);
    }

    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateCommission.update({
        data: {
          agentName: dto.agentName?.trim(),
          agentShare: dto.agentShare,
          brokerageShare: dto.brokerageShare,
          currency: dto.currency?.trim(),
          dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
          grossCommission: dto.grossCommission,
          listingId: dto.listingId,
          notes: dto.notes !== undefined ? dto.notes.trim() || null : undefined,
          offerId: dto.offerId,
          paidAt: dto.paidAt
            ? new Date(dto.paidAt)
            : dto.status?.trim().toUpperCase() === "PAID"
              ? commission.paidAt ?? new Date()
              : undefined,
          status: dto.status?.trim()
        },
        where: { id },
        include: { listing: true, offer: true }
      })
    );
  }

  async updateCommissionStatus(id: string, dto: UpdateRealEstateStatusDto, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    const commission = await this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateCommission.findFirst({ where: { id, tenantId: user.tenantId } })
    );
    if (!commission) {
      throw new NotFoundException("Commission not found");
    }
    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateCommission.update({
        data: {
          notes: dto.notes?.trim() ?? commission.notes,
          paidAt: dto.status.trim().toUpperCase() === "PAID" ? new Date() : commission.paidAt,
          status: dto.status.trim()
        },
        where: { id },
        include: { listing: true, offer: true }
      })
    );
  }

  async voidCommission(id: string, user: AuthenticatedClientUser) {
    this.assertCanWrite(user);
    await this.ensureCommission(id, user.tenantId);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateCommission.update({
        data: { paidAt: null, status: "VOID" },
        where: { id },
        include: { listing: true, offer: true }
      })
    );
  }

  listSavedListings(visitorKey: string | undefined, user: AuthenticatedClientUser) {
    this.assertRealEstate(user);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateSavedListing.findMany({
        include: { listing: true },
        orderBy: { createdAt: "desc" },
        where: {
          tenantId: user.tenantId,
          visitorKey: visitorKey?.trim()
        }
      })
    );
  }

  listSavedSearches(visitorKey: string | undefined, user: AuthenticatedClientUser) {
    this.assertRealEstate(user);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateSavedSearch.findMany({
        orderBy: { updatedAt: "desc" },
        where: {
          tenantId: user.tenantId,
          visitorKey: visitorKey?.trim()
        }
      })
    );
  }

  analyticsOverview(query: ListRealEstateQueryDto, user: AuthenticatedClientUser) {
    this.assertRealEstate(user);
    const dateRange = this.optionalAnalyticsRange(query);
    const createdWhere = dateRange ? { createdAt: { gte: dateRange.startDate, lte: dateRange.endDate } } : {};
    const scheduledWhere = dateRange ? { scheduledFor: { gte: dateRange.startDate, lte: dateRange.endDate } } : {};
    const submittedWhere = dateRange ? { submittedAt: { gte: dateRange.startDate, lte: dateRange.endDate } } : {};

    return this.prisma.withConnectionRetry(async () => {
      const [
        listingStatuses,
        leadStatuses,
        viewingStatuses,
        offerStatuses,
        offerTotals,
        commissionTotals,
        savedListings,
        savedSearches
      ] = await Promise.all([
        this.prisma.realEstateListing.groupBy({
          by: ["status"],
          _count: { _all: true },
          where: {
            assignedAgent: query.assignedAgent,
            city: query.city ? { equals: query.city, mode: "insensitive" } : undefined,
            district: query.district ? { equals: query.district, mode: "insensitive" } : undefined,
            listingPurpose: query.listingPurpose,
            propertyType: query.propertyType,
            tenantId: user.tenantId,
            ...createdWhere
          }
        }),
        this.prisma.realEstateLead.groupBy({
          by: ["status"],
          _count: { _all: true },
          where: {
            assignedAgent: query.assignedAgent,
            listingId: query.listingId,
            tenantId: user.tenantId,
            ...createdWhere
          }
        }),
        this.prisma.realEstateViewing.groupBy({
          by: ["status"],
          _count: { _all: true },
          where: {
            assignedAgent: query.assignedAgent,
            listingId: query.listingId,
            tenantId: user.tenantId,
            ...scheduledWhere
          }
        }),
        this.prisma.realEstateOffer.groupBy({
          by: ["status"],
          _count: { _all: true },
          where: {
            listingId: query.listingId,
            tenantId: user.tenantId,
            ...submittedWhere
          }
        }),
        this.prisma.realEstateOffer.aggregate({
          _sum: { amount: true },
          where: {
            listingId: query.listingId,
            status: { notIn: ["REJECTED", "WITHDRAWN", "CANCELLED"] },
            tenantId: user.tenantId,
            ...submittedWhere
          }
        }),
        this.prisma.realEstateCommission.aggregate({
          _sum: { agentShare: true, brokerageShare: true, grossCommission: true },
          where: {
            listingId: query.listingId,
            status: { notIn: ["VOID", "CANCELLED"] },
            tenantId: user.tenantId,
            ...createdWhere
          }
        }),
        this.prisma.realEstateSavedListing.count({
          where: {
            listingId: query.listingId,
            tenantId: user.tenantId,
            ...createdWhere
          }
        }),
        this.prisma.realEstateSavedSearch.count({
          where: {
            tenantId: user.tenantId,
            ...createdWhere
          }
        })
      ]);

      return {
        filters: {
          assignedAgent: query.assignedAgent ?? null,
          from: dateRange?.startDate ?? null,
          listingId: query.listingId ?? null,
          to: dateRange?.endDate ?? null
        },
        listings: {
          byStatus: this.toCountMap(listingStatuses),
          total: listingStatuses.reduce((sum, row) => sum + row._count._all, 0)
        },
        leads: {
          byStatus: this.toCountMap(leadStatuses),
          total: leadStatuses.reduce((sum, row) => sum + row._count._all, 0)
        },
        tours: {
          byStatus: this.toCountMap(viewingStatuses),
          total: viewingStatuses.reduce((sum, row) => sum + row._count._all, 0)
        },
        offers: {
          byStatus: this.toCountMap(offerStatuses),
          pipelineValue: offerTotals._sum.amount ?? 0,
          total: offerStatuses.reduce((sum, row) => sum + row._count._all, 0)
        },
        commissions: {
          agentShare: commissionTotals._sum.agentShare ?? 0,
          brokerageShare: commissionTotals._sum.brokerageShare ?? 0,
          grossCommission: commissionTotals._sum.grossCommission ?? 0
        },
        engagement: {
          savedListings,
          savedSearches
        }
      };
    });
  }

  async publicListListings(query: ListRealEstateQueryDto) {
    const tenantId = await this.getTenantId();
    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateListing.findMany({
        orderBy: [{ publishedAt: "desc" }, { price: "asc" }],
        where: {
          bathrooms: query.bathrooms ? { gte: query.bathrooms } : undefined,
          bedrooms: query.bedrooms ? { gte: query.bedrooms } : undefined,
          city: query.city ? { equals: query.city, mode: "insensitive" } : undefined,
          district: query.district ? { equals: query.district, mode: "insensitive" } : undefined,
          listingPurpose: query.listingPurpose,
          price:
            query.minPrice !== undefined || query.maxPrice !== undefined
              ? { gte: query.minPrice, lte: query.maxPrice }
              : undefined,
          propertyType: query.propertyType,
          sizeSqm: query.minSizeSqm !== undefined ? { gte: query.minSizeSqm } : undefined,
          status: "PUBLISHED",
          tenantId,
          ...(query.search
            ? {
                OR: [
                  { title: { contains: query.search, mode: "insensitive" } },
                  { district: { contains: query.search, mode: "insensitive" } },
                  { city: { contains: query.search, mode: "insensitive" } },
                  { propertyType: { contains: query.search, mode: "insensitive" } }
                ]
              }
            : {})
        }
      })
    );
  }

  async publicGetListing(idOrSlug: string) {
    const tenantId = await this.getTenantId();
    const listing = await this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateListing.findFirst({
        where: {
          status: "PUBLISHED",
          tenantId,
          OR: [{ id: idOrSlug }, { slug: idOrSlug }]
        }
      })
    );
    if (!listing) {
      throw new NotFoundException("Listing not found");
    }
    return listing;
  }

  async publicCreateInquiry(dto: CreatePublicRealEstateInquiryDto) {
    const tenantId = await this.getTenantId();
    const listing = dto.listingId ? await this.ensurePublicListing(dto.listingId, tenantId) : null;
    this.assertBudgetRange(dto.budgetMin, dto.budgetMax);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateLead.create({
        data: {
          budgetMax: dto.budgetMax,
          budgetMin: dto.budgetMin,
          email: dto.email?.trim().toLowerCase() || null,
          fullName: dto.fullName.trim(),
          interestType: dto.interestType?.trim() || listing?.listingPurpose || "GENERAL",
          listingId: listing?.id,
          notes: dto.message?.trim() || null,
          phone: dto.phone.trim(),
          priority: listing ? "HIGH" : "MEDIUM",
          source: "WEBSITE",
          status: "NEW",
          tenantId
        },
        include: { listing: true }
      })
    );
  }

  async publicCreateTourRequest(dto: CreateRealEstateTourRequestDto) {
    const tenantId = await this.getTenantId();
    const listing = await this.ensurePublicListing(dto.listingId, tenantId);
    return this.prisma.withConnectionRetry(async () => {
      const lead = await this.prisma.realEstateLead.create({
        data: {
          assignedAgent: dto.assignedAgent?.trim() || listing.assignedAgent,
          email: dto.email?.trim().toLowerCase() || null,
          fullName: dto.fullName.trim(),
          interestType: listing.listingPurpose,
          listingId: listing.id,
          notes: dto.message?.trim() || null,
          phone: dto.phone.trim(),
          priority: "HIGH",
          source: "WEBSITE_TOUR",
          status: "NEW",
          tenantId
        }
      });
      const viewing = await this.prisma.realEstateViewing.create({
        data: {
          assignedAgent: dto.assignedAgent?.trim() || listing.assignedAgent,
          leadId: lead.id,
          listingId: listing.id,
          notes: dto.message?.trim() || null,
          scheduledFor: new Date(dto.scheduledFor),
          status: "REQUESTED",
          tenantId
        },
        include: { lead: true, listing: true }
      });
      return { lead, viewing };
    });
  }

  async publicSaveListing(dto: CreateRealEstateSavedListingDto) {
    const tenantId = await this.getTenantId();
    const listing = await this.ensurePublicListing(dto.listingId, tenantId);
    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateSavedListing.upsert({
        create: {
          listingId: listing.id,
          tenantId,
          visitorKey: dto.visitorKey.trim()
        },
        update: {},
        where: {
          tenantId_visitorKey_listingId: {
            listingId: listing.id,
            tenantId,
            visitorKey: dto.visitorKey.trim()
          }
        },
        include: { listing: true }
      })
    );
  }

  async publicListSavedListings(query: ListRealEstateSavedQueryDto) {
    const tenantId = await this.getTenantId();
    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateSavedListing.findMany({
        include: { listing: true },
        orderBy: { createdAt: "desc" },
        where: {
          tenantId,
          visitorKey: query.visitorKey.trim()
        }
      })
    );
  }

  async publicCreateSavedSearch(dto: CreateRealEstateSavedSearchDto) {
    const tenantId = await this.getTenantId();
    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateSavedSearch.create({
        data: {
          alertFrequency: dto.alertFrequency?.trim() || "WEEKLY",
          filters: dto.filters as Prisma.InputJsonValue,
          label: dto.label.trim(),
          tenantId,
          visitorKey: dto.visitorKey.trim()
        }
      })
    );
  }

  async publicListSavedSearches(query: ListRealEstateSavedQueryDto) {
    const tenantId = await this.getTenantId();
    return this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateSavedSearch.findMany({
        orderBy: { updatedAt: "desc" },
        where: {
          tenantId,
          visitorKey: query.visitorKey.trim()
        }
      })
    );
  }

  async publicRemoveSavedListing(listingIdOrSlug: string, visitorKey: string | undefined) {
    if (!visitorKey?.trim()) {
      throw new BadRequestException("visitorKey is required");
    }
    const tenantId = await this.getTenantId();
    const listing = await this.ensurePublicListing(listingIdOrSlug, tenantId);
    const existing = await this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateSavedListing.findUnique({
        where: {
          tenantId_visitorKey_listingId: {
            listingId: listing.id,
            tenantId,
            visitorKey: visitorKey.trim()
          }
        }
      })
    );
    if (!existing) {
      throw new NotFoundException("Saved listing not found");
    }
    return this.prisma.withConnectionRetry(() => this.prisma.realEstateSavedListing.delete({ where: { id: existing.id } }));
  }

  async publicDeleteSavedSearch(id: string, visitorKey: string | undefined) {
    if (!visitorKey?.trim()) {
      throw new BadRequestException("visitorKey is required");
    }
    const tenantId = await this.getTenantId();
    const savedSearch = await this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateSavedSearch.findFirst({
        select: { id: true },
        where: {
          id,
          tenantId,
          visitorKey: visitorKey.trim()
        }
      })
    );
    if (!savedSearch) {
      throw new NotFoundException("Saved search not found");
    }
    return this.prisma.withConnectionRetry(() => this.prisma.realEstateSavedSearch.delete({ where: { id } }));
  }

  private optionalAnalyticsRange(query: ListRealEstateQueryDto) {
    if (!query.from && !query.to) {
      return undefined;
    }
    if (!query.from || !query.to) {
      throw new BadRequestException("Both from and to are required when filtering analytics by date");
    }
    const startDate = new Date(query.from);
    const endDate = new Date(query.to);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException("Analytics date range contains an invalid date");
    }
    if (endDate <= startDate) {
      throw new BadRequestException("to must be after from");
    }
    return { endDate, startDate };
  }

  private toCountMap(rows: Array<{ status: string; _count: { _all: number } }>): Record<string, number> {
    return rows.reduce<Record<string, number>>((counts, row) => {
      counts[row.status] = row._count._all;
      return counts;
    }, {});
  }

  private buildListingUpdate(dto: UpdateListingDto): Prisma.RealEstateListingUncheckedUpdateInput {
    const data: Prisma.RealEstateListingUncheckedUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.slug !== undefined) data.slug = this.slugify(dto.slug);
    if (dto.propertyType !== undefined) data.propertyType = dto.propertyType.trim();
    if (dto.address !== undefined) data.address = dto.address.trim();
    if (dto.district !== undefined) data.district = dto.district.trim();
    if (dto.city !== undefined) data.city = dto.city.trim();
    if (dto.description !== undefined) data.description = dto.description.trim() || null;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.currency !== undefined) data.currency = dto.currency.trim();
    if (dto.status !== undefined) data.status = dto.status.trim();
    if (dto.listingPurpose !== undefined) data.listingPurpose = dto.listingPurpose.trim();
    if (dto.bedrooms !== undefined) data.bedrooms = dto.bedrooms;
    if (dto.bathrooms !== undefined) data.bathrooms = dto.bathrooms;
    if (dto.sizeSqm !== undefined) data.sizeSqm = dto.sizeSqm;
    if (dto.lotSizeSqm !== undefined) data.lotSizeSqm = dto.lotSizeSqm;
    if (dto.yearBuilt !== undefined) data.yearBuilt = dto.yearBuilt;
    if (dto.ownerName !== undefined) data.ownerName = dto.ownerName.trim() || null;
    if (dto.assignedAgent !== undefined) data.assignedAgent = dto.assignedAgent.trim() || null;
    if (dto.publishedAt !== undefined) data.publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : null;
    if (dto.features !== undefined) data.features = dto.features as Prisma.InputJsonValue;
    if (dto.photos !== undefined) data.photos = dto.photos as Prisma.InputJsonValue;
    if (dto.latitude !== undefined) data.latitude = dto.latitude;
    if (dto.longitude !== undefined) data.longitude = dto.longitude;
    return data;
  }

  private async getTenantId(): Promise<string> {
    const tenant = await this.prisma.withConnectionRetry(() =>
      this.prisma.clientTenant.findUnique({
        select: { id: true },
        where: { slug: REAL_ESTATE_TENANT_SLUG }
      })
    );
    if (!tenant) {
      throw new NotFoundException("Sham Real Estate Hub tenant is not configured");
    }
    return tenant.id;
  }

  private async ensurePublicListing(idOrSlug: string, tenantId: string) {
    const listing = await this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateListing.findFirst({
        where: {
          status: "PUBLISHED",
          tenantId,
          OR: [{ id: idOrSlug }, { slug: idOrSlug }]
        }
      })
    );
    if (!listing) {
      throw new NotFoundException("Listing not found");
    }
    return listing;
  }

  private assertBudgetRange(budgetMin?: number, budgetMax?: number): void {
    if (budgetMin !== undefined && budgetMax !== undefined && budgetMax < budgetMin) {
      throw new BadRequestException("budgetMax must be greater than or equal to budgetMin");
    }
  }

  private async ensureListing(id: string, tenantId: string): Promise<void> {
    const listing = await this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateListing.findFirst({ select: { id: true }, where: { id, tenantId } })
    );
    if (!listing) {
      throw new NotFoundException("Listing not found");
    }
  }

  private async ensureLead(id: string, tenantId: string): Promise<void> {
    const lead = await this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateLead.findFirst({ select: { id: true }, where: { id, tenantId } })
    );
    if (!lead) {
      throw new NotFoundException("Lead not found");
    }
  }

  private async ensureViewing(id: string, tenantId: string): Promise<void> {
    const viewing = await this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateViewing.findFirst({ select: { id: true }, where: { id, tenantId } })
    );
    if (!viewing) {
      throw new NotFoundException("Viewing not found");
    }
  }

  private async ensureOffer(id: string, tenantId: string): Promise<void> {
    const offer = await this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateOffer.findFirst({ select: { id: true }, where: { id, tenantId } })
    );
    if (!offer) {
      throw new NotFoundException("Offer not found");
    }
  }

  private async ensureCommission(id: string, tenantId: string): Promise<void> {
    const commission = await this.prisma.withConnectionRetry(() =>
      this.prisma.realEstateCommission.findFirst({ select: { id: true }, where: { id, tenantId } })
    );
    if (!commission) {
      throw new NotFoundException("Commission not found");
    }
  }

  private assertCanWrite(user: AuthenticatedClientUser): void {
    this.assertRealEstate(user);
    if (!WRITE_ROLES.has(user.role)) {
      throw new ForbiddenException("Only brokerage owners, admins, and managers can change real estate data");
    }
  }

  private assertRealEstate(user: AuthenticatedClientUser): void {
    if (user.tenantSlug !== REAL_ESTATE_TENANT_SLUG) {
      throw new NotFoundException("Real Estate service is not enabled for this company");
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
