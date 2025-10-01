import {useEffect, useState} from 'react';
import {CurrencyAmount, Token} from "@uniswap/sdk-core";
import JSBI from "jsbi";
import {usePoolData} from './usePoolData';

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

    // Use the common pool data hook
    const {
        tokenA,
        tokenB,
        pool,
        poolAddress,
        isLoading,
        error
    } = usePoolData(params && tokenInAddress && tokenOutAddress ? {
        tokenAAddress: tokenInAddress,
        tokenBAddress: tokenOutAddress,
        fee
    } : undefined);

    // Determine which token is input and which is output based on addresses
    const [tokenIn, tokenOut] = tokenA && tokenB ? (
        tokenA.address.toLowerCase() === tokenInAddress?.toLowerCase()
            ? [tokenA, tokenB]
            : [tokenB, tokenA]
    ) : [undefined, undefined];

    // Calculate swap quote with slippage protection
    useEffect(() => {
        const calculateQuote = async () => {
            if (!pool || !tokenIn || !tokenOut || !amountIn || amountIn === 0n) {
                setQuoteResult({});
                return;
            }

            try {
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

    }, [pool, tokenIn, tokenOut, amountIn, slippageTolerance]);

    return {
        estimatedAmountOut: quoteResult.estimatedAmountOut,
        amountOutMinimum: quoteResult.amountOutMinimum,
        isLoading,
        error,
        tokenIn,
        tokenOut,
        poolAddress
    };
}