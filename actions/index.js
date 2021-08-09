import { createChangeRequest } from "./create.js";
import { attachFile } from "./attach-file.js";
import { approveNormalChangeRequest } from "./approve.js";
import { requireChangeRequestApproval } from "./require-approval.js";
import { transitionState } from "./transition.js";
import { lookupChangeRequest } from "./lookup-change-request.js";

export default {
  "attach-file": attachFile,
  create: createChangeRequest,
  approve: approveNormalChangeRequest,
  "lookup-change-request": lookupChangeRequest,
  "require-approval": requireChangeRequestApproval,
  transition: transitionState,
};
