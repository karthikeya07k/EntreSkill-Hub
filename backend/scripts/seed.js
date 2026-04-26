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

const skillsData = [
  { name: "Tailoring", category: "Crafts", description: "Stitching and garment customization." },
  { name: "Handicrafts", category: "Crafts", description: "Manual craft and decorative product making." },
  { name: "Food Preparation", category: "Food", description: "Cooking, snack making, and catering basics." },
  { name: "Repair Services", category: "Services", description: "Home appliance and gadget repair." },
  { name: "Digital Marketing", category: "Digital", description: "Online promotion and social media marketing." },
  { name: "Graphic Design", category: "Digital", description: "Visual branding and creative design." },
  { name: "Photography", category: "Digital", description: "Photoshoots and image editing." },
  { name: "Beauty Services", category: "Services", description: "Salon and grooming services." }
];

const interestsData = [
  { name: "Home Business", description: "Building a business from home." },
  { name: "Local Market Sales", description: "Selling products in local communities." },
  { name: "Online Selling", description: "Selling through social and e-commerce platforms." },
  { name: "Community Service", description: "Serving and improving local communities." },
  { name: "Creative Arts", description: "Creative expression and handmade products." }
];

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
    Feedback.deleteMany({})
  ]);

  const [admin, mentorA, mentorB, userA, userB] = await User.create([
    {
      name: "Platform Admin",
      email: "admin@entreskillhub.com",
      password: "Admin@123",
      role: "admin",
      skills: ["Digital Marketing"],
      interests: ["Online Selling"]
    },
    {
      name: "Rina Sharma",
      email: "mentor1@entreskillhub.com",
      password: "Mentor@123",
      role: "mentor",
      mentorVerified: true,
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
      mentorVerified: true,
      expertise: ["Food Preparation", "Digital Marketing"],
      experienceYears: 10,
      availability: "Weekends 10 AM - 1 PM",
      bio: "Food startup advisor and marketing coach."
    },
    {
      name: "Priya Kumari",
      email: "user1@entreskillhub.com",
      password: "User@123",
      role: "user",
      skills: ["Tailoring", "Handicrafts"],
      interests: ["Home Business", "Online Selling"],
      location: "Hyderabad"
    },
    {
      name: "Rahul Das",
      email: "user2@entreskillhub.com",
      password: "User@123",
      role: "user",
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
      title: "Tailoring Business Starter Checklist",
      description: "A checklist for setup, legal basics, pricing, and first customers.",
      type: "checklist",
      url: "https://example.com/tailoring-checklist",
      topic: "Tailoring",
      tags: ["tailoring", "startup"],
      durationMinutes: 15,
      uploadedBy: mentorA._id,
      status: "approved"
    },
    {
      title: "Food Costing for Small Kitchens",
      description: "Learn unit economics and margin planning for home food businesses.",
      type: "video",
      url: "https://example.com/food-costing-video",
      topic: "Food Preparation",
      tags: ["cloud kitchen", "costing"],
      durationMinutes: 25,
      uploadedBy: mentorB._id,
      status: "approved"
    },
    {
      title: "Instagram Marketing for Handmade Products",
      description: "Simple content and marketing plan for handmade product entrepreneurs.",
      type: "article",
      url: "https://example.com/instagram-handmade",
      topic: "Digital Marketing",
      tags: ["marketing", "handicrafts"],
      durationMinutes: 12,
      uploadedBy: mentorA._id,
      status: "pending"
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
