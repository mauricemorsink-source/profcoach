import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/40 py-5 mt-auto">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
        <span className="text-xs text-slate-700">© ProfCoach</span>
        <Link
          href="/login"
          className="text-xs text-slate-700 hover:text-slate-500 transition-colors"
        >
          Beheerderslogin
        </Link>
      </div>
    </footer>
  );
}
