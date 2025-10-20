import {useSwapQuote} from 'ailey-agent-sdk-react';
import {useMemo, useState} from 'react';
import {parseUnits} from 'viem';
import {Info} from 'lucide-react';
import {SwapQuoteDisplay} from './SwapQuoteDisplay';

/**
 * Demo component for testing real-time swap quote calculations
 * Shows expected output, minimum received, exchange rate, and slippage info
 */
export function SwapQuoteTest({onClose: _onClose}: { onClose: () => void }) {
    const [tokenInAddress, setTokenInAddress] = useState(import.meta.env.VITE_APP_CONTRACT_BNB_ADDR || '');
    const [tokenOutAddress, setTokenOutAddress] = useState(import.meta.env.VITE_APP_CONTRACT_ALE_TOKEN_ADDR || '');
    const [amountIn, setAmountIn] = useState('0.001');
    const [tokenInSymbol, setTokenInSymbol] = useState('WBNB');
    const [tokenOutSymbol, setTokenOutSymbol] = useState('ALE');

    // Calculate amountInWei for quote
    const amountInWei = useMemo(() => {
        try {
            if (!amountIn || parseFloat(amountIn) <= 0) return undefined;
            return parseUnits(amountIn, 18);
        } catch {
            return undefined;
        }
    }, [amountIn]);

    // Get real-time swap quote
    const {
        estimatedAmountOut,
        amountOutMinimum,
        isLoading: isQuoteLoading
    } = useSwapQuote(amountInWei && tokenInAddress && tokenOutAddress ? {
        tokenInAddress: tokenInAddress as `0x${string}`,
        tokenOutAddress: tokenOutAddress as `0x${string}`,
        amountIn: amountInWei,
    } : undefined);

    return (
        <div className="w-full space-y-6">
            {/* Info Section */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <p className="text-sm text-gray-700 leading-relaxed">
                    Calculate real-time swap quotes using Uniswap V3 pool data.
                    Enter token addresses and amount to see expected output, minimum received, exchange rate, and slippage protection.
                </p>
            </div>

            {/* Token Configuration */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Token Configuration</h4>
                <div className="space-y-4">
                    {/* Token In */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Input Token Address
                        </label>
                        <input
                            type="text"
                            value={tokenInAddress}
                            onChange={(e) => setTokenInAddress(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent font-mono text-sm"
                            placeholder="0x..."
                        />
                        <div className="mt-2">
                            <label className="text-xs text-gray-600 mr-2">Symbol:</label>
                            <input
                                type="text"
                                value={tokenInSymbol}
                                onChange={(e) => setTokenInSymbol(e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-xs w-24"
                                placeholder="WBNB"
                            />
                        </div>
                    </div>

                    {/* Token Out */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Output Token Address
                        </label>
                        <input
                            type="text"
                            value={tokenOutAddress}
                            onChange={(e) => setTokenOutAddress(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent font-mono text-sm"
                            placeholder="0x..."
                        />
                        <div className="mt-2">
                            <label className="text-xs text-gray-600 mr-2">Symbol:</label>
                            <input
                                type="text"
                                value={tokenOutSymbol}
                                onChange={(e) => setTokenOutSymbol(e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-xs w-24"
                                placeholder="ALE"
                            />
                        </div>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Amount to Swap ({tokenInSymbol})
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.001"
                                min="0"
                                value={amountIn}
                                onChange={(e) => setAmountIn(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                placeholder="0.001"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 text-sm font-medium">{tokenInSymbol}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quote Display */}
            <SwapQuoteDisplay
                amountIn={amountInWei}
                estimatedAmountOut={estimatedAmountOut}
                amountOutMinimum={amountOutMinimum}
                tokenInSymbol={tokenInSymbol}
                tokenOutSymbol={tokenOutSymbol}
                slippageTolerance={0.5}
                isLoading={isQuoteLoading}
            />

            {/* Configuration Info */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Quote Configuration</h4>
                <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-500">Fee Tier:</span>
                        <span className="text-gray-700">0.01% (100 basis points)</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-500">Slippage Tolerance:</span>
                        <span className="text-gray-700">0.5%</span>
                    </div>
                    <div className="flex justify-between py-2">
                        <span className="font-medium text-gray-500">DEX:</span>
                        <span className="text-gray-700">Uniswap V3</span>
                    </div>
                </div>
            </div>

            {/* Notice */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-gray-600 mt-0.5"/>
                    <div className="text-sm text-gray-700">
                        <p className="font-semibold mb-1">Real-time Calculation</p>
                        <p className="text-xs">
                            Quotes are calculated using real-time Uniswap V3 pool data.
                            The actual output may vary slightly due to price movements and network conditions.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
