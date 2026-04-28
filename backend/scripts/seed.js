const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const User = require("../src/models/User");
const Skill = require("../src/models/Skill");
const Interest = require("../src/models/Interest");
const BusinessIdea = require("../src/models/BusinessIdea");
const Roadmap = require("../src/models/Roadmap");
const LearningResource = require("../src/models/LearningResource");
const MentorSession = require("../src/models/MentorSession");
const Progress = require("../src/models/Progress");
const Feedback = require("../src/models/Feedback");
const CourseTrack = require("../src/models/CourseTrack");
const CourseProgress = require("../src/models/CourseProgress");
const { defaultInterests: interestsData, defaultSkills: skillsData } = require("../src/config/defaultCatalog");

const seed = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Skill.deleteMany({}),
    Interest.deleteMany({}),
    BusinessIdea.deleteMany({}),
    Roadmap.deleteMany({}),
    LearningResource.deleteMany({}),
    MentorSession.deleteMany({}),
    Progress.deleteMany({}),
    Feedback.deleteMany({}),
    CourseTrack.deleteMany({}),
    CourseProgress.deleteMany({})
  ]);

  const [admin, mentorA, mentorB, mentorPending, userA, userB] = await User.create([
    {
      name: "Platform Admin",
      email: "admin@entreskillhub.com",
      password: "Admin@123",
      role: "admin",
      emailVerified: true,
      skills: ["Digital Marketing"],
      interests: ["Online Selling"]
    },
    {
      name: "Rina Sharma",
      email: "mentor1@entreskillhub.com",
      password: "Mentor@123",
      role: "mentor",
      emailVerified: true,
      mentorVerified: true,
      mentorApplicationStatus: "approved",
      expertise: ["Tailoring", "Handicrafts"],
      experienceYears: 8,
      availability: "Weekdays 5 PM - 8 PM",
      bio: "Women entrepreneurship mentor for handmade products."
    },
    {
      name: "Arun Menon",
      email: "mentor2@entreskillhub.com",
      password: "Mentor@123",
      role: "mentor",
      emailVerified: true,
      mentorVerified: true,
      mentorApplicationStatus: "approved",
      expertise: ["Food Preparation", "Digital Marketing"],
      experienceYears: 10,
      availability: "Weekends 10 AM - 1 PM",
      bio: "Food startup advisor and marketing coach."
    },
    {
      name: "Sonia Iyer",
      email: "mentor3@entreskillhub.com",
      password: "Mentor@123",
      role: "mentor",
      emailVerified: true,
      mentorVerified: false,
      mentorApplicationStatus: "pending",
      expertise: ["Graphic Design", "Digital Marketing"],
      experienceYears: 5,
      availability: "Weekdays 7 PM - 9 PM",
      bio: "Branding consultant for first-time women-led businesses.",
      mentorApplication: {
        motivation: "I want to help aspiring founders build practical go-to-market plans.",
        experienceSummary: "5 years helping local stores with design and social media growth.",
        specialization: ["Graphic Design", "Digital Marketing"],
        portfolioUrl: "https://www.behance.net",
        linkedinUrl: "https://www.linkedin.com",
        submittedAt: new Date()
      }
    },
    {
      name: "Priya Kumari",
      email: "user1@entreskillhub.com",
      password: "User@123",
      role: "user",
      emailVerified: true,
      skills: ["Tailoring", "Handicrafts"],
      interests: ["Home Business", "Online Selling"],
      location: "Hyderabad"
    },
    {
      name: "Rahul Das",
      email: "user2@entreskillhub.com",
      password: "User@123",
      role: "user",
      emailVerified: true,
      skills: ["Food Preparation", "Digital Marketing"],
      interests: ["Local Market Sales", "Community Service"],
      location: "Kolkata"
    }
  ]);

  await Skill.insertMany(skillsData);
  await Interest.insertMany(interestsData);

  const ideas = await BusinessIdea.insertMany([
    {
      title: "Home-Based Tailoring Studio",
      description: "Offer custom stitching, alterations, and school uniform services from home.",
      category: "Apparel",
      matchedSkills: ["Tailoring"],
      matchedInterests: ["Home Business", "Local Market Sales"],
      estimatedInvestment: "Low to Medium",
      marketPotential: "Strong Local Demand",
      difficulty: "Beginner",
      tags: ["stitching", "alterations", "women entrepreneurship"]
    },
    {
      title: "Handmade Gift & Decor Shop",
      description: "Create and sell handcrafted gift items through local exhibitions and online channels.",
      category: "Crafts",
      matchedSkills: ["Handicrafts", "Graphic Design"],
      matchedInterests: ["Creative Arts", "Online Selling"],
      estimatedInvestment: "Low",
      marketPotential: "Seasonal High Growth",
      difficulty: "Beginner",
      tags: ["handmade", "decor", "online store"]
    },
    {
      title: "Cloud Kitchen for Regional Snacks",
      description: "Run a home kitchen selling ready-to-eat snacks via local delivery partners.",
      category: "Food",
      matchedSkills: ["Food Preparation", "Digital Marketing"],
      matchedInterests: ["Home Business", "Online Selling"],
      estimatedInvestment: "Medium",
      marketPotential: "Very High Urban Demand",
      difficulty: "Intermediate",
      tags: ["cloud kitchen", "snacks", "food business"]
    },
    {
      title: "Mobile Repair and Service Kiosk",
      description: "Start a local gadget repair point with doorstep service for basic device issues.",
      category: "Services",
      matchedSkills: ["Repair Services"],
      matchedInterests: ["Community Service", "Local Market Sales"],
      estimatedInvestment: "Medium",
      marketPotential: "Stable",
      difficulty: "Intermediate",
      tags: ["repair", "doorstep", "local service"]
    }
  ]);

  const [tailoringRoadmap, handicraftRoadmap, kitchenRoadmap, repairRoadmap] = await Roadmap.insertMany([
    {
      businessIdea: ideas[0]._id,
      title: "Tailoring Studio Launch Roadmap",
      overview: "Step-by-step plan from idea validation to first 30 paying customers.",
      costEstimate: { min: 25000, max: 70000, currency: "INR" },
      steps: [
        {
          order: 1,
          title: "Validate local demand",
          description: "Talk to nearby households, schools, and boutiques to validate demand.",
          durationDays: 5,
          requiredSkills: ["Tailoring"],
          requiredTools: ["Survey sheet", "Phone"],
          legalSteps: ["Check local home business permissions"],
          marketingTips: ["Collect early interest on WhatsApp groups"]
        },
        {
          order: 2,
          title: "Set up tools and workspace",
          description: "Arrange sewing machine, cutting table, iron, and measurement kit.",
          durationDays: 7,
          requiredSkills: ["Tailoring"],
          requiredTools: ["Sewing machine", "Measuring tape", "Fabric samples"],
          legalSteps: [],
          marketingTips: ["Share before/after product photos"]
        },
        {
          order: 3,
          title: "Register and launch",
          description: "Complete UDYAM/GST as applicable and launch with introductory offers.",
          durationDays: 10,
          requiredSkills: ["Tailoring", "Digital Marketing"],
          requiredTools: ["PAN", "Bank account", "Smartphone"],
          legalSteps: ["Register UDYAM", "Open current account"],
          marketingTips: ["Launch referral program for first 20 customers"]
        }
      ]
    },
    {
      businessIdea: ideas[1]._id,
      title: "Handmade Product Business Roadmap",
      overview: "Build a micro-brand for handcrafted gifts and decor products.",
      costEstimate: { min: 15000, max: 50000, currency: "INR" },
      steps: [
        {
          order: 1,
          title: "Pick product line",
          description: "Select 3 profitable handcrafted products and test with known customers.",
          durationDays: 5,
          requiredSkills: ["Handicrafts"],
          requiredTools: ["Craft tools", "Raw materials"],
          legalSteps: [],
          marketingTips: ["Collect testimonials quickly"]
        },
        {
          order: 2,
          title: "Create brand identity",
          description: "Design logo, packaging style, and pricing structure.",
          durationDays: 4,
          requiredSkills: ["Graphic Design"],
          requiredTools: ["Canva", "Printer"],
          legalSteps: [],
          marketingTips: ["Post making process reels"]
        },
        {
          order: 3,
          title: "Sell online and offline",
          description: "List products on social channels and local weekend markets.",
          durationDays: 10,
          requiredSkills: ["Digital Marketing"],
          requiredTools: ["Instagram page", "Catalog PDF"],
          legalSteps: ["Register business name if required"],
          marketingTips: ["Run launch giveaway"]
        }
      ]
    },
    {
      businessIdea: ideas[2]._id,
      title: "Cloud Kitchen Startup Roadmap",
      overview: "Launch a compliant, high-demand home kitchen service.",
      costEstimate: { min: 40000, max: 120000, currency: "INR" },
      steps: [
        {
          order: 1,
          title: "Define menu and margins",
          description: "Finalize top 10 menu items with ingredient costing and margins.",
          durationDays: 7,
          requiredSkills: ["Food Preparation"],
          requiredTools: ["Recipe sheet", "Costing template"],
          legalSteps: [],
          marketingTips: ["Offer trial tasting packs"]
        },
        {
          order: 2,
          title: "Obtain licenses",
          description: "Apply for FSSAI and local food permits.",
          durationDays: 10,
          requiredSkills: [],
          requiredTools: ["Identity docs", "Kitchen photos"],
          legalSteps: ["FSSAI registration", "Local municipality clearance"],
          marketingTips: []
        },
        {
          order: 3,
          title: "Go live with delivery",
          description: "Start local delivery, monitor feedback, and improve packaging.",
          durationDays: 14,
          requiredSkills: ["Digital Marketing"],
          requiredTools: ["Delivery partner tie-up", "Packaging boxes"],
          legalSteps: [],
          marketingTips: ["Neighborhood influencer collaborations"]
        }
      ]
    },
    {
      businessIdea: ideas[3]._id,
      title: "Repair Kiosk Setup Roadmap",
      overview: "Create a local trusted repair service with predictable monthly revenue.",
      costEstimate: { min: 50000, max: 150000, currency: "INR" },
      steps: [
        {
          order: 1,
          title: "Identify repair demand",
          description: "Survey common repair needs in your area and define service menu.",
          durationDays: 5,
          requiredSkills: ["Repair Services"],
          requiredTools: ["Survey sheet"],
          legalSteps: [],
          marketingTips: ["Door-to-door introductory flyers"]
        },
        {
          order: 2,
          title: "Set up kiosk",
          description: "Arrange tools, spare inventory, and service desk.",
          durationDays: 12,
          requiredSkills: ["Repair Services"],
          requiredTools: ["Toolkit", "Spare components"],
          legalSteps: ["Trade license"],
          marketingTips: ["Street-side signage"]
        },
        {
          order: 3,
          title: "Launch service plans",
          description: "Offer subscription-based annual maintenance services.",
          durationDays: 8,
          requiredSkills: ["Digital Marketing"],
          requiredTools: ["Service logbook", "Billing app"],
          legalSteps: [],
          marketingTips: ["Google Business profile setup"]
        }
      ]
    }
  ]);

  const resources = await LearningResource.insertMany([
    {
      title: "SBA Learning Platform",
      description: "Official SBA courses and learning plans for starting and scaling a small business.",
      type: "video",
      url: "https://www.sba.gov/learning-platform",
      topic: "Business Planning",
      tags: ["sba", "planning", "startup"],
      durationMinutes: 45,
      uploadedBy: mentorA._id,
      status: "approved"
    },
    {
      title: "Write Your Business Plan (SBA Guide)",
      description: "Step-by-step guide to writing a practical and lender-ready business plan.",
      type: "article",
      url: "https://www.sba.gov/business-guide/plan-your-business/write-your-business-plan",
      topic: "Business Planning",
      tags: ["business plan", "planning"],
      durationMinutes: 25,
      uploadedBy: mentorA._id,
      status: "approved"
    },
    {
      title: "Market Research and Competitive Analysis (SBA)",
      description: "How to validate demand, customer segments, and competition before launch.",
      type: "article",
      url: "https://www.sba.gov/business-guide/plan-your-business/market-research-competitive-analysis",
      topic: "Idea Validation",
      tags: ["validation", "market research", "competition"],
      durationMinutes: 20,
      uploadedBy: mentorB._id,
      status: "approved"
    },
    {
      title: "Choose a Business Structure (SBA)",
      description: "Understand sole proprietorship, partnership, LLC and other structure options.",
      type: "article",
      url: "https://www.sba.gov/business-guide/launch-your-business/choose-business-structure",
      topic: "Legal Basics",
      tags: ["legal", "registration", "structure"],
      durationMinutes: 15,
      uploadedBy: mentorB._id,
      status: "approved"
    },
    {
      title: "Apply for Licenses and Permits (SBA)",
      description: "Official checklist for permits and licenses needed before operating.",
      type: "checklist",
      url: "https://www.sba.gov/business-guide/launch-your-business/apply-licenses-permits",
      topic: "Legal Basics",
      tags: ["licenses", "permits", "compliance"],
      durationMinutes: 20,
      uploadedBy: mentorA._id,
      status: "approved"
    },
    {
      title: "IRS Employer Identification Number (EIN)",
      description: "Official IRS EIN information for tax and business registration workflows.",
      type: "article",
      url: "https://www.irs.gov/businesses/small-businesses-self-employed/employer-id-numbers",
      topic: "Tax and Registration",
      tags: ["ein", "tax", "irs"],
      durationMinutes: 12,
      uploadedBy: mentorB._id,
      status: "approved"
    },
    {
      title: "Udyam Registration (Official MSME Portal)",
      description: "Government of India portal for MSME registration and classification.",
      type: "article",
      url: "https://www.udyamregistration.gov.in/",
      topic: "India Registration",
      tags: ["udyam", "msme", "india"],
      durationMinutes: 20,
      uploadedBy: mentorA._id,
      status: "approved"
    },
    {
      title: "FSSAI Main Portal",
      description: "Official source for food safety regulations and compliance in India.",
      type: "article",
      url: "https://www.fssai.gov.in/",
      topic: "Food Compliance",
      tags: ["fssai", "food", "compliance"],
      durationMinutes: 15,
      uploadedBy: mentorB._id,
      status: "approved"
    },
    {
      title: "FoSCoS Login Portal",
      description: "FSSAI FoSCoS portal for food business registration and licensing workflows.",
      type: "checklist",
      url: "https://foscos.fssai.gov.in/",
      topic: "Food Compliance",
      tags: ["foscos", "license", "food business"],
      durationMinutes: 20,
      uploadedBy: mentorB._id,
      status: "approved"
    },
    {
      title: "HubSpot Academy",
      description: "Free inbound marketing and digital sales learning for small business owners.",
      type: "video",
      url: "https://academy.hubspot.com/",
      topic: "Digital Marketing",
      tags: ["hubspot", "marketing", "sales"],
      durationMinutes: 35,
      uploadedBy: mentorPending._id,
      status: "pending"
    }
  ]);

  const tracks = await CourseTrack.insertMany([
    {
      title: "Startup Foundations for Micro Entrepreneurs",
      slug: "startup-foundations-micro-entrepreneurs",
      category: "Business Planning",
      level: "Beginner",
      estimatedHours: 8,
      description:
        "Build a complete business launch foundation from idea validation to legal setup and startup budgeting.",
      tags: ["foundation", "business-plan", "legal", "startup-costs"],
      linkedSkills: ["Digital Marketing", "Tailoring", "Handicrafts", "Food Preparation", "Repair Services"],
      linkedInterests: ["Home Business", "Local Market Sales", "Online Selling"],
      modules: [
        {
          moduleId: "m1-idea-validation",
          title: "Validate the Opportunity",
          overview: "Confirm that your skill solves a real and urgent customer problem.",
          lessons: [
            {
              lessonId: "m1-l1",
              title: "Market Research Basics",
              summary: "Understand customer demand, segment priorities, and local opportunities.",
              type: "article",
              url: "https://www.sba.gov/business-guide/plan-your-business/market-research-competitive-analysis",
              sourceName: "U.S. Small Business Administration",
              durationMinutes: 20
            },
            {
              lessonId: "m1-l2",
              title: "Build a Simple Validation Checklist",
              summary: "Use a customer-interview checklist to validate your first offer.",
              type: "checklist",
              url: "https://www.sba.gov/learning-platform",
              sourceName: "U.S. Small Business Administration",
              durationMinutes: 25
            }
          ]
        },
        {
          moduleId: "m2-legal-setup",
          title: "Legal and Registration Setup",
          overview: "Choose structure and register correctly before launch.",
          lessons: [
            {
              lessonId: "m2-l1",
              title: "Choose Business Structure",
              summary: "Compare sole proprietorship, partnership, LLC, and tax implications.",
              type: "article",
              url: "https://www.sba.gov/business-guide/launch-your-business/choose-business-structure",
              sourceName: "U.S. Small Business Administration",
              durationMinutes: 15
            },
            {
              lessonId: "m2-l2",
              title: "Licenses and Permits Checklist",
              summary: "Create a location-specific legal compliance checklist for launch.",
              type: "checklist",
              url: "https://www.sba.gov/business-guide/launch-your-business/apply-licenses-permits",
              sourceName: "U.S. Small Business Administration",
              durationMinutes: 20
            },
            {
              lessonId: "m2-l3",
              title: "EIN and Tax Basics",
              summary: "Get your EIN and understand first-step tax readiness.",
              type: "article",
              url: "https://www.irs.gov/businesses/small-businesses-self-employed/employer-id-numbers",
              sourceName: "Internal Revenue Service",
              durationMinutes: 12
            }
          ]
        },
        {
          moduleId: "m3-startup-finance",
          title: "Startup Costing and First Revenue Plan",
          overview: "Translate the idea into numbers, pricing, and first month targets.",
          lessons: [
            {
              lessonId: "m3-l1",
              title: "Calculate Startup Costs",
              summary: "Estimate setup, operating, and contingency costs before launch.",
              type: "article",
              url: "https://www.sba.gov/business-guide/plan-your-business/calculate-your-startup-costs",
              sourceName: "U.S. Small Business Administration",
              durationMinutes: 20
            },
            {
              lessonId: "m3-l2",
              title: "Write Your First Business Plan Draft",
              summary: "Create a one-page business plan covering offer, pricing, and channels.",
              type: "template",
              url: "https://www.sba.gov/business-guide/plan-your-business/write-your-business-plan",
              sourceName: "U.S. Small Business Administration",
              durationMinutes: 30
            }
          ]
        }
      ],
      published: true,
      createdBy: admin._id
    },
    {
      title: "Digital Sales and Marketing for Small Businesses",
      slug: "digital-sales-and-marketing-small-business",
      category: "Digital Growth",
      level: "Beginner",
      estimatedHours: 7,
      description:
        "Learn practical digital marketing and online selling workflows to acquire and retain first customers.",
      tags: ["digital", "social-media", "sales", "content"],
      linkedSkills: ["Digital Marketing", "Graphic Design", "Photography"],
      linkedInterests: ["Online Selling", "Creative Arts"],
      modules: [
        {
          moduleId: "dm1-foundation",
          title: "Digital Presence Foundation",
          overview: "Set up your storefront and basic trust assets online.",
          lessons: [
            {
              lessonId: "dm1-l1",
              title: "Google Business Presence Basics",
              summary: "Set up discoverability and contact channels for local trust.",
              type: "article",
              url: "https://grow.google/intl/en_in/",
              sourceName: "Grow with Google",
              durationMinutes: 20
            },
            {
              lessonId: "dm1-l2",
              title: "Canva Design School Essentials",
              summary: "Create simple, consistent creatives for product and service promotion.",
              type: "video",
              url: "https://www.canva.com/designschool/",
              sourceName: "Canva Design School",
              durationMinutes: 25
            }
          ]
        },
        {
          moduleId: "dm2-content",
          title: "Content and Campaign Execution",
          overview: "Publish useful content and convert followers into paying customers.",
          lessons: [
            {
              lessonId: "dm2-l1",
              title: "Meta Business Learn Hub",
              summary: "Use Meta tools to build awareness campaigns for local audiences.",
              type: "video",
              url: "https://www.facebook.com/business/learn",
              sourceName: "Meta Business",
              durationMinutes: 35
            },
            {
              lessonId: "dm2-l2",
              title: "HubSpot Inbound and CRM Basics",
              summary: "Manage leads and follow-ups through structured CRM workflows.",
              type: "article",
              url: "https://academy.hubspot.com/",
              sourceName: "HubSpot Academy",
              durationMinutes: 30
            }
          ]
        }
      ],
      published: true,
      createdBy: admin._id
    },
    {
      title: "India Microbusiness Compliance Track",
      slug: "india-microbusiness-compliance-track",
      category: "Compliance",
      level: "Beginner",
      estimatedHours: 6,
      description:
        "Understand practical registration, tax, and food compliance steps for Indian micro entrepreneurs.",
      tags: ["india", "msme", "fssai", "gst"],
      linkedSkills: ["Food Preparation", "Tailoring", "Repair Services"],
      linkedInterests: ["Home Business", "Local Market Sales"],
      modules: [
        {
          moduleId: "ic1-msme",
          title: "MSME Registration",
          overview: "Register your enterprise and use MSME documentation for credibility.",
          lessons: [
            {
              lessonId: "ic1-l1",
              title: "Udyam Registration Official Portal",
              summary: "Complete MSME registration on the official Udyam portal.",
              type: "checklist",
              url: "https://www.udyamregistration.gov.in/",
              sourceName: "Government of India, Ministry of MSME",
              durationMinutes: 20
            }
          ]
        },
        {
          moduleId: "ic2-food",
          title: "Food Business Compliance",
          overview: "If you run a food business, complete mandatory registration and compliance steps.",
          lessons: [
            {
              lessonId: "ic2-l1",
              title: "FSSAI Main Portal",
              summary: "Understand food standards and compliance requirements from FSSAI.",
              type: "article",
              url: "https://www.fssai.gov.in/",
              sourceName: "FSSAI",
              durationMinutes: 15
            },
            {
              lessonId: "ic2-l2",
              title: "FoSCoS Registration Portal",
              summary: "Use FoSCoS for FBO registration and license workflow.",
              type: "checklist",
              url: "https://foscos.fssai.gov.in/",
              sourceName: "FoSCoS",
              durationMinutes: 20
            }
          ]
        },
        {
          moduleId: "ic3-tax",
          title: "Tax and Digital Compliance",
          overview: "Learn essential GST and tax portal references.",
          lessons: [
            {
              lessonId: "ic3-l1",
              title: "GST Official Portal",
              summary: "Reference for GST registration and filings.",
              type: "tool",
              url: "https://www.gst.gov.in/",
              sourceName: "GSTN",
              durationMinutes: 15
            }
          ]
        }
      ],
      published: true,
      createdBy: admin._id
    }
  ]);

  await Progress.insertMany([
    {
      user: userA._id,
      roadmap: tailoringRoadmap._id,
      completedStepOrders: [1],
      completionPercent: 33
    },
    {
      user: userB._id,
      roadmap: kitchenRoadmap._id,
      completedStepOrders: [1, 2],
      completionPercent: 67
    }
  ]);

  await MentorSession.insertMany([
    {
      mentor: mentorA._id,
      mentee: userA._id,
      topic: "Pricing strategy for custom stitching",
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "confirmed"
    },
    {
      mentor: mentorB._id,
      mentee: userB._id,
      topic: "Cloud kitchen launch guidance",
      scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      status: "requested"
    }
  ]);

  await Feedback.insertMany([
    {
      fromUser: userA._id,
      toUser: mentorA._id,
      type: "mentor",
      rating: 5,
      comment: "Great practical guidance with clear next actions."
    },
    {
      fromUser: userB._id,
      type: "platform",
      rating: 4,
      comment: "Roadmaps are very helpful for beginners."
    }
  ]);

  userA.bookmarks = [ideas[0]._id, ideas[1]._id];
  userB.bookmarks = [ideas[2]._id];
  await userA.save();
  await userB.save();

  await CourseProgress.insertMany([
    {
      user: userA._id,
      track: tracks[0]._id,
      completedLessonIds: ["m1-l1", "m1-l2", "m2-l1"],
      completionPercent: 43,
      lastLessonId: "m2-l1"
    },
    {
      user: userB._id,
      track: tracks[1]._id,
      completedLessonIds: ["dm1-l1"],
      completionPercent: 25,
      lastLessonId: "dm1-l1"
    }
  ]);

  console.log("Seed completed successfully.");
  console.log("Admin: admin@entreskillhub.com / Admin@123");
  console.log("Mentor: mentor1@entreskillhub.com / Mentor@123");
  console.log("User: user1@entreskillhub.com / User@123");

  await mongoose.connection.close();
};

seed().catch(async (error) => {
  console.error("Seed failed:", error);
  await mongoose.connection.close();
  process.exit(1);
});
