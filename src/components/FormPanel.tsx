import { useEffect, useRef, useState } from "react";
import { usePostDraft } from "../app/postDraftContext";
import InputLabel from "./InputLabel";
import ImageListItem from "./ImageListItem";
import {
  deleteTempImage,
  listTempImages,
  renameTempImage,
  uploadTempImage
} from "../services/tempImages";
import "../assets/css/FormPanel.css";

type LocalImageItem = {
  id: number;
  name: string;
  pendingName: string;
  storagePath: string | null;
  publicUrl: string | null;
  isBusy: boolean;
  error: string | null;
};

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }
  }

  return fallback;
}

export default function FormPanel() {
  const {
    draft,
    tempReloadToken,
    setCategory,
    setTitle,
    setPreview,
    setActive,
    setBanner,
    setTempImages
  } = usePostDraft();
  const [imageItems, setImageItems] = useState<LocalImageItem[]>([]);
  const [isLoadingTemp, setIsLoadingTemp] = useState(false);
  const [nextImageId, setNextImageId] = useState(1);
  const nextIdRef = useRef(1);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;

    async function loadFromTemp() {
      setIsLoadingTemp(true);
      try {
        const tempItems = await listTempImages();
        if (!active) return;

        const mapped = tempItems.map((item, index) => ({
          id: index + 1,
          name: item.name,
          pendingName: item.name,
          storagePath: item.storagePath,
          publicUrl: item.publicUrl,
          isBusy: false,
          error: null
        }));

        setImageItems(mapped);
        setTempImages(mapped);
        nextIdRef.current = mapped.length + 1;
        setNextImageId(nextIdRef.current);
      } catch {
        if (!active) return;
        setImageItems([]);
      } finally {
        if (active) {
          setIsLoadingTemp(false);
        }
      }
    }

    void loadFromTemp();

    return () => {
      active = false;
    };
  }, [setTempImages, tempReloadToken]);

  useEffect(() => {
    setTempImages(imageItems);
  }, [imageItems, setTempImages]);

  useEffect(() => {
    if (!draft.banner && bannerInputRef.current) {
      bannerInputRef.current.value = "";
    }
  }, [draft.banner]);

  function handleAddImageItem() {
    const newId = nextImageId;

    setImageItems((prev) => [
      ...prev,
      {
        id: newId,
        name: "",
        pendingName: "",
        storagePath: null,
        publicUrl: null,
        isBusy: false,
        error: null
      }
    ]);

    nextIdRef.current += 1;
    setNextImageId(nextIdRef.current);
  }

  async function handleRemoveImageItem(id: number) {
    const item = imageItems.find((entry) => entry.id === id);

    if (!item) {
      return;
    }

    if (item.storagePath) {
      setImageItems((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                isBusy: true,
                error: null
              }
            : entry
        )
      );

      try {
        await deleteTempImage(item.storagePath);
      } catch (error: unknown) {
        setImageItems((prev) =>
          prev.map((entry) =>
            entry.id === id
              ? {
                  ...entry,
                  isBusy: false,
                  error: toErrorMessage(error, "Falha ao remover imagem em temp.")
                }
              : entry
          )
        );
        return;
      }
    }

    setImageItems((prev) => prev.filter((entry) => entry.id !== id));
  }

  async function handlePickImageFile(id: number, file: File | null) {
    if (!file) {
      return;
    }

    setImageItems((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              isBusy: true,
              error: null
            }
          : entry
      )
    );

    try {
      const target = imageItems.find((entry) => entry.id === id);
      const desiredName = target?.pendingName || file.name.replace(/\.[^.]+$/, "");

      if (target?.storagePath) {
        await deleteTempImage(target.storagePath);
      }

      const uploaded = await uploadTempImage(file, desiredName);

      setImageItems((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                name: uploaded.name,
                pendingName: uploaded.name,
                storagePath: uploaded.storagePath,
                publicUrl: uploaded.publicUrl,
                isBusy: false,
                error: null
              }
            : entry
        )
      );
    } catch (error: unknown) {
      setImageItems((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                isBusy: false,
                error: toErrorMessage(error, "Falha ao enviar imagem para temp.")
              }
            : entry
        )
      );
    }
  }

  function handleTempImageNameChange(id: number, value: string) {
    setImageItems((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, pendingName: value } : entry))
    );
  }

  async function handleConfirmTempImageName(id: number) {
    const item = imageItems.find((entry) => entry.id === id);

    if (!item || !item.storagePath || !item.pendingName.trim() || item.pendingName === item.name) {
      return;
    }

    setImageItems((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              isBusy: true,
              error: null
            }
          : entry
      )
    );

    try {
      const renamed = await renameTempImage(item.storagePath, item.pendingName);

      setImageItems((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                name: renamed.name,
                pendingName: renamed.name,
                storagePath: renamed.storagePath,
                publicUrl: renamed.publicUrl,
                isBusy: false,
                error: null
              }
            : entry
        )
      );
    } catch (error: unknown) {
      setImageItems((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                isBusy: false,
                error: toErrorMessage(error, "Falha ao renomear imagem em temp.")
              }
            : entry
        )
      );
    }
  }

  return (
    <div className="form-panel">
      <section className="form-panel-top">
        <section className="form-panel-image-list">
          {isLoadingTemp ? <div className="form-panel-image-loading">...carregando</div> : null}

          {!isLoadingTemp
            ? imageItems.map((item) => (
                <ImageListItem
                  key={item.id}
                  id={item.id}
                  isBusy={item.isBusy}
                  hasSelectedFile={Boolean(item.storagePath)}
                  displayName={item.pendingName}
                  canConfirmName={
                    Boolean(item.storagePath) &&
                    item.pendingName.trim().length > 0 &&
                    item.pendingName !== item.name
                  }
                  errorText={item.error}
                  onPickFile={handlePickImageFile}
                  onChangeName={handleTempImageNameChange}
                  onConfirmName={handleConfirmTempImageName}
                  onRemove={handleRemoveImageItem}
                />
              ))
            : null}
        </section>
        <button className="form-panel-button add_images" onClick={handleAddImageItem}>Adicionar imagens</button>
      </section>

      <section className="form-panel-bottom">
        <InputLabel value="Tipo" />
        <select
          name="type"
          id="type"
          multiple={false}
          className="form-panel-select"
          value={draft.category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="BLOG">Blog</option>
          <option value="PROMOCAO">Promocao</option>
        </select>

        <InputLabel value="Titulo" />
        <input
          type="text"
          className="form-panel-input-text"
          value={draft.title}
          onChange={(event) => setTitle(event.target.value)}
        ></input>

        <InputLabel value="Imagem do card" />
        <input
          ref={bannerInputRef}
          type="file"
          className="form-panel-input-file"
          accept="image/*"
          onChange={(event) => setBanner(event.target.files?.[0] ?? null)}
        ></input>

        <InputLabel value="Previa" />
        <textarea
          className="form-panel-preview"
          value={draft.preview}
          onChange={(event) => setPreview(event.target.value)}
        ></textarea>

        <label className="form-panel-active-row" htmlFor="post-active-toggle">
          <InputLabel value="Ativo" />
          <input
            id="post-active-toggle"
            type="checkbox"
            className="form-panel-active-checkbox"
            checked={draft.active}
            onChange={(event) => setActive(event.target.checked)}
          />
        </label>
      </section>
    </div>
  );
}
