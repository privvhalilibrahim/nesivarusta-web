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
  