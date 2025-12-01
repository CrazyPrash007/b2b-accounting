import Sidebar from "./Sidebar";

export default function AppLayout({ children }) {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-[1200px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
