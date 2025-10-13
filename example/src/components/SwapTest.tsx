import {type SwapParams, useAccount, useCallSwap, useSwapQuote, useTokenBalance} from 'ailey-agent-sdk-react';
import {useMemo, useState, useEffect} from 'react';
import {formatUnits, parseUnits} from 'viem';
import {toast} from 'sonner';
import {AlertCircle, Loader2, Info} from 'lucide-react';

/**
 * Demo component for testing token swaps through Ailey Agent
 * Swaps WBNB -> ALE tokens with fixed parameters
 */
export function SwapTest({ onClose: _onClose }: { onClose: () => void }) {
    const {callSwap, isPending, isSuccess, isError} = useCallSwap();
    const {isConnected, address} = useAccount();
    const [amountIn, setAmountIn] = useState('0.001');
    const [recipientAddress, setRecipientAddress] = useState('');

    useEffect(() => {
        if (isSuccess) {
            toast.success('Swap Successful', {
                description: 'Your token swap has been executed successfully. Tokens should arrive shortly.'
            });
        }
    }, [isSuccess]);

    useEffect(() => {
        if (isError) {
            toast.error('Swap Failed', {
                description: 'The token swap failed. Please check your wallet balance and try again.'
            });
        }
    }, [isError]);

    // Get WBNB token balance
    const {
        balance: wbnbBalance,
        balanceWei: wbnbBalanceWei,
        isLoading: isBalanceLoading
    } = useTokenBalance(import.meta.env.VITE_APP_CONTRACT_BNB_ADDR);

    // Calculate amountInWei for quote and validation
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
    } = useSwapQuote(amountInWei ? {
        tokenInAddress: import.meta.env.VITE_APP_CONTRACT_BNB_ADDR,
        tokenOutAddress: import.meta.env.VITE_APP_CONTRACT_ALE_TOKEN_ADDR,
        amountIn: amountInWei,
    } : undefined);

    // Check if balance is sufficient
    const hasInsufficientBalance = useMemo(() => {
        if (!amountInWei || !wbnbBalanceWei) return false;
        return amountInWei > wbnbBalanceWei;
    }, [amountInWei, wbnbBalanceWei]);

    const handleSwap = () => {
        if (!isConnected) {
            toast.error('Please connect your wallet first');
            return;
        }

        if (!amountIn || parseFloat(amountIn) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            const amountInWei = parseUnits(amountIn, 18);
            const recipient = recipientAddress || address;

            const swapParams: SwapParams = {
                tokenInAddress: import.meta.env.VITE_APP_CONTRACT_BNB_ADDR,
                tokenOutAddress: import.meta.env.VITE_APP_CONTRACT_ALE_TOKEN_ADDR,
                amountIn: amountInWei,
                recipient: recipient as `0x${string}`
            };

            callSwap(swapParams);
        } catch (error) {
            console.error('Swap error:', error);
            toast.error('Error occurred while processing swap');
        }
    };

    return (
        <div className="w-full space-y-6">
            {/* Info Section */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <p className="text-sm text-gray-700 leading-relaxed">
                    Test token swapping functionality through the Ailey Agent API.
                    This will swap WBNB tokens for ALE tokens using a fixed 0.01% fee tier.
                </p>
            </div>

            {/* Swap Configuration */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Swap Configuration</h4>
                <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-500">From Token:</span>
                        <span className="font-mono text-xs bg-gray-50 px-2 py-1 rounded border border-gray-200">WBNB</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-500">To Token:</span>
                        <span className="font-mono text-xs bg-gray-50 px-2 py-1 rounded border border-gray-200">ALE</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-500">Fee Tier:</span>
                        <span className="text-gray-700">0.01% (Auto)</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-500">Deadline:</span>
                        <span className="text-gray-700">10 min (Auto)</span>
                    </div>
                    <div className="flex justify-between py-2">
                        <span className="font-medium text-gray-500">Slippage:</span>
                        <span className="text-gray-700">0.5% (Auto)</span>
                    </div>
                </div>
            </div>

            {/* Input Form */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Amount to Swap (WBNB)
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
                                <span className="text-gray-500 text-sm font-medium">WBNB</span>
                            </div>
                        </div>
                        <div className="mt-2 flex justify-between items-center">
                            <p className="text-xs text-gray-500">
                                Minimum: 0.001 WBNB
                            </p>
                            <p className="text-xs text-gray-600">
                                {isBalanceLoading ? (
                                    <span>Loading balance...</span>
                                ) : (
                                    <span>Balance: <span className="font-semibold">{parseFloat(wbnbBalance).toFixed(6)} WBNB</span></span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Real-time Quote Display */}
                    {amountInWei && amountInWei > 0n && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h5 className="text-sm font-semibold text-gray-900 mb-3">Swap Preview</h5>
                            {isQuoteLoading ? (
                                <div className="flex items-center justify-center py-2">
                                    <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
                                    <span className="ml-2 text-sm text-gray-600">Calculating quote...</span>
                                </div>
                            ) : estimatedAmountOut ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Expected Output:</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {parseFloat(formatUnits(estimatedAmountOut, 18)).toFixed(6)} ALE
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Minimum Received:</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {amountOutMinimum ? parseFloat(formatUnits(amountOutMinimum, 18)).toFixed(6) : '0'} ALE
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-600">Enter amount to see quote</p>
                            )}
                        </div>
                    )}

                    {/* Insufficient Balance Warning */}
                    {hasInsufficientBalance && (
                        <div className="bg-white border border-red-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                <div>
                                    <h5 className="text-sm font-medium text-red-900">Insufficient Balance</h5>
                                    <p className="text-sm text-red-700 mt-1">
                                        You don't have enough WBNB. Your balance is {parseFloat(wbnbBalance).toFixed(6)} WBNB.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Recipient Address (Optional)
                        </label>
                        <input
                            type="text"
                            value={recipientAddress}
                            onChange={(e) => setRecipientAddress(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            placeholder="Leave empty to use connected wallet"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            {recipientAddress ? 'Tokens will be sent to specified address' : 'Tokens will be sent to your connected wallet'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Swap Button */}
            <button
                onClick={handleSwap}
                disabled={isPending || !isConnected || !amountIn || parseFloat(amountIn) <= 0 || hasInsufficientBalance}
                className={`w-full py-4 px-6 rounded-lg font-medium text-white transition-colors duration-200 flex items-center justify-center gap-2 ${
                    !isConnected || !amountIn || parseFloat(amountIn) <= 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : hasInsufficientBalance
                            ? 'bg-red-500 cursor-not-allowed'
                            : isPending
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gray-900 hover:bg-gray-800'
                }`}
            >
                {!isConnected ? (
                    <span>Connect Wallet First</span>
                ) : !amountIn || parseFloat(amountIn) <= 0 ? (
                    <span>Enter Valid Amount</span>
                ) : hasInsufficientBalance ? (
                    <span>Insufficient Balance</span>
                ) : isPending ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing Swap...</span>
                    </>
                ) : (
                    <span>Execute Token Swap</span>
                )}
            </button>

            {/* Notice */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div className="text-sm text-gray-700">
                        <p className="font-semibold mb-1">Test Environment</p>
                        <p className="text-xs">
                            This is a demo environment. Token addresses are examples and may not represent real tokens.
                            Always verify addresses before executing swaps on mainnet.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
