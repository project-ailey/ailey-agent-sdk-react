import {useCallback, useEffect, useMemo, useState} from 'react';
import {
    useAccount,
    useDisconnect,
    useReadContract,
    useReadContracts,
    useWaitForTransactionReceipt,
    useWriteContract
} from 'wagmi';
import {useAgentApi} from '../context/AgentApiContext';
import {erc20Abi, formatUnits, parseUnits} from 'viem';
import {nearestUsableTick, Position} from "@uniswap/v3-sdk";
import {usePoolData} from './usePoolData';
import JSBI from "jsbi";

// Default configuration for liquidity provision
const POOL_FEE = 100;                           // 0.01% Uniswap pool fee tier (100 basis points)
const TICK_RANGE_WIDTH = 100;                   // Price range width: current tick ±100
const DEADLINE_MINUTES = 10;                    // 10 minutes transaction deadline

/**
 * Parameters for adding liquidity to a Uniswap V3 pool
 */
export interface AddLiquidityParams {
    /** Token A contract address */
    tokenAAddress: `0x${string}`;
    /** Token B contract address */
    tokenBAddress: `0x${string}`;
    /** Token A amount as string (e.g., "30") */
    amountA: string;
    /** Token B amount as string (e.g., "0.03") */
    amountB: string;
}

/**
 * State machine states for the add liquidity process
 *
 * Execution flow:
 * 1. idle: Waiting for user action
 * 2. checking-balances: Verifying token balances
 * 3. checking-approvals: Checking token approval status
 * 4. approving-token0: Approving token0
 * 5. approving-token1: Approving token1
 * 6. adding-liquidity: Adding liquidity to pool
 * 7. complete: Process completed successfully
 * 8. error: Error occurred
 */
export type AddLiquidityStep =
    'idle'
    | 'checking-balances'
    | 'checking-approvals'
    | 'approving-token0'
    | 'approving-token1'
    | 'adding-liquidity'
    | 'complete'
    | 'error';

/**
 * Debug information for troubleshooting liquidity addition
 */
export interface DebugInfo {
    tokenABalance?: string;
    tokenBBalance?: string;
    requiredTokenA?: string;
    requiredTokenB?: string;
    allowance0?: string;
    allowance1?: string;
    needed0?: string;
    needed1?: string;
    insufficientBalance?: boolean;
    errorDetails?: string;
}

/**
 * Hook for adding liquidity to Uniswap V3 pools through the Ailey agent contract
 *
 * Full execution flow:
 * 1. User calls callAddLiquidity() with token amounts (e.g., ALE/WBNB)
 * 2. Verify user has sufficient token balances → Error if insufficient
 * 3. Query pool data (price, tick, liquidity, etc.)
 * 4. Calculate exact token ratio using Position.fromAmounts based on current price
 * 5. Check token approvals → Execute approval transactions if needed
 * 6. Call agent.callAddLiquidity() to add liquidity to the pool
 * 7. Handle success/failure and update state accordingly
 */
