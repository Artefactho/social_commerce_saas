export type ThemeId =
  | 'base-theme'
  | 'aura-maison'
  | 'aurea-joalheria'
  | 'jo-perfumes'
  | 'minimal-clean';

export type SectionType =
  | 'hero_slider'
  | 'benefits_bar'
  | 'categories_carousel'
  | 'featured_products'
  | 'promotions_grid'
  | 'stories_feed'
  | 'video_feature'
  | 'social_feed'
  | 'whatsapp_cta'
  | 'newsletter'
  | 'welcome_message';

export interface StoreSection {
  id: string;
  store_id: string;
  section_type: SectionType;
  enabled: boolean;
  position: number;
  settings: Record<string, any>;
}

export interface StoreInfo {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  banner_url: string | null;
  shipping_fee?: number;
  custom_domain?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
}

export interface ThemeCategory {
  id: string;
  name: string;
  slug: string;
  image?: string;
  count?: number;
}

export interface ThemeProduct {
  id: string;
  name: string;
  slug: string;
  collection: string;
  price: number;
  originalPrice?: number;
  description: string;
  longDescription?: string;
  materials?: string;
  images: string[];
  product_type: 'physical' | 'digital';
  inStock?: boolean;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent?: string;
  accentPromotion?: string; // V1 compatibilidade
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  button: string;
  buttonText: string;
  [key: string]: string | undefined;
}

export interface ThemeTypography {
  fontFamily: string;
  headingFontFamily: string;
  headingWeight: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
}

export type BorderRadiusSize = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
export type ShadowSize = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ThemeLayoutTokens {
  borderRadius: BorderRadiusSize;
  cardRadius: BorderRadiusSize;
  cardShadow: ShadowSize;
}

export interface ThemeSocialConfig {
  instagram?: string;
  whatsapp?: string;
  whatsappMessage?: string;
  tiktok?: string;
  facebook?: string;
  youtube?: string;
}

export interface ThemeIdentityConfig {
  logo_url?: string | null;
  name?: string;
  banner_url?: string | null;
}

export interface ThemeCustomConfig {
  themeId: ThemeId;
  colors: ThemeColors;
  typography: ThemeTypography;
  layout: ThemeLayoutTokens;
  social?: ThemeSocialConfig;
  identity?: ThemeIdentityConfig;
}

export interface StorefrontThemeProps {
  store: StoreInfo;
  categories: ThemeCategory[];
  products: ThemeProduct[];
  colors?: ThemeColors | Record<string, string>;
  customConfig?: ThemeCustomConfig;
  sections?: StoreSection[];
}

export interface ThemeMetadata {
  id: ThemeId;
  name: string;
  layout_key: string;
  description: string;
  tag: string;
  thumbnail_url: string;
  preview_url: string;
  features: string[];
}

