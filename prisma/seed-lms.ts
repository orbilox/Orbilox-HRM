import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

// ── Course data ──────────────────────────────────────────────────────────────

const COURSE = {
  title: "Complete Digital Marketing Mastery — Zero to Advanced (3 Months)",
  description:
    "A structured 12-week journey from digital marketing fundamentals to advanced paid campaigns, analytics, SEO, automation and strategy. Every Saturday includes a manager-reviewed assignment.",
  category: "TECHNICAL",
  createdBy: "system",
  status: "PUBLISHED",
};

// Each module = 1 week. Saturday assignment is always the last task.
const MODULES = [
  // ── MONTH 1: FOUNDATIONS ────────────────────────────────────────────────────
  {
    title: "Week 1 — Introduction to Digital Marketing",
    description: "Understand what digital marketing is, the key channels, and why it matters.",
    tasks: [
      {
        title: "What is Digital Marketing? — Landscape & Channels Overview",
        type: "VIDEO",
        description: "Watch this complete beginner's overview of all digital marketing channels.",
        content: "https://www.youtube.com/watch?v=nU1qmFo9d0U",
        dueInDays: 2,
      },
      {
        title: "Read: Neil Patel's Definitive Guide to Digital Marketing",
        type: "READING",
        description: "A comprehensive written guide covering every channel from SEO to paid ads.",
        content: "https://neilpatel.com/what-is-digital-marketing/",
        dueInDays: 3,
      },
      {
        title: "Enroll in Google Digital Garage: Fundamentals of Digital Marketing",
        type: "TASK",
        description: "Free 26-module Google-certified course. Complete at least modules 1–5 this week.",
        content: "https://learndigital.withgoogle.com/digitalgarage/course/digital-marketing",
        dueInDays: 5,
      },
      {
        title: "Set up Your Digital Tools",
        type: "TASK",
        description: "Create accounts: Google Analytics 4, Google Search Console, Meta Business Suite, Semrush (free trial). Take screenshots of each setup.",
        content: "https://analytics.google.com | https://search.google.com/search-console | https://business.facebook.com | https://www.semrush.com",
        dueInDays: 6,
      },
      {
        title: "📋 SATURDAY ASSIGNMENT — Digital Marketing Landscape Audit",
        type: "ASSIGNMENT",
        description: "Pick any brand (not your employer). Audit their digital presence across all channels: website, social media, Google ranking, email. Write a 1-page report covering: (1) Which channels they use, (2) What they do well, (3) 3 gaps you spotted. Submit to your manager for review.",
        content: "Submit as PDF or Google Doc link to your manager by end of day Saturday.",
        dueInDays: 7,
      },
    ],
  },

  {
    title: "Week 2 — Website Fundamentals & SEO Basics",
    description: "Learn how search engines work, keyword research and on-page SEO.",
    tasks: [
      {
        title: "SEO for Beginners — Complete Tutorial",
        type: "VIDEO",
        description: "Ahrefs' beginner SEO crash course. Watch all 5 parts.",
        content: "https://www.youtube.com/watch?v=DvwS7cV9GmQ",
        dueInDays: 2,
      },
      {
        title: "Read: Moz Beginner's Guide to SEO (Chapters 1–4)",
        type: "READING",
        description: "The industry-standard SEO guide. Focus on keyword research and on-page SEO chapters.",
        content: "https://moz.com/beginners-guide-to-seo",
        dueInDays: 3,
      },
      {
        title: "Read: Google's Search Quality Rater Guidelines Summary",
        type: "READING",
        description: "Understand E-E-A-T and what Google actually rewards.",
        content: "https://backlinko.com/google-quality-rater-guidelines",
        dueInDays: 4,
      },
      {
        title: "Keyword Research Exercise",
        type: "TASK",
        description: "Use Google Keyword Planner + Ubersuggest to find 20 keywords for a niche of your choice. Group them by intent (informational, transactional, navigational). Document in a spreadsheet.",
        content: "https://ads.google.com/home/tools/keyword-planner/ | https://neilpatel.com/ubersuggest/",
        dueInDays: 6,
      },
      {
        title: "📋 SATURDAY ASSIGNMENT — On-Page SEO Audit",
        type: "ASSIGNMENT",
        description: "Take any website (can be a public brand site). Run it through Screaming Frog (free, 500 URLs) or Semrush Site Audit. Identify: 5 title tag issues, 5 missing meta descriptions, internal linking gaps, and page speed issues. Present findings in a structured report with recommendations. Submit to manager.",
        content: "Tools: https://www.screamingfrog.co.uk/seo-spider/ | https://www.semrush.com/siteaudit/",
        dueInDays: 7,
      },
    ],
  },

  {
    title: "Week 3 — Content Marketing Strategy",
    description: "Build a content marketing mindset — strategy, creation, distribution, and repurposing.",
    tasks: [
      {
        title: "Content Marketing Full Course — Strategy to Execution",
        type: "VIDEO",
        description: "HubSpot's complete guide to building a content marketing strategy.",
        content: "https://www.youtube.com/watch?v=aJqjEZFbHng",
        dueInDays: 2,
      },
      {
        title: "Read: HubSpot's Comprehensive Guide to Content Marketing",
        type: "READING",
        description: "Deep dive into content types, distribution channels and measuring ROI.",
        content: "https://blog.hubspot.com/marketing/content-marketing",
        dueInDays: 3,
      },
      {
        title: "Read: How to Build a Content Calendar (CoSchedule)",
        type: "READING",
        description: "Practical guide to planning and scheduling content across channels.",
        content: "https://coschedule.com/content-marketing/content-marketing-calendar",
        dueInDays: 4,
      },
      {
        title: "Write a Blog Post + Repurpose It",
        type: "TASK",
        description: "Write a 500-word SEO-optimised blog post on any digital marketing topic. Then repurpose it into: (1) 3 LinkedIn posts, (2) 1 Instagram carousel outline, (3) 5 tweet ideas. Document everything in a Google Doc.",
        content: "Use Hemingway Editor: https://hemingwayapp.com/ | Grammarly: https://www.grammarly.com/",
        dueInDays: 6,
      },
      {
        title: "📋 SATURDAY ASSIGNMENT — 4-Week Content Calendar",
        type: "ASSIGNMENT",
        description: "Build a real 4-week content calendar for a hypothetical brand in a niche you choose. Include: topic, format (blog/video/reel/tweet), target keyword, publish date, and platform. Use a spreadsheet template. The calendar must have at least 20 content pieces. Submit to manager for feedback.",
        content: "Template: https://coschedule.com/blog/content-calendar-template/",
        dueInDays: 7,
      },
    ],
  },

  {
    title: "Week 4 — Social Media Marketing",
    description: "Organic social media strategy across Instagram, LinkedIn, X (Twitter) and YouTube.",
    tasks: [
      {
        title: "Social Media Marketing Full Course 2024",
        type: "VIDEO",
        description: "Complete guide to organic social media growth and content strategy.",
        content: "https://www.youtube.com/watch?v=q8b_FVrNsWc",
        dueInDays: 2,
      },
      {
        title: "Read: Hootsuite's Social Media Marketing Guide",
        type: "READING",
        description: "Best practices for each platform: Instagram, LinkedIn, X, YouTube, TikTok.",
        content: "https://blog.hootsuite.com/social-media-marketing/",
        dueInDays: 3,
      },
      {
        title: "Study: Viral Content Anatomy — Why Things Go Viral",
        type: "READING",
        description: "Understanding shareability, hooks, and the psychology of engagement.",
        content: "https://sproutsocial.com/insights/social-media-content-strategy/",
        dueInDays: 4,
      },
      {
        title: "Create 5 Social Media Posts",
        type: "TASK",
        description: "Using Canva, design 5 social media posts for a brand: 2 Instagram carousels, 1 LinkedIn post with graphic, 1 Twitter/X thread (5 tweets), 1 YouTube thumbnail. Export and save.",
        content: "https://www.canva.com/",
        dueInDays: 6,
      },
      {
        title: "📋 SATURDAY ASSIGNMENT — Social Media Strategy Document",
        type: "ASSIGNMENT",
        description: "Create a Social Media Strategy document for a brand (real or hypothetical). Must include: (1) Target audience personas, (2) Platform selection rationale, (3) Content pillars (3–5 themes), (4) Posting frequency per platform, (5) KPIs to track, (6) Sample 1-week content plan. Min 2 pages. Submit to manager.",
        content: "Reference: https://blog.hootsuite.com/social-media-marketing-strategy/",
        dueInDays: 7,
      },
    ],
  },

  // ── MONTH 2: PAID ADVERTISING & EMAIL ───────────────────────────────────────
  {
    title: "Week 5 — Google Ads (Search & Display)",
    description: "Set up, structure and optimise Google Search and Display campaigns.",
    tasks: [
      {
        title: "Google Ads Tutorial for Beginners 2024 — Complete Course",
        type: "VIDEO",
        description: "Full walkthrough of Google Ads interface, campaign types, bidding strategies.",
        content: "https://www.youtube.com/watch?v=JzU12P1BQPE",
        dueInDays: 2,
      },
      {
        title: "Read: Google Ads Certification Study Guide",
        type: "READING",
        description: "Google's official study material for the Search Advertising certification.",
        content: "https://skillshop.google.com/",
        dueInDays: 3,
      },
      {
        title: "Read: WordStream's Guide to Google Ads Quality Score",
        type: "READING",
        description: "Understanding Quality Score, Ad Rank, and how to optimise your CPCs.",
        content: "https://www.wordstream.com/quality-score",
        dueInDays: 4,
      },
      {
        title: "Build a Google Ads Campaign Structure",
        type: "TASK",
        description: "In a spreadsheet, design a full Google Ads campaign structure for a hypothetical e-commerce store. Include: 2 campaigns, 4 ad groups each, 10 keywords per ad group (with match types), and write 3 RSA ad copy variations per ad group.",
        content: "Reference: https://support.google.com/google-ads/answer/6372655",
        dueInDays: 6,
      },
      {
        title: "📋 SATURDAY ASSIGNMENT — Google Ads Campaign Blueprint",
        type: "ASSIGNMENT",
        description: "Create a complete Google Ads launch plan for a brand of your choice. Include: campaign objective, budget recommendation, keyword strategy (with negative keywords list), bidding strategy rationale, ad copy for 2 ad groups, and expected KPIs. Present as a structured proposal. Submit to manager.",
        content: "Tools: https://ads.google.com/home/tools/keyword-planner/",
        dueInDays: 7,
      },
    ],
  },

  {
    title: "Week 6 — Meta Ads (Facebook & Instagram)",
    description: "Master Facebook and Instagram advertising — audiences, creatives, and funnels.",
    tasks: [
      {
        title: "Facebook Ads Tutorial 2024 — Full Course for Beginners",
        type: "VIDEO",
        description: "Complete Meta Ads Manager walkthrough: campaign objectives, audiences, creatives, budgets.",
        content: "https://www.youtube.com/watch?v=GHbxFxRTJ00",
        dueInDays: 2,
      },
      {
        title: "Read: Meta Business Help Center — Ads Guide",
        type: "READING",
        description: "Official Meta documentation on campaign structure, objectives and targeting.",
        content: "https://www.facebook.com/business/help/200000840044554",
        dueInDays: 3,
      },
      {
        title: "Study: Ad Creative Best Practices for Meta",
        type: "READING",
        description: "What makes a winning Facebook/Instagram ad — copy formulas, creative formats, and hooks.",
        content: "https://www.facebook.com/business/ads/ad-creative",
        dueInDays: 4,
      },
      {
        title: "Design a Facebook Ad Creative Set",
        type: "TASK",
        description: "Using Canva, design 3 ad creatives for the same product in different formats: (1) Single image, (2) Carousel (3 slides), (3) Story/Reel vertical. Write the ad copy for each. Document the target audience you'd use.",
        content: "https://www.canva.com/ | Facebook Ad Specs: https://www.facebook.com/business/help/271406630426697",
        dueInDays: 6,
      },
      {
        title: "📋 SATURDAY ASSIGNMENT — Meta Ads Full Funnel Campaign",
        type: "ASSIGNMENT",
        description: "Design a full Meta Ads funnel strategy for a product: TOFU (Awareness) → MOFU (Consideration) → BOFU (Conversion). For each stage: define objective, audience (cold/warm/retargeting), creative type, ad copy, and budget split. Include a retargeting plan. Submit full strategy document to manager.",
        content: "Reference: https://blog.hootsuite.com/facebook-ads-manager/",
        dueInDays: 7,
      },
    ],
  },

  {
    title: "Week 7 — Email Marketing",
    description: "Build email lists, write high-converting emails, and set up automations.",
    tasks: [
      {
        title: "Email Marketing Full Course — Beginners to Advanced",
        type: "VIDEO",
        description: "Complete email marketing guide covering list building, copywriting, and automations.",
        content: "https://www.youtube.com/watch?v=NTD4VHSW2dY",
        dueInDays: 2,
      },
      {
        title: "Read: Mailchimp's Email Marketing Field Guide",
        type: "READING",
        description: "Comprehensive guide to email strategy, segmentation, A/B testing, and deliverability.",
        content: "https://mailchimp.com/resources/email-marketing-field-guide/",
        dueInDays: 3,
      },
      {
        title: "Study: 29 Email Subject Line Formulas That Get Opened",
        type: "READING",
        description: "Proven subject line frameworks to improve open rates.",
        content: "https://optinmonster.com/101-email-subject-lines-your-subscribers-cant-resist/",
        dueInDays: 4,
      },
      {
        title: "Write a 5-Email Welcome Sequence",
        type: "TASK",
        description: "Write a 5-email welcome automation for a hypothetical SaaS product. Each email should have: subject line, preview text, body copy, and a CTA. Map the sequence on a timeline (Day 0, Day 2, Day 5, Day 8, Day 14).",
        content: "Tools to draft: https://www.mailchimp.com/ (free) | https://app.convertkit.com/ (free)",
        dueInDays: 6,
      },
      {
        title: "📋 SATURDAY ASSIGNMENT — Email Campaign + Automation Blueprint",
        type: "ASSIGNMENT",
        description: "Design a complete email marketing system: (1) Lead magnet idea + opt-in page copy, (2) 3-email nurture sequence, (3) 1 promotional blast email, (4) Re-engagement email for inactive subscribers. Include subject lines, send time rationale, and segmentation logic. Submit to manager.",
        content: "Reference: https://blog.hubspot.com/marketing/email-marketing-examples-list",
        dueInDays: 7,
      },
    ],
  },

  {
    title: "Week 8 — Analytics & Data-Driven Marketing",
    description: "Master Google Analytics 4, interpret data, and make decisions from numbers.",
    tasks: [
      {
        title: "Google Analytics 4 (GA4) Full Tutorial for Beginners",
        type: "VIDEO",
        description: "Complete GA4 walkthrough — setup, reports, events, conversions and explorations.",
        content: "https://www.youtube.com/watch?v=d4MdFYU_mlc",
        dueInDays: 2,
      },
      {
        title: "Complete Google Analytics Academy — GA4 Course",
        type: "READING",
        description: "Free official Google training. Complete all modules and take the assessment.",
        content: "https://analytics.google.com/analytics/academy/",
        dueInDays: 4,
      },
      {
        title: "Read: The Definitive Guide to KPIs in Digital Marketing",
        type: "READING",
        description: "Which metrics actually matter for each channel — beyond vanity metrics.",
        content: "https://www.semrush.com/blog/digital-marketing-kpis/",
        dueInDays: 5,
      },
      {
        title: "Build a Marketing Dashboard",
        type: "TASK",
        description: "Using Google Looker Studio (free), connect GA4 and build a one-page marketing dashboard showing: sessions, bounce rate, top pages, conversion rate, traffic sources, and device breakdown. Share the link.",
        content: "https://lookerstudio.google.com/ | GA4 Connector: built-in",
        dueInDays: 6,
      },
      {
        title: "📋 SATURDAY ASSIGNMENT — Monthly Performance Report",
        type: "ASSIGNMENT",
        description: "Using any GA4 demo account or your own data (Google offers a GA4 demo account), write a monthly marketing performance report. Include: executive summary, traffic trends, channel breakdown, top converting pages, 3 key insights, and 3 action recommendations. Format as a real client-ready document. Submit to manager.",
        content: "GA4 Demo Account: https://support.google.com/analytics/answer/6367342",
        dueInDays: 7,
      },
    ],
  },

  // ── MONTH 3: ADVANCED STRATEGIES ────────────────────────────────────────────
  {
    title: "Week 9 — Advanced SEO & Link Building",
    description: "Technical SEO, Core Web Vitals, backlink strategies and authority building.",
    tasks: [
      {
        title: "Advanced SEO Techniques — Full Course",
        type: "VIDEO",
        description: "Ahrefs' advanced SEO series covering technical SEO, link building, and content clusters.",
        content: "https://www.youtube.com/watch?v=SnxeXZpZkI0",
        dueInDays: 2,
      },
      {
        title: "Read: Backlinko's Definitive Guide to Link Building",
        type: "READING",
        description: "Proven white-hat link building strategies with real examples.",
        content: "https://backlinko.com/link-building",
        dueInDays: 3,
      },
      {
        title: "Read: Google's Core Web Vitals Documentation",
        type: "READING",
        description: "Understand LCP, FID/INP, CLS and how page experience affects rankings.",
        content: "https://web.dev/vitals/",
        dueInDays: 4,
      },
      {
        title: "Backlink Gap Analysis",
        type: "TASK",
        description: "Using Ahrefs (free trial) or Semrush, run a backlink gap analysis between a site of your choice and 3 competitors. Identify 20 domains linking to competitors but not to your chosen site. Document each with: DA/DR, link type, and an outreach strategy.",
        content: "https://ahrefs.com/link-intersect | https://www.semrush.com/analytics/backlinks/gap/",
        dueInDays: 6,
      },
      {
        title: "📋 SATURDAY ASSIGNMENT — Technical SEO + Link Building Plan",
        type: "ASSIGNMENT",
        description: "Perform a full technical SEO audit on a website using Screaming Frog. Document and prioritise: (1) Crawl errors, (2) Duplicate content, (3) Page speed issues (Core Web Vitals), (4) Schema markup opportunities. PLUS write a 6-month link building plan with specific tactics (guest posts, digital PR, broken link building). Submit full report to manager.",
        content: "Tools: https://www.screamingfrog.co.uk/seo-spider/ | https://pagespeed.web.dev/",
        dueInDays: 7,
      },
    ],
  },

  {
    title: "Week 10 — Marketing Automation & CRM",
    description: "Use HubSpot, automation workflows, lead scoring, and CRM to scale marketing.",
    tasks: [
      {
        title: "HubSpot CRM & Marketing Automation — Full Tutorial",
        type: "VIDEO",
        description: "Complete walkthrough of HubSpot's free CRM and marketing automation tools.",
        content: "https://www.youtube.com/watch?v=P3IKDQB0P2E",
        dueInDays: 2,
      },
      {
        title: "Complete HubSpot Academy: Marketing Automation Certification",
        type: "READING",
        description: "Free HubSpot certification. Complete the Marketing Automation course and get certified.",
        content: "https://academy.hubspot.com/courses/marketing-automation",
        dueInDays: 4,
      },
      {
        title: "Read: What is Lead Scoring and How to Set It Up",
        type: "READING",
        description: "Understand behavioural and demographic lead scoring models.",
        content: "https://blog.hubspot.com/marketing/lead-scoring-instructions",
        dueInDays: 5,
      },
      {
        title: "Build an Automation Workflow",
        type: "TASK",
        description: "In HubSpot (free account), set up a 5-step lead nurture workflow triggered by a form submission. Include: welcome email, 2-day delay, educational email, 4-day delay, and a sales follow-up email. Screenshot each step.",
        content: "https://app.hubspot.com/ (free forever plan)",
        dueInDays: 6,
      },
      {
        title: "📋 SATURDAY ASSIGNMENT — Lead Generation + Automation System Design",
        type: "ASSIGNMENT",
        description: "Design an end-to-end lead generation and nurturing system for a B2B SaaS company: (1) Lead magnet + landing page copy, (2) CRM pipeline stages (5 stages), (3) Lead scoring model (10 criteria), (4) Email automation workflow (6 steps), (5) Handoff to sales criteria. Visualise with a flowchart. Submit to manager.",
        content: "Flowchart tool: https://www.draw.io/ (free)",
        dueInDays: 7,
      },
    ],
  },

  {
    title: "Week 11 — Influencer Marketing & Affiliate Strategy",
    description: "Build and manage influencer campaigns, set up affiliate programmes.",
    tasks: [
      {
        title: "Influencer Marketing Full Guide — Strategy to Execution",
        type: "VIDEO",
        description: "How to find, pitch, and manage influencers for maximum ROI.",
        content: "https://www.youtube.com/watch?v=aKMK5mPSXtI",
        dueInDays: 2,
      },
      {
        title: "Read: Influencer Marketing Hub — Complete Industry Report",
        type: "READING",
        description: "Latest benchmarks, rates, and trends in influencer marketing.",
        content: "https://influencermarketinghub.com/influencer-marketing-benchmark-report/",
        dueInDays: 3,
      },
      {
        title: "Read: How to Set Up an Affiliate Programme",
        type: "READING",
        description: "Step-by-step guide to launching and scaling an affiliate marketing programme.",
        content: "https://www.affiliatewp.com/how-to-start-affiliate-marketing/",
        dueInDays: 4,
      },
      {
        title: "Influencer Research Exercise",
        type: "TASK",
        description: "Using tools like Heepsy (free trial) or manual Instagram/YouTube search, identify 15 influencers for a niche of your choice. For each: name, platform, follower count, avg engagement rate, content type, email/contact, and estimated rate. Document in a spreadsheet with your outreach pitch template.",
        content: "https://www.heepsy.com/ | https://modash.io/",
        dueInDays: 6,
      },
      {
        title: "📋 SATURDAY ASSIGNMENT — Influencer Campaign Proposal",
        type: "ASSIGNMENT",
        description: "Create a full influencer marketing campaign proposal for a product launch: (1) Campaign objective & KPIs, (2) Shortlist of 10 influencers with rationale, (3) Content brief (what they should create), (4) Compensation model (gifting/paid/affiliate), (5) Contract clauses, (6) Budget breakdown, (7) Measurement plan. Submit to manager.",
        content: "Reference: https://influencermarketinghub.com/influencer-marketing-strategy/",
        dueInDays: 7,
      },
    ],
  },

  {
    title: "Week 12 — Integrated Strategy & Capstone Project",
    description: "Bring everything together into a full 360° digital marketing strategy.",
    tasks: [
      {
        title: "Building a Full Digital Marketing Strategy — Advanced Workshop",
        type: "VIDEO",
        description: "How top digital marketers build integrated, multi-channel strategies.",
        content: "https://www.youtube.com/watch?v=gOf3hhqPvX8",
        dueInDays: 2,
      },
      {
        title: "Read: Think with Google — Digital Marketing Strategy Frameworks",
        type: "READING",
        description: "Google's own research and frameworks for digital-first marketing strategy.",
        content: "https://www.thinkwithgoogle.com/marketing-strategies/",
        dueInDays: 3,
      },
      {
        title: "Read: The See-Think-Do-Care Framework by Avinash Kaushik",
        type: "READING",
        description: "One of the most practical frameworks for full-funnel digital strategy.",
        content: "https://www.kaushik.net/avinash/see-think-do-care-win-content-marketing-measurement/",
        dueInDays: 4,
      },
      {
        title: "Study: Case Studies — Successful Digital Marketing Campaigns",
        type: "READING",
        description: "Analyse 5 real campaign case studies from Think with Google and HubSpot.",
        content: "https://www.thinkwithgoogle.com/collections/case-studies/ | https://blog.hubspot.com/marketing/marketing-case-studies",
        dueInDays: 5,
      },
      {
        title: "Prepare Your Capstone Presentation",
        type: "TASK",
        description: "Begin drafting your final 360° digital marketing strategy (see Saturday assignment). Prepare a slide deck (10–15 slides) using Google Slides or Canva. Structure: Brand overview → Market analysis → Target audience → Channel strategy → Content plan → Paid media plan → Budget → KPIs → 90-day roadmap.",
        content: "https://www.canva.com/presentations/ | https://slides.google.com/",
        dueInDays: 6,
      },
      {
        title: "📋 FINAL SATURDAY ASSIGNMENT — 360° Digital Marketing Strategy (Capstone)",
        type: "ASSIGNMENT",
        description: "This is your capstone project — the culmination of 3 months of learning.\n\nChoose a real or hypothetical brand and deliver a complete integrated digital marketing strategy:\n\n1. Brand & Market Analysis (SWOT, competitor landscape)\n2. Target Audience (3 buyer personas)\n3. Channel Mix (SEO + Content + Social + Paid + Email)\n4. 12-Month Content Calendar (themes per month)\n5. Paid Media Plan (Google + Meta) with budget breakdown\n6. Email Marketing Strategy (welcome flow + monthly newsletters)\n7. KPI Dashboard (what to measure and how)\n8. 90-Day Action Roadmap with milestones\n\nFormat: 15-slide presentation + 2-page executive summary.\n\nPresent live to your manager. This will be scored and forms part of your performance review.",
        content: "Submit slides + executive summary PDF to your manager. Schedule a 30-minute presentation slot.",
        dueInDays: 7,
      },
    ],
  },
];

async function main() {
  console.log("🎓 Seeding Digital Marketing Course...");

  // Avoid duplicates
  const existing = await db.learningCourse.findFirst({
    where: { title: { contains: "Complete Digital Marketing Mastery" } },
  });
  if (existing) {
    console.log("⚠️  Course already exists, skipping.");
    return;
  }

  const course = await db.learningCourse.create({ data: COURSE });
  console.log(`✅ Course created: ${course.id}`);

  for (let i = 0; i < MODULES.length; i++) {
    const { tasks, ...moduleData } = MODULES[i];
    const mod = await db.learningModule.create({
      data: {
        ...moduleData,
        courseId: course.id,
        order: i,
        tasks: {
          create: tasks.map((t, j) => ({ ...t, order: j })),
        },
      },
    });
    console.log(`  📚 Module ${i + 1}: ${mod.title}`);
  }

  console.log("\n🚀 Done! 3-month Digital Marketing course is live in the LMS.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
