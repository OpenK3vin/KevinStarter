import { Link, useLocation } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function SiteHeader() {
  const location = useLocation()
  const parts = location.pathname.split("/").filter(Boolean)
  
  let title = "Dashboard"
  if (parts.length > 0) {
    const mainSection = parts[0]
    title = mainSection.charAt(0).toUpperCase() + mainSection.slice(1)
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <Link to="/">Overview</Link>
          </Button>
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <Link to="/projects">Projects</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
