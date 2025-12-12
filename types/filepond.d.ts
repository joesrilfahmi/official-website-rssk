// types/filepond.d.ts
declare module 'filepond/dist/filepond.min.css';
declare module 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

declare module 'react-filepond' {
  import { Component } from 'react';

  export interface FilePondFile {
    id: string;
    serverId: string | null;
    origin: number;
    status: number;
    file: File;
    fileSize: number;
    fileType: string;
    filename: string;
    filenameWithoutExtension: string;
    fileExtension: string;
    source: string | File | Blob;
  }

  export type ProcessServerConfigFunction = (
    fieldName: string,
    file: Blob & { 
      readonly lastModified: number; 
      readonly name: string; 
      readonly webkitRelativePath: string;
    },
    metadata: Record<string, unknown>,
    load: (uniqueFileId: string) => void,
    error: (errorText: string) => void,
    progress: (computable: boolean, loadedSize: number, totalSize: number) => void,
    abort: () => void,
    transfer?: (transferId: string) => void,
    options?: Record<string, unknown>
  ) => { abort: () => void } | void;

  export interface ServerUrl {
    url?: string;
    timeout?: number;
    headers?: Record<string, string>;
    withCredentials?: boolean;
  }

  export interface ServerConfig {
    process?: string | ServerUrl | ProcessServerConfigFunction | null;
    revert?: string | ServerUrl | ((uniqueFileId: string, load: () => void, error: (errorText: string) => void) => void) | null;
    restore?: string | ServerUrl | null;
    load?: string | ServerUrl | null;
    fetch?: string | ServerUrl | null;
    patch?: string | ServerUrl | null;
    remove?: ((source: string, load: () => void, error: (errorText: string) => void) => void) | null;
  }

  export interface FilePondProps {
    files?: Array<string | File | Blob>;
    onupdatefiles?: (fileItems: FilePondFile[]) => void;
    allowMultiple?: boolean;
    maxFiles?: number;
    disabled?: boolean;
    server?: string | ServerUrl | ServerConfig;
    name?: string;
    labelIdle?: string;
    acceptedFileTypes?: string[];
    fileValidateTypeLabelExpectedTypes?: string;
    maxFileSize?: string | number;
    labelMaxFileSizeExceeded?: string;
    labelMaxFileSize?: string;
    credits?: boolean | string;
    stylePanelLayout?: 'integrated' | 'compact' | 'circle';
    allowDrop?: boolean;
    allowBrowse?: boolean;
    allowPaste?: boolean;
    allowReplace?: boolean;
    allowRevert?: boolean;
    allowRemove?: boolean;
    allowProcess?: boolean;
    instantUpload?: boolean;
    checkValidity?: boolean;
    itemInsertLocation?: 'before' | 'after' | ((a: FilePondFile, b: FilePondFile) => number);
    itemInsertInterval?: number;
    [key: string]: unknown;
  }

  export class FilePond extends Component<FilePondProps> {}
  export function registerPlugin(...plugins: unknown[]): void;
}

declare module 'filepond-plugin-image-preview' {
  const plugin: unknown;
  export default plugin;
}

declare module 'filepond-plugin-file-validate-type' {
  const plugin: unknown;
  export default plugin;
}

declare module 'filepond-plugin-file-validate-size' {
  const plugin: unknown;
  export default plugin;
}

declare module 'filepond-plugin-image-transform' {
  const plugin: unknown;
  export default plugin;
}