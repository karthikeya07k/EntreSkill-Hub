const MARKET_SCORE = {
  "Very High Urban Demand": 10,
  "Strong Local Demand": 8,
  Stable: 6,
  Local: 5,
  "Seasonal High Growth": 4
};

const getFitLevel = (score) => {
  if (score >= 80) return "Excellent fit";
  if (score >= 60) return "Strong fit";
  if (score >= 40) return "Potential fit";
  return "Explore after profile updates";
};

const calculateMatchScore = (idea, selectedSkills = [], selectedInterests = []) => {
  const matchedSkills = idea.matchedSkills.filter((skill) => selectedSkills.includes(skill));
  const matchedInterests = idea.matchedInterests.filter((interest) => selectedInterests.includes(interest));
  const missingSkills = idea.matchedSkills.filter((skill) => !selectedSkills.includes(skill));

  const skillCoverage = idea.matchedSkills.length
    ? matchedSkills.length / idea.matchedSkills.length
    : selectedSkills.length
      ? 0.4
      : 0;
  const interestCoverage = idea.matchedInterests.length
    ? matchedInterests.length / idea.matchedInterests.length
    : selectedInterests.length
      ? 0.4
      : 0;

  const difficultyBoost =
    idea.difficulty === "Beginner" ? 5 : idea.difficulty === "Intermediate" ? 3 : 1;
  const marketBoost = MARKET_SCORE[idea.marketPotential] || 5;

  const rawScore = skillCoverage * 55 + interestCoverage * 30 + difficultyBoost + marketBoost;
  const matchScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  return {
    fitLevel: getFitLevel(matchScore),
    matchScore,
    matchedInterests,
    matchedSkills,
    missingSkills
  };
};

const buildRecommendations = (ideas, selectedSkills = [], selectedInterests = []) => {
  if (!selectedSkills.length && !selectedInterests.length) {
    return [];
  }

  return ideas
    .map((idea) => {
      const ideaObject = typeof idea.toObject === "function" ? idea.toObject() : idea;
      const score = calculateMatchScore(idea, selectedSkills, selectedInterests);

      return {
        ...ideaObject,
        ...score,
        recommendationSummary: score.matchedSkills.length || score.matchedInterests.length
          ? `Matched ${score.matchedSkills.length} skill(s) and ${score.matchedInterests.length} interest(s).`
          : "Add more profile signals to improve recommendations."
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
};

module.exports = {
  buildRecommendations
};
