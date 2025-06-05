
import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { FileNode } from '@/pages/Index';
import { File } from 'lucide-react';

interface CodeEditorProps {
  selectedFile: FileNode | null;
  updateFileContent: (fileId: string, content: string) => void;
}

export const CodeEditor = ({ selectedFile, updateFileContent }: CodeEditorProps) => {
  const [content, setContent] = useState('');

  useEffect(() => {
    if (selectedFile) {
      setContent(selectedFile.content || '');
    }
  }, [selectedFile]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    if (selectedFile) {
      updateFileContent(selectedFile.id, newContent);
    }
  };

  if (!selectedFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <File className="h-12 w-12 mx-auto mb-4" />
          <p>Select a file to edit</p>
        </div>
      </div>
    );
  }

  if (selectedFile.type === 'folder') {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p>Cannot edit folders</p>
          <p className="text-sm mt-1">Select a file to view its content</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <File className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900">{selectedFile.name}</span>
        </div>
      </div>
      
      <div className="flex-1 p-4">
        <Textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="w-full h-full resize-none font-mono text-sm"
          placeholder="Enter your code here..."
        />
      </div>
    </div>
  );
};
