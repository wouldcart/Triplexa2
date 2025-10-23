import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useSEO } from '@/contexts/SEOContext';
import { useSEODatabase } from '@/hooks/useSEODatabase';
import { AppSettingsService, SETTING_CATEGORIES } from '@/services/appSettingsService_database';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  structuredData?: any;
  metaRobots?: string;
  pageRoute?: string; // Allow manual override of page route
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords = [],
  ogTitle,
  ogDescription,
  ogImage,
  twitterTitle,
  twitterDescription,
  twitterImage,
  canonicalUrl,
  structuredData,
  metaRobots = 'index,follow',
  pageRoute
}) => {
  const { seoData } = useSEO();
  const location = useLocation();
  const [siteTitle, setSiteTitle] = React.useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = React.useState<string | null>(null);
  
  // Use provided pageRoute or current location pathname
  const currentRoute = pageRoute || location.pathname;
  
  // Get SEO settings from database
  const { seoSettings, loading, error } = useSEODatabase(currentRoute);

  // Load global site title and favicon from App Settings (DB-backed with localStorage fallback)
  React.useEffect(() => {
    let mounted = true;
    const loadBranding = async () => {
      try {
        const siteTitleVal = await AppSettingsService.getSettingValue(SETTING_CATEGORIES.SEO, 'site_title');
        const faviconVal = await AppSettingsService.getSettingValue(SETTING_CATEGORIES.BRANDING, 'company_favicon');
        if (mounted) {
          if (typeof siteTitleVal === 'string' && siteTitleVal.trim().length > 0) {
            setSiteTitle(siteTitleVal.trim());
          }
          if (typeof faviconVal === 'string' && faviconVal.trim().length > 0) {
            setFaviconUrl(faviconVal.trim());
          }
        }
      } catch (e) {
        // Non-fatal: fallback handled by existing defaults
        console.warn('Failed to load global branding settings:', e);
      }
    };
    loadBranding();
    return () => {
      mounted = false;
    };
  }, []);

  // Helper to sanitize and validate URLs before injecting into DOM
  const sanitizeUrl = (input?: string): string => {
    if (!input) return '';
    try {
      // Trim spaces only (do not strip internal whitespace from data URLs)
      let value = String(input).trim();
      
      // Allow data URLs as-is
      if (/^data:/i.test(value)) {
        return value;
      }

      // Fix common mistakes like missing colon or extra slashes for http(s)
      value = value.replace(/^http\/\//, 'http://');
      value = value.replace(/^https\/\//, 'https://');

      // Support root-relative local paths
      if (value.startsWith('/')) {
        return value;
      }

      // If protocol missing but looks like a domain, assume https
      if (!/^https?:\/\//i.test(value) && /^(www\.|[a-z0-9.-]+\.[a-z]{2,})(\/.*)?$/i.test(value)) {
        value = `https://${value}`;
      }

      // Validate via URL constructor, using origin as base when available
      if (typeof window !== 'undefined') {
        const u = new URL(value, window.location.origin);
        return u.toString();
      }
      const u = new URL(value);
      return u.toString();
    } catch {
      return '';
    }
  };
  
  // Merge props with context data and database settings
  // Priority: props > database settings > context > defaults
  const finalTitle = title || 
                    seoSettings?.title || 
                    seoData.title || 
                    'Triplexa';
                    
  const finalDescription = description || 
                          seoSettings?.description || 
                          seoData.description || 
                          'Professional tour management and booking system';
                          
  const finalKeywords = keywords.length > 0 ? keywords : 
                       seoSettings?.keywords || 
                       seoData.keywords || 
                       [];
                       
  const finalOgTitle = ogTitle || 
                      seoSettings?.og_title || 
                      seoData.title || 
                      finalTitle;
                      
  const finalOgDescription = ogDescription || 
                            seoSettings?.og_description || 
                            seoData.description || 
                            finalDescription;
                            
  const finalOgImage = ogImage || 
                      seoSettings?.og_image || 
                      seoData.image || 
                      '/images/default-og-image.jpg';
                      
  const finalTwitterTitle = twitterTitle || 
                           seoSettings?.twitter_title || 
                           seoData.title || 
                           finalTitle;
                           
  const finalTwitterDescription = twitterDescription || 
                                 seoSettings?.twitter_description || 
                                 seoData.description || 
                                 finalDescription;
                                 
  const finalTwitterImage = twitterImage || 
                            seoSettings?.twitter_image || 
                            seoData.image || 
                            finalOgImage;
                            
  const finalCanonicalUrl = sanitizeUrl(
    canonicalUrl || 
    seoSettings?.canonical_url || 
    seoData.canonicalUrl || 
    (typeof window !== 'undefined' ? window.location.href : '')
  );
                           
  const finalStructuredData = structuredData || 
                             seoSettings?.structured_data || 
                             seoData.structuredData;
                             
  const finalMetaRobots = metaRobots || 
                         seoSettings?.meta_robots || 
                         'index,follow';

  // Log SEO loading state for debugging
  useEffect(() => {
    if (error) {
      console.warn('SEO Database Error:', error);
    }
  }, [error]);

  const siteName = siteTitle || seoData.siteName || 'Triplexa';
  const fullTitle = finalTitle?.includes(siteName)
    ? finalTitle
    : `${finalTitle} | ${siteName}`;
  
  // Generate default structured data for the organization
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": seoData.siteName || "Triplexa",
    "description": finalDescription,
    "url": finalCanonicalUrl,
    "logo": finalOgImage,
    "sameAs": [
      "https://twitter.com/tourmanagement",
      "https://linkedin.com/company/tourmanagement"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": ["English"]
    }
  };

  const finalStructuredDataOutput = finalStructuredData || defaultStructuredData;
  
  // Ensure favicon URL is safe and provide a fallback
  const finalFaviconUrl = (() => {
    const sanitized = sanitizeUrl(faviconUrl || undefined);
    return sanitized && sanitized.length > 0 ? sanitized : '';
  })();
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={finalDescription} />
      {finalKeywords.length > 0 && <meta name="keywords" content={Array.isArray(finalKeywords) ? finalKeywords.join(', ') : finalKeywords} />}
      
      {/* Robots Meta */}
      <meta name="robots" content={finalMetaRobots} />
      
      {/* Canonical URL */}
      {finalCanonicalUrl && <link rel="canonical" href={finalCanonicalUrl} />}
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={finalOgTitle} />
      <meta property="og:description" content={finalOgDescription} />
      {finalOgImage && <meta property="og:image" content={finalOgImage} />}
      {finalCanonicalUrl && <meta property="og:url" content={finalCanonicalUrl} />}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={seoData.siteName || 'Tour Management System'} />
      <meta property="og:locale" content={seoData.locale || 'en_US'} />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      {seoData.twitterHandle && <meta name="twitter:site" content={seoData.twitterHandle} />}
      {seoData.twitterHandle && <meta name="twitter:creator" content={seoData.twitterHandle} />}
      <meta name="twitter:title" content={finalTwitterTitle} />
      <meta name="twitter:description" content={finalTwitterDescription} />
      {finalTwitterImage && <meta name="twitter:image" content={finalTwitterImage} />}
      
      {/* Additional Meta Tags for SEO */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />
      <meta name="theme-color" content="#1a1a1a" />
      {/* Favicon: use branding setting if available, otherwise fall back to default */}
      {finalFaviconUrl ? (
        (() => {
          const lower = finalFaviconUrl.toLowerCase();
          const isData = lower.startsWith('data:');
          const isIco = lower.endsWith('.ico');
          const isPng = lower.endsWith('.png');
          const isSvg = isData ? lower.includes('image/svg+xml') : lower.endsWith('.svg');
          const typeAttr = isIco ? 'image/x-icon' : isPng ? 'image/png' : isSvg ? 'image/svg+xml' : undefined;
          return (
            <>
              <link rel="icon" href={finalFaviconUrl} {...(typeAttr ? { type: typeAttr } : {})} />
              <link rel="shortcut icon" href={finalFaviconUrl} {...(typeAttr ? { type: typeAttr } : {})} />
              {isPng && <link rel="apple-touch-icon" href={finalFaviconUrl} />}
            </>
          );
        })()
      ) : (
        <>
          <link rel="icon" href="/placeholder.svg" type="image/svg+xml" />
          <link rel="shortcut icon" href="/placeholder.svg" type="image/svg+xml" />
        </>
      )}
      
      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Structured Data */}
      {finalStructuredDataOutput && (
        <script type="application/ld+json">
          {JSON.stringify(finalStructuredDataOutput)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;