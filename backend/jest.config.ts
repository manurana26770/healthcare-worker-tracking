import type { Config } from "jest";

const config: Config = {
  rootDir: ".",
  moduleFileExtensions: ["js", "json", "ts"],
  testRegex: "test/.*\\.spec\\.ts$",
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },
  collectCoverageFrom: ["src/**/*.(t|j)s"],
  coverageDirectory: "coverage",
  testEnvironment: "node",
  clearMocks: true,
};

export default config;
