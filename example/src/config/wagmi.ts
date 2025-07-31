import { createConfig } from "wagmi";
import { mainnet, sepolia, bscTestnet } from "wagmi/chains";
import { http } from "wagmi";

export const config = createConfig({
    chains: [mainnet, sepolia, bscTestnet],
    transports: {
        [mainnet.id]: http(),
        [sepolia.id]: http(),
        [bscTestnet.id]: http(),
    },
});