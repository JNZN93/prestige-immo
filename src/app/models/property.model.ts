export type PropertyLayout = 'hero' | 'wide' | 'tall' | 'standard';
export type PropertyType = 'Kauf' | 'Miete';

export interface Property {
  id: string;
  title: string;
  location: string;
  price: string;
  type: PropertyType;
  beds: number;
  baths: number;
  area: number;
  image: string;
  images: string[];
  featured: boolean;
  layout: PropertyLayout;
  published?: boolean;
  sortOrder?: number;
  assignedTo?: string | null;
  assignedToName?: string | null;
}

export interface PropertyInput {
  title: string;
  location: string;
  price: string;
  type: PropertyType;
  beds: number;
  baths: number;
  area: number;
  images: string[];
  featured: boolean;
  layout: PropertyLayout;
  published: boolean;
  sortOrder: number;
  assignedTo: string | null;
}

export interface PropertyRow {
  id: string;
  title: string;
  location: string;
  price_display: string;
  type: PropertyType;
  beds: number;
  baths: number;
  area: number;
  image_url: string;
  gallery_urls?: string[];
  featured: boolean;
  layout: PropertyLayout;
  published: boolean;
  sort_order: number;
  assigned_to?: string | null;
  assignee?: { full_name: string; email: string } | null;
  created_at?: string;
  updated_at?: string;
}

export function normalizePropertyImages(row: PropertyRow): string[] {
  const gallery = (row.gallery_urls ?? []).filter(Boolean);
  if (gallery.length) {
    return gallery;
  }

  if (row.image_url) {
    return [row.image_url];
  }

  return [];
}

export function mapRowToProperty(row: PropertyRow): Property {
  const images = normalizePropertyImages(row);

  return {
    id: row.id,
    title: row.title,
    location: row.location,
    price: row.price_display,
    type: row.type,
    beds: row.beds,
    baths: row.baths,
    area: row.area,
    image: images[0] ?? '',
    images,
    featured: row.featured,
    layout: row.layout,
    published: row.published,
    sortOrder: row.sort_order,
    assignedTo: row.assigned_to ?? null,
    assignedToName: row.assignee?.full_name || row.assignee?.email || null,
  };
}

export function mapInputToRow(input: PropertyInput): Omit<PropertyRow, 'id' | 'created_at' | 'updated_at'> {
  const images = input.images.filter(Boolean);

  return {
    title: input.title,
    location: input.location,
    price_display: input.price,
    type: input.type,
    beds: input.beds,
    baths: input.baths,
    area: input.area,
    image_url: images[0] ?? '',
    gallery_urls: images,
    featured: input.featured,
    layout: input.layout,
    published: input.published,
    sort_order: input.sortOrder,
    assigned_to: input.assignedTo,
  };
}

export function mapPropertyToInput(property: Property): PropertyInput {
  return {
    title: property.title,
    location: property.location,
    price: property.price,
    type: property.type,
    beds: property.beds,
    baths: property.baths,
    area: property.area,
    images: property.images.length ? [...property.images] : property.image ? [property.image] : [],
    featured: property.featured,
    layout: property.layout,
    published: property.published ?? true,
    sortOrder: property.sortOrder ?? 0,
    assignedTo: property.assignedTo ?? null,
  };
}

export const DEFAULT_PROPERTIES: Property[] = [
  {
    id: 'default-1',
    title: 'Penthouse am Starnberger See',
    location: 'Starnberg, Bayern',
    price: '4.850.000 €',
    type: 'Kauf',
    beds: 5,
    baths: 3,
    area: 320,
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80'],
    featured: true,
    layout: 'hero',
    published: true,
    sortOrder: 1,
  },
  {
    id: 'default-2',
    title: 'Villa mit Garten',
    location: 'Grünwald, München',
    price: '2.950.000 €',
    type: 'Kauf',
    beds: 6,
    baths: 4,
    area: 450,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'],
    featured: false,
    layout: 'tall',
    published: true,
    sortOrder: 2,
  },
  {
    id: 'default-3',
    title: 'Loft in der Speicherstadt',
    location: 'Hamburg, HafenCity',
    price: '1.890.000 €',
    type: 'Kauf',
    beds: 3,
    baths: 2,
    area: 185,
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80'],
    featured: false,
    layout: 'standard',
    published: true,
    sortOrder: 3,
  },
  {
    id: 'default-4',
    title: 'Altbauwohnung mit Balkon',
    location: 'Berlin, Charlottenburg',
    price: '3.200 €',
    type: 'Miete',
    beds: 4,
    baths: 2,
    area: 145,
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80'],
    featured: false,
    layout: 'wide',
    published: true,
    sortOrder: 4,
  },
  {
    id: 'default-5',
    title: 'Modernes Einfamilienhaus',
    location: 'Frankfurt, Westend',
    price: '1.650.000 €',
    type: 'Kauf',
    beds: 4,
    baths: 3,
    area: 210,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80'],
    featured: false,
    layout: 'standard',
    published: true,
    sortOrder: 5,
  },
];

export const EMPTY_PROPERTY_INPUT: PropertyInput = {
  title: '',
  location: '',
  price: '',
  type: 'Kauf',
  beds: 3,
  baths: 2,
  area: 100,
  images: [],
  featured: false,
  layout: 'standard',
  published: true,
  sortOrder: 0,
  assignedTo: null,
};
