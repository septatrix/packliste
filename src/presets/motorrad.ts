import type { Item, PresetDefinition } from '../lib/schema';
import { perDay, perDayNote } from './helpers';

const motorrad: PresetDefinition = {
  id: 'motorrad',
  name: 'Motorradtour',
  description: 'Schutzkleidung und Ausrüstung für eine Motorradtour.',

  resolveItems(params): Item[] {
    const items: Item[] = [
      { id: 'motorrad-helm', name: 'Motorradhelm', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🪖' },
      { id: 'motorrad-jacke', name: 'Motorradjacke mit Protektoren', category: 'Kleidung', importance: 'pflicht', quantity: 1, icon: '🧥' },
      { id: 'motorrad-hose', name: 'Motorradhose mit Protektoren', category: 'Kleidung', importance: 'pflicht', quantity: 1, icon: '👖' },
      { id: 'motorrad-handschuhe', name: 'Motorradhandschuhe', category: 'Kleidung', importance: 'pflicht', quantity: 1, icon: '🧤' },
      { id: 'motorrad-stiefel', name: 'Motorradstiefel', category: 'Kleidung', importance: 'pflicht', quantity: 1, icon: '🥾' },
      { id: 'motorrad-regenkombi', name: 'Regenkombi (über der Schutzkleidung)', category: 'Kleidung', importance: 'pflicht', quantity: 1, icon: '☔' },
      { id: 'motorrad-sturmhaube', name: 'Sturmhaube / Nackentuch', category: 'Kleidung', importance: 'optional', quantity: 1, icon: '🧣' },
      {
        id: 'motorrad-ohrstoepsel',
        name: 'Gehörschutz-Ohrstöpsel',
        category: 'Hygiene',
        importance: 'optional',
        quantity: { min: 1, max: 3 },
        icon: '👂',
        note: 'Ein Paar pro paar Fahrtage als Reserve, 1–3',
      },
      // Geteilte Item-ID: dasselbe Erste-Hilfe-Set wird auch von
      // Wandern/Camping vorgeschlagen.
      { id: 'shared-erste-hilfe-set', name: 'Erste-Hilfe-Set', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🩹' },
      { id: 'motorrad-bordwerkzeug', name: 'Bordwerkzeug / Pannenset', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🔧' },
      { id: 'motorrad-ersatzteile', name: 'Ersatzsicherungen & Glühbirnen', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '💡' },
      { id: 'motorrad-reifenpannenset', name: 'Reifen-Reparaturset / Kompressor', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🛞' },
      { id: 'motorrad-panzertape', name: 'Panzertape & Kabelbinder', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🧵' },
      // Kein `quantity`: Fahrzeugschein/Führerschein besitzt man nur einmal.
      { id: 'motorrad-fahrzeugschein', name: 'Fahrzeugschein & Führerschein', category: 'Dokumente', importance: 'pflicht', icon: '🪪' },
      {
        id: 'motorrad-shirts',
        name: 'T-Shirts (unter der Schutzkleidung)',
        category: 'Kleidung',
        importance: 'pflicht',
        quantity: perDay(1, params.days, 6),
        icon: '👕',
        note: perDayNote(1, params.days, 6),
      },
    ];

    // Grüne Versicherungskarte sowie Warnweste & Warndreieck sind in vielen
    // Ländern außerhalb des Heimatlands gesetzlich vorgeschrieben.
    if (params.destination !== undefined && params.destination !== 'inland') {
      items.push(
        {
          // Kein `quantity`: Man führt eine gültige Versicherungskarte mit,
          // kein Zähler nötig.
          id: 'motorrad-versicherungskarte',
          name: 'Grüne Versicherungskarte',
          category: 'Dokumente',
          importance: 'pflicht',
          icon: '📋',
        },
        {
          id: 'motorrad-warnweste',
          name: 'Warnweste & Warndreieck',
          category: 'Ausrüstung',
          importance: 'pflicht',
          quantity: 1,
          icon: '🦺',
        },
      );
    }

    if (params.climate.includes('frostig')) {
      items.push({
        id: 'motorrad-beheizte-inlays',
        name: 'Beheizbare Handschuh-Inlays',
        category: 'Kleidung',
        importance: 'optional',
        quantity: 1,
        icon: '🔥',
      });
    }

    if (params.climate.includes('warm')) {
      items.push({
        id: 'motorrad-kuehlweste',
        name: 'Kühlweste / Nierengurt',
        category: 'Kleidung',
        importance: 'optional',
        quantity: 1,
        icon: '🧥',
      });
    }

    return items;
  },
};

export default motorrad;