export function useAddLiquidity() {
    const {address: agentAddress, abi: agentAbi, chainId} = useAgentApi();
    const {address: userAddress} = useAccount();
    const {disconnect} = useDisconnect();

    const [step, setStep] = useState<AddLiquidityStep>('idle');
    const [error, setError] = useState<string | null>(null);
    const [currentParams, setCurrentParams] = useState<AddLiquidityParams | null>(null);
    const [debugInfo, setDebugInfo] = useState<DebugInfo>({});

    // Fetch pool data from Uniswap V3
    const {
        tokenA,
        tokenB,
        pool,
        poolAddress,
        tick: currentTick,
        isLoading: isPoolDataLoading,
        error: poolError
    } = usePoolData(currentParams ? {
        tokenAAddress: currentParams.tokenAAddress,
        tokenBAddress: currentParams.tokenBAddress,
        fee: POOL_FEE
    } : undefined);

    // Check token balances (only when params are set and in checking-balances step)
    const {data: balances, isLoading: isBalancesLoading} = useReadContracts({
        contracts: [
            {address: currentParams?.tokenAAddress, abi: erc20Abi, functionName: 'balanceOf', args: [userAddress!]},
            {address: currentParams?.tokenBAddress, abi: erc20Abi, functionName: 'balanceOf', args: [userAddress!]},
        ],
        query: {enabled: !!userAddress && !!currentParams && step === 'checking-balances'}
    });

    // Verify balances and check if user has sufficient tokens
    useEffect(() => {
        if (balances && currentParams && balances[0]?.result !== undefined && balances[1]?.result !== undefined) {
            const balanceA = formatUnits(balances[0].result as bigint, 18);
            const balanceB = formatUnits(balances[1].result as bigint, 18);

            // Check if balance is insufficient
            const insufficientBalance =
                parseFloat(balanceA) < parseFloat(currentParams.amountA) ||
                parseFloat(balanceB) < parseFloat(currentParams.amountB);

            setDebugInfo(prev => ({
                ...prev,
                tokenABalance: balanceA,
                tokenBBalance: balanceB,
                requiredTokenA: currentParams.amountA,
                requiredTokenB: currentParams.amountB,
                insufficientBalance
            }));

            if (insufficientBalance) {
                setError(`Insufficient balance. Required: ${currentParams.amountA} TokenA, ${currentParams.amountB} TokenB / Available: ${balanceA} TokenA, ${balanceB} TokenB`);
                setStep('error');
            } else {
                // Move to approval check step if balance is sufficient
                setStep('checking-approvals');
            }
        }
    }, [balances, currentParams]);

    // Determine token0/token1 order (Uniswap V3 convention: sort by address)
    const [token0, token1] = useMemo(() => {
        if (!tokenA || !tokenB) return [undefined, undefined];

        const isTokenAToken0 = tokenA.address.toLowerCase() < tokenB.address.toLowerCase();
        return isTokenAToken0 ? [tokenA, tokenB] : [tokenB, tokenA];
    }, [tokenA, tokenB]);

    // Calculate tick range (current tick ± TICK_RANGE_WIDTH)
    const [tickLower, tickUpper] = useMemo(() => {
        if (!pool || currentTick === undefined) {
            return [undefined, undefined];
        }

        // Round to nearest usable tick based on pool's tick spacing
        const lower = nearestUsableTick(currentTick - TICK_RANGE_WIDTH, pool.tickSpacing);
        const upper = nearestUsableTick(currentTick + TICK_RANGE_WIDTH, pool.tickSpacing);
        return [lower, upper];

    }, [pool, currentTick]);

    // Calculate exact amounts using Position.fromAmounts based on current pool price
    const [calculatedAmounts, position] = useMemo(() => {
        if (!pool || !token0 || !token1 || !currentParams ||
            tickLower === undefined || tickUpper === undefined) {
            return [undefined, undefined];
        }

        try {
            // Convert user input to wei
            const desiredAmountA = parseUnits(currentParams.amountA, 18);
            const desiredAmountB = parseUnits(currentParams.amountB, 18);

            // Map amounts to token0/token1 order
            const amount0Desired = token0.address.toLowerCase() === tokenA?.address.toLowerCase() ?
                desiredAmountA.toString() : desiredAmountB.toString();

            const amount1Desired = token1.address.toLowerCase() === tokenA?.address.toLowerCase() ?
                desiredAmountA.toString() : desiredAmountB.toString();

            // Create Uniswap Position object (adjusts amounts to match current price)
            const position = Position.fromAmounts({
                pool: pool,
                tickLower: tickLower,
                tickUpper: tickUpper,
                amount0: amount0Desired,
                amount1: amount1Desired,
                useFullPrecision: true,
            });

            // Extract calculated actual amounts
            const amount0 = JSBI.BigInt(position.amount0.quotient.toString());
            const amount1 = JSBI.BigInt(position.amount1.quotient.toString());

            setDebugInfo(prev => ({
                ...prev,
                needed0: formatUnits(BigInt(amount0.toString()), 18),
                needed1: formatUnits(BigInt(amount1.toString()), 18)
            }));

            return [{amount0, amount1}, position];

        } catch (e) {
            setDebugInfo(prev => ({...prev, errorDetails: String(e)}));
            return [undefined, undefined];
        }
    }, [pool, token0, token1, tokenA, tickLower, tickUpper, currentParams]);

    // Check token0 approval status (manually triggered)
    const {refetch: refetchAllowance0} = useReadContract({
        address: token0?.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'allowance',
        args: userAddress && agentAddress ? [userAddress, agentAddress] : undefined,
        query: {enabled: false}
    });

    // Check token1 approval status (manually triggered)
    const {refetch: refetchAllowance1} = useReadContract({
        address: token1?.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'allowance',
        args: userAddress && agentAddress ? [userAddress, agentAddress] : undefined,
        query: {enabled: false}
    });

    // Token0 approval transaction
    const {
        writeContract: writeApprove0,
        data: approve0TxHash,
        isPending: isApproving0,
        error: approve0Error,
    } = useWriteContract();

    // Token1 approval transaction
    const {
        writeContract: writeApprove1,
        data: approve1TxHash,
        isPending: isApproving1,
        error: approve1Error,
    } = useWriteContract();

    // Add liquidity transaction
    const {
        writeContract: writeAddLiquidity,
        data: addLiquidityTxHash,
        isPending: isAddingLiquidity,
        error: addLiquidityError,
    } = useWriteContract();

    // Wait for transaction confirmations
    const {isSuccess: isApproval0Success} = useWaitForTransactionReceipt({hash: approve0TxHash});
    const {isSuccess: isApproval1Success} = useWaitForTransactionReceipt({hash: approve1TxHash});
    const {isSuccess: isAddLiquiditySuccess} = useWaitForTransactionReceipt({hash: addLiquidityTxHash});

    /**
     * Execute liquidity addition through agent contract
     * Calls agent.callAddLiquidity() with calculated parameters
     */
    const executeAddLiquidity = useCallback(() => {
        if (!agentAddress || !agentAbi || !chainId || !userAddress || !pool || !token0 ||
            !token1 || !calculatedAmounts || tickLower === undefined || tickUpper === undefined) {
            const missingParams = [];
            if (!agentAddress) missingParams.push('agent address');
            if (!pool) missingParams.push('pool');
            if (!calculatedAmounts) missingParams.push('calculated amounts');

            setError(`Missing required parameters: ${missingParams.join(', ')}`);
            setStep('error');
            return;
        }

        setStep('adding-liquidity');
        const amount0 = BigInt(calculatedAmounts.amount0.toString());
        const amount1 = BigInt(calculatedAmounts.amount1.toString());

        // Calculate minimum amounts for slippage protection (0.5%)
        const amount0Min = BigInt(
            JSBI.divide(
                JSBI.multiply(calculatedAmounts.amount0, JSBI.BigInt(1000)),
                JSBI.BigInt(1005)
            ).toString()
        );
        const amount1Min = BigInt(
            JSBI.divide(
                JSBI.multiply(calculatedAmounts.amount1, JSBI.BigInt(1000)),
                JSBI.BigInt(1005)
            ).toString()
        );

        const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * DEADLINE_MINUTES);

        writeAddLiquidity({
            address: agentAddress,
            abi: agentAbi,
            chainId: chainId,
            functionName: 'callAddLiquidity',
            args: [
                token0.address as `0x${string}`,
                token1.address as `0x${string}`,
                POOL_FEE,
                tickLower,
                tickUpper,
                amount0,
                amount1,
                amount0Min,
                amount1Min,
                userAddress,
                deadline
            ]
        });
    }, [agentAddress, agentAbi, chainId, userAddress, pool, token0, token1,
        calculatedAmounts, tickLower, tickUpper, writeAddLiquidity]);

    /**
     * Check and approve token1 if needed
     * Called after token0 approval is complete
     */
    const checkAndApproveToken1 = useCallback(async () => {
        if (!agentAddress || !calculatedAmounts || !token1 || !chainId) {
            return;
        }

        try {
            const allowance1Result = await refetchAllowance1();
            const allowance1 = allowance1Result.data ?? 0n;
            const amount1Needed = BigInt(calculatedAmounts.amount1.toString());

            if (allowance1 < amount1Needed) {
                setStep('approving-token1');
                writeApprove1({
                    address: token1.address as `0x${string}`,
                    abi: erc20Abi,
                    chainId: chainId,
                    functionName: 'approve',
                    args: [agentAddress, amount1Needed]
                });
            } else {
                executeAddLiquidity();
            }
        } catch (e) {
            setError('Failed to check Token1 approval: ' + String(e));
            setStep('error');
        }
    }, [agentAddress, calculatedAmounts, token1, chainId, refetchAllowance1, writeApprove1, executeAddLiquidity]);

    /**
     * Main entry point - Start the liquidity addition process
     * Validates inputs and initiates the state machine
     */
    const callAddLiquidity = useCallback((params: AddLiquidityParams) => {
        // 1. Check wallet connection
        if (!agentAddress || !userAddress) {
            setError('Please connect your wallet first');
            setStep('error');
            return;
        }

        // 2. Validate token addresses
        if (!params.tokenAAddress || !params.tokenBAddress) {
            setError('Token addresses are not set');
            setStep('error');
            return;
        }

        // 3. Validate input amounts
        const amountA = parseFloat(params.amountA);
        const amountB = parseFloat(params.amountB);

        if (isNaN(amountA) || amountA <= 0 || isNaN(amountB) || amountB <= 0) {
            setError('Please enter valid amounts');
            setStep('error');
            return;
        }

        // 4. Start the process
        setCurrentParams(params);
        setError(null);
        setStep('checking-balances');
    }, [agentAddress, userAddress]);

    /**
     * Reset state to initial values
     */
    const resetAddLiquidity = useCallback(() => {
        setStep('idle');
        setError(null);
        setCurrentParams(null);
        setDebugInfo({});
    }, []);

    /**
     * Disconnect wallet on critical errors
     */
    const disconnectOnError = useCallback(() => {
        if (step === 'error' && error?.includes('execution')) {
            disconnect();
            resetAddLiquidity();
        }
    }, [step, error, disconnect, resetAddLiquidity]);

    /**
     * ==========================================
     * State Machine Effects
     * ==========================================
     * 1. checking-balances: Verify token balances
     * 2. checking-approvals: Check and execute approvals
     * 3. approving-token0: Handle Token0 approval completion
     * 4. approving-token1: Handle Token1 approval completion
     * 5. adding-liquidity: Handle liquidity addition success
     * 6. error: Handle errors
     * ==========================================
     */

    /**
     * Main state machine: Check approvals → Execute approvals → Add liquidity
     */
    useEffect(() => {
        const processAddLiquidity = async () => {
            // Check approval status when in checking-approvals step
            if (step === 'checking-approvals' && agentAddress && !isPoolDataLoading &&
                pool && calculatedAmounts && token0 && token1) {
                try {
                    // Query current approval amounts for both tokens
                    const [allowance0Result, allowance1Result] = await Promise.all([
                        refetchAllowance0(),
                        refetchAllowance1()
                    ]);

                    const allowance0 = allowance0Result.data ?? 0n;
                    const allowance1 = allowance1Result.data ?? 0n;

                    const amount0Needed = BigInt(calculatedAmounts.amount0.toString());
                    const amount1Needed = BigInt(calculatedAmounts.amount1.toString());

                    setDebugInfo(prev => ({
                        ...prev,
                        allowance0: formatUnits(allowance0, 18),
                        allowance1: formatUnits(allowance1, 18)
                    }));

                    const needsApproval0 = allowance0 < amount0Needed;
                    const needsApproval1 = allowance1 < amount1Needed;

                    // Execute approval transactions if needed
                    if (needsApproval0) {
                        setStep('approving-token0');
                        writeApprove0({
                            address: token0.address as `0x${string}`,
                            abi: erc20Abi,
                            chainId: chainId,
                            functionName: 'approve',
                            args: [agentAddress, amount0Needed]
                        });
                    } else if (needsApproval1) {
                        // Check and approve token1 using common function
                        checkAndApproveToken1();
                    } else {
                        // Both tokens approved - execute liquidity addition
                        executeAddLiquidity();
                    }
                } catch (e) {
                    setError('Failed to check token approvals: ' + String(e));
                    setStep('error');
                }
            }
        };
        processAddLiquidity();
    }, [step, isPoolDataLoading, pool, calculatedAmounts, token0, token1, agentAddress, chainId, refetchAllowance0,
        refetchAllowance1, writeApprove0, checkAndApproveToken1, executeAddLiquidity]);

    // Handle Token0 approval completion
    useEffect(() => {
        if (isApproval0Success && step === 'approving-token0') {
            checkAndApproveToken1();
        }
    }, [isApproval0Success, step, checkAndApproveToken1]);

    // Handle Token1 approval completion
    useEffect(() => {
        if (isApproval1Success && step === 'approving-token1') {
            executeAddLiquidity();
        }
    }, [isApproval1Success, step, executeAddLiquidity]);

    // Handle liquidity addition success
    useEffect(() => {
        if (isAddLiquiditySuccess && addLiquidityTxHash) {
            setStep('complete');
        }
    }, [isAddLiquiditySuccess, addLiquidityTxHash]);

    // Unified error handling (pool errors + transaction errors)
    useEffect(() => {
        if (poolError) {
            setError(`Failed to query pool: ${poolError}`);
            setStep('error');
            return;
        }

        // Handle transaction errors
        const txError = approve0Error || approve1Error || addLiquidityError;
        if (txError) {
            const message = txError.message.includes('User rejected')
                ? 'User rejected the transaction' : txError.message;
            setError(message);
            setDebugInfo(prev => ({...prev, errorDetails: message}));
            setStep('error');

            // Optionally disconnect on critical errors
            if (txError.message.includes('execution reverted')) {
                disconnectOnError();
            }
        }
    }, [poolError, approve0Error, approve1Error, addLiquidityError, disconnectOnError]);

    return {
        callAddLiquidity,
        resetAddLiquidity,
        disconnectOnError,
        step,
        error,
        isPending: step === 'checking-balances' || step === 'checking-approvals' || isApproving0 || isApproving1 || isAddingLiquidity || isPoolDataLoading || isBalancesLoading,
        isSuccess: step === 'complete',
        isError: step === 'error',
        addLiquidityTxHash,
        debugInfo,
        poolInfo: {
            poolAddress,
            tickLower,
            tickUpper,
            currentTick,
            token0,
            token1,
            currentAmounts: currentParams,
            calculatedAmounts: calculatedAmounts ? {
                amount0: BigInt(calculatedAmounts.amount0.toString()),
                amount1: BigInt(calculatedAmounts.amount1.toString())
            } : undefined,
            position
        }
    };
}