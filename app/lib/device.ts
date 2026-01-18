export function getOrCreateDeviceId(): string {
    if (typeof window === "undefined") return ""
  
    const key = "nvu_device_id"
    let id = localStorage.getItem(key)
  
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(key, id)
    }
  
    return id
  }
  
  export function getOrCreateGuestUserId(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("nvu_user_id")
  }
  
  export function setGuestUserId(userId: string) {
    if (typeof window === "undefined") return
    localStorage.setItem("nvu_user_id", userId)
  }

  /**
   * Cihaz tipini tespit et (tablet, phone, pc)
   * @returns { from_tablet: boolean, from_phone: boolean, from_pc: boolean }
   */
  export function detectDeviceType(): {
    from_tablet: boolean
    from_phone: boolean
    from_pc: boolean
  } {
    if (typeof window === "undefined") {
      return { from_tablet: false, from_phone: false, from_pc: true }
    }

    const userAgent = navigator.userAgent.toLowerCase()
    const width = window.innerWidth

    // Tablet tespiti
    const isTablet = 
      /ipad|android(?!.*mobile)|tablet/i.test(userAgent) ||
      (width >= 768 && width < 1024 && /touch/i.test(userAgent))

    // Phone tespiti (tablet değilse ve mobile ise)
    const isPhone = 
      !isTablet && 
      (/mobile|android|iphone|ipod|blackberry|opera mini/i.test(userAgent) || width < 768)

    // PC (tablet ve phone değilse)
    const isPC = !isTablet && !isPhone

    return {
      from_tablet: isTablet,
      from_phone: isPhone,
      from_pc: isPC,
    }
  }
  