/**
 * Media Categories Configuration
 *
 * Defines all media categories with their metadata, placement info,
 * and smart defaults for the admin interface.
 */

export type MediaCategoryId =
  // Site Assets
  | 'site-logo'
  | 'site-hero-video'
  | 'site-hero-poster'
  | 'site-og'
  // Content Images
  | 'workshop-hero'
  | 'workshop-gallery'
  | 'team-photo'
  | 'testimonial'
  | 'recipe'
  | 'ons-verhaal'
  | 'general'

export interface MediaCategory {
  id: MediaCategoryId
  label: string
  description: string
  placement: string // Where it appears on the website
  icon: string // Lucide icon name
  group: 'site-assets' | 'workshop-content' | 'page-content'
  acceptedTypes: ('image' | 'video')[]
  requiredTags?: string[] // Tags that must be selected
  suggestedTags?: string[] // Optional tags to suggest
  autoSettings: {
    showOnWebsite: boolean
    featuredOnHomepage: boolean
  }
  dimensions?: {
    recommended: string
    aspectRatio?: string
  }
  maxItems?: number // Max items allowed in this category
}

export const MEDIA_CATEGORIES: MediaCategory[] = [
  // ═══════════════════════════════════════════════════════════════
  // SITE ASSETS - Core branding elements
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'site-logo',
    label: 'Logo',
    description: 'Navigation bar and footer logos',
    placement: 'Top navigation bar & footer on all pages',
    icon: 'Sparkles',
    group: 'site-assets',
    acceptedTypes: ['image'],
    requiredTags: ['nav', 'footer'],
    autoSettings: { showOnWebsite: true, featuredOnHomepage: false },
    dimensions: { recommended: 'PNG with transparency, max 200px height' },
    maxItems: 2,
  },
  {
    id: 'site-hero-video',
    label: 'Hero Video',
    description: 'Homepage background video',
    placement: 'Full-screen background on homepage hero section',
    icon: 'Play',
    group: 'site-assets',
    acceptedTypes: ['video'],
    requiredTags: ['desktop', 'mobile'],
    suggestedTags: ['mp4', 'webm'],
    autoSettings: { showOnWebsite: true, featuredOnHomepage: true },
    dimensions: { recommended: '1920x1080 (desktop), 1080x1920 (mobile)', aspectRatio: '16:9 / 9:16' },
    maxItems: 4, // desktop mp4, desktop webm, mobile mp4, mobile webm
  },
  {
    id: 'site-hero-poster',
    label: 'Hero Poster',
    description: 'Fallback image while video loads',
    placement: 'Homepage hero - shown before video plays',
    icon: 'Image',
    group: 'site-assets',
    acceptedTypes: ['image'],
    requiredTags: ['desktop', 'mobile'],
    autoSettings: { showOnWebsite: true, featuredOnHomepage: true },
    dimensions: { recommended: '1920x1080 (desktop), 1080x1920 (mobile)' },
    maxItems: 2,
  },
  {
    id: 'site-og',
    label: 'Social Media / OG',
    description: 'Images for social media sharing',
    placement: 'Link previews on Facebook, Twitter, LinkedIn, WhatsApp',
    icon: 'Share2',
    group: 'site-assets',
    acceptedTypes: ['image'],
    requiredTags: ['og', 'twitter'],
    autoSettings: { showOnWebsite: true, featuredOnHomepage: false },
    dimensions: { recommended: '1200x630 (OG), 1200x600 (Twitter)', aspectRatio: '1.91:1' },
    maxItems: 2,
  },

  // ═══════════════════════════════════════════════════════════════
  // WORKSHOP CONTENT - Workshop-related imagery
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'workshop-hero',
    label: 'Workshop Hero',
    description: 'Main image for workshop detail pages',
    placement: 'Workshop detail page hero section (/onze-uitjes/[slug])',
    icon: 'LayoutTemplate',
    group: 'workshop-content',
    acceptedTypes: ['image'],
    suggestedTags: ['kookworkshop', 'stadsspel', 'teambuilding'],
    autoSettings: { showOnWebsite: true, featuredOnHomepage: false },
    dimensions: { recommended: '1600x900', aspectRatio: '16:9' },
  },
  {
    id: 'workshop-gallery',
    label: 'Workshop Gallery',
    description: 'Gallery images showing workshops in action',
    placement: 'Workshop pages gallery section & "Onze Impact" page',
    icon: 'Images',
    group: 'workshop-content',
    acceptedTypes: ['image'],
    suggestedTags: ['cooking', 'group', 'food', 'venue', 'setup', 'results'],
    autoSettings: { showOnWebsite: true, featuredOnHomepage: false },
    dimensions: { recommended: '1200x800', aspectRatio: '3:2' },
  },

  // ═══════════════════════════════════════════════════════════════
  // PAGE CONTENT - Other website content
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'team-photo',
    label: 'Team Member Photo',
    description: 'Photos of team members',
    placement: '"Onze Medewerkers" team page',
    icon: 'Users',
    group: 'page-content',
    acceptedTypes: ['image'],
    suggestedTags: ['instructor', 'chef', 'guide'],
    autoSettings: { showOnWebsite: true, featuredOnHomepage: false },
    dimensions: { recommended: '800x800', aspectRatio: '1:1' },
  },
  {
    id: 'testimonial',
    label: 'Testimonial Photo',
    description: 'Customer/company photos for testimonials',
    placement: '"Jullie Ervaringen" testimonials page',
    icon: 'Quote',
    group: 'page-content',
    acceptedTypes: ['image'],
    suggestedTags: ['customer', 'company'],
    autoSettings: { showOnWebsite: true, featuredOnHomepage: false },
    dimensions: { recommended: '400x400', aspectRatio: '1:1' },
  },
  {
    id: 'recipe',
    label: 'Recipe Image',
    description: 'Photos for recipe pages',
    placement: 'Recipe detail pages (/recepten)',
    icon: 'ChefHat',
    group: 'page-content',
    acceptedTypes: ['image'],
    suggestedTags: ['finished-dish', 'ingredients', 'step'],
    autoSettings: { showOnWebsite: true, featuredOnHomepage: false },
    dimensions: { recommended: '1200x800', aspectRatio: '3:2' },
  },
  {
    id: 'ons-verhaal',
    label: 'Ons Verhaal Page',
    description: 'Images and videos for the Ons Verhaal (About) page',
    placement: '"Ons Verhaal" page - hero collage, video, content images',
    icon: 'BookOpen',
    group: 'page-content',
    acceptedTypes: ['image', 'video'],
    suggestedTags: ['hero', 'video', 'content', 'collage'],
    autoSettings: { showOnWebsite: true, featuredOnHomepage: false },
    dimensions: { recommended: '1200x800 (images), 1920x1080 (video)', aspectRatio: '3:2 / 16:9' },
  },
  {
    id: 'general',
    label: 'General / Other',
    description: 'Miscellaneous images for various uses',
    placement: 'Various pages as needed',
    icon: 'Folder',
    group: 'page-content',
    acceptedTypes: ['image', 'video'],
    autoSettings: { showOnWebsite: false, featuredOnHomepage: false },
  },
]

