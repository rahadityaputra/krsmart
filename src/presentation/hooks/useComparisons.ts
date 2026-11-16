import { useReducer } from 'react'
import { createView } from '../../business/use-cases/view/createView'
import { deleteView } from '../../business/use-cases/view/deleteView'
import { getViews, getResolvedView } from '../../business/use-cases/view/getView'

export function useComparisons() {
  const [, refresh] = useReducer((revision: number) => revision + 1, 0);
  function change<T>(action: () => T) {
    const result = action();
    refresh();
    return result;
  }
  return {
    views: getViews(),
    view: getResolvedView,
    deleteView: (id: string) => { change(() => {
      const result = deleteView(id)
      if (!result.success) throw new Error(result.error)
    }); },
    createView: (name: string, planIds: string[]) => change(() => {
      const result = createView({ name, planIds })
      if (!result.view) throw new Error(result.error)
      return result.view
    }),
  }
}

export type Comparisons = ReturnType<typeof useComparisons>
