import { useState, useCallback } from 'react';
import type { Template, MovingPlan } from '../data';
import { templates as initialTemplates, plans as initialPlans } from '../data';

let _nextTplId = initialTemplates.length + 1;
let _nextPlanId = initialPlans.length + 1;

export function useTemplateStore() {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);

  const addTemplate = useCallback((tpl: Omit<Template, 'id'>) => {
    const id = `tpl-${_nextTplId++}`;
    setTemplates((prev) => [...prev, { ...tpl, id }]);
    return id;
  }, []);

  return { templates, addTemplate } as const;
}

export function usePlanStore() {
  const [plans, setPlans] = useState<MovingPlan[]>(initialPlans);

  const addPlan = useCallback((plan: Omit<MovingPlan, 'id'>) => {
    const id = `plan-${_nextPlanId++}`;
    setPlans((prev) => [...prev, { ...plan, id }]);
    return id;
  }, []);

  return { plans, addPlan } as const;
}
