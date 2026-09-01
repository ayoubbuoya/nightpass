// SPDX-License-Identifier: Apache-2.0

import "./globals.js";
import "./styles.css";
import { setNetworkId, type NetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";

setNetworkId(import.meta.env.VITE_NETWORK_ID as NetworkId);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
