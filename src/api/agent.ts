import fetch, { FetchError } from "node-fetch";
import { config } from "./config";
import { LocalTunnel, NgrokError } from "./types";

export async function checkIsNgrokReady() {
  try {
    const response = await fetch(`${config.localApi}/api/tunnels`);
    return response.ok;
  } catch {
    return false;
  }
}

export async function createTunnel(port: number, domain: string | undefined, label: string | undefined) {
  try {
    const response = await fetch(`${config.localApi}/api/tunnels`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `port_${port}_${Date.now()}`,
        proto: "http",
        addr: port,
        domain,
        metadata: label,
      }),
    });

    if (!response.ok) {
      const err = (await response.json()) as NgrokError;
      console.log(err);
      if (err.error_code !== "ERR_NGROK_810") {
        throw new Error(err.msg);
      }
    }

    const data = (await response.json()) as { public_url: string };
    return data.public_url;
  } catch (error) {
    if (error instanceof FetchError && error.code === "ECONNREFUSED") {
      throw new Error("ngrok not found on port 4044");
    }
    throw new Error((error as Error).message);
  }
}

export async function fetchLocalTunnels() {
  try {
    const response = await fetch(`${config.localApi}/api/tunnels`);

    if (!response.ok) {
      const err = await response.json();
      console.log(err);
    }

    const data = (await response.json()) as { tunnels: LocalTunnel[] };

    console.log("Local tunnels are:", data.tunnels);

    return data.tunnels;
  } catch (e) {
    console.log("failed local fetch tunnels", e);
    return [];
  }
}

export async function stopTunnel(tunnelName: string) {
  const response = await fetch(`${config.localApi}/api/tunnels/${tunnelName}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const err = (await response.json()) as FetchError;
    console.log(err);
    throw new Error(err.message);
  }
}
