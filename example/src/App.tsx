import './App.css'
import {QueryClient} from "@tanstack/react-query";
import {agentApiAbi} from "./abi/agentApi.abi.ts";
import {AileyProvider, useChainId, useSwitchChain} from "ailey-agent-sdk-react";
import {FeatureCard} from "./components/FeatureCard.tsx";
import {features, type Feature} from "./config/features.ts";
import {config} from "./config/wagmi.ts";
import {useEffect, useState} from "react";
import Footer from "@/components/nav/Footer.tsx";
import Header from "@/components/nav/Header.tsx";
import {Toaster} from "@/components/ui/sonner";
import {Badge} from "@/components/ui/badge";

const queryClient = new QueryClient();

function ChainSwitcher() {
    const {switchChain} = useSwitchChain();
    const currentChainId = useChainId();
    const targetChainId = Number(import.meta.env.VITE_APP_CHAIN_ID);

    useEffect(() => {
        if (currentChainId !== targetChainId && switchChain) {
            switchChain({chainId: targetChainId});
        }
    }, [currentChainId, targetChainId, switchChain]);

    return null;
}

function App() {
    const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

    const aileyConfig = {
        address: import.meta.env.VITE_APP_CONTRACT_AGENT_API_ADDR as `0x${string}`,
        abi: agentApiAbi,
        chainId: Number(import.meta.env.VITE_APP_CHAIN_ID)
    };

    return (
        <AileyProvider wagmiConfig={config} queryClient={queryClient} aileyConfig={aileyConfig}>
            <ChainSwitcher/>
            <Toaster position="top-right" />
            <div className="bg-white min-h-screen">
                {/* Header */}
                <Header/>

                {/* Hero Section */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-56">
                    <div className="text-center mb-16">
                        <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                            Ailey Agent SDK
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">
                            React SDK for building DeFi applications with type-safe smart contract interactions.
                        </p>
                        <div className="flex items-center justify-center gap-4 flex-wrap">
                            <Badge variant="secondary">TypeScript</Badge>
                            <Badge variant="secondary">React 19</Badge>
                            <Badge variant="secondary">Wagmi</Badge>
                            <Badge variant="secondary">Uniswap SDK V3</Badge>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">SDK Features</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {features.map((feature) => (
                                <FeatureCard
                                    key={feature.id}
                                    feature={feature}
                                    isSelected={selectedFeature?.id === feature.id}
                                    onSelect={() => setSelectedFeature(
                                        selectedFeature?.id === feature.id ? null : feature
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Selected Feature Demo Area */}
                    {selectedFeature && (
                        <div className="border border-gray-200 rounded-lg p-8 bg-white">
                            <div className="flex items-center gap-3 mb-6">
                                <selectedFeature.icon className="w-6 h-6 text-gray-900" />
                                <h3 className="text-xl font-bold text-gray-900">{selectedFeature.title}</h3>
                            </div>
                            <selectedFeature.component />
                        </div>
                    )}
                </section>

                {/* Footer */}
                <Footer/>
            </div>
        </AileyProvider>
    )
}

export default App
