import { Moon, Sun } from 'lucide-react';
export function ThemeToggle({dark,onToggle}:{dark:boolean;onToggle:()=>void}) { return <button type="button" className="icon-button" aria-label={`Switch to ${dark?'light':'dark'} mode`} title={`Switch to ${dark?'light':'dark'} mode`} onClick={onToggle}>{dark?<Sun size={17}/>:<Moon size={17}/>}</button>; }
