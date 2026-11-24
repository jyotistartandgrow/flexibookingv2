// True when /voucher-detail says this voucher must be redeemed by contacting the venue.
export const isPhoneOnlyRedemption = (detail) =>
  Boolean(detail?.status) &&
  (detail.can_redeem_online === false ||
    detail.allow_online_redemption === false ||
    detail.redemption?.can_redeem_online === false ||
    detail.redemption?.phone_booking_required === true);
