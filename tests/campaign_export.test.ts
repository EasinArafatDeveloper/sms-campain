import { describe, it, expect } from "vitest";
import { ExportService } from "../src/lib/services/report.service";

describe("Campaign Export & Report CSV Tests", () => {
  it("should generate clean CSV formatting from structured data", () => {
    const data = [
      {
        "Campaign Name": "Eid Special 2026",
        "Sender ID": "8809612781020",
        "Total Recipients": 1000,
        "Delivered": 980,
        "CTR": "15.4%",
      },
      {
        "Campaign Name": "Summer \"Flash\" Sale, 50% Off",
        "Sender ID": "8809612781020",
        "Total Recipients": 500,
        "Delivered": 490,
        "CTR": "22.1%",
      },
    ];

    const csv = ExportService.generateCsv(data);
    expect(csv).toContain("Campaign Name,Sender ID,Total Recipients,Delivered,CTR");
    expect(csv).toContain("Eid Special 2026,8809612781020,1000,980,15.4%");
    expect(csv).toContain("\"Summer \"\"Flash\"\" Sale, 50% Off\"");
  });

  it("should return empty string when empty array is passed", () => {
    const csv = ExportService.generateCsv([]);
    expect(csv).toBe("");
  });
});
