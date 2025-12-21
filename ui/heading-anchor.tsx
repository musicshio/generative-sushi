'use client';

import Link from 'next/link';

type HeadingAnchorProps = {
    id: string;
    label: string;
};

export default function HeadingAnchor({ id, label }: HeadingAnchorProps) {
    return (
        <Link
            href={`#${id}`}
            className="btn btn-outline btn-xs btn-xs p-0 w-6 h-6 border-accent-content/10"
            aria-label={`${label}へのリンク`}
        >
            <svg className="size-3" fill="currentColor" width="12" height="12" viewBox="0 0 256 256" id="Flat"
                 xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M216,148H172V108h44a12,12,0,0,0,0-24H172V40a12,12,0,0,0-24,0V84H108V40a12,12,0,0,0-24,0V84H40a12,12,0,0,0,0,24H84v40H40a12,12,0,0,0,0,24H84v44a12,12,0,0,0,24,0V172h40v44a12,12,0,0,0,24,0V172h44a12,12,0,0,0,0-24Zm-108,0V108h40v40Z"></path>
            </svg>
        </Link>
    );
}
