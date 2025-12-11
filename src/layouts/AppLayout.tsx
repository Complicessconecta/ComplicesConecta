import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import type { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen md:min-h-dvh flex w-full overflow-x-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col w-full">
          {/* Header with Sidebar Trigger - z-40 para estar encima del contenido */}
          <header className="h-14 flex items-center border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40 flex-shrink-0">
            <SidebarTrigger className="ml-4" />
            <div className="flex-1 flex items-center justify-center">
              <h2 className="text-lg font-semibold text-foreground">ComplicesConecta</h2>
            </div>
          </header>
          
          {/* Main Content - overflow-y-auto para scroll vertical suave */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden -webkit-overflow-scrolling-touch">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
