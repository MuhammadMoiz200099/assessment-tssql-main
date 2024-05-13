import { router, trpcError, protectedProcedure } from "../../trpc/core";
import { z } from "zod";
import { schema, db } from "../../db/client";
import { eq, and } from "drizzle-orm";

export const teams = router({
  getOne: protectedProcedure
    .input(
      z.object({
        teamId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { teamId } = input;
      const team = await db.query.teams.findFirst({
        where: eq(schema.teams.id, teamId),
      });

      if (!team) {
        throw new trpcError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }
      return team;
    }),
  get: protectedProcedure.query(async ({ ctx: { user } }) => {
    const { userId } = user;
    try {
      const teams = await db.query.teams.findMany({
        where: eq(schema.teams.userId, userId),
      });

      return teams;
    } catch (error) {
      console.error("Error fetching teams", error);
      return [];
    }
  }),
  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx: { user }, input }) => {
      const { userId } = user;
      const { name } = input;
      try {
        await db
          .insert(schema.teams)
          .values({
            createdAt: new Date(),
            updatedAt: new Date(),
            name,
            userId,
            isPersonal: false,
          })
          .returning();
        const user = await db.query.users.findFirst({
          where: eq(schema.users.id, userId),
        });
        if (!user) {
          throw new trpcError({
            code: "BAD_REQUEST",
          });
        }
        return {
          success: true,
        };
      } catch (error) {
        console.error(error);
        return {
          success: false,
        };
      }
    }),
  update: protectedProcedure
    .input(z.object({ id: z.number(), name: z.string() }))
    .mutation(async ({ ctx: { user }, input }) => {
      const { userId } = user;
      const { id, name } = input;
      db.update(schema.teams)
        .set({
          name,
        })
        .where(and(eq(schema.teams.id, id), eq(schema.teams.userId, userId)));
      return {
        success: true,
      };
    }),
});
