import React from 'react';
import { CategoryBrowser } from '@/components/listings/CategoryBrowser';

/** Cars tab: cars for sale, for rent, and car accessories. */
export default function CarsScreen() {
  return <CategoryBrowser categoryId="car" />;
}
