import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import { MyToken } from '../../typechain-types';
import { Multicall3 } from '../../typechain-types';

describe("Multicall3 functionality", function () {
  let token1: MyToken;
  let token2: MyToken;
  let deployer: Signer;
  let receiver: Signer;
  let deployerAddress: string;
  let receiverAddress: string;

  const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";
  let multicall3: Multicall3;

  before(async function () {
    [deployer, receiver] = await ethers.getSigners();
    deployerAddress = await deployer.getAddress();
    receiverAddress = await receiver.getAddress();

    console.log("Deployer address:", deployerAddress);
    console.log("Receiver address:", receiverAddress);

    multicall3 = await ethers.getContractAt("Multicall3", MULTICALL3_ADDRESS);
  });

  it("should deploy two ERC-20 tokens", async function () {
    const MyTokenFactory = await ethers.getContractFactory("MyToken");
    
    // Deploy first token
    token1 = await MyTokenFactory.deploy();
    await token1.waitForDeployment();
    const token1Address = await token1.getAddress();
    console.log("Token1 deployed at:", token1Address);
    
    // Deploy second token
    token2 = await MyTokenFactory.deploy();
    await token2.waitForDeployment();
    const token2Address = await token2.getAddress();
    console.log("Token2 deployed at:", token2Address);
    
    expect(token1Address).to.not.equal(ethers.ZeroAddress);
    expect(token2Address).to.not.equal(ethers.ZeroAddress);
    expect(token1Address).to.not.equal(token2Address);
  });

  it("should mint initial ERC-20 tokens to deployer", async function () {
    const mintAmount = ethers.parseEther("1000");
    
    // Mint tokens to deployer
    const tx1 = await token1.mint(deployerAddress, mintAmount);
    await tx1.wait();

    const tx2 = await token2.mint(deployerAddress, mintAmount);
    await tx2.wait();
    
    // Check initial balances
    const balance1 = await token1.balanceOf(deployerAddress);
    const balance2 = await token2.balanceOf(deployerAddress);
    
    console.log("Initial deployer balance - Token1:", ethers.formatEther(balance1));
    console.log("Initial deployer balance - Token2:", ethers.formatEther(balance2));
    
    expect(balance1).to.equal(mintAmount);
    expect(balance2).to.equal(mintAmount);
  });

  it("should verify Multicall3 contract is working", async function () {
    // First, let's check if the contract exists at this address
    const code = await ethers.provider.getCode(MULTICALL3_ADDRESS);
    console.log("Contract code at Multicall3 address:", code);
    console.log("Code length:", code.length);
    
    if (code === "0x") {
      throw new Error("No contract deployed at Multicall3 address");
    }
    
    // Test a simple view function first
    const getBlockNumberData = multicall3.interface.encodeFunctionData("getBlockNumber");
    console.log("getBlockNumber data:", getBlockNumberData);
    
    // Try calling the function directly on the contract instance first
    try {
      const blockNumber = await multicall3.getBlockNumber();
      console.log("Direct call block number:", blockNumber.toString());
    } catch (error) {
      console.log("Direct call failed:", error);
    }
    
    // Since direct calls work but ethers.provider.call() returns bytecode,
    // let's use the contract instance method instead
    const blockNumberResult = await multicall3.getBlockNumber();
    console.log("Current block number:", blockNumberResult.toString());
  });

  it("should query initial balances using multicall3 aggregate3", async function () {
    // Prepare balanceOf call data for both tokens and both addresses
    const balanceOfSelector = "0x70a08231"; // balanceOf(address)
    
    // Encode balanceOf calls
    const deployerBalance1Data = token1.interface.encodeFunctionData("balanceOf", [deployerAddress]);
    const receiverBalance1Data = token1.interface.encodeFunctionData("balanceOf", [receiverAddress]);
    const deployerBalance2Data = token2.interface.encodeFunctionData("balanceOf", [deployerAddress]);
    const receiverBalance2Data = token2.interface.encodeFunctionData("balanceOf", [receiverAddress]);
    
    // Prepare multicall3 calls
    const calls = [
      {
        target: await token1.getAddress(),
        allowFailure: false,
        callData: deployerBalance1Data
      },
      {
        target: await token1.getAddress(),
        allowFailure: false,
        callData: receiverBalance1Data
      },
      {
        target: await token2.getAddress(),
        allowFailure: false,
        callData: deployerBalance2Data
      },
      {
        target: await token2.getAddress(),
        allowFailure: false,
        callData: receiverBalance2Data
      }
    ];
    
    console.log("Executing multicall3 aggregate3 for initial balances...");
    
    // Since ethers.provider.call() returns bytecode, let's use the contract instance method
    const results = await multicall3.aggregate3.staticCall(calls);
    
    console.log("Results from multicall3:", results);
    
    expect(results).to.have.length(4);
    expect(results[0].success).to.be.true;
    expect(results[1].success).to.be.true;
    expect(results[2].success).to.be.true;
    expect(results[3].success).to.be.true;
    
    // Decode results - access the returnData field from each Result struct
    const deployerBalance1 = token1.interface.decodeFunctionResult("balanceOf", results[0].returnData)[0];
    const receiverBalance1 = token1.interface.decodeFunctionResult("balanceOf", results[1].returnData)[0];
    const deployerBalance2 = token2.interface.decodeFunctionResult("balanceOf", results[2].returnData)[0];
    const receiverBalance2 = token2.interface.decodeFunctionResult("balanceOf", results[3].returnData)[0];
    
    console.log("Initial balances from multicall3:");
    console.log("  Deployer Token1:", ethers.formatEther(deployerBalance1));
    console.log("  Receiver Token1:", ethers.formatEther(receiverBalance1));
    console.log("  Deployer Token2:", ethers.formatEther(deployerBalance2));
    console.log("  Receiver Token2:", ethers.formatEther(receiverBalance2));
    
    // Verify initial balances
    expect(deployerBalance1).to.equal(ethers.parseEther("1000"));
    expect(receiverBalance1).to.equal(0);
    expect(deployerBalance2).to.equal(ethers.parseEther("1000"));
    expect(receiverBalance2).to.equal(0);
  });

//   it("should transfer tokens from deployer to receiver", async function () {
//     const transferAmount = ethers.parseEther("100");
    
//     console.log("Transferring", ethers.formatEther(transferAmount), "tokens to receiver...");
    
//     // Transfer tokens
//     const tx1 = await token1.transfer(receiverAddress, transferAmount);
//     await tx1.wait();
//     const tx2 = await token2.transfer(receiverAddress, transferAmount);
//     await tx2.wait();
    
//     console.log("Transfers completed");
//   });
}); 