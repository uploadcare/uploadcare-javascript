import {ProgressParamsInterface, SettingsInterface, UploadcareFileInterface, UploadcareGroupInterface, UploadingProgress} from '../types'
import {Uuid} from '..'
import {FileInfoInterface, GroupInfoInterface} from '../api/types'
import {PollPromiseInterface} from '../tools/poll'

export interface ProgressHookInterface<T> {
  onProgress: ((progress: T) => void) | null;
}

export interface CancelHookInterface {
  onCancel: (() => void) | null;
}

export interface BaseHooksInterface extends
  ProgressHookInterface<ProgressEvent>,
  CancelHookInterface {
}

export interface UploadHooksInterface<T> extends
  ProgressHookInterface<UploadingProgress> {
  onUploaded: ((uuid: string) => void) | null;
  onReady: ((entity: T) => void) | null;
}

export interface LifecycleHooksInterface<T> extends
  UploadHooksInterface<T>,
  CancelHookInterface {
}

export interface UploadInterface<T> extends
  LifecycleHooksInterface<T>,
  Promise<T> {}

export interface LifecycleStateInterface {
  readonly progress: UploadingProgress;

  isCanBeChangedTo(state: LifecycleStateInterface): boolean;
}

export interface LifecycleInterface<T> extends LifecycleHooksInterface<T> {
  updateState(state: LifecycleStateInterface): void;
  getProgress(): UploadingProgress;
  updateEntity(entity: T): void;
  getEntity(): T;
  handleUploading(progress?: ProgressParamsInterface): void;
  handleCancelling(): void;
  handleUploaded(uuid: Uuid): T;
  handleReady(): T;
  handleError(error: Error): Promise<never>;
}

export interface UploadHandlerInterface<T, U> {
  upload(entityUploadLifecycle: U): Promise<T>;
  cancel(entityUploadLifecycle: U): void;
}

export interface FileUploadLifecycleInterface {
  readonly uploadLifecycle: LifecycleInterface<UploadcareFileInterface>;

  getIsFileReadyPolling(): PollPromiseInterface<FileInfoInterface> | null;
  handleUploadedFile(uuid: Uuid, settings: SettingsInterface): Promise<UploadcareFileInterface>;
}

export interface GroupUploadLifecycleInterface {
  readonly uploadLifecycle: LifecycleInterface<UploadcareGroupInterface>;

  handleUploadedGroup(groupInfo: GroupInfoInterface, settings: SettingsInterface): Promise<UploadcareGroupInterface>;
}
