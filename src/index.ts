import __wbg_init, { compress_jpeg } from "compress-jpeg";
import "compress-jpeg/compress_jpeg_bg.wasm";
import { Perspective } from "./perspective.js";
import { Random } from "./random.js";
import Warp from "./warp.js";

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;

const $id = document.getElementById.bind(document);

const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ?!";

const revAlphabet = new Map<string, number>();

for (let i = 0; i < alphabet.length; i++) {
	revAlphabet.set(alphabet[i], i);
}

// range of 0-281474976710656
const captchaToNumber = (code: string) => {
	let number = 0;

	if (code.length != 8) throw new RangeError("Incorrect captchalogue code format.");

	for (let i = 0; i < 8; i++) {
		number += revAlphabet.get(code[i]) * alphabet.length ** i;
	}

	return number;
};

const randomInt = (min: number, max: number) => {
	return Math.round(Math.random() * (max - min) + min);
};

const wavyBackground = (d: number) => 1 + Math.sin(((d + 2) * Math.PI) / 2);
const wavyText = (d: number) => 1 + Math.tan(((d + 2) * Math.PI) / 2);

const loadImage = async (url: string): Promise<HTMLImageElement> => {
	return new Promise((res) => {
		let img = new Image();
		img.onload = () => res(img);
		img.src = url;
	});
};

const createTempCanvas = (w = CANVAS_WIDTH, h = CANVAS_HEIGHT) => {
	return new OffscreenCanvas(w, h);
};

const generateCaptcha = () => {
	let str = "";

	for (let i = 0; i < 8; i++) {
		str += alphabet[randomInt(0, alphabet.length - 1)];
	}
	return str;
};

