# ng-image-canvas

`ng-image-canvas` is an Angular library that provides a canvas component where users can drag and drop images, move them around, resize them, and remove them. The component supports enabling or disabling editing, and maintains the aspect ratio when resizing with the `Shift` key.

## Installation

To install the library, use the following command:

```bash
  npm install ng-image-canvas
```

## Usage

### Importing the Module

First, import the `NgImageCanvasModule` into component

```typescript
import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { NgImageCanvasModule } from "ng-image-canvas";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, NgImageCanvasModule],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {}
```

### Using the Component

You can use the `ng-image-canvas` component in your template as shown below:

```html
<ng-image-canvas
  [width]="800"
  [height]="600"
  [editing]="editingEnabled"
  [resizeHandleSize]="10"
  [resizeHandleColor]="'gray'"
  [closeButtonSize]="20"
  [closeButtonBackgroundColor]="'red'"
  [closeButtonFontColor]="'white'"
  (imagesChange)="onImagesChange($event)"
  #canvasComp
>
</ng-image-canvas>
<button (click)="toggleEditing()">Toggle Editing</button>
<button (click)="logImages()">Log Images</button>
<button (click)="addImage()">Add Image</button>
```

In your component, you can handle the image changes and control the editing state:

```typescript
import { Component, ViewChild } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { DraggableImage, NgImageCanvasModule } from "ng-image-canvas";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, NgImageCanvasModule],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  editingEnabled: boolean = true;
  @ViewChild("canvasComp") canvasComp;

  toggleEditing(): void {
    this.editingEnabled = !this.editingEnabled;
  }

  onImagesChange(images: DraggableImage[]): void {
    console.log("Images changed:", images);
  }

  logImages(): void {
    console.log(this.canvasComp.getImages());
  }

  addImage(): void {
    const newImage: DraggableImage = {
      img: new Image(),
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    };
    newImage.img.src = "https://via.placeholder.com/100";
    newImage.img.onload = () => {
      const images = this.canvasComp.getImages();
      images.push(newImage);
      this.canvasComp.setImages(images);
    };
  }
}
```

## Documentation

### Inputs

- `width: number`: The width of the canvas.
- `height: number`: The height of the canvas.
- `editing: boolean`: Enables or disables editing. When editing is true, users can move, resize, and remove images.
- `resizeHandleSize: number`: The size of image resize handle.
- `resizeHandleColor: string`: The color of image resize handle.
- `closeButtonSize: number`: Size of image remove button.
- `closeButtonBackgroundColor: string`: The background color of image remove button
- `closeButtonFontColor: string`: The color of 'x' on image remove button.

### Outputs

- `imagesChange: EventEmitter<DraggableImage[]>`: Emits the current list of images whenever they are added, moved, resized, or removed.

### Methods

- `getImages(): DraggableImage[]`: Returns the current list of images on the canvas.
- `setImages(images: DraggableImage[]): void`: Sets the list of images on the canvas and redraws it.

## Screenshots

### Canvas with Editing Enabled

![Canvas with Editing Enabled](https://github.com/kestutis7g/ng-image-canvas/blob/master/screenshots/canvas-editing-enabled.png)

### Canvas with Editing Disabled

![Canvas with Editing Disabled](https://github.com/kestutis7g/ng-image-canvas/blob/master/screenshots/canvas-editing-disabled.png)

## License

This project is licensed under the [MIT](https://choosealicense.com/licenses/mit/) License. See the LICENSE file for more details.

## Contributing

Contributions are welcome. You can start by looking at [issues](https://github.com/kestutis7g/ng-image-canvas/issues) or creating new Issue with proposal or bug report.
