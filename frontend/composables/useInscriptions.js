import { useEntity } from './useEntity.js';
export function useInscriptions() { return useEntity('Inscription', 'inscriptions', 'inscriptions'); }
if (typeof window !== 'undefined') window.useInscriptions = useInscriptions;
