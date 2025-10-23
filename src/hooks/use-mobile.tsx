
import * as React from "react"

// Update mobile breakpoint to match mobile-first approach
const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  )

  React.useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)
    
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  return isMobile
}
