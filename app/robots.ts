import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://leank.space'
  const publicInfoPages = [
    '/',
    '/about',
    '/features',
    '/how-it-works',
    '/faq',
    '/contact',
    '/privacy',
    '/terms',
  ]
  const restrictedPaths = ['/room/', '/lobby/']

  return {
    rules: [
      {
        userAgent: 'GPTBot',
        allow: publicInfoPages,
        disallow: restrictedPaths,
      },
      {
        userAgent: 'ChatGPT-User',
        allow: publicInfoPages,
        disallow: restrictedPaths,
      },
      {
        userAgent: 'ClaudeBot',
        allow: publicInfoPages,
        disallow: restrictedPaths,
      },
      {
        userAgent: 'anthropic-ai',
        allow: publicInfoPages,
        disallow: restrictedPaths,
      },
      {
        userAgent: 'PerplexityBot',
        allow: publicInfoPages,
        disallow: restrictedPaths,
      },
      {
        userAgent: 'Google-Extended',
        allow: publicInfoPages,
        disallow: restrictedPaths,
      },
      {
        userAgent: '*',
        allow: publicInfoPages,
        disallow: restrictedPaths,
      },
    ],
    host: baseUrl,
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
