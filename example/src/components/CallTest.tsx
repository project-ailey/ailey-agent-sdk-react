import { useAgentApiContract } from 'ailey-agent-sdk-react';

export function CallTest() {
    const { callContract, isPending, isSuccess, isError } = useAgentApiContract();

    const handleContractCall = () => {
        callContract('callTest');
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-md">

            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-800">Contract testing</h1>
                <p className="mt-2 text-gray-600">Press the button to call the smart contract function.</p>
            </div>

            <div className="mt-6">
                <button
                    onClick={handleContractCall}
                    disabled={isPending}
                    className="w-full px-4 py-2 font-bold text-white bg-blue-500 rounded-md
                               hover:bg-blue-600
                               focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75
                               disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    {isPending ? '...Calling' : 'CALL TEST'}
                </button>
            </div>

            <div className="mt-4 text-center">
                {isSuccess && (
                    <p className="text-green-500 font-semibold">
                        ✅ Transaction successful!
                    </p>
                )}
                {isError && (
                    <p className="text-red-500 font-semibold">
                        ❌ An error has occurred.
                    </p>
                )}
            </div>
        </div>
    );
}