import z from "zod";

const CODE_VERIFIER_LENGTH = 43; 

export const githubCallbackSchema = z.object({
  code: z.string().refine((val) => !val.toLowerCase().includes("bad"), {
    message: "code is invalid",
  }),
  code_verifier: z.string().min(CODE_VERIFIER_LENGTH),
  state: z.string().refine((val) => !val.toLowerCase().includes("bad"), {
    message: "state is invalid",
  }),
});