import type { FastifyReply } from "fastify";
import { beforeAll, describe, expect, it } from "vitest";
import { db, schema } from "../../db/client";
import { createAuthenticatedCaller, createCaller } from "../helpers/utils";
import resetDb from "../helpers/resetDb";
import { eq } from "drizzle-orm";

describe("Billing routes", async () => {
  beforeAll(async () => {
    await resetDb();
  });
  let testAdminUser, testNonAdminUser, testTeam, testPlan1, testPlan2, testSubscription, testSubscriptionOrder, testNewOrder;
  let teamName = "team_moiz_1";

  let planPayload = {
    name: "Basic Plan",
    price: 20
  }

  let planPayload1 = {
    name: "Advance Plan",
    price: 70
  }

  it("should create Admin user successfully", async () => {
    let payload = {
      email: "muhammadmoiz0087@gmail.com",
      password: "P@ssw0rd",
      name: "Muhammad Moiz",
      timezone: "Asia/Riyadh",
      locale: "en",
    };
    const registeredUserRes: any = await createCaller({}).auth.register(payload);
    expect(registeredUserRes.success).toBe(true);
    const userIndb = await db.query.users.findFirst({
      where: eq(schema.users.email, payload.email),
    });
    expect(userIndb).toBeDefined();
    expect(userIndb!.email).toBe(payload.email);
    expect(userIndb!.name).toBe(payload.name);
    expect(userIndb!.hashedPassword).not.toBe(payload.password);
    expect(userIndb!.hashedPassword!.length).toBeGreaterThan(0);
    expect(userIndb!.id).toBeDefined();
    expect(userIndb!.createdAt).toBeDefined();
    expect(userIndb!.updatedAt).toBeDefined();
    expect(userIndb!.emailVerified).toBe(false);
    testAdminUser = userIndb;
  });

  it("should login the new user", async () => {
    let payload = {
      email: "muhammadmoiz0087@gmail.com",
      password: "P@ssw0rd",
    };
    await db
      .update(schema.users)
      .set({ emailVerified: true })
      .where(eq(schema.users.email, payload.email));
    const loginResponse = await createCaller({
      res: { setCookie: () => { } },
    }).auth.login(payload);
    expect(loginResponse.success).toBe(true);
  });

  it("should return the current user", async () => {
    let payload = {
      email: "muhammadmoiz0087@gmail.com",
      name: "Muhammad Moiz",
    };
    const userProfile = await createAuthenticatedCaller({
      userId: testAdminUser!.id,
    }).account.me();
    expect(userProfile.email).toBe(payload.email);
    expect(userProfile.name).toBe(payload.name);
    expect(userProfile.id).toBe(testAdminUser!.id);
    testAdminUser = userProfile;
  });

  it("should make current user the admin", async () => {
    await db
      .update(schema.users)
      .set({ isAdmin: true })
      .where(eq(schema.users.email, "muhammadmoiz0087@gmail.com"));
    const userIndb = await db.query.users.findFirst({
      where: eq(schema.users.email, testAdminUser!.email),
    });
    expect(userIndb!.isAdmin).toBe(true);
  });

  it("should create a new team", async () => {
    const teamPayload = {
      name: teamName
    }
    const createTeamRes: any = await createAuthenticatedCaller({
      userId: testAdminUser!.id,
    }).teams.create(teamPayload);
    expect(createTeamRes.success).toBe(true);
    const teamIndb = await db.query.teams.findFirst({
      where: eq(schema.teams.name, teamPayload.name),
    });
    expect(teamIndb!.name).toBe(teamPayload.name);
    expect(teamIndb!.isPersonal).toBe(false);
    testTeam = teamIndb;
  });

  it("should make the new team a personal team", async () => {
    await db
      .update(schema.teams)
      .set({ isPersonal: true })
      .where(eq(schema.teams.name, testTeam!.name));
    const teamIndb = await db.query.teams.findFirst({
      where: eq(schema.teams.name, testTeam!.name),
    });
    expect(teamIndb!.isPersonal).toBe(true);
    testTeam = teamIndb;
  });

  it("should create a pricing plan", async () => {
    const createNewPlan = await createAuthenticatedCaller({
      userId: testAdminUser!.id
    }).billing.createPlan(planPayload);

    expect(createNewPlan.success).toBe(true);
    expect(createNewPlan.plan!.name).toBe(planPayload.name);
    expect(createNewPlan.plan!.price).toBe(planPayload.price);

    testPlan1 = createNewPlan;
  });

  it("should create a non admin user", async () => {
    let payload = {
      email: "mail@mail.com",
      password: "P@ssw0rd",
      name: "test",
      timezone: "Asia/Riyadh",
      locale: "en",
    };
    const registeredUserRes: any = await createCaller({}).auth.register(payload);
    expect(registeredUserRes.success).toBe(true);
    const userIndb = await db.query.users.findFirst({
      where: eq(schema.users.email, payload.email),
    });
    expect(userIndb).toBeDefined();
    expect(userIndb!.email).toBe(payload.email);
    expect(userIndb!.name).toBe(payload.name);
    expect(userIndb!.hashedPassword).not.toBe(payload.password);
    expect(userIndb!.hashedPassword!.length).toBeGreaterThan(0);
    expect(userIndb!.id).toBeDefined();
    expect(userIndb!.createdAt).toBeDefined();
    expect(userIndb!.updatedAt).toBeDefined();
    expect(userIndb!.emailVerified).toBe(false);
    testNonAdminUser = userIndb;
  });

  it("should login the non admin user", async () => {
    let payload = {
      email: "mail@mail.com",
      password: "P@ssw0rd"
    };
    await db
      .update(schema.users)
      .set({ emailVerified: true })
      .where(eq(schema.users.email, payload.email));
    const loginResponse = await createCaller({
      res: { setCookie: () => { } },
    }).auth.login(payload);
    expect(loginResponse.success).toBe(true);
  });

  it("should not create a pricing plan with non admin user", async () => {
    const createNewPlan = await createAuthenticatedCaller({
      userId: testNonAdminUser!.id
    }).billing.createPlan(planPayload);

    expect(createNewPlan.success).toBe(false);
    expect(createNewPlan.message).toBe("Not admin user");
  });

  it("should login to the admin user again", async () => {
    let payload = {
      email: "muhammadmoiz0087@gmail.com",
      password: "P@ssw0rd",
    };
    const loginResponse = await createCaller({
      res: { setCookie: () => { } },
    }).auth.login(payload);
    expect(loginResponse.success).toBe(true);
  });

  it("should create a pricing plan with admin user", async () => {
    const createNewPlan = await createAuthenticatedCaller({
      userId: testAdminUser!.id
    }).billing.createPlan(planPayload);

    expect(createNewPlan.success).toBe(true);
    expect(createNewPlan.plan!.name).toBe(planPayload.name);
    expect(createNewPlan.plan!.price).toBe(planPayload.price);

    testPlan1 = createNewPlan.plan;
  });

  it(`should update plan price from ${planPayload.price} to 30`, async () => {
    const planIndb = await db.query.plans.findFirst({
      where: eq(schema.plans.name, planPayload.name),
    });

    expect(planIndb!.price).toBe(20); // should be 20;

    //update price

    const updatePlan = await createAuthenticatedCaller({
      userId: testAdminUser!.id
    }).billing.updatePlan({
      id: testPlan1!.id,
      price: 30
    })
    expect(updatePlan.success).toBe(true);

    expect(updatePlan.plan!.price).not.toBe(20); // should be 30;
    expect(updatePlan.plan!.price).toBe(30); // should be 30;

    testPlan1 = updatePlan.plan;
  });

  it("should read the plan", async () => {
    const readPlan = await createCaller({})
      .billing.readPlan({ id: testPlan1!.id });

    expect(readPlan.success).toBe(true);
    expect(readPlan.plan!.name).toBe(testPlan1!.name);
    expect(readPlan.plan!.price).toBe(testPlan1!.price);

  });

  it(`should create a Monthly subscription for the personal team by chosing the '${planPayload.name}'`, async () => {
    const payload = {
      name: `${planPayload.name} for ${teamName}`,
      teamId: testTeam!.id,
      planId: testPlan1!.id,
      type: "Monthly"
    }

    const createNewSubscription = await createAuthenticatedCaller({
      userId: testAdminUser!.id
    }).billing.createSubscription(payload);

    expect(createNewSubscription.success).toBe(true);

    expect(createNewSubscription.subscription!.name).toBe(payload.name);
    expect(createNewSubscription.subscription!.type).toBe(payload.type.toLowerCase());
    expect(createNewSubscription.subscription!.isActive).toBe(true);
    expect(createNewSubscription.subscription!.startDate).toBeDefined();
    expect(createNewSubscription.subscription!.endDate).toBeDefined();
    // checking if the end date is greater than the start date
    expect(createNewSubscription.subscription!.endDate.getTime()).toBeGreaterThan(createNewSubscription.subscription!.startDate.getTime());

    expect(createNewSubscription.order!.subscriptionId).toBe(createNewSubscription.subscription!.id);
    expect(createNewSubscription.order!.amount).toBe(testPlan1!.price);
    expect(createNewSubscription.order!.paymentDate).toBeDefined();

    testSubscription = createNewSubscription.subscription;
    testSubscriptionOrder = createNewSubscription.order
  });

  it(`should create a new Order for the subscription`, async () => {
    const payload = {
      amount: 100,
      subscriptionId: testSubscription!.id,
    }

    const createNewOrder = await createCaller({}).billing.createOrder(payload)

    expect(createNewOrder.success).toBe(true);
    expect(createNewOrder.order!.amount).toBe(payload.amount);
    expect(createNewOrder.order!.subscriptionId).toBe(payload.subscriptionId);
    expect(createNewOrder.order!.paymentDate).toBeDefined();

    testNewOrder = createNewOrder.order;
  });

  it(`should create a new Order for the subscription`, async () => {
    const payload = {
      orderId: testNewOrder!.id,
    }

    const createNewOrder = await createCaller({}).billing.createSubscriptionActivation(payload)

    expect(createNewOrder.success).toBe(true);
    expect(createNewOrder.activation!.orderId).toBe(payload.orderId);
    expect(createNewOrder.activation!.activationDate).toBeDefined();

  });

  it("should create a new plan for calculating the price with current plan", async () => {
    const createNewPlan = await createAuthenticatedCaller({
      userId: testAdminUser!.id
    }).billing.createPlan(planPayload1);

    expect(createNewPlan.success).toBe(true);
    expect(createNewPlan.plan!.name).toBe(planPayload1.name);
    expect(createNewPlan.plan!.price).toBe(planPayload1.price);

    testPlan2 = createNewPlan.plan;
  });

  it(`should create a new Order for the subscription`, async () => {
    const payload = {
      currentPlanId: testPlan1!.id, 
      newPlanId: testPlan2!.id, 
      subscriptionId: testSubscription!.id, 
      startDate: testSubscription!.startDate, 
      endDate: testSubscription!.endDate 
    }
    const differenceAmount = 40;
    // As current Basic plan is having updated amount of 30 and new Advance plan have amount 70 
    // we created the subscription today and update the plan today so the difference is 40. If 
    // change the plan after a week then this price may varies.

    const updatePriceRequest = await createCaller({}).billing.calculateUpgradePrice(payload)
    console.log(updatePriceRequest)

    expect(updatePriceRequest.success).toBe(true);

    expect(updatePriceRequest.amount).toBe(differenceAmount);
    expect(updatePriceRequest.order!.amount).toBe(differenceAmount);
    expect(updatePriceRequest.order!.subscriptionId).toBe(payload.subscriptionId);
    expect(updatePriceRequest.order!.paymentDate).toBeDefined();

  });


});
