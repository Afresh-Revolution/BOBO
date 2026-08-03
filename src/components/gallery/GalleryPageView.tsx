"use client";

import { useMemo, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { GalleryAlbumSection } from "@/lib/gallery";
import {
  GalleryLightbox,
  type LightboxImage,
} from "./GalleryLightbox";
import styles from "./GalleryPage.module.scss";

type GalleryPageViewProps = {
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
  albums: GalleryAlbumSection[];
};

export function GalleryPageView({
  eyebrow = "Gallery",
  title = "The gallery",
  description = "Albums from the BOBO world — seasons, casting, and moments off-camera.",
  albums,
}: GalleryPageViewProps) {
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const activeAlbum = useMemo(
    () => albums.find((a) => a.id === activeAlbumId) ?? null,
    [albums, activeAlbumId],
  );

  const lightboxImages: LightboxImage[] = useMemo(
    () =>
      (activeAlbum?.images ?? []).map((img) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        caption: img.caption,
        alt: img.alt,
      })),
    [activeAlbum],
  );

  function openImage(albumId: string, index: number) {
    setActiveAlbumId(albumId);
    setActiveIndex(index);
  }

  function closeLightbox() {
    setActiveIndex(null);
    setActiveAlbumId(null);
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <Reveal>
            <SectionHeader
              eyebrow={eyebrow || "Gallery"}
              title={title || "The gallery"}
              description={
                description ||
                "Albums from the BOBO world — seasons, casting, and moments off-camera."
              }
              align="center"
              tone="dark"
            />
          </Reveal>

          {albums.length > 1 ? (
            <nav className={styles.jump} aria-label="Albums">
              {albums.map((album) => (
                <a
                  key={album.id}
                  href={`#${album.slug}`}
                  className={styles.jumpLink}
                >
                  {album.title}
                </a>
              ))}
            </nav>
          ) : null}
        </div>
      </section>

      {!albums.length ? (
        <section className={styles.empty}>
          <div className="container">
            <p>Gallery albums will appear here once published from the admin.</p>
          </div>
        </section>
      ) : (
        albums.map((album, albumIndex) => (
          <section
            key={album.id}
            id={album.slug}
            className={styles.album}
            aria-labelledby={`album-${album.slug}-title`}
          >
            <div className="container">
              <Reveal delay={0.04 * albumIndex}>
                <header className={styles.albumHead}>
                  <p className={styles.albumEyebrow}>
                    Album {String(albumIndex + 1).padStart(2, "0")}
                  </p>
                  <h2
                    id={`album-${album.slug}-title`}
                    className={styles.albumTitle}
                  >
                    {album.title}
                  </h2>
                  {album.description ? (
                    <p className={styles.albumDesc}>{album.description}</p>
                  ) : null}
                </header>
              </Reveal>

              {album.images.length ? (
                <ul className={styles.grid}>
                  {album.images.map((image, i) => (
                    <Reveal
                      key={image.id}
                      delay={0.05 * (i % 6)}
                      as="li"
                      className={styles.item}
                    >
                      <figure className={styles.figure}>
                        <button
                          type="button"
                          className={styles.thumbBtn}
                          onClick={() => openImage(album.id, i)}
                          aria-label={`View ${image.alt || image.caption || album.title}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={image.imageUrl}
                            alt={image.alt || image.caption || album.title}
                            className={styles.img}
                            loading="lazy"
                          />
                        </button>
                        {image.caption ? (
                          <figcaption className={styles.caption}>
                            {image.caption}
                          </figcaption>
                        ) : null}
                      </figure>
                    </Reveal>
                  ))}
                </ul>
              ) : (
                <p className={styles.albumEmpty}>No images in this album yet.</p>
              )}
            </div>
          </section>
        ))
      )}

      <GalleryLightbox
        images={lightboxImages}
        index={activeIndex}
        albumTitle={activeAlbum?.title}
        onClose={closeLightbox}
        onIndexChange={setActiveIndex}
      />
    </div>
  );
}
