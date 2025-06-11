// Check the balance of the first signer from the environment
import { ethers } from "hardhat";

async function main() {
  // Get the first signer
  const [signer] = await ethers.getSigners();
  
  // Get the balance
  const balance = await ethers.provider.getBalance(signer.address);
  
  console.log(`Address: ${signer.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH (${balance.toString()} wei)`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
