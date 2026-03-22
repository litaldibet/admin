import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  PostDraftContext,
  type PostDraftContextValue,
  type PostDraftState
} from "./postDraftContext";

export function PostDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<PostDraftState>({
    category: "POST",
    title: "",
    preview: "",
    content_markdown: "",
    banner: null,
    tempImages: []
  });
  const [previewMarkdown, setPreviewMarkdown] = useState("");

  const setCategory = useCallback((category: string) => {
    setDraft((prev) => ({ ...prev, category }));
  }, []);

  const setTitle = useCallback((title: string) => {
    setDraft((prev) => ({ ...prev, title }));
  }, []);

  const setPreview = useCallback((preview: string) => {
    setDraft((prev) => ({ ...prev, preview }));
  }, []);

  const setContentMarkdown = useCallback((content_markdown: string) => {
    setDraft((prev) => ({ ...prev, content_markdown }));
  }, []);

  const setBanner = useCallback((banner: File | null) => {
    setDraft((prev) => ({ ...prev, banner }));
  }, []);

  const setTempImages = useCallback((tempImages: PostDraftState["tempImages"]) => {
    setDraft((prev) => ({ ...prev, tempImages }));
  }, []);

  const value = useMemo<PostDraftContextValue>(() => ({
    draft,
    previewMarkdown,
    setCategory,
    setTitle,
    setPreview,
    setContentMarkdown,
    setBanner,
    setTempImages,
    setPreviewMarkdown
  }), [
    draft,
    previewMarkdown,
    setCategory,
    setTitle,
    setPreview,
    setContentMarkdown,
    setBanner,
    setTempImages,
    setPreviewMarkdown
  ]);

  return (
    <PostDraftContext.Provider value={value}>
      {children}
    </PostDraftContext.Provider>
  );
}
