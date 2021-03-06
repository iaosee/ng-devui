import { Component } from '@angular/core';
import { DevuiSourceData } from 'ng-devui/shared/devui-codebox';

@Component({
  selector: 'd-upload-demo',
  templateUrl: './upload-demo.component.html',
})
export class UploadDemoComponent {
  basicSource: Array<DevuiSourceData> = [
    { title: 'HTML', language: 'xml', code: require('!!raw-loader!./basic/basic.component.html') },
    { title: 'TS', language: 'typescript', code: require('!!raw-loader!./basic/basic.component.ts') }
  ];
  multiSource: Array<DevuiSourceData> = [
    { title: 'HTML', language: 'xml', code: require('!!raw-loader!./multi/multi.component.html') },
    { title: 'TS', language: 'typescript', code: require('!!raw-loader!./multi/multi.component.ts') }
  ];
  customizeSource: Array<DevuiSourceData> = [
    { title: 'HTML', language: 'xml', code: require('!!raw-loader!./customize/customize.component.html') },
    { title: 'TS', language: 'typescript', code: require('!!raw-loader!./customize/customize.component.ts') },
    { title: 'SCSS', language: 'css', code: require('!!raw-loader!./customize/customize.component.scss') }
  ];
  autoSource: Array<DevuiSourceData> = [
    { title: 'HTML', language: 'xml', code: require('!!raw-loader!./auto/auto.component.html') },
    { title: 'TS', language: 'typescript', code: require('!!raw-loader!./auto/auto.component.ts') }
  ];
  dynamicUploadOptionsSource: Array<DevuiSourceData> = [
    { title: 'HTML', language: 'xml', code: require('!!raw-loader!./dynamic-upload-options/dynamic-upload-options.component.html') },
    { title: 'TS', language: 'typescript', code: require('!!raw-loader!./dynamic-upload-options/dynamic-upload-options.component.ts') }
  ];
  customizeAreaUploadSource: Array<DevuiSourceData> = [
    { title: 'HTML', language: 'xml', code: require('!!raw-loader!./customize-area-upload/customize-area-upload.component.html') },
    { title: 'TS', language: 'typescript', code: require('!!raw-loader!./customize-area-upload/customize-area-upload.component.ts') },
    { title: 'SCSS', language: 'css', code: require('!!raw-loader!./customize-area-upload/customize-area-upload.component.scss') }
  ];
  navItems = [
    { dAnchorLink: 'basic-usage', value: '基本用法' },
    { dAnchorLink: 'multi-files', value: '多文件上传' },
    { dAnchorLink: 'auto-upload', value: '自动上传' },
    { dAnchorLink: 'custom', value: '自定义' },
    { dAnchorLink: 'dynamic-upload-options', value: '动态上传参数' },
    { dAnchorLink: 'customize-area-upload', value: '任意区域上传' }
  ];
  constructor() {
  }
}
