import React from 'react';
import { CategoryBrowser } from '@/components/listings/CategoryBrowser';

/** Houses tab: houses for sale, for rent, and home accessories. */
export default function HousesScreen() {
  return <CategoryBrowser categoryId="house" />;
}
