'use client';

import { useEffect, useState } from 'react';
import { isDataUrl, isOpfsPath, readOpfsObjectUrl } from '@/util/opfs';

type OpfsImageProps = {
    path: string;
    alt: string;
    className?: string;
};

export default function OpfsImage({ path, alt, className }: OpfsImageProps) {
    const [src, setSrc] = useState<string | null>(isDataUrl(path) ? path : null);

    useEffect(() => {
        let active = true;
        let objectUrl: string | null = null;
        if (isDataUrl(path)) {
            setSrc(path);
            return;
        }
        if (!isOpfsPath(path)) {
            setSrc(path);
            return;
        }
        readOpfsObjectUrl(path).then((url) => {
            if (!active) return;
            objectUrl = url ?? null;
            setSrc(objectUrl);
        });
        return () => {
            active = false;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [path]);

    if (!src) return null;

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className={className} />
    );
}
