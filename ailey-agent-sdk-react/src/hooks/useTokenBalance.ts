import {useEffect, useState} from 'react';
import {useAccount, useReadContracts} from 'wagmi';
import {erc20Abi, formatUnits} from 'viem';

/**
 * Token balance information
 */
export interface TokenBalances {
    balance: string;
    balanceWei: bigint;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

/**
 * Hook for checking token balances in real-time
 *
 * Execution flow:
 * 1. Automatically starts balance checks when the component mounts
 * 2. Automatically updates balances when the wallet connection status changes
 * 3. Automatically refreshes balances every 5 seconds (optional)
 *
 * @param tokenAddress
 */
export function useTokenBalance(tokenAddress: `0x${string}`): TokenBalances {
    const {address: userAddress, isConnected} = useAccount();
    const [error, setError] = useState<string | null>(null);

    const {
        data: balanceData,
        isLoading,
        refetch,
        error: fetchError
    } = useReadContracts({
        contracts: [
            {
                address: tokenAddress,
                abi: erc20Abi,
                functionName: 'balanceOf',
                args: userAddress ? [userAddress] : undefined
            },
        ],

        query: {
            enabled: !!userAddress && !!tokenAddress && isConnected,
            staleTime: 1000,
        }
    });

    useEffect(() => {
        if (!tokenAddress) {
            setError('The token address has not been set. Please check your environment variables.');
            console.error('Missing token address:', {tokenAddress});
        } else {
            setError(null);
        }
    }, []);

    useEffect(() => {
        if (isConnected && !isLoading) {
            const interval = setInterval(() => {
                refetch();
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [isConnected, isLoading, refetch]);


    useEffect(() => {
        if (fetchError) {
            console.error('Balance inquiry failed:', fetchError);
            setError('Failed to retrieve your balance.');
        }
    }, [fetchError]);

    const balanceWei = balanceData?.[0]?.result as bigint ?? 0n;
    const balance = formatUnits(balanceWei, 18);

    return {
        balance,
        balanceWei,
        isLoading,
        error,
        refetch: () => {
            refetch();
        }
    };
}