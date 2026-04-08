import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

const DashboardPage = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-rows-[auto_1fr] lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="lg:col-span-2">
          <TopBar />
        </div>

        <Sidebar />

        <section className="min-h-0 p-6">
          <h2 className="text-2xl font-semibold tracking-tight">Main</h2>
        </section>
      </div>
    </main>
  );
};

export default DashboardPage;
