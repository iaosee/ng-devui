import {
  Component,
  ElementRef,
  Input,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { fadeInOut } from 'ng-devui/utils';

@Component({
  selector: 'd-auto-complete-popup',
  templateUrl: './auto-complete-popup.component.html',
  styleUrls: ['auto-complete-popup.component.scss'],
  animations: [fadeInOut]
})
export class AutoCompletePopupComponent implements ControlValueAccessor {
  activeIndex = 0;
  @Input() cssClass: string;
  @Input() maxHeight: number;
  @Input() disabled: boolean;
  @Input() disabledKey: string;
  @Input() source: any[];
  @Input() position: any;
  @Input() isOpen: boolean;
  @Input() term: string;
  @Input() popTipsText: string;
  @Input() overview: string;
  @Input() itemTemplate: TemplateRef<any>;
  @Input() noResultItemTemplate: TemplateRef<any>;
  @Input() formatter: (item: any) => string;
  @Input() dropdown: boolean;
  @Input() selectWidth: any;
  @Input() enableLazyLoad: boolean;
  @ViewChild('selectMenuElement', { static: true }) selectMenuElement: ElementRef;
  showLoading = false;
  private value: any;
  labelMinHeight = 20; // position.top小于20px时候，表示光标在第一行
  private onChange = (_: any) => null;
  private onTouched = () => null;

  constructor() {
    this.formatter = (item: any) => item ? (item.label || item.toString()) : '';
    this.maxHeight = 300;
  }

  writeValue(obj: any): void {
    this.value = obj;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onSelect(event: any, item: any) {
    if (this.disabledKey && item[this.disabledKey]) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (this.overview === 'single') { // 单选场景和单行场景不需要冒泡
      event.preventDefault();
      event.stopPropagation();
    }

    this.value = item;
    this.onTouched();
    this.onChange({ type: 'select', value: this.value });
  }

  selectCurrentItem(event: any) {
    this.onSelect(event, this.source[this.activeIndex]);
  }

  onActiveIndexChange(index: any) {
    this.activeIndex = index;
  }

  reset() {
    this.activeIndex = 0;
  }

  next() {
    if (this.isOpen && this.source && this.source.length) {
      if (this.activeIndex === this.source.length - 1) {
        this.activeIndex = 0;
        return;
      }
      this.activeIndex = this.activeIndex + 1;
    }
  }

  prev() {
    if (this.isOpen && this.source && this.source.length) {
      if (this.activeIndex === 0) {
        this.activeIndex = this.source.length - 1;
        return;
      }
      this.activeIndex = this.activeIndex - 1;
    }
  }

  trackByFn(index: any, item: any) {
    return index;
  }

  animationEnd($event: any) {
    if (!this.isOpen) {
      const targetElement = this.selectMenuElement.nativeElement;
      targetElement.style.display = 'none';
    }
  }

  loadMoreEvent($event: any) {
    this.showLoading = true;
    this.onChange({ type: 'loadMore', value: this });
  }

  loadFinish($event: any) {
    this.showLoading = false;
  }
}