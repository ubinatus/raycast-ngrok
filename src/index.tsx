import { ActionPanel, Action, List, showToast, Toast, Icon, useNavigation } from "@raycast/api";

import { stopTunnel, stopTunnelAgent } from "./api";
import AddTunnel from "./components/add-tunnel";
import BaseActions from "./components/base-actions";
import { useReservedDomains, useTunnelSessions } from "./hooks";

export default function TunnelsList() {
  const { push } = useNavigation();

  const {
    isLoading: isLoadingTunnelSessions,
    data: dataTunelSessions,
    revalidate: revalidateTunelSessions,
  } = useTunnelSessions();
  const { isLoading: isLoadingDomains, data: dataDomains, revalidate: revalidateDomains } = useReservedDomains();

  const handleStopAgent = async (tunnelSessionId: string) => {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: `Stopping Agent ${tunnelSessionId}...`,
    });

    try {
      await stopTunnelAgent(tunnelSessionId);

      toast.style = Toast.Style.Success;
      toast.title = "Agent stopped!";
    } catch (err) {
      console.log(err);
      toast.style = Toast.Style.Failure;
      toast.title = "Failed to stop agent";
      if (err instanceof Error) {
        toast.message = err.message;
      }
    }

    revalidateTunelSessions();
  };

  const handleStopTunnel = async (tunnelUrl: string, tunnelName: string) => {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: `Stopping Tunnel ${tunnelUrl}...`,
    });

    try {
      await stopTunnel(tunnelName);

      toast.style = Toast.Style.Success;
      toast.title = "Tunnel stopped!";
    } catch (err) {
      console.log(err);
      toast.style = Toast.Style.Failure;
      toast.title = "Failed to stop tunnel";
      if (err instanceof Error) {
        toast.message = err.message;
      }
    }

    revalidateTunelSessions();
  };

  const reload = () => {
    revalidateTunelSessions();
    revalidateDomains();
  };

  return (
    <List navigationTitle="Manage Tunnels" isLoading={isLoadingTunnelSessions || isLoadingDomains}>
      {!dataTunelSessions || !dataTunelSessions.length ? (
        <List.EmptyView
          icon={Icon.Link}
          title="Create ngrok tunnel"
          description="⌘ + N"
          actions={
            <ActionPanel>
              <BaseActions
                goToCreate={() =>
                  push(<AddTunnel revalidate={revalidateTunelSessions} domains={dataDomains?.reserved_domains || []} />)
                }
                reload={reload}
              />
            </ActionPanel>
          }
        />
      ) : (
        dataTunelSessions.map((data) => (
          <List.Section key={data.session.id} title="Agent Session" subtitle={data.session.id.slice(3)}>
            {data.tunnels.map((tunnel) => (
              <List.Item
                key={tunnel.id}
                title={tunnel.public_url}
                subtitle={`Forwards to ➡️ ${tunnel.forwards_to}`}
                accessories={tunnel.metadata ? [{ tag: tunnel.metadata }] : []}
                actions={
                  <ActionPanel title={tunnel.public_url}>
                    <Action.CopyToClipboard title="Copy URL" content={tunnel.public_url} />
                    <Action.OpenInBrowser url={tunnel.public_url} />
                    <ActionPanel.Section title="Danger zone">
                      {tunnel.local !== null && (
                        <Action
                          icon={Icon.Stop}
                          title="Stop Tunnel"
                          shortcut={{ modifiers: ["cmd"], key: "s" }}
                          onAction={() => handleStopTunnel(tunnel.public_url, tunnel.local?.name || "")}
                          style={Action.Style.Destructive}
                        />
                      )}
                      <Action
                        icon={Icon.Stop}
                        title="Stop Session"
                        shortcut={{ modifiers: ["cmd", "shift"], key: "s" }}
                        onAction={() => handleStopAgent(tunnel.tunnel_session.id)}
                        style={Action.Style.Destructive}
                      />
                    </ActionPanel.Section>
                    <ActionPanel.Section>
                      <BaseActions
                        goToCreate={() =>
                          push(
                            <AddTunnel
                              revalidate={revalidateTunelSessions}
                              domains={dataDomains?.reserved_domains || []}
                            />
                          )
                        }
                        reload={reload}
                      />
                    </ActionPanel.Section>
                  </ActionPanel>
                }
              />
            ))}
          </List.Section>
        ))
      )}
    </List>
  );
}
