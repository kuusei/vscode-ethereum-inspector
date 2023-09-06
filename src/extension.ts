"use strict";

import { ExtensionContext, Hover, MarkdownString, languages } from "vscode";
import * as inputHandlers from "./utils/input-handlers";
import { getAddress } from "ethers";
import { getConfigs } from "./utils/config";
import { getExplorerLinks } from "./utils/explorer";
import { json } from "stream/consumers";

export function activate(context: ExtensionContext) {
  const hover = languages.registerHoverProvider(
    { scheme: "*", language: "*" },
    {
      provideHover(document, position, token) {
        const word = document.getText(document.getWordRangeAtPosition(position));
        const { inputDataTypes, forms, endianness, explorers } = getConfigs();

        // error handling
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
          const message = new MarkdownString();
          message.appendCodeblock(`Input: ${word} (${length}B)(0x${length.toString(16)})\n`, "ethereuminspector");

          if (length == 20) {
            try {
              getAddress(word);
              message.appendCodeblock(`Type: ${" ".repeat(formMaxLength - 4)} ✓ valid Address \n`, "ethereuminspector");
              message.appendMarkdown(`${getExplorerLinks(explorers, word)} \n\n`);
            } catch {
              message.appendCodeblock(
                `Type: ${" ".repeat(formMaxLength - 4)} ✗ Invalid Address \n`,
                "ethereuminspector"
              );
            }
          } else if (length == 32) {
            message.appendCodeblock(`Type: ${" ".repeat(formMaxLength - 4)} Uint256 \n`, "ethereuminspector");
          }

          message.appendCodeblock("\n", "ethereuminspector");

          for (let form of forms) {
            if (!(form in formsMap)) continue;

            const result = formsMap[form](bytes);
            if (result == "") continue;
            if (form === "decimal" && length >= 20) continue;
            if (form === "gwei" && length >= 20) continue;
            if (form === "ether" && length >= 20) continue;
            if (form === "binary" && length > 4) continue;

            message.appendCodeblock(
              `${form.charAt(0).toUpperCase() + form.slice(1)}: ${" ".repeat(
                formMaxLength - form.length
              )} ${result} \n`,
              "ethereuminspector"
            );
          }
          message.appendCodeblock("\n" + endianness, "ethereuminspector");

          return new Hover(message);
        }
      },
    }
  );

  if (hover) {
    context.subscriptions.push(hover);
  }
}

export function deactivate() {}
