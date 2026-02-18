/**
 * Matriz de Compatibilidade de Redes Sociais
 * Define quais redes suportam cada tipo de conteúdo e proporção
 * 
 * Última atualização: 17/02/2026
 */

export type PostType = 'video' | 'image' | 'carousel';
export type AspectRatio = '9:16' | '1:1' | '16:9';
export type Platform = 'instagram' | 'tiktok' | 'facebook' | 'youtube' | 'linkedin' | 'x' | 'pinterest' | 'threads' | 'bluesky';

export interface PlatformConfig {
  platforms: Platform[];
  types: Record<Platform, string>;
  dimensions?: {
    width: number;
    height: number;
  };
}

export const COMPATIBILITY_MATRIX: Record<PostType, Record<string, PlatformConfig>> = {
  video: {
    '9:16': {
      platforms: ['instagram', 'tiktok', 'facebook', 'youtube'],
      types: {
        instagram: 'REEL',
        tiktok: 'VIDEO',
        facebook: 'REEL',
        youtube: 'short',
        linkedin: '',
        x: '',
        pinterest: '',
        threads: '',
        bluesky: ''
      },
      dimensions: { width: 1080, height: 1920 }
    },
    '1:1': {
      platforms: ['instagram', 'facebook', 'linkedin', 'x'],
      types: {
        instagram: 'POST',
        facebook: 'POST',
        linkedin: 'post',
        x: 'post',
        tiktok: '',
        youtube: '',
        pinterest: '',
        threads: '',
        bluesky: ''
      },
      dimensions: { width: 1080, height: 1080 }
    },
    '16:9': {
      platforms: ['youtube', 'linkedin', 'facebook', 'x'],
      types: {
        youtube: 'video',
        linkedin: 'post',
        facebook: 'POST',
        x: 'post',
        instagram: '',
        tiktok: '',
        pinterest: '',
        threads: '',
        bluesky: ''
      },
      dimensions: { width: 1920, height: 1080 }
    }
  },
  image: {
    any: {
      platforms: ['instagram', 'facebook', 'linkedin', 'x', 'pinterest', 'threads'],
      types: {
        instagram: 'POST',
        facebook: 'POST',
        linkedin: 'post',
        x: 'post',
        pinterest: 'pin',
        threads: 'post',
        tiktok: '',
        youtube: '',
        bluesky: ''
      }
    }
  },
  carousel: {
    any: {
      platforms: ['instagram', 'facebook'],
      types: {
        instagram: 'POST',
        facebook: 'POST',
        tiktok: '',
        youtube: '',
        linkedin: '',
        x: '',
        pinterest: '',
        threads: '',
        bluesky: ''
      }
    }
  }
};


/**
 * Obtém as plataformas compatíveis com um tipo de post e proporção
 */
export function getCompatiblePlatforms(
  postType: PostType,
  aspectRatio?: AspectRatio
): PlatformConfig {
  if (postType === 'video' && aspectRatio) {
    return COMPATIBILITY_MATRIX.video[aspectRatio];
  }
  return COMPATIBILITY_MATRIX[postType].any;
}

/**
 * Obtém as plataformas disponíveis (compatíveis E conectadas)
 */
export function getAvailablePlatforms(
  postType: PostType,
  connectedPlatforms: Platform[],
  aspectRatio?: AspectRatio
): {
  available: Platform[];
  compatible: Platform[];
  connected: Platform[];
  missing: Platform[];
} {
  const compatible = getCompatiblePlatforms(postType, aspectRatio);
  const compatiblePlatforms = compatible.platforms;

  const available = compatiblePlatforms.filter(p => 
    connectedPlatforms.includes(p)
  );

  const missing = compatiblePlatforms.filter(p => 
    !connectedPlatforms.includes(p)
  );

  return {
    available,
    compatible: compatiblePlatforms,
    connected: connectedPlatforms,
    missing
  };
}

/**
 * Obtém o tipo de post para uma plataforma específica
 */
export function getPlatformType(
  platform: Platform,
  postType: PostType,
  aspectRatio?: AspectRatio
): string {
  const config = getCompatiblePlatforms(postType, aspectRatio);
  return config.types[platform] || '';
}

/**
 * Verifica se uma plataforma é compatível com o tipo/proporção
 */
export function isPlatformCompatible(
  platform: Platform,
  postType: PostType,
  aspectRatio?: AspectRatio
): boolean {
  const config = getCompatiblePlatforms(postType, aspectRatio);
  return config.platforms.includes(platform);
}

/**
 * Obtém as dimensões recomendadas para um tipo/proporção
 */
export function getDimensions(
  postType: PostType,
  aspectRatio?: AspectRatio
): { width: number; height: number } | null {
  if (postType === 'video' && aspectRatio) {
    return COMPATIBILITY_MATRIX.video[aspectRatio].dimensions || null;
  }
  return null;
}
