import { Link } from 'react-router-dom';
import { Binary } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSettings } from '../hooks/useApi';

function Mark({ src }: { src?: string | null }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return <span className={`brand-symbol${src ? ' has-logo' : ''}`}>{src && !failed ? <img src={src} alt="" loading="lazy" onError={() => setFailed(true)}/> : <Binary size={22}/>}</span>;
}

export function Brand({ light = false, logoUrl }: { light?: boolean; logoUrl?: string | null }) {
  const { data: settings } = useSettings();
  const logo = logoUrl === undefined ? settings?.logo_url : logoUrl;
  const secondary = logoUrl === undefined ? settings?.secondary_logo_url : null;
  return <Link className={`brand ${light ? 'brand-light' : ''}`} to="/" aria-label="NACOS MOUAU home"><Mark src={logo}/>{secondary && <Mark src={secondary}/>}</Link>;
}
