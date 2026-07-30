import { revalidatePath } from "next/cache";

/** Bust public landing/apply caches after admin content or settings change. */
export function revalidatePublicSite() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/apply");
}
