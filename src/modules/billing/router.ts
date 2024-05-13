import { router, trpcError, protectedProcedure, publicProcedure } from "../../trpc/core";
import * as schema from "../../db/schema";
import db from "../../db/client";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { calculateRemainingDays } from "./helper/helper";

export const billing = router({
    createPlan: protectedProcedure
        .input(z.object({ name: z.string(), price: z.number() }))
        .mutation(async ({ ctx: { user }, input }) => {
            try {
                const { userId } = user;
                const targetUser = await db.query.users.findFirst({
                    where: eq(schema.users.id, userId),
                });
                if (!targetUser) {
                    throw new trpcError({
                        code: "NOT_FOUND",
                    });
                }
                if (targetUser?.isAdmin) {
                    const { name, price } = input;
                    const [createNewPlan] = await db.insert(schema.plans).values({
                        name, price
                    }).returning();
                    return {
                        plan: createNewPlan,
                        success: true
                    };
                } else {
                    return {
                        success: false,
                        message: "Not admin user"
                    }
                }
            } catch (error) {
                console.log(error);
                return {
                    success: false
                }
            }
        }),
    updatePlan: protectedProcedure
        .input(z.object({ id: z.number(), name: z.string().optional(), price: z.number().optional() }))
        .mutation(async ({ ctx: { user }, input }) => {
            try {

                const { userId } = user;
                const targetUser = await db.query.users.findFirst({
                    where: eq(schema.users.id, userId),
                });
                if (!targetUser) {
                    throw new trpcError({
                        code: "NOT_FOUND",
                    });
                }
                if (targetUser?.isAdmin) {
                    const targetPlan = await db.query.plans.findFirst({
                        where: eq(schema.plans.id, input.id),
                    });

                    if (!targetPlan) {
                        throw new trpcError({
                            code: "NOT_FOUND",
                        });
                    }

                    const payload = {
                        name: input?.name || targetPlan?.name,
                        price: input?.price || targetPlan?.price
                    }
                    const [updateResponse] = await db.update(schema.plans).set(payload)
                        .where(eq(schema.plans.id, input.id)).returning();

                    return {
                        plan: updateResponse,
                        success: true
                    };
                } else {
                    return {
                        success: false,
                        message: "Admin access requried"
                    }
                }
            } catch (error) {
                console.log(error)
                return {
                    success: false
                }
            }
        }),
    readPlan: publicProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
            try {
                const targetPlan = await db.query.plans.findFirst({
                    where: eq(schema.plans.id, input.id),
                });

                if (!targetPlan) {
                    throw new trpcError({
                        code: "NOT_FOUND",
                    });
                }

                return {
                    plan: targetPlan,
                    success: true
                };
            } catch (error) {
                console.log(error);
                return {
                    success: false
                }
            }
        }),
    createSubscription: protectedProcedure
        .input(z.object({ name: z.string(), teamId: z.number(), planId: z.number(), type: z.string().toLowerCase() }))
        .mutation(async ({ ctx: { user }, input }) => {
            try {
                const { name, teamId, planId, type } = input;
                const { userId } = user;

                const targetPlan = await db.query.plans.findFirst({
                    where: eq(schema.plans.id, planId),
                });

                let endOn: any;

                if (type === "monthly") {
                    endOn = new Date().getTime() + (30 * 24 * 60 * 60 * 1000);
                } else if (type === "yearly") {
                    endOn = new Date().getTime() + (365 * 24 * 60 * 60 * 1000);
                }

                const payload = {
                    name, type, teamId, planId, userId,
                    startDate: new Date(),
                    endDate: new Date(endOn),
                    isActive: true,
                }

                const [createNewSubscription] = await db.insert(schema.subscriptions)
                    .values(payload).returning();

                const payloadOrder = {
                    subscriptionId: createNewSubscription!.id,
                    amount: targetPlan!.price,
                    paymentDate: new Date(),
                }
                const [createNeworder] = await db.insert(schema.orders).values(payloadOrder).returning();

                return {
                    subscription: createNewSubscription,
                    order: createNeworder,
                    success: true
                }
            } catch (error) {
                console.log(error);
                return {
                    success: false
                }
            }
        }),
    createOrder: publicProcedure
        .input(z.object({ amount: z.number(), subscriptionId: z.number() }))
        .mutation(async ({ input }) => {
            try {
                const { amount, subscriptionId } = input;
                const payloadOrder = {
                    subscriptionId, amount,
                    paymentDate: new Date(),
                }
                const [createNeworder] = await db.insert(schema.orders).values(payloadOrder).returning();
                return {
                    order: createNeworder,
                    success: true
                };
            } catch (error) {
                console.log(error);
                return {
                    success: false
                }
            }
        }),
    createSubscriptionActivation: publicProcedure
        .input(z.object({ orderId: z.number() }))
        .mutation(async ({ input }) => {
            try {
                const { orderId } = input;
                const payloadSubscriptionActivation = {
                    orderId,
                    activationDate: new Date(),
                }
                const [createNewSubscriptionActivation] = await db.insert(schema.subscriptionActivations)
                    .values(payloadSubscriptionActivation).returning();
                return {
                    activation: createNewSubscriptionActivation,
                    success: true
                };
            } catch (error) {
                console.log(error)
                return {
                    success: true
                };

            }
        }),
    calculateUpgradePrice: publicProcedure
        .input(z.object({ currentPlanId: z.number(), newPlanId: z.number(), subscriptionId: z.number(), startDate: z.date(), endDate: z.date() }))
        .mutation(async ({ input }) => {
            try {
                const { currentPlanId, newPlanId, subscriptionId, startDate, endDate } = input;
                const remainingDays = calculateRemainingDays(new Date(startDate).getTime(), new Date(endDate).getTime());

                const currentPlan = await db.query.plans.findFirst({
                    where: eq(schema.plans.id, currentPlanId),
                });
                const newPlan = await db.query.plans.findFirst({
                    where: eq(schema.plans.id, newPlanId),
                });;
                if (!currentPlan || !newPlan) {
                    throw new trpcError({
                        code: 'NOT_FOUND',
                        message: 'Plan not found'
                    });
                }
                const priceDifference = newPlan.price - currentPlan.price;
                const proratedPriceDifference = (priceDifference / 30) * remainingDays;
                const upgradePrice = proratedPriceDifference >= 0 ? proratedPriceDifference : 0;
                const payloadOrder = {
                    subscriptionId,
                    amount: upgradePrice,
                    paymentDate: new Date(),
                }
                const [createNeworder] = await db.insert(schema.orders).values(payloadOrder).returning();
                return {
                    amount: upgradePrice,
                    order: createNeworder,
                    success: true
                };
            } catch (error) {
                console.log(error);
                return {
                    success: false
                };
            }
        }),
});
