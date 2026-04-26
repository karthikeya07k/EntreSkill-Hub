const calculateMatchScore = (idea, selectedSkills = [], selectedInterests = []) => {
  const skillMatches = idea.matchedSkills.filter((skill) => selectedSkills.includes(skill)).length;
  const interestMatches = idea.matchedInterests.filter((interest) => selectedInterests.includes(interest)).length;

  return skillMatches * 2 + interestMatches;
};

const buildRecommendations = (ideas, selectedSkills, selectedInterests) =>
  ideas
    .map((idea) => ({
      ...idea.toObject(),
      matchScore: calculateMatchScore(idea, selectedSkills, selectedInterests)
    }))
    .sort((a, b) => b.matchScore - a.matchScore);

module.exports = {
  buildRecommendations
};
