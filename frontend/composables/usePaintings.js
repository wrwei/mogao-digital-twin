import { useEntity } from './useEntity.js';
export function usePaintings() { return useEntity('Painting', 'paintings', 'paintings'); }
if (typeof window !== 'undefined') window.usePaintings = usePaintings;
