import { BadRequestException, ValidationError } from "@nestjs/common";

function flattenValidationErrors(errors: ValidationError[]): string[] {
  const messages: string[] = [];

  for (const error of errors) {
    if (error.constraints) {
      messages.push(...Object.values(error.constraints));
    }

    if (error.children && error.children.length > 0) {
      messages.push(...flattenValidationErrors(error.children));
    }
  }

  return messages;
}

export function validationExceptionFactory(errors: ValidationError[]): BadRequestException {
  const messages = flattenValidationErrors(errors);

  return new BadRequestException({
    error: "Validation failed",
    message: messages.length > 0 ? messages : ["Invalid request payload"],
  });
}
