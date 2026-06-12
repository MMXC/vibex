/**
 * useIsMobileUA.ts — S92-E4: Mobile-First Preview
 *
 * Detects mobile User-Agent (iOS Safari, Android Chrome, etc.)
 * Used to route canvas to preview-only mode on mobile devices.
 * Different from useResponsiveMode which uses viewport width.
 */

import { useEffect, useState } from 'react';

const MOBILE_UA_PATTERNS = [
  /Android/i,
  /webOS/i,
  /iPhone/i,
  /iPad/i,
  /iPod/i,
  /BlackBerry/i,
  /IEMobile/i,
  /Opera Mini/i,
  /CriOS/i,
  /FxiOS/i,
  /Mobile Safari/i,
];

export interface MobileUAState {
  isMobileUA: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isTabletUA: boolean;
}

/**
 * Detect mobile user-agent string (not viewport width).
 * Returns isMobileUA, isIOS, isAndroid, isTabletUA flags.
 */
export function useIsMobileUA(): MobileUAState {
  const [state, setState] = useState<MobileUAState>({
    isMobileUA: false,
    isIOS: false,
    isAndroid: false,
    isTabletUA: false,
  });

  useEffect(() => {
    const ua = navigator.userAgent;

    const isMobileUA = MOBILE_UA_PATTERNS.some((pattern) => pattern.test(ua));
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    // Tablet UA: iPad or Android tablet (without "Mobile" in string)
    const isTabletUA = /iPad|Android(?!.*Mobile)/i.test(ua);

    setState({ isMobileUA, isIOS, isAndroid, isTabletUA });
  }, []);

  return state;
}

/**
 * Lightweight boolean check for mobile UA.
 * Use this when you only need to know if it's a mobile device.
 */
export function isMobileUserAgent(ua: string): boolean {
  return MOBILE_UA_PATTERNS.some((pattern) => pattern.test(ua));
}
