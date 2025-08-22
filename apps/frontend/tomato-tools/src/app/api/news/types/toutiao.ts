export interface ImageInfo {
  uri: string;
  url: string;
  width: number;
  height: number;
  url_list: Array<{ url: string }>;
  image_type: number;
}

export interface ToutiaoNewsItem {
  ClusterId: number;
  Title: string;
  LabelUrl: string;
  Label: string;
  Url: string;
  HotValue: string;
  Schema: string;
  LabelUri: ImageInfo;
  ClusterIdStr: string;
  ClusterType: number;
  QueryWord: string;
  InterestCategory: string[];
  Image: ImageInfo;
  LabelDesc: string;
}

export interface ToutiaoResponse {
  data: {
    data: ToutiaoNewsItem[];
  };
  message: string;
  code: number;
}