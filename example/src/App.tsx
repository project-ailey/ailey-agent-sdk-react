import './App.css'
import {QueryClient} from "@tanstack/react-query";
import {agentApiAbi} from "./abi/agentApi.abi.ts";
import {AileyProvider, useSwitchChain, useChainId} from "ailey-agent-sdk-react";
import {ConnectWalletButton} from "./components/ConnectWalletButton.tsx";
import {FeatureCard} from "./components/FeatureCard.tsx";
import {features} from "./config/features.ts";
import {config} from "./config/wagmi.ts";
import {useEffect} from "react";

const queryClient = new QueryClient();

function ChainSwitcher() {
    const { switchChain } = useSwitchChain();
    const currentChainId = useChainId();
    const targetChainId = Number(import.meta.env.VITE_APP_CHAIN_ID);

    useEffect(() => {
        if (currentChainId !== targetChainId && switchChain) {
            switchChain({ chainId: targetChainId });
        }
    }, [currentChainId, targetChainId, switchChain]);

    return null;
}

function App() {
    const aileyConfig = {
        address: import.meta.env.VITE_APP_CONTRACT_AGENT_API_ADDR as `0x${string}`,
        abi: agentApiAbi,
        chainId: Number(import.meta.env.VITE_APP_CHAIN_ID)
    };

    return (
        <AileyProvider wagmiConfig={config} queryClient={queryClient} aileyConfig={aileyConfig}>
            <ChainSwitcher />
            <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
                {/* Header */}
                <header className="bg-white shadow-lg border-b border-gray-200">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <h1 className="text-3xl font-bold">
                                        <span
                                            className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Ailey Agent SDK</span>
                                    </h1>
                                </div>
                            </div>
                            <div className="flex-shrink-0">
                                <ConnectWalletButton/>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Welcome to Ailey Agent SDK
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Explore and test the powerful features of our React SDK for blockchain interactions.
                            Connect your wallet and try out the different functionalities below.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="space-y-8">
                        {features.map((feature) => (
                            <FeatureCard key={feature.id} feature={feature}/>
                        ))}
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-white border-t border-gray-200 mt-16">
                    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <p className="text-gray-500 text-sm mb-4">
                                Built with Ailey Agent SDK React • Powered by Wagmi & Viem
                            </p>
                            <div className="flex justify-center space-x-6">
                                <span
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    React 19+
                                </span>
                                <span
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Wagmi 2.0
                                </span>
                                <span
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    TypeScript
                                </span>
                                <span
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                    Viem 2.0
                                </span>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </AileyProvider>
    )
}

export default App
