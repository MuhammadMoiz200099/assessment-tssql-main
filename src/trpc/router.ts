import { router } from "./core";

import { auth } from "../modules/auth/router";
import { account } from "../modules/users/router";
import { teams } from "../modules/teams/router";
import { billing } from "../modules/billing/router";

export const appRouter = router({
  auth,
  // protected
  account,
  teams,
  billing
});

export type AppRouter = typeof appRouter;
