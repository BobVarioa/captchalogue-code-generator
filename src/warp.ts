// adapated from https://github.com/soquel/warp.js

import { CanvasContext2DLike, CanvasLike } from "./types.js";

export interface WarpOptions {
    inputCanvas: CanvasLike;
    viewportCanvas: CanvasLike;
    /**
     * Viewport top
     */
    top?: number;
    /**
     * Viewport left
     */
    left?: number;
}

export interface DeformSettings {
    center: { x: number; y: number };
    /**
     * (deg)
     */
    angle: number;
    /**
     * (px)
     */
    radius: number;
    /**
     * @see Warp.func
     */
    func?: (d: number) => number;
    /**
     * If the input canvas should be copied to output before deformation
     */
    copyInput?: boolean;
    /**
     * Should pixels with an alpha value less than this be skipped?
     * @default -1
     */
    alphaCutoff?: number;
}

export default class Warp {
    inputCanvas: CanvasLike;
    viewportCanvas: CanvasLike;
    ctx: CanvasContext2DLike;
    w: number;
    h: number;
    outputW: number;
    outputH: number;
    center: { x: number; y: number };
    left = 0;
    top = 0;
    alphaCutoff = -1;

    /**
     * Creates an instance of Warp
     */
    constructor(options: WarpOptions) {
        this.inputCanvas = options.inputCanvas;
        this.viewportCanvas = options.viewportCanvas;

        this.ctx = this.inputCanvas.getContext("2d");
        this.w = this.inputCanvas.width;
        this.h = this.inputCanvas.height;

        this.outputW = this.viewportCanvas.width;
        this.outputH = this.viewportCanvas.height;

        if (options.left != undefined) this.left = options.left;
        if (options.top != undefined) this.top = options.top;
    }

    /**
     * Calculates distance to `this.center`
     *
     * @private
     * @param x coordinate to calculate distance to
     * @param y coordinate to calculate distance to
     *
     */
    private _distance(x: number, y: number) {
        const xd = this.center.x - x;
        const yd = this.center.y - y;

        const d = Math.sqrt(xd * xd + yd * yd);

        return d;
    }

    /**
     * Default function which controls the deformation in terms of distance to origin (center)
     *
     * @param d from 0.0 to 1.0 telling how far along are we from the center (0.0 in the center, 1.0 at the edge of warp radius)
     * @return from 0.0 to 1.0 telling how much to rotate at this distance (0.0 no rotation, 1.0 full rotation)
     *
     */
    func(d: number): number {
        // linear
        return 1.0 - d;
    }

    /**
     * Performs actual deformation, copying pixels around in a buffer array, then back to input image.
     */
    deform(settings: DeformSettings) {
        // store letiables used by other private Warp functions
        this.center = settings.center;
        if (settings.alphaCutoff != undefined) this.alphaCutoff = settings.alphaCutoff;

        // deg2rad1
        settings.angle = (settings.angle * Math.PI) / 180;

        const input_img = this.ctx.getImageData(0, 0, this.w, this.h);

        const outputCtx = this.viewportCanvas.getContext("2d");

        // copy the input image in case the deformation doesn't occupy
        // whole viewport canvas
        if (settings.copyInput) {
            outputCtx.drawImage(this.inputCanvas, -this.left, -this.top);
        }

        const output_img = outputCtx.getImageData(0, 0, this.outputW, this.outputH);

        const func = settings.func || this.func;

        let angle: number;
        let dist: number;
        let inpX: number;
        let inpY: number;
        for (let y = 0; y < this.outputH; y++) {
            for (let x = 0; x < this.outputW; x++) {
                // calc position in input canvas
                inpX = x + this.left;
                inpY = y + this.top;

                dist = this._distance(inpX, inpY);

                if (dist < settings.radius) {
                    // calc amount of rotation at this
                    // distance (according to provided func())
                    angle = settings.angle * func(dist / settings.radius);

                    // pass the distance to avoid calculating
                    // it yet again in the function
                    this._warp_pixel(input_img, output_img, inpX, inpY, x, y, angle, dist);
                }
            }
        }

        outputCtx.putImageData(output_img, 0, 0);
    }

    /**
     * Warps one pixel around according to `angle`
     *
     * @private
     * @param input_img source image
     * @param output_img destination image
     * @param inp_x source pixel x coordinate (i.e. taken from input_img)
     * @param inp_y source pixel y coordinate (i.e. taken from input_img)
     * @param x destination pixel x coordinate (i.e. this is where the source pixel will land)
     * @param y destination pixel y coordinate (i.e. this is where the source pixel will land)
     * @param angle rotation angle
     * @param dist (optional) distance to center of deformation
     *
     */
    _warp_pixel(
        input_img: ImageData,
        output_img: ImageData,
        inp_x: number,
        inp_y: number,
        x: number,
        y: number,
        angle: number,
        dist: number,
    ) {
        const r = dist || this._distance(inp_x, inp_y);

        const a = Math.atan2(inp_y - this.center.y, inp_x - this.center.x);
        angle += a;

        // compute the pixel to copy from
        // "| 0" clamps to int
        const src_x = (this.center.x + Math.cos(angle) * r) | 0;
        const src_y = (this.center.y + Math.sin(angle) * r) | 0;

        // calculate actual positions in pixel arrays
        const src_pos = (src_y * this.w + src_x) * 4;
        const dest_pos = (y * this.outputW + x) * 4;

        // finish if we fall outside the boundary of original canvas
        if (src_x > this.w || src_x < 0 || src_pos > input_img.data.length || src_pos < 0) {
            return;
        }

        if (input_img.data[src_pos + 3] < this.alphaCutoff) {
            return;
        }

        // copy all 4 pixel bytes (RGBA)
        for (let i = 0; i < 4; i++) output_img.data[dest_pos + i] = input_img.data[src_pos + i];
    }
}
