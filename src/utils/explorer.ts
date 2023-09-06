export const getExplorerLinks = (explorers, word) => {
  return Object.entries(explorers)
    .map(([chain, uri]): string => {
      return `[${chain}](${uri}/${word}\)`;
    })
    .join(" | ");
};
