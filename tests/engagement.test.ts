import { describe, it, expect } from "vitest";
import { EngagementService } from "../src/lib/services/engagement.service";

describe("Engagement Engine & Lead Scoring Tests", () => {
  it("should classify users with >=3 campaigns, >=2 clicks within 30 days as highly_active", () => {
    const lastClick = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
    const result = EngagementService.calculateScoreAndStatus(3, 5, lastClick);

    expect(result.status).toBe("highly_active");
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it("should classify users with 1 campaign clicked as engaged", () => {
    const lastClick = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    const result = EngagementService.calculateScoreAndStatus(1, 1, lastClick);

    expect(result.status).toBe("engaged");
    expect(result.score).toBeGreaterThanOrEqual(45);
  });

  it("should classify users with 0 clicks as inactive", () => {
    const result = EngagementService.calculateScoreAndStatus(0, 0, undefined);
    expect(result.status).toBe("inactive");
    expect(result.score).toBe(0);
  });
});