// Group categories for display
export const CATEGORY_GROUPS = [
  {
    id: 'site-assets',
    label: 'Site Assets',
    description: 'Core branding and layout elements',
    icon: 'Globe',
  },
  {
    id: 'workshop-content',
    label: 'Workshop Content',
    description: 'Workshop photos and gallery images',
    icon: 'Utensils',
  },
  {
    id: 'page-content',
    label: 'Page Content',
    description: 'Team, testimonials, recipes, and more',
    icon: 'FileText',
  },
] as const

// Helper functions
export function getCategoryById(id: string): MediaCategory | undefined {
  return MEDIA_CATEGORIES.find((c) => c.id === id)
}

export function getCategoriesByGroup(group: MediaCategory['group']): MediaCategory[] {
  return MEDIA_CATEGORIES.filter((c) => c.group === group)
}

// Predefined tags with descriptions
export const PREDEFINED_TAGS = {
  // Device/Format tags
  desktop: 'For desktop screens (>768px)',
  mobile: 'For mobile screens (<768px)',
  mp4: 'MP4 video format',
  webm: 'WebM video format',

  // Position tags
  nav: 'Navigation bar',
  footer: 'Footer section',
  og: 'Open Graph (Facebook, LinkedIn)',
  twitter: 'Twitter card',

  // Content tags
  cooking: 'Cooking in action',
  group: 'Team/group photos',
  food: 'Food close-ups',
  venue: 'Location/venue shots',
  setup: 'Event setup',
  results: 'Finished dishes/creations',

  // Workshop types
  kookworkshop: 'Cooking workshop',
  stadsspel: 'City game',
  teambuilding: 'Team building activity',

  // People
  instructor: 'Workshop instructor',
  chef: 'Chef',
  guide: 'Activity guide',
  customer: 'Customer photo',
  company: 'Company/organization',

  // Recipe
  'finished-dish': 'Completed dish',
  ingredients: 'Recipe ingredients',
  step: 'Recipe step photo',
} as const

export type PredefinedTag = keyof typeof PREDEFINED_TAGS
