import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { organizationRouter } from "./routes/organization/route";

export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  organization: organizationRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
