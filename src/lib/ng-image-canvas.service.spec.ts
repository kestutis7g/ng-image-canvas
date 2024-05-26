import { TestBed } from '@angular/core/testing';

import { NgImageCanvasService } from './ng-image-canvas.service';

describe('NgImageCanvasService', () => {
  let service: NgImageCanvasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgImageCanvasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
