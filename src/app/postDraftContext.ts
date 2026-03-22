import { createContext, useContext } from "react";

export type TempImageItem = {
  id: number;
  name: string;
  pendingName: string;
  storagePath: string | null;
  publicUrl: string | null;
  isBusy: boolean;
  error: string | null;
};

export type PostDraftState = {
  category: string;
  title: string;
  preview: string;
  content_markdown: string;
  banner: File | null;
  tempImages: TempImageItem[];
};

export type PostDraftContextValue = {
  draft: PostDraftState;
  previewMarkdown: string;
  setCategory: (category: string) => void;
  setTitle: (title: string) => void;
  setPreview: (preview: string) => void;
  setContentMarkdown: (content: string) => void;
  setBanner: (banner: File | null) => void;
  setTempImages: (items: TempImageItem[]) => void;
  setPreviewMarkdown: (markdown: string) => void;
};

export const PostDraftContext = createContext<PostDraftContextValue | null>(null);

export function usePostDraft() {
  const context = useContext(PostDraftContext);

  if (!context) {
    throw new Error("usePostDraft must be used within PostDraftProvider");
  }

  return context;
}
