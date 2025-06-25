import { expect } from 'chai';
import { ethers } from 'hardhat';

describe("CREATE2 deterministic deployment proxy", function () {
  // CREATE2 proxy address
  const CREATE2_ADDRESS = "0x4e59b44847b379578588920ca78fbf26c0b4956c";
  
  // Prepare the transaction data
  // NOTE: this contains 32 bytes of salt plus the bytecode to be deployed
  const salt = "0x0000000000000000000000000000000000000000000000000000000000000008";
  let deployedAddress: string;
  
  let transactionData: string;

  before(async function () {
    // Get the compiled bytecode from the Apple contract
    const AppleFactory = await ethers.getContractFactory("Apple");
    const appleBytecode = AppleFactory.bytecode;

    console.log("apple bytecode:", appleBytecode);
    
    // Prepare transaction data: salt + bytecode (without 0x prefix)
    transactionData = salt + appleBytecode.slice(2);
    
    console.log("Using bytecode from Apple.sol contract");
    console.log("Bytecode length:", appleBytecode.length);
  });

  it("should verify account has non-zero balance before trying to deploy", async function () {
    const [signer] = await ethers.getSigners();
    
    const balance = await ethers.provider.getBalance(await signer.getAddress());
    console.log("Account balance:", ethers.formatEther(balance), "ETH");
    
    // Verify the account has some balance
    expect(balance).to.be.gt(0, "expected transaction signer to have non-zero balance");
  });


  it("should calculate the deployed contract address correctly", async function () {
    const [signer] = await ethers.getSigners();
    
    // Calculate the deployed contract address
    deployedAddress = await ethers.provider.call({
      from: await signer.getAddress(),
      to: CREATE2_ADDRESS,
      data: transactionData,
    });
    
    console.log("Deployed contract address:", deployedAddress);
  });

  it("should deploy a contract via CREATE2 proxy", async function () {
    const [signer] = await ethers.getSigners();
    
    console.log("Deploying Apple contract via CREATE2 proxy...");
    console.log("From:", await signer.getAddress());
    console.log("To:", CREATE2_ADDRESS);
    console.log("Data length:", transactionData.length);
    
    // Send the transaction
    const tx = await signer.sendTransaction({
      to: CREATE2_ADDRESS,
      data: transactionData,
      gasLimit: 100000, // Reduced from 1000000 to avoid uint64 overflow
    });
    
    console.log("Transaction hash:", tx.hash);
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    expect(receipt).to.not.be.null;
    expect(receipt!.status).to.equal(1, "expected successful transaction");
    console.log("Transaction confirmed in block:", receipt!.blockNumber);
  });

  it("should be possible to call the deployed contract method", async function () {
    const [signer] = await ethers.getSigners();
    
    // Call the contract method - banana() function from Apple.sol
    const methodSignature = "0xc3cafc6f"; // keccak256("banana()")[:4]
    const result = await ethers.provider.call({
      to: deployedAddress,
      data: methodSignature,
    });

    console.log("result:", result);
    const decodedResult = parseInt(result, 16);
    console.log("Decoded result:", decodedResult);

    // Verify the result is 42 (as expected from the Apple.sol contract)
    expect(decodedResult).to.equal(42, "expected Apple.banana() method to return 42");
  });
});
