/**
 * Formats a number into a compact string representation (e.g., 1.2M, 500K).
 * @param value - The number to format.
 * @param currencySymbol - Optional currency symbol to prepend (e.g., "₦", "$").
 * @returns The formatted string.
 */
export const formatCompactNumber = (value: number | string, currencySymbol?: string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(num)) {
        return '0';
    }

    const formatter = new Intl.NumberFormat('en-US', {
        notFound: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1,
    } as any); // Type assertion needed for 'compact' notation in some TS environments if lib is old

    let formatted = formatter.format(num);

    // If the formatted value ends in "0.0", remove the decimal part for cleaner look
    // e.g. "1.0K" -> "1K"
    // However, Intl.NumberFormat usually handles this well with maximumFractionDigits.
    // But let's ensure we don't have .0 if it's not needed, although standard formatter does good job.

    if (currencySymbol) {
        return `${currencySymbol}${formatted}`;
    }

    return formatted;
};
