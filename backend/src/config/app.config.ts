export const appConfig = () => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: Number(process.env.PORT ?? 3333),
    logLevel: process.env.LOG_LEVEL ?? "debug",
  },
});
