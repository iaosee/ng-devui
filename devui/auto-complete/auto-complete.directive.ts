import {
  ChangeDetectorRef,
  ComponentFactoryResolver,
  ComponentRef,
  Directive,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostListener,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewContainerRef,
  HostBinding,
  SimpleChanges,
  OnChanges,
  Renderer2
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { fromEvent, Observable, Subscription, of } from 'rxjs';
import { map, filter, debounceTime, switchMap, tap } from 'rxjs/operators';
import { PositionService } from 'ng-devui/position';
import { AutoCompletePopupComponent } from './auto-complete-popup.component';

@Directive({
  selector: '[dAutoComplete]',
  exportAs: 'autoComplete',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AutoCompleteDirective),
    multi: true
  }]
})
export class AutoCompleteDirective implements OnInit, OnDestroy, OnChanges, ControlValueAccessor {
  @HostBinding('attr.autocomplete') autocomplete = 'off';
  @HostBinding('attr.autocapitalize') autocapitalize = 'off';
  @HostBinding('attr.autocorrect') autocorrect = 'off';
  @Input() disabled: boolean;
  @Input() cssClass: string;
  @Input() delay: number;
  @Input() minLength: number;
  @Input() itemTemplate: TemplateRef<any>;
  @Input() noResultItemTemplate: TemplateRef<any>;
  @Input() formatter: (item: any) => string;
  @Input() sceneType = ''; // sceneType使用场景：select(下拉框) suggest(联想)
  @Input() tipsText = ''; // 提示文字
  /*
 overview: border none multiline single
 */
  @Input() overview: string;
  @Input() latestSource: any[]; // 最近输入
  @Input() source: any[];
  @Input() valueParser: (item: any) => any;
  @Input() searchFn: (term: string, target?: AutoCompleteDirective) => Observable<any[]>;
  @Input() dropdown: boolean;
  @Input() maxHeight = 300;
  @Input() disabledKey: string;
  /**
   *  【可选】启用数据懒加载，默认不启用
   */
  @Input() enableLazyLoad = false;
  @Output() loadMore = new EventEmitter<any>();
  @Output() selectValue = new EventEmitter<any>();
  @Output() transInputFocusEmit = new EventEmitter<any>(); // input状态传给父组件函数
  KEYBOARD_EVENT_NOT_REFRESH = ['escape', 'enter', 'arrowup', 'arrowdown',
    /*ie 10 edge */ 'esc', 'up', 'down'];
  popupRef: ComponentRef<AutoCompletePopupComponent>;

  popTipsText = '';
  position: any;
  focus = false;

  private valueChanges: Observable<any[]>;
  private value: any;
  private placement = 'bottom-left';
  private subscription: Subscription;
  private onChange = (_: any) => null;
  private onTouched = () => null;

  constructor(private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef,
    private componentFactoryResolver: ComponentFactoryResolver,
    private renderer: Renderer2,
    private injector: Injector,
    private positionService: PositionService,
    private changeDetectorRef: ChangeDetectorRef) {
    this.delay = 300;
    this.valueChanges = this.registerInputEvent(elementRef);
    this.minLength = 1;
    this.itemTemplate = null;
    this.noResultItemTemplate = null;
    this.formatter = (item: any) => item ? (item.label || item.toString()) : '';
    this.valueParser = (item: any) => item;
  }

