const hsvToRGB2 = (h: number, s: number, v: number, c: number) => {
	const hh = h / 60;
	const x = c * (1 - Math.abs((hh % 2) - 1));

	// prettier-ignore
	switch (Math.floor(hh)) {
		case 0:  return [c, x, 0];
		case 1:  return [x, c, 0];
		case 2:  return [0, c, x];
		case 3:  return [0, x, c];
		case 4:  return [x, 0, c];
		case 5:  return [c, 0, x];
	}
};

export const hsvToRGB = (h: number, s: number, v: number) => {
	s = s / 100;
	v = v / 100;
	const c = v * s;
	const m = v - c;
	const [r, g, b] = hsvToRGB2(h % 360, s, v, c);
	return [Math.round(255 * (r + m)), Math.round(255 * (g + m)), Math.round(255 * (b + m))];
};