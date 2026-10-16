export type Arcana = {
    index: number;
    name: string;
};

export const MAJOR_ARCANA: readonly Arcana[] = [
    { index: 0, name: "The Fool" },
    { index: 1, name: "The Magician" },
    { index: 2, name: "The High Priestess" },
    { index: 3, name: "The Empress" },
    { index: 4, name: "The Emperor" },
    { index: 5, name: "The Hierophant" },
    { index: 6, name: "The Lovers" },
    { index: 7, name: "The Chariot" },
    { index: 8, name: "Strength" },
    { index: 9, name: "The Hermit" },
    { index: 10, name: "Wheel of Fortune" },
    { index: 11, name: "Justice" },
    { index: 12, name: "The Hanged Man" },
    { index: 13, name: "Death" },
    { index: 14, name: "Temperance" },
    { index: 15, name: "The Devil" },
    { index: 16, name: "The Tower" },
    { index: 17, name: "The Star" },
    { index: 18, name: "The Moon" },
    { index: 19, name: "The Sun" },
    { index: 20, name: "Judgement" },
    { index: 21, name: "The World" }
] as const;

/**
 * Reduces a Date to an index in the Major Arcana (0‑21) using modulo arithmetic.
 * The algorithm sums day, month (1‑12), and full year, then takes the remainder modulo 22.
 */
export function getArcanaByDate(date: Date): Arcana {
    const day = date.getDate();
    const month = date.getMonth() + 1; // JavaScript months are zero‑based
    const year = date.getFullYear();
    const total = day + month + year;
    const index = ((total % MAJOR_ARCANA.length) + MAJOR_ARCANA.length) % MAJOR_ARCANA.length;
    return MAJOR_ARCANA[index];
}

/**
 * Parses an ISO‑8601 date string (YYYY‑MM‑DD) and returns the corresponding Arcana.
 * Throws a RangeError if the string cannot be parsed into a valid date.
 */
export function getArcanaByString(dateStr: string): Arcana {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        throw new RangeError(`Invalid date string: ${dateStr}`);
    }
    return getArcanaByDate(date);
}
