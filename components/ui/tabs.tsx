import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/components/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "fluidic-inline-flex fluidic-h-10 fluidic-items-center fluidic-justify-center fluidic-rounded-md fluidic-bg-zinc-100 fluidic-p-1 fluidic-text-zinc-500 dark:fluidic-bg-zinc-800 dark:fluidic-text-zinc-400",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "fluidic-inline-flex fluidic-items-center fluidic-justify-center fluidic-whitespace-nowrap fluidic-rounded-sm fluidic-px-3 fluidic-py-1.5 fluidic-text-sm fluidic-font-medium fluidic-ring-offset-white fluidic-transition-all focus-visible:fluidic-outline-none focus-visible:fluidic-ring-2 focus-visible:fluidic-ring-zinc-950 focus-visible:fluidic-ring-offset-2 disabled:fluidic-pointer-events-none disabled:fluidic-opacity-50 data-[state=active]:fluidic-bg-white data-[state=active]:fluidic-text-zinc-950 data-[state=active]:fluidic-shadow-sm dark:fluidic-ring-offset-zinc-950 dark:focus-visible:fluidic-ring-zinc-300 dark:data-[state=active]:fluidic-bg-zinc-950 dark:data-[state=active]:fluidic-text-zinc-50",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "fluidic-mt-2 fluidic-ring-offset-white focus-visible:fluidic-outline-none focus-visible:fluidic-ring-2 focus-visible:fluidic-ring-zinc-950 focus-visible:fluidic-ring-offset-2 dark:fluidic-ring-offset-zinc-950 dark:focus-visible:fluidic-ring-zinc-300",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
