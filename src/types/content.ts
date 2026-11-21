export interface HeroSlide {
  id: string;
  image_url: string | null;
  badge: string | null;
  title: string;
  subtitle: string;
  primary_cta_text: string | null;
  primary_cta_link: string | null;
  secondary_cta_text: string | null;
  secondary_cta_link: string | null;
  display_order: number;
  is_active: boolean;
}
export interface SiteSettings {
  chapter_name: string;
  institution_name: string;
  academic_session: string;
  logo_url: string | null;
  secondary_logo_url?: string | null;
  constitution_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  social_links: { label: string; url: string }[];
  navigation: { label: string; href: string; location?: 'header' | 'footer'; visible: boolean; order: number }[];
  hero_slides: HeroSlide[];
  [key: string]: unknown;
}
export interface CmsPage { id: string; slug: string; title: string; summary: string | null; body: string | null; hero_image_url: string | null; sections?: (Record<string, unknown> & { key?: string })[]; updated_at?: string }
export interface Executive { id: string; full_name: string; position: string; bio: string | null; image_url: string | null; email?: string | null; tenure: string; is_current: boolean; display_order: number; responsibilities?: string | null }
export interface NewsItem { id: string; title: string; slug: string; excerpt: string | null; body: string | null; image_url: string | null; category: string | null; published_at: string | null; status: string }
export interface Announcement { id: string; title: string; body: string; published_at: string | null; expires_at: string | null; priority: 'normal' | 'important' | 'urgent' }
export interface EventItem { id: string; title: string; slug: string; description: string | null; image_url: string | null; starts_at: string; ends_at: string | null; venue: string | null; price_minor: number; currency: string; capacity: number | null; registration_open: boolean; summary?: string | null; stats_text?: string | null; stats?: EventStat[]; speakers?: EventSpeaker[]; photos?: EventPhoto[]; videos?: EventVideo[] }
export interface EventStat { value: string; label: string }
export interface EventSpeaker { id: string; name: string; role: string | null; image_url: string | null }
export interface EventPhoto { id: string; image_url: string; caption: string | null }
export interface EventVideo { id: string; video_url: string; thumbnail_url: string | null; caption: string | null; duration: string | null; is_featured: boolean }
export interface GalleryAlbum { id: string; title: string; description: string | null; cover_image_url: string | null; photos: GalleryPhoto[] }
export interface GalleryPhoto { id: string; image_url: string; caption: string | null; display_order: number }
export interface AssociationDocument { id: string; title: string; description: string | null; category: string; file_url: string; published_at: string | null }
export interface Achievement { id: string; title: string; description: string | null; achieved_at: string | null; image_url: string | null }
export interface AssociationStats { registered_members: number; active_executives: number; events_hosted: number; completed_projects: number }
export interface Paginated<T> { items: T[]; page: number; page_size: number; total: number }
