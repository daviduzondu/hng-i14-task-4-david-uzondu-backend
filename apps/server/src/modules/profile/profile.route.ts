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
import { getQueryHash, parseSearchQuery, validateSchema } from "@/misc/utils";
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
  ...(process.env.NODE_ENV !== "test"
    ? [authenticate, authorize(["admin", "analyst"])]
    : []),
  validateSchema(profileQuerySchema, (req) => req.query),
  cache(300, (req) => getQueryHash(profileQuerySchema.parse(req.query))),
  getProfiles,
);
router.get(
  "/search",
  ...(process.env.NODE_ENV !== "test" ? [authorize(["admin", "analyst"])] : []),
  validateSchema(profileSearchSchema, (req) => req.query),
  cache(300, (req) =>
    getQueryHash(
      profileQuerySchema.parse(
        parseSearchQuery(profileSearchSchema.parse(req.query).q),
      ),
    ),
  ),
  searchProfiles,
);
router.get(
  "/export",
  validateSchema(exportProfilesSchema, (req) => req.query),
  exportProfile,
);
router.get(
  "/:id",
  ...(process.env.NODE_ENV !== "test" ? [authorize(["admin", "analyst"])] : []),
  cache(300),
  getProfileById,
);
router.delete(
  "/:id",
  ...(process.env.NODE_ENV !== "test" ? [authorize(["admin"])] : []),
  deleteProfile,
);
router.post(
  "/",
  ...(process.env.NODE_ENV !== "test" ? [authorize(["admin"])] : []),
  validateCreateProfile,
  createProfile,
);
router.post(
  "/upload",
  ...(process.env.NODE_ENV !== "test" ? [authorize(["admin"])] : []),
  uploadCsv,
);
export default router;
