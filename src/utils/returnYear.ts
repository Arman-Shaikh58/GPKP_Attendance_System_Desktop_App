export function getYearLabel(startYear:number) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; 

  let yearsDiff = currentYear - startYear;
  
  if (currentMonth < 6) {
    yearsDiff -= 1;
  }

  // Determine label
  if (yearsDiff === 0) return "fy"; 
  if (yearsDiff === 1) return "sy"; 
  if (yearsDiff === 2) return "ty"; 
  if (yearsDiff > 2) return `passout+${startYear + yearsDiff}`; 

  return "Invalid"; 
}


