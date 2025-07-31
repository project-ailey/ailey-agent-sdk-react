import {useWaitForTransactionReceipt, useWriteContract} from "wagmi";
import {useAgentApi} from "../context/AgentApiContext";

export function useAgentApiContract() {
    const {address, abi, chainId} = useAgentApi();
    const {writeContract, isPending, isError, data} = useWriteContract();

    const {isSuccess} = useWaitForTransactionReceipt({
        hash: data,
    });

    const callContract = (functionName: string, args = []) => {
        if (!address || !abi || !chainId) {
            console.error("You must set AgentApiProvider.");
            return;
        }

        try {
            writeContract({
                address: address,
                abi: abi,
                chainId: chainId,
                functionName: functionName,
                args: args
            });
        } catch (error) {
            console.error('Detailed error:', error);
        }
    };

    return {callContract, isPending, isError, isSuccess};
}