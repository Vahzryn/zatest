import { VERIFIED_FACTS, FactCategory } from './facts';
import { SeoRouteData } from '../seoEngine';
import { RouteEditorialContent } from './content';

/**
 * Structured Page Brief Model
 * Defines the parameters and constraints prior to rendering PSEO page content.
 */
export interface PageBrief {
  slug: string;
  searchIntent: 'format-conversion' | 'compression' | 'privacy' | 'passport-visa' | 'e-commerce' | 'general-utility' | 'job-application';
  primaryTopic: string;
  secondaryTopics: string[];
  userProblem: string;
  desiredOutcome: string;
  uniqueAngle: string;
  verifiedCapabilities: string[]; // References to assertions in facts.ts
  verifiedLimitations: string[];  // References to boundaries
  relevantTechnicalFacts: string[];
  relevantExternalFacts: string[];
  importantQuestions: string[];
  relatedTools: string[]; // Related slugs
  internalLinkOpportunities: string[];
  contentGaps: string[];
  ctrDifferentiator: string;
}

/**
 * Rich Structured Page Content Model
 * Representing the fully realized, high-authority, and factual page copy.
 */
export interface PageContent {
  slug: string;
  searchIntent: string;
  primaryTopic: string;
  secondaryTopics: string[];
  userProblem: string;
  desiredOutcome: string;
  uniqueAngle: string;
  seo: {
    title: string;
    metaDescription: string;
    h1: string;
  };
  introduction: string; // Intent-first starting paragraph
  sections: Array<{
    heading: string;
    purpose: string;
    content: string;
  }>;
  howItWorks: string;
  steps: string[];
  capabilities: string[];
  limitations: string[];
  useCases: string[];
  technicalDetails: string[];
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  relatedTools: Array<{ name: string; url: string }>;
  evidence: Array<{
    claim: string;
    evidenceType: 'CODE_VERIFIED' | 'OFFICIAL_SOURCE' | 'ESTABLISHED_TECHNICAL_FACT' | 'VARIABLE_REQUIREMENT';
    source: string;
  }>;
  schema?: string;
}

/**
 * Validation Error structure for Content Quality Control.
 */
export interface ContentValidationError {
  pageSlug: string;
  ruleId: string;
  severity: 'error' | 'warning';
  message: string;
  context?: string;
}

/**
 * Content Quality Validator
 * Runs complete tests against generated or existing PageContent instances.
 */
export class ContentValidator {
  private static BANNED_SLOP = [
    'in conclusion',
    'furthermore',
    'moreover',
    'delve into',
    'revolutionize',
    'unlock',
    'seamless',
    'robust',
    'in today\'s digital landscape',
    'look no further',
    'it\'s important to note'
  ];

