"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchableSelectProps {
  options: Array<{ value: string; label: string }>;
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder = "Search...",
  className,
  disabled = false,
}: SearchableSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const filtered = (options || []).filter(
      (option) =>
        option &&
        option.label &&
        option.value &&
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
        option.value.trim() !== ""
    );
    setFilteredOptions(filtered);
  }, [searchTerm, options]);

  const handleSelect = useCallback(
    (selectedValue: string) => {
      onValueChange(selectedValue);
      setIsOpen(false);
      setSearchTerm("");
    },
    [onValueChange]
  );

  const selectedOption = (options || []).find(
    (option) => option && option.value === value
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      // Use a small delay to prevent immediate closing on mobile
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Longer delay for mobile to ensure dropdown is fully rendered
      const id = setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true });
      }, 150);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  const toggleOpen = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }, [disabled]);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={toggleOpen}
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs",
          "ring-offset-background placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-1 focus:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "touch-manipulation"
        )}
      >
        <span
          className={cn("truncate", !selectedOption && "text-muted-foreground")}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 opacity-50 transition-transform duration-200 flex-shrink-0 ml-2",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg",
            "animate-in fade-in-0 zoom-in-95",
            "max-h-[min(60vh,350px)] overflow-hidden",
            // Position at bottom by default, but check viewport
            "left-0"
          )}
          style={{
            maxWidth: "calc(100vw - 2rem)",
          }}
        >
          {/* Search input section */}
          <div className="sticky top-0 z-10 bg-popover p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={inputRef}
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-sm"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm("");
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-100"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-[min(45vh,280px)] overflow-y-auto overscroll-contain p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(option.value);
                  }}
                  className={cn(
                    "relative flex w-full cursor-pointer items-center rounded-sm py-2.5 px-3 text-sm outline-none",
                    "touch-manipulation select-none",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground",
                    "active:bg-accent/80",
                    option.value === value && "bg-accent/50"
                  )}
                >
                  <span className="flex-1 truncate text-left">
                    {option.label}
                  </span>
                  {option.value === value && (
                    <Check className="h-4 w-4 flex-shrink-0 ml-2 text-emerald-600" />
                  )}
                </button>
              ))
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
