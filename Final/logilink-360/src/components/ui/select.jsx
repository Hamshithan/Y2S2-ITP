import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const Select = ({ children, value, onValueChange, ...props }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const selectRef = React.useRef(null)

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={selectRef} className="relative" {...props}>
      {React.Children.map(children, child => {
        if (child.type === SelectTrigger) {
          return React.cloneElement(child, {
            onClick: () => setIsOpen(!isOpen),
            isOpen
          })
        }
        if (child.type === SelectContent) {
          return isOpen ? React.cloneElement(child, {
            onSelect: (val) => {
              onValueChange?.(val)
              setIsOpen(false)
            },
            value
          }) : null
        }
        return child
      })}
    </div>
  )
}

const SelectTrigger = React.forwardRef(({ className, children, onClick, isOpen, ...props }, ref) => (
  <button
    ref={ref}
    onClick={onClick}
    className={cn(
      "flex h-9 w-full items-center justify-between rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 text-zinc-100",
      className
    )}
    {...props}
  >
    {children}
    <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", isOpen && "rotate-180")} />
  </button>
))
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = ({ placeholder, children }) => (
  <span className="text-zinc-300">{children || placeholder}</span>
)

const SelectContent = ({ children, onSelect, value, className }) => (
  <div className={cn("absolute z-50 mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 shadow-lg", className)}>
    <div className="p-1">
      {React.Children.map(children, child => 
        React.cloneElement(child, { onSelect, selected: child.props.value === value })
      )}
    </div>
  </div>
)

const SelectItem = React.forwardRef(({ className, children, value, onSelect, selected, ...props }, ref) => (
  <div
    ref={ref}
    onClick={() => onSelect?.(value)}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-md py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-zinc-800 focus:bg-zinc-800",
      selected && "bg-zinc-800",
      className
    )}
    {...props}
  >
    <span className="text-zinc-100">{children}</span>
  </div>
))
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