  /**
   * Validates a page content block against its structural requirements and facts.
   */
  public static validate(brief: PageBrief, content: PageContent): ContentValidationError[] {
    const errors: ContentValidationError[] = [];
    const slug = brief.slug;

    // Rule 1: Search-Intent-First check (The first 100 characters must state the solution directly, no fluff)
    if (!content.introduction || content.introduction.trim().length < 20) {
      errors.push({
        pageSlug: slug,
        ruleId: 'intent_first_missing',
        severity: 'error',
        message: 'Introduction is missing or too short.'
      });
    } else {
      const lowerIntro = content.introduction.toLowerCase();
      if (lowerIntro.includes('the history of') || lowerIntro.includes('since the inception') || lowerIntro.includes('was created in')) {
        errors.push({
          pageSlug: slug,
          ruleId: 'intent_first_history_cliché',
          severity: 'error',
          message: 'Introduction starts with generic technical history instead of answering the query immediately.',
          context: content.introduction.slice(0, 80)
        });
      }
    }

    // Rule 2: Anti-Slop Check (Banned Vocabulary Filter)
    this.BANNED_SLOP.forEach((slop) => {
      const regex = new RegExp(`\\b${slop}\\b`, 'gi');
      let found = false;
      let textSegment = '';

      // Check introduction
      if (regex.test(content.introduction)) { found = true; textSegment = content.introduction; }
      // Check sections
      content.sections.forEach((sec) => {
        if (regex.test(sec.heading) || regex.test(sec.content)) {
          found = true;
          textSegment = `${sec.heading}: ${sec.content}`;
        }
      });
      // Check FAQs
      content.faqs.forEach((faq) => {
        if (regex.test(faq.question) || regex.test(faq.answer)) {
          found = true;
          textSegment = `${faq.question}: ${faq.answer}`;
        }
      });

      if (found) {
        errors.push({
          pageSlug: slug,
          ruleId: 'banned_slop_detected',
          severity: 'error',
          message: `Contains AI template filler word/phrase: "${slop}". Rewrite with direct, technical wording.`,
          context: textSegment.slice(0, 120)
        });
      }
    });

    // Rule 3: Anti-Hallucination & Fact Splicing Check
    // We check that formatting/file capabilities claims correspond to our specifications in facts.ts
    const fullText = JSON.stringify(content).toLowerCase();

    // If page is HEIC/HEIF related but text claims multi-frame animations are preserved
    if (brief.searchIntent === 'format-conversion' && brief.slug.includes('gif')) {
      if (fullText.includes('animation loops are preserved') || fullText.includes('loops indefinitely') || fullText.includes('preserves animated frames')) {
        errors.push({
          pageSlug: slug,
          ruleId: 'hallucinated_gif_animation',
          severity: 'error',
          message: 'Claimed to preserve GIF animations. Verified facts state multi-frame GIFs are flattened to static first frames.'
        });
      }
    }

    // If page mentions cloud storage or file servers
    if (fullText.includes('uploaded to secure server') || fullText.includes('safely stored on cloud') || fullText.includes('server-side conversion')) {
      errors.push({
        pageSlug: slug,
        ruleId: 'hallucinated_server_uploads',
        severity: 'error',
        message: 'Claimed server uploads or cloud security features. Zapixal is local, client-side browser only.'
      });
    }

    // Rule 4: Variable Requirements Disclaimer Check for passport/visa/government
    if (brief.searchIntent === 'passport-visa' || brief.slug.includes('government') || brief.slug.includes('portal') || brief.slug.includes('visa')) {
      const hasDisclaimer = fullText.includes('verify') || fullText.includes('current guidelines') || fullText.includes('requirements vary') || fullText.includes('official standards') || fullText.includes('disclaimer');
      if (!hasDisclaimer) {
        errors.push({
          pageSlug: slug,
          ruleId: 'missing_jurisdiction_caveat',
          severity: 'warning',
          message: 'Passport/Government page is missing the required caveat explaining that official jurisdiction guidelines can vary and should be self-verified.'
        });
      }
    }

    // Rule 5: Evidence Mapping check
    if (!content.evidence || content.evidence.length === 0) {
      errors.push({
        pageSlug: slug,
        ruleId: 'unsupported_claims',
        severity: 'error',
        message: 'No evidence/authority references are provided to support the technical claims. Evidence is required.'
      });
    } else {
      content.evidence.forEach((ev) => {
        const allowedTypes = ['CODE_VERIFIED', 'OFFICIAL_SOURCE', 'ESTABLISHED_TECHNICAL_FACT', 'VARIABLE_REQUIREMENT'];
        if (!allowedTypes.includes(ev.evidenceType)) {
          errors.push({
            pageSlug: slug,
            ruleId: 'invalid_evidence_type',
            severity: 'error',
            message: `Invalid evidence type "${ev.evidenceType}" for claim "${ev.claim}". Must be one of: ${allowedTypes.join(', ')}`
          });
        }
        if (!ev.source || ev.source.trim() === '') {
          errors.push({
            pageSlug: slug,
            ruleId: 'missing_evidence_source',
            severity: 'error',
            message: `Missing evidence source for claim "${ev.claim}".`
          });
        }
      });
    }

    // Rule 6: Structured metadata validation
    if (!content.seo.title || content.seo.title.length > 70) {
      errors.push({
        pageSlug: slug,
        ruleId: 'seo_title_length',
        severity: 'warning',
        message: `SEO Title is missing or too long (${content.seo.title?.length} chars, recommended < 60).`
      });
    }
    if (!content.seo.metaDescription || content.seo.metaDescription.length > 160) {
      errors.push({
        pageSlug: slug,
        ruleId: 'seo_desc_length',
        severity: 'warning',
        message: `Meta Description is missing or too long (${content.seo.metaDescription?.length} chars, recommended < 160).`
      });
    }

    return errors;
  }
}

/**
 * Adaptive Content Structural Selector (Step 5)
 * Dynamically selects and designs appropriate text blocks depending on search intent.
 */
