import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { robinhoodChain, RPC_URL } from "./chain";

export const config = createConfig({
  chains: [robinhoodChain],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [robinhoodChain.id]: http(RPC_URL),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
