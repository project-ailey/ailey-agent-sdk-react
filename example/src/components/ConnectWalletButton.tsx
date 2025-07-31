import {useAccount, useConnect, useDisconnect} from "ailey-agent-sdk-react";

export function ConnectWalletButton() {
    const {address, isConnected} = useAccount();
    const {connectors, connect} = useConnect();
    const {disconnect} = useDisconnect();

    if (isConnected) {
        return (
            <div className="text-center p-4">
                <p className="text-sm text-gray-600">Connected wallet: {`${address?.slice(0, 6)}...${address?.slice(-4)}`}</p>
                <button
                    onClick={() => disconnect()}
                    className="mt-2 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
                >
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <div className="text-center p-4">
            {connectors.map((connector) => (
                <button
                    key={connector.uid}
                    onClick={() => connect({connector})}
                    className="px-6 py-2 font-bold text-white bg-green-500 rounded-md hover:bg-green-600"
                >
                    {connector.name} Connect to wallet
                </button>
            ))}
        </div>
    );
}