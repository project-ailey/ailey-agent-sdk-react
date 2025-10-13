import {useCallback, useEffect, useState} from 'react';
import {useAccount, useAddLiquidity, useTokenBalance, useDisconnect} from 'ailey-agent-sdk-react';
import {toast} from 'sonner';
import {AlertCircle, Loader2, RefreshCw, ChevronDown, ChevronRight, Info} from 'lucide-react';

/**
 * Add Liquidity Test Component via Ailey Agent
 */
export function AddLiquidityTest({ onClose }: { onClose: () => void }) {
    const {isConnected, address} = useAccount();
    const {disconnect} = useDisconnect();

    const {
        balance: balanceA,
        isLoading: isBalanceLoadingA,
        error: balanceErrorA,
        refetch: refetchBalanceA
    } = useTokenBalance(import.meta.env.VITE_APP_CONTRACT_ALE_TOKEN_ADDR);

    const {
        balance: balanceB,
        isLoading: isBalanceLoadingB,
        error: balanceErrorB,
        refetch: refetchBalanceB
    } = useTokenBalance(import.meta.env.VITE_APP_CONTRACT_BNB_ADDR);

    const isBalanceLoading = isBalanceLoadingA || isBalanceLoadingB;
    const balanceError = balanceErrorA || balanceErrorB;

    const refetchBalances = useCallback(() => {
        refetchBalanceA();
        refetchBalanceB();
    }, [refetchBalanceA, refetchBalanceB]);

    // Liquidity Add Hook
    const {
        callAddLiquidity,
        resetAddLiquidity,
        isPending,
        isSuccess,
        isError,
        step,
        error,
        poolInfo,
        debugInfo,
        addLiquidityTxHash
    } = useAddLiquidity();

    // Input state management
    const [aleAmount, setAleAmount] = useState('30');
    const [wbnbAmount, setWbnbAmount] = useState('0.03');
    const [showDebug, setShowDebug] = useState(false);

    // Check if balance is sufficient
    const hasInsufficientBalance = () => {
        if (!balanceA || !balanceB) return false;
        return parseFloat(balanceA) < parseFloat(aleAmount) ||
            parseFloat(balanceB) < parseFloat(wbnbAmount);
    };

    // Execute add liquidity
    const handleAddLiquidity = () => {
        if (!isConnected) {
            toast.error('Please connect your wallet first');
            return;
        }

        const ale = parseFloat(aleAmount);
        const wbnb = parseFloat(wbnbAmount);

        if (isNaN(ale) || ale <= 0 || isNaN(wbnb) || wbnb <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (hasInsufficientBalance()) {
            toast.error(`Insufficient balance. Required: ${aleAmount} ALE, ${wbnbAmount} WBNB`);
            return;
        }

        callAddLiquidity({
            tokenAAddress: import.meta.env.VITE_APP_CONTRACT_ALE_TOKEN_ADDR as `0x${string}`,
            tokenBAddress: import.meta.env.VITE_APP_CONTRACT_BNB_ADDR as `0x${string}`,
            amountA: aleAmount,
            amountB: wbnbAmount
        });
    };

    // Generate step description
    const getStepDescription = () => {
        switch (step) {
            case 'checking-balances':
                return 'Checking token balances...';
            case 'checking-approvals':
                return 'Checking token approval status...';
            case 'approving-token0':
                return `Approving ${poolInfo?.token0?.symbol} token...`;
            case 'approving-token1':
                return `Approving ${poolInfo?.token1?.symbol} token...`;
            case 'adding-liquidity':
                return 'Executing add liquidity transaction...';
            case 'complete':
                return 'Liquidity added successfully';
            case 'error':
                return error || 'An unknown error occurred';
            default:
                return 'Ready to add liquidity';
        }
    };

    // Toast notifications for success/error
    useEffect(() => {
        if (isSuccess) {
            toast.success('Liquidity Added Successfully', {
                description: addLiquidityTxHash
                    ? `Transaction: ${addLiquidityTxHash.slice(0, 10)}...`
                    : 'Your liquidity has been added to the pool.'
            });
            setTimeout(() => {
                console.log('Liquidity added successfully - Refreshing balances');
                refetchBalances();
            }, 3000);
        }
    }, [isSuccess, refetchBalances, addLiquidityTxHash]);

    useEffect(() => {
        if (isError) {
            toast.error('Liquidity Addition Failed', {
                description: error || 'An error occurred while adding liquidity. Please try again.'
            });
        }
    }, [isError, error]);

    return (
        <div className="w-full space-y-6">
            {/* Info Section */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <p className="text-sm text-gray-700 leading-relaxed">
                    Add liquidity to the ALE/WBNB pool on Uniswap V3 through the Ailey Agent API.
                </p>
            </div>

            {/* Wallet Status & Balance Display */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Wallet Info</h3>
                    <button
                        onClick={() => refetchBalances()}
                        disabled={!isConnected || isBalanceLoading}
                        className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                    >
                        <RefreshCw className={`w-4 h-4 ${isBalanceLoading ? 'animate-spin' : ''}`} />
                        {isBalanceLoading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>

                {isConnected ? (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Address:</span>
                            <span className="font-mono text-sm text-gray-900">
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-600">ALE Balance:</span>
                            <span className={`font-semibold text-sm ${
                                parseFloat(balanceA || '0') < parseFloat(aleAmount)
                                    ? 'text-red-600' : 'text-gray-900'
                            }`}>
                                {isBalanceLoading ? 'Loading...' :
                                    balanceError ? 'Failed to fetch' :
                                        `${parseFloat(balanceA || '0').toFixed(4)} ALE`}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-gray-600">WBNB Balance:</span>
                            <span className={`font-semibold text-sm ${
                                parseFloat(balanceB || '0') < parseFloat(wbnbAmount)
                                    ? 'text-red-600' : 'text-gray-900'
                            }`}>
                                {isBalanceLoading ? 'Loading...' :
                                    balanceError ? 'Failed to fetch' :
                                        `${parseFloat(balanceB || '0').toFixed(4)} WBNB`}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        Please connect your wallet
                    </div>
                )}
            </div>

            {/* Amount Input Form */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Liquidity Amount</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            ALE Token Amount
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.001"
                                min="0"
                                value={aleAmount}
                                onChange={(e) => setAleAmount(e.target.value)}
                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 ${
                                    hasInsufficientBalance() && parseFloat(balanceA || '0') < parseFloat(aleAmount)
                                        ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="30"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 font-medium text-sm">ALE</span>
                            </div>
                        </div>
                        {parseFloat(balanceA || '0') < parseFloat(aleAmount) && (
                            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Insufficient balance (Required: {aleAmount} ALE)
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            WBNB Token Amount
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.001"
                                min="0"
                                value={wbnbAmount}
                                onChange={(e) => setWbnbAmount(e.target.value)}
                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 ${
                                    hasInsufficientBalance() && parseFloat(balanceB || '0') < parseFloat(wbnbAmount)
                                        ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="0.03"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 font-medium text-sm">WBNB</span>
                            </div>
                        </div>
                        {parseFloat(balanceB || '0') < parseFloat(wbnbAmount) && (
                            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Insufficient balance (Required: {wbnbAmount} WBNB)
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Pool Settings */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3 text-sm">Pool Settings</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Fee Tier:</span>
                        <span className="font-medium text-gray-900">0.01%</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Price Range:</span>
                        <span className="font-medium text-gray-900">Current ±100</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Slippage:</span>
                        <span className="font-medium text-gray-900">0.5%</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Deadline:</span>
                        <span className="font-medium text-gray-900">10 minutes</span>
                    </div>
                </div>
            </div>

            {/* Progress Status Display - only show during processing */}
            {step !== 'idle' && step !== 'complete' && step !== 'error' && (
                <div className="rounded-lg p-4 border bg-gray-50 border-gray-200">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                            <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                                {getStepDescription()}
                            </p>
                            {addLiquidityTxHash && (
                                <p className="text-xs mt-1 text-gray-600 font-mono">
                                    {addLiquidityTxHash.slice(0, 10)}...
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Debug Info */}
            {isConnected && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <button
                        onClick={() => setShowDebug(!showDebug)}
                        className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
                    >
                        {showDebug ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        {showDebug ? 'Hide' : 'Show'} Debug Info
                    </button>

                    {showDebug && debugInfo && (
                        <div className="mt-3 p-3 bg-white rounded border border-gray-200 text-xs font-mono space-y-1">
                            {Object.entries(debugInfo).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                    <span className="text-gray-600">{key}:</span>
                                    <span className="text-gray-900">{String(value)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={handleAddLiquidity}
                    disabled={isPending || !isConnected || hasInsufficientBalance()}
                    className={`flex-1 py-4 px-6 rounded-lg font-medium text-white transition-colors duration-200 ${
                        !isConnected
                            ? 'bg-gray-400 cursor-not-allowed'
                            : hasInsufficientBalance()
                                ? 'bg-red-500 cursor-not-allowed'
                                : isPending
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                >
                    {!isConnected ? 'Connect Wallet' :
                        hasInsufficientBalance() ? 'Insufficient Balance' :
                            isPending ? 'Processing...' :
                                'Add Liquidity'}
                </button>

                {step !== 'idle' && (
                    <button
                        onClick={resetAddLiquidity}
                        disabled={isPending}
                        className="px-6 py-4 rounded-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
                    >
                        Reset
                    </button>
                )}

                {isError && (
                    <button
                        onClick={() => {
                            onClose();
                            disconnect();
                        }}
                        className="px-6 py-4 rounded-lg font-medium text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
                    >
                        Disconnect
                    </button>
                )}
            </div>

            {/* Notice */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div className="text-sm text-gray-700">
                        <p className="font-semibold mb-1">Important Information</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>At least 2 approval transactions may be required</li>
                            <li>Actual amounts added may be adjusted based on current price</li>
                            <li>You will receive an LP NFT token</li>
                            <li>Use on testnet only</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
