import type { ReactNode } from "react"

import {
  AppContent,
  AppContentActions,
  AppContentDescription,
  AppContentHeader,
  AppContentMain,
  AppContentTitle,
} from "@/components/ui/app-content"

export interface PageLayoutProps {
  /** The title of the page. This is required to ensure every page has a heading. */
  title: ReactNode

  /** An optional description to provide more context below the title. */
  description?: ReactNode

  /** Optional actions (like buttons or links) to place on the right side of the header. */
  actions?: ReactNode

  /** An optional component (like a back link) to render above the header. */
  backLink?: ReactNode

  /** Override the default max-width or add custom classes. */
  className?: string

  /** The main content of the page. */
  children: ReactNode
}

export function PageLayout({
  title,
  description,
  actions,
  backLink,
  className,
  children,
}: PageLayoutProps) {
  return (
    <AppContent className={className}>
      {backLink && <div className="mb-4">{backLink}</div>}

      <AppContentHeader>
        <AppContentTitle>{title}</AppContentTitle>
        {description && <AppContentDescription>{description}</AppContentDescription>}
        {actions && <AppContentActions>{actions}</AppContentActions>}
      </AppContentHeader>

      <AppContentMain>{children}</AppContentMain>
    </AppContent>
  )
}
