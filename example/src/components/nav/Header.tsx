import {ConnectWalletButton} from "@/components/ConnectWalletButton.tsx";

function Header() {
    return (
        <header className="bg-white shadow-lg border-b border-gray-200">
            <div className="mx-auto px-4 sm:px-8 lg:px-14">
                <div className="flex justify-between items-center h-[70px] sm:h-[80px] lg:h-[90px]">
                    <div className="flex items-top gap-1 sm:gap-2">
                        <img
                            className="w-[90px] h-[32px] sm:w-[110px] sm:h-[40px] lg:w-[122px] lg:h-[44px] cursor-pointer"
                            alt="logo"
                            src="https://myailey.com/static/media/ailey_logo_black.3ffa189f005129dbd773.png"
                            onClick={() => {
                                window.open('https://myailey.com/')
                            }}
                        />
                        <span className="hidden sm:inline font-bold text-sm sm:text-base">example</span>
                    </div>
                    <ConnectWalletButton/>
                </div>
            </div>
        </header>
    )
};

export default Header;