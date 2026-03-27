import { useEntity } from './useEntity.js';
export function useMurals() { return useEntity('Mural', 'murals', 'murals'); }
if (typeof window !== 'undefined') window.useMurals = useMurals;
