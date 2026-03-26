import { Body, Controller, Get, Post } from "@nestjs/common";
import { ValidationProbeDto } from "./dto/validation-probe.dto";

@Controller("health")
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: "ok",
      service: "healthcare-backend",
      timestamp: new Date().toISOString(),
    };
  }

  @Post("validate")
  validatePayload(@Body() payload: ValidationProbeDto) {
    return {
      message: "Validation pipeline is active",
      payload,
    };
  }
}
