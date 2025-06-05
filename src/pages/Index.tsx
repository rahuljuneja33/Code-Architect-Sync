
import { useState } from 'react';
import { FileExplorer } from '@/components/FileExplorer';
import { CodeEditor } from '@/components/CodeEditor';
import { ProjectHeader } from '@/components/ProjectHeader';
import { AuthPanel } from '@/components/AuthPanel';
import { ExportPanel } from '@/components/ExportPanel';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  parent?: string;
}

const Index = () => {
  const [projectName, setProjectName] = useState('my-project');
  const [fileTree, setFileTree] = useState<FileNode[]>([
    {
      id: '1',
      name: 'src',
      type: 'folder',
      children: [
        {
          id: '2',
          name: 'main.py',
          type: 'file',
          content: '# Welcome to your new project!\nprint("Hello, World!")',
          parent: '1'
        }
      ]
    },
    {
      id: '3',
      name: 'README.md',
      type: 'file',
      content: `# ${projectName}\n\nA new project created with File Structure Builder.`,
    }
  ]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [githubToken, setGithubToken] = useState('');
  const [huggingfaceToken, setHuggingfaceToken] = useState('');

  const updateFileContent = (fileId: string, content: string) => {
    const updateNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === fileId) {
          return { ...node, content };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };
    setFileTree(updateNode(fileTree));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <ProjectHeader 
        projectName={projectName} 
        setProjectName={setProjectName}
      />
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <FileExplorer 
            fileTree={fileTree}
            setFileTree={setFileTree}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
          />
          
          <div className="border-t border-gray-200">
            <AuthPanel 
              githubToken={githubToken}
              setGithubToken={setGithubToken}
              huggingfaceToken={huggingfaceToken}
              setHuggingfaceToken={setHuggingfaceToken}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <CodeEditor 
            selectedFile={selectedFile}
            updateFileContent={updateFileContent}
          />
          
          <ExportPanel 
            projectName={projectName}
            fileTree={fileTree}
            githubToken={githubToken}
            huggingfaceToken={huggingfaceToken}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
