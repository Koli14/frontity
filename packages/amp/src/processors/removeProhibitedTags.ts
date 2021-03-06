import { Processor, Element } from "@frontity/html2react/types";
import { Packages } from "../../types";

export const removeProhibitedTags: Processor<Element, Packages> = {
  name: "amp: removeProhibitedTags",
  priority: 20,
  test: ({ node }) =>
    node.component === "style" ||
    node.component === "script" ||
    node.component === "frame" ||
    node.component === "frameset" ||
    node.component === "object" ||
    node.component === "param" ||
    node.component === "applet" ||
    node.component === "embed" ||
    node.component == "base",
  processor: () => null,
};
