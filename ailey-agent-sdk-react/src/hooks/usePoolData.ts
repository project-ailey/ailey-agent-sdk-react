import {useMemo, useState, useEffect} from 'react';
import {useChainId, useReadContract, useReadContracts} from 'wagmi';
import {erc20Abi} from 'viem';
import {Token} from "@uniswap/sdk-core";
import {Pool} from "@uniswap/v3-sdk";

const UNISWAP_V3_FACTORY_ADDRESS = process.env.UNISWAP_V3_FACTORY_ADDRESS as `0x${string}`;
const UNISWAP_V3_FACTORY_ABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "tokenA",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "tokenB",
                "type": "address"
            },
            {
                "internalType": "uint24",
                "name": "fee",
                "type": "uint24"
            }
        ],
        "name": "getPool",
        "outputs": [
            {
                "internalType": "address",
                "name": "pool",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;
const UNISWAP_V3_POOL_ABI = [
    {
        "inputs": [],
        "name": "slot0",
        "outputs": [
            {
                "internalType": "uint160",
                "name": "sqrtPriceX96",
                "type": "uint160"
            },
            {
                "internalType": "int24",
                "name": "tick",
                "type": "int24"
            },
            {
                "internalType": "uint16",
                "name": "observationIndex",
                "type": "uint16"
            },
            {
                "internalType": "uint16",
                "name": "observationCardinality",
                "type": "uint16"
            },
            {
                "internalType": "uint16",
                "name": "observationCardinalityNext",
                "type": "uint16"
            },
            {
                "internalType": "uint8",
                "name": "feeProtocol",
                "type": "uint8"
            },
            {
                "internalType": "bool",
                "name": "unlocked",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "liquidity",
        "outputs": [
            {
                "internalType": "uint128",
                "name": "",
                "type": "uint128"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

/**
 * Parameters for pool data fetching
 */
export interface PoolDataParams {
    /** First token contract address */
    tokenAAddress: `0x${string}`;
    /** Second token contract address */
    tokenBAddress: `0x${string}`;
    /** Uniswap pool fee tier in basis points (100 = 0.01%, 500 = 0.05%, 3000 = 0.3%) */
    fee: number;
}

/**
 * Result object returned by usePoolData hook
 */
export interface PoolDataResult {
    /** Uniswap Token object for tokenA */
    tokenA?: Token;
    /** Uniswap Token object for tokenB */
    tokenB?: Token;
    /** Uniswap Pool object with current state */
    pool?: Pool;
    /** Address of the Uniswap V3 pool */
    poolAddress?: `0x${string}`;
    /** Current sqrt price from pool slot0 */
    sqrtPriceX96?: bigint;
    /** Current tick from pool slot0 */
    tick?: number;
    /** Current liquidity in the pool */
    liquidity?: bigint;
    /** Whether pool data is being loaded */
    isLoading: boolean;
    /** Error message if pool data fetching failed */
    error: string | null;
}

/**
 * Hook to fetch Uniswap V3 pool data
 *
 * Execution flow:
 * 1. Fetch token metadata (decimals, symbols) for both tokens
 * 2. Create Uniswap Token objects from the metadata
 * 3. Query Uniswap V3 Factory to find the pool address
 * 4. Fetch pool state (price, liquidity) from the pool contract
 * 5. Create Pool object with current state
 */
export function usePoolData(params?: PoolDataParams): PoolDataResult {
    const chainId = useChainId();
    const [error, setError] = useState<string | null>(null);

    const {
        tokenAAddress,
        tokenBAddress,
        fee
    } = params || {};

    // 1. Fetch token metadata (decimals, symbols) for both tokens
    const {data: tokenData, isLoading: isTokenDataLoading} = useReadContracts({
        contracts: [
            {address: tokenAAddress, abi: erc20Abi, functionName: 'decimals'},
            {address: tokenAAddress, abi: erc20Abi, functionName: 'symbol'},
            {address: tokenBAddress, abi: erc20Abi, functionName: 'decimals'},
            {address: tokenBAddress, abi: erc20Abi, functionName: 'symbol'},
        ],
        query: {enabled: !!tokenAAddress && !!tokenBAddress}
    });

    // 2. Create Uniswap Token objects from metadata
    const [tokenA, tokenB] = useMemo(() => {
        if (!tokenData || !chainId) return [undefined, undefined];

        const [aDecimals, aSymbol, bDecimals, bSymbol] = tokenData.map(d => d.result);

        if (
            typeof aDecimals !== 'number' ||
            typeof bDecimals !== 'number' ||
            !tokenAAddress || !tokenBAddress
        ) {
            return [undefined, undefined];
        }

        const aToken = new Token(chainId, tokenAAddress, aDecimals, aSymbol as string || 'TOKEN_A');
        const bToken = new Token(chainId, tokenBAddress, bDecimals, bSymbol as string || 'TOKEN_B');

        return [aToken, bToken];
    }, [tokenData, chainId, tokenAAddress, tokenBAddress]);

    // 3. Find Uniswap V3 pool for token pair and fee tier
    const {data: poolAddress, isLoading: isPoolAddressLoading} = useReadContract({
        address: UNISWAP_V3_FACTORY_ADDRESS,
        abi: UNISWAP_V3_FACTORY_ABI,
        functionName: 'getPool',
        args: tokenA && tokenB ? [
            tokenA.address as `0x${string}`,
            tokenB.address as `0x${string}`,
            fee as number
        ] : undefined,
        query: {enabled: !!tokenA && !!tokenB && !!fee}
    });

    // 4. Fetch pool state (price and liquidity)
    const {data: poolData, isLoading: isPoolStateLoading} = useReadContracts({
        contracts: [
            {address: poolAddress, abi: UNISWAP_V3_POOL_ABI, functionName: 'slot0'},
            {address: poolAddress, abi: UNISWAP_V3_POOL_ABI, functionName: 'liquidity'},
        ],
        query: {enabled: !!poolAddress && poolAddress !== '0x0000000000000000000000000000000000000000'}
    });

    // 5. Create Pool object with current state
    const [pool, sqrtPriceX96, tick, liquidity] = useMemo(() => {
        if (!poolData || !tokenA || !tokenB || !fee) {
            return [undefined, undefined, undefined, undefined];
        }

        const slot0 = poolData[0]?.result;
        const liquidityResult = poolData[1]?.result;

        if (!slot0 || typeof liquidityResult !== 'bigint') {
            return [undefined, undefined, undefined, undefined];
        }

        try {
            const [sqrtPrice, currentTick] = slot0;

            const pool = new Pool(
                tokenA,
                tokenB,
                fee,
                sqrtPrice.toString(),
                liquidityResult.toString(),
                currentTick
            );

            return [pool, sqrtPrice, currentTick, liquidityResult];
        } catch (e) {
            console.error("Failed to create Pool object:", e);
            return [undefined, undefined, undefined, undefined];
        }
    }, [poolData, tokenA, tokenB, fee]);

    // Error handling for missing pools
    useEffect(() => {
        if (params && fee && !isPoolAddressLoading && poolAddress === '0x0000000000000000000000000000000000000000') {
            setError(`Pool not found for the given tokens and fee tier (${fee / 10000}%)`);
        } else {
            setError(null);
        }
    }, [poolAddress, isPoolAddressLoading, params, fee]);

    return {
        tokenA,
        tokenB,
        pool,
        poolAddress,
        sqrtPriceX96,
        tick,
        liquidity,
        isLoading: isTokenDataLoading || isPoolAddressLoading || isPoolStateLoading,
        error
    };
}