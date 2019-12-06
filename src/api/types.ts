import {RequestOptionsInterface, RequestResponse} from './request/types'
import {FileData, SettingsInterface} from '../types'
import {FromUrlResponse, Url} from './fromUrl'
import {FromUrlStatusResponse} from './fromUrlStatus'
import {
  MultipartPart,
  MultipartStartResponse,
} from './multipart/types'
import {BaseThenableInterface, CancelableThenableInterface} from '../thenable/types'
import {BaseResponse} from './base'
import {BaseHooksInterface, CancelHookInterface} from '../lifecycle/types'

interface StatusInterface {
  status: string;
}

interface ProgressInterface {
  size: number;
  done: number;
  total: number;
}

export interface ProgressStatusInterface extends StatusInterface, ProgressInterface {}

export interface GeoLocationInterface {
  latitude: number;
  longitude: number;
}

interface ImageInfoInterface {
  height: number;
  width: number;
  geo_location: null | GeoLocationInterface;
  datetime_original: string;
  format: string;
  color_mode: string;
  dpi: null | number[];
  orientation: null | number;
  sequence?: boolean;
}

interface AudioInterface {
  bitrate: number | null;
  codec: string | null;
  sample_rate: number | null;
  channels: string | null;
}

interface VideoInterface {
  height: number;
  width: number;
  frame_rate: number;
  bitrate: number;
  codec: string;
}

interface VideoInfoInterface {
  duration: number;
  format: string;
  bitrate: number;
  audio: AudioInterface | null;
  video: VideoInterface;
}

export interface FileInfoInterface extends ProgressInterface {
  uuid: Uuid;
  file_id: Uuid;
  original_filename: string;
  filename: string;
  mime_type: string;
  is_image: string;
  is_store: string;
  is_ready: string;
  image_info: null | ImageInfoInterface;
  video_info: null | VideoInfoInterface;
}

export interface GroupInfoInterface {
  datetime_created: string;
  datetime_stored: string | null;
  files_count: string;
  cdn_url: string;
  files: FileInfoInterface[];
  url: string;
  id: GroupId;
}

export type Token = string

export type Uuid = string

export type GroupId = string

export interface UploadAPIInterface {
  request(options: RequestOptionsInterface): Promise<RequestResponse>;

  base(
    data: FileData,
    settings?: SettingsInterface,
    hooks?: BaseHooksInterface,
  ): BaseThenableInterface<BaseResponse>;

  info(
    uuid: Uuid,
    settings?: SettingsInterface,
    hooks?: CancelHookInterface,
  ): CancelableThenableInterface<FileInfoInterface>;

  fromUrl(
    sourceUrl: Url,
    settings?: SettingsInterface,
    hooks?: CancelHookInterface,
  ): CancelableThenableInterface<FromUrlResponse>;

  fromUrlStatus(
    token: Token,
    settings?: SettingsInterface,
    hooks?: CancelHookInterface,
  ): CancelableThenableInterface<FromUrlStatusResponse>;

  group(
    files: Uuid[],
    settings?: SettingsInterface,
    hooks?: CancelHookInterface,
  ): CancelableThenableInterface<GroupInfoInterface>;

  groupInfo(
    id: GroupId,
    settings?: SettingsInterface,
    hooks?: CancelHookInterface
  ): CancelableThenableInterface<GroupInfoInterface>;

  multipartStart(
    file: FileData,
    settings: SettingsInterface,
    hooks?: CancelHookInterface,
  ): CancelableThenableInterface<MultipartStartResponse>;

  multipartUpload(
    file: FileData,
    parts: MultipartPart[],
    settings: SettingsInterface,
    hooks?: CancelHookInterface,
  ): BaseThenableInterface<any>;

  multipartComplete(
    uuid: Uuid,
    settings: SettingsInterface,
    hooks?: CancelHookInterface,
  ): CancelableThenableInterface<FileInfoInterface>;
}
