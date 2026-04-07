export async function queueSmsFollowUp() {
  return {
    skipped: true,
    reason: "Twilio is intentionally stubbed for V1. Hook this service into a future SMS workflow.",
  };
}

