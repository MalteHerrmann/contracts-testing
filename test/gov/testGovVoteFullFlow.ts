import { emptyPageRequest } from "../../utils/pageRequest";
import { ethers } from "hardhat";
import { expect } from "chai";
import { IGov } from "../../typechain-types";

describe("voting on a governance proposal", function () {
  let GOV_CONTRACT: IGov;

  it("should query the existing proposals", async function () {
    GOV_CONTRACT = await ethers.getContractAt(
      "IGov",
      "0x0000000000000000000000000000000000000805",
    );

    // 2 indicates that it's looking for proposals in voting period.
    //
    // Check more infos here:
    // https://docs.cosmos.network/main/build/modules/gov
    const propStatus = 2;

    let res = await GOV_CONTRACT.getProposals(
      propStatus,
      ethers.ZeroAddress, // NOTE: we're passing the zero address for voter and depositor to get all proposals
      ethers.ZeroAddress,
      emptyPageRequest
    );
    expect(res.proposals.length).to.equal(1, "expected one proposal to be in voting period");
  })
})
