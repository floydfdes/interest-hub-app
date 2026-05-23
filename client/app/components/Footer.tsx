import Link from "next/link";

export default function Footer() {
    return (
        <footer className="border-t border-slate-200/80 bg-white/60 px-4 py-8">
            <div className="shell-container flex flex-col items-center justify-between gap-5 text-sm text-slate-500 sm:flex-row">
                <div className="flex items-center gap-3 font-semibold text-slate-700">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
                        IH
                    </span>
                    InterestHub
                </div>
                <div className="flex flex-wrap justify-center gap-5">
                    <Link href="/about" className="transition hover:text-indigo-600">About</Link>
                    <Link href="/contact" className="transition hover:text-indigo-600">Contact</Link>
                    <Link href="/privacy-policy" className="transition hover:text-indigo-600">Privacy</Link>
                    <Link href="/terms-of-service" className="transition hover:text-indigo-600">Terms</Link>
                </div>
                <p>&copy; {new Date().getFullYear()} InterestHub</p>
            </div>
        </footer>
    );
}
