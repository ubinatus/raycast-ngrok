import { ActionPanel, Action, List, showToast, Toast, Icon, useNavigation } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import fetch from "node-fetch";

import { config } from "./config";
import AddTunnel from "./add-tunnel";
import { useEffect } from "react";

type Tunnel = {
  id: string;
  public_url: string;
  started_at: string;
  proto: string;
  region: string;
  tunnel_session: {
    id: string;
    uri: string;
  };
  endpoint: {
    id: string;
    uri: string;
  };
  forwards_to: string;
};

export default function TunnelsList() {
  const { push } = useNavigation();

  const {
    isLoading: isLoadingTunnels,
    data,
    revalidate,
  } = useFetch<{ tunnels: Tunnel[] }>("https://api.ngrok.com/tunnels", {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Ngrok-Version": "2",
    },
  });

  useEffect(() => {
    console.log("golaaa");
  }, []);

  const handleTunnel = async (tunnel: Tunnel, action: "restart" | "stop") => {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: `${action === "restart" ? "Restarting" : "Stopping"} Tunnel ${tunnel.public_url}...`,
    });
    try {
      const response = await fetch(`https://api.ngrok.com/tunnel_sessions/${tunnel.tunnel_session.id}/${action}`, {
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

      toast.style = Toast.Style.Success;
      toast.title = `Tunnel ${action === "restart" ? "restarted" : "stopped"}!`;
    } catch (err) {
      console.log(err);
      toast.style = Toast.Style.Failure;
      toast.title = `Failed to ${action} tunnel`;
      if (err instanceof Error) {
        toast.message = err.message;
      }
    }

    revalidate();
  };

  return (
    <List navigationTitle="Manage Tunnels" isLoading={isLoadingTunnels}>
      {!data || data.tunnels.length === 0 ? (
        <List.EmptyView
          icon={Icon.Link}
          title="Create an ngrok tunnel"
          description="⌘ + N"
          actions={
            <ActionPanel>
              <Action
                title="Create Tunnel"
                shortcut={{ modifiers: ["cmd"], key: "n" }}
                onAction={() => push(<AddTunnel revalidate={revalidate} />)}
              />
              <Action title="Reload List" onAction={() => revalidate()} />
            </ActionPanel>
          }
        />
      ) : (
        data.tunnels.map((tunnel) => (
          <List.Item
            key={tunnel.id}
            title={tunnel.public_url}
            subtitle={`Forwards to ➡️ ${tunnel.forwards_to}`}
            actions={
              <ActionPanel title={tunnel.public_url}>
                <Action.CopyToClipboard title="Copy URL" content={tunnel.public_url} />
                <Action.OpenInBrowser url={tunnel.public_url} />
                <ActionPanel.Section title="Danger zone">
                  <Action
                    title="Restart Tunnel"
                    shortcut={{ modifiers: ["cmd"], key: "r" }}
                    onAction={() => handleTunnel(tunnel, "restart")}
                  />
                  <Action
                    title="Stop Tunnel"
                    shortcut={{ modifiers: ["cmd"], key: "s" }}
                    onAction={() => handleTunnel(tunnel, "stop")}
                  />
                </ActionPanel.Section>
                <ActionPanel.Section>
                  <Action
                    title="Create Tunnel"
                    shortcut={{ modifiers: ["cmd"], key: "n" }}
                    onAction={() => push(<AddTunnel revalidate={revalidate} />)}
                  />
                  <Action title="Reload List" onAction={() => revalidate()} />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
