export const appConfig = () => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: Number(process.env.PORT ?? 3333),
    logLevel: process.env.LOG_LEVEL ?? "debug",
    auth0IssuerBaseUrl: process.env.AUTH0_ISSUER_BASE_URL,
    auth0ClientId: process.env.AUTH0_CLIENT_ID,
    auth0ClientSecret: process.env.AUTH0_CLIENT_SECRET,
    auth0BaseUrl: process.env.AUTH0_BASE_URL ?? "http://localhost:3000",
  },
});
