export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  heroImage?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  collection: string;
  price: number;
  description: string;
  longDescription: string;
  materials: string;
  dimensions?: string;
  images: string[];
  featured?: boolean;
  new?: boolean;
  // Regra inegociável #2 (CLAUDE.md): frete nunca se aplica a produto
  // digital. Usado pelo Checkout para decidir se cobra frete.
  product_type: "physical" | "digital";
}
