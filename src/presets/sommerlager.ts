import type { Item, PresetDefinition } from '../lib/schema';
import { perDay } from './helpers';

/**
 * Modeled on a real two-week "Kofferliste" for a Catholic youth-group
 * summer camp (Sommerlager), including its "Nachtzeug Jungen"/"Nachtzeug
 * Mädchen" split — sleeping gear differs by which quarters campers are
 * assigned to (tents vs. an indoor dorm), which the source list gates by
 * gender. A shared core (Schlafsack, Kopfkissen, warme Decke,
 * Spannbettlaken) is always included; `divers` gets just that shared core
 * without assuming either assignment.
 */
const sommerlager: PresetDefinition = {
  id: 'sommerlager',
  name: 'Sommerlager',
  description: 'Packliste für ein mehrtägiges Sommer-/Zeltlager.',

  resolveItems(params): Item[] {
    const items: Item[] = [
      // Kleidung
      { id: 'lager-lange-hosen', name: 'Lange Hosen', category: 'Kleidung', importance: 'pflicht', quantity: { min: 1, max: 2 } },
      { id: 'lager-kurze-hosen', name: 'Kurze Hosen', category: 'Kleidung', importance: 'pflicht', quantity: { min: 2, max: 4 } },
      { id: 'lager-jacke', name: 'Jacke', category: 'Kleidung', importance: 'pflicht', quantity: 1 },
      { id: 'lager-pullover', name: 'Pullover', category: 'Kleidung', importance: 'pflicht', quantity: { min: 1, max: 2 } },
      {
        id: 'lager-tshirts',
        name: 'T-Shirts',
        category: 'Kleidung',
        importance: 'pflicht',
        quantity: perDay(1, params.days, 8),
      },
      { id: 'lager-sportzeug', name: 'Sportzeug (für Programm/Sport)', category: 'Kleidung', importance: 'pflicht', quantity: 1 },
      { id: 'lager-badesachen', name: 'Badesachen (doppelt)', category: 'Kleidung', importance: 'pflicht', quantity: 2 },
      { id: 'lager-wanderschuhe', name: 'Feste, bequeme Schuhe (zum Wandern)', category: 'Kleidung', importance: 'pflicht', quantity: 1 },
      { id: 'lager-leichte-schuhe', name: 'Leichte Schuhe', category: 'Kleidung', importance: 'optional', quantity: 1 },
      { id: 'lager-turnschuhe', name: 'Turnschuhe', category: 'Kleidung', importance: 'pflicht', quantity: 1 },
      { id: 'lager-gummistiefel', name: 'Gummistiefel', category: 'Kleidung', importance: 'pflicht', quantity: 1 },
      { id: 'lager-regenkleidung', name: 'Regencape und -hose', category: 'Kleidung', importance: 'pflicht', quantity: 1 },
      { id: 'lager-sonnenhut', name: 'Sonnenhut / Cappy', category: 'Kleidung', importance: 'pflicht', quantity: 1 },
      { id: 'lager-flipflops', name: 'Badelatschen', category: 'Kleidung', importance: 'optional', quantity: 1 },
      {
        id: 'lager-nachtwache-kleidung',
        name: 'Dunkle, alte Kleidung (für Nachtwache)',
        category: 'Kleidung',
        importance: 'optional',
        quantity: 1,
      },
      {
        id: 'lager-schuetzenfest-kleidung',
        name: 'Blaue Jeans und weißes Oberteil (für Schützenfest)',
        category: 'Kleidung',
        importance: 'optional',
        quantity: 1,
      },
      {
        id: 'lager-festliche-kleidung',
        name: 'Schicke Kleidung (für Bergfest/Casinoabend)',
        category: 'Kleidung',
        importance: 'optional',
        quantity: 1,
      },

      // Waschzeug (Hygiene)
      { id: 'lager-handtuecher', name: 'Handtücher (klein & groß)', category: 'Hygiene', importance: 'pflicht', quantity: 2 },
      { id: 'lager-duschzeug', name: 'Duschgel & Shampoo', category: 'Hygiene', importance: 'pflicht', quantity: 1 },
      { id: 'lager-kamm', name: 'Kamm / Bürste', category: 'Hygiene', importance: 'pflicht', quantity: 1 },
      { id: 'lager-mueckenspray', name: 'Insektenschutz', category: 'Hygiene', importance: 'optional', quantity: 1 },
      { id: 'lager-foehn', name: 'Föhn', category: 'Hygiene', importance: 'optional', quantity: 1 },
      { id: 'lager-zahnspange', name: 'Zubehör für Zahnspange', category: 'Hygiene', importance: 'optional', quantity: 1 },

      // Geschirr (Ausrüstung)
      { id: 'lager-trinkflasche', name: 'Trinkflasche (auf Dichtigkeit prüfen)', category: 'Ausrüstung', importance: 'pflicht', quantity: 1 },
      { id: 'lager-besteck', name: 'Besteck', category: 'Ausrüstung', importance: 'pflicht', quantity: 1 },
      { id: 'lager-teller', name: 'Teller (tief & flach, Plastik)', category: 'Ausrüstung', importance: 'pflicht', quantity: 2 },
      { id: 'lager-brotdose', name: 'Brotdose', category: 'Ausrüstung', importance: 'pflicht', quantity: 1 },
      { id: 'lager-becher', name: 'Tasse / Becher (Plastik)', category: 'Ausrüstung', importance: 'pflicht', quantity: 1 },
      { id: 'lager-trockentuch', name: 'Trockentuch', category: 'Ausrüstung', importance: 'pflicht', quantity: 1 },

      // Sonstiges / weitere Ausrüstung
      { id: 'lager-rucksack', name: 'Rucksack', category: 'Ausrüstung', importance: 'pflicht', quantity: 1 },
      { id: 'lager-taschenlampe', name: 'Taschenlampe mit Ersatzbatterien', category: 'Ausrüstung', importance: 'pflicht', quantity: 1 },
      { id: 'lager-sonnenbrille', name: 'Sonnenbrille', category: 'Ausrüstung', importance: 'optional', quantity: 1 },
      { id: 'lager-ersatzbrille', name: 'Ersatzbrille', category: 'Sonstiges', importance: 'optional', quantity: 1 },
      { id: 'lager-brustbeutel', name: 'Brustbeutel für das Taschengeld', category: 'Sonstiges', importance: 'optional', quantity: 1 },
      {
        id: 'lager-schreibzeug',
        name: 'Schreibzeug / Briefmarken / Postkarten',
        category: 'Sonstiges',
        importance: 'optional',
        quantity: { min: 1, max: 3 },
      },

      // Nachtzeug – gemeinsamer Kern (unabhängig vom Geschlecht)
      { id: 'lager-schlafsack', name: 'Schlafsack (warm; kein Sommerschlafsack)', category: 'Ausrüstung', importance: 'pflicht', quantity: 1 },
      { id: 'lager-warme-decke', name: 'Warme Decke', category: 'Ausrüstung', importance: 'pflicht', quantity: 1 },
      { id: 'lager-kopfkissen', name: 'Kopfkissen', category: 'Ausrüstung', importance: 'pflicht', quantity: 1 },
      { id: 'lager-spannbettlaken', name: 'Spannbettlaken', category: 'Ausrüstung', importance: 'pflicht', quantity: 1 },
    ];

    // Nachtzeug Jungen: Zeltlager mit Isomatte/Luftmatratze statt festem Bett.
    if (params.gender === 'maennlich') {
      items.push(
        { id: 'lager-isomatte', name: 'Isomatte', category: 'Ausrüstung', importance: 'pflicht', quantity: 1 },
        { id: 'lager-luftmatratze', name: 'Luftmatratze mit Pumpe', category: 'Ausrüstung', importance: 'optional', quantity: 1 },
        { id: 'lager-trainingsanzug', name: 'Trainingsanzug (als Schlafanzug)', category: 'Kleidung', importance: 'optional', quantity: 1 },
      );
    }

    // Nachtzeug Mädchen: feste Betten, daher Bettwäsche statt Isomatte.
    if (params.gender === 'weiblich') {
      items.push(
        { id: 'lager-bettwaesche', name: 'Bettwäsche (falls kein Schlafsack)', category: 'Ausrüstung', importance: 'optional', quantity: 1 },
        { id: 'lager-hausschuhe', name: 'Hausschuhe', category: 'Kleidung', importance: 'pflicht', quantity: 1 },
      );
    }

    // Extra warme Schicht bei kaltem/frostigem Wetter, zusätzlich zum Standard-Pullover.
    if (params.climate === 'kalt' || params.climate === 'frostig') {
      items.push({
        id: 'lager-extra-pulli',
        name: 'Zusätzlicher warmer Pullover',
        category: 'Kleidung',
        importance: 'optional',
        quantity: 1,
      });
    }

    // Bei längeren Lagern lohnt sich ein eigener Wäschesack für Schmutzwäsche.
    if (params.days >= 5) {
      items.push({
        id: 'lager-waeschebeutel',
        name: 'Beutel für schmutzige Wäsche',
        category: 'Sonstiges',
        importance: 'optional',
        quantity: 1,
      });
    }

    return items;
  },
};

export default sommerlager;
