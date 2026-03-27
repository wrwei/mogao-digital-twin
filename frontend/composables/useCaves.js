import { useEntity } from './useEntity.js';
export function useCaves() { return useEntity('Cave', 'caves', 'caves'); }
if (typeof window !== 'undefined') window.useCaves = useCaves;
