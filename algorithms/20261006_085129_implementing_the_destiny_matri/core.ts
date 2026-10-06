/**
 * Destiny Matrix – reduction of a birth date to a Major Arcana.
 * Production‑grade implementation with full typing and validation.
 */

export enum MajorArcana {
    Fool = 0,
    Magician = 1,
    HighPriestess = 2,
    Empress = 3,
    Emperor = 4,
    Hierophant = 5,
    Lovers = 6,
    Chariot = 7,
    Strength = 8,
    Hermit = 9,
    WheelOfFortune = 10,
    Justice = 11,
    HangedMan = 12,
    Death = 13,
    Temperance = 14,
    Devil = 15,
    Tower = 16,
    Star = 17,
    Moon = 18,
    Sun = 19,
    Judgement = 20,
    World = 21,
}

/**
 * Human‑readable names for the Major Arcana.
 */
export const MAJOR_ARCANA_NAMES: Record<MajorArcana, string> = {
    [MajorArcana.Fool]: "The Fool",
    [MajorArcana.Magician]: "The Magician",
    [MajorArcana.HighPriestess]: "The High Priestess",
    [MajorArcana.Empress]: "The Empress",
    [MajorArcana.Emperor]: "The Emperor",
    [MajorArcana.Hierophant]: "The Hierophant",
    [MajorArcana.Lovers]: "The Lovers",
    [MajorArcana.Chariot]: "The Chariot",
    [MajorArcana.Strength]: "Strength",
    [MajorArcana.Hermit]: "The Hermit",
    [MajorArcana.WheelOfFortune]: "Wheel of Fortune",
    [MajorArcana.Justice]: "Justice",
    [MajorArcana.HangedMan]: "The Hanged Man",
    [MajorArcana.Death]: "Death",
    [MajorArcana.Temperance]: "Temperance",
    [MajorArcana.Devil]: "The Devil",
    [MajorArcana.Tower]: "The Tower",
    [MajorArcana.Star]: "The Star",
    [MajorArcana.Moon]: "The Moon",
    [MajorArcana.Sun]: "The Sun",
    [MajorArcana.Judgement]: "Judgement",
    [MajorArcana.World]: "The World",
};

/**
 * Result of the destiny calculation.
 */
export interface DestinyResult {
    /** Original birth date (UTC, time stripped). */
    readonly date: Date;
    /** Index of the Major Arcana (0‑21). */
    readonly index: MajorArcana;
    /** Human‑readable name of the Arcana. */
    readonly name: string;
}

/**
 * Compute the Destiny Matrix reduction for a given birth date.
 *
 * The algorithm:
 *   1. Extract year, month, day as decimal strings.
 *   2. Sum all decimal digits.
 *   3. Reduce the sum modulo 22 to obtain an index in [0,21].
 *
 * @param date - Birth date. Time component is ignored; UTC is used.
 * @returns DestinyResult containing the Arcana.
 * @throws RangeError if the supplied date is invalid.
 */
export function computeDestiny(date: Date): DestinyResult {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        throw new RangeError("Invalid Date supplied.");
    }

    // Normalise to UTC midnight to avoid timezone side‑effects.
    const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

    const digitSum = totalDigitSum(utcDate);
    const index = (digitSum % 22) as MajorArcana;

    return {
        date: utcDate,
        index,
        name: MAJOR_ARCANA_NAMES[index],
    };
}

/**
 * Return the human‑readable name for a given Major Arcana.
 *
 * @param arcana - Enum value.
 */
export function getArcanaName(arcana: MajorArcana): string {
    return MAJOR_ARCANA_NAMES[arcana];
}

/**
 * Sum all decimal digits of year, month, and day.
 *
 * @param date - Normalised UTC date.
 */
function totalDigitSum(date: Date): number {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1; // months are 1‑based for numerology
    const d = date.getUTCDate();

    return sumDigits(y) + sumDigits(m) + sumDigits(d);
}

/**
 * Sum decimal digits of a non‑negative integer.
 *
 * @param n - Non‑negative integer.
 */
function sumDigits(n: number): number {
    let sum = 0;
    let value = Math.trunc(Math.abs(n));
    while (value > 0) {
        sum += value % 10;
        value = Math.floor(value / 10);
    }
    return sum;
}
