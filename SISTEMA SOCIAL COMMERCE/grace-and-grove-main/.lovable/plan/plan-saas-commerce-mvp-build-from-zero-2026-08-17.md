# Plan: SAAS COMMERCE - MVP Build from Zero

Build a premium, high-converting SaaS platform for social media sellers to create and manage their own online stores.

## Phase 1: Foundation & Identity
- Establish a modern, clean visual identity (Glassmorphism, strong typography, premium dark/light mode).
- Create a high-converting Landing Page with a premium hero section, "How it Works", and social proof mockups.

## Phase 2: Onboarding & Multi-Tenant Core
- Implement a streamlined User Auth (Login/Signup).
- Build a multi-step Wizard (Onboarding) to capture store name, category, and initial template selection.
- Set up a multi-tenant data structure (Stores isolated by `store_id`).

## Phase 3: Dashboard & Product Management
- Develop a comprehensive Seller Dashboard with KPIs (Sales, Orders, Customers).
- Implement a Product Management system (Create/Edit/Delete products with images, variants, and pricing).
- Create a basic Orders and Customers management view.

## Phase 4: Store Builder & Public Experience
- Build a real-time Visual Store Builder where users can customize logos, colors, and banners.
- Create a public-facing Storefront for each tenant, optimized for mobile shopping.
- Implement a Cart and Checkout flow (simulated payment with PIX/Credit Card options).

## Technical Details
- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion for premium animations.
- **Backend**: Lovable Cloud (Supabase) with RLS for strict tenant isolation.
- **State Management**: TanStack Query for data fetching, custom hooks for cart and builder state.
- **Responsive**: Mobile-first design focusing on Instagram/TikTok browser experiences.
