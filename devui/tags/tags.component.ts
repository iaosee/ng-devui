import { Component, Input, Output, EventEmitter, TemplateRef, ContentChild } from '@angular/core';

@Component({
  selector: 'd-tags',
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.scss'],
  exportAs: 'Tags',
  preserveWhitespaces: false,
})

export class TagsComponent {
  /**
  * 【必选】记录输入的标签
  */
  @Input() tags = [];
  /**
   * 【可选】使用的属性名
   */
  @Input() displayProperty = '';

  @Input() deletable = false;

  @Input() titleProperty = '';

  @ContentChild(TemplateRef) customViewTemplate: TemplateRef<any>;
  /**
   * tag被删除后触发
   */
  @Output() tagDelete = new EventEmitter<any>();

  removeTag($event, tag, index) {
    this.tagDelete.emit({ tag: tag, index: index, event: $event });
  }

}
