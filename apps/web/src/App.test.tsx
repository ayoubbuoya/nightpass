// SPDX-License-Identifier: Apache-2.0

import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.stubEnv("VITE_NETWORK_ID", "preprod");

describe("NightPass web shell", () => {
  it("renders the complete four-step workflow without a wallet", async () => {
    const { default: App } = await import("./App.js");
    const html = renderToString(<App />);

    expect(html).toContain("Deploy or join");
    expect(html).toContain("Create credential");
    expect(html).toContain("Issue membership");
    expect(html).toContain("Prove membership");
  });
});
