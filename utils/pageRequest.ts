import { PageRequestStruct } from "../typechain-types/contracts/StakingI";

export const emptyPageRequest: PageRequestStruct = {
  key: new Uint8Array(),
  offset: 0,
  limit: 0,
  countTotal: false,
  reverse: false,
};
