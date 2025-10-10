function Footer() {
    return (
        <div className="bg-[#1C1E22] text-white px-6 md:px-14 lg:px-[100px] py-20 lg:pb-40">
            <div className="mx-auto flex justify-between flex-col md:flex-row">
                <div className="flex flex-col mb-8 md:mb-0">
                    <div>
                        <h1 className="text-2xl font-bold italic mb-4">
                            <img src="https://myailey.com/assets/images/logo2.svg" alt="" className="w-[122px]"/>
                        </h1>
                        <p className="text-base text-[#75787F]">© 2025 Project Ailey. All Rights Reserved.</p>
                    </div>
                    <div className="flex space-x-6 mt-14 mb-28 lg:mb-0">
                        <a href="https://project-ailey.gitbook.io/project-ailey" target="_blank" rel="noopener noreferrer" className="group">
                            <img src="https://myailey.com/static/media/footer1.943f4cbf9106feaff8a570494276f483.svg" alt="Project Ailey Gitbook" className="w-6 transition-all duration-300 group-hover:filter group-hover:brightness-[0.35] group-hover:grayscale group-hover:contrast-[1.2]"/>
                        </a>
                        <a href="https://github.com/project-ailey" target="_blank" rel="noopener noreferrer" className="group">
                            <img src="https://myailey.com/static/media/footer5.4914e56743d82be8855e3e424df87422.svg" alt="Project Ailey Github" className="w-6 transition-all duration-300 group-hover:filter group-hover:brightness-[0.35] group-hover:grayscale group-hover:contrast-[1.2]"/>
                        </a>
                        <a href="https://twitter.com/aileyverse" target="_blank" rel="noopener noreferrer" className="group">
                            <img src="https://myailey.com/static/media/footer2.718bcfe4c73c4c617d36b35e841c667a.svg" alt="Project Ailey Twitter" className="w-6 transition-all duration-300 group-hover:filter group-hover:brightness-[0.35] group-hover:grayscale group-hover:contrast-[1.2]"/>
                        </a>
                        <a href="https://discord.gg/RdQGGyx3Xf" target="_blank" rel="noopener noreferrer" className="group">
                            <img src="https://myailey.com/static/media/footer3.cfa8b43948b07136223f922aa8bde333.svg" alt="Project Ailey Discord" className="w-6 transition-all duration-300 group-hover:filter group-hover:brightness-[0.35] group-hover:grayscale group-hover:contrast-[1.2]"/>
                        </a>
                        <a href="https://t.me/project_ailey" target="_blank" rel="noopener noreferrer" className="group">
                            <img src="https://myailey.com/static/media/footer4.ca8685d6f849be16b95bab1cb04a93b6.svg" alt="Project Ailey Telegram" className="w-6 transition-all duration-300 group-hover:filter group-hover:brightness-[0.35] group-hover:grayscale group-hover:contrast-[1.2]"/>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default Footer;