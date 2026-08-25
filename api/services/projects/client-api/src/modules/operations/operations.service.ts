import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuthenticatedClientUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";

type OperationRecord = {
  detail: string;
  label: string;
  status: string;
  value: string;
};

type OperationWorkItem = {
  detail: string;
  label: string;
  priority: "High" | "Medium" | "Low";
};

type PersistedOperationsPanel = {
  operationsDescription: string;
  operationsTitle: string;
  primaryRecords: Prisma.JsonValue;
  workItems: Prisma.JsonValue;
};

@Injectable()
export class OperationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(user: AuthenticatedClientUser) {
    const panel = await this.getPanel(user.tenantId);
    const [records, workItems] = await Promise.all([
      this.getRecords(user, panel),
      this.getWorkItems(user, panel)
    ]);

    return {
      tenant: user.tenant,
      title: panel.operationsTitle,
      description: panel.operationsDescription,
      counts: {
        records: records.items.length,
        workItems: workItems.items.length
      }
    };
  }

  async getRecords(user: AuthenticatedClientUser, panel?: PersistedOperationsPanel) {
    const resolvedPanel = panel ?? (await this.getPanel(user.tenantId));

    return {
      tenant: user.tenant,
      title: resolvedPanel.operationsTitle,
      description: resolvedPanel.operationsDescription,
      items: this.toOperationRecords(resolvedPanel.primaryRecords)
    };
  }

  async getWorkItems(user: AuthenticatedClientUser, panel?: PersistedOperationsPanel) {
    const resolvedPanel = panel ?? (await this.getPanel(user.tenantId));
    const accountWorkItems = await this.prisma.withConnectionRetry(() =>
      this.prisma.accountWorkItem.findMany({
        orderBy: { dueAt: "asc" },
        where: { account: user.tenantName }
      })
    );

    return {
      tenant: user.tenant,
      items: [
        ...this.toOperationWorkItems(resolvedPanel.workItems).map((item, index) => ({
          id: `panel-${index + 1}`,
          source: "panel" as const,
          ...item
        })),
        ...accountWorkItems.map((item) => ({
          id: item.id,
          source: "account-work-item" as const,
          label: item.kind,
          detail: `${item.account} due ${item.dueAt.toISOString()}`,
          priority: item.priority,
          dueAt: item.dueAt.toISOString()
        }))
      ]
    };
  }

  private async getPanel(tenantId: string): Promise<PersistedOperationsPanel> {
    const panel = await this.prisma.withConnectionRetry(() =>
      this.prisma.whiteLabelPanel.findUnique({
        select: {
          operationsDescription: true,
          operationsTitle: true,
          primaryRecords: true,
          workItems: true
        },
        where: { clientTenantId: tenantId }
      })
    );

    if (!panel) {
      throw new NotFoundException("Client operations panel not found");
    }
    return panel;
  }

  private toOperationRecords(value: Prisma.JsonValue): OperationRecord[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter(this.isOperationRecord);
  }

  private toOperationWorkItems(value: Prisma.JsonValue): OperationWorkItem[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter(this.isOperationWorkItem);
  }

  private isOperationRecord(value: unknown): value is OperationRecord {
    const record = value as Record<string, unknown>;
    return (
      Boolean(value) &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof record.detail === "string" &&
      typeof record.label === "string" &&
      typeof record.status === "string" &&
      typeof record.value === "string"
    );
  }

  private isOperationWorkItem(value: unknown): value is OperationWorkItem {
    const record = value as Record<string, unknown>;
    return (
      Boolean(value) &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof record.detail === "string" &&
      typeof record.label === "string" &&
      (record.priority === "High" || record.priority === "Medium" || record.priority === "Low")
    );
  }
}
