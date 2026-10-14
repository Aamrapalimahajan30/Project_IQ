const calculateLevel = (xp) => {
  const level = Math.floor(xp / 600) + 1;
  const levels = [
    'Project Novice', 'File Explorer', 'Code Tinkerer', 
    'Code Explorer', 'Structure Specialist', 'Architecture Novice', 
    'Project Explorer', 'viva Graduate', 'Interview Ready', 'Lead Architect'
  ];
  const levelName = levels[level - 1] || 'Lead Architect';
  return { level, levelName };
};

const awardXP = async (user, amount, source) => {
  user.xp += parseInt(amount);
  const { level, levelName } = calculateLevel(user.xp);
  user.level = level;
  user.levelName = levelName;
  await user.save();
  return user;
};

module.exports = {
  calculateLevel,
  awardXP
};
