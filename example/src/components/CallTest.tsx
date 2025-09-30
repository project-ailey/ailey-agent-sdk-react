import { useAgentApiContract, useAccount } from 'ailey-agent-sdk-react';

export function CallTest() {
    const { callContract, isPending, isSuccess, isError } = useAgentApiContract();
    const { isConnected } = useAccount();

    const handleContractCall = () => {
        if (!isConnected) {
            alert('Please connect your wallet first!');
            return;
        }
        callContract('callTest');
    };

    return (
        <div className="w-full">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 mb-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-white">🔧</span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        This function tests basic smart contract interaction through the Ailey Agent API.
                        It will execute the <code className="bg-white px-2 py-1 rounded text-xs font-mono">callTest</code> function
                        on the deployed contract.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Function Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-gray-500">Function:</span>
                            <code className="ml-2 bg-gray-100 px-2 py-1 rounded font-mono">callTest()</code>
                        </div>
                        <div>
                            <span className="font-medium text-gray-500">Parameters:</span>
                            <span className="ml-2 text-gray-700">None</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleContractCall}
                    disabled={isPending || !isConnected}
                    className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
                        !isConnected
                            ? 'bg-gray-400 cursor-not-allowed'
                            : isPending
                            ? 'bg-blue-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
                    } focus:outline-none focus:ring-4 focus:ring-blue-300`}
                >
                    {!isConnected ? (
                        <span className="flex items-center justify-center space-x-2">
                            <span>🔗</span>
                            <span>Connect Wallet First</span>
                        </span>
                    ) : isPending ? (
                        <span className="flex items-center justify-center space-x-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v8H4z"></path>
                            </svg>
                            <span>Calling Contract...</span>
                        </span>
                    ) : (
                        <span className="flex items-center justify-center space-x-2">
                            <span>🚀</span>
                            <span>Execute Contract Call</span>
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
                                            Transaction Successful!
                                        </h4>
                                        <p className="text-sm text-green-700 mt-1">
                                            The contract function was executed successfully.
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
                                            Transaction Failed
                                        </h4>
                                        <p className="text-sm text-red-700 mt-1">
                                            An error occurred while executing the contract function. Please try again.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}