import { db, schema } from "../../db/client";
import { trpcError } from "../../trpc/core";

export const initPersonalTeam = async ({ userId }: { userId: number }) => {
  const [team] = await db
    .insert(schema.teams)
    .values({
      createdAt: new Date(),
      updatedAt: new Date(),
      name: "Personal",
      userId,
      isPersonal: true,
    })
    .returning();
  if (!team) {
    throw new trpcError({
      code: "BAD_REQUEST",
      message: "Team not created",
    });
  }
  return {
    teamId: team.id,
  };
};
