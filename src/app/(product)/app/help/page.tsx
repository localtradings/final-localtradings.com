import type { Metadata } from "next";

import { ProductHelpPage } from "@/features/help/product-help-page";

export const metadata: Metadata = {
  title: "Help Center",
};

export default function ProductHelpRoute() {
  return <ProductHelpPage />;
}
