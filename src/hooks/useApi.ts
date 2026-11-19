import { useQuery } from '@tanstack/react-query';
import { api, queryString } from '../lib/api';
import type { AssociationDocument, AssociationStats, Achievement, Announcement, CmsPage, EventItem, Executive, GalleryAlbum, HeroSlide, NewsItem, SiteSettings } from '../types/content';
import type { Election, FinanceSummary, Payment, WelfareRequest } from '../types/operations';
import type { Member } from '../types/auth';

const emptyStats: AssociationStats = { registered_members: 0, active_executives: 0, events_hosted: 0, completed_projects: 0 };
export function useSettings() { return useQuery({ queryKey: ['settings'], queryFn: ({ signal }) => api.getOptional<SiteSettings | null>('settings', null, signal), retry: false }); }
export function usePages(params: {slug?:string; type?:string; page?:number} = {}) { return useQuery({ queryKey: ['pages', params], queryFn: ({signal}) => api.getOptional<CmsPage[] | CmsPage>(`pages${queryString(params)}`, [], signal), retry: false }); }
export function useExecutives(params: {tenure?:string; current?:boolean} = {}) { return useQuery({ queryKey: ['executives', params], queryFn: ({signal}) => api.getOptional<Executive[]>(`executives${queryString({tenure:params.tenure,current:params.current === undefined ? undefined : String(params.current)})}`,[],signal), retry:false }); }
export function useNews(params: {search?:string; category?:string; page?:number} = {}) { return useQuery({ queryKey:['news',params], queryFn:({signal}) => api.getOptional<NewsItem[] | {items:NewsItem[];total:number}>(`news${queryString(params)}`,[],signal), retry:false }); }
export function useNewsItem(slug: string) { return useQuery({ queryKey:['news',slug], queryFn:({signal})=>api.getOptional<NewsItem | null>(`news/${encodeURIComponent(slug)}`,null,signal), enabled:!!slug,retry:false }); }
export function useAnnouncements() { return useQuery({ queryKey:['announcements'],queryFn:({signal})=>api.getOptional<Announcement[]>('announcements',[],signal),retry:false }); }
export function useEvents(params: {status?:string;search?:string;page?:number} = {}) { return useQuery({queryKey:['events',params],queryFn:({signal})=>api.getOptional<EventItem[] | {items:EventItem[];total:number}>(`events${queryString(params)}`,[],signal),retry:false}); }
export function useEvent(slug:string) { return useQuery({queryKey:['events',slug],queryFn:({signal})=>api.getOptional<EventItem | null>(`events/${encodeURIComponent(slug)}`,null,signal),enabled:!!slug,retry:false}); }
export function useGallery() { return useQuery({queryKey:['gallery'],queryFn:({signal})=>api.getOptional<GalleryAlbum[]>('gallery',[],signal),retry:false}); }
export function useDocuments() { return useQuery({queryKey:['documents'],queryFn:({signal})=>api.getOptional<AssociationDocument[]>('documents',[],signal),retry:false}); }
export function useAchievements() { return useQuery({queryKey:['achievements'],queryFn:({signal})=>api.getOptional<Achievement[]>('achievements',[],signal),retry:false}); }
export function useStats() { return useQuery({queryKey:['stats'],queryFn:({signal})=>api.getOptional<AssociationStats>('stats',emptyStats,signal),retry:false,placeholderData:emptyStats}); }
export function useMembers(params: {search?:string;status?:string;page?:number} = {}) { return useQuery({queryKey:['members',params],queryFn:({signal})=>api.getOptional<Member[] | {items:Member[];total:number}>(`members${queryString(params)}`,[],signal),retry:false}); }
export function usePayments() { return useQuery({queryKey:['payments'],queryFn:({signal})=>api.getOptional<Payment[]>('payments',[],signal),retry:false}); }
export function useElections() { return useQuery({queryKey:['elections'],queryFn:({signal})=>api.getOptional<Election[]>('elections',[],signal),retry:false}); }
export function useWelfare() { return useQuery({queryKey:['welfare'],queryFn:({signal})=>api.getOptional<WelfareRequest[]>('welfare',[],signal),retry:false}); }
export function useFinanceSummary() { return useQuery({queryKey:['admin','finance'],queryFn:({signal})=>api.getOptional<FinanceSummary | null>('admin/finance/summary',null,signal),retry:false}); }
export function useHeroSlides() { return useQuery({queryKey:['pages','hero-slides'],queryFn:({signal})=>api.getOptional<HeroSlide[]>('pages/hero-slides',[],signal),retry:false}); }
