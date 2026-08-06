import type { Item, PresetDefinition } from '../lib/schema';
import { perDay, perDayNote } from './helpers';

const segeln: PresetDefinition = {
  id: 'segeln',
  name: 'Segeln',
  description: 'Ausrüstung für einen Segeltörn.',

  resolveItems(params): Item[] {
    const coldClimate = params.climate.includes('kalt') || params.climate.includes('frostig');

    const items: Item[] = [
      { id: 'segeln-rettungsweste', name: 'Rettungsweste', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🦺' },
      { id: 'segeln-schuhe', name: 'Segelschuhe (rutschfest)', category: 'Kleidung', importance: 'pflicht', quantity: 1, icon: '👟' },
      { id: 'segeln-oelzeug', name: 'Ölzeug / wasserdichte Segeljacke', category: 'Kleidung', importance: 'pflicht', quantity: 1, icon: '🧥' },
      {
        id: 'segeln-handschuhe',
        name: 'Segelhandschuhe',
        category: 'Kleidung',
        // Bei kaltem Wetter sind Handschuhe (Kälteschutz + Griff an nassen
        // Leinen) praktisch unverzichtbar, sonst optional.
        importance: coldClimate ? 'pflicht' : 'optional',
        quantity: 1,
        icon: '🧤',
      },
      // Geteilte Item-IDs (shared-*): dasselbe Ausrüstungsstück wird auch
      // von anderen Presets vorgeschlagen — eine Reise mit mehreren
      // Aktivitäten braucht trotzdem nur eine Sonnenbrille, eine
      // Trinkflasche usw.
      { id: 'shared-sonnenbrille', name: 'Sonnenbrille mit Kordel', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🕶️' },
      { id: 'segeln-trockensack', name: 'Wasserdichte Tasche (Dry Bag)', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🎒' },
      { id: 'segeln-handyhuelle', name: 'Wasserdichte Handyhülle', category: 'Elektronik', importance: 'optional', quantity: 1, icon: '📱' },
      { id: 'segeln-messer', name: 'Riggmesser / Seemesser', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🔪' },
      { id: 'shared-taschenlampe', name: 'Stirnlampe (mit Rotlicht-Modus)', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🔦' },
      { id: 'segeln-seekrankheit', name: 'Mittel gegen Seekrankheit', category: 'Hygiene', importance: 'optional', quantity: 1, icon: '💊' },
      { id: 'segeln-badesachen', name: 'Badesachen', category: 'Kleidung', importance: 'optional', quantity: { min: 1, max: 2 }, icon: '🩱' },
      { id: 'segeln-handtuch', name: 'Schnelltrocknendes Handtuch', category: 'Hygiene', importance: 'pflicht', quantity: 1, icon: '🛁' },
      { id: 'shared-trinkflasche', name: 'Trinkflasche', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '💧' },
      {
        id: 'segeln-shirts',
        name: 'Kurz-/Langarmshirts',
        category: 'Kleidung',
        importance: 'pflicht',
        quantity: perDay(1, params.days, 6),
        icon: '👕',
        note: perDayNote(1, params.days, 6),
      },
      // Kein `quantity`: Bordpapiere/Führerschein besitzt man nur einmal.
      { id: 'segeln-bordpapiere', name: 'Bootsführerschein / Bordpapiere', category: 'Dokumente', importance: 'optional', icon: '🪪' },
    ];

    if (params.climate.includes('warm')) {
      items.push(
        { id: 'shared-sonnencreme', name: 'Wasserfeste Sonnencreme', category: 'Hygiene', importance: 'pflicht', quantity: 1, icon: '☀️' },
        { id: 'segeln-sonnenhut', name: 'Sonnenhut / Cap mit Kordel', category: 'Kleidung', importance: 'pflicht', quantity: 1, icon: '🧢' },
      );
    }

    if (coldClimate) {
      items.push(
        { id: 'segeln-thermokleidung', name: 'Thermo-Unterwäsche', category: 'Kleidung', importance: 'pflicht', quantity: { min: 1, max: 2 }, icon: '🩲' },
        { id: 'segeln-muetze', name: 'Warme Mütze (winddicht)', category: 'Kleidung', importance: 'pflicht', quantity: 1, icon: '🧢' },
      );
    }

    return items;
  },
};

export default segeln;
