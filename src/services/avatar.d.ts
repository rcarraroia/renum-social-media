declare module "../services/avatar" {
  export function updateVideoWithAvatar(
    videoId: string,
    avatarId: string,
    voiceId: string,
    settings: any
  ): Promise<{ data: any; error: any }>;

  export function saveGeneratedVideo(
    videoId: string,
    videoUrl: string
  ): Promise<{ data: any; error: any }>;

  export function incrementCreditsUsed(
    organizationId: string
  ): Promise<{ data: any; error: any }>;
}