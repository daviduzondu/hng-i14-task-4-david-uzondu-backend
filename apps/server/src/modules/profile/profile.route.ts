import { Router } from "express";
import { validateCreateProfile } from "@/modules/profile/profile.middleware";
import {
  createProfile,
  deleteProfile,
  getProfileById,
  getProfiles,
  searchProfiles,
  uploadCsv,
} from "@/modules/profile/profile.controller";
import { authenticate, authorize } from "@/modules/auth/auth.middleware";
import { getQueryHash, validateSchema } from "@/misc/utils";
import {
  exportProfilesSchema,
  profileQuerySchema,
  profileSearchSchema,
} from "@/schema/profile.schema";
import { exportProfile } from "@/modules/profile/profile.controller";
import { cache } from "@/modules/cache/cache.middleware";

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
  cache(300, (req) => getQueryHash(req.query)),
  searchProfiles,
);
router.get(
  "/export",
  validateSchema(exportProfilesSchema, (req) => req.query),
  exportProfile,
);
router.get("/:id", authorize(["admin", "analyst"]), cache(300), getProfileById);
router.delete("/:id", authorize(["admin"]), deleteProfile);
router.post("/", authorize(["admin"]), validateCreateProfile, createProfile);
router.post("/upload", authorize(["admin"]), uploadCsv);
export default router;
