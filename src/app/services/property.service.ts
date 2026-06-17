import { Injectable } from '@angular/core';
import {
  DEFAULT_PROPERTIES,
  mapInputToRow,
  mapRowToProperty,
  Property,
  PropertyInput,
  PropertyRow,
} from '../models/property.model';
import { SupabaseService } from './supabase.service';

const TABLE = 'properties';
const BUCKET = 'property-images';
const SELECT_WITH_ASSIGNEE = `
  *,
  assignee:profiles!assigned_to (
    full_name,
    email
  )
`;

@Injectable({ providedIn: 'root' })
export class PropertyService {
  constructor(private readonly supabase: SupabaseService) {}

  async getPublished(): Promise<Property[]> {
    if (!this.supabase.isConfigured) {
      return DEFAULT_PROPERTIES;
    }

    const { data, error } = await this.supabase
      .getClient()
      .from(TABLE)
      .select(SELECT_WITH_ASSIGNEE)
      .eq('published', true)
      .order('sort_order', { ascending: true });

    if (error || !data?.length) {
      return DEFAULT_PROPERTIES;
    }

    return (data as PropertyRow[]).map(mapRowToProperty);
  }

  async getAll(): Promise<Property[]> {
    if (!this.supabase.isConfigured) {
      return DEFAULT_PROPERTIES;
    }

    const { data, error } = await this.supabase
      .getClient()
      .from(TABLE)
      .select(SELECT_WITH_ASSIGNEE)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data as PropertyRow[]).map(mapRowToProperty);
  }

  async getById(id: string): Promise<Property | null> {
    if (!this.supabase.isConfigured) {
      return DEFAULT_PROPERTIES.find((property) => property.id === id) ?? null;
    }

    const { data, error } = await this.supabase
      .getClient()
      .from(TABLE)
      .select(SELECT_WITH_ASSIGNEE)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapRowToProperty(data as PropertyRow) : null;
  }

  async create(input: PropertyInput): Promise<Property> {
    const { data, error } = await this.supabase
      .getClient()
      .from(TABLE)
      .insert(mapInputToRow(input))
      .select(SELECT_WITH_ASSIGNEE)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapRowToProperty(data as PropertyRow);
  }

  async update(id: string, input: PropertyInput): Promise<Property> {
    const { data, error } = await this.supabase
      .getClient()
      .from(TABLE)
      .update({
        ...mapInputToRow(input),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(SELECT_WITH_ASSIGNEE)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapRowToProperty(data as PropertyRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.getClient().from(TABLE).delete().eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async uploadImages(files: File[]): Promise<string[]> {
    const urls: string[] = [];

    for (const file of files) {
      urls.push(await this.uploadImage(file));
    }

    return urls;
  }

  async uploadImage(file: File): Promise<string> {
    const extension = file.name.split('.').pop() ?? 'jpg';
    const path = `${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await this.supabase
      .getClient()
      .storage.from(BUCKET)
      .upload(path, file, { upsert: false, contentType: file.type });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = this.supabase.getClient().storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }
}
