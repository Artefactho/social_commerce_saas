import { useState, useMemo } from "react";
import { ThemeProduct } from "@/types/theme";

export interface ProductFilterOptions {
  category?: string;
  searchTerm?: string;
  sortBy?: "featured" | "price_asc" | "price_desc" | "name_asc";
  productType?: "all" | "physical" | "digital";
}

export function useProductListing(initialProducts: ThemeProduct[]) {
  const [category, setCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<ProductFilterOptions["sortBy"]>("featured");
  const [productType, setProductType] = useState<"all" | "physical" | "digital">("all");

  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    if (category && category !== "all") {
      result = result.filter(
        (p) => p.collection.toLowerCase() === category.toLowerCase()
      );
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
      );
    }

    if (productType !== "all") {
      result = result.filter((p) => p.product_type === productType);
    }

    if (sortBy === "price_asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name_asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [initialProducts, category, searchTerm, sortBy, productType]);

  const clearFilters = () => {
    setCategory("all");
    setSearchTerm("");
    setSortBy("featured");
    setProductType("all");
  };

  return {
    products: filteredProducts,
    totalCount: filteredProducts.length,
    category,
    setCategory,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    productType,
    setProductType,
    clearFilters,
  };
}
