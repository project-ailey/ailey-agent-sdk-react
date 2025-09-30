import {useCallback, useEffect, useRef, useState} from 'react';
import {useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract} from 'wagmi';
import {useAgentApi} from '../context/AgentApiContext';
import {erc20Abi} from 'viem';
import {useSwapQuote} from './useSwapQuote';

// Default configuration for swaps
const SWAP_FEE = 100;                    // 0.01% Uniswap pool fee tier (100 basis points = 0.01%)
const SLIPPAGE_TO_TOLERANCE = 0.005;     // 0.5% slippage tolerance (0.005 = 0.5%)

/**
 * Parameters for initiating a swap through the agent contract
 */
export interface SwapParams {
    /** Source token contract address */
    tokenInAddress: `0x${string}`;
    /** Destination token contract address */
    tokenOutAddress: `0x${string}`;
    /** Amount of input tokens to swap (in wei/smallest unit) */
    amountIn: bigint;
    /** Optional recipient address (defaults to connected wallet) */
    recipient?: `0x${string}`;
}

/**
 * State machine states for the swap process
 * Flow: idle -> quoting -> checking-approval -> (approving if needed) -> swapping -> complete
 * Can transition to error from any state if something fails
 */
export type SwapStep = 'idle' | 'quoting' | 'checking-approval' | 'approving' | 'swapping' | 'complete' | 'error';

/**
 * Hook for executing swaps through the Ailey agent contract
 *
 * Full execution flow:
 * 1. Get quote from useSwapQuote to determine expected output amounts
 * 2. Check if user has sufficient token allowance for the agent contract
 * 3. If needed, execute approval transaction and wait for confirmation
 * 4. Execute the actual swap through agent.callSwap() with slippage protection
 * 5. Monitor transaction status and update UI accordingly
 */
export function useCallSwap() {
    const {address: agentAddress, abi: agentAbi, chainId} = useAgentApi();
    const {address: userAddress} = useAccount();

    const [step, setStep] = useState<SwapStep>('idle');
    const [error, setError] = useState<string | null>(null);
    const [currentParams, setCurrentParams] = useState<SwapParams | null>(null);

    // Get swap quote with fixed parameters
    const {
        estimatedAmountOut,
        amountOutMinimum,
        isLoading: isQuoting,
        error: quoteError
    } = useSwapQuote(currentParams ? {
        tokenInAddress: currentParams.tokenInAddress,
        tokenOutAddress: currentParams.tokenOutAddress,
        amountIn: currentParams.amountIn,
        slippageTolerance: SLIPPAGE_TO_TOLERANCE,
        fee: SWAP_FEE
    } : undefined);

    // Check token allowance (manually triggered)
    const {refetch: refetchAllowance} = useReadContract({
        address: currentParams?.tokenInAddress,
        abi: erc20Abi,
        functionName: 'allowance',
        args: userAddress && agentAddress ? [userAddress, agentAddress] : undefined,
        query: { enabled: false }
    });

    // Token approval transaction
    const {
        writeContract: writeApprove,
        data: approveTxHash,
        isPending: isApproving,
        error: approveError,
    } = useWriteContract();

    // Swap transaction
    const {
        writeContract: writeSwap,
        data: swapTxHash,
        isPending: isSwapping,
        error: swapError,
    } = useWriteContract();

    const {isSuccess: isApprovalSuccess} = useWaitForTransactionReceipt({ hash: approveTxHash });
    const {isSuccess: isSwapSuccess} = useWaitForTransactionReceipt({ hash: swapTxHash });

    // Execute swap through agent contract
    const executeSwap = useCallback(() => {
        if (!agentAddress || !agentAbi || !chainId || !userAddress || !currentParams || !amountOutMinimum) {
            setError('Failed to execute swap due to missing parameters.');
            setStep('error');
            return;
        }

        setStep('swapping');
        const recipient = currentParams.recipient || userAddress;
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10); // 10 minutes

        writeSwap({
            address: agentAddress,
            abi: agentAbi,
            chainId: chainId,
            functionName: 'callSwap',
            args: [
                currentParams.tokenInAddress,    // Token to sell
                currentParams.tokenOutAddress,   // Token to buy
                SWAP_FEE,                        // Uniswap fee tier (0.01%)
                currentParams.amountIn,          // Exact input amount
                amountOutMinimum,                // Minimum output (slippage protection)
                recipient,                       // Recipient address
                deadline                         // Transaction deadline
            ]
        });
    }, [agentAddress, agentAbi, chainId, userAddress, currentParams, amountOutMinimum, writeSwap]);

    const callSwap = useCallback((params: SwapParams) => {
        if (!agentAddress || !userAddress) {
            setError('Please connect your wallet');
            setStep('error');
            return;
        }
        setCurrentParams(params);
        setError(null);
        setStep('quoting');
    }, [agentAddress, userAddress]);

    // Main state machine: quote -> check allowance -> approve (if needed) -> swap
    useEffect(() => {
        const processSwap = async () => {
            if (step === 'quoting' && !isQuoting) {
                if (quoteError) {
                    setError(quoteError);
                    setStep('error');
                    return;
                }

                if (amountOutMinimum && currentParams) {
                    if (!agentAddress) {
                        setError('Agent contract address is not available.');
                        setStep('error');
                        return;
                    }

                    // Check allowance and decide next step
                    setStep('checking-approval');
                    const allowanceResult = await refetchAllowance();
                    const allowance = allowanceResult.data ?? 0n;

                    if (allowance < currentParams.amountIn) {
                        // Need approval first
                        setStep('approving');
                        writeApprove({
                            address: currentParams.tokenInAddress,
                            abi: erc20Abi,
                            chainId: chainId,
                            functionName: 'approve',
                            args: [
                                agentAddress,              // Spender (agent contract)
                                currentParams.amountIn     // Amount to approve
                            ]
                        });
                    } else {
                        // Already approved, go straight to swap
                        executeSwap();
                    }
                }
            }
        };
        processSwap();
    }, [step, isQuoting, quoteError, amountOutMinimum, currentParams, refetchAllowance, writeApprove, agentAddress, chainId, executeSwap]);

    // Approval completed -> execute swap
    useEffect(() => {
        if (isApprovalSuccess && step === 'approving') {
            executeSwap();
        }
    }, [isApprovalSuccess, step, executeSwap]);

    // Swap completed -> mark as complete
    useEffect(() => {
        if (isSwapSuccess) {
            setStep('complete');
        }
    }, [isSwapSuccess]);

    // Handle transaction errors
    useEffect(() => {
        const txError = approveError || swapError;
        if (txError) {
            const message = txError.message.includes('User rejected') ? 'Transaction was rejected.' : txError.message;
            setError(message);
            setStep('error');
        }
    }, [approveError, swapError]);

    const resetSwap = useCallback(() => {
        setStep('idle');
        setError(null);
        setCurrentParams(null);
    }, []);

    return {
        callSwap,
        resetSwap,
        step,
        estimatedAmountOut,
        amountOutMinimum,
        error,
        isPending: isQuoting || isApproving || isSwapping || step === 'checking-approval',
        isSuccess: step === 'complete',
        isError: step === 'error',
        swapTxHash
    };
}