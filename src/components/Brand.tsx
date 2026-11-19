import { Link } from 'react-router-dom';
import { Binary } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSettings } from '../hooks/useApi';
export function Brand({ light = false, logoUrl }: { light?: boolean; logoUrl?: string | null }) {
  const { data: settings } = useSettings();
  const logo = logoUrl === undefined ? settings?.logo_url : logoUrl;
  const [logoFailed, setLogoFailed] = useState(false);
  useEffect(() => setLogoFailed(false), [logo]);
  return <Link className={`brand ${light ? 'brand-light' : ''}`} to="/" aria-label="NACOS MOUAU home"><span className={`brand-symbol${logo ? ' has-logo' : ''}`}>{logo && !logoFailed ? <img src={logo} alt="" loading="lazy" onError={() => setLogoFailed(true)}/> : <Binary size={22}/>}</span><span className="brand-copy"><b>NACOS</b><small>MOUAU CHAPTER</small></span></Link>;
}
