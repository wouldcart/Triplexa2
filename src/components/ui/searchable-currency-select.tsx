import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Currency {
  code: string
  name: string
  symbol: string
}

interface SearchableCurrencySelectProps {
  currencies: Currency[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function SearchableCurrencySelect({
  currencies,
  value,
  onValueChange,
  placeholder = "Select currency...",
  className,
  disabled = false,
}: SearchableCurrencySelectProps) {
  const [open, setOpen] = React.useState(false)

  const selectedCurrency = currencies.find((currency) => currency.code === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedCurrency ? (
            <div className="flex items-center gap-2">
              <span className="font-medium">{selectedCurrency.symbol}</span>
              <span>{selectedCurrency.name}</span>
              <span className="text-muted-foreground">({selectedCurrency.code})</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search currencies..." />
          <CommandList>
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup>
              {currencies.map((currency) => (
                <CommandItem
                  key={currency.code}
                  value={`${currency.code} ${currency.name}`}
                  onSelect={() => {
                    onValueChange?.(currency.code)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === currency.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{currency.symbol}</span>
                    <span>{currency.name}</span>
                    <span className="text-muted-foreground">({currency.code})</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}