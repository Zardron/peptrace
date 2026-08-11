import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateClientDto } from "./clients.dto";

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  listClients() {
    return this.prisma.clientTenant.findMany({
      orderBy: { name: "asc" }
    });
  }

  async getClient(idOrSlug: string) {
    const client = await this.prisma.clientTenant.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }]
      }
    });

    if (!client) {
      throw new NotFoundException("Client tenant not found");
    }

    return client;
  }

  createClient(dto: CreateClientDto) {
    return this.prisma.clientTenant.create({
      data: {
        ...dto,
        lastActivityAt: new Date()
      }
    });
  }
}
