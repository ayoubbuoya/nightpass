// SPDX-License-Identifier: Apache-2.0

import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.stubEnv("VITE_NETWORK_ID", "preprod");

const render = async () => {
  const { default: App } = await import("./App.js");
  return renderToString(<App />);
};

describe("NightPass web shell", () => {
  it("renders the full creator, member, issuer, and activation flow", async () => {
    const html = await render();

    expect(html).toContain("Publish the plan");
    expect(html).toContain("Create a credential");
    expect(html).toContain("Register the membership");
    expect(html).toContain("Activate");
  });

  it("renders the protected service and its cheating attempts", async () => {
    const html = await render();

    expect(html).toContain("Sign in with NightPass");
    expect(html).toContain("Service decision");
    expect(html).toContain("Try to cheat");
    expect(html).toContain("Replay a spent challenge");
  });

  it("publishes the plan policy before any wallet is connected", async () => {
    const html = await render();

    expect(html).toContain("Builders Pro");
    expect(html).toContain("30 days");
    expect(html).toContain("5.00 test NIGHT");
  });

  it("states the privacy boundary and the prototype limitations", async () => {
    const html = await render();

    expect(html).toContain("Disclosed on access");
    expect(html).toContain("Not yet built");
    expect(html).toContain("Do not use real secrets");
  });

  it("names both audiences so wrong-audience rejection is visible", async () => {
    const html = await render();

    expect(html).toContain("builders.nightpass.dev");
    expect(html).toContain("research.nightpass.dev");
  });

  it("renders no credential material before a credential exists", async () => {
    const html = await render();

    // Nothing that looks like a 64-hex private value may appear in the
    // server-rendered markup.
    expect(html).not.toMatch(/[0-9a-f]{64}/);
  });
});
