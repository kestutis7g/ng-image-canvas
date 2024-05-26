import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasComponent } from './ng-image-canvas.component';

@NgModule({
  declarations: [CanvasComponent],
  imports: [CommonModule],
  exports: [CanvasComponent]
})
export class NgImageCanvasModule { }
