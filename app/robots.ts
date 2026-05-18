import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://leank.space'

  return {
    rules: [
      {
        userAgent: 'GPTBot',
        allow: ['/'],
        disallow: ['/room/', '/lobby/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/'],
        disallow: ['/room/', '/lobby/'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/'],
        disallow: ['/room/', '/lobby/'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: ['/'],
        disallow: ['/room/', '/lobby/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/'],
      },
      {
        userAgent: '*',
        allow: ['/'],
        disallow: ['/room/', '/lobby/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}