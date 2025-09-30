import {useEffect, useMemo, useState} from 'react';
import {useChainId, useReadContract, useReadContracts} from 'wagmi';
import {erc20Abi} from 'viem';
import {CurrencyAmount, Token} from "@uniswap/sdk-core";
import {Pool} from "@uniswap/v3-sdk";
import JSBI from "jsbi";

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
 * Parameters for getting a swap quote from Uniswap V3
 */
export interface SwapQuoteParams {
    /** Source token contract address */
    tokenInAddress: `0x${string}`;
    /** Destination token contract address */
    tokenOutAddress: `0x${string}`;
    /** Amount of input tokens (in wei/smallest unit) */
    amountIn: bigint;
    /** Maximum acceptable slippage as decimal (0.005 = 0.5%, 0.01 = 1%) */
    slippageTolerance?: number;
    /** Uniswap pool fee tier in basis points (100 = 0.01%, 500 = 0.05%, 3000 = 0.3%) */
    fee?: number;
}

/**
 * Result object returned by useSwapQuote hook
 */
export interface SwapQuoteResult {
    /** Expected output amount before slippage (in wei/smallest unit) */
    estimatedAmountOut?: bigint;
    /** Minimum acceptable output amount after slippage protection */
    amountOutMinimum?: bigint;
    /** Whether quote calculation is in progress */
    isLoading: boolean;
    /** Error message if quote calculation failed */
    error: string | null;
    /** Uniswap Token object for input token (includes decimals, symbol) */
    tokenIn?: Token;
    /** Uniswap Token object for output token (includes decimals, symbol) */
    tokenOut?: Token;
    /** Address of the Uniswap V3 pool being used for the swap */
    poolAddress?: `0x${string}`;
}

/**
 * Hook to get swap quotes from Uniswap V3
 *
 * Execution flow:
 * 1. Fetch token metadata (decimals, symbols) for both tokens
 * 2. Create Uniswap Token objects from the metadata
 * 3. Query Uniswap V3 Factory to find the pool address
 * 4. Fetch pool state (price, liquidity) from the pool contract
 * 5. Calculate estimated output and minimum output with slippage protection
 */
export function useSwapQuote(params?: SwapQuoteParams) {
    const chainId = useChainId();
    const [error, setError] = useState<string | null>(null);

    const {
        tokenInAddress,
        tokenOutAddress,
        amountIn,
        slippageTolerance = 0.005,
        fee = 100
    } = params || {};

    const [quoteResult, setQuoteResult] = useState<{
        estimatedAmountOut?: bigint;
        amountOutMinimum?: bigint;
    }>({});

    // 1. Fetch token metadata (decimals, symbols) for both tokens
    const {data: tokenData, isLoading: isTokenDataLoading} = useReadContracts({
        contracts: [
            {address: tokenInAddress, abi: erc20Abi, functionName: 'decimals'},
            {address: tokenInAddress, abi: erc20Abi, functionName: 'symbol'},
            {address: tokenOutAddress, abi: erc20Abi, functionName: 'decimals'},
            {address: tokenOutAddress, abi: erc20Abi, functionName: 'symbol'},
        ],
        query: {enabled: !!tokenInAddress && !!tokenOutAddress}
    });

    // 2. Create Uniswap Token objects from metadata
    const [tokenIn, tokenOut] = useMemo(() => {
        if (!tokenData || !chainId) return [undefined, undefined];

        const [inDecimals, inSymbol, outDecimals, outSymbol] = tokenData.map(d => d.result);

        if (
            typeof inDecimals !== 'number' ||
            typeof outDecimals !== 'number' ||
            !tokenInAddress || !tokenOutAddress
        ) {
            return [undefined, undefined];
        }

        const inToken = new Token(chainId, tokenInAddress, inDecimals, inSymbol as string || 'TOKEN_IN');
        const outToken = new Token(chainId, tokenOutAddress, outDecimals, outSymbol as string || 'TOKEN_OUT');

        return [inToken, outToken];
    }, [tokenData, chainId, tokenInAddress, tokenOutAddress]);

    // 3. Find Uniswap V3 pool for token pair and fee tier
    const {data: poolAddress, isLoading: isPoolAddressLoading} = useReadContract({
        address: UNISWAP_V3_FACTORY_ADDRESS,
        abi: UNISWAP_V3_FACTORY_ABI,
        functionName: 'getPool',
        args: tokenIn && tokenOut ? [
            tokenIn.address as `0x${string}`,
            tokenOut.address as `0x${string}`,
            fee
        ] : undefined,
        query: {enabled: !!tokenIn && !!tokenOut && !!fee}
    });

    // 4. Fetch pool state (price and liquidity)
    const {data: poolData, isLoading: isPoolStateLoading} = useReadContracts({
        contracts: [
            {address: poolAddress, abi: UNISWAP_V3_POOL_ABI, functionName: 'slot0'},
            {address: poolAddress, abi: UNISWAP_V3_POOL_ABI, functionName: 'liquidity'},
        ],
        query: {enabled: !!poolAddress && poolAddress !== '0x0000000000000000000000000000000000000000'}
    });

    // 5. Calculate swap quote with slippage protection
    useEffect(() => {
        const calculateQuote = async () => {
            if (!poolData || !tokenIn || !tokenOut || !amountIn || amountIn === 0n) {
                setQuoteResult({});
                return;
            }

            const slot0 = poolData[0]?.result;
            const liquidity = poolData[1]?.result;

            if (!slot0 || typeof liquidity !== 'bigint') {
                setQuoteResult({});
                return;
            }

            try {
                const [sqrtPriceX96, tick] = slot0;

                const pool = new Pool(
                    tokenIn,
                    tokenOut,
                    fee,
                    sqrtPriceX96.toString(),
                    liquidity.toString(),
                    tick
                );

                const inputAmount = CurrencyAmount.fromRawAmount(tokenIn, amountIn.toString());
                const price = pool.priceOf(tokenIn);
                const outputAmount = price.quote(inputAmount);

                // Calculate minimum output with slippage protection
                const slippageFactor = JSBI.BigInt(Math.floor(slippageTolerance * 10000));
                const HUNDRED_PERCENT = JSBI.BigInt(10000);
                const minAmountBI = JSBI.divide(
                    JSBI.multiply(outputAmount.quotient, JSBI.subtract(HUNDRED_PERCENT, slippageFactor)),
                    HUNDRED_PERCENT
                );

                setQuoteResult({
                    estimatedAmountOut: BigInt(outputAmount.quotient.toString()),
                    amountOutMinimum: BigInt(minAmountBI.toString())
                });

            } catch (e) {
                console.error("Failed to calculate swap quote:", e);
                setQuoteResult({});
            }
        };

        calculateQuote();

    }, [poolData, tokenIn, tokenOut, fee, amountIn, slippageTolerance]);

    // Error handling for missing pools
    useEffect(() => {
        if (params && !isPoolAddressLoading && poolAddress === '0x0000000000000000000000000000000000000000') {
            setError(`Pool not found for the given tokens and fee tier (${fee / 10000}%)`);
        } else {
            setError(null);
        }
    }, [poolAddress, isPoolAddressLoading, params, fee]);

    return {
        estimatedAmountOut: quoteResult.estimatedAmountOut,
        amountOutMinimum: quoteResult.amountOutMinimum,
        isLoading: isTokenDataLoading || isPoolAddressLoading || isPoolStateLoading,
        error,
        tokenIn,
        tokenOut,
        poolAddress
    };
}