export type CanvasLike = {
    getContext(context: "2d"): CanvasContext2DLike;
} & (HTMLCanvasElement | OffscreenCanvas);
export type CanvasContext2DLike = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
