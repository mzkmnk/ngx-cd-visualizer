import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxCdVisualizer } from './ngx-cd-visualizer';

describe('NgxCdVisualizer', () => {
  let component: NgxCdVisualizer;
  let fixture: ComponentFixture<NgxCdVisualizer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxCdVisualizer],
    }).compileComponents();

    fixture = TestBed.createComponent(NgxCdVisualizer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
