import { useEntity } from './useEntity.js';
export function useStatues() { return useEntity('Statue', 'statues', 'statues'); }
if (typeof window !== 'undefined') window.useStatues = useStatues;
