import { createRoot } from 'react-dom/client';
import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './style.css';
import './theme.css';
import './theme-pages.css';
import './theme-events.css';
import './theme-responsive.css';
import './theme-portal.css';
import './theme-fx.css';
import { installFx } from './lib/fx';

class AppErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean}> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('NACOS app render failed:', error, info.componentStack); }
  render() {
    if (this.state.hasError) return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24,background:'#f8fafc',color:'#111827',fontFamily:'system-ui,sans-serif'}}><section style={{maxWidth:480,textAlign:'center'}}><div style={{color:'#008751',fontWeight:700,letterSpacing:'.12em',fontSize:12}}>NACOS MOUAU</div><h1 style={{fontSize:28}}>We hit a page error</h1><p style={{lineHeight:1.7,color:'#4b5563'}}>The page could not finish loading. Please try again. If the problem continues, contact the chapter support team.</p><button onClick={() => window.location.reload()} style={{border:0,borderRadius:6,padding:'12px 18px',background:'#008751',color:'white',fontWeight:700,cursor:'pointer'}}>Reload page</button></section></main>;
    return this.props.children;
  }
}

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } });
createRoot(document.getElementById('root')!).render(<StrictMode><AppErrorBoundary><BrowserRouter><QueryClientProvider client={queryClient}><App/></QueryClientProvider></BrowserRouter></AppErrorBoundary></StrictMode>);
installFx();
