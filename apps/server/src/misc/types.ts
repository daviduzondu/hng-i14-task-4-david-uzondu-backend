import type { profiles } from "@/db/generated/types";
import type { Updateable } from "kysely";

export interface GenderizeResponse {
  count: number;
  gender: "male" | "female" | null;
  name: string;
  probability: number;
}

export interface AgifyResponse {
  count: number;
  age: number;
  name: string;
}

export interface NationalizeResponse {
  count: number;
  name: string;
  country: {
    country_id: string;
    probability: number;
  }[];
}

export interface GitHubUser {
  id: number;
  login: string; // username
  name: string | null;
  email: string | null; // public email only, may be null
  avatar_url: string;
  html_url: string;
}

export interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: "public" | "private" | null;
}

export type SuccessData =
  | Omit<Updateable<profiles>, "updated_at">
  | Omit<Updateable<profiles>, "updated_at">[];
export interface SuccessResponse {
  status: "success";
  total?: number;
  page?: number;
  limit?: number;
  total_pages?: number;
  links?: {
    self: string;
    prev: string;
    next: string;
  };
  message?: string;
  count?: number;
  data: SuccessData;
}

export interface ErrorResponse {
  status: "error";
  message: string;
}
