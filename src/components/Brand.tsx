import { Link } from 'react-router-dom';
import { Binary } from 'lucide-react';
export function Brand({ light = false }: { light?: boolean }) {
  return <Link className={`brand ${light ? 'brand-light' : ''}`} to="/" aria-label="NACOS MOUAU home"><span className="brand-symbol"><Binary size={22}/></span><span className="brand-copy"><b>NACOS</b><small>MOUAU CHAPTER</small></span></Link>;
}
