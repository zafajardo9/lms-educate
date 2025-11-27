declare module "reactjs-tiptap-editor" {
  import type { ComponentType } from "react";
  import type { AnyExtension } from "@tiptap/core";

  export interface RichTextEditorProps {
    content: any;
    extensions: AnyExtension[];
    output: "html" | "json" | "text";
    onChangeContent?: (val: any) => void;
    [key: string]: any;
  }

  const RichTextEditor: ComponentType<RichTextEditorProps>;
  export const BaseKit: any;
  export default RichTextEditor;
}

declare module "reactjs-tiptap-editor/extension-bundle" {
  export const BaseKit: any;
}