document.addEventListener("DOMContentLoaded", async () => {
	await __wbg_init();

	const rotatingSnakes = await loadImage("./img/rotating_snakes.png");
	const jpegArtifacts = await loadImage("./img/jpeg_artifacts.png");
	const checkerboard = await loadImage("./img/checkerboard.png");

	const finalCanvas = $id("captcha-canvas") as HTMLCanvasElement;
	const codeTextbox = $id("captcha-code") as HTMLInputElement;
	const submitButton = $id("captcha-go") as HTMLButtonElement;
	const randomizeButton = $id("captcha-randomize") as HTMLButtonElement;
	const saveButton = $id("captcha-save") as HTMLButtonElement;

	const random = new Random();

	randomizeButton.addEventListener("click", () => {
		let str = generateCaptcha();

		codeTextbox.value = str;
		submitButton.click();
	});

	saveButton.addEventListener("click", () => {
        finalCanvas.toBlob((blob) => {
            let ele = document.createElement("a");
            ele.download = "captchalogue.png";
            ele.href = URL.createObjectURL(blob);
            ele.click();
        })
	});

	submitButton.addEventListener("click", () => {
		// card text is 7px lucinda console regular

		const finalCtx = finalCanvas.getContext("2d");
		finalCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

		let code = codeTextbox.value;
		if (code.length == 0) {
			codeTextbox.value = generateCaptcha();
			code = codeTextbox.value;
		}

		random.setSeed(captchaToNumber(code));

		// so captchalogue cards back seem to have the following components
		// - random background:
		//   - rotating snakes (optical illusion), random colors and rotation
		//   - checkerboard, random rotation and colors
		//   - noise, random colors and random blending between
		// - the text, warped (wavy) and rotated at random

		const backgroudId = random.nextInt(0, 2);

		// the final background
		const background2Canvas = createTempCanvas();
		const background2Ctx = background2Canvas.getContext("2d");

		switch (backgroudId) {
			// rotating snakes
			case 0: {
				const backgroundCanvas = createTempCanvas(750, 750);
				const backgroundCtx = backgroundCanvas.getContext("2d");
				backgroundCtx.save();
				backgroundCtx.globalAlpha = 0.5;
				const sx = 200 + random.nextInt(-50, 50);
				const sy = 100 + random.nextInt(-50, 50);
				// 1024x767
				backgroundCtx.drawImage(rotatingSnakes, sx, sy, 500, 500, 0, 0, 1000, 1000);
				backgroundCtx.globalAlpha = 1;

				backgroundCtx.globalCompositeOperation = "color";
				backgroundCtx.fillStyle = random.nextColor();
				backgroundCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
				backgroundCtx.restore();

				new Warp({
					inputCanvas: backgroundCanvas,
					viewportCanvas: background2Canvas,
					top: 200,
					left: 200,
				}).deform({
					center: { x: 500, y: 500 },
					radius: 600,
					angle: 25,
					func: wavyBackground,
				});
				break;
			}

			// checkerboard
			case 1: {
				const backgroundCanvas = createTempCanvas(750, 750);
				const backgroundCtx = backgroundCanvas.getContext("2d");

				backgroundCtx.save();
				backgroundCtx.globalAlpha = 0.5;
				backgroundCtx.drawImage(checkerboard, 0, 0, 500, 500, 0, 0, 750, 750);

				backgroundCtx.globalAlpha = 1;
				backgroundCtx.globalCompositeOperation = "color";
				backgroundCtx.fillStyle = random.nextColor();
				backgroundCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
				backgroundCtx.restore();

				new Warp({
					inputCanvas: backgroundCanvas,
					viewportCanvas: background2Canvas,
					top: 200,
					left: 200,
				}).deform({
					center: { x: 500, y: 500 },
					radius: 600,
					angle: random.nextInt(-25, 25),
					func: wavyBackground,
				});
				break;
			}

			// noise
			case 2: {
				const backgroundCanvas = createTempCanvas(500, 500);
				const backgroundCtx = backgroundCanvas.getContext("2d");

				backgroundCtx.save();
				backgroundCtx.globalAlpha = 0.5;
				const scale = random.nextInt(12, 16) / 10;
				backgroundCtx.scale(scale, scale);
				// backgroundCtx.rotate(random.nextAngle(0, 45));
				backgroundCtx.drawImage(jpegArtifacts, 0, 0, 500, 500);
				backgroundCtx.restore();

				backgroundCtx.save();
				const imageData = backgroundCtx.getImageData(0, 0, backgroundCanvas.width, backgroundCanvas.height);
				backgroundCtx.putImageData(compress_jpeg(imageData, 0.2), 0, 0);

				backgroundCtx.globalCompositeOperation = "color";
				backgroundCtx.fillStyle = random.nextColor();
				backgroundCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
				backgroundCtx.restore();

				background2Ctx.drawImage(backgroundCanvas, 0, 0, background2Canvas.width, background2Canvas.height);
				break;
			}
		}

		// 1. draw the text
		const textCanvas = createTempCanvas();
		const textCtx = textCanvas.getContext("2d");
		// 2. perspective warp the entire canvas
		const text2Canvas = createTempCanvas();
		const text2Ctx = text2Canvas.getContext("2d");
		// 3. make the text wavy, and change its position randomly
		const text3Canvas = createTempCanvas();
		const text3Ctx = text3Canvas.getContext("2d");
		// 4. for the superimposed letter
		const text4Canvas = createTempCanvas();
		const text4Ctx = text3Canvas.getContext("2d");

		textCtx.scale(1 + random.nextInt(0, 2) / 10, 1 + random.nextInt(0, 2) / 10);
		// courier prime is technically not courier new, which is the actual font used, but its so so close
		textCtx.font = "75px 'Courier New', 'Courier Prime'";
		textCtx.fillText(code, 30, 250);

		const stretchFactor = 250 + random.nextInt(-50, 50);
		const shrinkFactor = 150 + random.nextInt(-50, 50);

		const points = [
			[0, 0 + shrinkFactor], // top-left
			[500, -stretchFactor], // top-right
			[500, 500 + stretchFactor], // bottom-right
			[0, 500 - shrinkFactor], // bottom-left
		] as [number, number][];
		Perspective.fromCanvas(textCanvas, text2Ctx).draw(points);

		text3Ctx.translate(random.nextInt(-100, 100), random.nextInt(-100, 100));
		new Warp({
			inputCanvas: text2Canvas,
			viewportCanvas: text3Canvas,
		}).deform({
			center: { x: 250, y: 250 },
			radius: 300,
			angle: random.nextInt(-15, 15),
			func: wavyText,
			alphaCutoff: 100,
		});
		text3Ctx.resetTransform();

		const letterXOffset = random.nextInt(-150, 150);
		const letterYOffset = random.nextInt(-150, 150);

		text4Ctx.save();
		text4Ctx.globalAlpha = 0.7;
		text4Ctx.font = "500px 'Courier New', 'Courier Prime'";
		text4Ctx.translate(250, 250);
		text4Ctx.rotate(random.nextAngle(-90, 90));
		const randomLetter = random.chooseRandom(alphabet);
		const letterMeasurements = text4Ctx.measureText(randomLetter);
		text4Ctx.fillText(
			randomLetter,
			-(letterMeasurements.width / 2) + letterXOffset,
			letterMeasurements.actualBoundingBoxAscent / 2 + letterYOffset,
		);
		text4Ctx.translate(-250, -250);
		text4Ctx.restore();

		text3Ctx.drawImage(text4Canvas, 0, 0, text4Canvas.width, text4Canvas.height);

		// draw an inverted canvas behind
		finalCtx.save();
		finalCtx.drawImage(background2Canvas, 0, 0);
		finalCtx.globalCompositeOperation = "difference";
		finalCtx.fillStyle = "white";
		finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
		finalCtx.restore();

		// clip the inverted canvas with our text
		finalCtx.save();
		finalCtx.globalCompositeOperation = "destination-in";
		finalCtx.drawImage(text3Canvas, 0, 0);

		// draw our background behind
		finalCtx.globalCompositeOperation = "destination-over";
		finalCtx.drawImage(background2Canvas, 0, 0);
		finalCtx.restore();

		// draw lines over the original

		const maxLines = random.nextInt(1, 3);

		finalCtx.save();
		finalCtx.globalAlpha = 0.7;
		for (let i = 0; i < maxLines; i++) {
			let lineCopies = 1;
			if (random.nextBoolean()) {
				lineCopies = random.nextInt(2, 6);
			}

			finalCtx.strokeStyle = random.nextColor();
			finalCtx.lineWidth = random.nextInt(2, 4);

			let startX: number;
			let startY: number;
			let endX: number;
			let endY: number;

			const xOrY = random.nextBoolean();

			if (xOrY) {
				startX = 0;
				startY = random.nextInt(20, 490);
				endX = 512;
				endY = random.nextInt(20, 490);
			} else {
				startX = random.nextInt(20, 490);
				startY = 0;
				endX = random.nextInt(20, 490);
				endY = 512;
			}

			let c1X = random.nextInt(startX, endX);
			let c1Y = random.nextInt(startY, endY);
			let c2X = random.nextInt(startX, endX);
			let c2Y = random.nextInt(startY, endY);

			for (let j = 0; j < lineCopies; j++) {
				let xOffset = 0;
				let yOffset = 0;

				if (xOrY) {
					yOffset = j * 10;
				} else {
					xOffset = j * 10;
				}

				finalCtx.beginPath();
				finalCtx.moveTo(startX + xOffset, startY + yOffset);
				finalCtx.bezierCurveTo(c1X + xOffset, c1Y + yOffset, c2X + xOffset, c2Y + yOffset, endX + xOffset, endY + yOffset);
				finalCtx.stroke();
			}
		}
		finalCtx.restore();
	});
});
