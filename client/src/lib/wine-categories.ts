import { WineCategory, WineCategoryType } from "@shared/schema";

export const getCategoryColor = (category: string): string => {
  switch (category) {
    case WineCategory.RED:
      return "#7f1d1d"; // Dark red
    case WineCategory.WHITE:
      return "#a16207"; // Gold
    case WineCategory.ROSE:
      return "#be185d"; // Pink
    case WineCategory.FORTIFIED:
      return "#854d0e"; // Amber/Brown
    case WineCategory.BEER:
      return "#92400e"; // Amber
    case WineCategory.CIDER:
      return "#65a30d"; // Green
    case WineCategory.OTHER:
    default:
      return "#475569"; // Slate
  }
};

export const getCategoryIcon = (category: string): string => {
  switch (category) {
    case WineCategory.RED:
      return "🍷";
    case WineCategory.WHITE:
      return "🥂";
    case WineCategory.ROSE:
      return "🌹";
    case WineCategory.FORTIFIED:
      return "🥃";
    case WineCategory.BEER:
      return "🍺";
    case WineCategory.CIDER:
      return "🍎";
    case WineCategory.OTHER:
    default:
      return "🥤";
  }
};

// Categories that can have vintages
export const getVintageApplicableCategories = (): WineCategoryType[] => {
  return [WineCategory.RED, WineCategory.WHITE, WineCategory.ROSE];
};
