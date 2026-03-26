import * as Joi from "joi";

interface EnvVars {
  NODE_ENV: "development" | "test" | "production";
  PORT: number;
  LOG_LEVEL: "error" | "warn" | "log" | "debug" | "verbose";
}

export function validateEnv(config: Record<string, unknown>): EnvVars {
  const schema = Joi.object<EnvVars>({
    NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
    PORT: Joi.number().port().default(3333),
    LOG_LEVEL: Joi.string().valid("error", "warn", "log", "debug", "verbose").default("debug"),
  }).unknown(true);

  const { error, value } = schema.validate(config, { abortEarly: false, convert: true });

  if (error) {
    throw new Error(`Environment validation failed: ${error.message}`);
  }

  return value;
}
