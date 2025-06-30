import { expect } from "chai";
import { ethers } from "hardhat";
import { Multicall3, MyToken } from "../../typechain-types/contracts";

describe("testing multicall3", function () {
  let multicall3Address = "0xcA11bde05977b3631167028862bE2a173976CA11";
  let multicall3: Multicall3;

  let tokenAddress: string;
  let token: MyToken;

  const mintAmount = ethers.parseEther("1");

  it("should be possible to retrieve info about the contract", async function () {
    multicall3 = await ethers.getContractAt("Multicall3", multicall3Address);
    const code = await multicall3.getDeployedCode();
    expect(code).to.not.be.null;
  });

  it("should be possible to deploy a generic erc-20 token", async function () {
    const tokenFactory = await ethers.getContractFactory("MyToken");
    token = await tokenFactory.deploy();
    await token.waitForDeployment();

    tokenAddress = await token.getAddress();
    expect(await token.symbol()).to.equal("MTK");
  });

  it("should be possible to mint some tokens", async function () {
    let [signer] = await ethers.getSigners();

    const balancePre = await token.balanceOf(signer);

    const tx = await token.mint(signer, mintAmount);
    const receipt = await tx.wait();
    expect(receipt!.status).to.equal(1);

    const balanceAfter = await token.balanceOf(signer);
    expect(balanceAfter - balancePre).to.equal(mintAmount);
  });

  it("should be possible to query the balance using the multicall3 contract", async function () {
    let [signer, other] = await ethers.getSigners();

    const balanceOfDataSigner = token.interface.encodeFunctionData(
      "balanceOf",
      [signer.address]
    );
    const balanceOfDataOther = token.interface.encodeFunctionData("balanceOf", [
      other.address,
    ]);

    const results = await multicall3.aggregate3.staticCall([
      {
        target: tokenAddress,
        allowFailure: false,
        callData: balanceOfDataSigner,
      },
      {
        target: tokenAddress,
        allowFailure: false,
        callData: balanceOfDataOther,
      },
    ]);

    const balanceSigner = token.interface.decodeFunctionResult(
      "balanceOf",
      results[0][1]
    );
    expect(balanceSigner[0]).to.equal(1000000000000000000n);
    expect(balanceSigner.length).to.equal(1);

    const balanceOther = token.interface.decodeFunctionResult(
      "balanceOf",
      results[1][1]
    );
    expect(balanceOther[0]).to.equal(0n);
    expect(balanceOther.length).to.equal(1);
  });
});
