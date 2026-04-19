// LEGACY / COMPAT ONLY: use seller.schema.ts as the canonical seller schema module.
export {
  CreateSellerWithdrawRequestBody,
  SellerBookingsQuery,
  SellerPagingQuery,
  SellerRangeQuery,
} from "./seller.schema.js";

export {
  CreateSellerWithdrawRequestBody as CreateWithdrawRequestBody,
  SellerBookingsQuery as PartnerBookingsQuery,
  SellerPagingQuery as PartnerPagingQuery,
  SellerRangeQuery as PartnerRangeQuery,
} from "./seller.schema.js";
