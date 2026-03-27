import { useEntity } from './useEntity.js';
export function useDefects() { return useEntity('Defect', 'defects', 'defects'); }
if (typeof window !== 'undefined') window.useDefects = useDefects;
