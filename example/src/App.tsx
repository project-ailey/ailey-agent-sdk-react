import './App.css'
import {QueryClient} from "@tanstack/react-query";
import {agentApiAbi} from "./abi/agentApi.abi.ts";
import {AileyProvider} from "ailey-agent-sdk-react";
import {CallTest} from "./components/CallTest.tsx";
import {ConnectWalletButton} from "./components/ConnectWalletButton.tsx";
import {config} from "./config/wagmi.ts";

const queryClient = new QueryClient();

function App() {

    const aileyConfig = {
        address: import.meta.env.VITE_APP_CONTRACT_AGENT_API_ADDR as `0x${string}`,
        abi: agentApiAbi,
        chainId: Number(import.meta.env.VITE_APP_CHAIN_ID)
    };

    return (
        <AileyProvider wagmiConfig={config} queryClient={queryClient} aileyConfig={aileyConfig}>
            <div className="bg-gray-50 min-h-screen">
                <header className="p-4 bg-white shadow-sm">
                    <ConnectWalletButton/>
                </header>
                <main>
                    <CallTest/>
                </main>
            </div>
        </AileyProvider>
    )
}

export default App
