import type { RoleRequest } from "@prisma/client";
import { db } from "../db/client.js";
import { config } from "../config/index.js";

type CreateRequestInput = {
  guildId: string;
  userId: string;
  rank: string;
  firstName: string;
  lastName: string;
};

export async function createRoleRequest(input: CreateRequestInput): Promise<RoleRequest> {
  return db.roleRequest.create({
    data: {
      guildId: input.guildId,
      userId: input.userId,
      requestedRoleId: config.targetRoleIds.join(","),
      rank: input.rank,
      firstName: input.firstName,
      lastName: input.lastName,
      status: "pending"
    }
  });
}

export async function getRoleRequest(requestId: string): Promise<RoleRequest | null> {
  return db.roleRequest.findUnique({ where: { id: requestId } });
}

export async function setModMessageId(requestId: string, modMessageId: string): Promise<void> {
  await db.roleRequest.update({
    where: { id: requestId },
    data: { modMessageId }
  });
}

export async function markApproved(requestId: string, reviewerId: string): Promise<RoleRequest> {
  return db.roleRequest.update({
    where: { id: requestId },
    data: {
      status: "approved",
      reviewedBy: reviewerId,
      reviewedAt: new Date()
    }
  });
}

export async function markRejected(requestId: string, reviewerId: string): Promise<RoleRequest> {
  return db.roleRequest.update({
    where: { id: requestId },
    data: {
      status: "rejected",
      reviewedBy: reviewerId,
      reviewedAt: new Date()
    }
  });
}
