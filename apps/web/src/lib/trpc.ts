import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { AppRouter } from "@scout5090/server";

export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>();
