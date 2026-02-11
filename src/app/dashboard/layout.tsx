import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';
import { MobileBottomNav } from '@/components/dashboard/mobile-bottom-nav';
import { MobileHeader } from '@/components/dashboard/mobile-header';
import { AmbientBackground } from '@/components/ui/ambient-background';

// Force dynamic rendering for all dashboard pages to prevent SSR issues with Supabase
export const dynamic = 'force-dynamic';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen">
            {/* Ambient Background - The "Liquid" effect behind Ghost Cards */}
            <AmbientBackground />
            {/* Desktop Sidebar - hidden on mobile */}
            <div className="hidden lg:block">
                <Sidebar />
            </div>

            {/* Mobile Bottom Nav - hidden on desktop */}
            <div className="lg:hidden">
                <MobileBottomNav />
            </div>

            {/* Main Content Area */}
            <div className="lg:ml-64">
                {/* Desktop Topbar - hidden on mobile */}
                <div className="hidden lg:block">
                    <Topbar />
                </div>

                {/* Mobile Header - hidden on desktop */}
                <div className="lg:hidden">
                    <MobileHeader />
                </div>

                {/* Page Content - with bottom padding on mobile for nav */}
                <main className="p-4 lg:p-6 pb-24 lg:pb-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
