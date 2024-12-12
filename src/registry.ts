import { Instrument } from "./instruments/instrument";
export class Registry {
    private instruments: Map<string, Instrument> = new Map();

    public register(instrument: Instrument): void {
        this.instruments.set(instrument.name, instrument);
    }

    public getInstruments(): IterableIterator<Instrument> {
        return this.instruments.values();
    }
}
