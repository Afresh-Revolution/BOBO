"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminButton,
  AdminImageUpload,
  AdminMultiImageUpload,
  AdminShell,
  useConfirm,
} from "@/components/admin";
import { adminFetch, unwrapList } from "@/lib/admin-api";
import { AdminBootSkeleton } from "@/components/ui/Skeleton";
import styles from "../admin.module.scss";

type AlbumRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  sortOrder: number;
  isPublished: boolean;
  imageCount?: number;
};

type ImageRow = {
  id: string;
  albumId: string;
  imageUrl: string;
  caption: string | null;
  alt: string | null;
  sortOrder: number;
  isPublished: boolean;
};

type AlbumDraft = {
  title: string;
  slug: string;
  description: string;
  coverUrl: string;
  sortOrder: string;
  isPublished: boolean;
};

type ImageDraft = {
  caption: string;
  alt: string;
  sortOrder: string;
  isPublished: boolean;
};

function draftFromAlbum(a: AlbumRow): AlbumDraft {
  return {
    title: a.title,
    slug: a.slug,
    description: a.description ?? "",
    coverUrl: a.coverUrl ?? "",
    sortOrder: String(a.sortOrder),
    isPublished: a.isPublished,
  };
}

export default function AdminGalleryPage() {
  const confirm = useConfirm();
  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [albumDrafts, setAlbumDrafts] = useState<Record<string, AlbumDraft>>(
    {},
  );
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [images, setImages] = useState<ImageRow[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imageDrafts, setImageDrafts] = useState<Record<string, ImageDraft>>(
    {},
  );
  const [newAlbum, setNewAlbum] = useState<AlbumDraft>({
    title: "",
    slug: "",
    description: "",
    coverUrl: "",
    sortOrder: "0",
    isPublished: true,
  });
  const [pendingNewUrls, setPendingNewUrls] = useState<string[]>([]);
  const [multiUploading, setMultiUploading] = useState(false);

  const loadAlbums = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/gallery/albums");
      const list = unwrapList<AlbumRow>(res as never);
      setAlbums(list);
      setAlbumDrafts(
        Object.fromEntries(list.map((a) => [a.id, draftFromAlbum(a)])),
      );
      setSelectedAlbumId((prev) => {
        if (prev && list.some((a) => a.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load albums");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadImages = useCallback(async (albumId: string) => {
    setImagesLoading(true);
    try {
      const res = await adminFetch(
        `/api/admin/gallery/images?albumId=${encodeURIComponent(albumId)}`,
      );
      const list = unwrapList<ImageRow>(res as never);
      setImages(list);
      setImageDrafts(
        Object.fromEntries(
          list.map((img) => [
            img.id,
            {
              caption: img.caption ?? "",
              alt: img.alt ?? "",
              sortOrder: String(img.sortOrder),
              isPublished: img.isPublished,
            },
          ]),
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load images");
    } finally {
      setImagesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAlbums();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  useEffect(() => {
    if (selectedAlbumId) void loadImages(selectedAlbumId);
    else {
      setImages([]);
    }
  }, [selectedAlbumId, loadImages]);

  async function saveAlbum(id: string) {
    const draft = albumDrafts[id];
    if (!draft?.title.trim()) {
      setError("Album title is required.");
      return;
    }
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      await adminFetch(`/api/admin/gallery/albums/${id}`, {
        method: "PATCH",
        body: {
          title: draft.title.trim(),
          slug: draft.slug.trim() || undefined,
          description: draft.description.trim() || null,
          coverUrl: draft.coverUrl.trim() || null,
          sortOrder: Number(draft.sortOrder) || 0,
          isPublished: draft.isPublished,
        },
      });
      setMessage("Album saved");
      await loadAlbums();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusyId(null);
    }
  }

  async function createAlbum() {
    if (!newAlbum.title.trim()) {
      setError("Album title is required.");
      return;
    }
    setBusyId("new-album");
    setError(null);
    setMessage(null);
    try {
      const coverUrl =
        newAlbum.coverUrl.trim() || pendingNewUrls[0] || null;
      const res = await adminFetch("/api/admin/gallery/albums", {
        method: "POST",
        body: {
          title: newAlbum.title.trim(),
          slug: newAlbum.slug.trim() || undefined,
          description: newAlbum.description.trim() || null,
          coverUrl,
          sortOrder: Number(newAlbum.sortOrder) || 0,
          isPublished: newAlbum.isPublished,
        },
      });
      const created = (res as { data?: AlbumRow }).data;

      if (created?.id && pendingNewUrls.length) {
        await adminFetch("/api/admin/gallery/images", {
          method: "POST",
          body: {
            albumId: created.id,
            images: pendingNewUrls.map((imageUrl) => ({ imageUrl })),
          },
        });
      }

      setMessage(
        pendingNewUrls.length
          ? `Album created with ${pendingNewUrls.length} image${pendingNewUrls.length === 1 ? "" : "s"}`
          : "Album created",
      );
      setNewAlbum({
        title: "",
        slug: "",
        description: "",
        coverUrl: "",
        sortOrder: "0",
        isPublished: true,
      });
      setPendingNewUrls([]);
      await loadAlbums();
      if (created?.id) setSelectedAlbumId(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteAlbum(id: string, title: string) {
    const ok = await confirm({
      title: "Delete album?",
      message: `Delete “${title}” and all of its images? This cannot be undone from the admin UI.`,
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(id);
    setError(null);
    try {
      await adminFetch(`/api/admin/gallery/albums/${id}`, { method: "DELETE" });
      setMessage("Album deleted");
      if (selectedAlbumId === id) setSelectedAlbumId(null);
      await loadAlbums();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  async function addImages(urls: string[]) {
    if (!selectedAlbumId) {
      setError("Select an album first.");
      return;
    }
    if (!urls.length) return;

    setMultiUploading(true);
    setBusyId("new-image");
    setError(null);
    setMessage(null);
    try {
      await adminFetch("/api/admin/gallery/images", {
        method: "POST",
        body: {
          albumId: selectedAlbumId,
          images: urls.map((imageUrl) => ({ imageUrl })),
        },
      });
      setMessage(
        urls.length === 1
          ? "1 image added"
          : `${urls.length} images added`,
      );
      await loadImages(selectedAlbumId);
      await loadAlbums();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusyId(null);
      setMultiUploading(false);
    }
  }

  async function saveImage(id: string) {
    const draft = imageDrafts[id];
    if (!draft) return;
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      await adminFetch(`/api/admin/gallery/images/${id}`, {
        method: "PATCH",
        body: {
          caption: draft.caption.trim() || null,
          alt: draft.alt.trim() || null,
          sortOrder: Number(draft.sortOrder) || 0,
          isPublished: draft.isPublished,
        },
      });
      setMessage("Image saved");
      if (selectedAlbumId) await loadImages(selectedAlbumId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteImage(id: string) {
    const ok = await confirm({
      title: "Remove image?",
      message: "Remove this image from the album?",
      confirmLabel: "Remove",
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(id);
    try {
      await adminFetch(`/api/admin/gallery/images/${id}`, { method: "DELETE" });
      setMessage("Image removed");
      if (selectedAlbumId) await loadImages(selectedAlbumId);
      await loadAlbums();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  const selectedAlbum = albums.find((a) => a.id === selectedAlbumId) ?? null;

  return (
    <AdminShell
      title="Gallery"
      description="Create albums (sections) and upload images for the public /gallery page."
    >
      {loading ? (
        <AdminBootSkeleton />
      ) : (
        <>
          {error ? <p className={styles.error}>{error}</p> : null}
          {message ? <p className={styles.success}>{message}</p> : null}

          <section className={styles.sectionList} aria-label="Albums">
            <h2 className={styles.panelTitle}>Albums</h2>
            <p className={styles.muted}>
              Each album becomes a section on the gallery page. Select an album
              to manage its images.
            </p>

            {albums.map((album) => {
              const draft = albumDrafts[album.id] ?? draftFromAlbum(album);
              const selected = album.id === selectedAlbumId;
              return (
                <article
                  key={album.id}
                  className={[
                    styles.sectionCard,
                    selected ? styles.sectionCardActive : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className={styles.fieldGrid}>
                    <label className={styles.field}>
                      <span>Title</span>
                      <input
                        className={styles.input}
                        value={draft.title}
                        onChange={(e) =>
                          setAlbumDrafts((prev) => ({
                            ...prev,
                            [album.id]: {
                              ...(prev[album.id] ?? draft),
                              title: e.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Slug</span>
                      <input
                        className={styles.input}
                        value={draft.slug}
                        onChange={(e) =>
                          setAlbumDrafts((prev) => ({
                            ...prev,
                            [album.id]: {
                              ...(prev[album.id] ?? draft),
                              slug: e.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Description</span>
                      <textarea
                        className={styles.textarea}
                        value={draft.description}
                        onChange={(e) =>
                          setAlbumDrafts((prev) => ({
                            ...prev,
                            [album.id]: {
                              ...(prev[album.id] ?? draft),
                              description: e.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <div className={styles.field}>
                      <AdminImageUpload
                        label="Cover image (optional — one file)"
                        value={draft.coverUrl || null}
                        onChange={(url) =>
                          setAlbumDrafts((prev) => ({
                            ...prev,
                            [album.id]: {
                              ...(prev[album.id] ?? draft),
                              coverUrl: url ?? "",
                            },
                          }))
                        }
                      />
                    </div>
                    <label className={styles.field}>
                      <span>Sort order</span>
                      <input
                        className={styles.input}
                        type="number"
                        value={draft.sortOrder}
                        onChange={(e) =>
                          setAlbumDrafts((prev) => ({
                            ...prev,
                            [album.id]: {
                              ...(prev[album.id] ?? draft),
                              sortOrder: e.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Published</span>
                      <select
                        className={styles.select}
                        value={draft.isPublished ? "yes" : "no"}
                        onChange={(e) =>
                          setAlbumDrafts((prev) => ({
                            ...prev,
                            [album.id]: {
                              ...(prev[album.id] ?? draft),
                              isPublished: e.target.value === "yes",
                            },
                          }))
                        }
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </label>
                  </div>
                  <p className={styles.muted}>
                    {album.imageCount ?? 0} image
                    {(album.imageCount ?? 0) === 1 ? "" : "s"}
                  </p>
                  <div className={styles.rowActions}>
                    <AdminButton
                      type="button"
                      variant="secondary"
                      onClick={() => setSelectedAlbumId(album.id)}
                    >
                      {selected ? "Selected" : "Manage images"}
                    </AdminButton>
                    <AdminButton
                      type="button"
                      onClick={() => void saveAlbum(album.id)}
                      disabled={busyId === album.id}
                    >
                      Save album
                    </AdminButton>
                    <AdminButton
                      type="button"
                      variant="danger"
                      onClick={() => void deleteAlbum(album.id, album.title)}
                      disabled={busyId === album.id}
                    >
                      Delete
                    </AdminButton>
                  </div>
                </article>
              );
            })}

            <article className={styles.sectionCard}>
              <h3 className={styles.panelTitle}>New album</h3>
              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  <span>Title</span>
                  <input
                    className={styles.input}
                    value={newAlbum.title}
                    onChange={(e) =>
                      setNewAlbum((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Season 1"
                  />
                </label>
                <label className={styles.field}>
                  <span>Slug (optional)</span>
                  <input
                    className={styles.input}
                    value={newAlbum.slug}
                    onChange={(e) =>
                      setNewAlbum((prev) => ({
                        ...prev,
                        slug: e.target.value,
                      }))
                    }
                    placeholder="season-1"
                  />
                </label>
                <label className={styles.field}>
                  <span>Description</span>
                  <textarea
                    className={styles.textarea}
                    value={newAlbum.description}
                    onChange={(e) =>
                      setNewAlbum((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </label>
                <div className={styles.field}>
                  <AdminMultiImageUpload
                    label="Album images — select multiple"
                    disabled={busyId === "new-album"}
                    onUploaded={(urls) => {
                      setPendingNewUrls((prev) => [...prev, ...urls]);
                    }}
                  />
                  {pendingNewUrls.length ? (
                    <>
                      <p className={styles.muted}>
                        {pendingNewUrls.length} image
                        {pendingNewUrls.length === 1 ? "" : "s"} ready — will
                        save when you create the album.
                      </p>
                      <ul className={styles.thumbGrid}>
                        {pendingNewUrls.map((url) => (
                          <li key={url} className={styles.thumb}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="" />
                            <button
                              type="button"
                              className={styles.thumbRemove}
                              onClick={() =>
                                setPendingNewUrls((prev) =>
                                  prev.filter((u) => u !== url),
                                )
                              }
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </div>
              </div>
              <div className={styles.rowActions}>
                <AdminButton
                  type="button"
                  onClick={() => void createAlbum()}
                  disabled={busyId === "new-album"}
                >
                  Create album
                </AdminButton>
              </div>
            </article>
          </section>

          <section className={styles.sectionList} aria-label="Album images">
            <h2 className={styles.panelTitle}>
              Images
              {selectedAlbum ? ` — ${selectedAlbum.title}` : ""}
            </h2>
            {!selectedAlbum ? (
              <p className={styles.muted}>Select an album to manage images.</p>
            ) : imagesLoading ? (
              <p className={styles.muted}>Loading images…</p>
            ) : (
              <>
                {images.map((img) => {
                  const draft = imageDrafts[img.id] ?? {
                    caption: img.caption ?? "",
                    alt: img.alt ?? "",
                    sortOrder: String(img.sortOrder),
                    isPublished: img.isPublished,
                  };
                  return (
                    <article key={img.id} className={styles.sectionCard}>
                      <div className={styles.fieldGrid}>
                        <div className={styles.field}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.imageUrl}
                            alt={img.alt || ""}
                            style={{
                              width: "100%",
                              maxWidth: "16rem",
                              borderRadius: "0.5rem",
                              objectFit: "cover",
                              aspectRatio: "4 / 3",
                            }}
                          />
                        </div>
                        <label className={styles.field}>
                          <span>Caption</span>
                          <input
                            className={styles.input}
                            value={draft.caption}
                            onChange={(e) =>
                              setImageDrafts((prev) => ({
                                ...prev,
                                [img.id]: {
                                  ...(prev[img.id] ?? draft),
                                  caption: e.target.value,
                                },
                              }))
                            }
                          />
                        </label>
                        <label className={styles.field}>
                          <span>Alt text</span>
                          <input
                            className={styles.input}
                            value={draft.alt}
                            onChange={(e) =>
                              setImageDrafts((prev) => ({
                                ...prev,
                                [img.id]: {
                                  ...(prev[img.id] ?? draft),
                                  alt: e.target.value,
                                },
                              }))
                            }
                          />
                        </label>
                        <label className={styles.field}>
                          <span>Sort order</span>
                          <input
                            className={styles.input}
                            type="number"
                            value={draft.sortOrder}
                            onChange={(e) =>
                              setImageDrafts((prev) => ({
                                ...prev,
                                [img.id]: {
                                  ...(prev[img.id] ?? draft),
                                  sortOrder: e.target.value,
                                },
                              }))
                            }
                          />
                        </label>
                        <label className={styles.field}>
                          <span>Published</span>
                          <select
                            className={styles.select}
                            value={draft.isPublished ? "yes" : "no"}
                            onChange={(e) =>
                              setImageDrafts((prev) => ({
                                ...prev,
                                [img.id]: {
                                  ...(prev[img.id] ?? draft),
                                  isPublished: e.target.value === "yes",
                                },
                              }))
                            }
                          >
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </label>
                      </div>
                      <div className={styles.rowActions}>
                        <AdminButton
                          type="button"
                          onClick={() => void saveImage(img.id)}
                          disabled={busyId === img.id}
                        >
                          Save
                        </AdminButton>
                        <AdminButton
                          type="button"
                          variant="danger"
                          onClick={() => void deleteImage(img.id)}
                          disabled={busyId === img.id}
                        >
                          Remove
                        </AdminButton>
                      </div>
                    </article>
                  );
                })}

                <article className={styles.sectionCard}>
                  <h3 className={styles.panelTitle}>Add images</h3>
                  <p className={styles.muted}>
                    Select one or many images. They upload and save to this album
                    automatically.
                  </p>
                  <AdminMultiImageUpload
                    label="Choose images"
                    disabled={busyId === "new-image" || multiUploading}
                    onUploaded={addImages}
                  />
                </article>
              </>
            )}
          </section>
        </>
      )}
    </AdminShell>
  );
}
