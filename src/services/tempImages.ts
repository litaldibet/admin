import { supabase } from "../lib/supabaseClient";

const BUCKET = "temp";
const TEMP_PREFIX = "";
const VERSION_SEPARATOR = "__v__";

export type TempStorageImage = {
  name: string;
  storagePath: string;
  publicUrl: string;
};

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }
  }

  return "Erro desconhecido no storage.";
}

function throwStorageError(operation: string, error: unknown): never {
  throw new Error(`${operation}: ${toErrorMessage(error)}`);
}

function splitFileName(fileName: string): { baseName: string; extension: string } {
  const dotIndex = fileName.lastIndexOf(".");

  if (dotIndex <= 0 || dotIndex === fileName.length - 1) {
    return { baseName: fileName, extension: "" };
  }

  return {
    baseName: fileName.slice(0, dotIndex),
    extension: fileName.slice(dotIndex + 1)
  };
}

function normalizeName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .toLowerCase();
}

function getPublicUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function getStorageFileName(path: string): string {
  return path.split("/").pop() ?? "";
}

function createVersionToken(): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${Date.now()}_${random}`;
}

function removeVersionSuffix(baseName: string): string {
  const index = baseName.lastIndexOf(VERSION_SEPARATOR);
  if (index < 0) {
    return baseName;
  }

  return baseName.slice(0, index);
}

function extractVersionToken(baseName: string): string | null {
  const index = baseName.lastIndexOf(VERSION_SEPARATOR);
  if (index < 0) {
    return null;
  }

  const token = baseName.slice(index + VERSION_SEPARATOR.length);
  return token || null;
}

function getDisplayNameFromStoragePath(path: string): string {
  const fileName = getStorageFileName(path);
  const { baseName } = splitFileName(fileName);
  return removeVersionSuffix(baseName);
}

function getVersionTokenFromStoragePath(path: string): string {
  const fileName = getStorageFileName(path);
  const { baseName } = splitFileName(fileName);
  return extractVersionToken(baseName) || "legacy";
}

function withCacheBuster(path: string): string {
  const baseUrl = getPublicUrl(path);
  const version = getVersionTokenFromStoragePath(path);
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}v=${encodeURIComponent(version)}`;
}

function buildStoragePath(fileName: string): string {
  if (!TEMP_PREFIX) {
    return fileName;
  }

  return `${TEMP_PREFIX}/${fileName}`;
}

function buildTempPath(name: string, extension: string, versionToken?: string): string {
  const normalized = normalizeName(name) || `img_${Date.now()}`;
  const safeToken = versionToken || createVersionToken();
  const versionedName = `${normalized}${VERSION_SEPARATOR}${safeToken}`;
  const fileName = extension ? `${versionedName}.${extension}` : versionedName;

  return buildStoragePath(fileName);
}

function getExtensionFromPath(path: string): string {
  const fileName = path.split("/").pop() ?? "";
  return splitFileName(fileName).extension;
}

export async function listTempImages(): Promise<TempStorageImage[]> {
  const { data, error } = await supabase.storage.from(BUCKET).list(TEMP_PREFIX, {
    limit: 100,
    offset: 0
  });

  if (error) {
    throwStorageError("Falha ao listar imagens em temp", error);
  }

  return (data ?? [])
    .filter((item) => item.name && !item.name.endsWith("/"))
    .map((item) => {
      const storagePath = buildStoragePath(item.name);
      return {
        name: getDisplayNameFromStoragePath(storagePath),
        storagePath,
        publicUrl: withCacheBuster(storagePath)
      };
    });
}

export async function uploadTempImage(file: File, desiredName: string): Promise<TempStorageImage> {
  const { extension } = splitFileName(file.name);
  const storagePath = buildTempPath(desiredName || splitFileName(file.name).baseName, extension);

  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, { upsert: false });

  if (error) {
    throwStorageError("Falha ao enviar imagem para temp", error);
  }

  return {
    name: getDisplayNameFromStoragePath(storagePath),
    storagePath,
    publicUrl: withCacheBuster(storagePath)
  };
}

export async function renameTempImage(currentPath: string, nextName: string): Promise<TempStorageImage> {
  const currentFileName = currentPath.split("/").pop() ?? "";
  const { extension } = splitFileName(currentFileName);
  const currentBaseName = splitFileName(currentFileName).baseName;
  const keepToken = extractVersionToken(currentBaseName) || createVersionToken();
  const nextPath = buildTempPath(nextName, extension, keepToken);

  if (currentPath === nextPath) {
    return {
      name: getDisplayNameFromStoragePath(nextPath),
      storagePath: nextPath,
      publicUrl: withCacheBuster(nextPath)
    };
  }

  const { error } = await supabase.storage.from(BUCKET).move(currentPath, nextPath);

  if (error) {
    throwStorageError("Falha ao renomear imagem em temp", error);
  }

  return {
    name: getDisplayNameFromStoragePath(nextPath),
    storagePath: nextPath,
    publicUrl: withCacheBuster(nextPath)
  };
}

export async function deleteTempImage(path: string): Promise<void> {
  if (!path) {
    return;
  }

  const { error } = await supabase.storage.from(BUCKET).remove([path]);

  if (error) {
    throwStorageError("Falha ao remover imagem em temp", error);
  }
}

export async function downloadTempImageAsFile(
  storagePath: string,
  desiredBaseName: string
): Promise<File> {
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);

  if (error) {
    throwStorageError("Falha ao baixar imagem de temp", error);
  }

  const extension = getExtensionFromPath(storagePath);
  const fileName = extension ? `${desiredBaseName}.${extension}` : desiredBaseName;

  return new File([data], fileName, {
    type: data.type || "application/octet-stream"
  });
}
