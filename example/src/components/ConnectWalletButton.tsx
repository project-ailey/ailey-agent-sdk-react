import {useAccount, useConnect, useDisconnect} from "ailey-agent-sdk-react";
import { Button } from "@/components/ui/button"
import { Loader2Icon, CheckCircle2, LogOut } from "lucide-react"

export function ConnectWalletButton() {
    const {address, isConnected} = useAccount();
    const {connectors, connect, isPending} = useConnect();
    const {disconnect} = useDisconnect();

    if (isConnected) {
        return (
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-md border border-green-200 dark:border-green-800 h-10">
                    <CheckCircle2 className="text-green-600 dark:text-green-400" size={16} />
                    <span className="text-sm font-medium text-green-800 dark:text-green-300">
                        {`${address?.slice(0, 6)}...${address?.slice(-4)}`}
                    </span>
                </div>
                <Button
                    onClick={() => disconnect()}
                    variant="outline"
                    size="sm"
                    className="h-10 cursor-pointer"
                >
                    <LogOut size={16} />
                    Disconnect
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center">
            {connectors.map((connector) => (
                <Button
                    key={connector.uid}
                    onClick={() => connect({connector})}
                    className="flex items-center justify-center gap-2 h-10 cursor-pointer"
                    size="sm"
                    disabled={isPending}
                >
                    {isPending ? (
                        <>
                            <Loader2Icon className="animate-spin" />
                            Please wait
                        </>
                    ) : (
                        <span>Connect MetaMask</span>
                    )}
                </Button>
            ))}
        </div>
    );
}