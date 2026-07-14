import * as React from "react"

import { cn } from "@/lib/utils"

function Dashboard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dashboard"
      className={cn("p-8 space-y-6 rise-in mx-auto w-full max-w-5xl", className)}
      {...props}
    />
  )
}

function DashboardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dashboard-header"
      className={cn(
        "@container/dashboard-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 has-data-[slot=dashboard-action]:grid-cols-[1fr_auto]",
        className
      )}
      {...props}
    />
  )
}

function DashboardTitle({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      data-slot="dashboard-title"
      className={cn("text-3xl font-bold text-sea-ink leading-none", className)}
      {...props}
    />
  )
}

function DashboardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dashboard-description"
      className={cn("text-sea-ink-soft", className)}
      {...props}
    />
  )
}

function DashboardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dashboard-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end flex items-center gap-2",
        className
      )}
      {...props}
    />
  )
}

function DashboardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dashboard-content"
      className={cn(className)}
      {...props}
    />
  )
}

export {
  Dashboard,
  DashboardHeader,
  DashboardTitle,
  DashboardDescription,
  DashboardAction,
  DashboardContent,
}
