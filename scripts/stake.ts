import { ethers } from "hardhat";
import { PageRequestStruct } from "../typechain-types/contracts/StakingI";

async function main() {
  // change here the address of the validator you want to stake to
  const stakeAmount = ethers.parseEther("0.001");

  const staking = await ethers.getContractAt(
    "StakingI",
    "0x0000000000000000000000000000000000000800"
  );

  const [signer] = await ethers.getSigners();

  const pageRequest: PageRequestStruct = {
    key: new Uint8Array(),
    offset: 0,
    limit: 0,
    countTotal: false,
    reverse: false,
  };

  const validatorsRes = await staking.validators(
    "BOND_STATUS_BONDED",
    pageRequest
  );

  const valOut = validatorsRes.validators[0];
  const valAddr = valOut.operatorAddress;
  console.log(`got validator: ${valAddr}`);

  const bech32Precompile = await ethers.getContractAt(
    "Bech32I",
    "0x0000000000000000000000000000000000000400"
  );

  const valAddrBech32 = await bech32Precompile.hexToBech32(valAddr, "evmosvaloper");
  console.log(`got bech32 addr: ${valAddrBech32}`);

  const tx = await staking.delegate(signer, valAddrBech32, stakeAmount);
  const receipt = await tx.wait(1);

  console.log(
    `Staked ${ethers.formatEther(stakeAmount)} EVMOS with ${valAddrBech32}`
  );
  console.log("The transaction details are");
  console.log(receipt);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
