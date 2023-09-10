import { ActionPanel, Action, List, showToast, Toast, Icon, useNavigation } from "@raycast/api";

import { useTunnels } from "./hooks";
import AddTunnel from "./components/add-tunnel";
import BaseActions from "./components/base-actions";
import { Tunnel, TunnelEditAction, editTunnel } from "./api";

export default function TunnelsList() {
  const { push } = useNavigation();

  const { isLoading: isLoadingTunnels, data, revalidate } = useTunnels();

  const handleTunnel = async (tunnel: Tunnel, action: TunnelEditAction) => {
    const isRestart = action === TunnelEditAction.restart;

    const toast = await showToast({
      style: Toast.Style.Animated,
      title: `${isRestart ? "Restarting" : "Stopping"} Tunnel ${tunnel.public_url}...`,
    });

    try {
      await editTunnel(tunnel.tunnel_session.id, action);

      toast.style = Toast.Style.Success;
      toast.title = `Tunnel ${isRestart ? "restarted" : "stopped"}!`;
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
              <BaseActions goToCreate={() => push(<AddTunnel revalidate={revalidate} />)} reload={() => revalidate()} />
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
                    onAction={() => handleTunnel(tunnel, TunnelEditAction.restart)}
                  />
                  <Action
                    title="Stop Tunnel"
                    shortcut={{ modifiers: ["cmd"], key: "s" }}
                    onAction={() => handleTunnel(tunnel, TunnelEditAction.stop)}
                  />
                </ActionPanel.Section>
                <ActionPanel.Section>
                  <BaseActions
                    goToCreate={() => push(<AddTunnel revalidate={revalidate} />)}
                    reload={() => revalidate()}
                  />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
