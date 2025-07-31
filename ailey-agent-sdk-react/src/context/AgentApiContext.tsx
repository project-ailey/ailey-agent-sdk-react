import React, {createContext, ReactNode, useContext} from 'react';
import {type Config, WagmiProvider} from 'wagmi';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

interface AileyConfig {
    address: `0x${string}`;
    abi: readonly unknown[];
    chainId: number;
}

interface AgentApiContextType {
    address: `0x${string}` | undefined;
    abi: readonly unknown[] | undefined;
    chainId: number | undefined;
}

interface AgentApiProviderProps {
    wagmiConfig: Config;
    queryClient: QueryClient;
    aileyConfig: AileyConfig;
    children: ReactNode;
}

const AgentApiContext = createContext<AgentApiContextType | undefined>(undefined);

export const AileyProvider: React.FC<AgentApiProviderProps> = ({wagmiConfig, queryClient, aileyConfig, children}) => {
    const value = {
        address: aileyConfig.address,
        abi: aileyConfig.abi,
        chainId: aileyConfig.chainId
    };

    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <AgentApiContext.Provider value={value}>
                    {children}
                </AgentApiContext.Provider>
            </QueryClientProvider>
        </WagmiProvider>
    );
};

export function useAgentApi() {
    const context = useContext(AgentApiContext);
    if (context === undefined) {
        throw new Error('useAgentApi must be used within an AileyProvider');
    }
    return context;
}