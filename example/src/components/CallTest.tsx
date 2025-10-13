import { useAgentApiContract, useAccount } from 'ailey-agent-sdk-react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export function CallTest({ onClose: _onClose }: { onClose: () => void }) {
    const { callContract, isPending, isSuccess, isError } = useAgentApiContract();
    const { isConnected } = useAccount();

    useEffect(() => {
        if (isSuccess) {
            toast.success('Transaction Successful', {
                description: 'The contract function was executed successfully.'
            });
        }
    }, [isSuccess]);

    useEffect(() => {
        if (isError) {
            toast.error('Transaction Failed', {
                description: 'An error occurred while executing the contract function. Please try again.'
            });
        }
    }, [isError]);

    const handleContractCall = () => {
        if (!isConnected) {
            toast.error('Please connect your wallet first');
            return;
        }
        callContract('callTest');
    };

    return (
        <div className="w-full space-y-6">
            {/* Info Section */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <p className="text-sm text-gray-700 leading-relaxed">
                    This function tests basic smart contract interaction through the Ailey Agent API.
                    It will execute the <code className="bg-white px-2 py-1 rounded text-xs font-mono border border-gray-200">callTest</code> function
                    on the deployed contract.
                </p>
            </div>

            {/* Function Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Function Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="font-medium text-gray-500">Function:</span>
                        <code className="ml-2 bg-gray-50 px-2 py-1 rounded font-mono border border-gray-200">callTest()</code>
                    </div>
                    <div>
                        <span className="font-medium text-gray-500">Parameters:</span>
                        <span className="ml-2 text-gray-700">None</span>
                    </div>
                </div>
            </div>

            {/* Execute Button */}
            <button
                onClick={handleContractCall}
                disabled={isPending || !isConnected}
                className={`w-full py-4 px-6 rounded-lg font-medium text-white transition-colors duration-200 flex items-center justify-center gap-2 ${
                    !isConnected
                        ? 'bg-gray-400 cursor-not-allowed'
                        : isPending
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gray-900 hover:bg-gray-800'
                }`}
            >
                {!isConnected ? (
                    <span>Connect Wallet First</span>
                ) : isPending ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Calling Contract...</span>
                    </>
                ) : (
                    <span>Execute Contract Call</span>
                )}
            </button>
        </div>
    );
}
