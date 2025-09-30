import { useCallSwap, type SwapParams, useAccount } from 'ailey-agent-sdk-react';
import {useState} from 'react';
import { parseUnits } from 'viem';

/**
 * Demo component for testing token swaps through Ailey Agent
 * Swaps WBNB -> ALE tokens with fixed parameters
 */
export function SwapTest() {
    const { callSwap, isPending, isSuccess, isError } = useCallSwap();
    const { isConnected, address } = useAccount();
    const [amountIn, setAmountIn] = useState('0.001');
    const [recipientAddress, setRecipientAddress] = useState('');

    const handleSwap = () => {
        if (!isConnected) {
            alert('Please connect your wallet first!');
            return;
        }

        if (!amountIn || parseFloat(amountIn) <= 0) {
            alert('Please enter a valid amount!');
            return;
        }

        try {
            const amountInWei = parseUnits(amountIn, 18);  // Convert to wei
            const recipient = recipientAddress || address; // Use input or wallet address

            const swapParams: SwapParams = {
                tokenInAddress: import.meta.env.VITE_APP_CONTRACT_BNB_ADDR,        // WBNB token
                tokenOutAddress: import.meta.env.VITE_APP_CONTRACT_ALE_TOKEN_ADDR, // ALE token
                amountIn: amountInWei,
                recipient: recipient as `0x${string}`
            };

            callSwap(swapParams); // Trigger the swap process
        } catch (error) {
            console.error('Swap error:', error);
            alert('Error occurred while processing swap');
        }
    };

    return (
        <div className="w-full">
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 mb-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-white">🔄</span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        Test token swapping functionality through the Ailey Agent API.
                        This will swap WBNB tokens for ALE tokens using a fixed 0.01% fee tier.
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Swap Details */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-900 mb-4">Swap Configuration</h4>
                    <div className="grid grid-cols-1 gap-4 text-sm">
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-500">From Token:</span>
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">WBNB</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-500">To Token:</span>
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">ALE</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-500">Fee Tier:</span>
                            <span className="text-gray-700">0.01% (Auto)</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-500">Deadline:</span>
                            <span className="text-gray-700">10 min (Auto)</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-500">Slippage:</span>
                            <span className="text-gray-700">0% (Test Mode)</span>
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
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                                    placeholder="0.001"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 text-sm font-medium">WBNB</span>
                                </div>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Minimum: 0.001 WBNB
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Recipient Address (Optional)
                            </label>
                            <input
                                type="text"
                                value={recipientAddress}
                                onChange={(e) => setRecipientAddress(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
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
                    disabled={isPending || !isConnected || !amountIn || parseFloat(amountIn) <= 0}
                    className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
                        !isConnected
                            ? 'bg-gray-400 cursor-not-allowed'
                            : isPending
                            ? 'bg-green-400 cursor-not-allowed'
                            : !amountIn || parseFloat(amountIn) <= 0
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 hover:shadow-lg'
                    } focus:outline-none focus:ring-4 focus:ring-green-300`}
                >
                    {!isConnected ? (
                        <span className="flex items-center justify-center space-x-2">
                            <span>🔗</span>
                            <span>Connect Wallet First</span>
                        </span>
                    ) : !amountIn || parseFloat(amountIn) <= 0 ? (
                        <span className="flex items-center justify-center space-x-2">
                            <span>⚠️</span>
                            <span>Enter Valid Amount</span>
                        </span>
                    ) : isPending ? (
                        <span className="flex items-center justify-center space-x-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v8H4z"></path>
                            </svg>
                            <span>Processing Swap...</span>
                        </span>
                    ) : (
                        <span className="flex items-center justify-center space-x-2">
                            <span>🔄</span>
                            <span>Execute Token Swap</span>
                        </span>
                    )}
                </button>

                {/* Status Messages */}
                {(isSuccess || isError) && (
                    <div className="mt-4">
                        {isSuccess && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <span className="text-green-600 text-xl">✅</span>
                                    </div>
                                    <div className="ml-3">
                                        <h4 className="text-sm font-medium text-green-800">
                                            Swap Successful!
                                        </h4>
                                        <p className="text-sm text-green-700 mt-1">
                                            Your token swap has been executed successfully. Tokens should arrive shortly.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {isError && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <span className="text-red-600 text-xl">❌</span>
                                    </div>
                                    <div className="ml-3">
                                        <h4 className="text-sm font-medium text-red-800">
                                            Swap Failed
                                        </h4>
                                        <p className="text-sm text-red-700 mt-1">
                                            The token swap failed. Please check your wallet balance and try again.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Warning */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <span className="text-yellow-600 text-lg">⚠️</span>
                        </div>
                        <div className="ml-3">
                            <h4 className="text-sm font-medium text-yellow-800">
                                Test Environment Notice
                            </h4>
                            <p className="text-sm text-yellow-700 mt-1">
                                This is a demo environment. Token addresses are examples and may not represent real tokens.
                                Always verify addresses before executing swaps on mainnet.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}