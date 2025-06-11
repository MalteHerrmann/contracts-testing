// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./StakingI.sol";

/*
 * @title StakingWithSendAfter
 * @dev This contract tests sending out 
 *
 */
contract StakingWithSendAfter {
  function run(
    string calldata valBech32
  ) external payable {
    // NOTE: this requires a pre-made approval for this contract
    // to be able to delegate on behalf of the sender

    // NOTE: the delegation does not use the sent funds
    // through the payable functionality but rather uses the account's own balance.
    bool success = STAKING_CONTRACT.delegate(
        msg.sender,
        valBech32,
        msg.value
    );
    require(success, "Failed to delegate");

    // Send the transferred amount back to the user
    // as a test.
    (success, ) = msg.sender.call{value: msg.value}("");
    require(success, "Failed to call");
  }
}
