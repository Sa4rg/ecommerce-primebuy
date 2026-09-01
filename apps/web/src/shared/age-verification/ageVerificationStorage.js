const STORAGE_KEY = "primebuy:age_verification_status";

export function getAgeStatus() {
   try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "adult" || value === "minor" ? value : null;
  } catch (error) {
    return null;
  }
}

export function setAgeStatus(status) {
  try {
     localStorage.setItem(STORAGE_KEY, status); 
  } catch {}
}