import * as React from "react"
import { cn } from "@/lib/utils"

const Tabs = ({ defaultValue, value, onValueChange, children, className }) => {
  const [tabValue, setTabValue] = React.useState(value || defaultValue)
  
  const handleValueChange = (newValue) => {
    setTabValue(newValue)
    onValueChange?.(newValue)
  }

  return (
    <div className={cn("w-full", className)}>
      {React.Children.map(children, child => {
        if (child.type === TabsList) {
          return React.cloneElement(child, { 
            value: value || tabValue, 
            onValueChange: handleValueChange 
          })
        }
        if (child.type === TabsContent) {
          return (value || tabValue) === child.props.value ? child : null
        }
        return child
      })}
    </div>
  )
}

const TabsList = React.forwardRef(({ className, children, value, onValueChange, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-zinc-800/50 p-1 text-zinc-400",
      className
    )}
    {...props}
  >
    {React.Children.map(children, child => 
      React.cloneElement(child, { 
        isActive: child.props.value === value,
        onClick: () => onValueChange?.(child.props.value)
      })
    )}
  </div>
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef(({ className, isActive, onClick, children, ...props }, ref) => (
  <button
    ref={ref}
    onClick={onClick}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      isActive 
        ? "bg-zinc-700 text-zinc-100 shadow" 
        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
      className
    )}
    {...props}
  >
    {children}
  </button>
))
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}
    {...props}
  >
    {children}
  </div>
))
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
