// adapted from https://github.com/wanadev/perspective.js

import { CanvasContext2DLike, CanvasLike } from "./types.js";

// Copyright 2010 futomi  http://www.html5.jp/
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// perspective.js v0.0.2
// 2010-08-28
//
// This file was modified by Fabien LOISON <http://www.flozz.fr/>
// ...and Bob letioa <https://bobletioa.com/>

export class Perspective {
	destinationCtx: CanvasContext2DLike;
	imageCanvas: CanvasLike;
	imageCtx: CanvasContext2DLike;
	transformedCtx: CanvasContext2DLike;

	constructor(destinationCtx: CanvasContext2DLike, image: CanvasImageSource, width: number, height: number) {
		this.destinationCtx = destinationCtx;
		// prepare a canvas for the image
		this.imageCanvas = new OffscreenCanvas(width, height);
		this.imageCtx = this.imageCanvas.getContext("2d");
		this.imageCtx.drawImage(image, 0, 0, this.imageCanvas.width, this.imageCanvas.height);
		// prepare a canvas for the transformed image
		const transformedCanvas = new OffscreenCanvas(destinationCtx.canvas.width, destinationCtx.canvas.height);
		this.transformedCtx = transformedCanvas.getContext("2d");
	}

    static fromCanvas(image: CanvasLike, destinationCtx: CanvasContext2DLike) {
        return new Perspective(destinationCtx, image, image.width, image.height);
    }

    static fromImage(image: HTMLImageElement | ImageBitmap, destinationCtx: CanvasContext2DLike) {
        return new Perspective(destinationCtx, image, image.width, image.height);
    }

	createTempCtx(w: number, h: number) {
		const canvas = new OffscreenCanvas(w, h);
		const ctx = canvas.getContext("2d");
		return ctx;
	}

	draw(points: [number, number][]) {
		let d0x = points[0][0];
		let d0y = points[0][1];
		let d1x = points[1][0];
		let d1y = points[1][1];
		let d2x = points[2][0];
		let d2y = points[2][1];
		let d3x = points[3][0];
		let d3y = points[3][1];
		// compute the dimension of each side
		let dims = [
			Math.sqrt(Math.pow(d0x - d1x, 2) + Math.pow(d0y - d1y, 2)), // top side
			Math.sqrt(Math.pow(d1x - d2x, 2) + Math.pow(d1y - d2y, 2)), // right side
			Math.sqrt(Math.pow(d2x - d3x, 2) + Math.pow(d2y - d3y, 2)), // bottom side
			Math.sqrt(Math.pow(d3x - d0x, 2) + Math.pow(d3y - d0y, 2)), // left side
		];
		//
		let ow = this.imageCanvas.width;
		let oh = this.imageCanvas.height;
		// specify the index of which dimension is longest
		let base_index = 0;
		let max_scale_rate = 0;
		let zero_num = 0;
		for (let i = 0; i < 4; i++) {
			let rate = 0;
			if (i % 2) {
				rate = dims[i] / ow;
			} else {
				rate = dims[i] / oh;
			}
			if (rate > max_scale_rate) {
				base_index = i;
				max_scale_rate = rate;
			}
			if (dims[i] == 0) {
				zero_num++;
			}
		}
		if (zero_num > 1) {
			return;
		}
		//
		let step = 2;
		let cover_step = step * 5;
		this.transformedCtx.clearRect(0, 0, this.transformedCtx.canvas.width, this.transformedCtx.canvas.height);
		if (base_index % 2 == 0) {
			// top or bottom side
			let ctxl = this.createTempCtx(ow, cover_step);
			ctxl.globalCompositeOperation = "copy";
			let cvsl = ctxl.canvas;
			for (let y = 0; y < oh; y += step) {
				let r = y / oh;
				let sx = d0x + (d3x - d0x) * r;
				let sy = d0y + (d3y - d0y) * r;
				let ex = d1x + (d2x - d1x) * r;
				let ey = d1y + (d2y - d1y) * r;
				let ag = Math.atan2(ey - sy, ex - sx);
				let sc = Math.sqrt(Math.pow(ex - sx, 2) + Math.pow(ey - sy, 2)) / ow;
				ctxl.setTransform(1, 0, 0, 1, 0, -y);
				ctxl.drawImage(this.imageCtx.canvas, 0, 0);
				//
				this.transformedCtx.translate(sx, sy);
				this.transformedCtx.rotate(ag);
				this.transformedCtx.scale(sc, sc);
				this.transformedCtx.drawImage(cvsl, 0, 0);
				//
				this.transformedCtx.setTransform(1, 0, 0, 1, 0, 0);
			}
		} else if (base_index % 2 == 1) {
			// right or left side
			let ctxl = this.createTempCtx(cover_step, oh);
			ctxl.globalCompositeOperation = "copy";
			let cvsl = ctxl.canvas;
			for (let x = 0; x < ow; x += step) {
				let r = x / ow;
				let sx = d0x + (d1x - d0x) * r;
				let sy = d0y + (d1y - d0y) * r;
				let ex = d3x + (d2x - d3x) * r;
				let ey = d3y + (d2y - d3y) * r;
				let ag = Math.atan2(sx - ex, ey - sy);
				let sc = Math.sqrt(Math.pow(ex - sx, 2) + Math.pow(ey - sy, 2)) / oh;
				ctxl.setTransform(1, 0, 0, 1, -x, 0);
				ctxl.drawImage(this.imageCtx.canvas, 0, 0);
				//
				this.transformedCtx.translate(sx, sy);
				this.transformedCtx.rotate(ag);
				this.transformedCtx.scale(sc, sc);
				this.transformedCtx.drawImage(cvsl, 0, 0);
				//
				this.transformedCtx.setTransform(1, 0, 0, 1, 0, 0);
			}
		}
		// set a clipping path and draw the transformed image on the destination canvas.
		this.destinationCtx.save();
		this._applyClipPath(this.destinationCtx, [
			[d0x, d0y],
			[d1x, d1y],
			[d2x, d2y],
			[d3x, d3y],
		]);
		this.destinationCtx.drawImage(this.transformedCtx.canvas, 0, 0);
		this.destinationCtx.restore();
	}

	private _applyClipPath(ctx: CanvasContext2DLike, points: [number, number][]) {
		ctx.beginPath();
		ctx.moveTo(points[0][0], points[0][1]);
		for (let i = 1; i < points.length; i++) {
			ctx.lineTo(points[i][0], points[i][1]);
		}
		ctx.closePath();
		ctx.clip();
	}
}
