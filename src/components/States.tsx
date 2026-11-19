import { AlertCircle, LoaderCircle, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { isApiUnavailable } from '../lib/api';
export function LoadingState({ label = 'Loading association information…' }: {label?:string}) { return <div className="state state-loading"><LoaderCircle className="spin" size={20}/><span>{label}</span></div>; }
export function ErrorState({ error, label = 'This information is temporarily unavailable.' }: {error?:unknown;label?:string}) { return <div className="state state-error"><AlertCircle size={19}/><span>{isApiUnavailable(error) ? 'Association services are being prepared. Please try again shortly.' : label}</span></div>; }
export function EmptyState({ title = 'Nothing published yet', text = 'When the association adds this information, it will appear here.', icon }: {title?:string;text?:string;icon?:ReactNode}) { return <div className="state state-empty">{icon ?? <Search size={22}/>}<strong>{title}</strong><span>{text}</span></div>; }
export function QueryBlock<T>({loading,error,items,render,emptyTitle,emptyText}: {loading:boolean;error:unknown;items:T[];render:(item:T)=>ReactNode;emptyTitle?:string;emptyText?:string}) { if(loading)return <LoadingState/>;if(error)return <ErrorState error={error}/>;if(!items.length)return <EmptyState title={emptyTitle} text={emptyText}/>;return <>{items.map(render)}</>; }
