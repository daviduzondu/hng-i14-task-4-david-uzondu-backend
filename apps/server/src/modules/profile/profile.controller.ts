import type { Request, Response } from "express";
import * as profileService from "@/modules/profile/profile.service";
import type { SuccessResponse, ErrorResponse } from "@/misc/types";
import type {
  exportProfilesSchema,
  profileQuerySchema,
  profileSearchSchema,
} from "@/schema/profile.schema";
import type z from "zod";
import { format } from "date-fns";
import { StatusCodes } from "http-status-codes";

export const createProfile = async (
  req: Request<object, object, { name: string }, object>,
  res: Response<SuccessResponse | ErrorResponse>,
) => {
  const result = await profileService.createProfile(req.body.name);
  return res.status(result.statusCode).json(result.body);
};

export const searchProfiles = async (
  req: Request<object, object, object, z.infer<typeof profileSearchSchema>>,
  res: Response<SuccessResponse | ErrorResponse>,
) => {
  const result = await profileService.searchProfiles(req.query);
  return res.status(result.statusCode).json(result.body);
};

export const getProfileById = async (
  req: Request<{ id: string }, object, object, object>,
  res: Response<SuccessResponse | ErrorResponse>,
) => {
  const result = await profileService.getProfileById(req.params.id);
  return res.status(result.statusCode).json(result.body);
};

export const getProfiles = async (
  req: Request<object, object, object, z.infer<typeof profileQuerySchema>>,
  res: Response<SuccessResponse | ErrorResponse>,
) => {
  const result = await profileService.getProfiles(req.query);
  return res.status(result.statusCode).json(result.body);
};

export const deleteProfile = async (
  req: Request<{ id: string }, object, object, object>,
  res: Response,
) => {
  const result = await profileService.deleteProfile(req.params.id);
  return res.status(result.statusCode).json();
};

export const exportProfile = async (
  req: Request<object, object, object, z.infer<typeof exportProfilesSchema>>,
  res: Response,
) => {
  const result = await profileService.exportProfile(req.query);
  if (result.body.status === "success") {
    const filename = `profiles_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.csv`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(StatusCodes.OK).send(result.body.data.csv);
  } else {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "Failed to generate CSV file",
    });
  }
};
