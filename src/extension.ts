"use strict";

import { ExtensionContext, Hover, languages, workspace } from "vscode";
import * as inputHandlers from "./utils/input-handlers";
import { getAddress } from "ethers";

export function activate(context: ExtensionContext) {
  var hover = languages.registerHoverProvider(
    { scheme: "*", language: "*" },
    {
      provideHover(document, position, token) {
        var word = document.getText(document.getWordRangeAtPosition(position));

        let inputDataTypes: string[] = workspace.getConfiguration("ethereuminspector").get("inputDataTypes");
        let forms: string[] = workspace.getConfiguration("ethereuminspector").get("hoverContent");
        let endianness: string = workspace.getConfiguration("ethereuminspector").get("endianness");

        endianness = endianness.charAt(0).toUpperCase() + endianness.slice(1).toLowerCase() + " Endian";

        if (inputDataTypes.length == 0 || forms.length == 0) {
          return undefined;
        }

        let bytes: Uint8Array;
        let formsMap: inputHandlers.MapFormToFunction;

        for (let inputDataType of inputDataTypes) {
          let inputHandler = inputHandlers.createInputHandler(inputDataType);
          if (!inputHandler) continue;

          let parsed = inputHandler.parse(word);
          if (!parsed) continue;

          bytes = inputHandler.convert(parsed, endianness == "Little Endian");
          formsMap = inputHandler.getFormsMap();
        }

        if (bytes) {
          let formMaxLength = 0;
          for (let form of forms) {
            if (form in formsMap) formMaxLength = Math.max(formMaxLength, form.length);
          }

          const length = bytes.length;
          let message = `Input: ${word} (${length}B)(0x${length.toString(16)})\n`;
          if (length == 20) {
            message += `Type: `;
            try {
              getAddress(word)
              message += `${" ".repeat(formMaxLength - 4)} ✓ Vaild Address \n`;
            } catch {
              message += `${" ".repeat(formMaxLength - 4)} ✗ Invaild Address \n`;
            }
          } else if (length == 32) {
            message += `Type: `;
            message += `${" ".repeat(formMaxLength - 4)} Uint256 \n`;
          }
          message += "\n";

          for (let form of forms) {
            if (!(form in formsMap)) continue;

            if (form === "decimal" && length >= 20) continue;
            if (form === "gwei" && length >= 20) continue;
            if (form === "ether" && length >= 20) continue;
            if (form === "binary" && length > 4) continue;
            const result = formsMap[form](bytes);
            if (result == "") continue;

            message += form.charAt(0).toUpperCase() + form.slice(1) + ":  ";
            message += " ".repeat(formMaxLength - form.length) + result + "\n";
          }
          message += "\n" + endianness;

          return new Hover({ language: "ethereuminspector", value: message });
        }
      },
    }
  );

  if (hover) {
    context.subscriptions.push(hover);
  }
}

export function deactivate() {}
