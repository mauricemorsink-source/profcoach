import { getContent } from "@/lib/content";
import TussenstandTabs from "@/components/tussenstand/TussenstandTabs";

export default async function TussenstandLayout({ children }: { children: React.ReactNode }) {
  const title = await getContent("tussenstand.title");

  return (
    <div
      className="min-h-[calc(100vh-56px)] p-4 sm:p-8"
      style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(14,40,80,0.6) 0%, #060b14 60%)" }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">{title}</h1>
        </div>
        <TussenstandTabs />
        {children}
      </div>
    </div>
  );
}
