import { workspace } from "vscode";

export function getConfigs() {
  const inputDataTypes: string[] = workspace.getConfiguration("ethereuminspector").get("inputDataTypes");
  const forms: string[] = workspace.getConfiguration("ethereuminspector").get("hoverContent");

  let endianness: string = workspace.getConfiguration("ethereuminspector").get("endianness");
  endianness = endianness.charAt(0).toUpperCase() + endianness.slice(1).toLowerCase() + " Endian";

  const explorers: {
    [chain: string]: string;
  } = workspace.getConfiguration("ethereuminspector").get("explorers");

  return {
    inputDataTypes,
    forms,
    endianness,
    explorers,
  };
}
