export type DashboardItem = {
  id: string;
  title: string;
  description: string;
  typeId: string;
  collectionId: string;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  updatedAt: string;
};

export type ItemDetail = {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  contentType: string;
  language: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  url: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  typeId: string;
  typeName: string;
  typeIcon: string | null;
  typeColor: string | null;
  collectionId: string | null;
  collectionName: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type DashboardItemType = {
  id: string;
  name: string;
  label: string;
  icon: "code" | "sparkles" | "terminal" | "file-text" | "file" | "image" | "link";
  color: string;
  isSystem: boolean;
};
