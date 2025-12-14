"use client";

import { useEffect, useRef, useState } from "react";
import { Customer } from "@/types";

interface CustomerAutocompleteProps {
  customers: Customer[];
  value: string;
  onChange: (customerId: string) => void;
  error?: string;
}

export function CustomerAutocomplete({
  customers,
  value,
  onChange,
  error,
}: CustomerAutocompleteProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // When value changes (from parent), update input text
  useEffect(() => {
    if (value) {
      const customer = customers.find((c) => c.id === parseInt(value));
      if (customer) {
        setInputValue(`${customer.name} (${customer.email})`);
      }
    } else {
      setInputValue("");
    }
  }, [value, customers]);

  // Filter customers based on input
  useEffect(() => {
    if (inputValue.trim() === "") {
      setFilteredCustomers([]);
      setIsOpen(false);
    } else {
      const searchLower = inputValue.toLowerCase();
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchLower) ||
          customer.email.toLowerCase().includes(searchLower)
      );
      setFilteredCustomers(filtered);
      setIsOpen(filtered.length > 0);
      setHighlightedIndex(-1);
    }
  }, [inputValue, customers]);

  // Handle clicks outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSelectCustomer = (customer: Customer) => {
    onChange(customer.id.toString());
    setInputValue(`${customer.name} (${customer.email})`);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredCustomers.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelectCustomer(filteredCustomers[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() =>
          inputValue && filteredCustomers.length > 0 && setIsOpen(true)
        }
        placeholder="Search by name or email..."
        className={`w-full px-3 py-2 border rounded ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />

      {isOpen && filteredCustomers.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
          {filteredCustomers.map((customer, index) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => handleSelectCustomer(customer)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`w-full px-3 py-2 text-left transition ${
                index === highlightedIndex
                  ? "bg-blue-500 text-white"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              <div className="font-medium">{customer.name}</div>
              <div className="text-sm opacity-75">{customer.email}</div>
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
