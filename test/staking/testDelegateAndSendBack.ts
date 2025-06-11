import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Bech32I } from '../../typechain-types/contracts/Bech32I';
import { StakingI } from '../../typechain-types/contracts/StakingI';
import { StakingWithSendAfter } from '../../typechain-types/contracts/StakingWithSendAfter';
import { PageRequestStruct } from '../../typechain-types/contracts/StakingI';

// This test case relates to the following GitHub issue:
// https://github.com/evmos/evmos/issues/3065
//
// Basically, it is checking if the funds used for staking
// can still be used in the same smart contract transaction,
// that is doing the staking.
//
// NOTE: actually what's happening is that simply two times the value
// is taken from the account, which makes sense because the sending of funds
// along with the transaction is not used for staking.
// 
// Those assets are being taken directly from the sender's balance instead
// of the sent amount with the transaction.
describe("Calling a contract that's using sent funds after staking", function () {
  const delegationAmount = ethers.parseEther("1");
  let dev0Addr: string;
  let delegationAmountPre: bigint;
  let balancePre: bigint;
  let staking: StakingI;
  let validator: string;
  let valoperAddr: string;
  let testContract: StakingWithSendAfter;

  it("should get the validator address to delegate to", async function () {
    staking = await ethers.getContractAt(
      'StakingI',
      '0x0000000000000000000000000000000000000800'
    );

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
    expect(
      validatorsRes.validators.length >= 1
    ).to.be.true("There should be at least one validator");

    const valOut = validatorsRes.validators[0];
    validator = valOut["operatorAddress"];
  })

  it("should convert the bech32 address", async function () {
    const bech32: Bech32I = await ethers.getContractAt(
      'Bech32I',
      '0x0000000000000000000000000000000000000400'
    );

    valoperAddr = await bech32.hexToBech32(validator, "evmosvaloper");
  })

  it("should show the delegation prior to delegation", async function () {
    const signers = await ethers.getSigners();
    const dev0 = signers[0];
    dev0Addr = await dev0.getAddress();

    const delegationsRes = await staking.delegation(
      dev0Addr,
      valoperAddr
    );
    const delegationCoin = delegationsRes["balance"];
    delegationAmountPre = delegationCoin["amount"];
    expect(
      delegationAmountPre
    ).to.be.greaterThanOrEqual(
      0, "There should be either no or an initial delegation prior to delegating"
    );

    console.log(`existing delegation amount before tx: ${delegationAmountPre}`);
  })

  it("should deploy the test contract", async function () {
    testContract = await ethers.deployContract("StakingWithSendAfter");
    await testContract.waitForDeployment();
  })

  it("should approve the smart contract to delegate on behalf of user", async function () {
    let [dev0] = await ethers.getSigners();
    const testContractAddr = await testContract.getAddress();

    const balancePreApprove = await ethers.provider.getBalance(dev0);
    console.log(`balance before approving: ${balancePreApprove}`);

    const tx = await staking.connect(dev0).approve(
      testContractAddr,
      delegationAmount,
      ["/cosmos.staking.v1beta1.MsgDelegate"]
    );
    await tx.wait();

    const allowance = await staking.allowance(testContractAddr, dev0, "/cosmos.staking.v1beta1.MsgDelegate");
    console.log(`got allowance: ${allowance}`);
    expect(allowance).to.be.equal(delegationAmount);
  })

  it("should execute the transaction without errors", async function () {
    balancePre = await ethers.provider.getBalance(dev0Addr);
    console.log(`balance pre: ${balancePre}`);

    const [signer] = await ethers.getSigners();

    const tx = await testContract.connect(signer).run(
      valoperAddr,
      {
        value: delegationAmount
      }
    );
    const receipt = await tx.wait();
    expect(receipt).to.not.be.null;

    if (receipt !== null) {
      expect(receipt.status).to.be.equal(1, "Transaction should succeed");
    }
  })

  it("should have increased the delegation amount", async function () {
    const delegationsRes = await staking.delegation(
      dev0Addr,
      valoperAddr
    );

    const delegationCoin = delegationsRes["balance"];
    const delegationAmountPost = delegationCoin["amount"];
    expect(
      delegationAmountPost
    ).to.be.equal(
      delegationAmountPre + delegationAmount,
      "Delegation amount should have increased by 1 ether"
    );

    const balancePost = await ethers.provider.getBalance(dev0Addr);
    console.log(`got balance post: ${balancePost}`);
  })

  it("should have decreased the sender account's balance", async function () {
    const balancePost = await ethers.provider.getBalance(dev0Addr);
    console.log(`got balance after transaction: ${balancePost}`);

    const diff = balancePost - balancePre;
    console.log(`diff:   ${diff}`);
    console.log(`amount:  ${delegationAmount}`);
  })

  it("should not have increased the contract's balance but sent the funds back to the sender", async function () {
    const balanceContract = await ethers.provider.getBalance(testContract);
    expect(balanceContract).to.equal(0, "expected no funds to have been transferred to contract");
  })
});
