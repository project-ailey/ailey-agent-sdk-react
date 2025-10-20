import {formatUnits} from 'viem';
import {Loader2} from 'lucide-react';

export interface SwapQuoteDisplayProps {
    /** Amount of input tokens in wei */
    amountIn?: bigint;
    /** Expected output amount in wei */
    estimatedAmountOut?: bigint;
    /** Minimum output amount after slippage in wei */
    amountOutMinimum?: bigint;
    /** Symbol of input token */
    tokenInSymbol: string;
    /** Symbol of output token */
    tokenOutSymbol: string;
    /** Decimals for input token (default: 18) */
    tokenInDecimals?: number;
    /** Decimals for output token (default: 18) */
    tokenOutDecimals?: number;
    /** Slippage tolerance as percentage (e.g., 0.5 for 0.5%) */
    slippageTolerance?: number;
    /** Whether the quote is currently loading */
    isLoading?: boolean;
}

/**
 * Reusable component for displaying swap quotes with detailed information
 * Shows expected output, minimum received, exchange rate, and slippage info
 */
export function SwapQuoteDisplay({
    amountIn,
    estimatedAmountOut,
    amountOutMinimum,
    tokenInSymbol,
    tokenOutSymbol,
    tokenInDecimals = 18,
    tokenOutDecimals = 18,
    slippageTolerance = 0.5,
    isLoading = false
}: SwapQuoteDisplayProps) {
    // Calculate exchange rate if we have both amounts
    const exchangeRate = amountIn && estimatedAmountOut && amountIn > 0n
        ? Number(formatUnits(estimatedAmountOut, tokenOutDecimals)) / Number(formatUnits(amountIn, tokenInDecimals))
        : null;

    if (!amountIn || amountIn <= 0n) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-gray-900 mb-3">Swap Preview</h5>
                <p className="text-sm text-gray-600">Enter amount to see quote</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-gray-900 mb-3">Swap Preview</h5>
                <div className="flex items-center justify-center py-2">
                    <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
                    <span className="ml-2 text-sm text-gray-600">Calculating quote...</span>
                </div>
            </div>
        );
    }

    if (!estimatedAmountOut) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-gray-900 mb-3">Swap Preview</h5>
                <p className="text-sm text-gray-600">Unable to calculate quote</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h5 className="text-sm font-semibold text-gray-900 mb-3">Swap Preview</h5>
            <div className="space-y-2">
                {/* Expected Output */}
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Expected Output:</span>
                    <span className="text-sm font-semibold text-gray-900">
                        {parseFloat(formatUnits(estimatedAmountOut, tokenOutDecimals)).toFixed(6)} {tokenOutSymbol}
                    </span>
                </div>

                {/* Minimum Received */}
                {amountOutMinimum && (
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Minimum Received:</span>
                        <span className="text-sm font-semibold text-gray-900">
                            {parseFloat(formatUnits(amountOutMinimum, tokenOutDecimals)).toFixed(6)} {tokenOutSymbol}
                        </span>
                    </div>
                )}

                {/* Exchange Rate */}
                {exchangeRate && (
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Exchange Rate:</span>
                        <span className="text-sm font-medium text-gray-900">
                            1 {tokenInSymbol} = {exchangeRate.toFixed(6)} {tokenOutSymbol}
                        </span>
                    </div>
                )}

                {/* Slippage Tolerance */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                    <span className="text-sm text-gray-600">Slippage Tolerance:</span>
                    <span className="text-sm font-medium text-gray-900">
                        {slippageTolerance}%
                    </span>
                </div>
            </div>
        </div>
    );
}
