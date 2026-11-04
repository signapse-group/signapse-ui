export interface CreateNewsOutletRequest {
  name: string
  description?: string | null
  homepageUrl: string
  rssUrl?: string | null
  active?: boolean
}

export interface UpdateNewsOutletRequest {
  name?: string | null
  description?: string | null
  homepageUrl?: string | null
  rssUrl?: string | null
  active?: boolean | null
}

export interface NewsOutletResponse {
  id: number
  name: string
  description: string | null
  homepageUrl: string
  rssUrl: string | null
  active: boolean
  createdDate: string
  lastModifiedDate?: string
}

export interface NewsOutletListResponse {
  id: number
  name: string
  homepageUrl: string
  rssUrl: string | null
  active: boolean
  createdDate: string
}
