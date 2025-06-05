
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Upload } from 'lucide-react';
import { FileNode } from '@/pages/Index';

interface StructureImporterProps {
  onImport: (structure: FileNode[]) => void;
  onClose: () => void;
}

export const StructureImporter = ({ onImport, onClose }: StructureImporterProps) => {
  const [structureText, setStructureText] = useState('');

  const parseStructure = (text: string): FileNode[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const result: FileNode[] = [];
    const stack: { node: FileNode; depth: number }[] = [];
    
    for (const line of lines) {
      // Skip the root project name line if it exists
      if (line.includes('/') && !line.startsWith(' ') && !line.startsWith('├') && !line.startsWith('└')) {
        continue;
      }
      
      // Calculate depth based on indentation and tree characters
      const cleanLine = line.replace(/[├└│─]/g, '').replace(/\s+/g, ' ');
      const depth = (line.length - cleanLine.trim().length) / 4; // Approximate depth
      
      let name = cleanLine.trim();
      if (name.endsWith('/')) {
        name = name.slice(0, -1);
      }
      
      if (!name) continue;
      
      const isFolder = line.includes('/') || name.endsWith('/');
      const fileExtension = name.includes('.') ? name.split('.').pop() : '';
      
      // Create content based on file type
      let content = '';
      if (!isFolder) {
        if (fileExtension === 'py') {
          content = `# ${name}\n# TODO: Implement functionality`;
        } else if (fileExtension === 'txt') {
          content = `# Requirements for ${name.replace('.txt', '')}\n# Add your dependencies here`;
        } else if (fileExtension === 'md') {
          content = `# ${name.replace('.md', '')}\n\nProject description goes here.`;
        } else if (fileExtension === 'json') {
          content = '{\n  "// TODO": "Add configuration"\n}';
        } else if (name === 'Dockerfile') {
          content = 'FROM python:3.9\n\n# TODO: Add Dockerfile instructions';
        } else {
          content = `# ${name}\n# TODO: Add content`;
        }
      }
      
      const newNode: FileNode = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name,
        type: isFolder ? 'folder' : 'file',
        content: isFolder ? undefined : content,
        children: isFolder ? [] : undefined
      };
      
      // Remove items from stack that are at the same or deeper level
      while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
        stack.pop();
      }
      
      if (stack.length === 0) {
        result.push(newNode);
      } else {
        const parent = stack[stack.length - 1].node;
        if (parent.children) {
          parent.children.push(newNode);
          newNode.parent = parent.id;
        }
      }
      
      if (isFolder) {
        stack.push({ node: newNode, depth });
      }
    }
    
    return result;
  };

  const handleImport = () => {
    if (!structureText.trim()) return;
    
    try {
      const parsedStructure = parseStructure(structureText);
      onImport(parsedStructure);
      onClose();
    } catch (error) {
      console.error('Error parsing structure:', error);
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Import Project Structure</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ×
        </Button>
      </div>
      
      <div className="space-y-3">
        <Textarea
          placeholder={`Paste your folder structure here, e.g.:
mcp-investment-insights/
├── app/
│   ├── main.py
│   ├── llm_handler.py
│   └── gradio_ui.py
├── models/
│   └── phi-3.gguf
├── requirements.txt
└── README.md`}
          value={structureText}
          onChange={(e) => setStructureText(e.target.value)}
          className="min-h-[150px] font-mono text-sm"
        />
        
        <div className="flex space-x-2">
          <Button onClick={handleImport} size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import Structure
          </Button>
          <Button variant="outline" onClick={onClose} size="sm">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
