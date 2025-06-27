const hre = require("hardhat");

async function main() {
    const tokenFactory = await hre.ethers.getContractFactory("MyToken");
    const token = await tokenFactory.deploy();
    await token.waitForDeployment();

    const tokenAddress = await token.getAddress();

    console.log(`MyToken contract deployed at ${tokenAddress}`);

    const [signer] = await hre.ethers.getSigners();
    const signerAddress = await signer.getAddress();

    const mintAmount = hre.ethers.parseEther("1");

    const mintTx = await token.mint(signerAddress, mintAmount);
    await mintTx.wait();

    console.log(`Minted ${mintAmount} tokens to ${signerAddress} from ERC-20 contract ${tokenAddress}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});