import { ItemProgressMapSchema, TripSelectionSchema, type ItemProgressMap, type TripSelection } from './schema';

const TRIP_SELECTION_KEY = 'packliste:trip-selection';
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

export function loadTripSelection(): TripSelection | undefined {
  const parsed = TripSelectionSchema.safeParse(readJson(TRIP_SELECTION_KEY));
  return parsed.success ? parsed.data : undefined;
}

export function saveTripSelection(selection: TripSelection): void {
  if (!hasLocalStorage) return;
  localStorage.setItem(TRIP_SELECTION_KEY, JSON.stringify(selection));
}

export function loadItemProgress(): ItemProgressMap {
  const parsed = ItemProgressMapSchema.safeParse(readJson(ITEM_PROGRESS_KEY));
  return parsed.success ? parsed.data : {};
}

export function saveItemProgress(progress: ItemProgressMap): void {
  if (!hasLocalStorage) return;
  localStorage.setItem(ITEM_PROGRESS_KEY, JSON.stringify(progress));
}
