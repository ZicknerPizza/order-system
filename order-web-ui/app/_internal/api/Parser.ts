export class Parser {
    public static parseDateIfExists(date: string): Date {
        if (date == undefined || date == null || date == "0") {
            return null;
        }
        return new Date(date);
    }

    public static parseFloatIfExists(number: string): number {
        if (number == undefined || number == null) {
            return null;
        }
        return parseFloat(number);
    }

    public static parseFloatArrayIfExists(numbers: Array<string>): Array<number> {
        if (numbers == undefined || numbers == null) {
            return null;
        }
        return numbers.map(number => Parser.parseFloatIfExists(number));
    }

}