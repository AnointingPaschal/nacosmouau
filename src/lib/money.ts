/** Amounts are stored in kobo. Show them as naira. */
export const naira = (minor: number | null | undefined) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format((minor ?? 0) / 100);
export const toKobo = (naira: string | number) => Math.round(Number(naira) * 100);
export const fromKobo = (minor: number | null | undefined) => String(Math.round((minor ?? 0)) / 100);
export const when = (value?: string | null) => { if (!value) return '—'; const date = new Date(value.includes('T') || value.includes('Z') ? value : `${value.replace(' ', 'T')}Z`); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: value.length > 10 ? 'short' : undefined }).format(date); };
