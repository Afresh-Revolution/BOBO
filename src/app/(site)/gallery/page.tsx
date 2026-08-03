import type { Metadata } from "next";
import { GalleryPageView } from "@/components/gallery/GalleryPageView";
import { getPublishedCms } from "@/lib/cms";
import { resolveLandingCopy } from "@/lib/cms-landing";
import { getPublishedGalleryAlbums } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery",
  description: "BOBO photo albums — seasons, casting, and moments from the stage.",
};

export default async function GalleryPage() {
  const [cms, albums] = await Promise.all([
    getPublishedCms(),
    getPublishedGalleryAlbums(),
  ]);
  const landing = resolveLandingCopy(cms);

  return (
    <GalleryPageView
      eyebrow={landing.gallery.eyebrow}
      title={landing.gallery.pageTitle}
      description={landing.gallery.pageDescription}
      albums={albums}
    />
  );
}
