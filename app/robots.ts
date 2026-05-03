import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://leank.space'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/room/', '/lobby/'],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/', '/about', '/features', '/how-it-works', '/faq', '/privacy', '/terms', '/contact'],
        disallow: ['/room/', '/lobby/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/', '/about', '/features', '/how-it-works', '/faq', '/privacy', '/terms', '/contact'],
        disallow: ['/room/', '/lobby/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/', '/about', '/features', '/how-it-works', '/faq', '/privacy', '/terms', '/contact'],
        disallow: ['/room/', '/lobby/'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/', '/about', '/features', '/how-it-works', '/faq', '/privacy', '/terms', '/contact'],
        disallow: ['/room/', '/lobby/'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: ['/', '/about', '/features', '/how-it-works', '/faq', '/privacy', '/terms', '/contact'],
        disallow: ['/room/', '/lobby/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/about', '/features', '/how-it-works', '/faq', '/privacy', '/terms', '/contact'],
        disallow: ['/room/', '/lobby/'],
      },
      {
        userAgent: 'Amazonbot',
        allow: ['/', '/about', '/features', '/how-it-works', '/faq', '/privacy', '/terms', '/contact'],
        disallow: ['/room/', '/lobby/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