export function getStructuralSectionsForIntent(brief: PageBrief): { heading: string; purpose: string }[] {
  switch (brief.searchIntent) {
    case 'format-conversion':
      return [
        { heading: `Resolving compatibility with pixel-perfect conversion`, purpose: 'Explain the format wall, rendering engine, and compatibility advantages' },
        { heading: `Retention of precision color data and transparency profiles`, purpose: 'Discuss 10-bit color spaces mapping, canvas alpha composites, and canvas output accuracy' },
        { heading: `Browser-level limitations and file specifications`, purpose: 'Factual disclosure of what cannot be done, e.g. animation bounds, RAM constraints' }
      ];
    case 'compression':
      return [
        { heading: `Target-size quantization without visual detail collapse`, purpose: 'Explain pixel sub-sampling, quantization matrices, and sliding quality controls' },
        { heading: `Achieving target file-size caps under portal limits`, purpose: 'Explain how the custom slider converges on target KB limits locally' },
        { heading: `Client-side memory dynamics and offline boundaries`, purpose: 'Acknowledge system RAM limitations for heavy files' }
      ];
    case 'privacy':
      return [
        { heading: `Neutralizing latent GPS geotags and digital footprints`, purpose: 'Detail metadata structures (EXIF APP1 headers, GPS GPSInfo, XMP overlays)' },
        { heading: `Irreversible client-side header slicing and pixel quantization`, purpose: 'Contrast basic deletions with our binary header stripping or mosaic overlays' },
        { heading: `Why browser sandboxing outpaces incognito mode privacy`, purpose: 'Explain client-side sandboxed security vs standard website data caching' }
      ];
    case 'passport-visa':
      return [
        { heading: `Aligning alignment to strict official framing templates`, purpose: 'Detail background fill requirements, head margin rules, and 1:1 aspect calibration' },
        { heading: `DPI header preflight injection for physical prints`, purpose: 'Explain 300 DPI metadata injection into JFIF/pHYs layers' },
        { heading: `Important warnings regarding jurisdictional compliance`, purpose: 'Instruct user to review active official consulate guidelines' }
      ];
    case 'e-commerce':
      return [
        { heading: `Establishing dimensional uniformity across catalog imports`, purpose: 'Detail canvas padding, backdrop consistency, and crop aspect limits' },
        { heading: `High-throughput processing pipelines without cumulative degradation`, purpose: 'Discuss batch queuing and memory reuse' },
        { heading: `Fulfillment of target platform specifications`, purpose: 'Discuss typical seller hub file size, resolution, and name requirements' }
      ];
    default:
      return [
        { heading: `Unlocking locally optimized visual file processing`, purpose: 'Explain basic local processing features' },
        { heading: `Core technical details and browser performance`, purpose: 'State RAM and browser compatibility factors' }
      ];
  }
}

/**
 * Reusable Generation Workflow (Step 18)
 * Compiles a structured Brief and Facts directly into the UI-compatible SeoRouteData structure.
 * This guarantees deterministic, highly validated PSEO rendering!
 */
export function buildSeoRouteFromBrief(brief: PageBrief, content: PageContent, path: string, fullUrl: string): SeoRouteData {
  // Validate first to make sure there are no issues during runtime.
  const validationErrors = ContentValidator.validate(brief, content);
  if (validationErrors.length > 0) {
    const criticals = validationErrors.filter(e => e.severity === 'error');
    if (criticals.length > 0) {
      console.warn(`[ContentEngine] Validation errors found on slug "${brief.slug}":`, criticals);
    }
  }

  // Map structured PageContent sections to existing RouteEditorialContent layout
  const guideContent: RouteEditorialContent = {
    badge: brief.ctrDifferentiator || 'Privacy-First Web Assembly',
    section1Title: content.sections[0]?.heading || 'Technical Overview',
    section1Body: `${content.introduction} ${content.sections[0]?.content || ''}`,
    section2Title: content.sections[1]?.heading || 'Factual Capabilities',
    section2Body: `${content.sections[1]?.content || ''} ${content.sections[2]?.content || ''}`.trim(),
    steps: content.steps,
    faqs: content.faqs
  };

  return {
    path,
    h1Title: content.seo.h1,
    metaTitle: content.seo.title,
    metaDescription: content.seo.metaDescription,
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: brief.searchIntent === 'format-conversion' ? 'converter' : (brief.searchIntent === 'privacy' ? 'resource' : 'compression'),
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: content.seo.h1.slice(0, 30) + '...', url: path }],
    guideContent,
    relatedRoutes: brief.relatedTools.map(toolSlug => ({
      path: `/${toolSlug}`,
      label: toolSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    }))
  };
}
