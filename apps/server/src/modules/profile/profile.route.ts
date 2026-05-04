import { Router } from "express";
import { validateCreateProfile } from "@/modules/profile/profile.middleware";
import {
  createProfile,
  deleteProfile,
  getProfileById,
  getProfiles,
  searchProfiles,
} from "@/modules/profile/profile.controller";
import { authenticate, authorize } from "@/modules/auth/auth.middleware";
import { validateSchema } from "@/misc/utils";
import {
  exportProfilesSchema,
  profileQuerySchema,
  profileSearchSchema,
} from "@/schema/profile.schema";
import { exportProfile } from "@/modules/profile/profile.controller";

const router: Router = Router();

router.get(
  "/",
  authenticate,
  authorize(["admin", "analyst"]),
  validateSchema(profileQuerySchema, (req) => req.query),
  getProfiles,
);
router.get(
  "/search",
  authorize(["admin", "analyst"]),
  validateSchema(profileSearchSchema, (req) => req.query),
  searchProfiles,
);
router.get(
  "/export",
  validateSchema(exportProfilesSchema, (req) => req.query),
  exportProfile
);
router.get("/:id", authorize(["admin", "analyst"]), getProfileById);
router.delete("/:id", authorize(["admin"]), deleteProfile);
router.post("/", authorize(["admin"]), validateCreateProfile, createProfile);

export default router;
