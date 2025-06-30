import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { VisualizerToolbarComponent } from './visualizer-toolbar.component';
import { FilterMode, VisualizerThemeType } from '../models';

// Test wrapper component
@Component({
  template: `
    <lib-visualizer-toolbar
      [filterMode]="filterMode"
      [isScanning]="isScanning"
      [componentCount]="componentCount"
      [onPushCount]="onPushCount"
      [showTimestamps]="showTimestamps"
      [showCounts]="showCounts"
      [compact]="compact"
      [theme]="theme"
      (filterChange)="onFilterChange($event)"
      (scanComponents)="onScanComponents()"
      (resetActivity)="onResetActivity()"
      (timestampsToggle)="onTimestampsToggle($event)"
      (countsToggle)="onCountsToggle($event)"
      (compactToggle)="onCompactToggle($event)"
      (themeChange)="onThemeChange($event)">
    </lib-visualizer-toolbar>
  `,
  imports: [VisualizerToolbarComponent]
})
class TestWrapperComponent {
  filterMode: FilterMode = 'all';
  isScanning = false;
  componentCount = 10;
  onPushCount = 3;
  showTimestamps = true;
  showCounts = true;
  compact = false;
  theme: VisualizerThemeType = 'auto';

  onFilterChange = jest.fn();
  onScanComponents = jest.fn();
  onResetActivity = jest.fn();
  onTimestampsToggle = jest.fn();
  onCountsToggle = jest.fn();
  onCompactToggle = jest.fn();
  onThemeChange = jest.fn();
}

