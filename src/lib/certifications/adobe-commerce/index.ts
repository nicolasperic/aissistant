import type { ProviderDefinition } from "../types";
import { ad0e712 } from "./ad0-e712";
import { ad0e724 } from "./ad0-e724";
import { ad0e726 } from "./ad0-e726";
import { ad0e708 } from "./ad0-e708";
import { ad0e725 } from "./ad0-e725";
import { ad0e727 } from "./ad0-e727";
import { ad0e722 } from "./ad0-e722";

const adobeCommerce: ProviderDefinition = {
  id: "adobe-commerce",
  name: "Adobe Commerce",
  website: "https://business.adobe.com/products/magento/magento-commerce.html",
  certifications: [
    // Professionals
    ad0e712,
    ad0e724,
    ad0e726,
    // Experts
    ad0e708,
    ad0e725,
    ad0e727,
    // Master
    ad0e722,
  ],
};

export default adobeCommerce;