  ngOnInit() {
    // 调用时机：input keyup
    this.subscription = this.valueChanges
      .subscribe(source => this.onSourceChange(source));

    // 动态的创建了popup组件，
    const factory = this.componentFactoryResolver.resolveComponentFactory(AutoCompletePopupComponent);
    this.popupRef = this.viewContainerRef.createComponent(factory, this.viewContainerRef.length, this.injector);

    this.fillPopup(this.source);

    if (!this.searchFn) {
      this.searchFn = (term) => {
        return of(this.source.filter(lang => this.formatter(lang).toLowerCase().indexOf(term.toLowerCase()) !== -1));
      };
    }

    // 调用时机：选中回车或者鼠标单击下拉选项
    this.popupRef.instance.registerOnChange(item => {
      if (item.type === 'loadMore') {
        this.loadMore.emit(item.value);
        return;
      }
      const value = this.valueParser(item.value);
      this.writeValue(value);
      this.onChange(value);
      this.hidePopup();
      this.selectValue.emit(item.value);
      if (this.overview && this.overview !== 'single') {
        setTimeout(() => { // 这里稍微延迟一下，等待光标的位置发生变化，好重新获取光标的位置
          this.restLatestSource();
        }, 0);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && this.popupRef && changes.source) {
      this.fillPopup(this.source);
    }
  }

  restLatestSource() {
    if (this.latestSource && this.latestSource.length > 0) {
      this.writeValue('');
      this.clearInputValue();
      this.showLatestSource();
    }
  }

  // 调用时机：input keyup
  onSourceChange(source: any) {
    if (!this.elementRef.nativeElement.value) {
      if (this.sceneType !== 'select') { // 下拉场景不展示最近输入
        this.showLatestSource();
      } else {
        this.showSource(source, true, true);
      }
    } else {
      this.showSource(source, true, true);
    }
  }

  private showLatestSource() {
    let tempSource = [];
    if (this.latestSource && this.latestSource.length > 0) {
      this.searchFn('').subscribe(source => {
        const t = this.latestSource.slice(-5); // 最近输入只支持最多5个，截取后5项
        tempSource = t.filter(data => {
          if (!data.label) {
            return source.find(item => item === data);
          } else {
            return source.find(item => item.label === data.label);
          }
        });

        const pop = this.popupRef.instance;
        pop.reset();
        this.popTipsText = '最近输入';
        this.fillPopup(tempSource);
        pop.isOpen = true;
        this.changeDetectorRef.markForCheck();
      });
    }

    if (tempSource.length <= 0) {
      this.hidePopup();
    }
  }

  private showSource(source: any, setOpen: any, isReset: any) {
    if ((source && source.length) || this.noResultItemTemplate) {
      const pop = this.popupRef.instance;
      if (isReset) {
        pop.reset();
      }
      this.popTipsText = this.tipsText || '';
      this.fillPopup(source, this.value);
      if (setOpen) {
        pop.isOpen = true;
      }
      this.changeDetectorRef.markForCheck();
    } else {
      this.hidePopup();
    }
  }

  writeValue(obj: any): void {
    this.value = this.formatter(obj) || '';
    this.writeInputValue(this.value);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.renderer.setProperty(this.elementRef.nativeElement, 'disabled', isDisabled);
    if (this.popupRef) {
      this.popupRef.instance.setDisabledState(isDisabled);
    }
  }

  ngOnDestroy() {
    this.unSubscription();
  }

  @HostListener('focus', ['$event'])
  onFocus($event: any) {
    this.focus = true;
    this.transInputFocusEmit.emit({
      focus: true,
      popupRef: this.popupRef
    });
    const isOpen = this.sceneType !== 'select';
    if (this.sceneType === 'select') {
      this.searchFn('').subscribe(source => {
        this.showSource(source, isOpen, false);
      });
    } else {
      if (!this.elementRef.nativeElement.value) {
        this.showLatestSource();
      } else {
        this.searchFn(this.elementRef.nativeElement.value).subscribe(source => {
          this.showSource(source, true, false);
        });
      }
    }
  }

  @HostListener('blur', ['$event'])
  onBlur($event: any) {
    this.focus = false;
    this.onTouched();
  }

  @HostListener('keydown.esc', ['$event'])
  onEscKeyup($event: any) {
    this.hidePopup();
  }

  @HostListener('keydown.Enter', ['$event'])
  onEnterKeyDown($event: any) {
    if (!this.popupRef.instance.source || !this.popupRef.instance.isOpen) {
      return;
    }
    if (this.popupRef) {
      this.popupRef.instance.selectCurrentItem($event);
    }
  }

  @HostListener('keydown.ArrowUp', ['$event'])
  onArrowUpKeyDown($event: any) {
    if (this.popupRef) {
      $event.preventDefault();
      $event.stopPropagation();
      this.popupRef.instance.prev();
    }
  }

  @HostListener('keydown.ArrowDown', ['$event'])
  onArrowDownKeyDown($event: any) {
    if (this.popupRef) {
      $event.preventDefault();
      $event.stopPropagation();
      this.popupRef.instance.next();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick($event: Event) {
    if (this.focus) {
      this.transInputFocusEmit.emit({
        focus: this.focus,
        popupRef: this.popupRef
      });
    }
    if (this.popupRef && !this.popupRef.instance.isOpen) {
      return;
    }

    const hostElement = this.elementRef.nativeElement;
    if (!hostElement.contains($event.target)) {
      this.hidePopup();
      this.transInputFocusEmit.emit({
        focus: false,
        popupRef: this.popupRef
      });
    }
  }

  private hidePopup() {
    if (this.popupRef) {
      this.popupRef.instance.isOpen = false;
    }
  }

  private fillPopup(source?: any, term?: string) {
    this.position = this.positionService.position(this.elementRef.nativeElement);
    const pop = this.popupRef.instance;
    pop.source = source;
    pop.maxHeight = this.maxHeight;
    pop.term = term;
    pop.disabledKey = this.disabledKey;
    pop.enableLazyLoad = this.enableLazyLoad;
    ['formatter', 'itemTemplate', 'noResultItemTemplate', 'cssClass', 'dropdown', 'popTipsText', 'position', 'overview']
      .forEach(key => {
        if (this[key] !== undefined) {
          pop[key] = this[key];
        }
      });
  }

  private writeInputValue(value: any) {
    this.renderer.setProperty(this.elementRef.nativeElement, 'value', value);
  }

  private clearInputValue() {
    this.renderer.setProperty(this.elementRef.nativeElement, 'value', '');
  }

  private unSubscription() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  onTermChange(term: any) {
    this.value = term;
    if (this.popupRef) {
      this.popupRef.instance.term = term;
    }
    this.onChange(term);
  }

  private registerInputEvent(elementRef: ElementRef) {
    return fromEvent(elementRef.nativeElement, 'keyup')
      .pipe(
        filter((e: KeyboardEvent) => {
          return this.KEYBOARD_EVENT_NOT_REFRESH.indexOf(e.key.toLocaleLowerCase()) === -1;
        }),
        map((e: any) => e.target.value),
        tap(term => this.onTouched()),
        filter(term => !this.disabled && this.searchFn && term.length >= 0),
        debounceTime(this.delay),
        tap(term => this.onTermChange(term)),
        switchMap(term => this.searchFn(term, this))
      );
  }
}
