import Link from 'next/link';

interface RichTextProps {
    text: string;
    className?: string;
}

const tokenPattern = /(@[a-zA-Z0-9_]{3,30}|#[a-zA-Z0-9_-]+)/g;

export default function RichText({ text, className }: RichTextProps) {
    const parts = text.split(tokenPattern);

    return (
        <span className={className}>
            {parts.map((part, index) => {
                if (/^@[a-zA-Z0-9_]{3,30}$/.test(part)) {
                    const username = part.slice(1);
                    return (
                        <Link key={`${part}-${index}`} href={`/users?query=${encodeURIComponent(username)}`} className="font-semibold text-[#1B325F] hover:text-[#F26C4F]">
                            {part}
                        </Link>
                    );
                }

                if (/^#[a-zA-Z0-9_-]+$/.test(part)) {
                    const tag = part.slice(1).toLowerCase();
                    return (
                        <Link key={`${part}-${index}`} href={`/explore?tag=${encodeURIComponent(tag)}`} className="font-semibold text-[#1B325F] hover:text-[#F26C4F]">
                            {part}
                        </Link>
                    );
                }

                return <span key={`${part}-${index}`}>{part}</span>;
            })}
        </span>
    );
}
