import { ItemStateMapSchema, ParamsSchema, type ItemStateMap, type Params } from './schema';

const PARAMS_KEY = 'packliste:params';
const ITEM_STATES_KEY = 'packliste:item-states';

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

export function loadItemStates(): ItemStateMap {
  const parsed = ItemStateMapSchema.safeParse(readJson(ITEM_STATES_KEY));
  return parsed.success ? parsed.data : {};
}

export function saveItemStates(states: ItemStateMap): void {
  if (!hasLocalStorage) return;
  localStorage.setItem(ITEM_STATES_KEY, JSON.stringify(states));
}
