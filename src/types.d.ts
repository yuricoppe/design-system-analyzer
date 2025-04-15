declare namespace Figma {
  type StyleID = string;
  type Mixed = typeof figma.mixed;
  
  interface TextNode extends SceneNode {
    type: "TEXT";
    textStyleId: StyleID | Mixed;
  }
}

declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
} 