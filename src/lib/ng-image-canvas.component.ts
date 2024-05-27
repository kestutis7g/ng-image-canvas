import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { DraggableImage } from './utils/draggable-image';

@Component({
  selector: 'ng-image-canvas',
  templateUrl: './ng-image-canvas.component.html',
  styleUrls: ['./styles.css'],
})
export class CanvasComponent implements OnInit, OnChanges {
  @Input() width: number = 800;
  @Input() height: number = 600;
  @Input() editing: boolean = true;
  @Input() resizeHandleSize: number = 10;
  @Input() resizeHandleColor: string = 'gray';
  @Input() closeButtonSize: number = 20;
  @Input() closeButtonBackgroundColor: string = 'red';
  @Input() closeButtonFontColor: string = 'white';
  @Output() imagesChange = new EventEmitter<DraggableImage[]>();
  @ViewChild('canvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private images: DraggableImage[] = [];
  private selectedImageIndex: number | null = null;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private isDragging: boolean = false;
  private isShiftPressed: boolean = false;

  /**
   * Initializes the canvas component.
   * Sets the width and height of the canvas, gets the 2D rendering context, and draws initial images.
   *
   * @returns void
   */
  ngOnInit(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = this.width;
    canvas.height = this.height;
    this.ctx = canvas.getContext('2d')!;
    this.drawImages();
  }

  /**
   * Responds to changes in the input properties.
   * Specifically handles changes to the `editing` property, resetting interactions and redrawing images.
   *
   * @param changes - An object of type `SimpleChanges` that holds the current and previous values of the input properties.
   * @returns void
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editing']) {
      this.resetInteractions();
      this.drawImages();
    }
  }

  /**
   * Resets interaction states of the images.
   * Clears the selected image index and dragging state, and stops resizing for all images.
   *
   * @returns void
   */
  resetInteractions(): void {
    this.selectedImageIndex = null;
    this.isDragging = false;
    this.images.forEach((image) => {
      image.isResizing = false;
    });
  }

  /**
   * Handles the drop event for adding new images to the canvas.
   * Reads the dropped file, creates a new `DraggableImage` object, adds it to the images array, and redraws the images.
   *
   * @param event - The drop event containing the file to be added.
   * @returns void
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.editing || event == null || event.dataTransfer == null) {
      return;
    }
    const file = event.dataTransfer.files[0];
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const draggableImage: DraggableImage = {
          img: img,
          x: 0,
          y: 0,
          width: img.width <= this.width ? img.width : 100,
          height:
            img.height <= this.height
              ? img.height
              : (img.height / img.width) * 100,
        };
        this.images.push(draggableImage);
        this.drawImages();
        this.emitImagesChange();
      };
    };
    reader.readAsDataURL(file);
  }

  /**
   * Draws all images on the canvas.
   * Clears the canvas, then draws each image and optionally their resize handles and close buttons.
   *
   * @returns void
   */
  drawImages(): void {
    if (this.ctx == null) {
      return;
    }
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.images.forEach((draggableImage) => {
      this.ctx!.drawImage(
        draggableImage.img,
        draggableImage.x,
        draggableImage.y,
        draggableImage.width,
        draggableImage.height
      );
      if (this.editing) {
        this.drawResizeHandles(draggableImage);
        this.drawCloseButton(draggableImage);
      }
    });
  }

  /**
   * Draws resize handles on the given image.
   *
   * @param image - The `DraggableImage` object on which to draw resize handles.
   * @returns void
   */
  drawResizeHandles(image: DraggableImage): void {
    this.ctx!.fillStyle = this.resizeHandleColor;
    this.ctx!.fillRect(
      image.x + image.width - this.resizeHandleSize,
      image.y + image.height - this.resizeHandleSize,
      this.resizeHandleSize,
      this.resizeHandleSize
    );
  }

  /**
   * Draws a close button on the given image.
   *
   * @param image - The `DraggableImage` object on which to draw a close button.
   * @returns void
   */
  drawCloseButton(image: DraggableImage): void {
    this.ctx.fillStyle = this.closeButtonBackgroundColor;
    this.ctx.fillRect(
      image.x + image.width - this.closeButtonSize,
      image.y,
      this.closeButtonSize,
      this.closeButtonSize
    );
    this.ctx.fillStyle = this.closeButtonFontColor;
    this.ctx.font = '16px Arial';
    this.ctx.fillText(
      'x',
      image.x + image.width - this.closeButtonSize / 2 - 4,
      image.y + this.closeButtonSize / 2 + 5
    );
  }

  /**
   * Handles the mouse down event on the canvas.
   * Checks if the mouse down is on an image or a close button, sets the selected image index, and prepares for dragging or resizing.
   *
   * @param event - The mouse event.
   * @returns void
   */
  onMouseDown(event: MouseEvent): void {
    if (!this.editing) return; // Disable mouse down when editing is disabled
    const { offsetX, offsetY } = event;

    // Check if click is on the close button
    this.selectedImageIndex = this.images.findIndex((img) => {
      const closeButtonBounds = {
        x: img.x + img.width - this.closeButtonSize,
        y: img.y,
        width: this.closeButtonSize,
        height: this.closeButtonSize,
      };
      return (
        offsetX >= closeButtonBounds.x &&
        offsetX <= closeButtonBounds.x + closeButtonBounds.width &&
        offsetY >= closeButtonBounds.y &&
        offsetY <= closeButtonBounds.y + closeButtonBounds.height
      );
    });

    if (this.selectedImageIndex !== -1) {
      this.images.splice(this.selectedImageIndex, 1);
      this.selectedImageIndex = null;
      this.drawImages();
      this.emitImagesChange();
      return;
    }

    // Check if click is on the image or resize handle
    this.selectedImageIndex = this.images.findIndex((img) => {
      const inImageBounds =
        offsetX >= img.x &&
        offsetX <= img.x + img.width &&
        offsetY >= img.y &&
        offsetY <= img.y + img.height;
      const inResizeBounds =
        offsetX >= img.x + img.width - this.resizeHandleSize &&
        offsetX <= img.x + img.width &&
        offsetY >= img.y + img.height - this.resizeHandleSize &&
        offsetY <= img.y + img.height;
      if (inResizeBounds) {
        img.isResizing = true;
        img.initialWidth = img.width;
        img.initialHeight = img.height;
      }
      return inImageBounds;
    });

    if (this.selectedImageIndex !== -1) {
      const img = this.images[this.selectedImageIndex];
      this.offsetX = offsetX - img.x;
      this.offsetY = offsetY - img.y;
      this.isDragging = true;
    }
  }

  /**
   * Handles the mouse move event on the canvas.
   * Drags or resizes the selected image based on the mouse movement.
   *
   * @param event - The mouse event.
   * @returns void
   */
  onMouseMove(event: MouseEvent): void {
    if (this.selectedImageIndex !== null) {
      const { offsetX, offsetY } = event;
      const img = this.images[this.selectedImageIndex];

      if (img.isResizing) {
        const aspectRatio = img.initialWidth! / img.initialHeight!;
        if (this.isShiftPressed) {
          const newWidth = Math.max(
            10,
            (img.initialWidth || 0) +
              (offsetX - img.x - (img.initialWidth || 0))
          );
          const newHeight = newWidth / aspectRatio;
          img.width = newWidth;
          img.height = newHeight;
        } else {
          img.width = Math.max(
            10,
            (img.initialWidth || 0) +
              (offsetX - img.x - (img.initialWidth || 0))
          );
          img.height = Math.max(
            10,
            (img.initialHeight || 0) +
              (offsetY - img.y - (img.initialHeight || 0))
          );
        }
      } else if (this.isDragging) {
        img.x = Math.min(
          Math.max(0, offsetX - this.offsetX),
          this.width - img.width
        );
        img.y = Math.min(
          Math.max(0, offsetY - this.offsetY),
          this.height - img.height
        );
      }
      this.drawImages();
    }
  }

  /**
   * Handles the mouse up event on the canvas.
   * Stops dragging or resizing the selected image.
   *
   * @returns void
   */
  onMouseUp(): void {
    if (this.selectedImageIndex !== null) {
      const img = this.images[this.selectedImageIndex];
      img.isResizing = false;
    }
    this.selectedImageIndex = null;
    this.isDragging = false;
  }

  /**
   * Handles the key down event on the document.
   * Sets the `isShiftPressed` flag when the Shift key is pressed.
   *
   * @param event - The keyboard event.
   * @returns void
   */
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Shift') {
      this.isShiftPressed = true;
    }
  }

  /**
   * Handles the key up event on the document.
   * Clears the `isShiftPressed` flag when the Shift key is released.
   *
   * @param event - The keyboard event.
   * @returns void
   */
  @HostListener('document:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Shift') {
      this.isShiftPressed = false;
    }
  }

  /**
   * Handles the drag over event on the canvas.
   * Prevents the default behavior to allow dropping.
   *
   * @param event - The drag event.
   * @returns void
   */
  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  /**
   * Emits the current list of draggable images.
   *
   * @returns void
   */
  private emitImagesChange(): void {
    this.imagesChange.emit(this.images);
  }

  /**
   * Gets the list of images on the canvas.
   *
   * @returns An array of `DraggableImage` objects.
   */
  getImages(): DraggableImage[] {
    return this.images;
  }

  /**
   * Sets the list of images on the canvas.
   * Redraws the images after setting.
   *
   * @param images - An array of `DraggableImage` objects.
   * @returns void
   */
  setImages(images: DraggableImage[]): void {
    this.images = images;
    this.drawImages();
  }
}
