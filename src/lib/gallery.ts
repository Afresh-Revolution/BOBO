import "server-only";

import { prisma } from "@/lib/db";

export type GalleryImageCard = {
  id: string;
  imageUrl: string;
  caption: string | null;
  alt: string | null;
  sortOrder: number;
};

export type GalleryAlbumSection = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  sortOrder: number;
  images: GalleryImageCard[];
};

export async function getPublishedGalleryAlbums(): Promise<
  GalleryAlbumSection[]
> {
  try {
    const albums = await prisma.galleryAlbum.findMany({
      where: { isPublished: true, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        images: {
          where: { isPublished: true, deletedAt: null },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    return albums
      .map((album) => ({
        id: album.id,
        title: album.title,
        slug: album.slug,
        description: album.description,
        coverUrl: album.coverUrl,
        sortOrder: album.sortOrder,
        images: album.images.map((img) => ({
          id: img.id,
          imageUrl: img.imageUrl,
          caption: img.caption,
          alt: img.alt,
          sortOrder: img.sortOrder,
        })),
      }))
      .filter((album) => album.images.length > 0 || Boolean(album.coverUrl));
  } catch (err) {
    console.error("[getPublishedGalleryAlbums]", err);
    return [];
  }
}

/** Preview tiles for the landing teaser (covers / first images). */
export async function getGalleryTeaserImages(limit = 4): Promise<string[]> {
  try {
    const albums = await getPublishedGalleryAlbums();
    const urls: string[] = [];
    for (const album of albums) {
      if (album.coverUrl) urls.push(album.coverUrl);
      for (const img of album.images) {
        if (!urls.includes(img.imageUrl)) urls.push(img.imageUrl);
        if (urls.length >= limit) return urls.slice(0, limit);
      }
      if (urls.length >= limit) break;
    }
    return urls.slice(0, limit);
  } catch (err) {
    console.error("[getGalleryTeaserImages]", err);
    return [];
  }
}
