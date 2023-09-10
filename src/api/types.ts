export type Tunnel = {
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

export enum TunnelEditAction {
  restart = "restart",
  stop = "stop",
}
