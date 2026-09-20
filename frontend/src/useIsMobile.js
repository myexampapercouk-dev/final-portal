import { useEffect, useState } from 'react';

// Shared responsive-breakpoint hook for plain-inline-style pages (Landing,
// UnifiedLogin, ParentRegister) that aren't wrapped in one of the portal
// Shell components (those already have their own copy of this pattern).
export default function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return isMobile;
}
