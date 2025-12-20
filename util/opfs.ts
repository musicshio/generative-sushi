const OPFS_PREFIX = 'opfs:';

export function isOpfsPath(value?: string) {
    return typeof value === 'string' && value.startsWith(OPFS_PREFIX);
}

export function isDataUrl(value?: string) {
    return typeof value === 'string' && value.startsWith('data:');
}

function getPathParts(path: string) {
    return path.replace(OPFS_PREFIX, '').split('/').filter(Boolean);
}

function getExtensionFromDataUrl(dataUrl: string) {
    const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);/);
    if (!match) return 'png';
    const ext = match[1].toLowerCase();
    if (ext === 'jpeg') return 'jpg';
    return ext;
}

async function getRootHandle() {
    if (typeof navigator === 'undefined' || !navigator.storage?.getDirectory) return null;
    return navigator.storage.getDirectory();
}

async function getFileHandle(path: string, create: boolean) {
    const root = await getRootHandle();
    if (!root) return null;
    const parts = getPathParts(path);
    if (parts.length === 0) return null;
    const filename = parts.pop();
    if (!filename) return null;
    let current = root;
    for (const part of parts) {
        current = await current.getDirectoryHandle(part, { create });
    }
    return current.getFileHandle(filename, { create });
}

export async function saveImageDataUrl(path: string, dataUrl: string) {
    const handle = await getFileHandle(path, true);
    if (!handle) return null;
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return path;
}

export async function readOpfsObjectUrl(path: string) {
    if (!isOpfsPath(path)) return path;
    const handle = await getFileHandle(path, false);
    if (!handle) return null;
    const file = await handle.getFile();
    return URL.createObjectURL(file);
}

export function buildOpfsImagePath(chatId: string, key: string, dataUrl: string) {
    const ext = getExtensionFromDataUrl(dataUrl);
    return `${OPFS_PREFIX}sushi/${chatId}/${key}.${ext}`;
}
