import * as React from "react"

import { cn } from "@/lib/utils"

function AppContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-content"
      className={cn("rise-in mx-auto w-full max-w-5xl space-y-6 p-8", className)}
      {...props}
    />
  )
}

function AppContentHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-content-header"
      className={cn(
        "@container/app-content-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 has-data-[slot=app-content-action]:grid-cols-[1fr_auto]",
        className,
      )}
      {...props}
    />
  )
}

function AppContentTitle({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      data-slot="app-content-title"
      className={cn("text-sea-ink text-3xl leading-none font-bold", className)}
      {...props}
    />
  )
}

function AppContentDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-content-description"
      className={cn("text-sea-ink-soft", className)}
      {...props}
    />
  )
}

function AppContentActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-content-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 flex items-center gap-2 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  )
}

function AppContentMain({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="app-content-main" className={cn(className)} {...props} />
}

export {
  AppContent,
  AppContentHeader,
  AppContentTitle,
  AppContentDescription,
  AppContentActions,
  AppContentMain,
}