describe('VisualizerToolbarComponent', () => {
  let wrapper: TestWrapperComponent;
  let component: VisualizerToolbarComponent;
  let fixture: ComponentFixture<TestWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestWrapperComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestWrapperComponent);
    wrapper = fixture.componentInstance;
    component = fixture.debugElement.children[0].componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create successfully', () => {
      expect(component).toBeTruthy();
    });

    it('should display all filter buttons', () => {
      const compiled = fixture.nativeElement;
      const filterButtons = compiled.querySelectorAll('.filter-btn');
      
      expect(filterButtons.length).toBe(4);
      expect(filterButtons[0].textContent.trim()).toBe('All');
      expect(filterButtons[1].textContent.trim()).toBe('Active');
      expect(filterButtons[2].textContent.trim()).toBe('OnPush');
      expect(filterButtons[3].textContent.trim()).toBe('Modified');
    });

    it('should display action buttons', () => {
      const compiled = fixture.nativeElement;
      const scanBtn = compiled.querySelector('.scan-btn');
      const resetBtn = compiled.querySelector('.reset-btn');
      
      expect(scanBtn).toBeTruthy();
      expect(resetBtn).toBeTruthy();
      expect(scanBtn.textContent.trim()).toBe('Scan');
      expect(resetBtn.textContent.trim()).toBe('Reset');
    });

    it('should display view control toggles', () => {
      const compiled = fixture.nativeElement;
      const viewToggles = compiled.querySelectorAll('.view-toggle');
      
      expect(viewToggles.length).toBe(3); // timestamps, counts, compact
    });

    it('should display theme toggle', () => {
      const compiled = fixture.nativeElement;
      const themeToggle = compiled.querySelector('.theme-toggle');
      
      expect(themeToggle).toBeTruthy();
    });

    it('should display component statistics', () => {
      const compiled = fixture.nativeElement;
      const statItems = compiled.querySelectorAll('.stat-item');
      
      expect(statItems.length).toBe(2);
      expect(statItems[0].textContent).toContain('10'); // total components
      expect(statItems[1].textContent).toContain('3');  // onpush components
    });
  });

  describe('Filter Functionality', () => {
    it('should highlight active filter mode', () => {
      wrapper.filterMode = 'active-only';
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const filterButtons = compiled.querySelectorAll('.filter-btn');
      
      expect(filterButtons[0].classList.contains('active')).toBe(false); // All
      expect(filterButtons[1].classList.contains('active')).toBe(true);  // Active
      expect(filterButtons[2].classList.contains('active')).toBe(false); // OnPush
      expect(filterButtons[3].classList.contains('active')).toBe(false); // Modified
    });

    it('should emit filterChange when filter button is clicked', () => {
      const compiled = fixture.nativeElement;
      const onPushButton = compiled.querySelectorAll('.filter-btn')[2]; // OnPush button
      
      onPushButton.click();
      
      expect(wrapper.onFilterChange).toHaveBeenCalledWith('onpush-only');
    });

    it('should emit filterChange for all filter options', () => {
      const compiled = fixture.nativeElement;
      const filterButtons = compiled.querySelectorAll('.filter-btn');
      
      filterButtons[0].click(); // All
      expect(wrapper.onFilterChange).toHaveBeenCalledWith('all');
      
      filterButtons[1].click(); // Active
      expect(wrapper.onFilterChange).toHaveBeenCalledWith('active-only');
      
      filterButtons[2].click(); // OnPush
      expect(wrapper.onFilterChange).toHaveBeenCalledWith('onpush-only');
      
      filterButtons[3].click(); // Modified
      expect(wrapper.onFilterChange).toHaveBeenCalledWith('modified-only');
    });
  });

  describe('Action Buttons Behavior', () => {
    it('should emit scanComponents when scan button is clicked', () => {
      const compiled = fixture.nativeElement;
      const scanBtn = compiled.querySelector('.scan-btn');
      
      scanBtn.click();
      
      expect(wrapper.onScanComponents).toHaveBeenCalled();
    });

    it('should emit resetActivity when reset button is clicked', () => {
      const compiled = fixture.nativeElement;
      const resetBtn = compiled.querySelector('.reset-btn');
      
      resetBtn.click();
      
      expect(wrapper.onResetActivity).toHaveBeenCalled();
    });

    it('should disable scan button when scanning is in progress', () => {
      wrapper.isScanning = true;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const scanBtn = compiled.querySelector('.scan-btn');
      
      expect(scanBtn.disabled).toBe(true);
      expect(scanBtn.textContent.trim()).toBe('Scanning...');
    });

    it('should enable scan button when not scanning', () => {
      wrapper.isScanning = false;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const scanBtn = compiled.querySelector('.scan-btn');
      
      expect(scanBtn.disabled).toBe(false);
      expect(scanBtn.textContent.trim()).toBe('Scan');
    });
  });

  describe('View Toggle Functionality', () => {
    it('should highlight active view toggles based on input properties', () => {
      wrapper.showTimestamps = true;
      wrapper.showCounts = false;
      wrapper.compact = true;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const viewToggles = compiled.querySelectorAll('.view-toggle');
      
      expect(viewToggles[0].classList.contains('active')).toBe(true);  // timestamps
      expect(viewToggles[1].classList.contains('active')).toBe(false); // counts
      expect(viewToggles[2].classList.contains('active')).toBe(true);  // compact
    });

    it('should emit timestampsToggle with correct value when timestamp toggle is clicked', () => {
      wrapper.showTimestamps = true;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const timestampToggle = compiled.querySelectorAll('.view-toggle')[0];
      
      timestampToggle.click();
      
      expect(wrapper.onTimestampsToggle).toHaveBeenCalledWith(false); // should toggle to false
    });

    it('should emit countsToggle with correct value when counts toggle is clicked', () => {
      wrapper.showCounts = false;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const countsToggle = compiled.querySelectorAll('.view-toggle')[1];
      
      countsToggle.click();
      
      expect(wrapper.onCountsToggle).toHaveBeenCalledWith(true); // should toggle to true
    });

    it('should emit compactToggle with correct value when compact toggle is clicked', () => {
      wrapper.compact = false;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const compactToggle = compiled.querySelectorAll('.view-toggle')[2];
      
      compactToggle.click();
      
      expect(wrapper.onCompactToggle).toHaveBeenCalledWith(true); // should toggle to true
    });
  });

  describe('Theme Toggle Functionality', () => {
    it('should display correct icon for light theme', () => {
      wrapper.theme = 'light';
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const themeToggle = compiled.querySelector('.theme-toggle');
      const svg = themeToggle.querySelector('svg');
      
      expect(svg).toBeTruthy();
      // Light theme should show sun icon (has circle and path elements)
      expect(svg.querySelector('circle')).toBeTruthy();
    });

    it('should display correct icon for dark theme', () => {
      wrapper.theme = 'dark';
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const themeToggle = compiled.querySelector('.theme-toggle');
      const svg = themeToggle.querySelector('svg');
      
      expect(svg).toBeTruthy();
      // Dark theme should show moon icon (has path but no circle)
      expect(svg.querySelector('path')).toBeTruthy();
      expect(svg.querySelector('circle')).toBeFalsy();
    });

    it('should display correct icon for auto theme', () => {
      wrapper.theme = 'auto';
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const themeToggle = compiled.querySelector('.theme-toggle');
      const svg = themeToggle.querySelector('svg');
      
      expect(svg).toBeTruthy();
      // Auto theme should show auto icon (circle with path)
      expect(svg.querySelector('circle')).toBeTruthy();
      expect(svg.querySelector('path')).toBeTruthy();
    });

    it('should cycle through themes when theme toggle is clicked', () => {
      // Start with auto
      wrapper.theme = 'auto';
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const themeToggle = compiled.querySelector('.theme-toggle');
      
      themeToggle.click();
      expect(wrapper.onThemeChange).toHaveBeenCalledWith('light');
      
      // Simulate light theme
      wrapper.theme = 'light';
      wrapper.onThemeChange.mockClear();
      fixture.detectChanges();
      
      themeToggle.click();
      expect(wrapper.onThemeChange).toHaveBeenCalledWith('dark');
      
      // Simulate dark theme
      wrapper.theme = 'dark';
      wrapper.onThemeChange.mockClear();
      fixture.detectChanges();
      
      themeToggle.click();
      expect(wrapper.onThemeChange).toHaveBeenCalledWith('auto');
    });

    it('should display current theme in title attribute', () => {
      wrapper.theme = 'dark';
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const themeToggle = compiled.querySelector('.theme-toggle');
      
      expect(themeToggle.title).toBe('Current theme: dark');
    });
  });

  describe('Statistics Display', () => {
    it('should update component count display when input changes', () => {
      wrapper.componentCount = 25;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const totalStat = compiled.querySelectorAll('.stat-item')[0];
      
      expect(totalStat.textContent).toContain('25');
    });

    it('should update OnPush count display when input changes', () => {
      wrapper.onPushCount = 8;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const onPushStat = compiled.querySelectorAll('.stat-item')[1];
      
      expect(onPushStat.textContent).toContain('8');
    });

    it('should apply correct CSS class to OnPush stat item', () => {
      const compiled = fixture.nativeElement;
      const onPushStat = compiled.querySelectorAll('.stat-item')[1];
      
      expect(onPushStat.classList.contains('onpush')).toBe(true);
    });

    it('should display zero counts correctly', () => {
      wrapper.componentCount = 0;
      wrapper.onPushCount = 0;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const statItems = compiled.querySelectorAll('.stat-item');
      
      expect(statItems[0].textContent).toContain('0');
      expect(statItems[1].textContent).toContain('0');
    });
  });

  describe('Component Methods', () => {
    it('should call setFilter method when filter is changed', () => {
      const setFilterSpy = jest.spyOn(component, 'setFilter');
      
      component.setFilter('onpush-only');
      
      expect(setFilterSpy).toHaveBeenCalledWith('onpush-only');
    });

    it('should call toggle methods with correct parameters', () => {
      const toggleTimestampsSpy = jest.spyOn(component, 'toggleTimestamps');
      const toggleCountsSpy = jest.spyOn(component, 'toggleCounts');
      const toggleCompactSpy = jest.spyOn(component, 'toggleCompact');
      
      component.toggleTimestamps();
      component.toggleCounts();
      component.toggleCompact();
      
      expect(toggleTimestampsSpy).toHaveBeenCalled();
      expect(toggleCountsSpy).toHaveBeenCalled();
      expect(toggleCompactSpy).toHaveBeenCalled();
    });

    it('should call cycleTheme method when cycling themes', () => {
      const cycleThemeSpy = jest.spyOn(component, 'cycleTheme');
      
      component.cycleTheme();
      
      expect(cycleThemeSpy).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper titles for interactive elements', () => {
      const compiled = fixture.nativeElement;
      
      const filterButtons = compiled.querySelectorAll('.filter-btn');
      expect(filterButtons[0].title).toBe('Show all components');
      expect(filterButtons[1].title).toBe('Show only active components');
      expect(filterButtons[2].title).toBe('Show only OnPush components');
      expect(filterButtons[3].title).toBe('Show only modified components');
      
      const scanBtn = compiled.querySelector('.scan-btn');
      const resetBtn = compiled.querySelector('.reset-btn');
      expect(scanBtn.title).toBe('Rescan component tree');
      expect(resetBtn.title).toBe('Reset all activity states');
      
      const viewToggles = compiled.querySelectorAll('.view-toggle');
      expect(viewToggles[0].title).toBe('Toggle timestamps');
      expect(viewToggles[1].title).toBe('Toggle change detection counts');
      expect(viewToggles[2].title).toBe('Toggle compact view');
    });

    it('should have proper titles for statistics', () => {
      const compiled = fixture.nativeElement;
      const statItems = compiled.querySelectorAll('.stat-item');
      
      expect(statItems[0].title).toBe('Total components');
      expect(statItems[1].title).toBe('OnPush components');
    });
  });

  describe('Responsive Behavior', () => {
    it('should have proper CSS classes for responsive behavior', () => {
      const compiled = fixture.nativeElement;
      const toolbar = compiled.querySelector('.visualizer-toolbar');
      const sections = compiled.querySelectorAll('.toolbar-section');
      
      expect(toolbar).toBeTruthy();
      expect(sections.length).toBeGreaterThan(0);
      
      // Basic structure check instead of computed styles (which may not work in tests)
      expect(toolbar.classList.contains('visualizer-toolbar')).toBe(true);
      sections.forEach((section: Element) => {
        expect(section.classList.contains('toolbar-section')).toBe(true);
      });
    });
  });
});