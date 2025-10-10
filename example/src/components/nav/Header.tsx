import {ConnectWalletButton} from "@/components/ConnectWalletButton.tsx";

function Header() {
    return (
        <header className="bg-white shadow-lg border-b border-gray-200">
            <div className="mx-auto px-14">
                <div className="flex justify-between items-center h-[90px]">
                    <div className="flex items-top gap-2">
                        <img
                            className="w-[122px] h-[44px] cursor-pointer"
                            alt="logo"
                            src="https://myailey.com/static/media/ailey_logo_black.3ffa189f005129dbd773.png"
                            onClick={() => {
                                window.open('https://myailey.com/')
                            }}
                        />
                        <span className="font-bold">open sdk</span>
                    </div>
                    <ConnectWalletButton/>
                </div>
            </div>
        </header>
    )
};

export default Header;