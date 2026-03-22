import seedRandom from "seedrandom";
import { hsvToRGB } from "./color.js";

interface HSVOpts {
	maxHue: number;
	minHue: number;
	minSat: number;
	maxSat: number;
	minValue: number;
	maxValue: number;
}

export class Random {
	generator: seedRandom.PRNG;

	constructor(public seed = 1) {
		this.generator = seedRandom.tychei(seed + "");
	}

    setSeed(n: number) {
        this.generator = seedRandom.tychei(n + "");
    }

    /**
     * @returns a float between 0.0, and 1.0
     */
	next(): number {
		return this.generator();
	}

    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    nextAngle(min: number, max: number): number {
        let angle = this.nextInt(min, max);
        if (angle < 0) angle = 360 - angle;
        return ((angle % 360) * Math.PI) / 180;
    }

    nextBoolean(): boolean {
        return this.next() > 0.5;
    }


	shuffleArray<T>(array: T[]): T[] {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(this.next() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	}

	chooseRandom<T>(list: { length: number; [v: number]: T }): T {
		return list[Math.floor(this.next() * list.length)];
	}

	nextColor(): string {
		const r = this.nextInt(0, 255).toString(16).padStart(2, "0");
		const g = this.nextInt(0, 255).toString(16).padStart(2, "0");
		const b = this.nextInt(0, 255).toString(16).padStart(2, "0");
		return "#" + r + g + b;
	}

	nextColorHSV(opts: Partial<HSVOpts>): string {
		const h = this.nextInt(opts.minHue ?? 0, opts.maxHue ?? 359);
		const s = this.nextInt(opts.minSat ?? 0, opts.maxSat ?? 100);
		const v = this.nextInt(opts.minValue ?? 0, opts.maxValue ?? 100);
		console.log(h, s, v);
		const [r, g, b] = hsvToRGB(h, s, v).map((v) => v.toString(16).padStart(2, "0"));
		return "#" + r + g + b;
	}
}
