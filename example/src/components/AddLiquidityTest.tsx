import {useCallback, useEffect, useState} from 'react';
import {useAccount, useAddLiquidity, useTokenBalance} from 'ailey-agent-sdk-react';

/**
 * Add Liquidity Test Component via Ailey Agent
 *
 * Main Features:
 * 1. Real-time token balance display (auto-loaded on component mount)
 * 2. Dynamic amount input (ALE, WBNB)
 * 3. Step-by-step progress display
 * 4. Automatic MetaMask disconnection on error
 * 5. Debugging information display
 */
export function AddLiquidityTest() {
    const {isConnected, address} = useAccount();

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
        disconnectOnError,
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
    const [aleAmount, setAleAmount] = useState('30');    // Default: 30 ALE
    const [wbnbAmount, setWbnbAmount] = useState('0.03'); // Default: 0.03 WBNB
    const [showDebug, setShowDebug] = useState(false);   // Show debug panel or not

    // Check if balance is sufficient
    const hasInsufficientBalance = () => {
        if (!balanceA || !balanceB) return false;
        return parseFloat(balanceA) < parseFloat(aleAmount) ||
            parseFloat(balanceB) < parseFloat(wbnbAmount);
    };

    // Execute add liquidity
    const handleAddLiquidity = () => {
        if (!isConnected) {
            alert('Please connect your wallet first!');
            return;
        }

        const ale = parseFloat(aleAmount);
        const wbnb = parseFloat(wbnbAmount);

        // Validate input
        if (isNaN(ale) || ale <= 0 || isNaN(wbnb) || wbnb <= 0) {
            alert('Please enter a valid amount!');
            return;
        }

        // Check balance
        if (hasInsufficientBalance()) {
            alert(`Insufficient balance!\nRequired: ${aleAmount} ALE, ${wbnbAmount} WBNB\nYour balance: ${balanceA} ALE, ${balanceB} WBNB`);
            return;
        }

        // Start adding liquidity
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
                return 'Liquidity added successfully!';
            case 'error':
                return error || 'An unknown error occurred.';
            default:
                return 'Ready to add liquidity';
        }
    };

    // Refresh balance on success
    useEffect(() => {
        if (isSuccess) {
            setTimeout(() => {
                console.log('Liquidity added successfully - Refreshing balances');
                refetchBalances();
            }, 3000);
        }
    }, [isSuccess, refetchBalances]);

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 mb-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-white">💧</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">
                        Add Liquidity to ALE/WBNB Pool
                    </h2>
                    <p className="text-gray-600 text-sm">
                        Uniswap V3 Liquidity Supply via Ailey Agent
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Wallet Status & Balance Display */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Wallet Info</h3>
                        <button
                            onClick={() => refetchBalances()}
                            disabled={!isConnected || isBalanceLoading}
                            className="text-sm text-blue-600 hover:text-blue-700"
                        >
                            {isBalanceLoading ? 'Refreshing...' : '🔄 Refresh'}
                        </button>
                    </div>

                    {isConnected ? (
                        <div className="space-y-3">
                            {/* Address Display */}
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-gray-600">Address:</span>
                                <span className="font-mono text-sm">
                                    {address?.slice(0, 6)}...{address?.slice(-4)}
                                </span>
                            </div>

                            {/* ALE Balance */}
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-gray-600">ALE Balance:</span>
                                <span className={`font-semibold ${
                                    parseFloat(balanceA || '0') < parseFloat(aleAmount)
                                        ? 'text-red-600' : 'text-green-600'
                                }`}>
                                    {isBalanceLoading ? 'Loading...' :
                                        balanceError ? 'Failed to fetch' :
                                            `${parseFloat(balanceA || '0').toFixed(4)} ALE`}
                                </span>
                            </div>

                            {/* WBNB Balance */}
                            <div className="flex justify-between items-center py-2">
                                <span className="text-gray-600">WBNB Balance:</span>
                                <span className={`font-semibold ${
                                    parseFloat(balanceB || '0') < parseFloat(wbnbAmount)
                                        ? 'text-red-600' : 'text-green-600'
                                }`}>
                                    {isBalanceLoading ? 'Loading...' :
                                        balanceError ? 'Failed to fetch' :
                                            `${parseFloat(balanceB || '0').toFixed(4)} WBNB`}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            Please connect your wallet
                        </div>
                    )}
                </div>

                {/* Amount Input Form */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Liquidity Amount</h3>

                    <div className="space-y-4">
                        {/* ALE Input */}
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
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                                        hasInsufficientBalance() && parseFloat(balanceA || '0') < parseFloat(aleAmount)
                                            ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                    }`}
                                    placeholder="30"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 font-medium">ALE</span>
                                </div>
                            </div>
                            {parseFloat(balanceA || '0') < parseFloat(aleAmount) && (
                                <p className="mt-1 text-xs text-red-600">
                                    ⚠️ Insufficient balance (Required: {aleAmount} ALE)
                                </p>
                            )}
                        </div>

                        {/* WBNB Input */}
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
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                                        hasInsufficientBalance() && parseFloat(balanceB || '0') < parseFloat(wbnbAmount)
                                            ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                    }`}
                                    placeholder="0.03"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 font-medium">WBNB</span>
                                </div>
                            </div>
                            {parseFloat(balanceB || '0') < parseFloat(wbnbAmount) && (
                                <p className="mt-1 text-xs text-red-600">
                                    ⚠️ Insufficient balance (Required: {wbnbAmount} WBNB)
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Pool Settings */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3">Pool Settings (Fixed)</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Fee Tier:</span>
                            <span className="font-medium">0.01%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Price Range:</span>
                            <span className="font-medium">Current Tick ±100</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Slippage:</span>
                            <span className="font-medium">0.5%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Deadline:</span>
                            <span className="font-medium">10 minutes</span>
                        </div>
                    </div>
                </div>

                {/* Progress Status Display */}
                {step !== 'idle' && (
                    <div className={`rounded-lg p-4 ${
                        isError ? 'bg-red-50 border border-red-200' :
                            isSuccess ? 'bg-green-50 border border-green-200' :
                                'bg-blue-50 border border-blue-200'
                    }`}>
                        <div className="flex items-start">
                            <div className="flex-shrink-0 mt-0.5">
                                {isPending ? (
                                    <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                                strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v8H4z"></path>
                                    </svg>
                                ) : isSuccess ? '✅' : isError ? '❌' : 'ℹ️'}
                            </div>
                            <div className="ml-3 flex-1">
                                <p className={`text-sm font-medium ${
                                    isError ? 'text-red-800' :
                                        isSuccess ? 'text-green-800' :
                                            'text-blue-800'
                                }`}>
                                    {getStepDescription()}
                                </p>
                                {addLiquidityTxHash && (
                                    <p className="text-xs mt-1 text-gray-600">
                                        TX: {addLiquidityTxHash.slice(0, 10)}...
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Debug Info (Toggleable) */}
                {isConnected && (
                    <div className="bg-gray-100 rounded-lg p-3">
                        <button
                            onClick={() => setShowDebug(!showDebug)}
                            className="text-sm text-gray-600 hover:text-gray-800"
                        >
                            {showDebug ? '🔽 Hide Debug Info' : '▶️ Show Debug Info'}
                        </button>

                        {showDebug && debugInfo && (
                            <div className="mt-3 p-3 bg-white rounded text-xs font-mono space-y-1">
                                {Object.entries(debugInfo).map(([key, value]) => (
                                    <div key={key} className="flex justify-between">
                                        <span className="text-gray-600">{key}:</span>
                                        <span className="text-gray-800">{String(value)}</span>
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
                        className={`flex-1 py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
                            !isConnected
                                ? 'bg-gray-400 cursor-not-allowed'
                                : hasInsufficientBalance()
                                    ? 'bg-red-400 cursor-not-allowed'
                                    : isPending
                                        ? 'bg-blue-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
                        } focus:outline-none focus:ring-4 focus:ring-blue-300`}
                    >
                        {!isConnected ? '🔗 Connect Wallet' :
                            hasInsufficientBalance() ? '⚠️ Insufficient Balance' :
                                isPending ? '⏳ Processing...' :
                                    '💧 Add Liquidity'}
                    </button>

                    {step !== 'idle' && (
                        <button
                            onClick={resetAddLiquidity}
                            disabled={isPending}
                            className="px-6 py-4 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all"
                        >
                            Reset
                        </button>
                    )}

                    {isError && (
                        <button
                            onClick={disconnectOnError}
                            className="px-6 py-4 rounded-lg font-semibold text-red-700 bg-red-100 hover:bg-red-200 transition-all"
                        >
                            Disconnect
                        </button>
                    )}
                </div>

                {/* Important Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <span className="text-yellow-600 text-sm mr-2">ℹ️</span>
                        <div className="text-sm text-yellow-800">
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
        </div>
    );
}