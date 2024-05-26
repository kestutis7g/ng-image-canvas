
import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { DraggableImage } from './utils/draggable-image';

@Component({
  selector: 'ng-image-canvas',
  templateUrl: './ng-image-canvas.component.html',
  styleUrls: ['./styles.css']
})
export class CanvasComponent implements OnInit, OnChanges {
  @Input() width: number = 800;
  @Input() height: number = 600;
  @Input() editing: boolean = true;
  @Input() resizeHandleSize: number = 10;
  @Input() resizeHandleColor: string = "gray";
  @Input() closeButtonSize: number = 20;
  @Input() closeButtonBackgroundColor: string = "red";
  @Input() closeButtonFontColor: string = "white";
  @Output() imagesChange = new EventEmitter<DraggableImage[]>();
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private images: DraggableImage[] = [];
  private selectedImageIndex: number | null = null;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private isDragging: boolean = false;
  private isShiftPressed: boolean = false;

  ngOnInit(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = this.width;
    canvas.height = this.height;
    this.ctx = canvas.getContext('2d')!;
    this.drawImages();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editing']) {
      this.resetInteractions();
      this.drawImages();
    }
  }

  resetInteractions(): void {
    this.selectedImageIndex = null;
    this.isDragging = false;
    this.images.forEach(image => {
      image.isResizing = false;
    });
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if(!this.editing || event == null || event.dataTransfer == null){
      return
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
          height: img.height <= this.height ? img.height : img.height / img.width * 100,
        };
        this.images.push(draggableImage);
        this.drawImages();
        this.emitImagesChange();
      };
    };
    reader.readAsDataURL(file);
  }

  drawImages(): void {
    if(this.ctx == null){
      return;
    }
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.images.forEach((draggableImage) => {
      this.ctx!.drawImage(draggableImage.img, draggableImage.x, draggableImage.y, draggableImage.width, draggableImage.height);
      if (this.editing) {
        this.drawResizeHandles(draggableImage);
        this.drawCloseButton(draggableImage);
      }
    });
  }

  drawResizeHandles(image: DraggableImage): void {
    this.ctx!.fillStyle = this.resizeHandleColor;
    this.ctx!.fillRect(image.x + image.width - this.resizeHandleSize, image.y + image.height - this.resizeHandleSize, this.resizeHandleSize, this.resizeHandleSize);
  }

  drawCloseButton(image: DraggableImage): void {
    this.ctx.fillStyle = this.closeButtonBackgroundColor;
    this.ctx.fillRect(image.x + image.width - this.closeButtonSize, image.y, this.closeButtonSize, this.closeButtonSize);
    this.ctx.fillStyle = this.closeButtonFontColor;
    this.ctx.font = '16px Arial';
    this.ctx.fillText('x', image.x + image.width - this.closeButtonSize / 2 - 4, image.y + this.closeButtonSize / 2 + 5);
  }

  onMouseDown(event: MouseEvent): void {
    if (!this.editing) return; // Disable mouse down when editing is disabled

    const { offsetX, offsetY } = event;

    // Check if click is on the close button
    this.selectedImageIndex = this.images.findIndex((img) => {
      const closeButtonBounds = {
        x: img.x + img.width - this.closeButtonSize,
        y: img.y,
        width: this.closeButtonSize,
        height: this.closeButtonSize
      };
      return offsetX >= closeButtonBounds.x && offsetX <= closeButtonBounds.x + closeButtonBounds.width &&
             offsetY >= closeButtonBounds.y && offsetY <= closeButtonBounds.y + closeButtonBounds.height;
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
      const inImageBounds = offsetX >= img.x && offsetX <= img.x + img.width &&
                            offsetY >= img.y && offsetY <= img.y + img.height;
      const inResizeBounds = offsetX >= img.x + img.width - this.resizeHandleSize &&
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

  onMouseMove(event: MouseEvent): void {
    if (this.selectedImageIndex !== null) {
      const { offsetX, offsetY } = event;
      const img = this.images[this.selectedImageIndex];

      if (img.isResizing) {
        const aspectRatio = img.initialWidth! / img.initialHeight!;
        if (this.isShiftPressed) {
          const newWidth = Math.max(10, (img.initialWidth || 0) + (offsetX - img.x - (img.initialWidth || 0)));
          const newHeight = newWidth / aspectRatio;
          img.width = newWidth;
          img.height = newHeight;
        } else {
          img.width = Math.max(10, (img.initialWidth || 0) + (offsetX - img.x - (img.initialWidth || 0)));
          img.height = Math.max(10, (img.initialHeight || 0) + (offsetY - img.y - (img.initialHeight || 0)));
        }
      } else if (this.isDragging) {
        img.x = Math.min(Math.max(0, offsetX - this.offsetX), this.width - img.width);
        img.y = Math.min(Math.max(0, offsetY - this.offsetY), this.height - img.height);
      }
      this.drawImages();
    }
  }

  onMouseUp(): void {
    if (this.selectedImageIndex !== null) {
      const img = this.images[this.selectedImageIndex];
      img.isResizing = false;
    }
    this.selectedImageIndex = null;
    this.isDragging = false;
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Shift') {
      this.isShiftPressed = true;
    }
  }

  @HostListener('document:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Shift') {
      this.isShiftPressed = false;
    }
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private emitImagesChange(): void {
    this.imagesChange.emit(this.images);
  }

  // Method to get the list of images
  getImages(): DraggableImage[] {
    return this.images;
  }

  // Method to set the list of images
  setImages(images: DraggableImage[]): void {
    this.images = images;
    this.drawImages();
  }
}
