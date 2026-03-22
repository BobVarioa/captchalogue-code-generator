// adapted from https://gist.github.com/donpark/1796361

import { Random } from "./random.js";
import { CanvasLike } from "./types.js";

export const randomNoise = (random: Random, canvas: CanvasLike, x = 0, y = 0, width = canvas.width, height = canvas.height, alpha = 255): CanvasLike => {
	const ctx = canvas.getContext("2d");
	const imageData = ctx.getImageData(x, y, width, height);
	let pixels = imageData.data;
	let n = pixels.length;
	let i = 0;
	while (i < n) {
		pixels[i++] = pixels[i++] = pixels[i++] = (random.next() * 256) | 0;
		pixels[i++] = alpha;
	}
	ctx.putImageData(imageData, x, y);
	return canvas;
};

export const rowNoise = (random: Random, minDistance: number, maxDistance: number, canvas: CanvasLike, x = 0, y = 0, width = canvas.width, height = canvas.height, alpha = 255): CanvasLike => {
	const ctx = canvas.getContext("2d");
	const imageData = ctx.getImageData(x, y, width, height);
	let pixels = imageData.data;
	let n = pixels.length;
	let i = 0;
    let currentColor: number;
    let currentDistance = 0;
	while (i < n) {
        if (currentDistance <= 0) {
            currentColor =  random.nextInt(60, 180);
            currentDistance = random.nextInt(minDistance, maxDistance);
        }
        currentDistance--;

		pixels[i++] = pixels[i++] = pixels[i++] = currentColor;
		pixels[i++] = alpha;
	}
	ctx.putImageData(imageData, x, y);
	return canvas;
};


export const perlinNoise = (random: Random, canvas: CanvasLike, noise?: CanvasLike) => {
	noise ??= randomNoise(random, new OffscreenCanvas(canvas.width, canvas.height));
	const ctx = canvas.getContext("2d");
	ctx.save();

	/* Scale random iterations onto the canvas to generate Perlin noise. */
	for (let size = 2; size <= noise.width; size *= 2) {
		let x = (random.next() * (noise.width - size)) | 0;
		let y = (random.next() * (noise.height - size)) | 0;
		ctx.globalAlpha = 4 / size;
		ctx.drawImage(noise, x, y, size, size, 0, 0, canvas.width, canvas.height);
	}

	ctx.restore();
	return canvas;
};
