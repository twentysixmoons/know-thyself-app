import { useEffect, useState } from "react";
export function useHydrated() { const [h, set] = useState(false); useEffect(() => set(true), []); return h; }
