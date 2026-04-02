import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  PostDraftContext,
  type EditSession,
  type PostDraftContextValue,
  type PostDraftState
} from "./postDraftContext";

export function PostDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<PostDraftState>({
    category: "BLOG",
    title: "",
    preview: "",
    content_markdown: "",
    active: true,
    banner: null,
    tempImages: []
  });
  const [previewMarkdown, setPreviewMarkdown] = useState("");
  const [editSession, setEditSession] = useState<EditSession | null>(null);
  const [tempReloadToken, setTempReloadToken] = useState(0);

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

  const setActive = useCallback((active: boolean) => {
    setDraft((prev) => ({ ...prev, active }));
  }, []);

  const setBanner = useCallback((banner: File | null) => {
    setDraft((prev) => ({ ...prev, banner }));
  }, []);

  const setTempImages = useCallback((tempImages: PostDraftState["tempImages"]) => {
    setDraft((prev) => ({ ...prev, tempImages }));
  }, []);

  const setDraftValues = useCallback((values: Partial<PostDraftState>) => {
    setDraft((prev) => ({ ...prev, ...values }));
  }, []);

  const startEditSession = useCallback((postId: string, postTitle: string) => {
    setEditSession({ postId, postTitle });
  }, []);

  const clearEditSession = useCallback(() => {
    setEditSession(null);
  }, []);

  const requestTempReload = useCallback(() => {
    setTempReloadToken((prev) => prev + 1);
  }, []);

  const value = useMemo<PostDraftContextValue>(() => ({
    draft,
    previewMarkdown,
    editSession,
    tempReloadToken,
    setCategory,
    setTitle,
    setPreview,
    setContentMarkdown,
    setActive,
    setBanner,
    setTempImages,
    setPreviewMarkdown,
    setDraftValues,
    startEditSession,
    clearEditSession,
    requestTempReload
  }), [
    draft,
    previewMarkdown,
    editSession,
    tempReloadToken,
    setCategory,
    setTitle,
    setPreview,
    setContentMarkdown,
    setActive,
    setBanner,
    setTempImages,
    setPreviewMarkdown,
    setDraftValues,
    startEditSession,
    clearEditSession,
    requestTempReload
  ]);

  return (
    <PostDraftContext.Provider value={value}>
      {children}
    </PostDraftContext.Provider>
  );
}
