import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { organizationRouter } from "./routes/organization/route";
import { workspaceRouter } from "./routes/workspace/route";
import { projectRouter } from "./routes/project/route";
import { repositoryRouter } from "./routes/repository/route";

export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  organization: organizationRouter,
  workspace: workspaceRouter,
  project: projectRouter,
  repository: repositoryRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
