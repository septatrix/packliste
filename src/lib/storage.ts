import { ItemProgressMapSchema, ParamsSchema, type ItemProgressMap, type Params } from './schema';

const PARAMS_KEY = 'packliste:params';
const ITEM_PROGRESS_KEY = 'packliste:item-progress';

const hasLocalStorage = typeof localStorage !== 'undefined';

function readJson(key: string): unknown {
  if (!hasLocalStorage) return undefined;
  const raw = localStorage.getItem(key);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export function loadParams(): Params | undefined {
  const parsed = ParamsSchema.safeParse(readJson(PARAMS_KEY));
  return parsed.success ? parsed.data : undefined;
}

export function saveParams(params: Params): void {
  if (!hasLocalStorage) return;
  localStorage.setItem(PARAMS_KEY, JSON.stringify(params));
}

export function loadItemProgress(): ItemProgressMap {
  const parsed = ItemProgressMapSchema.safeParse(readJson(ITEM_PROGRESS_KEY));
  return parsed.success ? parsed.data : {};
}

export function saveItemProgress(progress: ItemProgressMap): void {
  if (!hasLocalStorage) return;
  localStorage.setItem(ITEM_PROGRESS_KEY, JSON.stringify(progress));
}
