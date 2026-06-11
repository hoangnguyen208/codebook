"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { DashboardItem } from "@/types/items";
import type { DashboardRecentCollection } from "@/lib/db/collections";

type SearchData = {
  items: DashboardItem[];
  collections: DashboardRecentCollection[];
};

const SearchContext = createContext<SearchData>({ items: [], collections: [] });

export function SearchProvider({
  children,
  items,
  collections,
}: {
  children: ReactNode;
  items: DashboardItem[];
  collections: DashboardRecentCollection[];
}) {
  return (
    <SearchContext.Provider value={{ items, collections }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchData() {
  return useContext(SearchContext);
}
