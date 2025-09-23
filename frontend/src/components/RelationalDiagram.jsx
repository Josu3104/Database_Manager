import { MermaidDiagram } from "@lightenna/react-mermaid-diagram";

export function MyERDiagram({definition}) {
  return (
    <MermaidDiagram>
        {definition}
    </MermaidDiagram>
  
  );
}