import type { Role } from "@/db/generated/types";

export function buildTestAuthPayload({
  adminAccessToken,
  adminRefreshToken,
  analystAccessToken,
  analystRefreshToken,

  adminRole,
  adminId,
  adminUsername,
  adminEmail,
  adminUserId,

  analystRole,
  analystId,
  analystUsername,
  analystEmail,
  analystUserId,
}: {
  adminAccessToken: string;
  adminRefreshToken: string;
  analystAccessToken: string;
  analystRefreshToken: string;

  adminRole: Role;
  adminId: string;
  adminUsername: string;
  adminEmail: string;
  adminUserId: string;

  analystRole: Role;
  analystId: string;
  analystUsername: string;
  analystEmail: string;
  analystUserId: string;
}) {
  return {
    // flat generic
    access_token: adminAccessToken,
    refresh_token: adminRefreshToken,

    // // role-specific flat
    // admin_access_token: adminAccessToken,
    // admin_refresh_token: adminRefreshToken,
    analyst_access_token: analystAccessToken,
    analyst_refresh_token: analystRefreshToken,

    // grouped structure
    // admin: {
    //   id: adminId,
    //   userId: adminUserId,
    //   role: adminRole,
    //   username: adminUsername,
    //   email: adminEmail,
    //   access_token: adminAccessToken,
    //   refresh_token: adminRefreshToken,
    // },

    // analyst: {
    //   id: analystId,
    //   userId: analystUserId,
    //   role: analystRole,
    //   username: analystUsername,
    //   email: analystEmail,
    //   access_token: analystAccessToken,
    //   refresh_token: analystRefreshToken,
    // },
  };
}
