import ngrok from "ngrok";
import fetch from "node-fetch";

import { config } from "./config";
import type { Tunnel, TunnelEditAction } from "./types";

export * from "./types";

export async function createTunnel(port: number, domain: string | undefined, ngrokBin: string) {
  return ngrok.connect({
    addr: port,
    web_allow_hosts: domain,
    authtoken: config.authToken,
    binPath: () => ngrokBin.replace("/ngrok", ""),
  });
}

export async function fetchTunnels() {
  const response = await fetch(`${config.baseUrl}/tunnels`, {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Ngrok-Version": "2",
    },
  });

  if (!response.ok) {
    const err = (await response.json()) as { msg: string };
    console.log(err);
    throw new Error(err.msg);
  }

  const data = (await response.json()) as { tunnels: Tunnel[] };

  return data;
}

export async function editTunnel(tunnelSessionId: string, action: TunnelEditAction) {
  const response = await fetch(`${config.baseUrl}/tunnel_sessions/${tunnelSessionId}/${action}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Ngrok-Version": "2",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const err = (await response.json()) as { msg: string };
    console.log(err);
    throw new Error(err.msg);
  }
}
