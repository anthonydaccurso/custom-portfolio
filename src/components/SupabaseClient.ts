import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with performance optimizations
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true, // Enable session persistence
      autoRefreshToken: true, // Enable automatic token refresh
      detectSessionInUrl: false, // Disable session detection in URL for faster loads
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache responses for 1 hour
      },
      fetch: fetch.bind(globalThis), // Use native fetch for better performance
    },
    realtime: {
      params: {
        eventsPerSecond: 10, // Limit realtime events
      },
    },
  }
);

// Reusable query builder with RLS optimization
const createOptimizedQuery = (table: string) => {
  return supabase
    .from(table)
    .select()
    .throwOnError(); // Fail fast on errors
};

// Upload a file to the "media" bucket with performance optimizations
export const uploadToMedia = async (file: File, path: string) => {
  const options = {
    cacheControl: 'public, max-age=31536000', // Cache for 1 year
    upsert: false,
    contentType: file.type,
  };

  const { data, error } = await supabase.storage
    .from('media')
    .upload(path, file, options);

  if (error) {
    console.error('Upload error:', error.message);
    throw new Error(error.message);
  }

  return data;
};

// Get a CDN-ready URL with performance optimizations
export const getMediaPublicUrl = (path: string) => {
  const { publicURL } = supabase.storage
    .from('media')
    .getPublicUrl(path, {
      transform: {
        quality: 80, // Optimize image quality
        format: 'webp', // Use WebP format
        width: 800, // Limit max width
        height: 800, // Limit max height
        resize: 'cover',
      },
    });
  return publicURL;
};

// Batch operations helper
export const batchOperation = async <T>(
  items: T[],
  operation: (item: T) => Promise<any>,
  batchSize = 10
) => {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => operation(item))
    );
    results.push(...batchResults);
  }
  return results;
};

// Cache helper for frequently accessed data
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getCachedData = async (
  key: string,
  fetcher: () => Promise<any>
) => {
  const cached = cache.get(key);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await fetcher();
  cache.set(key, { data, timestamp: now });
  return data;
};