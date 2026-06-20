import { Prisma } from "@prisma/client";
import { isAdventureEventType } from "@/lib/adventure-log";
import { db } from "@/lib/db";

export type AdventureLogFilters = {
  search?: string;
  type?: string;
  from?: string;
  to?: string;
  page?: number;
};

type AdventureLogRecord = Prisma.AdventureLogGetPayload<{
  include: { attachments: true; parent: { select: { id: true; title: true } } };
}>;

export type AdventureLogTreeNode = AdventureLogRecord & {
  children: AdventureLogTreeNode[];
  detachedFilterMatch: boolean;
};

function validDate(value?: string) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

export async function listAdventureLogs(filters: AdventureLogFilters) {
  const search = filters.search?.trim().slice(0, 100) ?? "";
  const from = validDate(filters.from);
  const to = validDate(filters.to);
  const page = Math.max(1, filters.page || 1);
  const pageSize = 20;
  const where: Prisma.AdventureLogWhereInput = {
    deletedAt: null,
    ...(search ? { OR: [{ title: { contains: search } }, { description: { contains: search } }] } : {}),
    ...(filters.type && isAdventureEventType(filters.type) ? { eventType: filters.type } : {}),
    ...(from || to
      ? {
          startDate: {
            ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}),
            ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
  };
  const entries = await db.adventureLog.findMany({
    where,
    include: { attachments: { orderBy: { createdAt: "asc" } }, parent: { select: { id: true, title: true } } },
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
  });
  const nodes = new Map(entries.map((entry) => [entry.id, { ...entry, children: [], detachedFilterMatch: false } as AdventureLogTreeNode]));
  const roots: AdventureLogTreeNode[] = [];
  for (const entry of entries) {
    const node = nodes.get(entry.id)!;
    const matchingParent = entry.parentId ? nodes.get(entry.parentId) : undefined;
    if (matchingParent) matchingParent.children.push(node);
    else {
      node.detachedFilterMatch = Boolean(entry.parentId);
      roots.push(node);
    }
  }
  for (const node of nodes.values()) {
    node.children.sort((a, b) => a.startDate.getTime() - b.startDate.getTime() || a.createdAt.getTime() - b.createdAt.getTime());
  }
  const totalBranches = roots.length;
  return {
    entries: roots.slice((page - 1) * pageSize, page * pageSize),
    totalMatches: entries.length,
    totalBranches,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(totalBranches / pageSize)),
  };
}

export async function listAdventureLogParentOptions() {
  return db.adventureLog.findMany({
    where: { deletedAt: null },
    select: { id: true, title: true, parentId: true },
    orderBy: [{ startDate: "desc" }, { title: "asc" }],
  });
}
