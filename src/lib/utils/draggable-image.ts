export interface DraggableImage {
  img: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  isResizing?: boolean;
  initialWidth?: number;
  initialHeight?: number;
}
