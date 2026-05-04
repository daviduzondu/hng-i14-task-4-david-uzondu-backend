import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export const Role = {
    admin: "admin",
    analyst: "analyst"
} as const;
export type Role = (typeof Role)[keyof typeof Role];
export const Gender = {
    female: "female",
    male: "male"
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];
export const AgeGroup = {
    child: "child",
    teenager: "teenager",
    adult: "adult",
    senior: "senior"
} as const;
export type AgeGroup = (typeof AgeGroup)[keyof typeof AgeGroup];
export type profiles = {
    id: Generated<string>;
    name: string;
    gender: Gender;
    gender_probability: number;
    age: number;
    age_group: AgeGroup;
    country_id: string;
    country_probability: number;
    country_name: string;
    created_at: Generated<Timestamp>;
    updated_at: Generated<Timestamp>;
};
export type refresh_tokens = {
    id: Generated<string>;
    user_id: string;
    token_hash: string;
    expires_at: Timestamp;
    created_at: Generated<Timestamp>;
    updated_at: Generated<Timestamp>;
};
export type users = {
    id: Generated<string>;
    github_id: string;
    username: string;
    email: string;
    avatar_url: string;
    role: Generated<Role>;
    is_active: boolean;
    last_login_at: Timestamp;
    created_at: Generated<Timestamp>;
    updated_at: Generated<Timestamp>;
};
export type DB = {
    profiles: profiles;
    refresh_tokens: refresh_tokens;
    users: users;
};
