import * as Joi from "joi";

interface EnvVars {
  NODE_ENV: "development" | "test" | "production";
  PORT: number;
  LOG_LEVEL: "error" | "warn" | "log" | "debug" | "verbose";
  AUTH0_ISSUER_BASE_URL?: string;
  AUTH0_CLIENT_ID?: string;
  AUTH0_CLIENT_SECRET?: string;
  AUTH0_BASE_URL?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvVars {
  const schema = Joi.object<EnvVars>({
    NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
    PORT: Joi.number().port().default(3333),
    LOG_LEVEL: Joi.string().valid("error", "warn", "log", "debug", "verbose").default("debug"),
    AUTH0_ISSUER_BASE_URL: Joi.string().uri().optional(),
    AUTH0_CLIENT_ID: Joi.string().optional(),
    AUTH0_CLIENT_SECRET: Joi.string().optional(),
    AUTH0_BASE_URL: Joi.string().uri().optional(),
  }).unknown(true);

  const { error, value } = schema.validate(config, { abortEarly: false, convert: true });

  if (error) {
    throw new Error(`Environment validation failed: ${error.message}`);
  }

  return value;
}
