import {useAccount, useConnect, useDisconnect} from "ailey-agent-sdk-react";

export function ConnectWalletButton() {
    const {address, isConnected} = useAccount();
    const {connectors, connect} = useConnect();
    const {disconnect} = useDisconnect();

    if (isConnected) {
        return (
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-800">
                        {`${address?.slice(0, 6)}...${address?.slice(-4)}`}
                    </span>
                </div>
                <button
                    onClick={() => disconnect()}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors duration-200"
                >
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center space-x-2">
            {connectors.map((connector) => (
                <button
                    key={connector.uid}
                    onClick={() => connect({connector})}
                    className="flex items-center space-x-2 px-6 py-2 font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                    <span>🔗</span>
                    <span>Connect {connector.name}</span>
                </button>
            ))}
        </div>
    );
}